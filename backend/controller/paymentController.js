const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
const globals = require('node-global-storage')
const paymentModel = require('../model/paymentModel')
const userModel = require('../model/userModel')
const authController = require('./authController')
const bkashConfig = require('../config/bkashConfig')

class PaymentController {
    /**
     * Common headers for bKash API requests
     */
    bkash_headers = () => ({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authorization: globals.get('id_token'),
        'x-app-key': bkashConfig.apiKey,
    })

    /**
     * Create bKash Payment URL
     */
    payment_create = async (req, res) => {
        const { amount, userId, firstname, lastname, email, phone, department, university, password } = req.body

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid payment amount is required',
            })
        }

        let resolvedUserId = userId || Date.now()
        let accountExisted = false
        if (email) {
            const existingUser = await userModel.findOne({ email: email.toLowerCase().trim() })
            if (existingUser) {
                resolvedUserId = existingUser._id
                accountExisted = true
            }
        }

        if (userId) {
            globals.set('userId', userId)
        }

        try {
            const invoiceNumber = 'Inv' + uuidv4().substring(0, 8).toUpperCase()

            const requestPayload = {
                mode: '0011',
                payerReference: userId ? String(userId) : 'customer',
                callbackURL: bkashConfig.callbackUrl,
                amount: String(amount),
                currency: 'BDT',
                intent: 'sale',
                merchantInvoiceNumber: invoiceNumber,
            }

            const { data } = await axios.post(
                bkashConfig.createPaymentUrl,
                requestPayload,
                { headers: this.bkash_headers() }
            )

            if (data && data.statusCode === '0000' && data.bkashURL) {
                // Pre-save pending payment and registration details
                await paymentModel.create({
                    userId: resolvedUserId,
                    paymentID: data.paymentID,
                    amount: parseInt(amount, 10),
                    currency: 'BDT',
                    gateway: 'bkash',
                    status: 'Pending',
                    accountExistedBefore: accountExisted,
                    customerEmail: email ? email.toLowerCase().trim() : undefined,
                    customerPhone: phone || undefined,
                    firstname: firstname || undefined,
                    lastname: lastname || undefined,
                    department: department || undefined,
                    university: university || undefined,
                    pendingPassword: password || undefined,
                    date: new Date().toISOString(),
                })

                return res.status(200).json({
                    success: true,
                    bkashURL: data.bkashURL,
                    paymentID: data.paymentID,
                })
            }

            return res.status(400).json({
                success: false,
                error: data?.statusMessage || 'bKash payment initiation failed',
                data,
            })
        } catch (error) {
            console.error('Payment Create Error:', error.response?.data || error.message)
            return res.status(500).json({
                success: false,
                error: error.response?.data?.statusMessage || error.message || 'Internal server error',
            })
        }
    }

    /**
     * bKash Payment Callback (Success, Cancel, Failure)
     */
    call_back = async (req, res) => {
        const { paymentID, status } = req.query
        const frontendUrl = bkashConfig.frontendUrl

        if (status === 'cancel' || status === 'failure') {
            if (paymentID) {
                await paymentModel.findOneAndUpdate(
                    { paymentID },
                    { status: status === 'cancel' ? 'Cancelled' : 'Failed', pendingPassword: null }
                )
            }
            return res.redirect(`${frontendUrl}/error?message=${encodeURIComponent(status)}`)
        }

        if (status === 'success') {
            if (!paymentID) {
                return res.redirect(`${frontendUrl}/error?message=${encodeURIComponent('Payment ID is missing')}`)
            }

            try {
                const { data } = await axios.post(
                    bkashConfig.executePaymentUrl,
                    { paymentID },
                    { headers: this.bkash_headers() }
                )

                if (data && data.statusCode === '0000') {
                    let payment = await paymentModel.findOne({ paymentID: data.paymentID || paymentID })

                    if (payment) {
                        payment.trxID = data.trxID
                        payment.status = 'Completed'
                        payment.date = data.paymentExecuteTime || new Date().toISOString()
                        payment.rawResponse = data
                        await payment.save()
                    } else {
                        const resolvedUserId =
                            Number(data.payerReference) ||
                            Number(globals.get('userId')) ||
                            Math.floor(Math.random() * 1000) + 1

                        payment = await paymentModel.create({
                            userId: resolvedUserId,
                            paymentID: data.paymentID || paymentID,
                            trxID: data.trxID,
                            date: data.paymentExecuteTime || new Date().toISOString(),
                            amount: parseInt(data.amount, 10),
                            gateway: 'bkash',
                            status: 'Completed',
                            rawResponse: data,
                        })
                    }

                    // Create user account only after successful verification
                    await authController.constructor.handlePostPaymentAccount(payment)

                    return res.redirect(
                        `${frontendUrl}/success?amount=${encodeURIComponent(data.amount)}&gateway=bkash&trxID=${encodeURIComponent(data.trxID || data.paymentID || '')}`
                    )
                } else {
                    const errorMsg = data?.statusMessage || 'Payment execution failed'
                    if (paymentID) {
                        await paymentModel.findOneAndUpdate(
                            { paymentID },
                            { status: 'Failed', pendingPassword: null }
                        )
                    }
                    return res.redirect(`${frontendUrl}/error?message=${encodeURIComponent(errorMsg)}`)
                }
            } catch (error) {
                console.error('Payment Execution Error:', error.response?.data || error.message)
                const errorMsg = error.response?.data?.statusMessage || error.message || 'Execution error'
                return res.redirect(`${frontendUrl}/error?message=${encodeURIComponent(errorMsg)}`)
            }
        }

        return res.redirect(`${frontendUrl}/error?message=${encodeURIComponent(`Unexpected status: ${status || 'unknown'}`)}`)
    }

    /**
     * Refund bKash Transaction
     */
    refund = async (req, res) => {
        const { trxID } = req.params

        if (!trxID) {
            return res.status(400).json({ success: false, error: 'Transaction ID (trxID) is required' })
        }

        try {
            const payment = await paymentModel.findOne({ trxID })

            if (!payment) {
                return res.status(404).json({ success: false, error: 'Transaction not found' })
            }

            const { data } = await axios.post(
                bkashConfig.refundUrl,
                {
                    paymentID: payment.paymentID,
                    amount: payment.amount,
                    trxID,
                    sku: 'payment',
                    reason: 'cashback',
                },
                { headers: this.bkash_headers() }
            )

            if (data && data.statusCode === '0000') {
                return res.status(200).json({
                    success: true,
                    message: 'Refund completed successfully',
                    data,
                })
            }

            return res.status(400).json({
                success: false,
                error: data?.statusMessage || 'Refund failed',
                data,
            })
        } catch (error) {
            console.error('Payment Refund Error:', error.response?.data || error.message)
            return res.status(500).json({
                success: false,
                error: error.response?.data?.statusMessage || error.message || 'Refund processing error',
            })
        }
    }
}

module.exports = new PaymentController()