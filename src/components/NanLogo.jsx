export function NanLogo({ height = 42, theme = 'dark' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={height} height={height} style={{flexShrink:0}}>
      <rect width="36" height="36" rx="6" fill="#7000ff"/>
      <rect x="7" y="7" width="22" height="22" rx="4" fill="#ffffff"/>
      <rect x="13" y="13" width="10" height="10" rx="2" fill="#000000"/>
    </svg>
  )
}
