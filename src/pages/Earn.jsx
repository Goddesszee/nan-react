import { useState } from 'react'

export function Earn({ toast, setPage, usdcBal }) {
  const [amt, setAmt] = useState('')
  const [depositing, setDepositing] = useState(false)

  return (
    <div className="page page-earn">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Save & Earn</h2>
        </div>
        <div className="earn-rate-card">
          <div className="earn-apy">4.80%</div>
          <div className="earn-apy-label">Annual Yield</div>
          <div className="earn-sub">Powered by Circle · Withdraw anytime · No lockup</div>
        </div>
        <div className="form-group">
          <label>Amount to deposit <span className="bal-hint">Bal: {usdcBal} USDC</span></label>
          <div className="amt-row">
            <input className="inp" type="number" placeholder="0.00" value={amt} onChange={e => setAmt(e.target.value)}/>
            <button className="max-btn" onClick={() => setAmt(usdcBal)}>MAX</button>
          </div>
        </div>
        <button className="btn-primary full" disabled={depositing} onClick={() => {
          toast('Earn coming soon on Arc Testnet', 'info')
        }}>
          {depositing ? 'Depositing...' : 'Start Saving'}
        </button>
      </div>
    </div>
  )
}
