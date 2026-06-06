import { useState } from 'react'

const API = 'https://nan-production.up.railway.app'

export function Landing({ onConnect }) {
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
    } catch(e) { setStatus(''); setError('Connection error — please retry') }
  }

  async function handleWallet() {
    const provider = window.ethereum || (window.evmproviders && Object.values(window.evmproviders)[0])
    if (!provider) { setError('No wallet found. Install MetaMask or Rabby.'); return }
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      if (!accounts?.length) throw new Error('No accounts')
      const addr = accounts[0]
      localStorage.removeItem('circleWalletId'); localStorage.removeItem('circleWalletAddr')
      localStorage.setItem('nan_dynamic_address', addr)
      localStorage.setItem('nan_dynamic_email', '')
      localStorage.setItem('nan_dynamic_token', 'dynamic_authenticated')
      window.location.replace('/legacy/app.html')
    } catch(e) { setError(e.message?.slice(0, 80) || 'Connection failed') }
  }

  if (status) return (
    <div style={S.loader}>
      <div style={S.loaderMark}>N</div>
      <div style={S.loaderText}>{status}</div>
    </div>
  )

  return (
    <div style={S.root}>
      {/* Orbs */}
      <div style={{...S.orb, width:700,height:700,background:'radial-gradient(circle,rgba(112,0,255,.18) 0%,transparent 65%)',top:-250,left:-200}} />
      <div style={{...S.orb, width:500,height:500,background:'radial-gradient(circle,rgba(0,229,160,.08) 0%,transparent 65%)',bottom:-100,right:-100}} />
      <div style={{...S.orb, width:400,height:400,background:'radial-gradient(circle,rgba(59,130,246,.07) 0%,transparent 65%)',top:'50%',left:'60%'}} />

      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          <div style={S.navMark}>N</div>
          <span style={S.navName}>NAN</span>
        </div>
        <div style={S.navBadge}>Arc Testnet</div>
        <button style={S.navCta} onClick={() => document.getElementById('hero-email').focus()}>Log in</button>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.pill}>
          <span style={S.dot} />
          NOW LIVE ON ARC TESTNET
        </div>
        <h1 style={S.title}>
          Payments<br/>
          Without <span style={S.titleEm}>Borders.</span>
        </h1>
        <p style={S.sub}>
          The complete stablecoin wallet on Arc. Send, swap, bridge, earn and borrow with USDC and EURC. Zero gas. AI-powered. Built on Circle.
        </p>
        <div style={S.form}>
          <form onSubmit={handleEmail} style={S.eform}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3d3860" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
            <input
              id="hero-email"
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              style={S.input}
            />
            <button type="submit" style={S.submitBtn}>Get Started</button>
          </form>
          {error && <div style={S.error}>{error}</div>}
          <div style={S.orRow}><span style={S.orLine}/><span style={{fontSize:'.78rem',color:'#3d3860',padding:'0 12px'}}>or</span><span style={S.orLine}/></div>
          <button style={S.wBtn} onClick={handleWallet}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="8" width="22" height="14" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><circle cx="18" cy="15" r="1" fill="currentColor"/></svg>
            Connect MetaMask / Rabby
          </button>
          <div style={S.trust}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Non-custodial · No seed phrase · Circle MPC
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={S.stats}>
        {[
          {v:'$0', l:'Gas fees ever', g:true},
          {v:'<1s', l:'Settlement time'},
          {v:'4.80%', l:'APY on USDC'},
          {v:'6', l:'Chains supported'},
        ].map((s,i) => (
          <div key={i} style={{...S.stat, borderRight: i<3?'1px solid rgba(255,255,255,.06)':'none'}}>
            <div style={{...S.sv, ...(s.g?{color:'#00e5a0'}:{})}}>{s.v}</div>
            <div style={S.sl}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* CORE FEATURES */}
      <Section tag="Core features" title={<>Everything stablecoin,<br/>in one wallet</>}>
        <div style={S.featGrid}>
          <FCard icon={<ArrowUp/>} title="Send" badges={[{t:'Zero gas',g:true},{t:'.arc names',p:true}]}>
            Transfer USDC and EURC to any wallet address or .arc name in under a second. Use human-readable names like <strong style={{color:'#ede9ff'}}>zara.arc</strong> instead of 0x addresses.
          </FCard>
          <FCard icon={<Swap/>} title="Swap" badges={[{t:'Live FX rates',g:true},{t:'Limit orders',p:true}]}>
            Exchange USDC to EURC at live Frankfurt ECB rates via NANSwap on Arc. Set limit orders that execute automatically when your target rate is reached.
          </FCard>
          <FCard icon={<Bridge/>} title="Bridge" badges={[{t:'CCTP V2',b:true},{t:'6 chains',p:true}]}>
            Move USDC across 6 chains using Circle CCTP V2. No wrapped tokens, no trust assumptions. Arc to Ethereum, Base, Arbitrum, Optimism and Avalanche in minutes.
          </FCard>
          <FCard icon={<Earn/>} title="Earn" badges={[{t:'4.80% APY',g:true},{t:'On-chain',p:true}]}>
            Put idle USDC to work at <strong style={{color:'#00e5a0'}}>4.80% APY</strong> via NANLendingPool on Arc. Borrow against your USDC collateral at 7.20% APR. Fully liquid — withdraw anytime.
          </FCard>
        </div>
      </Section>

      {/* BRIDGE CHAINS */}
      <Section tag="Bridge destinations" title="Bridge USDC to any chain" tight>
        <div style={S.chains}>
          {[
            {name:'Arc Testnet',color:'#7000ff',sub:'Home'},
            {name:'Ethereum Sepolia',color:'#627EEA'},
            {name:'Base Sepolia',color:'#0052FF'},
            {name:'Arbitrum Sepolia',color:'#28A0F0'},
            {name:'OP Sepolia',color:'#FF0420'},
            {name:'Avalanche Fuji',color:'#E84142'},
          ].map((c,i) => (
            <div key={i} style={S.chainChip}>
              <span style={{width:8,height:8,borderRadius:'50%',background:c.color,flexShrink:0,display:'inline-block'}}/>
              {c.name}{c.sub&&<span style={{fontSize:'.65rem',color:'#3d3860',marginLeft:4}}>{c.sub}</span>}
            </div>
          ))}
        </div>
      </Section>

      {/* EARN HIGHLIGHT */}
      <Section tag="Earn" title="Your stablecoins should work for you" tight>
        <div style={S.earnCard}>
          <div>
            <div style={S.earnNum}>4.80<span style={{fontSize:'1.6rem'}}>%</span></div>
            <div style={S.earnLabel}>APY on USDC — NANLendingPool</div>
          </div>
          <div style={S.earnDetail}>
            Deposit USDC into NANLendingPool, a smart contract deployed on Arc Testnet. Earn 4.80% APY automatically. Borrow against your USDC at 7.20% APR. Fully liquid — no lockup, withdraw anytime.
            <div style={{marginTop:10,fontSize:'.73rem',color:'#3d3860'}}>
              Contract: <span style={{fontFamily:'monospace',color:'#8b82b8'}}>0x4CC84BbEf992439Cb01FeF2E1150B37916d1f2ce</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ADVANCED FEATURES */}
      <Section tag="Advanced" title="Built for power users too" tight>
        <div style={S.advGrid}>
          {[
            {icon:<BotIcon/>, title:'NAN AI', desc:'Ask anything in plain English. NAN AI executes sends, swaps, limit orders, and scheduled payments autonomously. Voice input supported.'},
            {icon:<Target/>, title:'Limit Orders', desc:'Set a target USDC/EURC rate and NAN executes the swap automatically when the market hits your price. 24/7, no babysitting.'},
            {icon:<Clock/>, title:'Scheduled Sends', desc:'Schedule a one-off payment or recurring standing order — weekly, monthly, or custom interval. Tell NAN AI what you want.'},
            {icon:<Users/>, title:'Payroll / Bulk Pay', desc:'Pay your whole team in one transaction. Upload addresses, set amounts, send USDC or EURC to dozens of wallets simultaneously.'},
            {icon:<Link/>, title:'Payment Requests', desc:'Create shareable payment links with a fixed amount and expiry. Share the URL — anyone can pay you in USDC or EURC instantly.'},
            {icon:<Globe/>, title:'Circle Gateway', desc:'Unified USDC balance across all chains in one view. No need to check each network separately — see your total stablecoin wealth instantly.'},
            {icon:<Tag/>, title:'.arc Names', desc:'Register your own .arc name via NANNameRegistry. Send to alice.arc instead of 0x addresses. 1, 2, or 3-year registrations from 2 USDC.'},
            {icon:<Naira/>, title:'Naira (NGN)', desc:'Deposit, withdraw, and convert Nigerian Naira. Live NGN/USDC rate at 1,620. Off-ramp to local bank accounts — coming soon.'},
            {icon:<Layers/>, title:'Multichain Balance', desc:'View your USDC balance across Arc, Ethereum, Base, Arbitrum, Optimism and Avalanche in one unified dashboard.'},
          ].map((a,i) => (
            <div key={i} style={S.aCard}>
              <div style={S.aIcon}>{a.icon}</div>
              <div style={S.aTitle}>{a.title}</div>
              <div style={S.aDesc}>{a.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* AI DEMO */}
      <Section tag="NAN AI" title={null}>
        <div style={S.aiWrap}>
          <div>
            <h2 style={{...S.secTitle, marginBottom:16}}>Just talk to your wallet</h2>
            <p style={{fontSize:'.9rem',color:'#8b82b8',lineHeight:1.7,marginBottom:20}}>
              NAN AI understands what you want and executes it. No menus, no confusing forms. Powered by Groq — responds in milliseconds. Voice input supported.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={S.cmdLabel}>Example commands</div>
              {['"Send 5 USDC to zara.arc"','"Swap 10 USDC to EURC when rate hits 0.92"','"Pay my team 50 USDC every Friday"','"How much have I earned this month?"'].map((c,i)=>(
                <div key={i} style={S.cmdItem}>{c}</div>
              ))}
            </div>
          </div>
          <div style={S.aiChat}>
            <div style={S.aiU}>Send 5 USDC to alice.arc</div>
            <div style={S.aiA}>Resolved alice.arc to 0x6915...556d. Sending 5 USDC now — gas is sponsored.</div>
            <div style={S.aiAction}>Execute — SEND 5 USDC</div>
            <div style={{borderTop:'1px solid rgba(255,255,255,.06)',margin:'4px 0'}}/>
            <div style={S.aiU}>Set a limit order: swap 20 USDC to EURC when rate is 0.95</div>
            <div style={S.aiA}>Limit order set. I will sell 20 USDC to EURC when rate reaches 0.95. Current rate: 0.859. Order ID: ord_abc123</div>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section tag="How it works" title="Up in 30 seconds" tight>
        {[
          {n:1, title:'Enter your email', desc:'No seed phrase. No downloads. Enter your email and a Circle Developer-Controlled Wallet is created for you instantly — you own the keys via MPC, we never hold them.', badge:'Non-custodial via Circle MPC'},
          {n:2, title:'Get free testnet USDC', desc:'Tap Faucet to receive USDC on Arc Testnet instantly. No real money, no KYC. Explore every feature freely — real on-chain transactions, zero cost.', badge:'Free to explore'},
          {n:3, title:'Send, swap, bridge, earn', desc:'The full stablecoin stack at your fingertips. Talk to NAN AI, set limit orders, schedule payments, bridge across chains. Everything works out of the box.', badge:'AI executes everything'},
          {n:4, title:'Or connect MetaMask / Rabby', desc:'Already have a wallet? Connect MetaMask or Rabby directly. All features work with your existing Web3 wallet — no new account needed.', badge:'Any EVM wallet'},
        ].map((s,i,arr) => (
          <div key={i} style={{...S.step, borderBottom: i<arr.length-1?'1px solid rgba(255,255,255,.06)':'none'}}>
            <div style={S.sNum}>{s.n}</div>
            <div>
              <div style={S.sTitle}>{s.title}</div>
              <div style={S.sDesc}>{s.desc}</div>
              <span style={S.sBadge}>{s.badge}</span>
            </div>
          </div>
        ))}
      </Section>

      {/* POWERED BY */}
      <Section tag="Built on" title="Trusted infrastructure" tight>
        <div style={S.pwGrid}>
          {[
            {name:'Circle', desc:'Developer-Controlled Wallets · CCTP V2 · Gateway', color:'#7000ff'},
            {name:'Arc Network', desc:'Chain ID 5042002 · USDC-native gas', color:'#c084fc'},
            {name:'Groq', desc:'llama-3.1-8b-instant · NAN AI', color:'#f97316'},
            {name:'NANLendingPool', desc:'On-chain lending at 4.80% APY', color:'#00e5a0'},
            {name:'NANSwap', desc:'On-chain USDC / EURC swaps', color:'#3b82f6'},
            {name:'NANNameRegistry', desc:'.arc identity on-chain', color:'#a855f7'},
          ].map((p,i)=>(
            <div key={i} style={S.pwCard}>
              <span style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0,display:'inline-block'}}/>
              <div>
                <div style={S.pwName}>{p.name}</div>
                <div style={S.pwDesc}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FOOTER CTA */}
      <div style={S.fcta}>
        <div style={S.fctaTitle}>Ready to start?</div>
        <div style={S.fctaSub}>Create your free wallet in 30 seconds.<br/>No crypto experience needed.</div>
        <button style={S.fctaBtn} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>Create Free Wallet</button>
      </div>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:'.78rem',color:'#3d3860'}}>
          <div style={{...S.navMark,width:26,height:26,borderRadius:7,fontSize:13}}>N</div>
          NAN Wallet · Arc Testnet · v1.0.0
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          {['Circle','CCTP V2','Arc Network','Groq AI','Non-custodial'].map((t,i)=>(
            <span key={i} style={S.ftag}>{t}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}

/* ── Sub-components ── */
function Section({tag, title, children, tight}) {
  return (
    <section style={{...S.sec, paddingTop: tight?0:88}}>
      {tag && <div style={S.secTag}>{tag}</div>}
      {title && <h2 style={S.secTitle}>{title}</h2>}
      {children}
    </section>
  )
}

function FCard({icon, title, badges, children}) {
  return (
    <div style={S.fCard}>
      <div style={S.fIcon}>{icon}</div>
      <div style={S.fTitle}>{title}</div>
      <div style={S.fDesc}>{children}</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>
        {badges?.map((b,i)=>(
          <span key={i} style={{...S.fBadge, ...(b.g?S.fBadgeG:b.b?S.fBadgeB:S.fBadgeP)}}>{b.t}</span>
        ))}
      </div>
    </div>
  )
}

/* ── SVG Icons ── */
const ic = (children) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7000ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
const ArrowUp = () => ic(<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>)
const Swap = () => ic(<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>)
const Bridge = () => ic(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>)
const Earn = () => ic(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>)
const BotIcon = () => ic(<><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></>)
const Target = () => ic(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>)
const Clock = () => ic(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)
const Users = () => ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>)
const Link = () => ic(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>)
const Globe = () => ic(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>)
const Tag = () => ic(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>)
const Naira = () => ic(<><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><line x1="8" y1="12" x2="16" y2="12"/></>)
const Layers = () => ic(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>)

/* ── STYLES ── */
const S = {
  root:{background:'#04040a',color:'#ede9ff',fontFamily:"'DM Sans',sans-serif",minHeight:'100vh',overflowX:'hidden',position:'relative'},
  orb:{position:'fixed',borderRadius:'50%',pointerEvents:'none',zIndex:0,filter:'blur(80px)'},
  loader:{minHeight:'100vh',background:'#04040a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,fontFamily:"'DM Sans',sans-serif"},
  loaderMark:{width:48,height:48,borderRadius:12,background:'#7000ff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:24,color:'#fff'},
  loaderText:{color:'#8b82b8',fontSize:'.95rem'},

  nav:{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(4,4,10,.75)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,.06)'},
  navLogo:{display:'flex',alignItems:'center',gap:10},
  navMark:{width:34,height:34,borderRadius:9,background:'#7000ff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:17,color:'#fff',flexShrink:0},
  navName:{fontWeight:700,fontSize:'.95rem',color:'#ede9ff'},
  navBadge:{fontSize:'.68rem',fontWeight:500,letterSpacing:'.07em',background:'rgba(112,0,255,.15)',border:'1px solid rgba(112,0,255,.3)',color:'#c084fc',borderRadius:100,padding:'4px 10px'},
  navCta:{background:'#7000ff',border:'none',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:'.85rem',padding:'9px 20px',borderRadius:10,cursor:'pointer'},

  hero:{position:'relative',zIndex:1,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 24px 80px'},
  pill:{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:100,padding:'6px 16px',fontSize:'.72rem',fontWeight:500,letterSpacing:'.06em',color:'#8b82b8',marginBottom:32},
  dot:{width:6,height:6,borderRadius:'50%',background:'#00e5a0',boxShadow:'0 0 8px #00e5a0',display:'inline-block'},
  title:{fontSize:'clamp(2.8rem,9vw,5.8rem)',fontWeight:800,lineHeight:1.03,letterSpacing:'-.035em',marginBottom:24},
  titleEm:{background:'linear-gradient(135deg,#a855f7 0%,#7000ff 45%,#3b82f6 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'},
  sub:{fontSize:'clamp(.95rem,2.5vw,1.15rem)',fontWeight:300,color:'#8b82b8',maxWidth:520,lineHeight:1.7,marginBottom:40},
  form:{width:'100%',maxWidth:360},
  eform:{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:16,padding:'4px 4px 4px 16px',marginBottom:12},
  input:{flex:1,background:'none',border:'none',outline:'none',color:'#ede9ff',fontFamily:"'DM Sans',sans-serif",fontSize:'.9rem',padding:'10px 0',minWidth:0},
  submitBtn:{background:'#7000ff',border:'none',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:'.85rem',padding:'10px 18px',borderRadius:12,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0},
  error:{fontSize:'.78rem',color:'#f87171',marginTop:8,textAlign:'center'},
  orRow:{display:'flex',alignItems:'center',marginBottom:12},
  orLine:{flex:1,height:1,background:'rgba(255,255,255,.06)'},
  wBtn:{width:'100%',padding:13,borderRadius:14,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',color:'#ede9ff',fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:'.88rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16},
  trust:{fontSize:'.73rem',color:'#3d3860',display:'flex',alignItems:'center',justifyContent:'center',gap:5},

  stats:{position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,.06)',borderBottom:'1px solid rgba(255,255,255,.06)',background:'rgba(255,255,255,.02)',display:'grid',gridTemplateColumns:'repeat(4,1fr)'},
  stat:{padding:'22px 16px',textAlign:'center'},
  sv:{fontWeight:700,fontSize:'1.5rem',color:'#ede9ff',marginBottom:3},
  sl:{fontSize:'.68rem',color:'#3d3860',letterSpacing:'.05em',textTransform:'uppercase'},

  sec:{position:'relative',zIndex:1,padding:'88px 24px',maxWidth:960,margin:'0 auto'},
  secTag:{fontSize:'.7rem',fontWeight:500,letterSpacing:'.12em',textTransform:'uppercase',color:'#9b30ff',marginBottom:14},
  secTitle:{fontWeight:700,fontSize:'clamp(1.7rem,4vw,2.5rem)',lineHeight:1.12,letterSpacing:'-.025em',marginBottom:48},

  featGrid:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12},
  fCard:{background:'#0b0b15',border:'1px solid rgba(255,255,255,.06)',borderRadius:22,padding:26,position:'relative',overflow:'hidden'},
  fIcon:{width:42,height:42,borderRadius:12,background:'rgba(112,0,255,.15)',border:'1px solid rgba(112,0,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,flexShrink:0},
  fTitle:{fontWeight:600,fontSize:'1rem',color:'#ede9ff',marginBottom:6},
  fDesc:{fontSize:'.82rem',color:'#8b82b8',lineHeight:1.65},
  fBadge:{display:'inline-block',fontSize:'.68rem',padding:'2px 8px',borderRadius:5,fontWeight:500},
  fBadgeG:{background:'rgba(0,229,160,.12)',border:'1px solid rgba(0,229,160,.2)',color:'#00e5a0'},
  fBadgeP:{background:'rgba(112,0,255,.15)',border:'1px solid rgba(112,0,255,.25)',color:'#c084fc'},
  fBadgeB:{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',color:'#93c5fd'},

  chains:{display:'flex',flexWrap:'wrap',gap:10},
  chainChip:{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:100,background:'#0b0b15',border:'1px solid rgba(255,255,255,.06)',fontSize:'.8rem',color:'#8b82b8'},

  earnCard:{background:'linear-gradient(135deg,rgba(112,0,255,.12) 0%,rgba(0,229,160,.06) 100%)',border:'1px solid rgba(112,0,255,.2)',borderRadius:22,padding:32,display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:24,alignItems:'center'},
  earnNum:{fontWeight:800,fontSize:'3rem',color:'#00e5a0',lineHeight:1},
  earnLabel:{fontSize:'.8rem',color:'#8b82b8',marginTop:4},
  earnDetail:{fontSize:'.82rem',color:'#8b82b8',lineHeight:1.7},

  advGrid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10},
  aCard:{background:'#0b0b15',border:'1px solid rgba(255,255,255,.06)',borderRadius:18,padding:20},
  aIcon:{marginBottom:10},
  aTitle:{fontWeight:600,fontSize:'.9rem',color:'#ede9ff',marginBottom:5},
  aDesc:{fontSize:'.78rem',color:'#8b82b8',lineHeight:1.6},

  aiWrap:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'start'},
  aiChat:{background:'#0b0b15',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:20,display:'flex',flexDirection:'column',gap:10},
  aiU:{padding:'11px 14px',borderRadius:'14px 14px 3px 14px',background:'#7000ff',color:'#f3e8ff',fontSize:'.83rem',lineHeight:1.6,alignSelf:'flex-end',maxWidth:'88%'},
  aiA:{padding:'11px 14px',borderRadius:'14px 14px 14px 3px',background:'#10101e',border:'1px solid rgba(255,255,255,.06)',color:'#8b82b8',fontSize:'.83rem',lineHeight:1.6,alignSelf:'flex-start',maxWidth:'88%'},
  aiAction:{alignSelf:'flex-start',background:'rgba(112,0,255,.15)',border:'1px solid rgba(112,0,255,.3)',borderRadius:10,padding:'8px 14px',fontSize:'.78rem',fontWeight:600,color:'#c084fc'},
  cmdLabel:{fontSize:'.75rem',color:'#3d3860',fontWeight:500,letterSpacing:'.05em',textTransform:'uppercase',marginBottom:4},
  cmdItem:{fontSize:'.82rem',color:'#8b82b8',background:'#0b0b15',border:'1px solid rgba(255,255,255,.06)',borderRadius:10,padding:'10px 14px'},

  step:{display:'flex',gap:20,padding:'22px 0'},
  sNum:{width:34,height:34,borderRadius:10,background:'rgba(112,0,255,.15)',border:'1px solid rgba(112,0,255,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.85rem',color:'#c084fc',flexShrink:0},
  sTitle:{fontWeight:600,fontSize:'.95rem',marginBottom:4,color:'#ede9ff'},
  sDesc:{fontSize:'.82rem',color:'#8b82b8',lineHeight:1.6},
  sBadge:{display:'inline-block',marginTop:7,fontSize:'.68rem',padding:'3px 8px',borderRadius:5,background:'rgba(0,229,160,.12)',border:'1px solid rgba(0,229,160,.2)',color:'#00e5a0',fontWeight:500},

  pwGrid:{display:'flex',flexWrap:'wrap',gap:12},
  pwCard:{display:'flex',alignItems:'center',gap:10,background:'#0b0b15',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,padding:'12px 16px',flex:'1 1 160px'},
  pwName:{fontWeight:600,fontSize:'.85rem',color:'#ede9ff'},
  pwDesc:{fontSize:'.73rem',color:'#3d3860'},

  fcta:{position:'relative',zIndex:1,margin:'0 24px 80px',background:'linear-gradient(135deg,rgba(112,0,255,.15),rgba(59,130,246,.1))',border:'1px solid rgba(112,0,255,.25)',borderRadius:28,padding:'56px 32px',textAlign:'center',overflow:'hidden'},
  fctaTitle:{fontWeight:800,fontSize:'clamp(1.8rem,5vw,2.6rem)',letterSpacing:'-.03em',marginBottom:12},
  fctaSub:{fontSize:'.95rem',color:'#8b82b8',marginBottom:28,lineHeight:1.6},
  fctaBtn:{display:'inline-block',background:'#7000ff',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:'1rem',padding:'14px 36px',borderRadius:14,border:'none',cursor:'pointer'},

  footer:{position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,.06)',padding:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12},
  ftag:{fontSize:'.7rem',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',borderRadius:6,padding:'3px 8px',color:'#8b82b8'},
}
