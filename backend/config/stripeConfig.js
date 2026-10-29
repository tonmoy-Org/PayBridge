const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const stripeConfig = {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    successUrl: process.env.STRIPE_SUCCESS_URL || '',
    cancelUrl: process.env.STRIPE_CANCEL_URL || '',
    frontendUrl: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '',
};

module.exports = stripeConfig;
