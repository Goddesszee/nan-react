export function NanLogo({ height = 42, theme = 'auto' }) {
  const nFill = '#6d28d9'
  const textColor = theme === 'light' ? '#1a1a1a' : '#ffffff'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="235 205 265 325"
        width={Math.round(height * 0.85)}
        height={height}
        style={{ display: 'block', flexShrink: 0 }}
      >
        <g fill={nFill}>
          <path d="M248 215 H312 L490 520 H426 Z"/>
          <rect x="426" y="215" width="64" height="155"/>
          <rect x="248" y="365" width="64" height="155"/>
        </g>
      </svg>
      <span style={{
        fontFamily: "'Oswald', 'Inter', sans-serif",
        fontSize: `${height * 0.52}px`,
        fontWeight: 600,
        color: nFill,
        letterSpacing: '.06em',
        lineHeight: 1,
        marginLeft: 1,
        marginTop: `${height * 0.22}px`,
      }}>an</span>
    </div>
  )
}
