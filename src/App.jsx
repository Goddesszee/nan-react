import { useEffect, useState, useRef } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { Landing } from './pages/Landing'
import './App.css'

const API = 'https://nan-production.up.railway.app'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user, handleLogOut } = useDynamicContext()
  const { address: wagmiAddress } = useAccount()
  const [timedOut, setTimedOut] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [status, setStatus] = useState('Loading NAN...')
  const didRedirect = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const params = new URLSearchParams(window.location.search)
  const isDisconnecting = params.get('disconnected') === '1'

  useEffect(() => {
    if (!isDisconnecting) return
    window.history.replaceState({}, '', '/')
    localStorage.removeItem('nan_dynamic_address')
    localStorage.removeItem('nan_dynamic_token')
    localStorage.removeItem('nan_dynamic_email')
    localStorage.removeItem('circleWalletId')
    localStorage.removeItem('circleWalletAddr')
    sessionStorage.removeItem('nan_from_landing')
    try { handleLogOut().catch(() => {}) } catch(e) {}
  }, [isDisconnecting])

  useEffect(() => {
    if (isDisconnecting) return
    if (didRedirect.current) return

    const connected = isAuthenticated || !!primaryWallet
    if (!connected) return

    const email = user?.email || user?.verifiedCredentials?.find(c => c.email)?.email || null
    const addr  = wagmiAddress || primaryWallet?.address

    if (email) {
      // Email-based login (email OTP, Google, Discord etc) 
      // Always use Circle wallet tied to email — consistent across all social logins
      doRedirectWithEmail(email)
    } else if (addr) {
      // Pure wallet login (MetaMask, Rabby etc) — no email, use wallet address directly
      doRedirect(addr, null)
    } else {
      // Address not ready yet — retry
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

    // If wallet already cached for this email — redirect instantly, no API call
    const cachedId   = localStorage.getItem('circleWalletId')
    const cachedAddr = localStorage.getItem('circleWalletAddr')
    const cachedEmail = localStorage.getItem('nan_dynamic_email')
    if (cachedId && cachedAddr && cachedEmail === email) {
      doRedirect(cachedAddr, email)
      return
    }

    // First time or different email — fetch/create Circle wallet
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
        const addr = wagmiAddress || primaryWallet?.address
        doRedirect(addr, email)
      }
    } catch(e) {
      const addr = wagmiAddress || primaryWallet?.address
      doRedirect(addr, email)
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

  if (isDisconnecting) return <Landing />
  if (!sdkHasLoaded && !timedOut) return <div style={{minHeight:'100vh', background:'#000'}} />

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
          localStorage.clear()
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
