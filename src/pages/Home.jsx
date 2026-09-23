const USDC = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
const EURC = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png'

const ACTIONS = [
  { id:'send',    label:'Send',    icon:'↑' },
  { id:'receive', label:'Receive', icon:'↓' },
  { id:'swap',    label:'Swap',    icon:'⇄' },
  { id:'bridge',  label:'Bridge',  icon:'⊞' },
]

export function Home({ setPage, usdcBal, eurcBal, totalUSD, totalNGN }) {
  return (
    <div className="page page-home">
      <div className="home-card">
        {/* Balance */}
        <div className="home-balance-card">
          <div className="balance-header">
            <span className="bal-label">TOTAL BALANCE</span>
            <span className="net-badge">• Arc Testnet</span>
          </div>
          <div className="bal-amount">${totalUSD}</div>
          <div className="bal-ngn">≈ ₦{totalNGN} NGN</div>
          <div className="bal-pills">
            <span className="bal-pill"><img src={USDC} width={14} height={14} style={{borderRadius:'50%'}} alt=""/> {usdcBal} USDC</span>
            <span className="bal-pill"><img src={EURC} width={14} height={14} style={{borderRadius:'50%'}} alt=""/> {eurcBal} EURC</span>
          </div>
        </div>

        {/* Actions */}
        <div className="action-section">
          <div className="action-grid">
            {ACTIONS.map(a => (
              <button key={a.id} className="action-btn" onClick={() => setPage(a.id)}>
                <div className="action-ico">{a.icon}</div>
                <span className="action-lbl">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Earn */}
        <div className="earn-section">
          <div className="earn-left">
            <div className="earn-label">SAVE & EARN</div>
            <div className="earn-rate">4.80% <span>/ year</span></div>
            <div className="earn-sub">Withdraw anytime · No lockup</div>
          </div>
          <button className="btn-primary" onClick={() => setPage('earn')}>Start saving →</button>
        </div>

        {/* Assets */}
        <div className="asset-section">
          <div className="asset-section-header">YOUR ASSETS</div>
          {[
            { sym:'USDC', name:'USD Coin',  bal:usdcBal, logo:USDC },
            { sym:'EURC', name:'Euro Coin', bal:eurcBal, logo:EURC },
          ].map(a => (
            <div key={a.sym} className="asset-row">
              <img src={a.logo} width={40} height={40} style={{borderRadius:'50%',flexShrink:0}} alt={a.sym}/>
              <div className="asset-info">
                <div className="asset-sym">{a.sym}</div>
                <div className="asset-name">{a.name}</div>
              </div>
              <div className="asset-bal">
                <div className="asset-bal-num">{a.bal}</div>
                <div className="asset-usd">≈ $0.00</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
