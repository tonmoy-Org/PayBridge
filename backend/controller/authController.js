const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../model/userModel')
const paymentModel = require('../model/paymentModel')

const JWT_SECRET = process.env.JWT_SECRET || 'paybridge-secure-jwt-secret-2026'

class AuthController {
  /**
   * Check if a user account already exists by email or phone
   */
  checkUser = async (req, res) => {
    try {
      const { email, phone } = req.query
      if (!email && !phone) {
        return res.status(400).json({ success: false, error: 'Email or phone query parameter is required' })
      }

      const query = []
      if (email) query.push({ email: email.toLowerCase().trim() })
      if (phone) query.push({ phone: phone.trim() })

      const existingUser = await User.findOne({ $or: query })

      if (existingUser) {
        return res.status(200).json({
          success: true,
          exists: true,
          message: 'You already have an account. Please log in instead.',
          user: {
            email: existingUser.email,
            firstname: existingUser.firstname,
            lastname: existingUser.lastname,
          },
        })
      }

      return res.status(200).json({
        success: true,
        exists: false,
      })
    } catch (error) {
      console.error('Check user error:', error.message)
      return res.status(500).json({ success: false, error: 'Failed to check account existence' })
    }
  }

  /**
   * User direct registration endpoint (for email/password registration)
   */
  register = async (req, res) => {
    try {
      const { email, password, firstname, lastname, phone } = req.body

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        })
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
        })
      }

      const cleanEmail = email.toLowerCase().trim()
      const existingUser = await User.findOne({ email: cleanEmail })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          accountExists: true,
          error: 'You already have an account. Please log in instead.',
        })
      }

      const newUser = new User({
        email: cleanEmail,
        password: password,
        firstname: (firstname || cleanEmail.split('@')[0]).trim(),
        lastname: (lastname || '').trim() || 'User',
        phone: (phone || '').trim(),
        role: 'user',
      })

      await newUser.save()

      const token = jwt.sign(
        {
          uid: String(newUser._id),
          email: newUser.email,
          role: newUser.role,
          name: `${newUser.firstname} ${newUser.lastname}`.trim(),
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.status(201).json({
        success: true,
        token,
        user: {
          uid: String(newUser._id),
          email: newUser.email,
          displayName: `${newUser.firstname} ${newUser.lastname}`.trim(),
          phone: newUser.phone || '',
          role: newUser.role,
        },
      })
    } catch (error) {
      console.error('Register error:', error.message)
      return res.status(500).json({
        success: false,
        error: error.message || 'Registration failed. Please try again.',
      })
    }
  }

  /**
   * User login endpoint for database users
   */
  login = async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        })
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() })
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        })
      }

      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        })
      }

      const token = jwt.sign(
        {
          uid: String(user._id),
          email: user.email,
          role: user.role,
          name: `${user.firstname} ${user.lastname}`,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.status(200).json({
        success: true,
        token,
        user: {
          uid: String(user._id),
          email: user.email,
          displayName: `${user.firstname} ${user.lastname}`,
          phone: user.phone || '',
          department: user.department || '',
          university: user.university || '',
          role: user.role,
        },
      })
    } catch (error) {
      console.error('Login error:', error.message)
      return res.status(500).json({
        success: false,
        error: 'Authentication failed. Please try again.',
      })
    }
  }

  /**
   * Retrieve temporary account credentials on payment success page
   */
  getCredentials = async (req, res) => {
    try {
      const { trxID } = req.params
      if (!trxID) {
        return res.status(400).json({ success: false, error: 'Transaction ID is required' })
      }

      const payment = await paymentModel.findOne({
        $or: [{ trxID: trxID }, { paymentID: trxID }, { val_id: trxID }],
      })

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment record not found',
        })
      }

      if (payment.accountExistedBefore) {
        return res.status(200).json({
          success: true,
          accountExists: true,
          message: 'You already have an account. Please log in instead.',
          email: payment.customerEmail,
        })
      }

      if (payment.tempCredential && payment.tempCredential.email && payment.tempCredential.password) {
        return res.status(200).json({
          success: true,
          accountCreated: true,
          credentials: {
            email: payment.tempCredential.email,
            password: payment.tempCredential.password,
            firstname: payment.firstname,
            lastname: payment.lastname,
          },
        })
      }

      return res.status(200).json({
        success: true,
        accountCreated: false,
        message: 'No newly generated credentials for this transaction.',
      })
    } catch (error) {
      console.error('Get credentials error:', error.message)
      return res.status(500).json({ success: false, error: 'Failed to retrieve credentials' })
    }
  }

  /**
   * Utility helper to finalize user account creation upon verified payment
   */
  static async handlePostPaymentAccount(payment) {
    if (!payment || !payment.customerEmail) return null

    try {
      const email = payment.customerEmail.toLowerCase().trim()
      const existingUser = await User.findOne({ email })

      if (existingUser) {
        payment.accountExistedBefore = true
        payment.accountCreated = false
        payment.userId = existingUser._id
        if (!existingUser.payments.includes(payment._id)) {
          existingUser.payments.push(payment._id)
          await existingUser.save()
        }
        await payment.save()
        return { accountCreated: false, accountExists: true, user: existingUser }
      }

      // Generate a clean secure password if none was provided
      const plainPassword =
        payment.pendingPassword && payment.pendingPassword.trim().length >= 6
          ? payment.pendingPassword.trim()
          : `PB#${crypto.randomBytes(3).toString('hex').toUpperCase()}!${Math.floor(10 + Math.random() * 90)}`

      const newUser = new User({
        email: email,
        password: plainPassword,
        firstname: payment.firstname || 'PayBridge',
        lastname: payment.lastname || 'User',
        phone: payment.customerPhone || '',
        department: payment.department || '',
        university: payment.university || '',
        role: 'user',
        payments: [payment._id],
      })

      await newUser.save()

      payment.accountCreated = true
      payment.accountExistedBefore = false
      payment.userId = newUser._id
      payment.tempCredential = {
        email: newUser.email,
        password: plainPassword,
        claimed: false,
      }
      payment.pendingPassword = undefined // Clean up plaintext storage

      await payment.save()

      return { accountCreated: true, accountExists: false, user: newUser, plainPassword }
    } catch (err) {
      console.error('Error handling post payment account creation:', err)
      return null
    }
  }
}

module.exports = new AuthController()
