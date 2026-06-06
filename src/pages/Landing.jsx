import { useState } from 'react'

const API = 'https://nan-production.up.railway.app'

export function Landing() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function handleEmail(e) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    setError(''); setStatus('Setting up your wallet...')
    try {
      const r = await fetch(`${API}/api/circle-wallets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getWallet', email }),
      })
      const d = await r.json()
      const w = d.wallet || d
      if (w?.id && w?.address) {
        localStorage.setItem('circleWalletId', w.id)
        localStorage.setItem('circleWalletAddr', w.address)
        localStorage.setItem('nan_dynamic_address', w.address)
        localStorage.setItem('nan_dynamic_email', email)
        localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
        window.location.replace('/legacy/app.html')
      } else { setStatus(''); setError(d.error || 'Wallet setup failed') }
    } catch { setStatus(''); setError('Connection error — please retry') }
  }

  async function handleWallet() {
    const provider = window.ethereum || (window.evmproviders && Object.values(window.evmproviders)[0])
    if (!provider) { setError('No wallet found. Install MetaMask or Rabby.'); return }
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      if (!accounts?.length) throw new Error('No accounts')
      const addr = accounts[0]
      localStorage.removeItem('circleWalletId')
      localStorage.removeItem('circleWalletAddr')
      localStorage.setItem('nan_dynamic_address', addr)
      localStorage.setItem('nan_dynamic_email', '')
      localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
      window.location.replace('/legacy/app.html')
    } catch(e) { setError(e.message?.slice(0, 80) || 'Connection failed') }
  }

  if (status) return (
    <div style={s.loader}>
      <div style={s.lMark}>N</div>
      <div style={s.lText}>{status}</div>
    </div>
  )

  return (
    <div style={s.root}>
      {/* Glow orbs — decorative, position fixed */}
      <div style={{...s.orb, width:400,height:400,background:'radial-gradient(circle,rgba(112,0,255,.2) 0%,transparent 70%)',top:-150,left:-150,filter:'blur(70px)'}}/>
      <div style={{...s.orb, width:300,height:300,background:'radial-gradient(circle,rgba(0,229,160,.1) 0%,transparent 70%)',bottom:-80,right:-80,filter:'blur(70px)'}}/>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navL}>
          <div style={s.mark}>N</div>
          <span style={s.nname}>NAN</span>
        </div>
        <div style={s.badge}>Arc Testnet</div>
        <button style={s.navBtn} onClick={() => document.getElementById('em').focus()}>Log in</button>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.pill}>
          <span style={s.dot}/>
          LIVE ON ARC TESTNET
        </div>

        <h1 style={s.h1}>
          Payments<br/>Without{' '}
          <span style={s.grad}>Borders.</span>
        </h1>

        <p style={s.sub}>
          The complete stablecoin wallet on Arc. Send, swap, bridge and earn with USDC and EURC. Zero gas fees.
        </p>

        {/* Email form */}
        <form onSubmit={handleEmail} style={s.eform}>
          <input
            id="em"
            type="email"
            placeholder="Enter your email..."
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            style={s.einput}
          />
          <button type="submit" style={s.eBtn}>Get Started</button>
        </form>
        {error && <div style={s.err}>{error}</div>}

        <div style={s.orRow}>
          <span style={s.orLine}/><span style={s.orTxt}>or</span><span style={s.orLine}/>
        </div>

        <button style={s.wBtn} onClick={handleWallet}>
          <WalletIcon/>
          Connect MetaMask / Rabby
        </button>

        <p style={s.trust}>
          <ShieldIcon/> Non-custodial · No seed phrase · Circle MPC
        </p>
      </section>

      {/* STATS — 2x2 on mobile */}
      <div style={s.stats}>
        {[
          {v:'$0',    l:'Gas fees',    green:true},
          {v:'<1s',   l:'Settlement'},
          {v:'4.80%', l:'APY on USDC'},
          {v:'6',     l:'Chains'},
        ].map((st,i) => (
          <div key={i} style={{
            ...s.stat,
            borderRight: [0,2].includes(i) ? '1px solid rgba(255,255,255,.06)' : 'none',
            borderBottom: i < 2 ? '1px solid rgba(255,255,255,.06)' : 'none',
          }}>
            <div style={{...s.sv, ...(st.green ? {color:'#00e5a0'} : {})}}>{st.v}</div>
            <div style={s.sl}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* CORE FEATURES — single col on mobile */}
      <section style={s.sec}>
        <div style={s.tag}>Features</div>
        <h2 style={s.h2}>Everything stablecoin,<br/>in one wallet</h2>
        <div style={s.fcol}>
          {[
            {Icon:ArrowUp, title:'Send', badge:'Zero gas', badgeG:true,
              desc:'Transfer USDC and EURC to any wallet or .arc name instantly. Human-readable names like zara.arc instead of 0x addresses.'},
            {Icon:SwapIcon, title:'Swap', badge:'Live FX rates', badgeG:true,
              desc:'Exchange USDC and EURC at live Frankfurt ECB rates. Set limit orders that execute automatically at your target rate.'},
            {Icon:BridgeIcon, title:'Bridge', badge:'CCTP V2', badgeB:true,
              desc:'Move USDC across 6 chains using Circle CCTP V2. Arc to Ethereum, Base, Arbitrum, Optimism and Avalanche. No wrapped tokens.'},
            {Icon:EarnIcon, title:'Earn 4.80% APY', badge:'On-chain', badgeP:true,
              desc:'Lend USDC at 4.80% APY via NANLendingPool on Arc. Borrow against collateral at 7.20% APR. Fully liquid, withdraw anytime.'},
          ].map(({Icon, title, badge, badgeG, badgeB, badgeP, desc}, i) => (
            <div key={i} style={s.fcard}>
              <div style={s.frow}>
                <div style={s.ficon}><Icon/></div>
                <div>
                  <div style={s.ftitle}>{title}</div>
                  <span style={{...s.fb, ...(badgeG?s.fbG:badgeB?s.fbB:s.fbP)}}>{badge}</span>
                </div>
              </div>
              <p style={s.fdesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BRIDGE CHAINS */}
      <section style={s.sec}>
        <div style={s.tag}>Supported chains</div>
        <h2 style={s.h2}>Bridge to any chain</h2>
        <div style={s.chips}>
          {[
            {name:'Arc Testnet',   color:'#7000ff'},
            {name:'Ethereum',      color:'#627EEA'},
            {name:'Base',          color:'#0052FF'},
            {name:'Arbitrum',      color:'#28A0F0'},
            {name:'Optimism',      color:'#FF0420'},
            {name:'Avalanche',     color:'#E84142'},
          ].map((c,i) => (
            <div key={i} style={s.chip}>
              <span style={{width:8,height:8,borderRadius:'50%',background:c.color,display:'inline-block',flexShrink:0}}/>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MORE FEATURES — 2 col grid on mobile */}
      <section style={s.sec}>
        <div style={s.tag}>More features</div>
        <h2 style={s.h2}>Built for power users</h2>
        <div style={s.mgrid}>
          {[
            {Icon:BotIcon,   title:'NAN AI',          desc:'Ask in plain English. AI executes sends, swaps and orders. Voice input supported.'},
            {Icon:TargetIcon,title:'Limit Orders',     desc:'Auto-swap when USDC/EURC hits your target rate. Runs 24/7.'},
            {Icon:ClockIcon, title:'Scheduled Sends',  desc:'One-off or recurring payments — weekly, monthly or custom.'},
            {Icon:UsersIcon, title:'Bulk Pay',         desc:'Pay your whole team in one transaction with USDC or EURC.'},
            {Icon:LinkIcon,  title:'Payment Links',    desc:'Create shareable payment requests with amount and expiry.'},
            {Icon:TagIcon,   title:'.arc Names',       desc:'Register alice.arc and send to names instead of addresses.'},
            {Icon:LayersIcon,title:'Multichain View',  desc:'See your USDC balance across all 6 chains in one dashboard.'},
            {Icon:NairaIcon, title:'Naira (NGN)',      desc:'Deposit and convert Nigerian Naira at live rates. Coming soon.'},
          ].map(({Icon, title, desc}, i) => (
            <div key={i} style={s.mcard}>
              <div style={s.micon}><Icon/></div>
              <div style={s.mtitle}>{title}</div>
              <div style={s.mdesc}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.sec}>
        <div style={s.tag}>How it works</div>
        <h2 style={s.h2}>Up in 30 seconds</h2>
        {[
          {n:1, title:'Enter your email',         badge:'Non-custodial', desc:'No seed phrase, no downloads. A Circle MPC wallet is created for you instantly.'},
          {n:2, title:'Get free testnet USDC',    badge:'Free to explore', desc:'Tap Faucet to receive USDC on Arc Testnet. No real money, no KYC needed.'},
          {n:3, title:'Send, swap, bridge, earn', badge:'AI-powered', desc:'The full stablecoin stack. Talk to NAN AI or use the app — everything works instantly.'},
          {n:4, title:'Or connect your wallet',   badge:'Any EVM wallet', desc:'Already have MetaMask or Rabby? Connect directly — no new account needed.'},
        ].map((step, i, arr) => (
          <div key={i} style={{...s.step, borderBottom: i<arr.length-1?'1px solid rgba(255,255,255,.06)':'none'}}>
            <div style={s.snum}>{step.n}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={s.stitle}>{step.title}</div>
              <div style={s.sdesc}>{step.desc}</div>
              <span style={s.sbadge}>{step.badge}</span>
            </div>
          </div>
        ))}
      </section>

      {/* POWERED BY */}
      <section style={s.sec}>
        <div style={s.tag}>Built on</div>
        <h2 style={s.h2}>Trusted infrastructure</h2>
        <div style={s.pwgrid}>
          {[
            {name:'Circle',          desc:'Wallets · CCTP V2 · Gateway', color:'#7000ff'},
            {name:'Arc Network',     desc:'Chain ID 5042002', color:'#c084fc'},
            {name:'Groq AI',         desc:'NAN AI — llama-3.1-8b', color:'#f97316'},
            {name:'NANLendingPool',  desc:'4.80% APY on-chain', color:'#00e5a0'},
            {name:'NANSwap',         desc:'USDC / EURC swaps', color:'#3b82f6'},
            {name:'NANNameRegistry', desc:'.arc identity', color:'#a855f7'},
          ].map((p,i) => (
            <div key={i} style={s.pwcard}>
              <span style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0,display:'inline-block'}}/>
              <div style={{minWidth:0}}>
                <div style={s.pwname}>{p.name}</div>
                <div style={s.pwdesc}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <div style={s.fcta}>
        <h2 style={s.fctaH}>Ready to start?</h2>
        <p style={s.fctaP}>Create your free wallet in 30 seconds. No crypto experience needed.</p>
        <button style={s.fctaBtn} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          Create Free Wallet
        </button>
      </div>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{...s.mark,width:26,height:26,borderRadius:7,fontSize:13}}>N</div>
          <span style={{fontSize:'.75rem',color:'#3d3860'}}>NAN Wallet · Arc Testnet</span>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {['Circle','CCTP V2','Arc','Non-custodial'].map((t,i)=>(
            <span key={i} style={s.ftag}>{t}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}

/* ── SVG Icons (16x16) ── */
const ic = (d) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7000ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const ArrowUp   = () => ic(<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>)
const SwapIcon  = () => ic(<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>)
const BridgeIcon= () => ic(<><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M5 9v3h14V9"/><path d="M12 12v3"/></>)
const EarnIcon  = () => ic(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>)
const BotIcon   = () => ic(<><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></>)
const TargetIcon= () => ic(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>)
const ClockIcon = () => ic(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)
const UsersIcon = () => ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>)
const LinkIcon  = () => ic(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>)
const TagIcon   = () => ic(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>)
const LayersIcon= () => ic(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>)
const NairaIcon = () => ic(<><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><line x1="8" y1="12" x2="16" y2="12"/></>)
const WalletIcon= () => ic(<><rect x="1" y="8" width="22" height="14" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><circle cx="18" cy="15" r="1" fill="#7000ff"/></>)
const ShieldIcon= () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

/* ── STYLES — mobile-first, all values in px/rem, no grid that overflows ── */
const s = {
  root:  { background:'#04040a', color:'#ede9ff', fontFamily:"'DM Sans',sans-serif", minHeight:'100vh', overflowX:'hidden', position:'relative' },
  orb:   { position:'fixed', borderRadius:'50%', pointerEvents:'none', zIndex:0 },
  loader:{ minHeight:'100vh', background:'#04040a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:"'DM Sans',sans-serif" },
  lMark: { width:48, height:48, borderRadius:12, background:'#7000ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:24, color:'#fff' },
  lText: { color:'#8b82b8', fontSize:'.95rem' },

  /* nav */
  nav:   { position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(4,4,10,.8)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.06)' },
  navL:  { display:'flex', alignItems:'center', gap:8 },
  mark:  { width:34, height:34, borderRadius:9, background:'#7000ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17, color:'#fff', flexShrink:0 },
  nname: { fontWeight:700, fontSize:'.95rem', color:'#ede9ff' },
  badge: { fontSize:'.68rem', fontWeight:500, letterSpacing:'.05em', background:'rgba(112,0,255,.15)', border:'1px solid rgba(112,0,255,.3)', color:'#c084fc', borderRadius:100, padding:'4px 10px' },
  navBtn:{ background:'#7000ff', border:'none', color:'#fff', fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:'.85rem', padding:'9px 18px', borderRadius:10, cursor:'pointer' },

  /* hero */
  hero:  { position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'100px 20px 60px' },
  pill:  { display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:100, padding:'6px 14px', fontSize:'.7rem', fontWeight:500, letterSpacing:'.06em', color:'#8b82b8', marginBottom:28 },
  dot:   { width:6, height:6, borderRadius:'50%', background:'#00e5a0', boxShadow:'0 0 8px #00e5a0', display:'inline-block' },
  h1:    { fontSize:'clamp(2.4rem,8vw,5rem)', fontWeight:800, lineHeight:1.05, letterSpacing:'-.03em', marginBottom:20 },
  grad:  { background:'linear-gradient(135deg,#a855f7 0%,#7000ff 45%,#3b82f6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  sub:   { fontSize:'clamp(.9rem,2.5vw,1.1rem)', fontWeight:300, color:'#8b82b8', maxWidth:460, lineHeight:1.7, marginBottom:32 },

  /* email form */
  eform: { width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:10, marginBottom:12 },
  einput:{ width:'100%', padding:'14px 16px', borderRadius:14, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#ede9ff', fontFamily:"'DM Sans',sans-serif", fontSize:'.95rem', outline:'none' },
  eBtn:  { width:'100%', padding:'14px', borderRadius:14, background:'#7000ff', border:'none', color:'#fff', fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'1rem', cursor:'pointer' },
  err:   { fontSize:'.78rem', color:'#f87171', textAlign:'center', marginTop:4 },

  /* or divider */
  orRow: { display:'flex', alignItems:'center', width:'100%', maxWidth:360, marginBottom:10 },
  orLine:{ flex:1, height:1, background:'rgba(255,255,255,.06)' },
  orTxt: { fontSize:'.78rem', color:'#3d3860', padding:'0 12px' },

  /* wallet btn */
  wBtn:  { width:'100%', maxWidth:360, padding:'13px', borderRadius:14, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', color:'#ede9ff', fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:'.9rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:16 },
  trust: { fontSize:'.72rem', color:'#3d3860', display:'flex', alignItems:'center', gap:5 },

  /* stats — 2x2 */
  stats: { position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' },
  stat:  { padding:'20px 16px', textAlign:'center' },
  sv:    { fontWeight:700, fontSize:'1.4rem', color:'#ede9ff', marginBottom:3 },
  sl:    { fontSize:'.68rem', color:'#3d3860', letterSpacing:'.04em', textTransform:'uppercase' },

  /* sections */
  sec:   { position:'relative', zIndex:1, padding:'56px 20px', maxWidth:680, margin:'0 auto', width:'100%' },
  tag:   { fontSize:'.68rem', fontWeight:500, letterSpacing:'.12em', textTransform:'uppercase', color:'#9b30ff', marginBottom:10 },
  h2:    { fontWeight:700, fontSize:'clamp(1.4rem,5vw,2rem)', lineHeight:1.15, letterSpacing:'-.02em', marginBottom:28 },

  /* core feature cards — single column stacked */
  fcol:  { display:'flex', flexDirection:'column', gap:12 },
  fcard: { background:'#0b0b15', border:'1px solid rgba(255,255,255,.07)', borderRadius:18, padding:'18px 16px' },
  frow:  { display:'flex', alignItems:'flex-start', gap:14, marginBottom:10 },
  ficon: { width:40, height:40, borderRadius:11, background:'rgba(112,0,255,.15)', border:'1px solid rgba(112,0,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  ftitle:{ fontWeight:600, fontSize:'1rem', color:'#ede9ff', marginBottom:5 },
  fdesc: { fontSize:'.83rem', color:'#8b82b8', lineHeight:1.65, margin:0 },
  fb:    { display:'inline-block', fontSize:'.68rem', padding:'2px 8px', borderRadius:5, fontWeight:500 },
  fbG:   { background:'rgba(0,229,160,.12)', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0' },
  fbP:   { background:'rgba(112,0,255,.15)', border:'1px solid rgba(112,0,255,.25)', color:'#c084fc' },
  fbB:   { background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)', color:'#93c5fd' },

  /* chain chips */
  chips: { display:'flex', flexWrap:'wrap', gap:8 },
  chip:  { display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:100, background:'#0b0b15', border:'1px solid rgba(255,255,255,.07)', fontSize:'.82rem', color:'#8b82b8' },

  /* more features — 2 col on mobile */
  mgrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  mcard: { background:'#0b0b15', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'16px 14px' },
  micon: { marginBottom:8 },
  mtitle:{ fontWeight:600, fontSize:'.85rem', color:'#ede9ff', marginBottom:5 },
  mdesc: { fontSize:'.76rem', color:'#8b82b8', lineHeight:1.6 },

  /* steps */
  step:  { display:'flex', gap:16, padding:'20px 0' },
  snum:  { width:32, height:32, borderRadius:9, background:'rgba(112,0,255,.15)', border:'1px solid rgba(112,0,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.82rem', color:'#c084fc', flexShrink:0 },
  stitle:{ fontWeight:600, fontSize:'.9rem', color:'#ede9ff', marginBottom:4 },
  sdesc: { fontSize:'.8rem', color:'#8b82b8', lineHeight:1.6, marginBottom:6 },
  sbadge:{ display:'inline-block', fontSize:'.66rem', padding:'2px 8px', borderRadius:5, background:'rgba(0,229,160,.12)', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', fontWeight:500 },

  /* powered by */
  pwgrid:{ display:'flex', flexDirection:'column', gap:10 },
  pwcard:{ display:'flex', alignItems:'center', gap:12, background:'#0b0b15', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'12px 16px' },
  pwname:{ fontWeight:600, fontSize:'.85rem', color:'#ede9ff' },
  pwdesc:{ fontSize:'.72rem', color:'#3d3860' },

  /* footer cta */
  fcta:  { position:'relative', zIndex:1, margin:'0 20px 60px', background:'linear-gradient(135deg,rgba(112,0,255,.15),rgba(59,130,246,.1))', border:'1px solid rgba(112,0,255,.25)', borderRadius:24, padding:'40px 24px', textAlign:'center' },
  fctaH: { fontWeight:800, fontSize:'clamp(1.5rem,5vw,2.2rem)', letterSpacing:'-.025em', marginBottom:10 },
  fctaP: { fontSize:'.88rem', color:'#8b82b8', marginBottom:24, lineHeight:1.6 },
  fctaBtn:{ background:'#7000ff', color:'#fff', fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:'1rem', padding:'14px 32px', borderRadius:13, border:'none', cursor:'pointer', width:'100%', maxWidth:300 },

  /* footer */
  footer:{ position:'relative', zIndex:1, borderTop:'1px solid rgba(255,255,255,.06)', padding:'20px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 },
  ftag:  { fontSize:'.68rem', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.06)', borderRadius:6, padding:'3px 8px', color:'#8b82b8' },
}
