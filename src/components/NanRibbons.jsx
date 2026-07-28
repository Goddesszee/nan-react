// Animated landing background: layered sine-wave ribbons.
// Tune these two to make the waves stronger (higher) or fainter (lower).
// 1 = the built-in opacities below, 0.5 = half as visible, 2 = twice.
const OPACITY_DARK = 1
const OPACITY_LIGHT = 0.5

const W = 2720

function wave(y, amp, per, close) {
  let d = `M0 ${y} Q${per / 2} ${y - amp} ${per} ${y}`
  for (let x = per * 2; x <= W; x += per) d += ` T${x} ${y}`
  if (close != null) d += ` V${close} H0 Z`
  return d
}

const BANDS = [
  { d: wave(345, 30, 340, 400), fill: '#7000ff', o: 0.098, dur: 18 },
  { d: wave(361, 36, 272, 400), fill: '#a855f7', o: 0.112, dur: 26 },
  { d: wave(377, 29, 680, 400), fill: '#4a0f8f', o: 0.210, dur: 34 },
]
const TOPLINE = { d: wave(120, 18, 340), stroke: '#a855f7', o: 0.182, dur: 22 }

export function NanRibbons({ dark = true }) {
  const k = dark ? OPACITY_DARK : OPACITY_LIGHT
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, zIndex: 0,
        pointerEvents: 'none', overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes nanflow { to { transform: translateX(-1360px) } }
        @media (prefers-reduced-motion: reduce) {
          .nan-ribbon { animation: none !important }
        }
      `}</style>
      <svg
        viewBox="0 0 1360 400"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {BANDS.map((b, i) => (
          <g key={i} className="nan-ribbon" style={{ animation: `nanflow ${b.dur}s linear infinite` }}>
            <path d={b.d} fill={b.fill} opacity={(b.o * k).toFixed(3)} />
          </g>
        ))}
        <g className="nan-ribbon" style={{ animation: `nanflow ${TOPLINE.dur}s linear infinite` }}>
          <path d={TOPLINE.d} fill="none" stroke={TOPLINE.stroke} strokeWidth="1" opacity={(TOPLINE.o * k).toFixed(3)} />
        </g>
      </svg>
    </div>
  )
}
