export function NanLogo({ height = 38, theme = 'auto' }) {
  const fill = theme === 'light' ? '#6d28d9' : '#8b5cf6'
  const width = Math.round(height * 0.8)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="235 205 265 325"
      width={width}
      height={height}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="NAN"
      role="img"
    >
      <g fill={fill}>
        <path d="M248 215 H312 L490 520 H426 Z"/>
        <rect x="426" y="215" width="64" height="155"/>
        <rect x="248" y="365" width="64" height="155"/>
      </g>
    </svg>
  )
}
