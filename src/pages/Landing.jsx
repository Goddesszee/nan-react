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
  const accent   = '#4338CA'
  const accentL  = '#3B82F6'

  // sample ticker feed, agent to agent nanopayments
  const tickerRows = [
    { from:'agent_9180', to:'agent_2247', amt:'$0.0004' },
    { from:'agent_5521', to:'agent_1090', amt:'$0.0012' },
    { from:'agent_3387', to:'agent_8842', amt:'$0.0002' },
    { from:'agent_7710', to:'agent_4405', amt:'$0.0031' },
    { from:'agent_1123', to:'agent_6690', amt:'$0.0008' },
  ]

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
        <div style={{ width:44, height:44, borderRadius:'50%', background:'#4338CA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width={19} height={27}>
            <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill="#fff"/>
            <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill="#fff"/>
          </svg>
        </div>
        <span style={{ fontWeight:700, fontSize:'20px', color:text, fontFamily:'Inter, sans-serif', lineHeight:'44px' }}>NAN</span>
      </div>
      <div style={{ color:text, fontSize:'1rem', fontWeight:600 }}>{loadMsg}</div>
      <div style={{ display:'flex', gap:6 }}>
        {['#4338CA','#4338CA','#3B82F6'].map((c,i) => (
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:c, animation:`pulse 1s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )

  return (
    <div style={{ background:bg, color:text, fontFamily:'Inter,sans-serif', minHeight:'100vh', overflowX:'hidden' }}>

      {/* NAV */}
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

      {/* HERO */}
      <section style={{ minHeight:'auto', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'48px 24px 60px' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:9, fontSize:'.72rem', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:accentL, background:'rgba(112,0,255,.1)', border:'1px solid rgba(112,0,255,.28)', padding:'8px 18px', borderRadius:100, marginBottom:28 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:accentL, animation:'pulseDot 1.6s ease-in-out infinite' }}/>
          Live on Arc Testnet
        </div>

        <h1 style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(2.6rem,8vw,5.6rem)', fontWeight:800, lineHeight:1.02, letterSpacing:'-.035em', margin:'0 0 18px' }}>
          The trusted layer<br/>for <span style={{ color:accentL }}>everyday commerce.</span>
        </h1>

        <p style={{ fontSize:'clamp(1rem,1.7vw,1.2rem)', color:text2, lineHeight:1.6, maxWidth:560, margin:'0 0 32px' }}>
          One stablecoin wallet for people, businesses, and autonomous agents — send, swap, pay, and get paid, with zero gas fees.
        </p>

        <div style={{ width:'100%', maxWidth:640, margin:'0 0 40px', background:card, border:`1px solid ${border}`, borderRadius:16, overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', top:0, left:0, background:accent, color:'#fff', fontFamily:'Space Mono,monospace', fontSize:'.62rem', fontWeight:700, letterSpacing:'.08em', padding:'5px 12px', borderRadius:'0 0 8px 0', zIndex:2 }}>
            AGENT PAYMENTS · LIVE
          </div>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 22s linear infinite', padding:'26px 0 12px' }}>
            {[...tickerRows, ...tickerRows].map((row, i) => (
              <span key={i} style={{ fontFamily:'Space Mono,monospace', fontSize:'.8rem', color:text2, padding:'0 24px', borderRight:`1px solid ${border}`, display:'inline-flex', alignItems:'center', gap:7 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:accentL, flexShrink:0 }}/>
                {row.from} → {row.to} <b style={{ color:text }}>{row.amt}</b> USDC
              </span>
            ))}
          </div>
        </div>

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
                Noncustodial. No seed phrase. Circle MPC.
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
                Back, use a different email
              </button>
            </div>
          )}

        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:'80px 24px', maxWidth:1180, margin:'0 auto' }}>
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
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
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
            Rent a home, buy or sell, hire or get hired, run payroll, or let your agent handle it — all settled in stablecoins.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20 }}>
          {[
            { title:'Homes', desc:'Verified landlords, secure rent payments.' },
            { title:'Market', desc:'Buy and sell with built-in escrow.' },
            { title:'Gigs', desc:'Pre-funded jobs, milestone payments.' },
            { title:'Careers', desc:'Verified listings, AI resume tools.' },
            { title:'Payroll', desc:'Bulk pay your team, on time, every time.' },
            { title:'AI Assistant', desc:'One assistant across the whole ecosystem.' },
          ].map((p, i) => (
            <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:20, padding:'26px 22px' }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(67,56,202,.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:accent }}/>
              </div>
              <h4 style={{ fontSize:'1.02rem', fontWeight:700, marginBottom:6, color:text }}>{p.title}</h4>
              <p style={{ fontSize:'.85rem', color:text2, lineHeight:1.5, margin:0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:'0 24px 80px', maxWidth:1180, margin:'0 auto' }}>
        <div style={{ background:card, border:`1px solid ${border}`, borderRadius:28, padding:'70px 50px' }}>
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
        <button onClick={openConnect} style={{ background:accent, border:'none', color:'#fff', fontWeight:700, fontSize:'.98rem', padding:'16px 32px', borderRadius:100, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 8px 30px rgba(112,0,255,.35)' }}>
          Get started free
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#0a0a0a', color:'#b0b0b0', padding:'56px 24px 28px' }}>
        <div style={{ maxWidth:1180, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:'1.1rem', fontWeight:700, color:'#fff' }}>NAN</div>
          <div style={{ display:'flex', gap:28, fontSize:'.85rem' }}>
            <a href="#" style={{ color:'#b0b0b0' }}>Docs</a>
            <a href="#" style={{ color:'#b0b0b0' }}>GitHub</a>
            <a href="#" style={{ color:'#b0b0b0' }}>Twitter</a>
          </div>
          <div style={{ fontSize:'.78rem' }}>© 2026 NAN. Built on Arc Testnet.</div>
        </div>
      </footer>

      <style>{`@keyframes pulseDot{0%,100%{opacity:.4}50%{opacity:1}} @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  )
}
