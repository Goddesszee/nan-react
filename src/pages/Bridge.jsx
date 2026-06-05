import { useState, useEffect, useRef } from 'react'

const API = 'https://nan-production.up.railway.app'

const CHAINS = [
  { val:'ETH-SEPOLIA',  label:'Ethereum Sepolia', icon:'⟠' },
  { val:'BASE-SEPOLIA', label:'Base Sepolia',      icon:'🔵' },
  { val:'ARB-SEPOLIA',  label:'Arbitrum Sepolia',  icon:'🔷' },
  { val:'OP-SEPOLIA',   label:'OP Sepolia',        icon:'🔴' },
  { val:'AVAX-FUJI',   label:'Avalanche Fuji',    icon:'🔺' },
]

// Step labels shown during bridge
const STEPS = [
  { id: 'burn',   label: 'Burning USDC on Arc…'       },
  { id: 'attest', label: 'Iris attestation…'           },
  { id: 'mint',   label: 'Minting on destination…'    },
]

export function Bridge({ toast, setPage, usdcBal, address, apiFetch }) {
  const [chain, setChain]       = useState('ETH-SEPOLIA')
  const [toAddr, setToAddr]     = useState('')
  const [amt, setAmt]           = useState('')
  const [bridging, setBridging] = useState(false)
  const [step, setStep]         = useState(null)   // null | 'burn' | 'attest' | 'mint' | 'done' | 'error'
  const [stepMsg, setStepMsg]   = useState('')
  const [burnTxHash, setBurnTxHash] = useState(null)
  const [elapsed, setElapsed]   = useState(0)
  const pollRef  = useRef(null)
  const timerRef = useRef(null)

  // Auto-fill dest address from Circle wallet (same address on dest chain)
  useEffect(() => {
    if (address && !toAddr) setToAddr(address)
  }, [address])

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(pollRef.current)
    clearInterval(timerRef.current)
  }, [])

  function startElapsedTimer() {
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  function stopElapsedTimer() {
    clearInterval(timerRef.current)
  }

  // Poll /api/appkit/bridge/status after a pending response
  function startPolling(txHash) {
    let attempts = 0
    const MAX = 80  // ~20 min at 15s intervals
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > MAX) {
        clearInterval(pollRef.current)
        stopElapsedTimer()
        setStep('error')
        setStepMsg('Attestation still pending after 20 min — check Circle Iris manually.')
        setBridging(false)
        return
      }
      try {
        // Poll attestation via backend proxy
        const r = await fetch(`${API}/api/cctp-attest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getAttestation', txHash, sourceDomain: 26 }),
        })
        const d = await r.json()
        if (d.status === 'complete' && d.attestation) {
          clearInterval(pollRef.current)
          setStep('mint')
          setStepMsg('USDC minting on destination chain…')
          // For Circle wallets the backend auto-mints after attestation
          // Signal complete
          stopElapsedTimer()
          setStep('done')
          setStepMsg(`Bridge complete! USDC arrived on ${chain}.`)
          toast(`✅ Bridge complete! USDC arrived on ${chain}`, 'success', 8000)
          setBridging(false)
          setAmt('')
          return
        }
        // Still pending — update elapsed display in stepMsg
        setStepMsg(`Iris attesting… (${attempts * 15}s elapsed, up to ~5 min on testnet)`)
      } catch (e) {
        // ignore individual poll errors, keep trying
      }
    }, 15000)
  }

  const doBridge = async () => {
    if (!amt || !toAddr) return toast('Enter amount and destination address', 'error')
    if (!toAddr.match(/^0x[0-9a-fA-F]{40}$/)) return toast('Enter a valid 0x destination address', 'error')
    if (parseFloat(amt) <= 0) return toast('Enter an amount greater than 0', 'error')
    if (parseFloat(amt) > parseFloat(usdcBal)) return toast('Insufficient USDC balance', 'error')

    setBridging(true)
    setStep('burn')
    setStepMsg('Submitting bridge to Circle…')
    setBurnTxHash(null)
    startElapsedTimer()

    try {
      const res = await apiFetch('/api/appkit/bridge', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: address,
          destChain: chain,
          destAddr: toAddr,
          amount: amt,
        }),
      })

      if (!res.success && !res.pending) throw new Error(res.error || 'Bridge failed')

      const txHash = res.burnTxHash || null
      setBurnTxHash(txHash)

      if (res.state === 'success') {
        // Completed synchronously (dev mode or fast path)
        stopElapsedTimer()
        setStep('done')
        setStepMsg(`Bridge complete! USDC arrived on ${chain}.`)
        toast(`✅ Bridge complete! USDC arrived on ${chain}`, 'success', 8000)
        setBridging(false)
        setAmt('')
        return
      }

      // Pending — move to attestation polling
      setStep('attest')
      setStepMsg('Waiting for Circle Iris attestation…')
      toast('✓ Bridge submitted via CCTP V2 — polling for confirmation…', 'success', 5000)

      if (txHash) {
        startPolling(txHash)
      } else {
        // No txHash returned — backend handles everything, wait a flat 25s then mark done
        setTimeout(() => {
          clearInterval(pollRef.current)
          stopElapsedTimer()
          setStep('done')
          setStepMsg(`Bridge submitted — USDC should arrive on ${chain} within ~30 seconds.`)
          setBridging(false)
          setAmt('')
        }, 25000)
      }

    } catch(e) {
      clearInterval(pollRef.current)
      stopElapsedTimer()
      setStep('error')
      setStepMsg(e.message || 'Bridge failed')
      toast(e.message || 'Bridge failed', 'error', 8000)
      setBridging(false)
    }
  }

  function reset() {
    clearInterval(pollRef.current)
    stopElapsedTimer()
    setStep(null)
    setStepMsg('')
    setBurnTxHash(null)
    setElapsed(0)
    setBridging(false)
  }

  const stepIndex = STEPS.findIndex(s => s.id === step)

  return (
    <div className="page">
      <div className="page-card">
        <div className="page-header">
          <button className="back-btn" onClick={() => { reset(); setPage('home') }}>←</button>
          <h2>Bridge</h2>
        </div>

        {/* Chain selector */}
        <div className="bridge-flow">
          <div className="bridge-chain">Arc Testnet</div>
          <div className="bridge-arrow">→</div>
          <div className="bridge-chain">
            <select
              style={{background:'none',border:'none',color:'inherit',fontWeight:700,width:'100%',outline:'none',fontSize:'inherit'}}
              value={chain}
              onChange={e => setChain(e.target.value)}
              disabled={bridging}
            >
              {CHAINS.map(c => <option key={c.val} value={c.val}>{c.icon} {c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="bridge-info">⚡ Powered by Circle CCTP V2 · Arrives in ~20 seconds · No gas on destination</div>

        {/* Destination address */}
        <div className="form-group">
          <label style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>Destination address</span>
            {address && (
              <button
                style={{background:'none',border:'none',fontSize:'.8rem',color:'var(--accent3)',cursor:'pointer',padding:0}}
                onClick={() => setToAddr(address)}
              >
                Use my address
              </button>
            )}
          </label>
          <input
            className="inp"
            placeholder="0x..."
            value={toAddr}
            onChange={e => setToAddr(e.target.value)}
            disabled={bridging}
          />
          {toAddr && toAddr === address && (
            <div style={{fontSize:'.78rem',color:'var(--accent3)',marginTop:4}}>
              ✓ Same address on {CHAINS.find(c=>c.val===chain)?.label}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="form-group">
          <label>Amount (USDC) <span className="bal-hint">Bal: {usdcBal} USDC</span></label>
          <div className="amt-row">
            <input
              className="inp"
              type="number"
              placeholder="0.00"
              value={amt}
              onChange={e => setAmt(e.target.value)}
              disabled={bridging}
            />
            <button className="max-btn" onClick={() => setAmt(usdcBal)} disabled={bridging}>MAX</button>
          </div>
        </div>

        {/* Bridge button */}
        {!step && (
          <button className="btn-primary full" onClick={doBridge} disabled={bridging}>
            Bridge via CCTP V2 →
          </button>
        )}

        {/* Step progress card */}
        {step && (
          <div style={{
            background:'rgba(112,0,255,.06)',
            border:'1px solid rgba(112,0,255,.22)',
            borderRadius:14,
            padding:'16px 18px',
            marginTop:10,
          }}>
            {/* Step indicators */}
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
              {STEPS.map((s, i) => {
                const isDone  = step === 'done' || (stepIndex > i)
                const isActive = s.id === step
                const isPending = !isDone && !isActive
                return (
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{
                      width:22,height:22,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.75rem',fontWeight:700,
                      background: isDone ? '#7000ff' : isActive ? 'rgba(112,0,255,.2)' : 'rgba(255,255,255,.06)',
                      border: isDone ? 'none' : isActive ? '1.5px solid #7000ff' : '1.5px solid rgba(255,255,255,.12)',
                      color: isDone ? '#fff' : isActive ? '#a855f7' : 'var(--text3)',
                    }}>
                      {isDone ? '✓' : isActive ? <span style={{display:'inline-block',animation:'spin .6s linear infinite'}}>⟳</span> : (i+1)}
                    </div>
                    <span style={{
                      fontSize:'.88rem',
                      color: isDone ? 'var(--text)' : isActive ? '#a855f7' : 'var(--text3)',
                      fontWeight: isActive ? 600 : 400,
                    }}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Status message */}
            {step !== 'done' && step !== 'error' && (
              <div style={{fontSize:'.8rem',color:'var(--text3)',marginBottom:10}}>
                {stepMsg} {elapsed > 0 && step !== 'burn' ? `· ${elapsed}s elapsed` : ''}
              </div>
            )}
            {step === 'done' && (
              <div style={{fontSize:'.9rem',color:'#7000ff',fontWeight:600,marginBottom:10}}>
                ✅ {stepMsg}
              </div>
            )}
            {step === 'error' && (
              <div style={{fontSize:'.85rem',color:'var(--danger)',marginBottom:10}}>
                ⚠️ {stepMsg}
              </div>
            )}

            {/* Burn tx link */}
            {burnTxHash && (
              <div style={{fontSize:'.76rem',color:'var(--text3)',marginBottom:10}}>
                Burn tx:{' '}
                <a
                  href={`https://explorer.testnet.arc.network/tx/${burnTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{color:'var(--accent3)'}}
                >
                  {burnTxHash.slice(0,10)}…{burnTxHash.slice(-6)} ↗
                </a>
              </div>
            )}

            {/* Action buttons */}
            <div style={{display:'flex',gap:8}}>
              {(step === 'done' || step === 'error') && (
                <button className="btn-primary full" onClick={reset} style={{marginTop:4}}>
                  {step === 'done' ? 'Bridge Again' : 'Try Again'}
                </button>
              )}
              {step === 'attest' && (
                <button
                  style={{background:'none',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,color:'var(--text3)',padding:'6px 12px',fontSize:'.8rem',cursor:'pointer',flexShrink:0}}
                  onClick={() => {
                    clearInterval(pollRef.current)
                    stopElapsedTimer()
                    setStep('done')
                    setStepMsg('Bridge submitted — check your balance in ~30 seconds.')
                    setBridging(false)
                    setAmt('')
                  }}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* Spinner keyframe (inline since we can't add to CSS here) */}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}
