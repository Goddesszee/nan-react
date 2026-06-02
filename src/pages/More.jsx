export function More({ setPage, address, disconnect }) {
  const short = a => a ? `${a.slice(0,6)}...${a.slice(-4)}` : '—'
  const items = [
    { label:'Send',    page:'send',    ico:'↑' },
    { label:'Receive', page:'receive', ico:'↓' },
    { label:'Swap',    page:'swap',    ico:'⇄' },
    { label:'Bridge',  page:'bridge',  ico:'⊞' },
    { label:'Earn',    page:'earn',    ico:'📈' },
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
        <button className="btn-danger" onClick={disconnect}>Disconnect Wallet</button>
      </div>
    </div>
  )
}
