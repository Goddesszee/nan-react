import { useState } from 'react'
import { Landing } from './pages/Landing'
import './App.css'

const API = 'https://nan-production.up.railway.app'

// Handle disconnect at module load — before anything renders
const _params = new URLSearchParams(window.location.search)
if (_params.get('__nan_disconnected') === '1') {
  window.history.replaceState({}, '', '/')
  try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
}

// If already have a session — redirect immediately, no React needed
const _token = localStorage.getItem('nan_dynamic_token')
const _addr  = localStorage.getItem('nan_dynamic_address')
const _cId   = localStorage.getItem('circleWalletId')
if (_token && _addr) {
  window.location.replace('/legacy/app.html')
}

export default function App() {
  const [status, setStatus] = useState('')

  async function connectWithEmail(email) {
    setStatus('Setting up your wallet…')
    try {
      const r = await fetch(`${API}/api/circle-wallets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getWallet', email }),
      })
      const d = await r.json()
      const w = d.wallet || d
      if (w?.id && w?.address) {
        localStorage.setItem('circleWalletId',    w.id)
        localStorage.setItem('circleWalletAddr',  w.address)
        localStorage.setItem('nan_dynamic_address', w.address)
        localStorage.setItem('nan_dynamic_email',   email)
        localStorage.setItem('nan_dynamic_token',   'dynamic_authenticated')
        window.location.replace('/legacy/app.html')
      } else {
        setStatus('')
        throw new Error(d.error || 'Wallet setup failed')
      }
    } catch(e) {
      setStatus('')
      throw e
    }
  }

  async function connectWithWallet() {
    const provider = window.ethereum || 
      (window.evmproviders && Object.values(window.evmproviders)[0])
    
    if (!provider) {
      throw new Error('No wallet found. Install MetaMask or Rabby.')
    }

    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    if (!accounts?.length) throw new Error('No accounts found')

    const addr = accounts[0]
    localStorage.removeItem('circleWalletId')
    localStorage.removeItem('circleWalletAddr')
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email',   '')
    localStorage.setItem('nan_dynamic_token',   'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  if (status) {
    return (
      <div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:16,fontFamily:'Inter,sans-serif'}}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 480" width="32" height="48">
          <path d="M255,0 L84,167 L71,163 L0,97 L0,378 L246,132 L255,110 Z" fill="#7000ff"/>
          <path d="M69,480 L240,313 L253,317 L324,383 L324,102 L78,348 L69,370 Z" fill="#7000ff"/>
        </svg>
        <div style={{color:'#fff',fontSize:'1rem',fontWeight:600}}>{status}</div>
        <div style={{display:'flex',gap:6}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#7000ff',animation:'pulse 1s ease-in-out infinite'}}/>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#9333ea',animation:'pulse 1s ease-in-out .2s infinite'}}/>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#c084fc',animation:'pulse 1s ease-in-out .4s infinite'}}/>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    )
  }

  return <Landing onEmailConnect={connectWithEmail} onWalletConnect={connectWithWallet} />
}
