import { useEffect, useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { useTheme } from './hooks/useTheme'
import { Landing } from './pages/Landing'
import './App.css'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user, handleLogOut } = useDynamicContext()
  const { address: wagmiAddress } = useAccount()
  const { theme } = useTheme()
  const [timedOut, setTimedOut] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [forceLogout, setForceLogout] = useState(false)

  // Check if coming back from a disconnect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('disconnected') === '1') {
      // Clean URL
      window.history.replaceState({}, '', '/')
      // Sign out of Dynamic
      setForceLogout(true)
      handleLogOut().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (forceLogout) return
    const connected = isAuthenticated || !!primaryWallet
    if (!connected) return

    const addr = wagmiAddress || primaryWallet?.address
    if (addr) {
      doRedirect(addr)
    } else {
      const attempts = [500, 1000, 2000, 3000]
      attempts.forEach(delay => {
        setTimeout(() => {
          const a = primaryWallet?.address || wagmiAddress
          if (a && !redirecting) doRedirect(a)
        }, delay)
      })
    }
  }, [isAuthenticated, primaryWallet, wagmiAddress, forceLogout])

  function doRedirect(addr) {
    if (redirecting) return
    setRedirecting(true)
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email', user?.email || '')
    localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#000'}} />
  }

  // Force show landing after disconnect
  if (forceLogout) return <Landing />

  if ((isAuthenticated || primaryWallet) || redirecting) {
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
          setForceLogout(true)
        }} style={{marginTop:24,color:'#555',background:'none',border:'1px solid #222',borderRadius:8,cursor:'pointer',fontSize:'.8rem',padding:'6px 14px',color:'#666'}}>
          Sign out
        </button>
      </div>
    )
  }

  return <Landing />
}
