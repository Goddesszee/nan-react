export function NanLogo({ height = 42, theme = 'dark' }) {
  return (
    <div style={{
      background: '#7000ff',
      borderRadius: '16px',
      width: `${height}px`,
      height: `${height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 2px 12px rgba(112,0,255,.4)',
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="235 205 265 325"
        width={Math.round(height * 0.55)} height={Math.round(height * 0.7)}
        style={{ display: 'block' }}>
        <g fill="#ffffff">
          <path d="M248 215 H312 L490 520 H426 Z"/>
          <rect x="426" y="215" width="64" height="155"/>
          <rect x="248" y="365" width="64" height="155"/>
        </g>
      </svg>
    </div>
  )
}
