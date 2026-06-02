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
    const NODE_COLOR   = dark ? 'rgba(112,0,255,' : 'rgba(112,0,255,'
    const EDGE_COLOR   = dark ? 'rgba(112,0,255,' : 'rgba(112,0,255,'
    const PULSE_COLOR  = dark ? '#c084fc' : '#7000ff'
    const GLOW_COLOR   = dark ? 'rgba(112,0,255,' : 'rgba(112,0,255,'
    const nodeAlpha    = dark ? 0.9 : 0.7
    const edgeAlpha    = dark ? 0.18 : 0.12
    const glowAlpha    = dark ? 0.25 : 0.12

    function resize() {
      w = canvas.width  = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
      initScene()
    }

    function initScene() {
      const count = Math.floor((w * h) / 18000)
      nodes = Array.from({ length: Math.max(count, 14) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        r: Math.random() * 3 + 1.5,
        pulse: Math.random() * Math.PI * 2,
      }))

      edges = []
      pulses = []

      // Build edges — connect nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 260) edges.push({ a: i, b: j, dist })
        }
      }

      // Seed initial pulses
      for (let i = 0; i < 6; i++) spawnPulse()
    }

    function spawnPulse() {
      if (!edges.length) return
      const edge = edges[Math.floor(Math.random() * edges.length)]
      const reverse = Math.random() > 0.5
      pulses.push({
        edge,
        t: 0,
        speed: Math.random() * 0.008 + 0.004,
        reverse,
        size: Math.random() * 3 + 2,
        trail: [],
      })
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // Update node positions
      for (const n of nodes) {
        n.pulse += 0.025
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }

      // Rebuild edges dynamically
      edges = []
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 220) edges.push({ a: i, b: j, dist: d })
        }
      }

      // Draw edges
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b]
        const alpha = edgeAlpha * (1 - e.dist / 220)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = EDGE_COLOR + alpha + ')'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      // Draw nodes
      for (const n of nodes) {
        const pulsed = n.r + Math.sin(n.pulse) * 1.2
        // glow
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pulsed * 5)
        g.addColorStop(0, GLOW_COLOR + glowAlpha + ')')
        g.addColorStop(1, GLOW_COLOR + '0)')
        ctx.beginPath()
        ctx.arc(n.x, n.y, pulsed * 5, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        // core
        ctx.beginPath()
        ctx.arc(n.x, n.y, pulsed, 0, Math.PI * 2)
        ctx.fillStyle = NODE_COLOR + nodeAlpha + ')'
        ctx.fill()
      }

      // Update + draw pulses
      const alive = []
      for (const p of pulses) {
        p.t += p.speed
        if (p.t > 1) { spawnPulse(); continue }

        const edge = p.edge
        if (!nodes[edge.a] || !nodes[edge.b]) continue
        const a = nodes[edge.a], b = nodes[edge.b]
        const t = p.reverse ? 1 - p.t : p.t
        const px = a.x + (b.x - a.x) * t
        const py = a.y + (b.y - a.y) * t

        // trail
        p.trail.push({ x: px, y: py, alpha: 1 })
        if (p.trail.length > 18) p.trail.shift()

        for (let i = 0; i < p.trail.length; i++) {
          const tp = p.trail[i]
          const ta = (i / p.trail.length) * 0.7
          ctx.beginPath()
          ctx.arc(tp.x, tp.y, p.size * (i / p.trail.length) * 0.8, 0, Math.PI * 2)
          ctx.fillStyle = dark
            ? `rgba(192,132,252,${ta})`
            : `rgba(112,0,255,${ta * 0.8})`
          ctx.fill()
        }

        // pulse head
        const hg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3)
        hg.addColorStop(0, dark ? 'rgba(255,255,255,0.95)' : 'rgba(112,0,255,0.95)')
        hg.addColorStop(0.4, dark ? 'rgba(192,132,252,0.6)' : 'rgba(147,51,234,0.5)')
        hg.addColorStop(1, 'rgba(112,0,255,0)')
        ctx.beginPath()
        ctx.arc(px, py, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = hg
        ctx.fill()

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = PULSE_COLOR
        ctx.fill()

        alive.push(p)
      }
      pulses = alive

      // Maintain pulse count
      while (pulses.length < 8) spawnPulse()

      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
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

// ── Landing ───────────────────────────────────────────────────────────────────
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
    <div className="landing" data-theme={theme} style={{ position: 'relative' }}>

      {/* Full-screen canvas — behind everything */}
      <NetworkCanvas theme={theme} />

      {/* Nav */}
      <nav className="l-nav" style={{ position: 'relative', zIndex: 10 }}>
        <NanLogo width={160} height={40} />
        <div className="l-nav-right">
          <button className="l-theme-btn" onClick={toggleTheme}>{theme==='light'?'🌙':'☀️'}</button>
          <span className="l-net-pill">• Arc Testnet</span>
          <DynamicWidget />
        </div>
      </nav>

      {/* Hero — full viewport height */}
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
            Send, swap, and bridge USDC & EURC on Arc — Circle's stablecoin-native blockchain. No gas fees. No borders. For everyone, everywhere.
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
      <section className="l-features" ref={featuresRef} style={{ position: 'relative', zIndex: 1 }}>
        <div className="l-features-inner">
          <h2 className="l-section-title">Everything you need</h2>
          <p className="l-section-sub">One wallet. All the stablecoin rails you need on Arc.</p>
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

      {/* CTA Banner */}
      <section className="l-banner" style={{ position: 'relative', zIndex: 1 }}>
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
      <footer className="l-footer" style={{ position: 'relative', zIndex: 1 }}>
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
