export function More({ setPage, address, disconnect }) {
  const short = a => a ? `${a.slice(0,6)}...${a.slice(-4)}` : 'Not set'
  const items = [
    { label:'Send',    page:'send',    ico:'↑' },
    { label:'Receive', page:'receive', ico:'↓' },
    { label:'Swap',    page:'swap',    ico:'⇄' },
    { label:'Bridge',  page:'bridge',  ico:'⊞' },
    { label:'Earn',    page:'earn',    ico:'◎' },
  ]

  // New premium features — open as separate routes
  const newFeatures = [
    { label: 'Shop with USDC', href: '/shop', ico: '🛍️', desc: 'Browse and buy from merchants' },
    { label: 'AI Agent',       href: '/agent', ico: '🤖', desc: 'Let your agent shop for you' },
    { label: 'Activity',       href: '/activity', ico: '📊', desc: 'Full transaction history' },
  ]

  return (
    <div className="page">
      <div className="page-card">
        <div className="page-header"><h2>More</h2></div>
        <div className="wallet-info-box">
          <div className="wallet-label">CONNECTED WALLET</div>
          <div className="wallet-addr">{short(address)}</div>
          <div className="wallet-net">Arc Testnet · Chain ID 5042002</div>
        </div>

        <div className="more-list">
          {items.map(i => (
            <button key={i.page} className="more-item" onClick={() => setPage(i.page)}>
              <span>{i.ico} {i.label}</span>
              <span style={{color:'var(--text3)'}}>→</span>
            </button>
          ))}
        </div>

        {/* New premium features */}
        <div style={{margin:'18px 0 8px',fontSize:'.8rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--text3)'}}>
          NEW FEATURES
        </div>
        <div className="more-list">
          {newFeatures.map(f => (
            <a key={f.href} href={f.href} className="more-item" style={{textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{display:'flex',flexDirection:'column',gap:2}}>
                <span style={{color:'var(--text)',fontWeight:600}}>{f.ico} {f.label}</span>
                <span style={{fontSize:'.85rem',color:'var(--text3)'}}>{f.desc}</span>
              </span>
              <span style={{color:'var(--text3)'}}>→</span>
            </a>
          ))}
        </div>

        <button className="btn-danger" onClick={disconnect}>Disconnect Wallet</button>
      </div>
    </div>
  )
}
