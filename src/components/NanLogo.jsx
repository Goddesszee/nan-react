export function NanLogo({ height = 72, theme = 'dark' }) {
  const fill = theme === 'light' ? '#111111' : '#ffffff'
  // Tight viewBox crops empty space so N fills the render size
  const viewBox = "235 205 265 325"
  const svgW = Math.round(height * 0.8)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} width={svgW} height={height}>
        <g fill={fill}>
          <path d="M248 215 H312 L490 520 H426 Z"/>
          <rect x="426" y="215" width="64" height="155"/>
          <rect x="248" y="365" width="64" height="155"/>
        </g>
      </svg>
      <span style={{
        fontFamily: "'Inter',system-ui,sans-serif",
        fontSize: `${height * 0.62}px`,
        fontWeight: 800,
        letterSpacing: '-0.04em',
        color: fill,
        lineHeight: 1,
      }}>NAN</span>
    </div>
  )
}
