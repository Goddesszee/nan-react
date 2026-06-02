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
  const [didDisconnect, setDidDisconnect] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const connected = isAuthenticated || !!primaryWallet
    if (!connected) return
    if (didDisconnect) return

    // Get address from any available source
    const addr = wagmiAddress 
      || primaryWallet?.address 
      || localStorage.getItem('nan_dynamic_address')

    if (addr) {
      doRedirect(addr)
    } else {
      // Wait for embedded wallet to be created (social/email login)
      const attempts = [500, 1000, 2000, 3000]
      attempts.forEach(delay => {
        setTimeout(() => {
          const a = primaryWallet?.address || wagmiAddress
          if (a && !redirecting) doRedirect(a)
        }, delay)
      })
    }
  }, [isAuthenticated, primaryWallet, wagmiAddress])

  function doRedirect(addr) {
    if (redirecting) return
    setRedirecting(true)
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email', user?.email || '')
    localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  function signOut() {
    setDidDisconnect(true)
    localStorage.removeItem('nan_dynamic_address')
    localStorage.removeItem('nan_dynamic_token')
    localStorage.removeItem('nan_dynamic_email')
    handleLogOut()
    setTimeout(() => window.location.reload(), 500)
  }

  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  if (didDisconnect) return <Landing />

  if ((isAuthenticated || primaryWallet) || redirecting) {
    return (
      <div style={{minHeight:'100vh',background:'#111',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,fontFamily:'Inter,sans-serif'}}>
        <div style={{color:'#7000ff',fontSize:'2.5rem'}}>∞</div>
        <div style={{color:'#fff',fontSize:'1rem',fontWeight:600}}>Loading NAN Wallet...</div>
        <div style={{color:'#555',fontSize:'.8rem'}}>Setting up your wallet</div>
        <button onClick={signOut} style={{marginTop:24,color:'#555',background:'none',border:'1px solid #333',borderRadius:8,cursor:'pointer',fontSize:'.8rem',padding:'6px 14px'}}>
          Sign out
        </button>
      </div>
    )
  }

  return <Landing />
}
