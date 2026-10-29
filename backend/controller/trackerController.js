const Payment = require('../model/paymentModel')

/**
 * Helper to build safe ownership conditions for regular users without CastErrors.
 */
function getUserOwnershipFilter(user) {
  if (user.role === 'admin') return {}
  const conditions = []
  if (user.email && user.email.trim()) {
    conditions.push({ customerEmail: { $regex: new RegExp(`^${user.email.trim()}$`, 'i') } })
  }
  if (user.uid) {
    conditions.push({ userId: user.uid })
    const numUid = Number(user.uid)
    if (!isNaN(numUid)) {
      conditions.push({ userId: numUid })
    }
  }
  return conditions.length > 0 ? { $or: conditions } : { customerEmail: '__NO_MATCH__' }
}

/**
 * Get Tracker History with role-based ownership, filtering, search, and pagination.
 */
exports.getTrackerHistory = async (req, res) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const {
      search = '',
      gateway = 'all',
      status = 'all',
      currency = 'all',
      page = 1,
      limit = 10
    } = req.query

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10))
    const skip = (pageNum - 1) * limitNum

    // Build query filter
    const query = {}

    // Enforce strict ownership for regular users
    const ownershipFilter = getUserOwnershipFilter(user)
    if (ownershipFilter.$or) {
      query.$or = ownershipFilter.$or
    }

    // Filter by Gateway
    if (gateway && gateway !== 'all') {
      query.gateway = gateway.toLowerCase()
    }

    // Filter by Status
    if (status && status !== 'all') {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') }
    }

    // Filter by Currency
    if (currency && currency !== 'all') {
      query.currency = currency.toUpperCase()
    }

    // Keyword Search (trxID, paymentID, orderId, phone)
    if (search && search.trim()) {
      const s = search.trim()
      const searchConditions = [
        { trxID: { $regex: s, $options: 'i' } },
        { paymentID: { $regex: s, $options: 'i' } },
        { orderId: { $regex: s, $options: 'i' } },
        { customerPhone: { $regex: s, $options: 'i' } }
      ]

      if (user.role === 'admin') {
        searchConditions.push({ customerEmail: { $regex: s, $options: 'i' } })
      }

      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ]
        delete query.$or
      } else {
        query.$or = searchConditions
      }
    }

    const [totalRecords, records] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ])

    // Calculate summary statistics for the user's accessible records
    const statsQuery = getUserOwnershipFilter(user)
    const allUserPayments = await Payment.find(statsQuery).select('amount currency status').lean()
    
    let totalVolumeBDT = 0
    let totalVolumeUSD = 0
    let completedCount = 0

    allUserPayments.forEach((p) => {
      if (p.status === 'Completed') {
        completedCount++
        if (p.currency === 'USD') {
          totalVolumeUSD += (p.amount || 0)
        } else {
          totalVolumeBDT += (p.amount || 0)
        }
      }
    })

    return res.status(200).json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      },
      stats: {
        totalTransactions: allUserPayments.length,
        completedTransactions: completedCount,
        totalVolumeBDT,
        totalVolumeUSD
      },
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum
      },
      transactions: records
    })
  } catch (error) {
    console.error('getTrackerHistory error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve tracker transaction records'
    })
  }
}

/**
 * Get individual transaction details with ownership protection.
 */
exports.getTrackerDetail = async (req, res) => {
  try {
    const user = req.user
    const { id } = req.params

    const payment = await Payment.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { trxID: id },
        { paymentID: id }
      ]
    }).lean()

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Transaction record not found' })
    }

    if (user.role !== 'admin') {
      const emailMatches = payment.customerEmail && payment.customerEmail.toLowerCase() === user.email.toLowerCase()
      const uidMatches = payment.userId && String(payment.userId) === String(user.uid)

      if (!emailMatches && !uidMatches) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not have permission to view this transaction record.'
        })
      }
    }

    return res.status(200).json({
      success: true,
      transaction: payment
    })
  } catch (error) {
    console.error('getTrackerDetail error:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch transaction details' })
  }
}
