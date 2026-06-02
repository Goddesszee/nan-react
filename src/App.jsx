import { useEffect } from 'react'
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { useTheme } from './hooks/useTheme'
import { Landing } from './pages/Landing'
import './App.css'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user } = useDynamicContext()
  const { address } = useAccount()
  const { theme } = useTheme()

  const connected = isAuthenticated || !!primaryWallet

  useEffect(() => {
    if (connected && address) {
      localStorage.setItem('nan_dynamic_address', address)
      localStorage.setItem('nan_dynamic_email', user?.email || '')
      localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
      window.location.replace('/legacy/app.html')
    }
  }, [connected, address])

  // Still loading SDK
  if (!sdkHasLoaded) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  // Already connected — waiting for redirect
  if (connected) {
    return <div style={{minHeight:'100vh', background:'#111'}} />
  }

  // Not connected — show landing
  return <Landing />
}
