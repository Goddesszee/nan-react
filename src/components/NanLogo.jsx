export function NanLogo({ height = 42, theme = 'dark' }) {
  const size = height
  const inner = Math.round(size * 0.39)
  const offset = Math.round(size * 0.19)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={size} height={size} style={{flexShrink:0}}>
      <rect width="36" height="36" fill="#7000ff"/>
      <rect x="7" y="7" width="14" height="14" fill="#ffffff"/>
    </svg>
  )
}
