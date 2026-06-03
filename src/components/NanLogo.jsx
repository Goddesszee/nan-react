export function NanLogo({ height = 42, theme = 'dark' }) {
  const textColor = theme === 'light' ? '#111111' : '#ffffff'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="235 205 265 325"
        width={Math.round(height * 0.76)} height={height}
        style={{ display: 'block', flexShrink: 0 }}>
        <g fill="#7000ff">
          <path d="M248 215 H312 L490 520 H426 Z"/>
          <rect x="426" y="215" width="64" height="155"/>
          <rect x="248" y="365" width="64" height="155"/>
        </g>
      </svg>
      <span style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: `${height * 0.71}px`,
        fontWeight: 700,
        color: textColor,
        letterSpacing: '.04em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>AN</span>
    </div>
  )
}
