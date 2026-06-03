export function NanLogo({ width = 140, height = 36, theme = 'dark' }) {
  const fill = theme === 'light' ? '#111111' : '#ffffff'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 736 736" width={height} height={height}>
        <g fill={fill}>
          <path d="M248 215 H312 L490 520 H426 Z"/>
          <rect x="426" y="215" width="64" height="155"/>
          <rect x="248" y="365" width="64" height="155"/>
        </g>
      </svg>
      <span style={{
        fontFamily: "'Inter',system-ui,sans-serif",
        fontSize: `${height * 0.58}px`,
        fontWeight: 800,
        letterSpacing: '-0.03em',
        color: fill,
        lineHeight: 1,
      }}>NAN</span>
    </div>
  )
}
