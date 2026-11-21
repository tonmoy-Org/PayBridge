const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config()

const shurjopayConfig = {
    // API Credentials and Endpoints
    endpoint: process.env.SP_ENDPOINT || 'https://sandbox.shurjopayment.com/api',
    username: process.env.SP_USERNAME || 'sp_sandbox',
    password: process.env.SP_PASSWORD || 'pyyk97hu&6u6',
    prefix: process.env.SP_PREFIX || 'NOK',

    // Callback & Redirect URLs
    returnUrl: process.env.SP_RETURN_URL || '',
    cancelUrl: process.env.SP_CANCEL_URL || '',
    frontendUrl: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '',
}

module.exports = shurjopayConfig
