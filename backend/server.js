const path = require('path')
const dns = require('dns')
const dotEnv = require('dotenv')
dotEnv.config({ path: path.join(__dirname, '.env') })
dotEnv.config()

// Ensure DNS resolution works reliably for MongoDB Atlas SRV records on Windows/local environments (not inside Vercel serverless)
if (!process.env.VERCEL) {
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1'])
    } catch (dnsErr) {
        // ignore if environment restricts custom DNS
    }
}

const express = require('express')
const mongoose = require('mongoose')
const body_parser = require('body-parser')
const cors = require('cors')

const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:3000'].filter(Boolean)

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) || process.env.VERCEL) {
            return callback(null, true);
        }
        return callback(null, true); // Allow during testing to avoid broken flow
    },
    credentials: true
}))
app.use(body_parser.json())
app.use(body_parser.urlencoded({ extended: true }))

// Cache MongoDB connection across serverless function invocations
let isConnected = false
const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return
    }
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.DB_URL
        if (!mongoUri) return
        await mongoose.connect(mongoUri)
        isConnected = true
        console.log('MongoDB connected successfully')
    } catch (error) {
        console.error('MongoDB connection error:', error.message)
    }
}
connectDB()

// Ensure DB connection is established for every serverless request
app.use(async (req, res, next) => {
    await connectDB()
    next()
})

app.use('/api', require('./routes/routes'))

app.get('/', (req, res) => res.send('server is running'))

if (!process.env.VERCEL) {
    const port = process.env.PORT || 5000
    app.listen(port, () => console.log(`Server listening on port ${port}!`))
}

module.exports = app

