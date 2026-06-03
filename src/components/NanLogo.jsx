import { useEffect, useState } from 'react'

export function NanLogo({ height = 42, theme = 'auto' }) {
  const [resolvedTheme, setResolvedTheme] = useState(theme)

  useEffect(() => {
    if (theme !== 'auto') { setResolvedTheme(theme); return; }
    const t = document.documentElement.getAttribute('data-theme') || 'dark'
    setResolvedTheme(t)
    const obs = new MutationObserver(() => {
      setResolvedTheme(document.documentElement.getAttribute('data-theme') || 'dark')
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [theme])

  // Always purple N mark — brand identity regardless of theme
  const nFill = '#8b5cf6'
  const textColor = resolvedTheme === 'light' ? '#111111' : '#ffffff'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Geometric N mark — bold, clean, instantly recognizable */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={Math.round(height * 0.82)}
        height={height}
        style={{ display: 'block', flexShrink: 0 }}
      >
        <polygon points="10,90 10,10 30,10 58,62 58,10 78,10 78,90 58,90 30,38 30,90" fill={nFill}/>
        <rect x="78" y="10" width="14" height="80" fill={nFill}/>
      </svg>
      <span style={{
        fontFamily: "'Oswald', 'Inter', sans-serif",
        fontSize: `${height * 0.82}px`,
        fontWeight: 700,
        color: textColor,
        letterSpacing: '.06em',
        lineHeight: 1,
        marginLeft: 2,
      }}>AN</span>
    </div>
  )
}
