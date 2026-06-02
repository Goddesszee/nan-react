import { useEffect, useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { Landing } from './pages/Landing'
import './App.css'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user, handleLogOut } = useDynamicContext()
  const { address: wagmiAddress } = useAccount()
  const [timedOut, setTimedOut] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [])

  // Check for disconnect param FIRST before anything else
  const params = new URLSearchParams(window.location.search)
  const isDisconnecting = params.get('disconnected') === '1'

  useEffect(() => {
    if (isDisconnecting) {
      window.history.replaceState({}, '', '/')
      localStorage.removeItem('nan_dynamic_address')
      localStorage.removeItem('nan_dynamic_token')
      localStorage.removeItem('nan_dynamic_email')
      handleLogOut().catch(() => {})
    }
  }, [])

  useEffect(() => {
    // Don't redirect if disconnecting
    if (isDisconnecting) return
    // Don't redirect if no localStorage address (means user disconnected)
    const storedAddr = localStorage.getItem('nan_dynamic_address')
    if (!storedAddr) return

    const connected = isAuthenticated || !!primaryWallet
    if (!connected) return

    const addr = wagmiAddress || primaryWallet?.address || storedAddr
    if (addr) {
      doRedirect(addr)
    } else {
      [500, 1000, 2000, 3000].forEach(delay => {
        setTimeout(() => {
          const a = primaryWallet?.address || wagmiAddress
          if (a && !redirecting) doRedirect(a)
        }, delay)
      })
    }
  }, [isAuthenticated, primaryWallet, wagmiAddress])

  function doRedirect(addr) {
    if (redirecting || isDisconnecting) return
    setRedirecting(true)
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email', user?.email || '')
    localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  // Show blank while SDK loads
  if (!sdkHasLoaded && !timedOut && !isDisconnecting) {
    return <div style={{minHeight:'100vh', background:'#000'}} />
  }

  // Show landing if disconnecting OR not connected
  if (isDisconnecting || (!isAuthenticated && !primaryWallet) || redirecting === false && !localStorage.getItem('nan_dynamic_address')) {
    return <Landing />
  }

  // Show loading while redirecting
  if (redirecting || ((isAuthenticated || primaryWallet) && localStorage.getItem('nan_dynamic_address'))) {
    return (
      <div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,fontFamily:'Inter,sans-serif'}}>
        <svg width="60" height="30" viewBox="0 0 50 20" fill="none">
          <path d="M16,0 C16,-8 0,-8 0,0 C0,8 16,8 25,0 C34,-8 50,-8 50,0 C50,8 34,8 25,0 Z"
            fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <div style={{color:'#fff',fontSize:'1rem',fontWeight:600}}>Loading NAN...</div>
        <button onClick={() => {
          localStorage.removeItem('nan_dynamic_address')
          localStorage.removeItem('nan_dynamic_token')
          localStorage.removeItem('nan_dynamic_email')
          handleLogOut()
          window.location.replace('/?disconnected=1')
        }} style={{marginTop:24,color:'#555',background:'none',border:'1px solid #222',borderRadius:8,cursor:'pointer',fontSize:'.8rem',padding:'6px 14px'}}>
          Sign out
        </button>
      </div>
    )
  }

  return <Landing />
}
