export function NanLogo({ width = 140, height = 36, theme = 'dark' }) {
  const fill = theme === 'light' ? '#111111' : '#ffffff'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 736 736" width={height} height={height}>
        <g fill={fill}>
          <rect x="188" y="185" width="90" height="366"/>
          <path d="M188 185 H278 L548 551 H458 Z"/>
          <rect x="458" y="185" width="90" height="366"/>
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
