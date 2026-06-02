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

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const connected = isAuthenticated || !!primaryWallet
    if (!connected) return

    const addr = wagmiAddress || primaryWallet?.address
    if (!addr) {
      // Wait for address
      const retry = setTimeout(() => {
        const a = primaryWallet?.address
        if (a) doRedirect(a)
      }, 1500)
      return () => clearTimeout(retry)
    }
    doRedirect(addr)
  }, [isAuthenticated, primaryWallet, wagmiAddress])

  function doRedirect(addr) {
    setRedirecting(true)
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email', user?.email || '')
    localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  // Still loading SDK
  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  // Connected — redirecting to legacy app
  if ((isAuthenticated || primaryWallet) || redirecting) {
    return (
      <div style={{minHeight:'100vh', background:'#111', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'Inter,sans-serif'}}>
        <div style={{color:'#7000ff', fontSize:'2rem'}}>∞</div>
        <div style={{color:'#fff', fontSize:'1rem'}}>Loading NAN...</div>
        <button onClick={() => {
          localStorage.removeItem('nan_dynamic_address')
          localStorage.removeItem('nan_dynamic_token')
          handleLogOut()
          window.location.reload()
        }} style={{marginTop:20, color:'#666', background:'none', border:'none', cursor:'pointer', fontSize:'.8rem'}}>
          Not you? Sign out
        </button>
      </div>
    )
  }

  return <Landing />
}
