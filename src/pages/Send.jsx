import { useState } from 'react'
import { useWallet } from '../hooks/useWallet'

export function Send({ toast, setPage, usdcBal, eurcBal, fetchBalances, address, apiFetch }) {
  const [token, setToken] = useState('USDC')
  const [to, setTo]       = useState('')
  const [amt, setAmt]     = useState('')
  const [sending, setSending] = useState(false)

  const bal = token === 'USDC' ? usdcBal : eurcBal

  const doSend = async () => {
    if (!to || !amt || parseFloat(amt) <= 0) return toast('Enter valid amount and address', 'error')
    if (parseFloat(amt) > parseFloat(bal)) return toast('Insufficient balance', 'error')
    setSending(true)
    try {
      const res = await apiFetch('/api/appkit/send', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: address,
          destinationAddress: to,
          amount: amt,
          tokenSymbol: token,
        }),
      })
      if (!res.success) throw new Error(res.error || 'Send failed')
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
    <div className="page">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Send</h2>
        </div>
        <div className="token-toggle" style={{marginBottom:20}}>
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
