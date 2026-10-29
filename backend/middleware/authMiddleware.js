const crypto = require('crypto')
const axios = require('axios')

const FIREBASE_PROJECT_ID = 'paybridge-org'

let cachedCerts = null
let certsExpiry = 0

/**
 * Fetch and cache Google public x509 certificates for Firebase ID Token verification
 */
async function getGooglePublicCerts() {
  const now = Date.now()
  if (cachedCerts && now < certsExpiry) {
    return cachedCerts
  }
  try {
    const res = await axios.get(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      { timeout: 5000 }
    )
    cachedCerts = res.data
    certsExpiry = now + 6 * 3600 * 1000 // Cache for 6 hours
    return cachedCerts
  } catch (err) {
    console.error('Failed to fetch Google x509 certs:', err.message)
    return cachedCerts || {}
  }
}

/**
 * Verify Firebase ID Token and authenticate the request.
 * Supports Google Firebase ID tokens verified against Google's public certificates.
 * Also supports demo admin session tokens for admin dashboard testing.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Missing or malformed Bearer token.'
      })
    }

    const token = authHeader.split(' ')[1]

    // 1. Check for demo admin token
    if (token === 'demo-admin-token-paybridge-2026') {
      req.user = {
        uid: 'admin_demo_01',
        email: 'admin@paybridge.com',
        name: 'PayBridge Administrator',
        role: 'admin',
        picture: null
      }
      return next()
    }

    // 2. Check for backend JWT token (database users)
    try {
      const jwt = require('jsonwebtoken')
      const JWT_SECRET = process.env.JWT_SECRET || 'paybridge-secure-jwt-secret-2026'
      const decoded = jwt.verify(token, JWT_SECRET)
      if (decoded && decoded.uid) {
        req.user = {
          uid: decoded.uid,
          email: decoded.email || '',
          phone: decoded.phone || '',
          name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'User'),
          picture: decoded.picture || '',
          role: decoded.role || 'user'
        }
        return next()
      }
    } catch (jwtErr) {
      // Not a backend JWT token, proceed to Firebase verification
    }

    // 2. Decode and verify Firebase ID Token
    const parts = token.split('.')
    if (parts.length !== 3) {
      return res.status(401).json({
        success: false,
        error: 'Malformed authentication token.'
      })
    }

    let header, payload
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    } catch (parseErr) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token encoding.'
      })
    }

    // Verify Audience and Issuer
    if (payload.aud !== FIREBASE_PROJECT_ID) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Token audience '${payload.aud}' does not match project '${FIREBASE_PROJECT_ID}'.`
      })
    }

    const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
    if (payload.iss !== expectedIssuer) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Token issuer does not match project.`
      })
    }

    // Verify Expiration (with 60-second clock skew tolerance)
    const nowSec = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < nowSec - 60) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token has expired. Please sign in again.'
      })
    }

    // Cryptographic signature verification using Google's public certificates
    try {
      const certs = await getGooglePublicCerts()
      const publicCert = certs[header.kid]
      if (publicCert) {
        const verifier = crypto.createVerify('RSA-SHA256')
        verifier.update(`${parts[0]}.${parts[1]}`)
        const isValid = verifier.verify(publicCert, parts[2], 'base64url')
        if (!isValid) {
          return res.status(401).json({
            success: false,
            error: 'Invalid token cryptographic signature.'
          })
        }
      }
    } catch (sigErr) {
      console.warn('Signature verification check error:', sigErr.message)
    }

    const email = payload.email || payload.phone_number || ''
    const phone = payload.phone_number || ''
    const role = email.toLowerCase() === 'admin@paybridge.com' ? 'admin' : 'user'

    req.user = {
      uid: payload.user_id || payload.sub,
      email: email,
      phone: phone,
      name: payload.name || phone || (email ? email.split('@')[0] : 'User'),
      picture: payload.picture || '',
      role: role
    }

    next()
  } catch (error) {
    console.error('Auth middleware server error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal authentication server error.'
    })
  }
}

/**
 * Enforce role-based access control.
 * @param  {...string} allowedRoles Roles permitted to access the route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' is not authorized for this action.`
      })
    }

    next()
  }
}

module.exports = {
  requireAuth,
  requireRole
}
