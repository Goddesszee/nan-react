// api/otp.js — Email OTP login using Resend + Circle developer-controlled wallets
// POST { action: 'send', email } -> { token, expiresAt }
// POST { action: 'verify', email, otp, token, expiresAt } -> { sessionToken, walletAddress, walletId }

import crypto from 'crypto'
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'
import { signEmailSession } from './_lib/auth.js'

// ── Rate limiting (per email, 5 OTPs/hour) ───────────────────────────────────
const otpRateLimit = new Map()
function checkOtpLimit(email) {
  const now = Date.now()
  const rec = otpRateLimit.get(email) || { count: 0, start: now }
  if (now - rec.start > 3_600_000) { otpRateLimit.set(email, { count: 1, start: now }); return true }
  if (rec.count >= 5) return false
  rec.count++; otpRateLimit.set(email, rec); return true
}

// ── OTP signing (HMAC so the token is verifiable server-side without a DB) ───
const OTP_SECRET = process.env.OTP_SECRET || process.env.CIRCLE_ENTITY_SECRET || 'nan-otp-v1'
function signOtp(email, otp, expiresAt) {
  const data = `${email.toLowerCase().trim()}:${otp}:${Math.floor(Number(expiresAt))}`
  return crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex')
}

// ── Send OTP email via Resend ─────────────────────────────────────────────────
async function sendOtpEmail(to, code) {
  const apiKey = process.env.SMTP_PASS // Resend API key stored here
  const from = process.env.SMTP_FROM || 'NAN <onboarding@resend.dev>'
  if (!apiKey) {
    // Dev fallback — log to console
    console.log(`\n[OTP DEV] Code for ${to}: ${code}\n`)
    return { dev: true }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your NAN login code',
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:440px;margin:0 auto;
                    background:#0f0f1a;border-radius:16px;overflow:hidden;
                    border:1px solid rgba(37,99,235,0.3);">
          <div style="background:linear-gradient(135deg,#0a1a3e,#16213e);
                      padding:32px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#2563EB;">NAN</div>
            <div style="color:#6b7280;font-size:13px;margin-top:4px;">
              Stablecoin payments on Arc · Powered by Circle
            </div>
          </div>
          <div style="padding:32px;">
            <p style="color:#e5e7eb;font-size:16px;margin:0 0 24px;">
              Your one-time login code:
            </p>
            <div style="background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.4);
                        border-radius:12px;padding:28px;text-align:center;
                        letter-spacing:12px;font-size:36px;font-weight:700;
                        font-family:monospace;color:#60a5fa;">
              ${code}
            </div>
            <p style="color:#6b7280;font-size:13px;margin-top:20px;text-align:center;">
              Expires in 10 minutes &nbsp;·&nbsp; Never share this code
            </p>
          </div>
        </div>`,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Email send failed (${res.status})`)
  }
  return { sent: true }
}

// ── Circle SDK — get or create wallet for email ───────────────────────────────
function getCircleClient() {
  const apiKey = process.env.CIRCLE_API_KEY || process.env.CIRCLE_DEVELOPER_CONTROLLED_API_KEY
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET
  if (!apiKey || !entitySecret) return null
  return initiateDeveloperControlledWalletsClient({ apiKey, entitySecret })
}

// In-memory wallet cache: email -> { walletId, walletAddress, walletSetId }
// In production this should be a real DB; for Vercel serverless this resets per
// cold start, but Circle's idempotency means re-creating returns the same wallet.
const walletCache = new Map()

async function getOrCreateWallet(email) {
  if (walletCache.has(email)) return walletCache.get(email)

  const sdk = getCircleClient()
  if (!sdk) {
    // No Circle credentials — return a placeholder so login still works
    const fake = { walletId: `demo-${email}`, walletAddress: '0x0000000000000000000000000000000000000000' }
    walletCache.set(email, fake)
    return fake
  }

  // Use email hash as idempotency seed so the same wallet is returned on retry
  const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16)

  // 1. Find existing wallets by name tag
  try {
    const listRes = await sdk.listWallets({ pageSize: 50 })
    const existing = (listRes.data?.wallets || []).find(w => w.name === `nan-user-${emailHash}`)
    if (existing) {
      const entry = { walletId: existing.id, walletAddress: existing.address }
      walletCache.set(email, entry)
      return entry
    }
  } catch {}

  // 2. Create wallet set (idempotent by name)
  let walletSetId = process.env.NAN_WALLET_SET_ID
  if (!walletSetId) {
    try {
      const wsRes = await sdk.createWalletSet({ name: 'nan-users', idempotencyKey: 'nan-users-walletset-v1' })
      walletSetId = wsRes.data?.walletSet?.id
    } catch (e) {
      // May already exist — try to find it
      const wsList = await sdk.listWalletSets({ pageSize: 10 })
      const ws = (wsList.data?.walletSets || []).find(w => w.name === 'nan-users')
      walletSetId = ws?.id
    }
  }
  if (!walletSetId) throw new Error('Could not get or create wallet set')

  // 3. Create the user's wallet on ARC-TESTNET
  const walletsRes = await sdk.createWallets({
    accountType: 'EOA',
    blockchains: ['ARC-TESTNET'],
    count: 1,
    walletSetId,
    metadata: [{ name: `nan-user-${emailHash}`, refId: email }],
  })
  const wallet = walletsRes.data?.wallets?.[0]
  if (!wallet) throw new Error('Wallet creation failed')

  const entry = { walletId: wallet.id, walletAddress: wallet.address }
  walletCache.set(email, entry)
  return entry
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, otp, token, expiresAt } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ success: false, error: 'email required' })
  const normalEmail = email.toLowerCase().trim()

  // ── Action: send ────────────────────────────────────────────────────────────
  if (action === 'send') {
    if (!checkOtpLimit(normalEmail)) {
      return res.status(429).json({ success: false, error: 'Too many OTP requests — try again in an hour' })
    }
    const code = Math.floor(100_000 + Math.random() * 900_000).toString()
    const exp = Date.now() + 10 * 60 * 1000 // 10 min
    const signed = signOtp(normalEmail, code, exp)
    try {
      const result = await sendOtpEmail(normalEmail, code)
      return res.json({ success: true, token: signed, expiresAt: exp, dev: result.dev || false })
    } catch (err) {
      console.error('[otp/send]', err.message)
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  // ── Action: verify ──────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!otp || !token || !expiresAt) {
      return res.status(400).json({ success: false, error: 'otp, token, and expiresAt required' })
    }
    if (Date.now() > Number(expiresAt)) {
      return res.status(400).json({ success: false, error: 'OTP expired — please request a new one' })
    }
    const expected = signOtp(normalEmail, String(otp).trim(), expiresAt)
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))) {
      return res.status(400).json({ success: false, error: 'Invalid code — please try again' })
    }
    try {
      const { walletId, walletAddress } = await getOrCreateWallet(normalEmail)
      const sessionToken = signEmailSession({
        email: normalEmail, walletId, walletAddress, iat: Date.now(),
      })
      return res.json({ success: true, sessionToken, walletAddress, walletId })
    } catch (err) {
      console.error('[otp/verify]', err.message)
      return res.status(500).json({ success: false, error: `Login failed: ${err.message}` })
    }
  }

  return res.status(400).json({ success: false, error: 'Unknown action' })
}
