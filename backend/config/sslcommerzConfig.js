const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const sslcommerzConfig = {
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
    isLive: process.env.SSLCOMMERZ_LIVE_MODE === 'true',
    successUrl: process.env.SSLCOMMERZ_SUCCESS_URL || '',
    failUrl: process.env.SSLCOMMERZ_FAIL_URL || '',
    cancelUrl: process.env.SSLCOMMERZ_CANCEL_URL || '',
    ipnUrl: process.env.SSLCOMMERZ_IPN_URL || '',
    frontendUrl: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '',
};

module.exports = sslcommerzConfig;
