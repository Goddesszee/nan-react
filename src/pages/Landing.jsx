import { useEffect, useRef, useState } from 'react'
import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { NanLogo } from '../components/NanLogo'
import { useTheme } from '../hooks/useTheme'

const features = [
  { icon: '↑', title: 'Send', desc: 'Send USDC & EURC instantly to any address on Arc.' },
  { icon: '⇄', title: 'Swap', desc: 'Swap between USDC and EURC at live market rates.' },
  { icon: '⊞', title: 'Bridge', desc: 'Move stablecoins cross-chain via Circle CCTP V2.' },
  { icon: '📈', title: 'Earn', desc: '4.80% APY on your USDC. Withdraw anytime.' },
]

const stats = [
  { value: '$0',     label: 'Gas fees' },
  { value: '30s',    label: 'To onboard' },
  { value: '4.80%',  label: 'APY on USDC' },
  { value: 'CCTP V2',label: 'Bridge tech' },
]

const CYCLE_WORDS = ['Send.', 'Swap.', 'Bridge.', 'Earn.']

function ParticleCanvas({ theme }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let w, h, particles, animId

    const isDark = theme !== 'light'
    const colors = isDark
      ? ['rgba(112,0,255,', 'rgba(139,0,255,', 'rgba(168,85,247,', 'rgba(88,28,135,']
      : ['rgba(112,0,255,', 'rgba(139,0,255,', 'rgba(168,85,247,', 'rgba(196,132,252,']

    function resize() {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }

    function mkParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 80 + 20,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.12 + 0.03,
        dAlpha: (Math.random() - 0.5) * 0.0008,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: 18 }, mkParticle)
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.pulse += 0.012
        p.x += p.dx
        p.y += p.dy
        p.alpha += p.dAlpha
        if (p.alpha > 0.18) p.dAlpha = -Math.abs(p.dAlpha)
        if (p.alpha < 0.02) p.dAlpha = Math.abs(p.dAlpha)
        if (p.x < -p.r) p.x = w + p.r
        if (p.x > w + p.r) p.x = -p.r
        if (p.y < -p.r) p.y = h + p.r
        if (p.y > h + p.r) p.y = -p.r
        const pulsedR = p.r + Math.sin(p.pulse) * 8
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulsedR)
        grad.addColorStop(0, p.color + (p.alpha * 2) + ')')
        grad.addColorStop(1, p.color + '0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, pulsedR, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }

    init()
    draw()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}

function TypewriterCycle() {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => { setDeleting(true); setPaused(false) }, 1400)
      return () => clearTimeout(t)
    }
    const word = CYCLE_WORDS[idx]
    if (!deleting) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80)
        return () => clearTimeout(t)
      } else {
        setPaused(true)
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45)
        return () => clearTimeout(t)
      } else {
        setDeleting(false)
        setIdx(i => (i + 1) % CYCLE_WORDS.length)
      }
    }
  }, [displayed, deleting, paused, idx])

  return (
    <span className="l-typewriter">
      {displayed}
      <span className="l-cursor">|</span>
    </span>
  )
}

export function Landing() {
  const { theme, toggleTheme } = useTheme()
  const { setShowAuthFlow } = useDynamicContext()
  const featuresRef = useRef(null)
  const [cardsVisible, setCardsVisible] = useState(false)

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
    <div className="landing" data-theme={theme}>

      {/* Nav */}
      <nav className="l-nav">
        <NanLogo width={160} height={40} />
        <div className="l-nav-right">
          <button className="l-theme-btn" onClick={toggleTheme}>{theme==='light'?'🌙':'☀️'}</button>
          <span className="l-net-pill">• Arc Testnet</span>
          <DynamicWidget />
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <ParticleCanvas theme={theme} />
        <div className="l-hero-inner" style={{ position: 'relative', zIndex: 1 }}>
          <div className="l-badge l-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="l-badge-dot"></span>
            NOW LIVE ON ARC TESTNET
          </div>
          <h1 className="l-h1 l-fade-in" style={{ animationDelay: '0.25s' }}>
            Weave. Connect.<br/>
            <span className="l-h1-purple"><TypewriterCycle /></span>
          </h1>
          <p className="l-sub l-fade-in" style={{ animationDelay: '0.45s' }}>
            NAN is the simplest way to send, swap, lend, borrow, and bridge USDC and EURC on Arc — Circle's stablecoin-native blockchain. Non-custodial. For everyone, everywhere.
          </p>
          <div className="l-cta-row l-fade-in" style={{ animationDelay: '0.6s' }}>
            <button className="btn-primary" style={{ padding: '13px 32px', fontSize: '1rem' }}
              onClick={() => setShowAuthFlow && setShowAuthFlow(true)}>
              Get Started →
            </button>
            <a className="l-btn-ghost" href="https://faucet.arc.fun" target="_blank" rel="noreferrer">Get Free Tokens →</a>
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
      <section className="l-features" ref={featuresRef}>
        <div className="l-features-inner">
          <h2 className="l-section-title">Everything you need</h2>
          <p className="l-section-sub">One wallet. All the stablecoin rails you need on Arc.</p>
          <div className="l-feature-grid">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`l-feature-card ${cardsVisible ? 'l-card-visible' : ''}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="l-feature-ico">{f.icon}</div>
                <div className="l-feature-title">{f.title}</div>
                <div className="l-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="l-banner">
        <div className="l-banner-inner">
          <h2>Ready to start?</h2>
          <p>Connect with email, Google, Discord or your existing wallet. No gas fees.</p>
          <button className="btn-primary" style={{ padding: '13px 32px', fontSize: '1rem', background: '#fff', color: '#7000ff' }}
            onClick={() => setShowAuthFlow && setShowAuthFlow(true)}>
            Connect Wallet →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="l-footer">
        <NanLogo width={120} height={30} />
        <span className="l-footer-txt">Built on Arc · Powered by Circle · © 2025 NAN</span>
        <div className="l-footer-links">
          <a href="https://twitter.com/nanarc_xyz" target="_blank" rel="noreferrer">X/Twitter</a>
          <a href="https://github.com/Goddesszee/nan-react" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
