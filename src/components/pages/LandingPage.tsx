import React, { useState, useEffect, useRef } from 'react'
import { useNanStore } from '../../store/nanStore'

const SLIDES = [
  {
    img: '/assets/hero-1.jpg',
    headline: 'Send money\nto anyone.',
    sub: 'Instant USDC transfers on Arc. No fees, no waiting.',
  },
  {
    img: '/assets/hero-2.jpg',
    headline: 'Your AI agent\nshops for you.',
    sub: 'Set spending limits. Let Nan find the best deals.',
  },
]

export function LandingPage() {
  const { setActiveView } = useNanStore()
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState([false, false])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5000)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const goTo = (i: number) => {
    setCurrent(i)
    resetTimer()
  }

  const launch = () => setActiveView('onboarding')

  return (
    <div style={{
      position: 'fixed', inset: 0,
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .nan-cta {
          display: block; width: 100%;
          padding: 18px 0;
          background: #fff; color: #000;
          border: none; border-radius: 100px;
          font-size: 17px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
        }
        .nan-cta:active { transform: scale(0.97); opacity: 0.9; }

        .nan-cta-ghost {
          display: block; width: 100%;
          padding: 18px 0;
          background: rgba(255,255,255,0.14);
          color: #fff;
          border: none; border-radius: 100px;
          font-size: 17px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .nan-cta-ghost:active { transform: scale(0.97); }
        .nan-cta-ghost:hover { background: rgba(255,255,255,0.22); }
      `}</style>

      {/* ── Full-bleed photo slides ── */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', inset: 0,
            opacity: current === i ? 1 : 0,
            transition: 'opacity 1s ease',
            zIndex: 0,
          }}
        >
          {/* Photo */}
          <img
            src={slide.img}
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
              opacity: loaded[i] ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }}
            onLoad={() => setLoaded(prev => { const n = [...prev]; n[i] = true; return n })}
          />
          {/* Fallback bg while image loads */}
          <div style={{
            position: 'absolute', inset: 0,
            background: i === 0
              ? 'linear-gradient(160deg,#e8e0f0 0%,#c0cfe8 100%)'
              : 'linear-gradient(160deg,#dce8f5 0%,#b8d4f0 100%)',
          }} />
        </div>
      ))}

      {/* ── Top-to-bottom gradient: dark top for nav, clear middle for face, dark bottom for copy ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.92) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── UI layer ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Nav */}
        <div style={{
          padding: '52px 28px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(37,99,235,0.5)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.04em',
            }}>N</div>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.03em',
            }}>NAN</span>
          </div>

          {/* Login link */}
          <button
            onClick={launch}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 100,
              padding: '9px 20px',
              color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >Log in</button>
        </div>

        {/* Spacer — pushes copy to bottom */}
        <div style={{ flex: 1 }} />

        {/* ── Headline + sub ── */}
        <div style={{ padding: '0 28px 28px', position: 'relative', minHeight: 100 }}>
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                bottom: i !== 0 ? 28 : undefined,
                left: i !== 0 ? 28 : undefined,
                right: i !== 0 ? 28 : undefined,
                opacity: current === i ? 1 : 0,
                transform: current === i ? 'translateY(0)' : 'translateY(14px)',
                transition: 'opacity 0.55s ease, transform 0.55s ease',
                pointerEvents: current === i ? 'auto' : 'none',
              }}
            >
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(34px, 10vw, 48px)',
                color: '#fff',
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                margin: '0 0 12px',
                whiteSpace: 'pre-line',
                textShadow: '0 2px 16px rgba(0,0,0,0.4)',
              }}>
                {slide.headline}
              </h1>
              <p style={{
                fontSize: 16, lineHeight: 1.5,
                color: 'rgba(255,255,255,0.78)',
                margin: 0, fontWeight: 400,
              }}>
                {slide.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Dot indicators ── */}
        <div style={{
          display: 'flex', gap: 6, justifyContent: 'center',
          paddingBottom: 24,
        }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: current === i ? 28 : 8,
                height: 8, borderRadius: 4,
                background: current === i ? '#fff' : 'rgba(255,255,255,0.38)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* ── CTAs ── */}
        <div style={{
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 24px 40px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <button className="nan-cta" onClick={launch}>Get started — it's free</button>
          <button className="nan-cta-ghost" onClick={launch}>I already have an account</button>
          <p style={{
            textAlign: 'center',
            fontSize: 11, color: 'rgba(255,255,255,0.28)',
            margin: '4px 0 0',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.03em',
          }}>
            Powered by Arc · Circle USDC · Testnet
          </p>
        </div>
      </div>
    </div>
  )
}
