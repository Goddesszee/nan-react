import { useState } from 'react'

const CHAINS = [
  { val:'ETH-SEPOLIA',  label:'Ethereum Sepolia', icon:'⟠' },
  { val:'AVAX-FUJI',    label:'Avalanche Fuji',   icon:'🔺' },
  { val:'BASE-SEPOLIA', label:'Base Sepolia',      icon:'🔵' },
  { val:'ARB-SEPOLIA',  label:'Arbitrum Sepolia',  icon:'🔷' },
]

export function Bridge({ toast, setPage, usdcBal, address, apiFetch }) {
  const [chain, setChain] = useState('ETH-SEPOLIA')
  const [toAddr, setToAddr] = useState('')
  const [amt, setAmt] = useState('')
  const [bridging, setBridging] = useState(false)

  const doBridge = async () => {
    if (!amt || !toAddr) return toast('Enter amount and destination address', 'error')
    if (parseFloat(amt) > parseFloat(usdcBal)) return toast('Insufficient USDC balance', 'error')
    setBridging(true)
    try {
      const res = await apiFetch('/api/appkit/bridge', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: address,
          destChain: chain,
          destAddr: toAddr,
          amount: amt,
        }),
      })
      if (!res.success && !res.pending) throw new Error(res.error || 'Bridge failed')
      toast('Bridge submitted via CCTP V2! Takes ~20 seconds.', 'success')
      setAmt('')
    } catch(e) {
      toast(e.message || 'Bridge failed', 'error')
    } finally { setBridging(false) }
  }

  return (
    <div className="page">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Bridge</h2>
        </div>
        <div className="bridge-flow">
          <div className="bridge-chain">Arc Testnet</div>
          <div className="bridge-arrow">→</div>
          <div className="bridge-chain">
            <select style={{background:'none',border:'none',color:'inherit',fontWeight:700,width:'100%',outline:'none',fontSize:'inherit'}}
              value={chain} onChange={e => setChain(e.target.value)}>
              {CHAINS.map(c => <option key={c.val} value={c.val}>{c.icon} {c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="bridge-info">⚡ Powered by Circle CCTP V2 · Arrives in ~20 seconds · No gas on destination</div>
        <div className="form-group">
          <label>Destination address</label>
          <input className="inp" placeholder="0x..." value={toAddr} onChange={e => setToAddr(e.target.value)}/>
        </div>
        <div className="form-group">
          <label>Amount (USDC) <span className="bal-hint">Bal: {usdcBal} USDC</span></label>
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
