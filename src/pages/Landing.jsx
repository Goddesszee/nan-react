import { useEffect, useRef, useState, useCallback } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { NanLogo } from '../components/NanLogo'
import { useTheme } from '../hooks/useTheme'

const features = [
  { icon: '↑', title: 'Send', desc: 'Transfer USDC and EURC to any Arc address in under a second. Zero gas fees. Settled on-chain instantly.' },
  { icon: '⇄', title: 'Swap', desc: 'Exchange between USDC and EURC at live market rates. No slippage surprises. Always the best on-chain price.' },
  { icon: '⊞', title: 'Bridge', desc: 'Move stablecoins between chains using Circle CCTP V2. Native burns and mints. No wrapped tokens, no risk.' },
  { icon: '📈', title: 'Earn', desc: 'Put idle stablecoins to work at 4.80% APY. Fully liquid. Withdraw your funds at any time with no lockup.' },
]

const stats = [
  { value: '$0',     label: 'Gas fees ever' },
  { value: '<1s',    label: 'Settlement time' },
  { value: '4.80%',  label: 'APY on USDC' },
  { value: 'CCTP V2',label: 'Bridge protocol' },
]

const CYCLE_WORDS = ['Borders.', 'Limits.', 'Barriers.', 'Borders.']

// ── Full-viewport network animation ──────────────────────────────────────────
function NetworkCanvas({ theme }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h, nodes, edges, pulses, animId

    const dark = theme !== 'light'
    const NODE_COLOR  = 'rgba(139,92,246,'
    const EDGE_COLOR  = 'rgba(139,92,246,'
    const PULSE_COLOR = dark ? '#c084fc' : '#8b5cf6'
    const GLOW_COLOR  = 'rgba(139,92,246,'
    const nodeAlpha   = dark ? 0.9 : 0.7
    const edgeAlpha   = dark ? 0.18 : 0.12
    const glowAlpha   = dark ? 0.25 : 0.12

    function resize() {
      w = canvas.width  = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
      initScene()
    }

    function initScene() {
      const count = Math.floor((w * h) / 18000)
      nodes = Array.from({ length: Math.max(count, 14) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.55, vy: (Math.random() - 0.5) * 0.55,
        r: Math.random() * 3 + 1.5, pulse: Math.random() * Math.PI * 2,
      }))
      edges = []; pulses = []
      for (let i = 0; i < 6; i++) spawnPulse()
    }

    function spawnPulse() {
      if (!edges.length) return
      const edge = edges[Math.floor(Math.random() * edges.length)]
      pulses.push({ edge, t: 0, speed: Math.random() * 0.008 + 0.004,
        reverse: Math.random() > 0.5, size: Math.random() * 3 + 2, trail: [] })
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) {
        n.pulse += 0.025; n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }
      edges = []
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < 220) edges.push({ a: i, b: j, dist: d })
        }
      }
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b]
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = EDGE_COLOR + (edgeAlpha * (1 - e.dist/220)) + ')'
        ctx.lineWidth = 0.8; ctx.stroke()
      }
      for (const n of nodes) {
        const pulsed = n.r + Math.sin(n.pulse) * 1.2
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pulsed*5)
        g.addColorStop(0, GLOW_COLOR + glowAlpha + ')'); g.addColorStop(1, GLOW_COLOR + '0)')
        ctx.beginPath(); ctx.arc(n.x, n.y, pulsed*5, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(n.x, n.y, pulsed, 0, Math.PI*2)
        ctx.fillStyle = NODE_COLOR + nodeAlpha + ')'; ctx.fill()
      }
      const alive = []
      for (const p of pulses) {
        p.t += p.speed
        if (p.t > 1) { spawnPulse(); continue }
        const edge = p.edge
        if (!nodes[edge.a] || !nodes[edge.b]) continue
        const a = nodes[edge.a], b = nodes[edge.b]
        const t = p.reverse ? 1 - p.t : p.t
        const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t
        p.trail.push({ x: px, y: py })
        if (p.trail.length > 18) p.trail.shift()
        for (let i = 0; i < p.trail.length; i++) {
          const tp = p.trail[i], ta = (i / p.trail.length) * 0.7
          ctx.beginPath(); ctx.arc(tp.x, tp.y, p.size*(i/p.trail.length)*0.8, 0, Math.PI*2)
          ctx.fillStyle = dark ? `rgba(192,132,252,${ta})` : `rgba(139,92,246,${ta*0.8})`
          ctx.fill()
        }
        const hg = ctx.createRadialGradient(px, py, 0, px, py, p.size*3)
        hg.addColorStop(0, dark ? 'rgba(255,255,255,0.95)' : 'rgba(139,92,246,0.95)')
        hg.addColorStop(0.4, dark ? 'rgba(192,132,252,0.6)' : 'rgba(147,51,234,0.5)')
        hg.addColorStop(1, 'rgba(139,92,246,0)')
        ctx.beginPath(); ctx.arc(px, py, p.size*3, 0, Math.PI*2); ctx.fillStyle = hg; ctx.fill()
        ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI*2)
        ctx.fillStyle = PULSE_COLOR; ctx.fill()
        alive.push(p)
      }
      pulses = alive
      while (pulses.length < 8) spawnPulse()
      animId = requestAnimationFrame(draw)
    }

    resize(); draw()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); ro.disconnect(); window.removeEventListener('resize', resize) }
  }, [theme])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: 0,
    }} />
  )
}

