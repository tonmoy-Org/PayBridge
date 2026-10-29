const axios = require('axios')
const globals = require('node-global-storage')
const bkashConfig = require('../config/bkashConfig')

class Middleware {
    /**
     * Middleware to authenticate with bKash and fetch the id_token
     */
    bkash_auth = async (req, res, next) => {
        globals.unset('id_token')

        try {
            const { data } = await axios.post(
                bkashConfig.grantTokenUrl,
                {
                    app_key: bkashConfig.apiKey,
                    app_secret: bkashConfig.secretKey,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        username: bkashConfig.username,
                        password: bkashConfig.password,
                    },
                }
            )

            if (!data || !data.id_token) {
                return res.status(401).json({
                    success: false,
                    message: data?.statusMessage || 'bKash authorization token generation failed',
                })
            }

            globals.set('id_token', data.id_token, { protected: true })
            next()
        } catch (error) {
            console.error('bKash Authentication Error:', error.response?.data || error.message)
            return res.status(401).json({
                success: false,
                message: 'Failed to authenticate with bKash API',
                error: error.response?.data?.statusMessage || error.message,
            })
        }
    }
}

module.exports = new Middleware()