import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { NanLogo } from '../components/NanLogo'
import { useTheme } from '../hooks/useTheme'

const features = [
  { icon: '↑', title: 'Send', desc: 'Send USDC & EURC instantly to any address on Arc.' },
  { icon: '⇄', title: 'Swap', desc: 'Swap between USDC and EURC at live market rates.' },
  { icon: '⊞', title: 'Bridge', desc: 'Move stablecoins cross-chain via Circle CCTP V2.' },
  { icon: '📈', title: 'Earn', desc: '4.80% APY on your USDC. Withdraw anytime.' },
]

const stats = [
  { value: '$0',     label: 'Gas fees' },
  { value: '30s',    label: 'To onboard' },
  { value: '4.80%',  label: 'APY on USDC' },
  { value: 'CCTP V2',label: 'Bridge tech' },
]

export function Landing() {
  const { theme, toggleTheme } = useTheme()
  const { setShowAuthFlow } = useDynamicContext()

  return (
    <div className="landing" data-theme={theme}>
      {/* Nav */}
      <nav className="l-nav">
        <NanLogo width={160} height={40} />
        <div className="l-nav-right">
          <button className="l-theme-btn" onClick={toggleTheme}>{theme==='light'?'🌙':'☀️'}</button>
          <span className="l-net-pill">• Arc Testnet</span>
          {/* Single DynamicWidget in nav only */}
          <DynamicWidget />
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero">
        <div className="l-hero-inner">
          <div className="l-badge">
            <span className="l-badge-dot"></span>
            NOW LIVE ON ARC TESTNET
          </div>
          <h1 className="l-h1">
            Weave. Connect.<br/>
            <span className="l-h1-purple">Build on Arc.</span>
          </h1>
          <p className="l-sub">
            NAN is the simplest way to send, swap, lend, borrow, and bridge USDC and EURC on Arc — Circle's stablecoin-native blockchain. Non-custodial. For everyone, everywhere.
          </p>
          <div className="l-cta-row">
            <button className="btn-primary" style={{padding:'13px 32px',fontSize:'1rem'}}
              onClick={() => setShowAuthFlow && setShowAuthFlow(true)}>
              Get Started →
            </button>
            <a className="l-btn-ghost" href="https://faucet.arc.fun" target="_blank" rel="noreferrer">Get Free Tokens →</a>
          </div>
          <div className="l-stats">
            {stats.map(s => (
              <div key={s.label} className="l-stat">
                <div className="l-stat-val">{s.value}</div>
                <div className="l-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="l-features">
        <div className="l-features-inner">
          <h2 className="l-section-title">Everything you need</h2>
          <p className="l-section-sub">One wallet. All the stablecoin rails you need on Arc.</p>
          <div className="l-feature-grid">
            {features.map(f => (
              <div key={f.title} className="l-feature-card">
                <div className="l-feature-ico">{f.icon}</div>
                <div className="l-feature-title">{f.title}</div>
                <div className="l-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="l-banner">
        <div className="l-banner-inner">
          <h2>Ready to start?</h2>
          <p>Connect with email, Google, Discord or your existing wallet. No gas fees.</p>
          <button className="btn-primary" style={{padding:'13px 32px',fontSize:'1rem',background:'#fff',color:'#7000ff'}}
            onClick={() => setShowAuthFlow && setShowAuthFlow(true)}>
            Connect Wallet →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="l-footer">
        <NanLogo width={120} height={30} />
        <span className="l-footer-txt">Built on Arc · Powered by Circle · © 2025 NAN</span>
        <div className="l-footer-links">
          <a href="https://twitter.com/nanarc_xyz" target="_blank" rel="noreferrer">X/Twitter</a>
          <a href="https://github.com/Goddesszee/nan-react" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
