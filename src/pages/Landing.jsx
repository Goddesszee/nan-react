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
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding: D ? '14px 48px' : '12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background: dark ? 'rgba(17,17,17,.85)' : 'rgba(250,250,250,.85)', backdropFilter:'blur(24px)', borderBottom:`1px solid ${border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width="23" height="34" style={{flexShrink:0}}>
            <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill={accent}/>
            <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill={accent}/>
          </svg>
          <span style={{ fontWeight:700, fontSize:'.95rem', color:text }}>NAN</span>
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

      {/* ── HERO ── */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding: D ? '130px 48px 80px' : '100px 20px 60px' }}>

        {/* Live pill */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)', border:`1px solid ${border2}`, borderRadius:100, padding:'6px 14px', fontSize:'.7rem', fontWeight:500, letterSpacing:'.07em', color:text2, marginBottom:28 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#00e5a0', boxShadow:'0 0 8px #00e5a0', display:'inline-block', animation:'pd 2s ease infinite' }}/>
          LIVE ON ARC TESTNET
        </div>
        <style>{`@keyframes pd{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

        <h1 style={{ fontSize: D ? 'clamp(3rem,5vw,5.2rem)' : 'clamp(2.4rem,8vw,3.6rem)', fontWeight:800, lineHeight:1.04, letterSpacing:'-.035em', marginBottom:20 }}>
          Payments<br/>
          Without{' '}
          <span style={{ background:'linear-gradient(135deg,#a855f7,#7000ff 45%,#3b82f6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Borders.</span>
        </h1>

        <p style={{ fontSize: D ? '1.1rem' : '.95rem', fontWeight:300, color:text2, maxWidth: D ? 520 : 380, lineHeight:1.7, marginBottom:36 }}>
          The complete stablecoin wallet on Arc. Send, swap, bridge and earn with USDC and EURC. Zero gas fees. Powered by Circle.
        </p>

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

      {/* ── STATS ── */}
      <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns: D ? 'repeat(4,1fr)' : 'repeat(2,1fr)', borderTop:`1px solid ${border}`, borderBottom:`1px solid ${border}`, background: dark?'rgba(255,255,255,.02)':'rgba(0,0,0,.02)' }}>
        {[
          {v:'$0',    l:'Gas fees ever',   g:true},
          {v:'<1s',   l:'Settlement time'},
          {v:'4.80%', l:'APY on USDC'},
          {v:'6',     l:'Chains supported'},
        ].map((st,i) => (
          <div key={i} style={{ padding: D ? '24px 16px' : '20px 12px', textAlign:'center', borderRight: D ? (i<3?`1px solid ${border}`:'none') : ([0,2].includes(i)?`1px solid ${border}`:'none'), borderBottom: !D && i<2 ? `1px solid ${border}` : 'none' }}>
            <div style={{ fontWeight:700, fontSize: D ? '1.6rem' : '1.4rem', color: st.g ? '#00e5a0' : text, marginBottom:4 }}>{st.v}</div>
            <div style={{ fontSize:'.68rem', color:text3, letterSpacing:'.05em', textTransform:'uppercase' }}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* ── CORE FEATURES ── */}
      <Sec D={D} border={border} bg={bg}>
        <Tag color={accent3}>Core features</Tag>
        <H2 text={text} D={D}>Everything stablecoin,<br/>in one wallet</H2>
        <div style={{ display: D ? 'grid' : 'flex', gridTemplateColumns: D ? 'repeat(2,1fr)' : undefined, flexDirection: D ? undefined : 'column', gap: D ? 16 : 12 }}>
          {[
            { Icon:ArrowUp,   title:'Send',          badge:'Zero gas',    bG:true,  desc:'Transfer USDC and EURC to any wallet or .arc name instantly. Use human-readable names like zara.arc instead of 0x addresses.' },
            { Icon:SwapIco,   title:'Swap',          badge:'Live FX',     bG:true,  desc:'Exchange USDC and EURC at live Frankfurt ECB rates via NANSwap. Set limit orders that execute automatically at your target rate.' },
            { Icon:BridgeIco, title:'Bridge',        badge:'CCTP V2',     bB:true,  desc:'Move USDC across 6 chains using Circle CCTP V2. Arc to Ethereum, Base, Arbitrum, Optimism and Avalanche. No wrapped tokens.' },
            { Icon:EarnIco,   title:'Earn 4.80% APY',badge:'On-chain',    bP:true,  desc:'Lend USDC at 4.80% APY via NANLendingPool on Arc. Borrow against collateral at 7.20% APR. Fully liquid — withdraw anytime.' },
          ].map(({Icon,title,badge,bG,bB,bP,desc},i) => (
            <div key={i} style={{ background: dark?'#1a1a1a':'#ffffff', border:`1px solid ${border}`, borderRadius:18, padding:D?'26px 24px':'18px 16px', display:'flex', flexDirection:'column', gap:12, transition:'border-color .2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:'rgba(112,0,255,.12)', border:'1px solid rgba(112,0,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon/>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'1rem', color:text, marginBottom:5 }}>{title}</div>
                  <span style={{ display:'inline-block', fontSize:'.68rem', padding:'2px 8px', borderRadius:6, fontWeight:500, ...(bG?{background:'rgba(0,229,160,.12)',border:'1px solid rgba(0,229,160,.2)',color:'#00e5a0'}:bB?{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',color:'#93c5fd'}:{background:'rgba(112,0,255,.12)',border:'1px solid rgba(112,0,255,.25)',color:accent4}) }}>{badge}</span>
                </div>
              </div>
              <p style={{ fontSize:'.83rem', color:text2, lineHeight:1.7, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </Sec>

      {/* ── BRIDGE CHAINS ── */}
      <Sec D={D} border={border} bg={bg} tight>
        <Tag color={accent3}>Bridge destinations</Tag>
        <H2 text={text} D={D} tight>Bridge USDC to any chain</H2>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {[
            {name:'Arc Testnet',    color:'#7000ff'},
            {name:'Ethereum',       color:'#627EEA'},
            {name:'Base',           color:'#0052FF'},
            {name:'Arbitrum',       color:'#28A0F0'},
            {name:'Optimism',       color:'#FF0420'},
            {name:'Avalanche',      color:'#E84142'},
          ].map((c,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:100, background: dark?'#1a1a1a':'#f4f4f4', border:`1px solid ${border}`, fontSize:'.82rem', color:text2 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, display:'inline-block', flexShrink:0 }}/>
              {c.name}
            </div>
          ))}
        </div>
      </Sec>

      {/* ── EARN ── */}
      <Sec D={D} border={border} bg={bg} tight>
        <Tag color={accent3}>Earn</Tag>
        <H2 text={text} D={D} tight>Your stablecoins should work for you</H2>
        <div style={{ display: D ? 'grid' : 'flex', gridTemplateColumns: D ? 'auto 1fr' : undefined, flexDirection: D ? undefined : 'column', gap: D ? 40 : 20, alignItems:'center', background:'linear-gradient(135deg,rgba(112,0,255,.1),rgba(168,85,247,.05))', border:`1px solid rgba(112,0,255,.2)`, borderRadius:20, padding: D ? '36px 40px' : '24px 20px' }}>
          <div>
            <div style={{ fontWeight:800, fontSize: D ? '3.5rem' : '2.8rem', color:'#00e5a0', lineHeight:1 }}>4.80<span style={{ fontSize: D?'1.8rem':'1.4rem' }}>%</span></div>
            <div style={{ fontSize:'.82rem', color:text2, marginTop:6 }}>APY on USDC — NANLendingPool</div>
          </div>
          <div>
            <p style={{ fontSize:'.88rem', color:text2, lineHeight:1.75 }}>Deposit USDC into NANLendingPool on Arc Testnet. Earn 4.80% APY automatically. Borrow at 7.20% APR. Fully liquid — withdraw anytime.</p>
            <p style={{ marginTop:10, fontSize:'.72rem', color:text3 }}>Contract: <code style={{ color:text2, fontFamily:'monospace', fontSize:'.68rem' }}>0x4CC84BbEf992439Cb01FeF2E1150B37916d1f2ce</code></p>
          </div>
        </div>
      </Sec>

      {/* ── MORE FEATURES ── */}
      <Sec D={D} border={border} bg={bg} tight>
        <Tag color={accent3}>Advanced</Tag>
        <H2 text={text} D={D} tight>Built for power users too</H2>
        <div style={{ display:'grid', gridTemplateColumns: D ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: D ? 12 : 10 }}>
          {[
            {Icon:BotIco,   title:'NAN AI',         desc:'Ask in plain English. AI executes sends, swaps and orders. Voice input supported.'},
            {Icon:TargetIco,title:'Limit Orders',    desc:'Auto-swap when USDC/EURC hits your target rate. Runs 24/7 in the background.'},
            {Icon:ClockIco, title:'Scheduled Sends', desc:'One-off or recurring payments — weekly, monthly or any custom interval.'},
            {Icon:UsersIco, title:'Bulk Pay',        desc:'Pay your whole team in one transaction with USDC or EURC.'},
            {Icon:LinkIco,  title:'Payment Links',   desc:'Create shareable payment requests with a fixed amount and expiry.'},
            {Icon:TagIco,   title:'.arc Names',      desc:'Register alice.arc and send to names instead of 0x addresses.'},
            {Icon:LayersIco,title:'Multichain View', desc:'See USDC balance across all 6 chains in one unified dashboard.'},
            {Icon:GlobeIco, title:'Circle Gateway',  desc:'Unified USDC balance across chains. Deposit once, use everywhere.'},
            {Icon:NairaIco, title:'Naira (NGN)',      desc:'Deposit and convert Nigerian Naira at live rates. Coming soon.'},
          ].map(({Icon,title,desc},i) => (
            <div key={i} style={{ background: dark?'#1a1a1a':'#ffffff', border:`1px solid ${border}`, borderRadius:16, padding: D ? '20px 18px' : '14px 12px' }}>
              <div style={{ marginBottom:10 }}><Icon/></div>
              <div style={{ fontWeight:600, fontSize: D?'.9rem':'.8rem', color:text, marginBottom:5 }}>{title}</div>
              <div style={{ fontSize: D?'.8rem':'.73rem', color:text2, lineHeight:1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </Sec>

      {/* ── HOW IT WORKS ── */}
      <Sec D={D} border={border} bg={bg} tight>
        <Tag color={accent3}>How it works</Tag>
        <H2 text={text} D={D} tight>Up in 30 seconds</H2>
        {[
          {n:1,title:'Enter your email',         badge:'Non-custodial', desc:'No seed phrase, no downloads. A Circle MPC wallet is created instantly — you own the keys, we never hold them.'},
          {n:2,title:'Verify your email',         badge:'Secure OTP',   desc:'A 6-digit code is sent to your email. Enter it to confirm your identity — no password needed.'},
          {n:3,title:'Get free testnet USDC',     badge:'Free',         desc:'Tap Faucet to receive USDC on Arc Testnet. No real money, no KYC. Explore every feature freely.'},
          {n:4,title:'Send, swap, bridge, earn',  badge:'AI-powered',   desc:'The full stablecoin stack at your fingertips. Talk to NAN AI or use the app — everything works instantly.'},
        ].map((step,i,arr) => (
          <div key={i} style={{ display:'flex', gap: D?20:16, padding:D?'24px 0':'20px 0', borderBottom: i<arr.length-1?`1px solid ${border}`:'none' }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'rgba(112,0,255,.12)', border:'1px solid rgba(112,0,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.85rem', color:accent4, flexShrink:0 }}>{step.n}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize: D?'.95rem':'.88rem', color:text, marginBottom:4 }}>{step.title}</div>
              <div style={{ fontSize: D?'.82rem':'.78rem', color:text2, lineHeight:1.65, marginBottom:6 }}>{step.desc}</div>
              <span style={{ display:'inline-block', fontSize:'.66rem', padding:'2px 8px', borderRadius:5, background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', fontWeight:500 }}>{step.badge}</span>
            </div>
          </div>
        ))}
      </Sec>

      {/* ── POWERED BY ── */}
      <Sec D={D} border={border} bg={bg} tight>
        <Tag color={accent3}>Built on</Tag>
        <H2 text={text} D={D} tight>Trusted infrastructure</H2>
        <div style={{ display:'grid', gridTemplateColumns: D ? 'repeat(3,1fr)' : 'repeat(1,1fr)', gap:10 }}>
          {[
            {name:'Circle',          desc:'Developer Wallets · CCTP V2 · Gateway', color:'#7000ff'},
            {name:'Arc Network',     desc:'Chain ID 5042002 · USDC-native gas',    color:'#a855f7'},
            {name:'Groq AI',         desc:'NAN AI — llama-3.1-8b-instant',         color:'#f97316'},
            {name:'NANLendingPool',  desc:'On-chain lending at 4.80% APY',         color:'#00e5a0'},
            {name:'NANSwap',         desc:'On-chain USDC / EURC swaps',            color:'#3b82f6'},
            {name:'NANNameRegistry', desc:'.arc identity on-chain',                color:'#a855f7'},
          ].map((p,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background: dark?'#1a1a1a':'#ffffff', border:`1px solid ${border}`, borderRadius:14, padding:'13px 16px' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0, display:'inline-block' }}/>
              <div>
                <div style={{ fontWeight:600, fontSize:'.88rem', color:text }}>{p.name}</div>
                <div style={{ fontSize:'.72rem', color:text3 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Sec>

      {/* ── FOOTER CTA ── */}
      <div style={{ position:'relative', zIndex:1, margin: D ? '0 48px 80px' : '0 20px 60px', background:'linear-gradient(135deg,rgba(112,0,255,.12),rgba(168,85,247,.06))', border:`1px solid rgba(112,0,255,.22)`, borderRadius:24, padding: D ? '64px 64px' : '40px 24px', textAlign:'center', overflow:'hidden' }}>
        <h2 style={{ fontWeight:800, fontSize: D ? '2.6rem' : '1.8rem', letterSpacing:'-.03em', marginBottom:12, color:text }}>Ready to start?</h2>
        <p style={{ fontSize: D ? '1rem' : '.9rem', color:text2, marginBottom:28, lineHeight:1.6 }}>Create your free wallet in 30 seconds.<br/>No crypto experience needed.</p>
        <button onClick={() => window.scrollTo({top:0,behavior:'smooth'})} style={{ background:accent, color:'#fff', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'1rem', padding: D ? '14px 40px' : '13px 32px', borderRadius:13, border:'none', cursor:'pointer', width: D ? 'auto' : '100%', maxWidth:300 }}>
          Create Free Wallet
        </button>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:1, borderTop:`1px solid ${border}`, padding: D ? '24px 48px' : '20px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.78rem', color:text3 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width="18" height="26" style={{flexShrink:0}}>
            <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill={accent}/>
            <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill={accent}/>
          </svg>
          NAN Wallet · Arc Testnet · v1.0.0
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['Circle','CCTP V2','Arc','Groq AI','Non-custodial'].map((t,i) => (
            <span key={i} style={{ fontSize:'.7rem', background: dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)', border:`1px solid ${border}`, borderRadius:6, padding:'3px 9px', color:text2 }}>{t}</span>
          ))}
        </div>
      </footer>

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
