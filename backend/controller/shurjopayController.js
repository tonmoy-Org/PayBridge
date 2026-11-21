const paymentModel = require('../model/paymentModel')
const userModel = require('../model/userModel')
const authController = require('./authController')
const shurjopayConfig = require('../config/shurjopayConfig')
const shurjopayService = require('../services/shurjopayService')

const resolveFrontendUrl = (req, configUrl) => {
    if (configUrl && !configUrl.includes('localhost')) {
        return configUrl.replace(/\/$/, '')
    }
    const host = req.get('host')
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'
    return `${protocol}://${host}`
}

class ShurjopayController {
    /**
     * Initiate shurjoPay payment session
     * POST /api/shurjopay/payment/initiate
     */
    initiatePayment = async (req, res) => {
        const {
            amount,
            userId,
            firstname,
            lastname,
            email,
            phone,
            department,
            university,
            password,
            city,
            address,
            post_code,
        } = req.body

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid payment amount is required',
            })
        }

        let resolvedUserId = Number(userId) || Math.floor(Math.random() * 1000) + 1
        let accountExisted = false
        if (email) {
            const existingUser = await userModel.findOne({ email: email.toLowerCase().trim() })
            if (existingUser) {
                resolvedUserId = existingUser._id
                accountExisted = true
            }
        }

        // Generate unique order ID
        const prefix = shurjopayConfig.prefix || 'NOK'
        const uniqueSuffix = Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        const orderId = `${prefix}${uniqueSuffix}`

        const customerName = [firstname, lastname].filter(Boolean).join(' ') || 'Customer'
        const customerEmail = email || 'customer@example.com'
        const customerPhone = phone || '01700000000'
        const customerCity = city || 'Dhaka'
        const customerAddress = address || 'Dhaka, Bangladesh'
        const customerPostCode = post_code || '1200'

        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '127.0.0.1'

        const host = req.get('host')
        const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'
        const baseUrl = `${protocol}://${host}`

        const returnUrl = (shurjopayConfig.returnUrl && !shurjopayConfig.returnUrl.includes('localhost'))
            ? shurjopayConfig.returnUrl
            : `${baseUrl}/api/shurjopay/payment/callback`

        const cancelUrl = (shurjopayConfig.cancelUrl && !shurjopayConfig.cancelUrl.includes('localhost'))
            ? shurjopayConfig.cancelUrl
            : `${baseUrl}/api/shurjopay/payment/cancel?order_id=${orderId}`

        try {
            const spResult = await shurjopayService.makePayment({
                amount: Number(amount),
                order_id: orderId,
                currency: 'BDT',
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                customer_city: customerCity,
                customer_address: customerAddress,
                customer_post_code: customerPostCode,
                client_ip: clientIp === '::1' ? '127.0.0.1' : clientIp,
                return_url: returnUrl,
                cancel_url: cancelUrl,
            })

            // Pre-save pending payment in database
            await paymentModel.create({
                userId: resolvedUserId,
                amount: Number(amount),
                currency: 'BDT',
                gateway: 'shurjopay',
                status: 'Pending',
                orderId: orderId,
                sp_order_id: spResult.sp_order_id || '',
                customerEmail: email ? email.toLowerCase().trim() : undefined,
                customerPhone: phone || undefined,
                firstname: firstname || undefined,
                lastname: lastname || undefined,
                department: department || undefined,
                university: university || undefined,
                pendingPassword: password || undefined,
                accountExistedBefore: accountExisted,
                date: new Date().toISOString(),
                rawResponse: spResult,
            })

            return res.status(200).json({
                success: true,
                checkout_url: spResult.checkout_url,
                order_id: orderId,
                sp_order_id: spResult.sp_order_id,
                amount: Number(amount),
                currency: 'BDT',
            })
        } catch (error) {
            console.error('[shurjoPay] Init Error:', error.message)
            return res.status(500).json({
                success: false,
                error: error.message || 'shurjoPay payment initialization failed',
            })
        }
    }

    /**
     * Handle shurjoPay Callback
     * GET /api/shurjopay/payment/callback?order_id=NOK...
     */
    handleCallback = async (req, res) => {
        const order_id = req.query?.order_id || req.body?.order_id
        const frontendUrl = resolveFrontendUrl(req, shurjopayConfig.frontendUrl)

        console.log(`[shurjoPay Callback] Received callback with order_id: ${order_id}`)

        if (!order_id) {
            return res.redirect(`${frontendUrl}/error?message=${encodeURIComponent('Missing order_id')}&gateway=shurjopay`)
        }

        try {
            const verifyData = await shurjopayService.verifyPayment(order_id)
            const spCode = String(verifyData.sp_code || '')
            const isSuccess = spCode === '1000'
            const status = isSuccess ? 'Completed' : 'Failed'

            const finalAmount = Number(verifyData.recived_amount || verifyData.amount || 0)
            const bankTrxId = verifyData.bank_trx_id || ''
            const spOrderId = verifyData.order_id || order_id
            const finalTrxId = bankTrxId || spOrderId || order_id

            let payment = await paymentModel.findOne({
                $or: [{ orderId: order_id }, { sp_order_id: order_id }, { trxID: order_id }]
            })

            if (payment) {
                payment.status = status
                payment.trxID = finalTrxId
                payment.paymentID = spOrderId
                payment.sp_order_id = spOrderId
                payment.bank_trx_id = bankTrxId
                payment.val_id = spCode
                if (finalAmount > 0) payment.amount = finalAmount
                payment.rawResponse = verifyData
                payment.date = verifyData.date_time || new Date().toISOString()
                if (!isSuccess) payment.pendingPassword = null
                await payment.save()
            } else {
                payment = await paymentModel.create({
                    userId: Math.floor(Math.random() * 1000) + 1,
                    orderId: order_id,
                    sp_order_id: spOrderId,
                    trxID: finalTrxId,
                    paymentID: spOrderId,
                    bank_trx_id: bankTrxId,
                    val_id: spCode,
                    amount: finalAmount,
                    currency: 'BDT',
                    gateway: 'shurjopay',
                    status: status,
                    rawResponse: verifyData,
                    date: verifyData.date_time || new Date().toISOString(),
                })
            }

            if (isSuccess) {
                // Post-payment account creation/link
                await authController.constructor.handlePostPaymentAccount(payment)

                return res.redirect(
                    `${frontendUrl}/success?amount=${encodeURIComponent(payment.amount)}&currency=BDT&gateway=shurjopay&trxID=${encodeURIComponent(finalTrxId)}`
                )
            } else {
                const failMsg = verifyData.sp_massage || verifyData.sp_message || 'Payment verification failed'
                return res.redirect(
                    `${frontendUrl}/error?message=${encodeURIComponent(failMsg)}&gateway=shurjopay`
                )
            }
        } catch (error) {
            console.error('[shurjoPay Callback Error]:', error)
            return res.redirect(
                `${frontendUrl}/error?message=${encodeURIComponent(error.message || 'Payment verification error')}&gateway=shurjopay`
            )
        }
    }

    /**
     * Handle payment cancel
     * GET/POST /api/shurjopay/payment/cancel
     */
    paymentCancel = async (req, res) => {
        const order_id = req.query?.order_id || req.body?.order_id
        const frontendUrl = resolveFrontendUrl(req, shurjopayConfig.frontendUrl)

        if (order_id) {
            try {
                await paymentModel.findOneAndUpdate(
                    { $or: [{ orderId: order_id }, { sp_order_id: order_id }] },
                    { status: 'Cancelled', pendingPassword: null }
                )
            } catch (err) {
                console.error('[shurjoPay Cancel Error]:', err.message)
            }
        }

        return res.redirect(
            `${frontendUrl}/error?message=${encodeURIComponent('Payment was cancelled on shurjoPay')}&gateway=shurjopay`
        )
    }

    /**
     * Verify payment status endpoint
     * GET /api/shurjopay/payment/verify/:order_id
     */
    verifyPaymentStatus = async (req, res) => {
        const { order_id } = req.params

        if (!order_id) {
            return res.status(400).json({ success: false, error: 'order_id is required' })
        }

        try {
            const verifyData = await shurjopayService.verifyPayment(order_id)
            return res.status(200).json({
                success: true,
                data: verifyData,
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Verification error',
            })
        }
    }
}

module.exports = new ShurjopayController()
