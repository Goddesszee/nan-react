export function NanLogo({ width = 180, height = 44 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 280 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(35,35)">
        {/* Infinity mark — white */}
        <path d="M16,0 C16,-15 0,-15 0,0 C0,15 16,15 25,0 C34,-15 50,-15 50,0 C50,15 34,15 25,0 Z"
          fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        {/* N */}
        <line x1="65" y1="-13" x2="65" y2="13" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="65" y1="-13" x2="83" y2="13" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="83" y1="-13" x2="83" y2="13" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
        {/* A */}
        <line x1="91" y1="13" x2="100" y2="-13" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="109" y1="13" x2="100" y2="-13" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="94" y1="3" x2="106" y2="3" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
        {/* N */}
        <line x1="117" y1="-13" x2="117" y2="13" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="117" y1="-13" x2="135" y2="13" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="135" y1="-13" x2="135" y2="13" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"/>
      </g>
    </svg>
  )
}
