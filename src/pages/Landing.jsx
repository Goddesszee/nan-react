import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../hooks/useTheme'

const API = 'https://nan-production.up.railway.app'

export function Landing({ onEmailConnect, onWalletConnect }) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme !== 'light'

  // responsive
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // OTP login state
  const [step, setStep] = useState('email') // email | otp | loading
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loadMsg, setLoadMsg] = useState('')
  const tokenRef = useRef(null)
  const expiryRef = useRef(null)

  // live stats
  const [liveStats, setLiveStats] = useState({ wallets: null, txns: null })
  useEffect(() => {
    fetch(`${API}/api/analytics`)
      .then(r => r.json())
      .then(d => { if (d && (d.wallets || d.transactions)) setLiveStats({ wallets: d.wallets || null, txns: d.transactions || null }) })
      .catch(() => {})
  }, [])

  // colors — exact match to app
  const bg      = dark ? '#111111' : '#fafafa'
  const surface = dark ? '#1a1a1a' : '#f4f4f4'
  const card    = dark ? '#1a1a1a' : '#ffffff'
  const border  = dark ? 'rgba(255,255,255,.07)' : '#e4e4e4'
  const border2 = dark ? 'rgba(255,255,255,.12)' : '#cccccc'
  const text    = dark ? '#ffffff' : '#1a1a1a'
  const text2   = dark ? '#a0a0a0' : '#555555'
  const text3   = dark ? '#555555' : '#999999'
  const accent  = '#7000ff'
  const accent3 = '#a855f7'
  const accent4 = '#c084fc'

  // ── OTP send ──────────────────────────────────────────────────
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
    } catch { setError('Network error — please retry'); setStep('email') }
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width="32" height="48" style={{flexShrink:0}}>
        <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill={accent}/>
        <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill={accent}/>
      </svg>
      <div style={{ color:text, fontSize:'1rem', fontWeight:600 }}>{loadMsg}</div>
      <div style={{ display:'flex', gap:6 }}>
        {['#7000ff','#9333ea','#c084fc'].map((c,i) => (
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:c, animation:`pulse 1s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )

  // ── Responsive helpers ────────────────────────────────────────
  const D = isDesktop

  return (
    <div style={{ background:bg, color:text, fontFamily:'Inter,sans-serif', minHeight:'100vh', overflowX:'hidden', position:'relative' }}>

      {/* Orbs */}
      <div style={{ position:'fixed', width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle,rgba(112,0,255,${dark?.15:.08}) 0%,transparent 70%)`, top:-200, left:-150, filter:'blur(80px)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', width:350, height:350, borderRadius:'50%', background:`radial-gradient(circle,rgba(168,85,247,${dark?.08:.04}) 0%,transparent 70%)`, bottom:-100, right:-100, filter:'blur(80px)', pointerEvents:'none', zIndex:0 }}/>

      {/* ── NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding: D ? '12px 48px' : '10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background: dark ? 'rgba(17,17,17,.85)' : 'rgba(250,250,250,.85)', backdropFilter:'blur(24px)', borderBottom:`1px solid ${border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap: D ? 8 : 7 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width={D?28:22} height={D?42:33} style={{flexShrink:0}}>
            <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill={accent}/>
            <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill={accent}/>
          </svg>
          <span style={{ fontWeight:800, fontSize: D ? '1.25rem' : '1.1rem', letterSpacing:'.02em', color:text }}>NAN</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Arc badge */}
          <div style={{ fontSize:'.68rem', fontWeight:500, letterSpacing:'.05em', background:`rgba(168,85,247,.08)`, border:`1px solid rgba(168,85,247,.3)`, color:accent3, borderRadius:100, padding:'4px 10px', display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:accent3, display:'inline-block', boxShadow:`0 0 5px ${accent3}` }}/>
            Arc Testnet
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{ background:'none', border:`1px solid ${border}`, borderRadius:9, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:text2, flexShrink:0 }}>
            {dark
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.36 5.64l1.41-1.41"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>


        </div>
      </nav>

      {/* ── DIRECT CONNECT ── */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding: D ? '130px 48px 80px' : '100px 20px 60px' }}>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width={D?34:28} height={D?51:42} style={{flexShrink:0}}>
            <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill={accent}/>
            <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill={accent}/>
          </svg>
          <span style={{ fontWeight:800, fontSize: D ? '1.6rem' : '1.35rem', letterSpacing:'.02em', color:text }}>NAN</span>
        </div>

        <h1 style={{ fontSize: D ? '2rem' : '1.5rem', fontWeight:800, lineHeight:1.15, letterSpacing:'-.02em', marginBottom:32 }}>
          Connect your wallet
        </h1>

        {/* ── LOGIN FORM ── */}
        <div style={{ width:'100%', maxWidth: D ? 440 : 360, display:'flex', flexDirection:'column', gap:10 }}>

          {step === 'email' && (
            <>
              <form onSubmit={sendOTP} style={{ display:'flex', flexDirection: D ? 'row' : 'column', gap: D ? 0 : 10, background: D ? (dark?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)') : 'none', border: D ? `1px solid ${border2}` : 'none', borderRadius: D ? 16 : 0, padding: D ? '5px 5px 5px 18px' : 0, transition:'border-color .2s' }}>
                <input
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  style={{ flex:1, background: D ? 'none' : (dark?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)'), border: D ? 'none' : `1px solid ${border2}`, outline:'none', color:text, fontFamily:'Inter,sans-serif', fontSize:'.95rem', padding: D ? '10px 0' : '13px 16px', borderRadius: D ? 0 : 14, minWidth:0 }}
                />
                <button type="submit" style={{ background:accent, border:'none', color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'.9rem', padding: D ? '10px 22px' : '13px', borderRadius: D ? 12 : 14, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                  Get Started
                </button>
              </form>
              {error && <div style={{ fontSize:'.78rem', color:'#f87171', textAlign:'center' }}>{error}</div>}

              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ flex:1, height:1, background:border }}/>
                <span style={{ fontSize:'.78rem', color:text3 }}>or</span>
                <span style={{ flex:1, height:1, background:border }}/>
              </div>

              <button onClick={connectWallet} style={{ padding:13, borderRadius:14, background: dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)', border:`1px solid ${border}`, color:text, fontFamily:'Inter,sans-serif', fontWeight:500, fontSize:'.9rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="8" width="22" height="14" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><circle cx="18" cy="15" r="1" fill="currentColor"/></svg>
                Connect MetaMask / Rabby
              </button>

              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ padding:13, borderRadius:14, background:accent, border:'none', color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'.9rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, textDecoration:'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v6m0 0c0-3.31 2.69-6 6-6"/><path d="M5.07 11a7 7 0 1 0 13.86 0"/><path d="M12 8v13"/><path d="M9 18l3 3 3-3"/></svg>
                Get Free Testnet Tokens
              </a>

              <p style={{ fontSize:'.72rem', color:text3, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Non-custodial · No seed phrase · Circle MPC
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
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
                  style={{ width:'100%', padding:'14px 16px', borderRadius:14, border:`1px solid ${border2}`, background: dark?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)', color:text, fontFamily:'Inter,monospace', fontSize:'1.6rem', letterSpacing:'10px', outline:'none', textAlign:'center' }}
                />
                {error && <div style={{ fontSize:'.78rem', color:'#f87171', textAlign:'center' }}>{error}</div>}
                <button type="submit" style={{ padding:13, borderRadius:14, background:accent, border:'none', color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'.95rem', cursor:'pointer' }}>
                  Verify Code
                </button>
              </form>
              <button onClick={() => { setStep('email'); setOtp(''); setError('') }} style={{ background:'none', border:'none', color:text3, fontSize:'.82rem', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                Back — use different email
              </button>
            </>
          )}

        </div>
      </section>

    </div>
  )
}

/* ── Layout helpers ── */
function Sec({children, D, border, bg, tight}) {
  return (
    <section style={{ position:'relative', zIndex:1, padding: tight ? (D?'0 48px 80px':'0 20px 56px') : (D?'80px 48px':'56px 20px'), maxWidth: D ? 1100 : 680, margin:'0 auto', width:'100%' }}>
      {children}
    </section>
  )
}
function Tag({children, color}) {
  return <div style={{ fontSize:'.68rem', fontWeight:500, letterSpacing:'.12em', textTransform:'uppercase', color, marginBottom:10 }}>{children}</div>
}
function H2({children, text, D, tight}) {
  return <h2 style={{ fontWeight:700, fontSize: D ? 'clamp(1.7rem,3vw,2.3rem)' : 'clamp(1.4rem,5vw,1.9rem)', lineHeight:1.12, letterSpacing:'-.025em', marginBottom: tight ? 24 : 40, color:text }}>{children}</h2>
}

/* ── SVG Icons ── */
const ic = (path) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7000ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
const ArrowUp  = () => ic(<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>)
const SwapIco  = () => ic(<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>)
const BridgeIco= () => ic(<><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M5 9v3h14V9"/><path d="M12 12v3"/></>)
const EarnIco  = () => ic(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>)
const BotIco   = () => ic(<><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></>)
const TargetIco= () => ic(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>)
const ClockIco = () => ic(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)
const UsersIco = () => ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>)
const LinkIco  = () => ic(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>)
const TagIco   = () => ic(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>)
const LayersIco= () => ic(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>)
const GlobeIco = () => ic(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>)
const NairaIco = () => ic(<><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><line x1="8" y1="12" x2="16" y2="12"/></>)
const AjoIco   = () => ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="19" cy="3" r="2"/></>)
const BillIco  = () => ic(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>)
const ZapIco   = () => ic(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>)



