import { useState } from 'react'

const CHAINS = [
  { val:'ETH-SEPOLIA',  label:'Ethereum Sepolia', icon:'⟠' },
  { val:'AVAX-FUJI',    label:'Avalanche Fuji',   icon:'🔺' },
  { val:'BASE-SEPOLIA', label:'Base Sepolia',      icon:'🔵' },
]

export function Bridge({ toast, setPage, usdcBal, address, apiFetch }) {
  const [chain, setChain]   = useState('ETH-SEPOLIA')
  const [token, setToken]   = useState('USDC')
  const [toAddr, setToAddr] = useState('')
  const [amt, setAmt]       = useState('')
  const [bridging, setBridging] = useState(false)

  const doBridge = async () => {
    if (!amt || !toAddr) return toast('Enter amount and destination', 'error')
    setBridging(true)
    try {
      const res = await apiFetch('/api/bridge', {
        method: 'POST',
        body: JSON.stringify({ fromChain: 'ARC', toChain: chain, token, amount: amt, toAddress: toAddr, fromAddress: address }),
      })
      toast('Bridge initiated! ' + (res.txHash || ''), 'success')
      setAmt('')
    } catch(e) {
      toast(e.message || 'Bridge failed', 'error')
    } finally {
      setBridging(false)
    }
  }

  return (
    <div className="page page-bridge">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Bridge</h2>
        </div>
        <div className="form-group">
          <label>From</label>
          <div className="inp readonly">Arc Testnet</div>
        </div>
        <div className="form-group">
          <label>To chain</label>
          <select className="inp" value={chain} onChange={e => setChain(e.target.value)}>
            {CHAINS.map(c => <option key={c.val} value={c.val}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Token</label>
          <div className="token-toggle">
            {['USDC','EURC'].map(t => (
              <button key={t} className={`token-btn${token===t?' active':''}`} onClick={() => setToken(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Destination address</label>
          <input className="inp" placeholder="0x..." value={toAddr} onChange={e => setToAddr(e.target.value)}/>
        </div>
        <div className="form-group">
          <label>Amount <span className="bal-hint">Bal: {usdcBal} USDC</span></label>
          <div className="amt-row">
            <input className="inp" type="number" placeholder="0.00" value={amt} onChange={e => setAmt(e.target.value)}/>
            <button className="max-btn" onClick={() => setAmt(usdcBal)}>MAX</button>
          </div>
        </div>
        <button className="btn-primary full" onClick={doBridge} disabled={bridging}>
          {bridging ? 'Bridging...' : 'Bridge via CCTP V2'}
        </button>
      </div>
    </div>
  )
}
