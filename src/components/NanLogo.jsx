export function NanLogo({ height = 32 }) {
  return (
    <div style={{background:'#7000ff', borderRadius:8, padding:'6px 12px', display:'inline-flex', alignItems:'center'}}>
      <span style={{fontWeight:700, fontSize:height * 0.53, color:'#fff', fontFamily:'Inter, sans-serif'}}>NAN</span>
    </div>
  )
}
