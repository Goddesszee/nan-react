import React, { useState, useEffect, useRef } from 'react'
import { useNanStore } from '../../store/nanStore'

// Slides 1 & 2 — your photos, no card overlay
// Slide 3 — the NAN card on a dark background
const SLIDES = [
  {
    type: 'photo' as const,
    img: '/assets/hero-1.jpg',
    fallback: 'linear-gradient(160deg,#e8e0f0 0%,#c9d6e8 100%)',
    headline: 'Send money\nto anyone.',
    sub: 'Instant USDC transfers on Arc. No fees, no waiting.',
  },
  {
    type: 'photo' as const,
    img: '/assets/hero-2.jpg',
    fallback: 'linear-gradient(160deg,#dce8f5 0%,#b8d4f0 100%)',
    headline: 'Your AI agent\nshops for you.',
    sub: 'Set spending limits, let Nan find the best deals.',
  },
  {
    type: 'card' as const,
    img: null,
    fallback: 'linear-gradient(160deg,#070711 0%,#0f1629 60%,#131a2e 100%)',
    headline: 'One card.\nAll of Web3.',
    sub: 'Your Circle USDC wallet on Arc Testnet. No private keys.',
  },
]

// ── NAN Card ──────────────────────────────────────────────────────────────────
function NanCard({ visible }: { visible: boolean }) {
  return (
    <div style={{
      width: 300, height: 190, borderRadius: 20,
      background: 'linear-gradient(135deg,#1e3a5f 0%,#2563EB 45%,#7C3AED 100%)',
      boxShadow: visible
        ? '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)'
        : '0 8px 16px rgba(0,0,0,0.3)',
      position: 'relative', overflow: 'hidden',
      transform: visible ? 'translateY(0) rotate(-4deg)' : 'translateY(40px) rotate(-4deg)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)',
      flexShrink: 0,
    }}>
      {/* Shine */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        background: 'linear-gradient(135deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 50%,transparent 100%)',
      }} />
      {/* Logo */}
      <div style={{ position: 'absolute', top: 22, left: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h4l8 12h4V20h-4L8 8H4V4z" fill="white" />
          </svg>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>NAN</span>
      </div>
      {/* USDC badge */}
      <div style={{ position: 'absolute', top: 22, right: 22, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', border: '1px solid rgba(255,255,255,0.2)' }}>USDC</div>
      {/* Chip */}
      <div style={{ position: 'absolute', bottom: 44, left: 24, width: 34, height: 26, borderRadius: 5, background: 'linear-gradient(135deg,#d4a832,#f0c040)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
      {/* Card number dots */}
      <div style={{ position: 'absolute', bottom: 50, right: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 3 }}>
            {[0,1,2,3].map(j => <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />)}
          </div>
        ))}
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>3762</span>
      </div>
      {/* Name */}
      <div style={{ position: 'absolute', bottom: 20, left: 24, color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Arc Testnet</div>
      {/* Network circles */}
      <div style={{ position: 'absolute', bottom: 18, right: 22, display: 'flex' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#EB4335' }} />
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#FBBC04', marginLeft: -8 }} />
      </div>
    </div>
  )
}

// ── Main landing page ─────────────────────────────────────────────────────────
export function LandingPage() {
  const { setActiveView } = useNanStore()
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState<boolean[]>([false, false, false])
  const [cardVisible, setCardVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Show card slightly after mount
  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  // Show card immediately when slide 3 becomes active
  useEffect(() => {
    if (current === 2) setCardVisible(true)
  }, [current])

  // Auto-advance slides every 4s
  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const goTo = (i: number) => {
    setCurrent(i)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4000)
  }

  const launch = () => setActiveView('onboarding')

  return (
    <div style={{ minHeight: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap');
        .slide-img { position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;transition:opacity 0.8s ease; }
        .nan-btn-primary { width:100%;padding:18px;background:#fff;color:#000;border:none;border-radius:50px;font-size:17px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;letter-spacing:-0.01em;transition:transform 0.15s; }
        .nan-btn-primary:active { transform:scale(0.97); }
        .nan-btn-secondary { width:100%;padding:18px;background:rgba(255,255,255,0.12);color:#fff;border:none;border-radius:50px;font-size:17px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;letter-spacing:-0.01em;backdrop-filter:blur(8px);transition:transform 0.15s,background 0.2s; }
        .nan-btn-secondary:active { transform:scale(0.97); }
        .nan-btn-secondary:hover { background:rgba(255,255,255,0.18); }
      `}</style>

      {/* ── Slide area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>

        {/* Background layers — photo slides */}
        {SLIDES.map((slide, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            background: slide.fallback,
            opacity: current === i ? 1 : 0,
            transition: 'opacity 0.9s ease',
            zIndex: 1,
          }}>
            {slide.type === 'photo' && slide.img && (
              <img
                src={slide.img}
                alt=""
                className="slide-img"
                style={{ opacity: loaded[i] ? 1 : 0 }}
                onLoad={() => setLoaded(prev => { const n = [...prev]; n[i] = true; return n })}
              />
            )}
            {/* Dark gradient — lighter in the middle so faces are clear */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2,
              background: slide.type === 'photo'
                ? 'linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.0) 30%,rgba(0,0,0,0.0) 55%,rgba(0,0,0,0.88) 100%)'
                : 'linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.0) 40%,rgba(0,0,0,0.55) 100%)',
            }} />
          </div>
        ))}

        {/* NAN logo — always on top */}
        <div style={{ position: 'relative', zIndex: 10, paddingTop: 56, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(37,99,235,0.6)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h4l8 12h4V20h-4L8 8H4V4z" fill="white" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff', letterSpacing: '-0.04em' }}>NAN</span>
          </div>
        </div>

        {/* Card — only shown on slide 3 */}
        <div style={{
          position: 'relative', zIndex: 10,
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingTop: 32,
          pointerEvents: current === 2 ? 'auto' : 'none',
        }}>
          <div style={{
            opacity: current === 2 ? 1 : 0,
            transform: current === 2 ? 'scale(1)' : 'scale(0.85)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}>
            <NanCard visible={cardVisible && current === 2} />
          </div>
        </div>

        {/* Slide headline */}
        <div style={{ position: 'relative', zIndex: 10, padding: '0 32px 24px', width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
          {SLIDES.map((slide, i) => (
            <div key={i} style={{
              position: i === 0 ? 'relative' : 'absolute',
              bottom: i !== 0 ? 24 : undefined,
              left: i !== 0 ? 32 : undefined,
              right: i !== 0 ? 32 : undefined,
              opacity: current === i ? 1 : 0,
              transform: current === i ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              pointerEvents: current === i ? 'auto' : 'none',
            }}>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 'clamp(28px,8vw,38px)', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 10px', whiteSpace: 'pre-line', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                {slide.headline}
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5, fontWeight: 400 }}>
                {slide.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 8, paddingBottom: 20 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: current === i ? 24 : 8, height: 8, borderRadius: 4,
              background: current === i ? '#fff' : 'rgba(255,255,255,0.35)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#000', padding: '24px 24px 36px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
        <button className="nan-btn-primary" onClick={launch}>Create account</button>
        <button className="nan-btn-secondary" onClick={launch}>Log in</button>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
          Powered by Arc · Circle USDC · Testnet
        </p>
      </div>
    </div>
  )
}
