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

    // Check if user explicitly disconnected (cleared localStorage)
    const storedAddr = localStorage.getItem('nan_dynamic_address')
    if (!storedAddr) {
      // User disconnected from legacy app — sign out of Dynamic too
      handleLogOut()
      return
    }

    const addr = wagmiAddress || primaryWallet?.address || storedAddr
    if (addr) {
      doRedirect(addr)
    } else {
      setTimeout(() => {
        const a = primaryWallet?.address
        if (a) doRedirect(a)
        else if (storedAddr) doRedirect(storedAddr)
      }, 1500)
    }
  }, [isAuthenticated, primaryWallet, wagmiAddress])

  function doRedirect(addr) {
    setRedirecting(true)
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email', user?.email || '')
    localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  if ((isAuthenticated || primaryWallet) && !redirecting) {
    // Check if they disconnected
    const storedAddr = localStorage.getItem('nan_dynamic_address')
    if (!storedAddr) return <Landing />
  }

  if (redirecting || ((isAuthenticated || primaryWallet) && localStorage.getItem('nan_dynamic_address'))) {
    return (
      <div style={{minHeight:'100vh',background:'#111',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,fontFamily:'Inter,sans-serif'}}>
        <div style={{color:'#7000ff',fontSize:'2rem'}}>∞</div>
        <div style={{color:'#fff',fontSize:'1rem'}}>Loading NAN...</div>
        <button onClick={() => {
          localStorage.removeItem('nan_dynamic_address')
          localStorage.removeItem('nan_dynamic_token')
          localStorage.removeItem('nan_dynamic_email')
          handleLogOut()
          window.location.reload()
        }} style={{marginTop:20,color:'#666',background:'none',border:'none',cursor:'pointer',fontSize:'.8rem'}}>
          Not you? Sign out
        </button>
      </div>
    )
  }

  return <Landing />
}
