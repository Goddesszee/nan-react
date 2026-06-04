export function NanLogo({ height = 42, theme = 'dark' }) {
  return (
    <div style={{
      background: '#7000ff',
      borderRadius: '16px',
      width: `${height}px`,
      height: `${height}px`,
      flexShrink: 0,
      boxShadow: '0 2px 12px rgba(112,0,255,.4)',
    }} />
  )
}
