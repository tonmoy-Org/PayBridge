const axios = require('axios')
const shurjopayConfig = require('../config/shurjopayConfig')

class ShurjopayService {
    constructor() {
        this.endpoint = shurjopayConfig.endpoint
        this.username = shurjopayConfig.username
        this.password = shurjopayConfig.password
        this.prefix = shurjopayConfig.prefix

        this.token = null
        this.tokenExpiry = null
        this.executeUrl = null
        this.storeId = null
    }

    /**
     * Authenticates with shurjoPay and caches token until expiration
     */
    async getToken() {
        const now = Date.now()
        if (this.token && this.tokenExpiry && now < this.tokenExpiry - 60000) {
            return {
                token: this.token,
                executeUrl: this.executeUrl,
                storeId: this.storeId,
            }
        }

        try {
            console.log(`[shurjoPay] Authenticating with ${this.endpoint}/get_token ...`)
            const response = await axios.post(
                `${this.endpoint}/get_token`,
                {
                    username: this.username,
                    password: this.password,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                }
            )

            const data = response.data
            if (!data || !data.token) {
                throw new Error(data?.message || 'Failed to authenticate with shurjoPay')
            }

            this.token = data.token
            this.tokenExpiry = now + (Number(data.expires_in) || 900) * 1000
            this.executeUrl = data.execute_url || `${this.endpoint}/secret-pay`
            this.storeId = data.store_id || 1

            console.log(`[shurjoPay] Authenticated successfully. Store ID: ${this.storeId}`)
            return {
                token: this.token,
                executeUrl: this.executeUrl,
                storeId: this.storeId,
            }
        } catch (error) {
            console.error('[shurjoPay] Authentication error:', error.response?.data || error.message)
            throw new Error(error.response?.data?.message || error.message || 'Authentication error')
        }
    }

    /**
     * Initiates payment transaction and receives checkout_url from shurjoPay
     */
    async makePayment(payload) {
        const auth = await this.getToken()

        const requestBody = {
            prefix: this.prefix,
            token: auth.token,
            return_url: payload.return_url,
            cancel_url: payload.cancel_url,
            store_id: auth.storeId,
            amount: payload.amount,
            order_id: payload.order_id,
            currency: payload.currency || 'BDT',
            customer_name: payload.customer_name,
            customer_address: payload.customer_address || 'Dhaka',
            customer_email: payload.customer_email || 'customer@example.com',
            customer_phone: payload.customer_phone,
            customer_city: payload.customer_city || 'Dhaka',
            customer_post_code: payload.customer_post_code || '1200',
            client_ip: payload.client_ip || '127.0.0.1',
        }

        try {
            console.log(`[shurjoPay] Initiating payment for order ${payload.order_id} (Amount: ${payload.amount} ${requestBody.currency})...`)
            const response = await axios.post(auth.executeUrl, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`,
                },
            })

            const data = response.data
            console.log('[shurjoPay] Initiate payment response:', data)

            if (!data || !data.checkout_url) {
                const validationMsg = data && typeof data === 'object'
                    ? Object.values(data).filter((v) => typeof v === 'string').join(', ')
                    : null
                throw new Error(validationMsg || data?.message || 'shurjoPay did not return a valid checkout URL')
            }

            return data
        } catch (error) {
            console.error('[shurjoPay] Initiate payment error:', error.response?.data || error.message)
            const serverErr = error.response?.data && typeof error.response.data === 'object'
                ? (error.response.data.message || Object.values(error.response.data).join(', '))
                : null
            throw new Error(serverErr || error.message || 'Initiate payment error')
        }
    }

    /**
     * Verifies payment status with shurjoPay
     */
    async verifyPayment(spOrderId) {
        const auth = await this.getToken()

        try {
            console.log(`[shurjoPay] Verifying order ${spOrderId}...`)
            const response = await axios.post(
                `${this.endpoint}/verification`,
                { order_id: spOrderId },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.token}`,
                    },
                }
            )

            const data = response.data
            console.log('[shurjoPay] Verification response:', data)

            if (Array.isArray(data) && data.length > 0) {
                return data[0]
            }

            return data
        } catch (error) {
            console.error('[shurjoPay] Verification error:', error.response?.data || error.message)
            throw new Error(error.response?.data?.message || error.message || 'Payment verification error')
        }
    }
}

module.exports = new ShurjopayService()
