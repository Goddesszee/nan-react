import { useEffect, useState } from 'react'
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { useTheme } from './hooks/useTheme'
import { Landing } from './pages/Landing'
import './App.css'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user } = useDynamicContext()
  const { address } = useAccount()
  const { theme } = useTheme()
  const [timedOut, setTimedOut] = useState(false)

  // Timeout fallback — if SDK doesn't load in 4s, show landing anyway
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const connected = isAuthenticated || !!primaryWallet

  useEffect(() => {
    if (connected && address) {
      localStorage.setItem('nan_dynamic_address', address)
      localStorage.setItem('nan_dynamic_email', user?.email || '')
      localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
      window.location.replace('/legacy/app.html')
    }
  }, [connected, address])

  // Show landing once SDK loads or times out
  if (!sdkHasLoaded && !timedOut) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  if (connected) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  return <Landing />
}
