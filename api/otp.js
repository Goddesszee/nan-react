// api/otp.js — Email OTP login using Resend + Circle developer-controlled wallets
import crypto from 'crypto';
import { signEmailSession } from './_lib/auth.js';
import { parseBody } from './_lib/parse.js';

const otpRateLimit = new Map();

function checkOtpLimit(email) {
  const now = Date.now();
  const record = otpRateLimit.get(email) || { count: 0, start: now };
  if (now - record.start > 3_600_000) { otpRateLimit.set(email, { count: 1, start: now }); return true; }
  if (record.count >= 5) return false;
  record.count++;
  otpRateLimit.set(email, record);
  return true;
}

function signOTP(email, otp, expiresAt) {
  const secret = process.env.OTP_SECRET || process.env.CIRCLE_ENTITY_SECRET || 'nan-otp-fixed-secret-v1';
  const ts = String(Math.floor(Number(expiresAt)));
  const data = `${email.toLowerCase().trim()}:${otp.trim()}:${ts}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

async function sendEmail(to, code) {
  const apiKey = process.env.SMTP_PASS;
  const from   = process.env.SMTP_FROM || 'NAN <onboarding@resend.dev>';
  if (!apiKey) throw new Error('SMTP_PASS (Resend API key) not set');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your NAN login code',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                    max-width:440px;margin:0 auto;background:#0f0f1a;border-radius:16px;
                    overflow:hidden;border:1px solid rgba(37,99,235,0.3);">
          <div style="background:linear-gradient(135deg,#0a1a3e,#16213e);padding:32px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#2563EB;letter-spacing:-0.5px;">
              NAN <span style="color:#60a5fa;">✦</span>
            </div>
            <div style="color:#6b7280;font-size:13px;margin-top:4px;">
              Stablecoin Payments on Arc · Powered by Circle
            </div>
          </div>
          <div style="padding:32px;">
            <p style="color:#e5e7eb;font-size:16px;margin:0 0 24px;">Your one-time login code:</p>
            <div style="background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.4);
                        border-radius:12px;padding:28px;text-align:center;
                        letter-spacing:12px;font-size:36px;font-weight:700;
                        font-family:'Courier New',monospace;color:#60a5fa;">
              ${code}
            </div>
            <p style="color:#6b7280;font-size:13px;margin-top:20px;text-align:center;">
              ⏱ Expires in 10 minutes &nbsp;·&nbsp; Never share this code
            </p>
          </div>
          <div style="background:rgba(0,0,0,0.3);padding:16px 32px;text-align:center;
                      border-top:1px solid rgba(37,99,235,0.1);">
            <p style="color:#4b5563;font-size:12px;margin:0;">
              NAN · <a href="https://nanarc.xyz" style="color:#2563EB;text-decoration:none;">nanarc.xyz</a>
              &nbsp;·&nbsp; Built on Arc Testnet by Circle
            </p>
          </div>
        </div>`,
    }),
  });
  const data = await r.json();
  console.log('[OTP Resend]', r.status, JSON.stringify(data));
  if (!r.ok) throw new Error(data?.message || data?.name || `Resend ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── Circle SDK — lazy-loaded ──────────────────────────────────────────────────
async function getOrCreateWallet(email) {
  const apiKey = process.env.CIRCLE_API_KEY || process.env.CIRCLE_DEVELOPER_CONTROLLED_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET;
  if (!apiKey || !entitySecret) return null;
  const { initiateDeveloperControlledWalletsClient } = await import('@circle-fin/developer-controlled-wallets');
  const sdk = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });

  const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
  const walletName = `nan-user-${emailHash}`;

  // Find existing wallet
  try {
    const listRes = await sdk.listWallets({ pageSize: 50 });
    const existing = (listRes.data?.wallets || []).find(w => w.name === walletName);
    if (existing) return { walletId: existing.id, walletAddress: existing.address };
  } catch {}

  // Get or create wallet set
  let walletSetId = process.env.NAN_WALLET_SET_ID;
  if (!walletSetId) {
    try {
      const wsRes = await sdk.createWalletSet({ name: 'nan-users', idempotencyKey: 'nan-users-walletset-v1' });
      walletSetId = wsRes.data?.walletSet?.id;
    } catch {
      const wsList = await sdk.listWalletSets({ pageSize: 10 });
      walletSetId = (wsList.data?.walletSets || []).find(w => w.name === 'nan-users')?.id;
    }
  }
  if (!walletSetId) return null;

  const walletsRes = await sdk.createWallets({
    accountType: 'EOA', blockchains: ['ARC-TESTNET'], count: 1,
    walletSetId, metadata: [{ name: walletName, refId: email }],
  });
  const wallet = walletsRes.data?.wallets?.[0];
  if (!wallet) return null;
  return { walletId: wallet.id, walletAddress: wallet.address };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { action, email, otp, token, expiresAt } = await parseBody(req);

  // ── send ──────────────────────────────────────────────────────────────────
  if (action === 'send') {
    if (!email?.includes('@')) return res.json({ success: false, error: 'Invalid email' });
    if (email.length > 100)    return res.json({ success: false, error: 'Email too long' });
    if (!checkOtpLimit(email.toLowerCase()))
      return res.json({ success: false, error: 'Too many codes — try again in 1 hour' });

    const code    = Math.floor(100_000 + Math.random() * 900_000).toString();
    const expires = Date.now() + 600_000;
    const sig     = signOTP(email, code, expires);

    if (process.env.SMTP_PASS) {
      try {
        await sendEmail(email, code);
        return res.json({ success: true, token: sig, expiresAt: expires });
      } catch (err) {
        console.error('[otp/send] Resend error:', err.message);
        return res.json({ success: false, error: err.message });
      }
    }

    // Dev fallback — log to Vercel function logs
    console.log(`[NAN DEV] OTP for ${email}: ${code}`);
    return res.json({ success: true, dev: true, token: sig, expiresAt: expires });
  }

  // ── verify ────────────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!email || !otp || !token || !expiresAt)
      return res.json({ success: false, error: 'Missing fields' });
    if (typeof otp !== 'string' || otp.length !== 6 || !/^\d+$/.test(otp))
      return res.json({ success: false, error: 'Code must be 6 digits' });
    if (Date.now() > Number(expiresAt))
      return res.json({ success: false, error: 'Code expired — request a new one' });

    const expected = signOTP(email, otp.trim(), Number(expiresAt));
    if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token))
      return res.json({ success: false, error: 'Wrong code' });
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(token, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
      return res.json({ success: false, error: 'Wrong code' });

    const sessionToken = signEmailSession(email);

    // Try to get/create Circle wallet (non-blocking — login succeeds even without it)
    let walletAddress = null, walletId = null;
    try {
      const wallet = await getOrCreateWallet(email);
      walletAddress = wallet?.walletAddress || null;
      walletId = wallet?.walletId || null;
    } catch (e) {
      console.error('[otp/verify] wallet error:', e.message);
    }

    return res.json({ success: true, sessionToken, walletAddress, walletId });
  }

  return res.json({ success: false, error: 'Unknown action' });
}
