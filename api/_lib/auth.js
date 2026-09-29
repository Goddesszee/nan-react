// api/_lib/auth.js — HMAC session token helpers
import crypto from 'crypto'

const SECRET = process.env.OTP_SECRET || process.env.CIRCLE_ENTITY_SECRET || 'nan-session-secret-v1'

/**
 * Sign a session payload into a compact HMAC token.
 * Payload: { email, walletId, walletAddress, iat }
 */
export function signEmailSession(payload) {
  const data = JSON.stringify(payload)
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('hex')
  // base64url(data):sig
  return Buffer.from(data).toString('base64url') + '.' + sig
}

/**
 * Verify and decode a session token.
 * Returns the payload on success, throws on invalid/expired.
 */
export function verifyEmailSession(token) {
  if (!token || typeof token !== 'string') throw new Error('Missing session token')
  const [dataPart, sig] = token.split('.')
  if (!dataPart || !sig) throw new Error('Malformed token')
  const expected = crypto.createHmac('sha256', SECRET).update(Buffer.from(dataPart, 'base64url').toString()).digest('hex')
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    throw new Error('Invalid session token')
  }
  const payload = JSON.parse(Buffer.from(dataPart, 'base64url').toString())
  // Sessions expire after 30 days
  if (Date.now() - payload.iat > 30 * 24 * 60 * 60 * 1000) {
    throw new Error('Session expired')
  }
  return payload
}

/**
 * Middleware helper — reads Bearer token from Authorization header,
 * verifies it, and attaches payload to req.session.
 * Returns false and writes 401 if invalid.
 */
export function requireEmailSession(req, res) {
  const auth = req.headers['authorization'] || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  try {
    req.session = verifyEmailSession(token)
    return true
  } catch (err) {
    res.status(401).json({ success: false, error: err.message })
    return false
  }
}
