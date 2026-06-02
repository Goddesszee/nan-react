import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { NanLogo } from '../components/NanLogo'

export function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <NanLogo width={160} height={40} />
        <DynamicWidget />
      </nav>
      <div className="hero">
        <div className="hero-badge">• NOW LIVE ON ARC TESTNET</div>
        <h1>Weave. Connect.<br/><span className="hero-purple">Build on Arc.</span></h1>
        <p>Nan is the simplest way to send, swap, lend, borrow, and bridge USDC and EURC on Arc — Circle's stablecoin-native blockchain. Non-custodial. For everyone, everywhere.</p>
        <div className="hero-btns">
          <DynamicWidget />
        </div>
      </div>
    </div>
  )
}
