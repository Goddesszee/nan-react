import { useEffect, useRef, useState } from 'react'
import { NanLogo } from '../components/NanLogo'
import { useTheme } from '../hooks/useTheme'

const API = 'https://nan-production.up.railway.app'

const features = [
  { icon: '↑', title: 'Send', desc: 'Transfer USDC and EURC to any Arc address in under a second. Zero gas fees.' },
  { icon: '⇄', title: 'Swap', desc: 'Exchange between USDC and EURC at live market rates. No slippage surprises.' },
  { icon: '⊞', title: 'Bridge', desc: 'Move stablecoins between chains using Circle CCTP V2. No wrapped tokens.' },
  { icon: '📈', title: 'Earn', desc: 'Put idle stablecoins to work at 4.80% APY. Fully liquid. No lockup.' },
]

const stats = [
  { value: '$0',     label: 'Gas fees ever' },
  { value: '<1s',    label: 'Settlement time' },
  { value: '4.80%',  label: 'APY on USDC' },
  { value: 'CCTP V2',label: 'Bridge protocol' },
]

const CYCLE_WORDS = ['Borders.', 'Limits.', 'Barriers.', 'Borders.']

// Network animation
function NetworkCanvas({ theme }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h, nodes, edges, pulses, animId
    const dark = theme !== 'light'
    function resize() {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
      initScene()
    }
    function initScene() {
      nodes = Array.from({ length: Math.max(Math.floor((w*h)/18000), 14) }, () => ({
        x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()-.5)*.55, vy: (Math.random()-.5)*.55,
        r: Math.random()*3+1.5, pulse: Math.random()*Math.PI*2,
      }))
      edges = []; pulses = []
      for (let i=0;i<6;i++) spawnPulse()
    }
    function spawnPulse() {
      if (!edges.length) return
      const edge = edges[Math.floor(Math.random()*edges.length)]
      pulses.push({ edge, t:0, speed: Math.random()*.008+.004, reverse: Math.random()>.5, size: Math.random()*3+2, trail:[] })
    }
    function draw() {
      ctx.clearRect(0,0,w,h)
      for (const n of nodes) {
        n.pulse+=.025; n.x+=n.vx; n.y+=n.vy
        if(n.x<0||n.x>w) n.vx*=-1
        if(n.y<0||n.y>h) n.vy*=-1
      }
      edges=[]
      for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++) {
        const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<220) edges.push({a:i,b:j,dist:d})
      }
      for(const e of edges) {
        const a=nodes[e.a],b=nodes[e.b]
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)
        ctx.strokeStyle=`rgba(112,0,255,${(dark?.18:.12)*(1-e.dist/220)})`
        ctx.lineWidth=.8;ctx.stroke()
      }
      for(const n of nodes) {
        const p=n.r+Math.sin(n.pulse)*1.2
        const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,p*5)
        g.addColorStop(0,`rgba(112,0,255,${dark?.25:.12})`);g.addColorStop(1,'rgba(112,0,255,0)')
        ctx.beginPath();ctx.arc(n.x,n.y,p*5,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()
        ctx.beginPath();ctx.arc(n.x,n.y,p,0,Math.PI*2)
        ctx.fillStyle=`rgba(112,0,255,${dark?.9:.7})`;ctx.fill()
      }
      const alive=[]
      for(const p of pulses) {
        p.t+=p.speed; if(p.t>1){spawnPulse();continue}
        const e=p.edge; if(!nodes[e.a]||!nodes[e.b]) continue
        const a=nodes[e.a],b=nodes[e.b],t=p.reverse?1-p.t:p.t
        const px=a.x+(b.x-a.x)*t,py=a.y+(b.y-a.y)*t
        p.trail.push({x:px,y:py}); if(p.trail.length>18) p.trail.shift()
        for(let i=0;i<p.trail.length;i++) {
          const tp=p.trail[i],ta=(i/p.trail.length)*.7
          ctx.beginPath();ctx.arc(tp.x,tp.y,p.size*(i/p.trail.length)*.8,0,Math.PI*2)
          ctx.fillStyle=dark?`rgba(192,132,252,${ta})`:`rgba(112,0,255,${ta*.8})`;ctx.fill()
        }
        const hg=ctx.createRadialGradient(px,py,0,px,py,p.size*3)
        hg.addColorStop(0,dark?'rgba(255,255,255,.95)':'rgba(112,0,255,.95)')
        hg.addColorStop(.4,dark?'rgba(192,132,252,.6)':'rgba(147,51,234,.5)')
        hg.addColorStop(1,'rgba(112,0,255,0)')
        ctx.beginPath();ctx.arc(px,py,p.size*3,0,Math.PI*2);ctx.fillStyle=hg;ctx.fill()
        ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2)
        ctx.fillStyle=dark?'#c084fc':'#7000ff';ctx.fill()
        alive.push(p)
      }
      pulses=alive; while(pulses.length<8) spawnPulse()
      animId=requestAnimationFrame(draw)
    }
    resize(); draw()
    const ro=new ResizeObserver(resize); ro.observe(canvas)
    window.addEventListener('resize',resize)
    return()=>{cancelAnimationFrame(animId);ro.disconnect();window.removeEventListener('resize',resize)}
  },[theme])
  return <canvas ref={canvasRef} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',pointerEvents:'none',zIndex:0}}/>
}

