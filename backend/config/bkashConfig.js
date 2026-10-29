const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const bkashConfig = {
    // Application URLs
    backendUrl: process.env.BACKEND_URL || '',
    frontendUrl: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '',
    callbackUrl: process.env.BKASH_CALLBACK_URL || '',

    // bKash Credentials
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    apiKey: process.env.BKASH_API_KEY,
    secretKey: process.env.BKASH_SECRET_KEY,

    // bKash API Endpoints
    grantTokenUrl: process.env.BKASH_GRANT_TOKEN_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant',
    createPaymentUrl: process.env.BKASH_CREATE_PAYMENT_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create',
    executePaymentUrl: process.env.BKASH_EXECUTE_PAYMENT_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute',
    refundUrl: process.env.BKASH_REFUND_TRANSACTION_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/payment/refund',
};

module.exports = bkashConfig;
