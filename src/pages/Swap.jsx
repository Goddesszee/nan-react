import { useState } from 'react'
import { ethers } from 'ethers'
import { useWallet, USDC_ADDR, EURC_ADDR, ERC20_ABI } from '../hooks/useWallet'

const USDC_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
const EURC_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png'

export function Swap({ toast, setPage, usdcBal, eurcBal, fetchBalances, address, apiFetch }) {
  const { getSigner } = useWallet()
  const [from, setFrom] = useState('USDC')
  const [amt, setAmt]   = useState('')
  const [swapping, setSwapping] = useState(false)

  const to = from === 'USDC' ? 'EURC' : 'USDC'
  const fromBal = from === 'USDC' ? usdcBal : eurcBal
  const FX = 1.08 // approx EURC rate
  const toAmt = from === 'USDC'
    ? (parseFloat(amt||0) / FX).toFixed(6)
    : (parseFloat(amt||0) * FX).toFixed(6)

  const flip = () => { setFrom(to); setAmt('') }

  const doSwap = async () => {
    if (!amt || parseFloat(amt) <= 0) return toast('Enter amount', 'error')
    setSwapping(true)
    try {
      const signer = await getSigner()
      const fromAddr = from === 'USDC' ? USDC_ADDR : EURC_ADDR
      const contract = new ethers.Contract(fromAddr, ERC20_ABI, signer)
      const signerAddr = await signer.getAddress()
      // Simple swap via approval + API
      const units = ethers.parseUnits(amt, 6)
      toast('Approving...', 'info')
      const approveTx = await contract.approve('0x0000000000000000000000000000000000000001', units)
      await approveTx.wait()
      toast('Swapping...', 'info')
      // Call Railway swap endpoint
      await apiFetch('/api/swap', {
        method: 'POST',
        body: JSON.stringify({ from, to, amount: amt, address: signerAddr }),
      })
      toast(`Swapped ${amt} ${from} → ${toAmt} ${to}!`, 'success')
      fetchBalances(address)
      setAmt('')
    } catch(e) {
      toast(e.message || 'Swap failed', 'error')
    } finally {
      setSwapping(false)
    }
  }

  return (
    <div className="page page-swap">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Swap</h2>
        </div>
        <div className="swap-box">
          <label>From</label>
          <div className="swap-row">
            <div className="token-sel">
              <img src={from==='USDC'?USDC_LOGO:EURC_LOGO} width={20} height={20} style={{borderRadius:'50%'}} alt={from}/>
              <span>{from}</span>
            </div>
            <input className="swap-inp" type="number" placeholder="0.00"
              value={amt} onChange={e => setAmt(e.target.value)}/>
          </div>
          <div className="swap-bal">Bal: {fromBal}</div>
        </div>
        <button className="flip-btn" onClick={flip}>⇅</button>
        <div className="swap-box">
          <label>To (estimated)</label>
          <div className="swap-row">
            <div className="token-sel">
              <img src={to==='USDC'?USDC_LOGO:EURC_LOGO} width={20} height={20} style={{borderRadius:'50%'}} alt={to}/>
              <span>{to}</span>
            </div>
            <input className="swap-inp" readOnly value={toAmt} placeholder="0.00"/>
          </div>
        </div>
        <button className="btn-primary full" onClick={doSwap} disabled={swapping}>
          {swapping ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </div>
  )
}
