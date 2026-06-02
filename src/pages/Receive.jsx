import { useState } from 'react'

export function Receive({ setPage, address }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(address || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page page-receive">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Receive</h2>
        </div>
        <p className="receive-sub">Share your address to receive USDC or EURC on Arc Testnet</p>
        <div className="qr-box">
          <div className="qr-placeholder">QR</div>
        </div>
        <div className="addr-box">
          <span className="addr-text">{address || '—'}</span>
          <button className="copy-btn" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
        <div className="network-info">
          <span>Network: Arc Testnet</span>
          <span>Chain ID: 5042002</span>
        </div>
      </div>
    </div>
  )
}
