import React, { useState } from 'react'
import { useNanStore } from '../../store/nanStore'
import { NanLogo } from '../ui/Logo'
import { Button } from '../ui/Button'
import { sendOtp, verifyOtp } from '../../lib/nan'

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

export function OnboardingPage() {
  const { setNanAuth, setOnboarding, agentPermissions, setAgentPermissions, setActiveView } = useNanStore()

  // Step machine: email → otp → usecases → agent → limits
  const [step, setStep] = useState<'email' | 'otp' | 'usecases' | 'agent' | 'limits'>('email')

  // Email / OTP state
  const [email, setEmail]         = useState('')
  const [otpCode, setOtpCode]     = useState('')
  const [otpToken, setOtpToken]   = useState('')
  const [otpExpiry, setOtpExpiry] = useState(0)
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

  const stepNum = { email: 1, otp: 1, usecases: 2, agent: 3, limits: 4 }[step] ?? 1

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address'); return
    }
    setError('')
    setLoading(true)
    try {
      const res = await sendOtp(trimmed)
      setOtpToken(res.token)
      setOtpExpiry(res.expiresAt)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  // ── Verify OTP + create Circle wallet ────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otpCode.trim()
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Enter the 6-digit code from your email'); return
    }
    setError('')
    setLoading(true)
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), code, otpToken, otpExpiry)
      // Persist the Circle session into Zustand (+ localStorage via persist middleware)
      setNanAuth({
        email:        email.trim().toLowerCase(),
        sessionToken: res.sessionToken,
        walletAddress: (res as Record<string, string>).walletAddress ?? '',
        walletId:      (res as Record<string, string>).walletId ?? '',
      })
      setStep('usecases')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code — try again')
    } finally {
      setLoading(false)
    }
  }

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
          <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{
                width: n === stepNum ? 20 : 6, height: 6, borderRadius: 3,
                background: n <= stepNum ? NAN_BLUE : 'rgba(37,99,235,0.18)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>

        {/* ── Step 1a: Email entry ── */}
        {step === 'email' && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: NAN_BLUE_LIGHT, marginBottom: 10 }}>Step 01</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Sign in to Nan</h2>
            <p style={{ color: NAN_TEXT_2, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Enter your email to receive a one-time code. Nan creates a Circle-powered USDC wallet for you automatically — no private keys.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: NAN_TEXT_3, display: 'block', marginBottom: 8 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && void handleSendOtp()}
                placeholder="you@example.com"
                autoFocus
                style={{
                  width: '100%', padding: '13px 14px', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${error ? '#ef4444' : 'rgba(37,99,235,0.22)'}`,
                  borderRadius: 10, color: NAN_TEXT, fontSize: 15, fontFamily: SANS,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
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

        {/* ── Step 1b: OTP verify ── */}
        {step === 'otp' && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: NAN_BLUE_LIGHT, marginBottom: 10 }}>Step 01</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Check your email</h2>
            <p style={{ color: NAN_TEXT_2, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              We sent a 6-digit code to <strong style={{ color: NAN_TEXT }}>{email}</strong>. Enter it below.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: NAN_TEXT_3, display: 'block', marginBottom: 8 }}>
                One-time code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={e => e.key === 'Enter' && void handleVerifyOtp()}
                placeholder="123456"
                autoFocus
                style={{
                  width: '100%', padding: '13px 14px', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${error ? '#ef4444' : 'rgba(37,99,235,0.22)'}`,
                  borderRadius: 10, color: NAN_TEXT, fontSize: 24, fontFamily: MONO,
                  letterSpacing: '0.3em', textAlign: 'center',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = NAN_BLUE }}
                onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(37,99,235,0.22)' }}
              />
              {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6, fontFamily: MONO }}>{error}</p>}
            </div>
            <Button fullWidth loading={loading} onClick={() => void handleVerifyOtp()}>
              Verify code →
            </Button>
            <button
              onClick={() => { setStep('email'); setOtpCode(''); setError('') }}
              style={{ marginTop: 14, width: '100%', background: 'none', border: 'none', color: NAN_TEXT_3, fontSize: 13, cursor: 'pointer', fontFamily: MONO }}
            >
              ← Use a different email
            </button>
            <button
              onClick={() => void handleSendOtp()}
              disabled={loading}
              style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: NAN_BLUE_LIGHT, fontSize: 13, cursor: 'pointer', fontFamily: MONO }}
            >
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
                  <button
                    key={id}
                    onClick={() => toggleCase(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      background: on ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${on ? 'rgba(37,99,235,0.4)' : 'rgba(37,99,235,0.14)'}`,
                      transition: 'all 0.18s', color: NAN_TEXT, fontFamily: SANS,
                    }}
                  >
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
