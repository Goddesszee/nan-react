import { useEffect, useState, useRef } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { Landing } from './pages/Landing'
import './App.css'

const API = 'https://nan-production.up.railway.app'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user, handleLogOut } = useDynamicContext()
  const { address: wagmiAddress } = useAccount()
  const [timedOut, setTimedOut]     = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [status, setStatus]         = useState('Loading NAN...')
  const didRedirect = useRef(false)

  // Check for disconnect FIRST — before anything else
  const params        = new URLSearchParams(window.location.search)
  const isDisconnecting = params.get('disconnected') === '1'

  // If disconnecting — wipe everything immediately and show landing
  // Do this synchronously so there's zero chance of the redirect useEffect firing
  if (isDisconnecting && !didRedirect.current) {
    window.history.replaceState({}, '', '/')
    // Wipe all localStorage
    try {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
      keys.forEach(k => k && localStorage.removeItem(k))
      sessionStorage.clear()
    } catch(e) {}
    // Sign out of Dynamic (fire and forget)
    try { handleLogOut().catch(() => {}) } catch(e) {}
    // Show landing immediately — no loading, no delay
    return <Landing />
  }

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // Redirect when connected
  useEffect(() => {
    if (isDisconnecting) return
    if (didRedirect.current) return

    const connected = isAuthenticated || !!primaryWallet
    if (!connected) return

    const email = user?.email ||
      user?.verifiedCredentials?.find(c => c.email)?.email || null
    const addr  = wagmiAddress || primaryWallet?.address

    if (email) {
      doRedirectWithEmail(email)
    } else if (addr) {
      doRedirect(addr, null)
    } else {
      const retries = [300, 700, 1500, 3000]
      retries.forEach(delay => {
        setTimeout(() => {
          if (didRedirect.current) return
          const e = user?.email
          const a = wagmiAddress || primaryWallet?.address
          if (e) doRedirectWithEmail(e)
          else if (a) doRedirect(a, null)
        }, delay)
      })
    }
  }, [isAuthenticated, primaryWallet, wagmiAddress, user, isDisconnecting])

  async function doRedirectWithEmail(email) {
    if (didRedirect.current) return
    didRedirect.current = true
    setRedirecting(true)

    // Cached wallet — instant redirect
    const cachedId    = localStorage.getItem('circleWalletId')
    const cachedAddr  = localStorage.getItem('circleWalletAddr')
    const cachedEmail = localStorage.getItem('nan_dynamic_email')
    if (cachedId && cachedAddr && cachedEmail === email) {
      doRedirect(cachedAddr, email)
      return
    }

    // First login — create Circle wallet
    setStatus('Setting up your wallet…')
    try {
      const r = await fetch(`${API}/api/circle-wallets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getWallet', email }),
      })
      const d = await r.json()
      const wallet = d.wallet || d
      if (wallet?.id && wallet?.address) {
        localStorage.setItem('circleWalletId',   wallet.id)
        localStorage.setItem('circleWalletAddr', wallet.address)
        doRedirect(wallet.address, email)
      } else {
        doRedirect(wagmiAddress || primaryWallet?.address, email)
      }
    } catch(e) {
      doRedirect(wagmiAddress || primaryWallet?.address, email)
    }
  }

  function doRedirect(addr, email) {
    if (!addr) return
    setStatus('Loading NAN...')
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email',   email || user?.email || '')
    localStorage.setItem('nan_dynamic_token',   'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  // SDK loading
  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#000'}} />
  }

  // Redirecting to app
  if (redirecting) {
    return (
      <div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:16,fontFamily:'Inter,sans-serif'}}>
        <svg width="60" height="30" viewBox="0 0 50 20" fill="none">
          <path d="M16,0 C16,-8 0,-8 0,0 C0,8 16,8 25,0 C34,-8 50,-8 50,0 C50,8 34,8 25,0 Z"
            fill="none" stroke="#7000ff" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <div style={{color:'#fff',fontSize:'1rem',fontWeight:600}}>{status}</div>
        <button onClick={() => {
          didRedirect.current = false
          setRedirecting(false)
          try {
            const keys = []
            for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
            keys.forEach(k => k && localStorage.removeItem(k))
          } catch(e) {}
          handleLogOut().catch(() => {})
        }} style={{marginTop:24,color:'#555',background:'none',border:'1px solid #222',
          borderRadius:8,cursor:'pointer',fontSize:'.8rem',padding:'6px 14px'}}>
          Sign out
        </button>
      </div>
    )
  }

  return <Landing />
}
