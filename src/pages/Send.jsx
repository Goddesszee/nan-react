import { useState } from 'react'
import { ethers } from 'ethers'
import { useWallet, USDC_ADDR, EURC_ADDR, ERC20_ABI } from '../hooks/useWallet'

export function Send({ toast, setPage, usdcBal, eurcBal, fetchBalances, address }) {
  const { getSigner } = useWallet()
  const [token, setToken] = useState('USDC')
  const [to, setTo] = useState('')
  const [amt, setAmt] = useState('')
  const [sending, setSending] = useState(false)

  const bal = token === 'USDC' ? usdcBal : eurcBal
  const tokenAddr = token === 'USDC' ? USDC_ADDR : EURC_ADDR

  const doSend = async () => {
    if (!to || !amt || parseFloat(amt) <= 0) return toast('Enter valid amount and address', 'error')
    if (parseFloat(amt) > parseFloat(bal)) return toast('Insufficient balance', 'error')
    setSending(true)
    try {
      const signer = await getSigner()
      const contract = new ethers.Contract(tokenAddr, ERC20_ABI, signer)
      const units = ethers.parseUnits(amt, 6)
      const tx = await contract.transfer(to, units)
      toast('Transaction submitted...', 'info')
      await tx.wait()
      toast(`Sent ${amt} ${token} successfully!`, 'success')
      fetchBalances(address)
      setAmt('')
      setTo('')
    } catch(e) {
      toast(e.message || 'Send failed', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page page-send">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Send</h2>
        </div>
        <div className="token-toggle">
          {['USDC','EURC'].map(t => (
            <button key={t} className={`token-btn${token===t?' active':''}`} onClick={() => setToken(t)}>{t}</button>
          ))}
        </div>
        <div className="form-group">
          <label>Recipient address</label>
          <input className="inp" placeholder="0x..." value={to} onChange={e => setTo(e.target.value)}/>
        </div>
        <div className="form-group">
          <label>Amount <span className="bal-hint">Bal: {bal} {token}</span></label>
          <div className="amt-row">
            <input className="inp" type="number" placeholder="0.00" value={amt} onChange={e => setAmt(e.target.value)}/>
            <button className="max-btn" onClick={() => setAmt(bal)}>MAX</button>
          </div>
        </div>
        <button className="btn-primary full" onClick={doSend} disabled={sending}>
          {sending ? 'Sending...' : `Send ${token}`}
        </button>
      </div>
    </div>
  )
}