// Typewriter
function TypewriterCycle() {
  const [idx,setIdx]=useState(0)
  const [displayed,setDisplayed]=useState('')
  const [deleting,setDeleting]=useState(false)
  const [paused,setPaused]=useState(false)
  useEffect(()=>{
    if(paused){const t=setTimeout(()=>{setDeleting(true);setPaused(false)},1600);return()=>clearTimeout(t)}
    const word=CYCLE_WORDS[idx]
    if(!deleting){
      if(displayed.length<word.length){const t=setTimeout(()=>setDisplayed(word.slice(0,displayed.length+1)),75);return()=>clearTimeout(t)}
      else setPaused(true)
    } else {
      if(displayed.length>0){const t=setTimeout(()=>setDisplayed(displayed.slice(0,-1)),40);return()=>clearTimeout(t)}
      else{setDeleting(false);setIdx(i=>(i+1)%CYCLE_WORDS.length)}
    }
  },[displayed,deleting,paused,idx])
  return <span className="l-typewriter">{displayed}<span className="l-cursor">|</span></span>
}

// Login Modal
function LoginModal({ onClose, onEmailConnect, onWalletConnect }) {
  const [step, setStep] = useState('options') // options | email | otp | loading
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loadMsg, setLoadMsg] = useState('')
  const tokenRef = useRef(null)
  const expiryRef = useRef(null)

  const hasWallet = !!(window.ethereum || (window.evmproviders && Object.values(window.evmproviders).length))

  async function sendOTP() {
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    setStep('loading'); setLoadMsg('Sending code…'); setError('')
    try {
      const r = await fetch(`${API}/api/otp`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'send', email }),
      })
      const d = await r.json()
      if (!d.success) { setError(d.error || 'Failed to send'); setStep('email'); return }
      tokenRef.current = d.token; expiryRef.current = d.expiresAt
      setInfo(`Code sent to ${email}`)
      setStep('otp')
    } catch(e) { setError('Network error'); setStep('email') }
  }

  async function verifyOTP() {
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return }
    setStep('loading'); setLoadMsg('Verifying…'); setError('')
    try {
      const vr = await fetch(`${API}/api/otp`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'verify', email, otp, token: tokenRef.current, expiresAt: expiryRef.current }),
      })
      const vd = await vr.json()
      if (!vd.success) { setError(vd.error || 'Invalid code'); setStep('otp'); return }
      setLoadMsg('Setting up wallet…')
      await onEmailConnect(email)
    } catch(e) { setError(e.message || 'Error'); setStep('otp') }
  }

  async function connectWallet() {
    setStep('loading'); setLoadMsg('Connecting wallet…'); setError('')
    try {
      await onWalletConnect()
    } catch(e) { setError(e.message); setStep('options') }
  }

  const { theme: modalTheme } = useTheme()
  const dark = modalTheme !== 'light'
  const overlay = {
    position:'fixed',inset:0,background: dark ? 'rgba(0,0,0,.85)' : 'rgba(0,0,0,.5)',
    backdropFilter:'blur(12px)',zIndex:9999,
    display:'flex',alignItems:'center',justifyContent:'center',padding:16,
    animation:'fadeIn .2s ease',
  }
  const modal = {
    background: dark ? '#111' : '#ffffff',
    border: dark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.1)',
    borderRadius:24,padding:'28px 24px',width:'100%',maxWidth:400,position:'relative',
    boxShadow:'0 0 60px rgba(112,0,255,.15)',
    animation:'scaleIn .25s cubic-bezier(.34,1.56,.64,1)',fontFamily:'Inter,sans-serif',
  }
  const textColor = dark ? '#ffffff' : '#111111'
  const subColor  = dark ? '#aaaaaa' : '#555555'
  const inp = {
    width:'100%',padding:'13px 14px',
    background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)',
    border: dark ? '1px solid rgba(255,255,255,.15)' : '1px solid rgba(0,0,0,.15)',
    borderRadius:12,color:textColor,fontFamily:'Inter,sans-serif',fontSize:'1rem',
    outline:'none',boxSizing:'border-box',
  }
  const primaryBtn = {
    width:'100%',padding:13,background:'#7000ff',border:'none',borderRadius:12,
    color:'#fff',fontFamily:'Inter,sans-serif',fontSize:'1rem',fontWeight:700,
    cursor:'pointer',boxShadow:'0 0 20px rgba(112,0,255,.35)',
  }
  const secondaryBtn = {
    width:'100%',padding:13,
    background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
    border: dark ? '1px solid rgba(255,255,255,.15)' : '1px solid rgba(0,0,0,.15)',
    borderRadius:12,color:textColor,fontFamily:'Inter,sans-serif',fontSize:'1rem',fontWeight:600,cursor:'pointer',
  }

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={modal}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:16,background:'none',border:'none',color:subColor,fontSize:'1.3rem',cursor:'pointer',lineHeight:1}}>×</button>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{}} ><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='52' height='52' style={{display:'block'}}><rect width='36' height='36' rx='6' fill='#7000ff'/><rect x='7' y='7' width='22' height='22' rx='4' fill='#ffffff'/><rect x='13' y='13' width='10' height='10' rx='2' fill='#000000'/></svg></div>
          <div style={{fontSize:'1.2rem',fontWeight:800,color:textColor,letterSpacing:'-.02em'}}>
            {step==='options' ? 'Sign in to NAN' : step==='email' ? 'Continue with Email' : step==='otp' ? 'Check your inbox' : 'Please wait…'}
          </div>
          <div style={{fontSize:'.82rem',color:subColor,marginTop:4}}>
            {step==='options' ? 'Payments Without Borders' : step==='otp' ? `Code sent to ${email}` : ''}
          </div>
        </div>

        {/* Error / Info */}
        {error && <div style={{background:'rgba(248,113,113,.1)',border:'1px solid rgba(248,113,113,.2)',borderRadius:10,padding:'10px 14px',fontSize:'.82rem',color:'#f87171',marginBottom:14}}>{error}</div>}
        {info && !error && <div style={{background:'rgba(112,0,255,.1)',border:'1px solid rgba(112,0,255,.2)',borderRadius:10,padding:'10px 14px',fontSize:'.82rem',color:'#a855f7',marginBottom:14}}>{info}</div>}

        {/* Loading */}
        {step==='loading' && (
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{width:36,height:36,border:'3px solid rgba(112,0,255,.2)',borderTopColor:'#7000ff',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 12px'}}/>
            <div style={{color:subColor,fontSize:'.85rem'}}>{loadMsg}</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0}}@keyframes scaleIn{from{opacity:0;transform:scale(.9)}}`}</style>
          </div>
        )}

        {/* Options */}
        {step==='options' && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <button style={primaryBtn} onClick={()=>{setStep('email');setError('')}}>
              ✉️ &nbsp; Continue with Email
            </button>
            {hasWallet ? (
              <button style={secondaryBtn} onClick={connectWallet}>
                🦊 &nbsp; Connect Wallet (MetaMask, Rabby…)
              </button>
            ) : (
              <button style={{...secondaryBtn,opacity:.5,cursor:'default'}} disabled>
                🦊 &nbsp; No wallet detected
              </button>
            )}
            <div style={{textAlign:'center',margin:'8px 0',fontSize:'.75rem',color:'#444'}}>— or —</div>
            <div style={{background: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',border: dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.08)',borderRadius:12,padding:'12px 14px'}}>
              <div style={{fontSize:'.78rem',color:subColor,marginBottom:8}}>Don't have a wallet?</div>
              <div style={{fontSize:'.82rem',color: dark ? '#aaa' : '#555',lineHeight:1.6}}>
                Use <strong style={{color:'#a855f7'}}>Continue with Email</strong> — we create a secure wallet for you automatically. No downloads, no seed phrases.
              </div>
            </div>
            <div style={{textAlign:'center',fontSize:'.72rem',color:subColor,marginTop:4}}>
              Powered by Circle · <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{verticalAlign:"middle",marginRight:"4px",display:"inline-block",flexShrink:0,borderRadius:"3px",background:"#0d1b2e",padding:"1px"}}><path fill="url(#arc_land)" d="M3.5 20.999c.146-4.407.893-8.519 2.142-11.717C7.223 5.231 9.513 3 12.088 3s4.865 2.231 6.447 6.283c.822 2.107 1.427 4.61 1.786 7.334q.048.366.087.737.015.024.013.041s.21 1.317.256 3.604h-.024c-.313-.256-4-3.153-10.112-2.314.093-1.035.22-2.04.383-3.005l.027-.146a24.5 24.5 0 0 1 6.104.57q-.007-.056-.017-.115c-.33-2.06-.819-3.945-1.448-5.556-1.029-2.635-2.371-4.271-3.502-4.271-1.132 0-2.474 1.636-3.503 4.271q-.375.958-.679 2.034a30 30 0 0 0-.718 3.213A40 40 0 0 0 6.662 21H3.5z"/><defs><linearGradient id="arc_land" x1="12" x2="12" y1="3" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#d0d8e8"/><stop offset="1" stopColor="#7a8faa"/></linearGradient></defs></svg>Testnet
            </div>
          </div>
        )}

        {/* Email input */}
        {step==='email' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <input style={inp} type="email" placeholder="your@email.com" value={email}
              onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendOTP()} autoFocus/>
            <button style={primaryBtn} onClick={sendOTP}>Send Code →</button>
            <button onClick={()=>{setStep('options');setError('')}} style={{background:'none',border:'none',color:subColor,fontSize:'.82rem',cursor:'pointer'}}>← Back</button>
          </div>
        )}

        {/* OTP input */}
        {step==='otp' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <input style={{...inp,textAlign:'center',fontSize:'1.8rem',letterSpacing:10,fontWeight:700}}
              type="text" inputMode="numeric" maxLength={6} placeholder="······" value={otp}
              onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}
              onKeyDown={e=>e.key==='Enter'&&verifyOTP()} autoFocus/>
            <button style={primaryBtn} onClick={verifyOTP}>Verify & Enter →</button>
            <button onClick={()=>{setStep('email');setOtp('');setError('')}} style={{background:'none',border:'none',color:subColor,fontSize:'.82rem',cursor:'pointer'}}>← Use different email</button>
          </div>
        )}
      </div>
    </div>
  )
}

// Landing page
export function Landing({ onEmailConnect, onWalletConnect }) {
  const { theme, toggleTheme } = useTheme()
  const [showLogin, setShowLogin] = useState(false)
  const featuresRef = useRef(null)
  const [cardsVisible, setCardsVisible] = useState(false)

  useEffect(()=>{
    const el=featuresRef.current; if(!el) return
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setCardsVisible(true);obs.disconnect()}},{threshold:.15})
    obs.observe(el); return()=>obs.disconnect()
  },[])

  const openLogin = () => setShowLogin(true)

  return (
    <div className="landing" data-theme={theme} style={{position:'relative'}}>
      <NetworkCanvas theme={theme}/>

      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onEmailConnect={onEmailConnect} onWalletConnect={onWalletConnect}/>}

      {/* Nav */}
      <nav className="l-nav" style={{position:'relative',zIndex:10}}>
        <NanLogo height={36} theme={theme}/>
        <div className="l-nav-right">
          <button className="l-theme-btn" onClick={toggleTheme}>{theme==='light'?'🌙':'☀️'}</button>
          <span className="l-net-pill">• <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{verticalAlign:"middle",marginRight:"4px",display:"inline-block",flexShrink:0,borderRadius:"3px",background:"#0d1b2e",padding:"1px"}}><path fill="url(#arc_land)" d="M3.5 20.999c.146-4.407.893-8.519 2.142-11.717C7.223 5.231 9.513 3 12.088 3s4.865 2.231 6.447 6.283c.822 2.107 1.427 4.61 1.786 7.334q.048.366.087.737.015.024.013.041s.21 1.317.256 3.604h-.024c-.313-.256-4-3.153-10.112-2.314.093-1.035.22-2.04.383-3.005l.027-.146a24.5 24.5 0 0 1 6.104.57q-.007-.056-.017-.115c-.33-2.06-.819-3.945-1.448-5.556-1.029-2.635-2.371-4.271-3.502-4.271-1.132 0-2.474 1.636-3.503 4.271q-.375.958-.679 2.034a30 30 0 0 0-.718 3.213A40 40 0 0 0 6.662 21H3.5z"/><defs><linearGradient id="arc_land" x1="12" x2="12" y1="3" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#d0d8e8"/><stop offset="1" stopColor="#7a8faa"/></linearGradient></defs></svg>Testnet</span>
          <button onClick={openLogin} style={{background:'#7000ff',border:'none',borderRadius:10,color:'#fff',padding:'8px 18px',fontFamily:'Inter,sans-serif',fontSize:'.85rem',fontWeight:700,cursor:'pointer',boxShadow:'0 0 16px rgba(112,0,255,.35)'}}>
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero l-hero-full" style={{position:'relative',zIndex:1}}>
        <div className="l-hero-inner">
          <div className="l-badge l-fade-in" style={{animationDelay:'.1s'}}>
            <span className="l-badge-dot"/>NOW LIVE ON <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{verticalAlign:"middle",marginRight:"4px",display:"inline-block",flexShrink:0,borderRadius:"3px",background:"#0d1b2e",padding:"1px"}}><path fill="url(#arc_land)" d="M3.5 20.999c.146-4.407.893-8.519 2.142-11.717C7.223 5.231 9.513 3 12.088 3s4.865 2.231 6.447 6.283c.822 2.107 1.427 4.61 1.786 7.334q.048.366.087.737.015.024.013.041s.21 1.317.256 3.604h-.024c-.313-.256-4-3.153-10.112-2.314.093-1.035.22-2.04.383-3.005l.027-.146a24.5 24.5 0 0 1 6.104.57q-.007-.056-.017-.115c-.33-2.06-.819-3.945-1.448-5.556-1.029-2.635-2.371-4.271-3.502-4.271-1.132 0-2.474 1.636-3.503 4.271q-.375.958-.679 2.034a30 30 0 0 0-.718 3.213A40 40 0 0 0 6.662 21H3.5z"/><defs><linearGradient id="arc_land" x1="12" x2="12" y1="3" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#d0d8e8"/><stop offset="1" stopColor="#7a8faa"/></linearGradient></defs></svg>ARC TESTNET
          </div>
          <h1 className="l-h1 l-fade-in" style={{animationDelay:'.25s'}}>
            Payments Without<br/>
            <span className="l-h1-purple"><TypewriterCycle/></span>
          </h1>
          <p className="l-sub l-fade-in" style={{animationDelay:'.45s'}}>
            The complete stablecoin wallet on Arc. Send, swap, bridge and earn with USDC and EURC. Powered by Circle. Zero gas fees.
          </p>
          <div className="l-cta-row l-fade-in" style={{animationDelay:'.6s'}}>
            <button className="btn-primary" style={{padding:'13px 32px',fontSize:'1rem'}} onClick={openLogin}>
              Get Started →
            </button>
            <a className="l-btn-ghost" href="https://faucet.arc.fun" target="_blank" rel="noreferrer">Get Free Tokens →</a>
          </div>
          <div className="l-stats l-fade-in" style={{animationDelay:'.8s'}}>
            {stats.map(s=>(
              <div key={s.label} className="l-stat">
                <div className="l-stat-val">{s.value}</div>
                <div className="l-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="l-features" ref={featuresRef} style={{position:'relative',zIndex:1}}>
        <div className="l-features-inner">
          <h2 className="l-section-title">Built for the stablecoin era</h2>
          <p className="l-section-sub">One wallet. Every stablecoin primitive on Arc, fully integrated.</p>
          <div className="l-feature-grid">
            {features.map((f,i)=>(
              <div key={f.title} className={`l-feature-card ${cardsVisible?'l-card-visible':''}`} style={{transitionDelay:`${i*.1}s`}}>
                <div className="l-feature-ico">{f.icon}</div>
                <div className="l-feature-title">{f.title}</div>
                <div className="l-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="l-footer" style={{position:'relative',zIndex:1}}>
        <NanLogo height={28} theme={theme}/>
        <span className="l-footer-txt">Built on Arc · Powered by Circle · © 2025 NAN</span>
        <div className="l-footer-links">
          <a href="https://twitter.com/nanarc_xyz" target="_blank" rel="noreferrer">X/Twitter</a>
          <a href="https://github.com/Goddesszee/nan-react" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
