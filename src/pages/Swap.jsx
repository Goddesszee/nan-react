import { useState, useEffect } from 'react'

const USDC_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
const EURC_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png'

const SWAP_CONTRACT = '0x5cE359b74BE53b1B370641571cBef157dD575c79'
const USDC_ADDR     = '0x3600000000000000000000000000000000000000'
const EURC_ADDR     = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a'
const ARC_RPC       = 'https://rpc.testnet.arc.network'
const ARC_CHAIN_ID  = 5042002

const SWAP_ABI = [
  'function swapUSDCtoEURC(uint256) external returns (uint256)',
  'function swapEURCtoUSDC(uint256) external returns (uint256)',
  'function addLiquidity(uint256,uint256) external',
  'function quoteUSDCtoEURC(uint256) view returns (uint256,uint256)',
  'function quoteEURCtoUSDC(uint256) view returns (uint256,uint256)',
  'function getLiquidity() view returns (uint256,uint256)',
]
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
]

async function getEthers() {
  // ethers is loaded globally in the legacy app via CDN; in React we import it
  if (window.ethers) return window.ethers
  const mod = await import('ethers')
  return mod.ethers || mod
}

export function Swap({ toast, setPage, usdcBal, eurcBal, fetchBalances, address, apiFetch }) {
  const [from, setFrom]         = useState('USDC')
  const [amt, setAmt]           = useState('')
  const [quote, setQuote]       = useState(null)
  const [swapping, setSwapping] = useState(false)
  const [quoting, setQuoting]   = useState(false)

  // Pool liquidity state
  const [poolUsdc, setPoolUsdc] = useState(null)
  const [poolEurc, setPoolEurc] = useState(null)
  const [poolLoading, setPoolLoading] = useState(true)

  // Add-liquidity panel
  const [showAddLiq, setShowAddLiq]   = useState(false)
  const [liqUsdc, setLiqUsdc]         = useState('')
  const [liqEurc, setLiqEurc]         = useState('')
  const [addingLiq, setAddingLiq]     = useState(false)

  const to = from === 'USDC' ? 'EURC' : 'USDC'
  const fromBal = from === 'USDC' ? usdcBal : eurcBal
  const logo = (sym) => sym === 'USDC' ? USDC_LOGO : EURC_LOGO

  const poolEmpty = poolUsdc !== null && poolEurc !== null &&
    (parseFloat(poolUsdc) < 1 || parseFloat(poolEurc) < 1)

  // Fetch pool liquidity on mount
  useEffect(() => {
    fetchPoolLiquidity()
    const iv = setInterval(fetchPoolLiquidity, 30000)
    return () => clearInterval(iv)
  }, [])

  async function fetchPoolLiquidity() {
    try {
      const ethers = await getEthers()
      const provider = new ethers.JsonRpcProvider(ARC_RPC, {
        chainId: ARC_CHAIN_ID, name: 'arc-testnet', ensAddress: null,
      })
      const contract = new ethers.Contract(SWAP_CONTRACT, SWAP_ABI, provider)
      const [u, e] = await contract.getLiquidity()
      setPoolUsdc(parseFloat(ethers.formatUnits(u, 6)).toFixed(2))
      setPoolEurc(parseFloat(ethers.formatUnits(e, 6)).toFixed(2))
    } catch (err) {
      console.warn('[pool]', err.message)
    } finally {
      setPoolLoading(false)
    }
  }

  const flip = () => { setFrom(to); setAmt(''); setQuote(null) }

  const getQuote = async (value) => {
    if (!value || parseFloat(value) <= 0) return setQuote(null)
    setQuoting(true)
    try {
      const res = await apiFetch('/api/appkit/swap', {
        method: 'POST',
        body: JSON.stringify({ action:'quote', tokenIn:from, tokenOut:to, amountIn:value, walletAddress:address }),
      })
      if (res.success && res.amountOut) setQuote(res.amountOut)
    } catch(e) {} finally { setQuoting(false) }
  }

  const doSwap = async () => {
    if (!amt || parseFloat(amt) <= 0) return toast('Enter amount', 'error')
    if (parseFloat(amt) > parseFloat(fromBal)) return toast('Insufficient balance', 'error')
    setSwapping(true)
    try {
      const res = await apiFetch('/api/appkit/swap', {
        method: 'POST',
        body: JSON.stringify({ action:'swap', walletAddress:address, tokenIn:from, tokenOut:to, amountIn:amt }),
      })
      if (!res.success && !res.pending) throw new Error(res.error || 'Swap failed')
      toast(`Swap submitted! ${amt} ${from} → ${to}`, 'success')
      setTimeout(() => fetchBalances(address), 5000)
      setAmt(''); setQuote(null)
      fetchPoolLiquidity()
    } catch(e) {
      toast(e.message || 'Swap failed', 'error')
    } finally { setSwapping(false) }
  }

  // Add liquidity — MetaMask only (Circle users can't sign on other dapps directly)
  const doAddLiquidity = async () => {
    const uAmt = parseFloat(liqUsdc)
    const eAmt = parseFloat(liqEurc)
    if (!uAmt || uAmt <= 0 || !eAmt || eAmt <= 0) return toast('Enter both USDC and EURC amounts', 'error')
    if (uAmt > parseFloat(usdcBal)) return toast('Insufficient USDC balance', 'error')
    if (eAmt > parseFloat(eurcBal)) return toast('Insufficient EURC balance', 'error')

    const wp = window.rabby || window.ethereum ||
      (window.evmproviders && Object.values(window.evmproviders)[0]) || null
    if (!wp) return toast('Connect MetaMask or Rabby to add liquidity', 'error')

    setAddingLiq(true)
    try {
      const ethers = await getEthers()
      const provider = new ethers.BrowserProvider(wp)
      const signer = await provider.getSigner()

      const usdcC = new ethers.Contract(USDC_ADDR, ERC20_ABI, signer)
      const eurcC = new ethers.Contract(EURC_ADDR, ERC20_ABI, signer)
      const swapC = new ethers.Contract(SWAP_CONTRACT, SWAP_ABI, signer)

      const uParsed = ethers.parseUnits(uAmt.toFixed(6), 6)
      const eParsed = ethers.parseUnits(eAmt.toFixed(6), 6)
      const gasOpts = { gasPrice: 0, gasLimit: 500000 }

      // Approve USDC
      toast('Approving USDC…', 'info', 3000)
      const uAllow = await usdcC.allowance(await signer.getAddress(), SWAP_CONTRACT)
      if (uAllow < uParsed) {
        const appU = await usdcC.approve(SWAP_CONTRACT, ethers.MaxUint256, gasOpts)
        await appU.wait(0)
      }

      // Approve EURC
      toast('Approving EURC…', 'info', 3000)
      const eAllow = await eurcC.allowance(await signer.getAddress(), SWAP_CONTRACT)
      if (eAllow < eParsed) {
        const appE = await eurcC.approve(SWAP_CONTRACT, ethers.MaxUint256, gasOpts)
        await appE.wait(0)
      }

      // Add liquidity
      toast('Adding liquidity to NANSwap…', 'info', 4000)
      const tx = await swapC.addLiquidity(uParsed, eParsed, gasOpts)
      await tx.wait(0)

      toast(`✅ Added ${uAmt} USDC + ${eAmt} EURC to NANSwap pool!`, 'success', 7000)
      setLiqUsdc(''); setLiqEurc('')
      setShowAddLiq(false)
      fetchBalances(address)
      fetchPoolLiquidity()
    } catch(err) {
      toast('Add liquidity failed: ' + (err.message || '').slice(0, 100), 'error', 7000)
    } finally {
      setAddingLiq(false)
    }
  }

  return (
    <div className="page">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('home')}>←</button>
          <h2>Swap</h2>
        </div>

        {/* Pool status banner */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'8px 12px', borderRadius:10, marginBottom:12,
          background: poolEmpty ? 'rgba(248,113,113,.08)' : 'rgba(112,0,255,.06)',
          border: `1px solid ${poolEmpty ? 'rgba(248,113,113,.2)' : 'rgba(112,0,255,.18)'}`,
        }}>
          <span style={{fontSize:'.75rem', color: poolEmpty ? 'var(--danger)' : 'var(--accent3)'}}>
            {poolLoading ? 'Checking pool…' :
              poolEmpty
                ? `⚠ Pool empty — swaps may fail`
                : `● Pool: ${poolUsdc} USDC / ${poolEurc} EURC`}
          </span>
          <button
            onClick={() => setShowAddLiq(v => !v)}
            style={{
              background:'none', border:'1px solid rgba(112,0,255,.3)',
              borderRadius:7, color:'var(--accent3)', padding:'3px 10px',
              fontSize:'.72rem', cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}
          >
            {showAddLiq ? 'Cancel' : '+ Add liquidity'}
          </button>
        </div>

        {/* Add Liquidity panel */}
        {showAddLiq && (
          <div style={{
            background:'rgba(112,0,255,.05)', border:'1px solid rgba(112,0,255,.18)',
            borderRadius:12, padding:'14px 16px', marginBottom:14,
          }}>
            <div style={{fontSize:'.82rem', fontWeight:600, color:'var(--text)', marginBottom:10}}>
              Add liquidity to NANSwap (MetaMask only)
            </div>
            <div style={{display:'flex', gap:8, marginBottom:8}}>
              <div style={{flex:1}}>
                <label style={{fontSize:'.72rem', color:'var(--text3)'}}>USDC (bal: {usdcBal})</label>
                <input
                  className="inp" type="number" placeholder="0.00"
                  value={liqUsdc} onChange={e => setLiqUsdc(e.target.value)}
                  disabled={addingLiq}
                />
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:'.72rem', color:'var(--text3)'}}>EURC (bal: {eurcBal})</label>
                <input
                  className="inp" type="number" placeholder="0.00"
                  value={liqEurc} onChange={e => setLiqEurc(e.target.value)}
                  disabled={addingLiq}
                />
              </div>
            </div>
            <button
              className="btn-primary full"
              onClick={doAddLiquidity}
              disabled={addingLiq}
              style={{fontSize:'.88rem'}}
            >
              {addingLiq ? 'Adding…' : 'Add liquidity to pool →'}
            </button>
            <div style={{fontSize:'.68rem', color:'var(--text3)', marginTop:6}}>
              Both USDC and EURC must be deposited together. Sets the initial exchange rate.
            </div>
          </div>
        )}

        {/* Swap UI */}
        <div className="swap-box">
          <label>FROM</label>
          <div className="swap-row">
            <div className="token-sel">
              <img src={logo(from)} width={22} height={22} style={{borderRadius:'50%'}} alt=""/>
              <span>{from}</span>
            </div>
            <input className="swap-inp" type="number" placeholder="0.00" value={amt}
              onChange={e => { setAmt(e.target.value); getQuote(e.target.value) }}/>
          </div>
          <div className="swap-bal">Balance: {fromBal} {from}</div>
        </div>

        <button className="flip-btn" onClick={flip}>⇅</button>

        <div className="swap-box">
          <label>TO (estimated)</label>
          <div className="swap-row">
            <div className="token-sel">
              <img src={logo(to)} width={22} height={22} style={{borderRadius:'50%'}} alt=""/>
              <span>{to}</span>
            </div>
            <input className="swap-inp" readOnly value={quoting ? '...' : (quote || '')} placeholder="0.00"/>
          </div>
        </div>

        {quote && (
          <div className="rate-row">
            Rate: 1 {from} ≈ {(parseFloat(quote)/parseFloat(amt||1)).toFixed(4)} {to}
          </div>
        )}

        {poolEmpty && (
          <div style={{
            fontSize:'.78rem', color:'var(--danger)',
            background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.18)',
            borderRadius:9, padding:'8px 12px', marginBottom:8,
          }}>
            ⚠ The swap pool has no liquidity — swaps will fail. Add liquidity above first.
          </div>
        )}

        <button className="btn-primary full" onClick={doSwap} disabled={swapping}>
          {swapping ? 'Swapping...' : `Swap ${from} → ${to}`}
        </button>
      </div>
    </div>
  )
}
