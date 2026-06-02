import { useState } from 'react'

const USDC_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
const EURC_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png'

export function Swap({ toast, setPage, usdcBal, eurcBal, fetchBalances, address, apiFetch }) {
  const [from, setFrom]   = useState('USDC')
  const [amt, setAmt]     = useState('')
  const [quote, setQuote] = useState(null)
  const [swapping, setSwapping] = useState(false)
  const [quoting, setQuoting]   = useState(false)

  const to = from === 'USDC' ? 'EURC' : 'USDC'
  const fromBal = from === 'USDC' ? usdcBal : eurcBal
  const logo = (sym) => sym === 'USDC' ? USDC_LOGO : EURC_LOGO

  const flip = () => { setFrom(to); setAmt(''); setQuote(null) }

  const getQuote = async (value) => {
    if (!value || parseFloat(value) <= 0) return setQuote(null)
    setQuoting(true)
    try {
      const res = await apiFetch('/api/appkit/swap', {
        method: 'POST',
        body: JSON.stringify({ action:'quote', tokenIn:from, tokenOut:to, amountIn:value, walletAddress:address }),
      })
      if (res.success && res.amountOut) setQuote(res.amountOut)
    } catch(e) {} finally { setQuoting(false) }
  }

  const doSwap = async () => {
    if (!amt || parseFloat(amt) <= 0) return toast('Enter amount', 'error')
    if (parseFloat(amt) > parseFloat(fromBal)) return toast('Insufficient balance', 'error')
    setSwapping(true)
    try {
      const res = await apiFetch('/api/appkit/swap', {
        method: 'POST',
        body: JSON.stringify({ action:'swap', walletAddress:address, tokenIn:from, tokenOut:to, amountIn:amt }),
      })
      if (!res.success && !res.pending) throw new Error(res.error || 'Swap failed')
      toast(`Swap submitted! ${amt} ${from} → ${to}`, 'success')
      setTimeout(() => fetchBalances(address), 5000)
      setAmt(''); setQuote(null)
    } catch(e) {
      toast(e.message || 'Swap failed', 'error')
    } finally { setSwapping(false) }
  }

  return (
    <div className="page">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Swap</h2>
        </div>
        <div className="swap-box">
          <label>FROM</label>
          <div className="swap-row">
            <div className="token-sel">
              <img src={logo(from)} width={22} height={22} style={{borderRadius:'50%'}} alt=""/>
              <span>{from}</span>
            </div>
            <input className="swap-inp" type="number" placeholder="0.00" value={amt}
              onChange={e => { setAmt(e.target.value); getQuote(e.target.value) }}/>
          </div>
          <div className="swap-bal">Balance: {fromBal} {from}</div>
        </div>
        <button className="flip-btn" onClick={flip}>⇅</button>
        <div className="swap-box">
          <label>TO (estimated)</label>
          <div className="swap-row">
            <div className="token-sel">
              <img src={logo(to)} width={22} height={22} style={{borderRadius:'50%'}} alt=""/>
              <span>{to}</span>
            </div>
            <input className="swap-inp" readOnly value={quoting ? '...' : (quote || '')} placeholder="0.00"/>
          </div>
        </div>
        {quote && <div className="rate-row">Rate: 1 {from} ≈ {(parseFloat(quote)/parseFloat(amt||1)).toFixed(4)} {to}</div>}
        <button className="btn-primary full" onClick={doSwap} disabled={swapping}>
          {swapping ? 'Swapping...' : `Swap ${from} → ${to}`}
        </button>
      </div>
    </div>
  )
}
