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

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isAuthenticated && !primaryWallet) return

    // Try every possible source for the address
    const addr = wagmiAddress 
      || primaryWallet?.address
      || user?.verifiedCredentials?.[0]?.address
      || user?.verifiedCredentials?.find(c => c.address)?.address

    if (addr) {
      doRedirect(addr)
    } else {
      // Poll for address every 500ms up to 10 seconds
      let attempts = 0
      const poll = setInterval(() => {
        attempts++
        const a = wagmiAddress 
          || primaryWallet?.address
          || user?.verifiedCredentials?.[0]?.address
        if (a) {
          clearInterval(poll)
          doRedirect(a)
        } else if (attempts > 20) {
          clearInterval(poll)
          // Last resort — use user ID as placeholder and redirect anyway
          const fallback = user?.userId || user?.id
          if (fallback) {
            // Can't do much without an address but redirect to show the app
            doRedirect('0x0000000000000000000000000000000000000000')
          }
        }
      }, 500)
      return () => clearInterval(poll)
    }
  }, [isAuthenticated, primaryWallet, wagmiAddress, user])

  function doRedirect(addr) {
    localStorage.setItem('nan_dynamic_address', addr)
    localStorage.setItem('nan_dynamic_email', user?.email || '')
    localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
    window.location.replace('/legacy/app.html')
  }

  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  if (isAuthenticated || primaryWallet) {
    return (
      <div style={{minHeight:'100vh', background:'#111', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'Inter,sans-serif'}}>
        <div style={{color:'#7000ff', fontSize:'3rem'}}>∞</div>
        <div style={{color:'#fff', fontSize:'1rem', fontWeight:600}}>Loading NAN Wallet...</div>
        <div style={{color:'#666', fontSize:'.8rem'}}>Connecting to Arc Testnet</div>
        <button onClick={() => {
          localStorage.removeItem('nan_dynamic_address')
          localStorage.removeItem('nan_dynamic_token')
          handleLogOut().then(() => window.location.reload())
        }} style={{marginTop:24, color:'#555', background:'none', border:'1px solid #333', borderRadius:8, padding:'6px 16px', cursor:'pointer', fontSize:'.8rem', color:'#888'}}>
          Sign out
        </button>
      </div>
    )
  }

  return <Landing />
}
