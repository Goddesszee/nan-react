export function NanLogo({ height = 58, color = '#7000ff' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width={height * 0.675} height={height} style={{flexShrink:0}}>
      <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill={color}/>
      <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill={color}/>
    </svg>
  )
}
