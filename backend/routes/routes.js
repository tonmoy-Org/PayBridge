const router = require('express').Router()
const paymentController = require('../controller/paymentController')
const sslcommerzController = require('../controller/sslcommerzController')
const stripeController = require('../controller/stripeController')
const trackerController = require('../controller/trackerController')
const authController = require('../controller/authController')
const middleware = require('../middleware/middleware')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

// Authentication & User Routes
router.get('/auth/check-user', authController.checkUser)
router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/payment/credentials/:trxID', authController.getCredentials)

// bKash Routes
router.post('/bkash/payment/create', middleware.bkash_auth, paymentController.payment_create)
router.get('/bkash/payment/callback', middleware.bkash_auth, paymentController.call_back)
router.get('/bkash/payment/refund/:trxID', middleware.bkash_auth, paymentController.refund)

// SSLCommerz Routes
router.post('/sslcommerz/payment/init', sslcommerzController.initPayment)
router.all('/sslcommerz/payment/success', sslcommerzController.paymentSuccess)
router.all('/sslcommerz/payment/fail', sslcommerzController.paymentFail)
router.all('/sslcommerz/payment/cancel', sslcommerzController.paymentCancel)
router.all('/sslcommerz/payment/ipn', sslcommerzController.paymentIpn)

// Stripe Routes
router.post('/stripe/payment/create', stripeController.createCheckoutSession)
router.post('/stripe/payment/create-checkout-session', stripeController.createCheckoutSession)
router.get('/stripe/payment/success', stripeController.paymentSuccess)
router.get('/stripe/payment/cancel', stripeController.paymentCancel)

// Tracker History Routes
router.get('/tracker/history', requireAuth, trackerController.getTrackerHistory)
router.get('/tracker/:id', requireAuth, trackerController.getTrackerDetail)

module.exports = router
