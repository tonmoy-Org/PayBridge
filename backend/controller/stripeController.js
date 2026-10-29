const Stripe = require('stripe')
const paymentModel = require('../model/paymentModel')
const userModel = require('../model/userModel')
const authController = require('./authController')
const stripeConfig = require('../config/stripeConfig')

class StripeController {
    /**
     * Helper to get Stripe instance
     */
    getStripeInstance = () => {
        return new Stripe(stripeConfig.secretKey)
    }

    /**
     * Create Stripe Checkout Session
     */
    createCheckoutSession = async (req, res) => {
        const { amount, currency: rawCurrency, userId, firstname, lastname, email, phone, department, university, password } = req.body
        const currency = (rawCurrency && rawCurrency.toLowerCase() === 'bdt') ? 'bdt' : 'usd'
        const currencyUpper = currency.toUpperCase()
        const minAmount = currency === 'usd' ? 1 : 10
        const numAmount = Number(amount)

        if (!numAmount || isNaN(numAmount) || numAmount < minAmount) {
            return res.status(400).json({
                success: false,
                error: `Payment amount must be at least ${minAmount} ${currencyUpper}`,
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

        try {
            const stripe = this.getStripeInstance()
            const customerName = [firstname, lastname].filter(Boolean).join(' ') || 'Customer'

            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency,
                            product_data: {
                                name: 'PayBridge Event / Service Registration',
                                description: `Registration payment for ${customerName}`,
                            },
                            unit_amount: Math.round(numAmount * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                customer_email: email || undefined,
                client_reference_id: String(resolvedUserId),
                metadata: {
                    userId: String(resolvedUserId),
                    firstname: firstname || '',
                    lastname: lastname || '',
                    phone: phone || '',
                    email: email || '',
                    amount: String(numAmount),
                    currency: currencyUpper,
                },
                success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: stripeConfig.cancelUrl,
            })

            // Pre-save pending payment in MongoDB
            await paymentModel.create({
                userId: resolvedUserId,
                paymentID: session.id,
                amount: numAmount,
                currency: currencyUpper,
                gateway: 'stripe',
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
                url: session.url,
                sessionId: session.id,
            })
        } catch (error) {
            console.error('Stripe Checkout Create Error:', error.message)
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to create Stripe checkout session',
            })
        }
    }

    /**
     * Stripe Payment Success Callback (GET)
     */
    paymentSuccess = async (req, res) => {
        const { session_id } = req.query
        const frontendUrl = stripeConfig.frontendUrl

        if (!session_id) {
            return res.redirect(
                `${frontendUrl}/error?message=${encodeURIComponent('Session ID missing from Stripe callback')}`
            )
        }

        try {
            const stripe = this.getStripeInstance()
            const session = await stripe.checkout.sessions.retrieve(session_id)

            if (session && session.payment_status === 'paid') {
                const paidAmount = session.amount_total ? session.amount_total / 100 : Number(session.metadata?.amount || 0)
                const trxId = session.payment_intent || session.id
                const sessionCurrency = (session.currency || session.metadata?.currency || 'USD').toUpperCase()

                const payment = await paymentModel.findOneAndUpdate(
                    { paymentID: session.id },
                    {
                        status: 'Completed',
                        trxID: trxId,
                        amount: paidAmount,
                        currency: sessionCurrency,
                        rawResponse: session,
                        date: new Date().toISOString(),
                    },
                    { upsert: true, new: true }
                )

                // Create user account only after successful verification
                await authController.constructor.handlePostPaymentAccount(payment)

                return res.redirect(`${frontendUrl}/success?amount=${paidAmount}&currency=${encodeURIComponent(sessionCurrency)}&gateway=stripe&trxID=${encodeURIComponent(trxId)}`)
            }

            return res.redirect(
                `${frontendUrl}/error?message=${encodeURIComponent('Stripe payment was not verified as paid')}`
            )
        } catch (error) {
            console.error('Stripe Success Callback Error:', error.message)
            return res.redirect(
                `${frontendUrl}/error?message=${encodeURIComponent(error.message || 'Stripe verification error')}`
            )
        }
    }

    /**
     * Stripe Payment Cancel Callback (GET)
     */
    paymentCancel = async (req, res) => {
        const frontendUrl = stripeConfig.frontendUrl
        return res.redirect(
            `${frontendUrl}/error?message=${encodeURIComponent('Payment was cancelled on Stripe')}`
        )
    }
}

module.exports = new StripeController()
