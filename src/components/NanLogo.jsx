export function NanLogo({ height = 58, theme = 'dark' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={height} height={height} style={{flexShrink:0}}>
      <rect width="36" height="36" rx="6" fill="#7000ff"/>
      <rect x="7" y="7" width="22" height="22" rx="3" fill="#ffffff"/>
      <rect x="11" y="11" width="14" height="14" rx="2" fill="#000000"/>
      <text x="18" y="19" fontFamily="Inter,system-ui,sans-serif" fontSize="10" fontWeight="900" fill="#ffffff" textAnchor="middle" dominantBaseline="middle">N</text>
    </svg>
  )
}
