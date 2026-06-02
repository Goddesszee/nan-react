import { useEffect, useState } from 'react'
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { useTheme } from './hooks/useTheme'
import { Landing } from './pages/Landing'
import './App.css'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user } = useDynamicContext()
  const { address: wagmiAddress } = useAccount()
  const { theme } = useTheme()
  const [timedOut, setTimedOut] = useState(false)

  // Get address from wagmi or from primaryWallet directly
  const address = wagmiAddress || primaryWallet?.address

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isAuthenticated && !primaryWallet) return
    // Get address - try multiple sources
    const addr = wagmiAddress || primaryWallet?.address
    if (addr) {
      localStorage.setItem('nan_dynamic_address', addr)
      localStorage.setItem('nan_dynamic_email', user?.email || '')
      localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
      window.location.replace('/legacy/app.html')
    } else {
      // No address yet but authenticated - wait a moment and try again
      setTimeout(() => {
        const a = primaryWallet?.address
        if (a) {
          localStorage.setItem('nan_dynamic_address', a)
          localStorage.setItem('nan_dynamic_email', user?.email || '')
          localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
          window.location.replace('/legacy/app.html')
        }
      }, 1000)
    }
  }, [isAuthenticated, primaryWallet, wagmiAddress])

  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  if (isAuthenticated || primaryWallet) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  return <Landing />
}
