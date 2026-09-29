import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../hooks/useTheme'

const API = ''
const LOGO_FONT_LINK = 'https://fonts.googleapis.com/css2?family=Manrope:wght@800&family=Space+Grotesk:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap'

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
  const { theme, toggleTheme } = useTheme()
  const dark = theme !== 'light'

  // Hero slideshow
  const [slide, setSlide] = useState(0)
  const [imgLoaded, setImgLoaded] = useState([false, false])
  const slideTimer = useRef(null)

  const resetSlideTimer = () => {
    if (slideTimer.current) clearInterval(slideTimer.current)
    slideTimer.current = setInterval(() => setSlide(c => (c + 1) % HERO_SLIDES.length), 5000)
  }
  useEffect(() => { resetSlideTimer(); return () => clearInterval(slideTimer.current) }, [])

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

  // Manrope ExtraBold is used only for the NAN wordmark, per the design system
  useEffect(() => {
    if (document.getElementById('nan-logo-font')) return
    const link = document.createElement('link')
    link.id = 'nan-logo-font'
    link.rel = 'stylesheet'
    link.href = LOGO_FONT_LINK
    document.head.appendChild(link)
  }, [])
  const logoFont = "'Manrope', 'Inter', sans-serif"

  // colors, monochrome base with a single purple accent, both themes
  const bg       = dark ? '#000000' : '#ffffff'
  const card     = dark ? '#161616' : '#f7f7f7'
  const border   = dark ? 'rgba(255,255,255,.14)' : '#e4e4e4'
  const border2  = dark ? 'rgba(255,255,255,.22)' : '#cccccc'
  const text     = dark ? '#ffffff' : '#0a0a0a'
  const text2    = dark ? '#a0a0a0' : '#555555'
  const text3    = dark ? '#555555' : '#999999'
  const inputBg  = dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'
  const inputBg2 = dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'
  const accent   = '#2563EB'
  const accentL  = '#2563EB'
  const brandGradient = 'linear-gradient(135deg, #2563EB 0%, #2563EB 50%, #2563EB 100%)'

  // OTP send
  // Open the connect panel and scroll straight to the email input
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

  // OTP verify
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

  // Wallet connect
  async function connectWallet() {
    setStep('loading'); setLoadMsg('Connecting wallet…'); setError('')
    try {
      await onWalletConnect()
    } catch(e) { setError(e.message?.slice(0, 80) || 'Connection failed'); setStep('email') }
  }

  // Loading screen
  if (step === 'loading') return (
    <div style={{ minHeight:'100vh', background:bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:brandGradient, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width={19} height={27}>
            <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill="#fff"/>
            <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill="#fff"/>
          </svg>
        </div>
        <span style={{ fontWeight:800, fontSize:'20px', color:text, fontFamily:logoFont, lineHeight:'44px' }}>NAN</span>
      </div>
      <div style={{ color:text, fontSize:'1rem', fontWeight:600 }}>{loadMsg}</div>
      <div style={{ display:'flex', gap:6 }}>
        {['#2563EB','#2563EB','#2563EB'].map((c,i) => (
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:c, animation:`pulse 1s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )

  return (
    <div style={{ background:bg, color:text, fontFamily:'Inter,sans-serif', minHeight:'100vh', overflowX:'hidden' }}>

      {/* ── REVOLUT-STYLE HERO ── */}
      <section style={{ position:'relative', height:'100dvh', minHeight:600, overflow:'hidden' }}>

        {/* Full-bleed photo slides */}
        {HERO_SLIDES.map((s, i) => (
          <div key={i} style={{ position:'absolute', inset:0, opacity: slide === i ? 1 : 0, transition:'opacity 1s ease', zIndex:0 }}>
            <div style={{ position:'absolute', inset:0, background:s.fallback }} />
            <img
              src={s.img} alt=""
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', opacity: imgLoaded[i] ? 1 : 0, transition:'opacity 0.6s ease' }}
              onLoad={() => setImgLoaded(prev => { const n=[...prev]; n[i]=true; return n })}
            />
          </div>
        ))}

        {/* Gradient overlay: dark top + dark bottom, clear in the middle */}
        <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0) 28%,rgba(0,0,0,0) 50%,rgba(0,0,0,0.72) 78%,rgba(0,0,0,0.93) 100%)', pointerEvents:'none' }} />

        {/* UI layer */}
        <div style={{ position:'absolute', inset:0, zIndex:2, display:'flex', flexDirection:'column' }}>

          {/* Nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'52px 28px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(37,99,235,0.5)' }}>
                <svg viewBox="0 0 324 480" width="14" height="20"><path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill="#fff"/><path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill="#fff"/></svg>
              </div>
              <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:20, color:'#fff', letterSpacing:'-0.03em' }}>NAN</span>
            </div>
            <button onClick={openConnect} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:100, padding:'9px 20px', color:'#fff', fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>
              Log in
            </button>
          </div>

          {/* Spacer */}
          <div style={{ flex:1 }} />

          {/* Headline — slides in/out per slide */}
          <div style={{ padding:'0 28px 24px', position:'relative', minHeight:100 }}>
            {HERO_SLIDES.map((s, i) => (
              <div key={i} style={{ position: i===0 ? 'relative' : 'absolute', bottom: i!==0 ? 24 : undefined, left: i!==0 ? 28 : undefined, right: i!==0 ? 28 : undefined, opacity: slide===i ? 1 : 0, transform: slide===i ? 'translateY(0)' : 'translateY(14px)', transition:'opacity 0.55s ease, transform 0.55s ease', pointerEvents: slide===i ? 'auto' : 'none' }}>
                <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(34px,10vw,52px)', color:'#fff', letterSpacing:'-0.035em', lineHeight:1.05, margin:'0 0 12px', whiteSpace:'pre-line', textShadow:'0 2px 16px rgba(0,0,0,0.4)' }}>
                  {s.headline}
                </h1>
                <p style={{ fontSize:16, lineHeight:1.5, color:'rgba(255,255,255,0.78)', margin:0, fontWeight:400, fontFamily:"'DM Sans',sans-serif" }}>
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
          <div style={{ background:'rgba(0,0,0,0.72)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.08)', padding:'20px 24px 40px', display:'flex', flexDirection:'column', gap:12 }}>

            {!showConnect && step === 'email' && (
              <>
                <button onClick={openConnect} style={{ width:'100%', padding:'18px 0', background:'#fff', color:'#000', border:'none', borderRadius:100, fontSize:17, fontWeight:600, fontFamily:"'DM Sans',sans-serif", letterSpacing:'-0.01em', cursor:'pointer' }}>
                  Get started — it's free
                </button>
                <button onClick={openConnect} style={{ width:'100%', padding:'18px 0', background:'rgba(255,255,255,0.14)', color:'#fff', border:'none', borderRadius:100, fontSize:17, fontWeight:500, fontFamily:"'DM Sans',sans-serif", letterSpacing:'-0.01em', cursor:'pointer', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>
                  I already have an account
                </button>
              </>
            )}

            {showConnect && step === 'email' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <form onSubmit={sendOTP} style={{ display:'flex', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'5px 5px 5px 18px' }}>
                  <input
                    ref={emailInputRef}
                    type="email"
                    placeholder="Enter your email..."
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    autoFocus
                    style={{ flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontFamily:'Inter,sans-serif', fontSize:'.95rem', padding:'11px 0', minWidth:0 }}
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
                <button onClick={connectWallet} style={{ padding:13, borderRadius:14, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:500, fontSize:'.87rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="8" width="22" height="14" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><circle cx="18" cy="15" r="1" fill="currentColor"/></svg>
                  Connect MetaMask / Rabby
                </button>
                <p style={{ fontSize:'.72rem', color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:5, margin:'2px 0 0' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Noncustodial. No seed phrase. Circle MPC.
                </p>
                <button onClick={() => setShowConnect(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'.8rem', cursor:'pointer', fontFamily:'Inter,sans-serif', margin:'2px auto 0' }}>
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
                    style={{ width:'100%', padding:'14px 16px', borderRadius:14, border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.1)', color:'#fff', fontFamily:'Inter,monospace', fontSize:'1.6rem', letterSpacing:'10px', outline:'none', textAlign:'center', boxSizing:'border-box' }}
                  />
                  {error && <div style={{ fontSize:'.78rem', color:'#f87171', textAlign:'center' }}>{error}</div>}
                  <button type="submit" style={{ padding:13, borderRadius:14, background:'#2563EB', border:'none', color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'.95rem', cursor:'pointer' }}>
                    Verify Code
                  </button>
                </form>
                <button onClick={() => { setStep('email'); setOtp(''); setError('') }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'.82rem', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                  Back, use a different email
                </button>
              </div>
            )}

            <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.25)', margin:'4px 0 0', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.03em' }}>
              Powered by Arc · Circle USDC · Testnet
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="nan-landing-features" style={{ padding:'80px 24px', maxWidth:1180, margin:'0 auto' }}>
        <div style={{ maxWidth:620, margin:'0 auto 48px', textAlign:'center' }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:'.76rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:text3, marginBottom:14 }}>
            Why NAN
          </div>
          <h2 style={{ fontFamily:'Inter,sans-serif', fontSize:'2.3rem', fontWeight:700, letterSpacing:'-.02em', lineHeight:1.15, color:text, margin:0 }}>
            Everything an agent needs to transact
          </h2>
          <p style={{ color:text2, fontSize:'1.02rem', marginTop:14 }}>
            One wallet that handles identity, limits, and settlement, so your agent can act without a human in the loop.
          </p>
        </div>
        <div className="nan-landing-features-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {[
            { n:'01', title:'Nanopayments', desc:'Send fractions of a cent between agents with x402, settled onchain in under a second.' },
            { n:'02', title:'Spending limits', desc:'Set hard caps per agent, per task, or per counterparty. No surprise drains, ever.' },
            { n:'03', title:'Agent identity', desc:'Every agent gets a verifiable onchain identity, so counterparties know exactly who they are paying.' },
            { n:'04', title:'Escrow built in', desc:'Funds release only when both sides confirm the task is done. No trust required.' },
            { n:'05', title:'Multi currency', desc:'Hold and swap USDC and EURC natively, with settlement in whichever your agent needs.' },
            { n:'06', title:'Full audit trail', desc:'Every agent to agent transaction is logged and queryable. Nothing happens in the dark.' },
          ].map((f, i) => (
            <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:20, padding:'32px 28px', boxShadow: dark ? '0 1px 0 rgba(255,255,255,.03) inset' : 'none' }}>
              <div style={{ fontFamily:'Space Mono,monospace', fontSize:'.75rem', color:text3, marginBottom:18 }}>{f.n}</div>
              <h4 style={{ fontSize:'1.15rem', fontWeight:700, marginBottom:10, color:text }}>{f.title}</h4>
              <p style={{ fontSize:'.92rem', color:text2, lineHeight:1.6, margin:0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section style={{ padding:'0 24px 80px', maxWidth:1180, margin:'0 auto' }}>
        <div style={{ maxWidth:620, margin:'0 auto 48px', textAlign:'center' }}>
          <div style={{ fontFamily:'Inter,monospace', fontSize:'.76rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:text3, marginBottom:14 }}>
            One ecosystem
          </div>
          <h2 style={{ fontFamily:'Inter,sans-serif', fontSize:'2.3rem', fontWeight:700, letterSpacing:'-.02em', lineHeight:1.15, color:text, margin:0 }}>
            Everything runs on one wallet
          </h2>
          <p style={{ color:text2, fontSize:'1.02rem', marginTop:14 }}>
            Buy or sell, post or take gigs, run payroll, or let your agent handle it. All settled in stablecoins.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20 }}>
          {[
            { title:'Market', desc:'Buy and sell with built-in escrow.' },
            { title:'Gigs', desc:'Pre-funded jobs, milestone payments.' },
            { title:'Payroll', desc:'Bulk pay your team, on time, every time.' },
            { title:'AI Assistant', desc:'One assistant across the whole ecosystem.' },
          ].map((p, i) => (
            <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:20, padding:'26px 22px' }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(37,99,235,.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:accent }}/>
              </div>
              <h4 style={{ fontSize:'1.02rem', fontWeight:700, marginBottom:6, color:text }}>{p.title}</h4>
              <p style={{ fontSize:'.85rem', color:text2, lineHeight:1.5, margin:0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding:'0 24px 80px', maxWidth:1180, margin:'0 auto' }}>
        <div style={{ background:card, border:`1px solid ${border}`, borderRadius:24, padding:'70px 50px' }}>
          <div style={{ maxWidth:620, margin:'0 auto 48px', textAlign:'center' }}>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:'.76rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:accentL, marginBottom:14 }}>
              How it works
            </div>
            <h2 style={{ fontFamily:'Inter,sans-serif', fontSize:'2.3rem', fontWeight:700, letterSpacing:'-.02em', lineHeight:1.15, color:text, margin:0 }}>
              From task to settlement, no human required
            </h2>
            <p style={{ color:text2, fontSize:'1.02rem', marginTop:14 }}>
              Your agent handles the whole exchange. You just set the limits.
            </p>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            {[
              { n:'1', title:'Agent gets a wallet', desc:'Provisioned instantly, funded with a spending limit you set.' },
              { n:'2', title:'Agent finds a service', desc:'It discovers another agent or API that can complete its task.' },
              { n:'3', title:'Payment is quoted', desc:'The counterparty responds with a price via the x402 protocol.' },
              { n:'4', title:'Funds settle instantly', desc:'Payment clears onchain, the task completes, and it is all logged.' },
            ].map((s, i) => (
              <div key={i} style={{ flex:1, minWidth:150 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:inputBg2, border:`1px solid ${border2}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Mono,monospace', fontWeight:700, fontSize:'.9rem', marginBottom:16, color:accentL }}>
                  {s.n}
                </div>
                <h5 style={{ fontSize:'.98rem', fontWeight:700, marginBottom:6, color:text }}>{s.title}</h5>
                <p style={{ fontSize:'.82rem', color:text2, lineHeight:1.5, margin:0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section style={{ textAlign:'center', padding:'100px 24px' }}>
        <h2 style={{ fontFamily:'Inter,sans-serif', fontSize:'2.6rem', fontWeight:700, letterSpacing:'-.02em', marginBottom:16, color:text }}>
          Let your agents handle it.
        </h2>
        <p style={{ color:text2, fontSize:'1.05rem', marginBottom:36 }}>
          Set up a wallet in minutes. Your agent does the rest.
        </p>
        <button onClick={openConnect} style={{ background:brandGradient, border:'none', color:'#fff', fontWeight:700, fontSize:'.98rem', padding:'16px 32px', borderRadius:12, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 8px 30px rgba(37,99,235,.35)' }}>
          Get started free
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#0a0a0a', color:'#b0b0b0', padding:'56px 24px 28px' }}>
        <div style={{ maxWidth:1180, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
          <div style={{ fontFamily:logoFont, fontSize:'1.1rem', fontWeight:800, color:'#fff' }}>NAN</div>
          <div style={{ display:'flex', gap:28, fontSize:'.85rem' }}>
            <a href="#" style={{ color:'#b0b0b0' }}>Docs</a>
            <a href="#" style={{ color:'#b0b0b0' }}>GitHub</a>
            <a href="#" style={{ color:'#b0b0b0' }}>Twitter</a>
          </div>
          <div className="nan-landing-footer-social" style={{ display:'none', gap:12 }}>
            <a href="https://x.com/nan_arc" target="_blank" rel="noopener noreferrer" title="NAN on X" style={{ width:34, height:34, borderRadius:'50%', border:'1px solid #2a2a2a', background:'#151515', display:'flex', alignItems:'center', justifyContent:'center', color:'#b0b0b0', textDecoration:'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://x.com/zarafatoluu" target="_blank" rel="noopener noreferrer" title="Founder on X" style={{ width:34, height:34, borderRadius:'50%', border:'1px solid #2a2a2a', background:'#151515', display:'flex', alignItems:'center', justifyContent:'center', color:'#b0b0b0', textDecoration:'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
          <div style={{ fontSize:'.78rem' }}>© 2026 NAN. Built on Arc Testnet.</div>
        </div>
      </footer>

      <style>{`
        @keyframes pulseDot{0%,100%{opacity:.4}50%{opacity:1}} @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @media (max-width:640px){
          /* Nav was cramming logo + 2 social icons + Connect Wallet + theme
             toggle into one row on phones, causing everything to overlap.
             Move the social icons down to the footer instead. */
          .nan-landing-nav{ padding:16px 20px !important; }
          .nan-landing-logo{ margin-right:auto !important; padding-left:2px !important; }
          .nan-landing-social{ display:none !important; }
          .nan-landing-footer-social{ display:flex !important; order:-1; width:100%; justify-content:center; margin-bottom:8px; }
          /* Theme toggle moved out of the nav to a floating button in the
             body, so Connect Wallet now sits alone on the right. */
          .nan-landing-toggle{ display:none !important; }
          .nan-landing-toggle-body{ display:flex !important; }
          /* Tighten the gap before "Why NAN" so it isn't pushed so far down */
          .nan-landing-hero{ padding-bottom:20px !important; }
          .nan-landing-features{ padding:24px 24px 64px !important; }
          /* The 3-up feature card grid left each card ~130-190px wide on a
             phone, wrapping every line of copy and making cards look
             broken/cut off. Stack to one column. */
          .nan-landing-features-grid{ grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  )
}