// ── Typewriter ────────────────────────────────────────────────────────────────
function TypewriterCycle() {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => { setDeleting(true); setPaused(false) }, 1600)
      return () => clearTimeout(t)
    }
    const word = CYCLE_WORDS[idx]
    if (!deleting) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 75)
        return () => clearTimeout(t)
      } else { setPaused(true) }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40)
        return () => clearTimeout(t)
      } else { setDeleting(false); setIdx(i => (i + 1) % CYCLE_WORDS.length) }
    }
  }, [displayed, deleting, paused, idx])

  return (
    <span className="l-typewriter">
      {displayed}<span className="l-cursor">|</span>
    </span>
  )
}

// ── OTP Modal ─────────────────────────────────────────────────────────────────
const API = 'https://nan-production.up.railway.app'

function OTPModal({ onClose }) {
  const [step, setStep]       = useState('email') // email | otp | loading
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState('')
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')
  const tokenRef              = useRef(null)
  const expiryRef             = useRef(null)

  const sendOTP = useCallback(async () => {
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    setStep('loading'); setError(''); setInfo('')
    try {
      const r = await fetch(`${API}/api/otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email }),
      })
      const d = await r.json()
      if (!d.success) { setError(d.error || 'Failed to send code'); setStep('email'); return }
      tokenRef.current  = d.token
      expiryRef.current = d.expiresAt
      setInfo(`Code sent to ${email}`)
      setStep('otp')
    } catch(e) {
      setError('Network error — try again'); setStep('email')
    }
  }, [email])

  const verifyOTP = useCallback(async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return }
    setStep('loading'); setError('')
    try {
      // Verify OTP
      const vr = await fetch(`${API}/api/otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, otp, token: tokenRef.current, expiresAt: expiryRef.current }),
      })
      const vd = await vr.json()
      if (!vd.success) { setError(vd.error || 'Invalid code'); setStep('otp'); return }

      // Get or create Circle wallet
      const wr = await fetch(`${API}/api/circle-wallets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getWallet', email }),
      })
      const wd = await wr.json()
      const wallet = wd.wallet || wd
      if (!wallet?.id) { setError('Wallet setup failed — try again'); setStep('otp'); return }

      // Store session and redirect — same keys as Dynamic flow
      localStorage.setItem('nan_dynamic_address', wallet.address)
      localStorage.setItem('nan_dynamic_email',   email)
      localStorage.setItem('nan_dynamic_token',   'dynamic_authenticated')
      localStorage.setItem('circleWalletId',       wallet.id)
      localStorage.setItem('circleWalletAddr',     wallet.address)
      window.location.replace('/legacy/app.html')
    } catch(e) {
      setError('Network error — try again'); setStep('otp')
    }
  }, [email, otp])

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
    backdropFilter: 'blur(12px)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }
  const modal = {
    background: '#111', border: '1px solid rgba(139,92,246,.3)', borderRadius: 20,
    padding: '28px 24px', width: '100%', maxWidth: 380, position: 'relative',
    boxShadow: '0 0 60px rgba(139,92,246,.2)',
    animation: 'scaleIn .22s cubic-bezier(.34,1.56,.64,1)',
  }
  const inp = {
    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.12)', borderRadius: 12,
    color: '#fff', fontFamily: 'Inter,sans-serif', fontSize: '1rem',
    outline: 'none', boxSizing: 'border-box',
  }
  const btn = {
    width: '100%', padding: '13px', background: '#8b5cf6', border: 'none',
    borderRadius: 12, color: '#fff', fontFamily: 'Inter,sans-serif',
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 0 20px rgba(139,92,246,.4)',
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, background: 'none',
          border: 'none', color: '#555', fontSize: '1.2rem', cursor: 'pointer',
        }}>×</button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            {step === 'otp' ? 'Enter your code' : 'Continue with Email'}
          </div>
          <div style={{ fontSize: '.82rem', color: '#666' }}>
            {step === 'otp' ? `We sent a 6-digit code to ${email}` : 'Get a one-time code sent to your inbox'}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.25)',
            borderRadius: 10, padding: '10px 14px', fontSize: '.82rem', color: '#f87171', marginBottom: 14 }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)',
            borderRadius: 10, padding: '10px 14px', fontSize: '.82rem', color: '#a855f7', marginBottom: 14 }}>
            {info}
          </div>
        )}

        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 36, height: 36, border: '3px solid rgba(139,92,246,.2)',
              borderTopColor: '#8b5cf6', borderRadius: '50%',
              animation: 'spin .7s linear infinite', margin: '0 auto 12px',
            }} />
            <div style={{ color: '#666', fontSize: '.85rem' }}>Please wait…</div>
          </div>
        )}

        {step === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input style={inp} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOTP()}
              autoFocus />
            <button style={btn} onClick={sendOTP}>Send Code →</button>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input style={{ ...inp, textAlign: 'center', fontSize: '1.6rem', letterSpacing: 8, fontWeight: 700 }}
              type="text" inputMode="numeric" maxLength={6} placeholder="······"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              autoFocus />
            <button style={btn} onClick={verifyOTP}>Verify & Enter →</button>
            <button onClick={() => { setStep('email'); setOtp(''); setError('') }}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: '.82rem', cursor: 'pointer' }}>
              ← Use a different email
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '.72rem', color: '#444' }}>
          Powered by Circle Wallets · Arc Testnet
        </div>
      </div>
    </div>
  )
}

// ── Landing ───────────────────────────────────────────────────────────────────
export function Landing() {
  const { theme, toggleTheme } = useTheme()
  const { setShowAuthFlow, handleLogIn } = useDynamicContext()
  const featuresRef = useRef(null)
  const [cardsVisible, setCardsVisible] = useState(false)
  const [showOTP, setShowOTP] = useState(false)

  useEffect(() => {
    const el = featuresRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setCardsVisible(true); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="landing" data-theme={theme} style={{ position: 'relative' }}>

      {/* Full-screen canvas */}
      <NetworkCanvas theme={theme} />

      {/* OTP Modal — only shown when user clicks email fallback */}
      {showOTP && <OTPModal onClose={() => setShowOTP(false)} />}

      {/* Nav */}
      <nav className="l-nav" style={{ position: 'relative', zIndex: 10 }}>
        <NanLogo height={36} theme={theme} />
        <div className="l-nav-right">
          <button className="l-theme-btn" onClick={toggleTheme}>{theme==='light'?'🌙':'☀️'}</button>
          <span className="l-net-pill">• Arc Testnet</span>
          <button
            onClick={() => { if(typeof handleLogIn === 'function') handleLogIn(); else if(setShowAuthFlow) setShowAuthFlow(true); }}
            style={{
              background: '#8b5cf6',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              padding: '8px 18px',
              fontFamily: 'Inter,sans-serif',
              fontSize: '.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(139,92,246,.35)',
            }}
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero l-hero-full" style={{ position: 'relative', zIndex: 1 }}>
        <div className="l-hero-inner">
          <div className="l-badge l-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="l-badge-dot"></span>
            NOW LIVE ON ARC TESTNET
          </div>
          <h1 className="l-h1 l-fade-in" style={{ animationDelay: '0.25s' }}>
            Payments Without<br/>
            <span className="l-h1-purple"><TypewriterCycle /></span>
          </h1>
          <p className="l-sub l-fade-in" style={{ animationDelay: '0.45s' }}>
            The complete stablecoin wallet on Arc. Send, swap, bridge and earn with USDC and EURC. Powered by Circle. Zero gas fees.
          </p>
          <div className="l-cta-row l-fade-in" style={{ animationDelay: '0.6s' }}>
            <button className="btn-primary" style={{ padding: '13px 32px', fontSize: '1rem' }}
              onClick={() => { if(typeof handleLogIn === 'function') handleLogIn(); else if(setShowAuthFlow) setShowAuthFlow(true); }}>
              Get Started →
            </button>
            <button className="l-btn-ghost" onClick={() => setShowOTP(true)}>
              Continue with Email →
            </button>
          </div>
          <div className="l-stats l-fade-in" style={{ animationDelay: '0.8s' }}>
            {stats.map(s => (
              <div key={s.label} className="l-stat">
                <div className="l-stat-val">{s.value}</div>
                <div className="l-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="l-features" ref={featuresRef} style={{ position: 'relative', zIndex: 1 }}>
        <div className="l-features-inner">
          <h2 className="l-section-title">Built for the stablecoin era</h2>
          <p className="l-section-sub">One wallet. Every stablecoin primitive on Arc, fully integrated.</p>
          <div className="l-feature-grid">
            {features.map((f, i) => (
              <div key={f.title}
                className={`l-feature-card ${cardsVisible ? 'l-card-visible' : ''}`}
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="l-feature-ico">{f.icon}</div>
                <div className="l-feature-title">{f.title}</div>
                <div className="l-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="l-footer" style={{ position: 'relative', zIndex: 1 }}>
        <NanLogo height={28} theme={theme} />
        <span className="l-footer-txt">Built on Arc · Powered by Circle · © 2025 NAN</span>
        <div className="l-footer-links">
          <a href="https://twitter.com/nanarc_xyz" target="_blank" rel="noreferrer">X/Twitter</a>
          <a href="https://github.com/Goddesszee/nan-react" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
