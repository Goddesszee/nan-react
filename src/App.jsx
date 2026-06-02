import { useEffect, useState, useRef } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { Landing } from './pages/Landing'
import './App.css'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user, handleLogOut } = useDynamicContext()
  const { address: wagmiAddress } = useAccount()
  const [timedOut, setTimedOut] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const didRedirect = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [])

  // Handle disconnect param FIRST — clear everything and show landing
  const params = new URLSearchParams(window.location.search)
  const isDisconnecting = params.get('disconnected') === '1'

  useEffect(() => {
    if (!isDisconnecting) return
    // Clean URL and clear all storage
    window.history.replaceState({}, '', '/')
    localStorage.removeItem('nan_dynamic_address')
    localStorage.removeItem('nan_dynamic_token')
    localStorage.removeItem('nan_dynamic_email')
    sessionStorage.removeItem('nan_from_landing')
    // Best-effort logout — don't block on it
    try { handleLogOut().catch(() => {}) } catch(e) {}
  }, [isDisconnecting])

  useEffect(() => {
    if (isDisconnecting) return
    if (didRedirect.current) return
    
    const storedAddr = localStorage.getItem('nan_dynamic_address')
    if (!storedAddr) return  // no stored session, stay on landing

    const connected = isAuthenticated || !!primaryWallet
    if (!connected) return  // SDK not ready yet

    const addr = wagmiAddress || primaryWallet?.address || storedAddr
    if (addr) doRedirect(addr)
  }, [isAuthenticated, primaryWallet, wagmiAddress, isDisconnecting])

  function doRedirect(addr) {
    if (didRedirect.current) return
    didRedirect.current = true
    setRedirecting(true)
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email', user?.email || '')
    localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  // Disconnecting — show landing immediately
  if (isDisconnecting) {
    return <Landing />
  }

  // SDK still loading
  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#000'}} />
  }

  // Redirecting to legacy app
  if (redirecting) {
    return (
      <div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,fontFamily:'Inter,sans-serif'}}>
        <svg width="60" height="30" viewBox="0 0 50 20" fill="none">
          <path d="M16,0 C16,-8 0,-8 0,0 C0,8 16,8 25,0 C34,-8 50,-8 50,0 C50,8 34,8 25,0 Z"
            fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <div style={{color:'#fff',fontSize:'1rem',fontWeight:600}}>Loading NAN...</div>
        <button onClick={() => {
          didRedirect.current = false
          setRedirecting(false)
          localStorage.removeItem('nan_dynamic_address')
          localStorage.removeItem('nan_dynamic_token')
          localStorage.removeItem('nan_dynamic_email')
          handleLogOut().catch(() => {})
        }} style={{marginTop:24,color:'#555',background:'none',border:'1px solid #222',borderRadius:8,cursor:'pointer',fontSize:'.8rem',padding:'6px 14px'}}>
          Sign out
        </button>
      </div>
    )
  }

  // Not connected
  return <Landing />
}
