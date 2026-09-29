import { useState, useEffect, useRef } from 'react'

const API = ''

const HERO_SLIDES = [
  {
    img: '/assets/hero-1.jpg',
    fallback: 'linear-gradient(160deg,#e8e0f0 0%,#c0cfe8 100%)',
    headline: 'Send money\nto anyone.',
    sub: 'Instant USDC transfers on Arc. No fees, no waiting.',
  },
  {
    img: '/assets/hero-2.jpg',
    fallback: 'linear-gradient(160deg,#dce8f5 0%,#b8d4f0 100%)',
    headline: 'Your AI agent\nshops for you.',
    sub: 'Set spending limits. Let Nan find the best deals.',
  },
]

export function Landing({ onEmailConnect, onWalletConnect }) {
  // Hero slideshow
  const [slide, setSlide] = useState(0)
  const [imgLoaded, setImgLoaded] = useState([false, false])
  const slideTimer = useRef(null)

  const resetSlideTimer = () => {
    if (slideTimer.current) clearInterval(slideTimer.current)
    slideTimer.current = setInterval(() => setSlide(c => (c + 1) % HERO_SLIDES.length), 5000)
  }
  useEffect(() => { resetSlideTimer(); return () => clearInterval(slideTimer.current) }, [])

  // OTP / auth state
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

  // Font injection
  useEffect(() => {
    if (document.getElementById('nan-hero-fonts')) return
    const link = document.createElement('link')
    link.id = 'nan-hero-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])

  function openConnect() {
    setShowConnect(true)
    setTimeout(() => { emailInputRef.current?.focus() }, 60)
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

  async function verifyOTP(e) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the 6 digit code'); return }
    setStep('loading'); setLoadMsg('Verifying code…'); setError('')
    try {
      const r = await fetch(`${API}/api/otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, otp, token: tokenRef.current, expiresAt: expiryRef.current }),
      })
      const d = await r.json()
      if (!d.success) { setError(d.error || 'Invalid code'); setStep('otp'); return }
      if (d.sessionToken) localStorage.setItem('nan_session_token', d.sessionToken)
      setLoadMsg('Setting up your wallet…')
      await onEmailConnect(email)
    } catch(e) { setError(e.message || 'Error'); setStep('otp') }
  }

  async function connectWallet() {
    setStep('loading'); setLoadMsg('Connecting wallet…'); setError('')
    try {
      await onWalletConnect()
    } catch(e) { setError(e.message?.slice(0, 80) || 'Connection failed'); setStep('email') }
  }

  // Loading screen
  if (step === 'loading') return (
    <div style={{ position:'fixed', inset:0, background:'#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(37,99,235,0.5)' }}>
          <svg viewBox="0 0 324 480" width="16" height="22"><path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill="#fff"/><path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill="#fff"/></svg>
        </div>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:22, color:'#fff', letterSpacing:'-0.03em' }}>NAN</span>
      </div>
      <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'1rem', fontWeight:500 }}>{loadMsg}</div>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', animation:`pulse 1s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, fontFamily:"'DM Sans',sans-serif", overflow:'hidden' }}>

      {/* ── Full-bleed photo slides ── */}
      {HERO_SLIDES.map((s, i) => (
        <div key={i} style={{ position:'absolute', inset:0, opacity: slide===i ? 1 : 0, transition:'opacity 1s ease', zIndex:0 }}>
          <div style={{ position:'absolute', inset:0, background:s.fallback }} />
          <img
            src={s.img} alt=""
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', opacity: imgLoaded[i] ? 1 : 0, transition:'opacity 0.6s ease' }}
            onLoad={() => setImgLoaded(prev => { const n=[...prev]; n[i]=true; return n })}
          />
        </div>
      ))}

      {/* Gradient: dark top, clear middle, dark bottom */}
      <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(180deg,rgba(0,0,0,0.52) 0%,rgba(0,0,0,0) 28%,rgba(0,0,0,0) 50%,rgba(0,0,0,0.72) 78%,rgba(0,0,0,0.93) 100%)', pointerEvents:'none' }} />

      {/* UI layer */}
      <div style={{ position:'absolute', inset:0, zIndex:2, display:'flex', flexDirection:'column' }}>

        {/* Logo only — no login button */}
        <div style={{ padding:'52px 28px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(37,99,235,0.5)' }}>
              <svg viewBox="0 0 324 480" width="14" height="20"><path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill="#fff"/><path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill="#fff"/></svg>
            </div>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:20, color:'#fff', letterSpacing:'-0.03em' }}>NAN</span>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex:1 }} />

        {/* Headline per slide */}
        <div style={{ padding:'0 28px 24px', position:'relative', minHeight:110 }}>
          {HERO_SLIDES.map((s, i) => (
            <div key={i} style={{ position: i===0 ? 'relative' : 'absolute', bottom: i!==0 ? 24 : undefined, left: i!==0 ? 28 : undefined, right: i!==0 ? 28 : undefined, opacity: slide===i ? 1 : 0, transform: slide===i ? 'translateY(0)' : 'translateY(14px)', transition:'opacity 0.55s ease, transform 0.55s ease', pointerEvents: slide===i ? 'auto' : 'none' }}>
              <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(34px,10vw,52px)', color:'#fff', letterSpacing:'-0.035em', lineHeight:1.05, margin:'0 0 12px', whiteSpace:'pre-line', textShadow:'0 2px 16px rgba(0,0,0,0.4)' }}>
                {s.headline}
              </h1>
              <p style={{ fontSize:16, lineHeight:1.5, color:'rgba(255,255,255,0.78)', margin:0, fontWeight:400 }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div style={{ display:'flex', gap:6, justifyContent:'center', paddingBottom:20 }}>
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setSlide(i); resetSlideTimer() }} style={{ width: slide===i ? 28 : 8, height:8, borderRadius:4, background: slide===i ? '#fff' : 'rgba(255,255,255,0.38)', border:'none', cursor:'pointer', padding:0, transition:'all 0.3s ease' }} />
          ))}
        </div>

        {/* CTA bar */}
        <div style={{ background:'rgba(0,0,0,0.72)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.08)', padding:'20px 24px 44px', display:'flex', flexDirection:'column', gap:12 }}>

          {!showConnect && step === 'email' && (
            <>
              <button onClick={openConnect} style={{ width:'100%', padding:'18px 0', background:'#fff', color:'#000', border:'none', borderRadius:100, fontSize:17, fontWeight:600, fontFamily:"'DM Sans',sans-serif", letterSpacing:'-0.01em', cursor:'pointer' }}>
                Get started — it's free
              </button>
              <button onClick={openConnect} style={{ width:'100%', padding:'18px 0', background:'rgba(255,255,255,0.13)', color:'#fff', border:'none', borderRadius:100, fontSize:17, fontWeight:500, fontFamily:"'DM Sans',sans-serif", letterSpacing:'-0.01em', cursor:'pointer', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>
                I already have an account
              </button>
            </>
          )}

          {showConnect && step === 'email' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <form onSubmit={sendOTP} style={{ display:'flex', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'5px 5px 5px 18px' }}>
                <input
                  ref={emailInputRef}
                  type="email" placeholder="Enter your email..."
                  value={email} onChange={e => { setEmail(e.target.value); setError('') }} autoFocus
                  style={{ flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontFamily:"'DM Sans',sans-serif", fontSize:'.95rem', padding:'11px 0', minWidth:0 }}
                />
                <button type="submit" style={{ background:'#2563EB', border:'none', color:'#fff', fontWeight:600, fontSize:'.85rem', padding:'11px 20px', borderRadius:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Continue
                </button>
              </form>
              {error && <div style={{ fontSize:'.78rem', color:'#f87171', textAlign:'center' }}>{error}</div>}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ flex:1, height:1, background:'rgba(255,255,255,0.15)' }}/>
                <span style={{ fontSize:'.75rem', color:'rgba(255,255,255,0.4)' }}>or</span>
                <span style={{ flex:1, height:1, background:'rgba(255,255,255,0.15)' }}/>
              </div>
              <button onClick={connectWallet} style={{ padding:13, borderRadius:14, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:'.87rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="8" width="22" height="14" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><circle cx="18" cy="15" r="1" fill="currentColor"/></svg>
                Connect MetaMask / Rabby
              </button>
              <p style={{ fontSize:'.72rem', color:'rgba(255,255,255,0.32)', display:'flex', alignItems:'center', justifyContent:'center', gap:5, margin:'2px 0 0' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Noncustodial. No seed phrase. Circle MPC.
              </p>
              <button onClick={() => setShowConnect(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.38)', fontSize:'.8rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", margin:'2px auto 0' }}>
                ← Back
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:'.85rem', color:'rgba(255,255,255,0.7)', textAlign:'center', marginBottom:4 }}>{info}</div>
              <form onSubmit={verifyOTP} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <input
                  type="text" inputMode="numeric" placeholder="123456" maxLength={6}
                  value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setError('') }} autoFocus
                  style={{ width:'100%', padding:'14px 16px', borderRadius:14, border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.1)', color:'#fff', fontFamily:'monospace', fontSize:'1.6rem', letterSpacing:'10px', outline:'none', textAlign:'center', boxSizing:'border-box' }}
                />
                {error && <div style={{ fontSize:'.78rem', color:'#f87171', textAlign:'center' }}>{error}</div>}
                <button type="submit" style={{ padding:13, borderRadius:14, background:'#2563EB', border:'none', color:'#fff', fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'.95rem', cursor:'pointer' }}>
                  Verify Code
                </button>
              </form>
              <button onClick={() => { setStep('email'); setOtp(''); setError('') }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.38)', fontSize:'.82rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                Back, use a different email
              </button>
            </div>
          )}

          <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.22)', margin:'4px 0 0', letterSpacing:'0.03em' }}>
            Powered by Arc · Circle USDC · Testnet
          </p>
        </div>
      </div>
    </div>
  )
}
