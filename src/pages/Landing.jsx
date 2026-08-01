import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../hooks/useTheme'

const API = 'https://nan-production.up.railway.app'

export function Landing({ onEmailConnect, onWalletConnect }) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme !== 'light'

  // OTP login state
  const [step, setStep] = useState('email') // email | otp | loading
  const [showConnect, setShowConnect] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loadMsg, setLoadMsg] = useState('')
  const tokenRef = useRef(null)
  const expiryRef = useRef(null)
  const emailInputRef = useRef(null)

  // live stats (fetched for potential future use, e.g. an activity strip)
  const [liveStats, setLiveStats] = useState({ wallets: null, txns: null })
  useEffect(() => {
    fetch(`${API}/api/analytics`)
      .then(r => r.json())
      .then(d => { if (d && (d.wallets || d.transactions)) setLiveStats({ wallets: d.wallets || null, txns: d.transactions || null }) })
      .catch(() => {})
  }, [])

  // colors — match the app exactly, both themes
  const bg       = dark ? '#111111' : '#fafafa'
  const card     = dark ? '#1a1a1a' : '#ffffff'
  const border   = dark ? 'rgba(255,255,255,.07)' : '#e4e4e4'
  const border2  = dark ? 'rgba(255,255,255,.12)' : '#cccccc'
  const text     = dark ? '#ffffff' : '#1a1a1a'
  const text2    = dark ? '#a0a0a0' : '#555555'
  const text3    = dark ? '#555555' : '#999999'
  const inputBg  = dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'
  const inputBg2 = dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'
  const accent   = '#7000ff'
  const accentL  = '#a855f7'

  // ── OTP send ──────────────────────────────────────────────────
  // ── Open the connect panel and scroll straight to the email input ─
  function openConnect() {
    setShowConnect(true)
    setTimeout(() => {
      emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      emailInputRef.current?.focus()
    }, 60)
  }

  async function sendOTP(e) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    setStep('loading'); setLoadMsg('Sending code…'); setError('')
    try {
      const r = await fetch(`${API}/api/otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email }),
      })
      const d = await r.json()
      if (!d.success) { setError(d.error || 'Failed to send code'); setStep('email'); return }
      tokenRef.current = d.token
      expiryRef.current = d.expiresAt
      setInfo(`Code sent to ${email}`)
      setStep('otp')
    } catch { setError('Network error. Please retry'); setStep('email') }
  }

  // ── OTP verify ────────────────────────────────────────────────
  async function verifyOTP(e) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return }
    setStep('loading'); setLoadMsg('Verifying code…'); setError('')
    try {
      const r = await fetch(`${API}/api/otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, otp, token: tokenRef.current, expiresAt: expiryRef.current }),
      })
      const d = await r.json()
      if (!d.success) { setError(d.error || 'Invalid code'); setStep('otp'); return }
      setLoadMsg('Setting up your wallet…')
      await onEmailConnect(email)
    } catch(e) { setError(e.message || 'Error'); setStep('otp') }
  }

  // ── Wallet connect ────────────────────────────────────────────
  async function connectWallet() {
    setStep('loading'); setLoadMsg('Connecting wallet…'); setError('')
    try {
      await onWalletConnect()
    } catch(e) { setError(e.message?.slice(0, 80) || 'Connection failed'); setStep('email') }
  }

  // ── Loading screen ────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={{ minHeight:'100vh', background:bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:'#7000ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width={19} height={27}>
            <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill="#fff"/>
            <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill="#fff"/>
          </svg>
        </div>
        <span style={{ fontWeight:700, fontSize:'20px', color:text, fontFamily:'Inter, sans-serif', lineHeight:'44px' }}>NAN</span>
      </div>
      <div style={{ color:text, fontSize:'1rem', fontWeight:600 }}>{loadMsg}</div>
      <div style={{ display:'flex', gap:6 }}>
        {['#7000ff','#9333ea','#c084fc'].map((c,i) => (
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:c, animation:`pulse 1s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )

  return (
    <div style={{ background:bg, color:text, fontFamily:'Inter,sans-serif', minHeight:'100vh', overflowX:'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'26px 48px', maxWidth:1400, margin:'0 auto', borderBottom:`1px solid ${border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg viewBox="0 0 324 480" width="12" height="18"><path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill="#fff"/><path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill="#fff"/></svg>
          </div>
          <span style={{ fontWeight:700, fontSize:'1.1rem', letterSpacing:'-.01em' }}>NAN</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={openConnect} style={{ background:accent, border:'none', color:'#fff', fontWeight:700, fontSize:'.85rem', padding:'10px 20px', borderRadius:100, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            Connect Wallet
          </button>
          <button onClick={toggleTheme} style={{ width:34, height:34, borderRadius:'50%', border:`1px solid ${border2}`, background:inputBg2, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:text2 }}>
            {dark
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.36 5.64l1.41-1.41"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:'auto', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'48px 24px 60px' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:9, fontSize:'.72rem', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:accentL, background:'rgba(112,0,255,.1)', border:'1px solid rgba(112,0,255,.28)', padding:'8px 18px', borderRadius:100, marginBottom:28 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:accentL, animation:'pulseDot 1.6s ease-in-out infinite' }}/>
          Live on Arc Testnet
        </div>

        <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'clamp(2.6rem,8vw,5.6rem)', fontWeight:800, lineHeight:1.02, letterSpacing:'-.035em', margin:'0 0 18px' }}>
          Weave. Connect.<br/><span style={{ color:accentL }}>Build.</span>
        </h1>

        <p style={{ fontSize:'clamp(1rem,1.7vw,1.2rem)', color:text2, lineHeight:1.6, maxWidth:560, margin:'0 0 32px' }}>
          The payment infrastructure for autonomous agents. Nanopayments, spending limits, and identity, in one wallet.
        </p>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, width:'100%', maxWidth:400 }}>

          {!showConnect && step === 'email' && (
            <>
              <button onClick={openConnect} style={{ width:'100%', background:accent, border:'none', color:'#fff', fontWeight:700, fontSize:'1.05rem', padding:19, borderRadius:100, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 8px 30px rgba(112,0,255,.35)' }}>
                Get Started
              </button>
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ fontSize:'.85rem', color:text3, cursor:'pointer', textDecoration:'none' }}>
                Need testnet tokens? Get some free.
              </a>
            </>
          )}

          {showConnect && step === 'email' && (
            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12, textAlign:'left' }}>
              <form onSubmit={sendOTP} style={{ display:'flex', background:inputBg, border:`1px solid ${border2}`, borderRadius:16, padding:'5px 5px 5px 18px' }}>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  autoFocus
                  style={{ flex:1, background:'none', border:'none', outline:'none', color:text, fontFamily:'Inter,sans-serif', fontSize:'.95rem', padding:'11px 0', minWidth:0 }}
                />
                <button type="submit" style={{ background:accent, border:'none', color:'#fff', fontWeight:600, fontSize:'.85rem', padding:'11px 20px', borderRadius:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Continue
                </button>
              </form>
              {error && <div style={{ fontSize:'.78rem', color:'#f87171', textAlign:'center' }}>{error}</div>}

              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ flex:1, height:1, background:border }}/>
                <span style={{ fontSize:'.75rem', color:text3 }}>or</span>
                <span style={{ flex:1, height:1, background:border }}/>
              </div>

              <button onClick={connectWallet} style={{ padding:13, borderRadius:14, background:inputBg2, border:`1px solid ${border}`, color:text, fontFamily:'Inter,sans-serif', fontWeight:500, fontSize:'.87rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="8" width="22" height="14" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><circle cx="18" cy="15" r="1" fill="currentColor"/></svg>
                Connect MetaMask / Rabby
              </button>

              <p style={{ fontSize:'.72rem', color:text3, display:'flex', alignItems:'center', justifyContent:'center', gap:5, margin:'2px 0 0' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Non-custodial. No seed phrase. Circle MPC.
              </p>

              <button onClick={() => setShowConnect(false)} style={{ background:'none', border:'none', color:text3, fontSize:'.8rem', cursor:'pointer', fontFamily:'Inter,sans-serif', margin:'2px auto 0' }}>
                ← Back
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:'.85rem', color:text2, textAlign:'center', marginBottom:4 }}>{info}</div>
              <form onSubmit={verifyOTP} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setError('') }}
                  autoFocus
                  style={{ width:'100%', padding:'14px 16px', borderRadius:14, border:`1px solid ${border2}`, background:inputBg, color:text, fontFamily:'Inter,monospace', fontSize:'1.6rem', letterSpacing:'10px', outline:'none', textAlign:'center' }}
                />
                {error && <div style={{ fontSize:'.78rem', color:'#f87171', textAlign:'center' }}>{error}</div>}
                <button type="submit" style={{ padding:13, borderRadius:14, background:accent, border:'none', color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'.95rem', cursor:'pointer' }}>
                  Verify Code
                </button>
              </form>
              <button onClick={() => { setStep('email'); setOtp(''); setError('') }} style={{ background:'none', border:'none', color:text3, fontSize:'.82rem', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                Back — use different email
              </button>
            </div>
          )}

        </div>
      </section>

      <style>{`@keyframes pulseDot{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
    </div>
  )
}
