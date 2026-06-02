import { useState } from 'react'
import './App.css'
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useWallet } from './hooks/useWallet'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'
import { NanLogo } from './components/NanLogo'
import { Landing } from './pages/Landing'
import { Home } from './pages/Home'
import { Send } from './pages/Send'
import { Receive } from './pages/Receive'
import { Swap } from './pages/Swap'
import { Bridge } from './pages/Bridge'
import { Earn } from './pages/Earn'
import { More } from './pages/More'
import { Toast } from './components/Toast'

export default function App() {
  const { isAuthenticated, primaryWallet, sdkHasLoaded } = useDynamicContext()
  const { address, usdcBal, eurcBal, totalUSD, totalNGN, disconnect, fetchBalances, apiFetch } = useWallet()
  const { theme, toggleTheme } = useTheme()
  const { toasts, toast } = useToast()
  const [page, setPage] = useState('home')

  if (!sdkHasLoaded) return <div style={{minHeight:'100vh',background:'var(--bg)'}}/>
  if (!isAuthenticated && !primaryWallet) return <Landing />

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'earn', label: 'Earn' },
    { id: 'more', label: 'More' },
  ]

  const pageProps = { toast, setPage, address, usdcBal, eurcBal, totalUSD, totalNGN, fetchBalances, apiFetch }

  const renderPage = () => {
    switch(page) {
      case 'send':    return <Send    {...pageProps} />
      case 'receive': return <Receive {...pageProps} />
      case 'swap':    return <Swap    {...pageProps} />
      case 'bridge':  return <Bridge  {...pageProps} />
      case 'earn':    return <Earn    {...pageProps} />
      case 'more':    return <More    {...pageProps} disconnect={disconnect} />
      default:        return <Home    {...pageProps} />
    }
  }

  const short = a => a ? `${a.slice(0,6)}...${a.slice(-4)}` : ''

  return (
    <div id="app-root" data-theme={theme}>
      <div id="globalTopBar">
        <div className="brand">
          <NanLogo width={160} height={40} />
        </div>
        <nav className="top-nav">
          {navItems.map(n => (
            <button key={n.id} className={`nav-link${page===n.id?' active':''}`} onClick={()=>setPage(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="topbar-right">
          <button className="theme-btn" onClick={toggleTheme}>{theme==='light'?'🌙':'☀️'}</button>
          <span className="net-pill">• Arc Testnet</span>
          <DynamicWidget />
        </div>
      </div>

      <div className="page-wrap">{renderPage()}</div>

      <div className="bottom-nav">
        {navItems.map(n => (
          <button key={n.id} className={`nav-btn${page===n.id?' active':''}`} onClick={()=>setPage(n.id)}>
            <span className="nav-ico">{n.id==='home'?'⌂':n.id==='earn'?'📈':'⋯'}</span>
            <span className="nav-lbl">{n.label}</span>
          </button>
        ))}
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}
