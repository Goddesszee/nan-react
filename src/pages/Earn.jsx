import { useState } from 'react'

export function Earn({ toast, setPage, usdcBal }) {
  const [tab, setTab] = useState('deposit')
  const [amt, setAmt] = useState('')

  const deposited = 0
  const earned = 0
  const apy = 4.80

  return (
    <div className="page earn-page">
      <div className="earn-shell">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Save &amp; Earn</h2>
        </div>

        <div className="earn-stat-grid">
          <div className="earn-stat-card">
            <div className="earn-stat-label">Total Deposited</div>
            <div className="earn-stat-value">${deposited.toFixed(2)}</div>
          </div>
          <div className="earn-stat-card">
            <div className="earn-stat-label">Total Earned</div>
            <div className="earn-stat-value positive">${earned.toFixed(2)}</div>
          </div>
          <div className="earn-stat-card">
            <div className="earn-stat-label">Current APY</div>
            <div className="earn-stat-value accent">{apy.toFixed(2)}%</div>
          </div>
          <div className="earn-stat-card">
            <div className="earn-stat-label">Available Balance</div>
            <div className="earn-stat-value">{usdcBal} USDC</div>
          </div>
        </div>

        <div className="earn-tab-row">
          <button className={`earn-tab ${tab === 'deposit' ? 'active' : ''}`} onClick={() => setTab('deposit')}>Deposit</button>
          <button className={`earn-tab ${tab === 'withdraw' ? 'active' : ''}`} onClick={() => setTab('withdraw')}>Withdraw</button>
        </div>

        <div className="earn-panel">
          <div className="earn-apy-row">
            <div className="earn-apy-num">{apy.toFixed(2)}%</div>
            <div className="earn-apy-sub">Annual Percentage Yield<br/>Powered by Circle · No lockup · Withdraw anytime</div>
          </div>

          <div className="form-group">
            <label>{tab === 'deposit' ? 'Amount to deposit' : 'Amount to withdraw'} <span className="bal-hint">Bal: {usdcBal} USDC</span></label>
            <div className="amt-row">
              <input className="inp" type="number" placeholder="0.00" value={amt} onChange={e => setAmt(e.target.value)} />
              <button className="max-btn" onClick={() => setAmt(usdcBal)}>MAX</button>
            </div>
          </div>

          <button className="btn-primary full" onClick={() => toast('Earn coming soon on Arc Testnet', 'info')}>
            {tab === 'deposit' ? 'Start Saving' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  )
}
