import { useEffect } from 'react'
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'
import { useTheme } from './hooks/useTheme'
import { Landing } from './pages/Landing'
import './App.css'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded, user, handleLogOut } = useDynamicContext()
  const { address } = useAccount()
  const { theme } = useTheme()

  // When authenticated, store address in localStorage and redirect to legacy app
  useEffect(() => {
    if ((isAuthenticated || primaryWallet) && address) {
      localStorage.setItem('nan_dynamic_address', address)
      localStorage.setItem('nan_dynamic_email', user?.email || '')
      localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
      // Redirect to original app
      window.location.href = '/legacy/app.html'
    }
  }, [isAuthenticated, primaryWallet, address])

  if (!sdkHasLoaded) return <div style={{minHeight:'100vh',background:'#111'}}/>
  if (isAuthenticated || primaryWallet) return <div style={{minHeight:'100vh',background:'#111',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:'Inter,sans-serif'}}>Loading NAN...</div>

  return <Landing />
}
