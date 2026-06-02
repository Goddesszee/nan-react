export function More({ setPage, address, disconnect }) {
  const short = a => a ? `${a.slice(0,6)}...${a.slice(-4)}` : ''

  const items = [
    { label: 'Send',     page: 'send'    },
    { label: 'Receive',  page: 'receive' },
    { label: 'Swap',     page: 'swap'    },
    { label: 'Bridge',   page: 'bridge'  },
  ]

  return (
    <div className="page page-more">
      <div className="page-card">
        <h2>More</h2>
        <div className="wallet-info-box">
          <div className="wallet-label">Connected Wallet</div>
          <div className="wallet-addr">{short(address)}</div>
          <div className="wallet-net">Arc Testnet · Chain 5042002</div>
        </div>
        <div className="more-list">
          {items.map(i => (
            <button key={i.page} className="more-item" onClick={() => setPage(i.page)}>
              {i.label} <span>→</span>
            </button>
          ))}
        </div>
        <button className="btn-danger" onClick={disconnect}>Disconnect Wallet</button>
      </div>
    </div>
  )
}
