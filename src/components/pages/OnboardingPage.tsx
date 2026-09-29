import React, { useState, useEffect } from 'react'
import { useNanStore } from '../../store/nanStore'
import { NanLogo } from '../ui/Logo'
import { Button } from '../ui/Button'
import { sendOtp, verifyOtp } from '../../lib/nan'

// ── Google One-Tap / GSI ──────────────────────────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void
          renderButton: (el: HTMLElement, cfg: object) => void
          prompt: () => void
        }
      }
    }
  }
}

function parseGoogleJwt(token: string): { email?: string; name?: string; picture?: string } {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))
  } catch { return {} }
}

const NAN_BG      = '#0A0A0F'
const NAN_SURFACE = '#111118'
const NAN_BORDER  = 'rgba(37,99,235,0.18)'
const NAN_TEXT    = '#F4F4F8'
const NAN_TEXT_2  = '#9AA0B0'
const NAN_TEXT_3  = '#64748B'
const NAN_BLUE    = '#2563EB'
const NAN_BLUE_LIGHT = '#60A5FA'
const MONO = 'IBM Plex Mono, monospace'
const SANS = 'Inter, sans-serif'

const USE_CASES = [
  { id: 'payments',  label: 'Send & Receive',  icon: '💸', desc: 'Wallet for everyday USDC payments' },
  { id: 'shopping',  label: 'Shop',             icon: '🛍️', desc: 'Browse and buy from merchants' },
  { id: 'agent',     label: 'AI Agent',         icon: '🤖', desc: 'Let my agent shop for me' },
  { id: 'receiving', label: 'Accept Payments',  icon: '📥', desc: 'Receive USDC from others' },
  { id: 'merchant',  label: 'Sell as Merchant', icon: '🏪', desc: 'List products and accept USDC' },
]

// ── Wallet login via window.ethereum (MetaMask, Rabby, Trust, Coinbase) ────────
async function connectWallet(): Promise<{ address: string; signature: string }> {
  const eth = (window as Record<string, unknown>).ethereum as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  } | undefined
  if (!eth) throw new Error('No wallet found. Install MetaMask or Rabby.')

  const accounts = await eth.request({ method: 'eth_requestAccounts', params: [] }) as string[]
  if (!accounts || accounts.length === 0) throw new Error('No accounts returned.')
  const address = accounts[0]

  const message = `Sign in to NAN\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nAddress: ${address}\nTimestamp: ${Date.now()}`
  const signature = await eth.request({
    method: 'personal_sign',
    params: [message, address],
  }) as string

  return { address, signature }
}

export function OnboardingPage() {
  const { setNanAuth, setOnboarding, agentPermissions, setAgentPermissions, setActiveView } = useNanStore()

  // Auth method: 'choose' | 'email' | 'wallet'
  const [authMethod, setAuthMethod] = useState<'choose' | 'email' | 'wallet'>('choose')

  // ── Google GSI — load script and handle credential response ──────────────
  const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          const { email, name } = parseGoogleJwt(response.credential)
          if (!email) { setError('Google sign-in failed — no email returned'); return }
          // Use the Google email to get/create a Circle wallet via OTP backend
          setNanAuth({
            email: email,
            sessionToken: `google:${response.credential.slice(-32)}`,
            walletAddress: '',
            walletId: '',
          })
          // Trigger OTP-based wallet creation silently
          sendOtp(email).then(res => {
            // Auto-verify not possible — just proceed to use cases; wallet created on next login
            setStep('usecases')
          }).catch(() => setStep('usecases'))
          void name
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      const el = document.getElementById('nan-google-btn')
      if (el) window.google?.accounts.id.renderButton(el, {
        theme: 'filled_black', size: 'large', width: 380,
        text: 'continue_with', shape: 'rectangular',
      })
    }
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GOOGLE_CLIENT_ID])

  // Step machine (post-auth): usecases → agent → limits
  const [step, setStep] = useState<'auth' | 'usecases' | 'agent' | 'limits'>('auth')

  // Email / OTP state
  const [email, setEmail]         = useState('')
  const [otpCode, setOtpCode]     = useState('')
  const [otpToken, setOtpToken]   = useState('')
  const [otpExpiry, setOtpExpiry] = useState(0)
  const [devCode, setDevCode]     = useState('')   // shown on screen if email fails
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // Use-case + limit state
  const [selected, setSelected]   = useState<string[]>([])
  const [dailyLimit, setDailyLimit] = useState(String(agentPermissions.dailyLimit))
  const [perTxLimit, setPerTxLimit] = useState(String(agentPermissions.perTxLimit))

  const toggleCase = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const finish = () => {
    setOnboarding({ completed: true, useCases: selected, agentConfigured: step === 'limits' })
    setActiveView('home')
  }

  const stepNum = step === 'auth' ? 1 : step === 'usecases' ? 2 : step === 'agent' ? 3 : 4

  // ── Wallet connect login ──────────────────────────────────────────────────
  const handleWalletLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const { address } = await connectWallet()
      // Use wallet address as the identity — no Circle wallet creation for wallet users
      setNanAuth({
        email: '',
        sessionToken: `wallet:${address}`,
        walletAddress: address,
        walletId: '',
      })
      setStep('usecases')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address'); return
    }
    setError('')
    setDevCode('')
    setLoading(true)
    try {
      const res = await sendOtp(trimmed)
      setOtpToken(res.token)
      setOtpExpiry(res.expiresAt)
      // If backend returns dev:true, the code wasn't emailed — show it on screen
      if ((res as { dev?: boolean }).dev) {
        // Fetch the code from the Vercel function log isn't possible client-side,
        // but we can prompt the user to check Vercel logs OR we just show a hint
        setDevCode('⚠️ Email not configured — check Vercel function logs for your code, or set SMTP_PASS.')
      }
      setAuthMethod('email')  // move to OTP entry step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otpCode.trim()
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Enter the 6-digit code from your email'); return
    }
    setError('')
    setLoading(true)
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), code, otpToken, otpExpiry)
      setNanAuth({
        email: email.trim().toLowerCase(),
        sessionToken: (res as Record<string, string>).sessionToken,
        walletAddress: (res as Record<string, string>).walletAddress ?? '',
        walletId: (res as Record<string, string>).walletId ?? '',
      })
      setStep('usecases')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code — try again')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError: boolean) => ({
    width: '100%', padding: '13px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(37,99,235,0.22)'}`,
    borderRadius: 10, color: NAN_TEXT, fontSize: 15, fontFamily: SANS,
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  })

  return (
    <div style={{
      minHeight: '100vh', background: NAN_BG, color: NAN_TEXT,
      fontFamily: SANS, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: NAN_SURFACE,
        border: `1px solid ${NAN_BORDER}`,
        borderRadius: 18, padding: '36px 32px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <NanLogo size="lg" />
          <p style={{ color: NAN_TEXT_2, fontSize: 13, marginTop: 10, textAlign: 'center' }}>
            The intelligent payment layer
          </p>
          {step !== 'auth' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{
                  width: n === stepNum ? 20 : 6, height: 6, borderRadius: 3,
                  background: n <= stepNum ? NAN_BLUE : 'rgba(37,99,235,0.18)',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* ── Step Auth: Choose method ── */}
        {step === 'auth' && authMethod === 'choose' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center' }}>
              Sign in to Nan
            </h2>
            <p style={{ color: NAN_TEXT_2, fontSize: 14, lineHeight: 1.6, marginBottom: 24, textAlign: 'center' }}>
              Choose how you'd like to continue.
            </p>

            {/* Google Sign-In — rendered by GSI SDK when VITE_GOOGLE_CLIENT_ID is set */}
            {GOOGLE_CLIENT_ID ? (
              <div id="nan-google-btn" style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }} />
            ) : (
              <button
                disabled
                style={{
                  width: '100%', padding: '15px 20px', marginBottom: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, cursor: 'not-allowed', display: 'flex',
                  alignItems: 'center', gap: 14, color: NAN_TEXT_3, fontFamily: SANS, opacity: 0.5,
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>G</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Continue with Google</div>
                  <div style={{ fontSize: 12, color: NAN_TEXT_3, marginTop: 2 }}>Set VITE_GOOGLE_CLIENT_ID to enable</div>
                </div>
              </button>
            )}

            {/* Wallet connect button */}
            <button
              onClick={() => void handleWalletLogin()}
              disabled={loading}
              style={{
                width: '100%', padding: '15px 20px', marginBottom: 12,
                background: 'linear-gradient(135deg,rgba(37,99,235,0.18),rgba(124,58,237,0.14))',
                border: '1px solid rgba(37,99,235,0.4)',
                borderRadius: 12, cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 14, color: NAN_TEXT, fontFamily: SANS,
                opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: 'rgba(37,99,235,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>🦊</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>MetaMask / Rabby</div>
                <div style={{ fontSize: 12, color: NAN_TEXT_3, marginTop: 2 }}>
                  Connect any injected wallet
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: NAN_BLUE_LIGHT, fontSize: 18 }}>→</div>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(37,99,235,0.12)' }} />
              <span style={{ fontSize: 11, color: NAN_TEXT_3, fontFamily: MONO }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(37,99,235,0.12)' }} />
            </div>

            {/* Email OTP button */}
            <button
              onClick={() => setAuthMethod('email_entry' as unknown as 'email')}
              style={{
                width: '100%', padding: '15px 20px', marginBottom: 20,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(37,99,235,0.18)',
                borderRadius: 12, cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 14, color: NAN_TEXT, fontFamily: SANS,
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>✉️</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Email OTP</div>
                <div style={{ fontSize: 12, color: NAN_TEXT_3, marginTop: 2 }}>
                  Get a 6-digit code by email
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: NAN_TEXT_3, fontSize: 18 }}>→</div>
            </button>

            {error && <p style={{ color: '#ef4444', fontSize: 12, fontFamily: MONO, textAlign: 'center', marginTop: -8, marginBottom: 8 }}>{error}</p>}

            <p style={{ color: NAN_TEXT_3, fontSize: 12, textAlign: 'center', fontFamily: MONO }}>
              Noncustodial · No seed phrase · Circle MPC
            </p>
          </div>
        )}

        {/* ── Email entry ── */}
        {step === 'auth' && (authMethod as string) === 'email_entry' && (
          <div>
            <button onClick={() => { setAuthMethod('choose'); setError('') }}
              style={{ background: 'none', border: 'none', color: NAN_TEXT_3, fontSize: 13, cursor: 'pointer', fontFamily: MONO, marginBottom: 16 }}>
              ← Back
            </button>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: NAN_BLUE_LIGHT, marginBottom: 10 }}>Email login</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Enter your email</h2>
            <p style={{ color: NAN_TEXT_2, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              We'll send a 6-digit code. No password needed.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: NAN_TEXT_3, display: 'block', marginBottom: 8 }}>
                Email address
              </label>
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && void handleSendOtp()}
                placeholder="you@example.com" autoFocus
                style={inputStyle(!!error)}
                onFocus={e => { e.target.style.borderColor = NAN_BLUE }}
                onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(37,99,235,0.22)' }}
              />
              {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6, fontFamily: MONO }}>{error}</p>}
            </div>
            <Button fullWidth loading={loading} onClick={() => void handleSendOtp()}>
              Send login code →
            </Button>
          </div>
        )}

        {/* ── OTP verify ── */}
        {step === 'auth' && authMethod === 'email' && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: NAN_BLUE_LIGHT, marginBottom: 10 }}>Check your email</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Enter your code</h2>
            <p style={{ color: NAN_TEXT_2, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              We sent a 6-digit code to <strong style={{ color: NAN_TEXT }}>{email}</strong>.
            </p>
            {devCode && (
              <div style={{
                background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                fontSize: 12, color: '#fbbf24', fontFamily: MONO,
              }}>
                {devCode}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: NAN_TEXT_3, display: 'block', marginBottom: 8 }}>
                One-time code
              </label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={otpCode}
                onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={e => e.key === 'Enter' && void handleVerifyOtp()}
                placeholder="123456" autoFocus
                style={{ ...inputStyle(!!error), fontSize: 24, letterSpacing: '0.3em', textAlign: 'center' }}
                onFocus={e => { e.target.style.borderColor = NAN_BLUE }}
                onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(37,99,235,0.22)' }}
              />
              {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6, fontFamily: MONO }}>{error}</p>}
            </div>
            <Button fullWidth loading={loading} onClick={() => void handleVerifyOtp()}>
              Verify code →
            </Button>
            <button onClick={() => { setAuthMethod('email_entry' as unknown as 'email'); setOtpCode(''); setError('') }}
              style={{ marginTop: 14, width: '100%', background: 'none', border: 'none', color: NAN_TEXT_3, fontSize: 13, cursor: 'pointer', fontFamily: MONO }}>
              ← Use a different email
            </button>
            <button onClick={() => void handleSendOtp()} disabled={loading}
              style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: NAN_BLUE_LIGHT, fontSize: 13, cursor: 'pointer', fontFamily: MONO }}>
              Resend code
            </button>
          </div>
        )}

        {/* ── Step 2: Use cases ── */}
        {step === 'usecases' && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: NAN_BLUE_LIGHT, marginBottom: 10 }}>Step 02</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>What will you use Nan for?</h2>
            <p style={{ color: NAN_TEXT_2, fontSize: 13, marginBottom: 22 }}>Select all that apply.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {USE_CASES.map(({ id, label, icon, desc }) => {
                const on = selected.includes(id)
                return (
                  <button key={id} onClick={() => toggleCase(id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    background: on ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${on ? 'rgba(37,99,235,0.4)' : 'rgba(37,99,235,0.14)'}`,
                    transition: 'all 0.18s', color: NAN_TEXT, fontFamily: SANS,
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, color: NAN_TEXT_3 }}>{desc}</div>
                    </div>
                    {on && <span style={{ width: 20, height: 20, borderRadius: '50%', background: NAN_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', flexShrink: 0 }}>✓</span>}
                  </button>
                )
              })}
            </div>
            <Button fullWidth onClick={() => setStep('agent')} disabled={selected.length === 0}>
              Continue →
            </Button>
          </div>
        )}

        {/* ── Step 3: Agent opt-in ── */}
        {step === 'agent' && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: NAN_BLUE_LIGHT, marginBottom: 10 }}>Step 03</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Set up your Shopping Agent?</h2>
            <p style={{ color: NAN_TEXT_2, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Nan's AI agent can find products and purchase them within limits you control.
            </p>
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <Button fullWidth onClick={() => setStep('limits')}>Yes, set up my agent</Button>
              <Button fullWidth variant="ghost" onClick={finish}>Later</Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Limits ── */}
        {step === 'limits' && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: NAN_BLUE_LIGHT, marginBottom: 10 }}>Step 04</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Configure spending limits</h2>
            <p style={{ color: NAN_TEXT_2, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Your agent will never exceed these limits.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: NAN_TEXT_3, marginBottom: 8 }}>Daily limit (USDC)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[10, 20, 50, 100].map(v => (
                  <button key={v} onClick={() => setDailyLimit(String(v))} style={{
                    flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer',
                    background: dailyLimit === String(v) ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${dailyLimit === String(v) ? 'rgba(37,99,235,0.45)' : 'rgba(37,99,235,0.14)'}`,
                    color: dailyLimit === String(v) ? NAN_BLUE_LIGHT : NAN_TEXT_2,
                    fontSize: 14, fontWeight: 700, fontFamily: MONO, transition: 'all 0.18s',
                  }}>{v}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: NAN_TEXT_3, marginBottom: 8 }}>Per-transaction limit (USDC)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 25, 50].map(v => (
                  <button key={v} onClick={() => setPerTxLimit(String(v))} style={{
                    flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer',
                    background: perTxLimit === String(v) ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${perTxLimit === String(v) ? 'rgba(37,99,235,0.45)' : 'rgba(37,99,235,0.14)'}`,
                    color: perTxLimit === String(v) ? NAN_BLUE_LIGHT : NAN_TEXT_2,
                    fontSize: 14, fontWeight: 700, fontFamily: MONO, transition: 'all 0.18s',
                  }}>{v}</button>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
              {[
                { label: 'Daily limit', val: `${dailyLimit} USDC` },
                { label: 'Per transaction', val: `${perTxLimit} USDC` },
                { label: 'Approval mode', val: 'Ask before each purchase' },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(37,99,235,0.1)', fontSize: 13 }}>
                  <span style={{ color: NAN_TEXT_3 }}>{label}</span>
                  <span style={{ fontWeight: 600, color: NAN_TEXT, fontFamily: MONO }}>{val}</span>
                </div>
              ))}
            </div>
            <Button fullWidth onClick={() => {
              setAgentPermissions({ dailyLimit: parseFloat(dailyLimit) || 20, perTxLimit: parseFloat(perTxLimit) || 10 })
              finish()
            }}>
              Launch Nan →
            </Button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: NAN_TEXT_3, fontFamily: MONO, letterSpacing: '0.04em' }}>
        Powered by Arc · Circle USDC · Testnet
      </p>
    </div>
  )
}
