import React, { useState, useEffect, useCallback } from 'react'
import {
  Copy, QrCode, ArrowUpRight, ArrowDownLeft, Check, ExternalLink,
  AlertCircle, X, ChevronRight, Wallet,
} from 'lucide-react'
import { isAddress } from 'viem'
import { toast } from 'sonner'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { useNanStore, ActivityItem } from '../../store/nanStore'
import { formatAddress, formatUSDC } from '../../utils/format'
import { getWallet, sendUsdc } from '../../lib/nan'

const ARC_TESTNET_ID = 5042002
const ARC_EXPLORER   = 'https://explorer.testnet.arc.io'

// ── Balance hook — Circle SDK via backend ────────────────────────────────────

function useCircleBalance(email: string, sessionToken: string) {
  const [balance, setBalance]   = useState<string | null>(null)
  const [rawNum, setRawNum]     = useState(0)
  const [isLoading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!email || !sessionToken) return
    setLoading(true)
    try {
      const data  = await getWallet(email, sessionToken)
      const amt   = parseFloat(data.usdc)
      setRawNum(amt)
      setBalance(amt.toFixed(2))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [email, sessionToken])

  useEffect(() => { void refetch() }, [refetch])
  return { balance, rawNum, isLoading, refetch }
}

type WalletSubView = 'main' | 'send' | 'receive'

export function WalletPage({ initialSubView = 'main' }: { initialSubView?: string }) {
  const [subView, setSubView] = useState<WalletSubView>(
    (initialSubView as WalletSubView) === 'send' || (initialSubView as WalletSubView) === 'receive'
      ? (initialSubView as WalletSubView)
      : 'main',
  )
  const { nanAuth, agentPermissions, addActivity } = useNanStore()
  const [copied, setCopied] = useState(false)

  const email        = nanAuth?.email ?? ''
  const sessionToken = nanAuth?.sessionToken ?? ''
  const address      = nanAuth?.walletAddress ?? ''

  const { balance, rawNum, isLoading, refetch } = useCircleBalance(email, sessionToken)

  const handleCopy = () => {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Address copied')
  }

  if (!nanAuth) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#f5f5f8] flex items-center justify-center mx-auto mb-4">
          <Wallet size={28} className="text-[#8a849c]" />
        </div>
        <h2 className="text-xl font-bold text-[#122d45] mb-2">Not signed in</h2>
        <p className="text-sm text-[#6b6580]">Sign in to view your balance and make transactions.</p>
      </div>
    )
  }

  if (subView === 'send') {
    return (
      <SendFlow
        balance={rawNum}
        address={address}
        email={email}
        sessionToken={sessionToken}
        walletId={nanAuth.walletId}
        onBack={() => setSubView('main')}
        onSuccess={() => { void refetch(); setSubView('main') }}
        addActivity={addActivity}
      />
    )
  }

  if (subView === 'receive') {
    return <ReceiveView address={address} onBack={() => setSubView('main')} />
  }

  const agentReserved = agentPermissions.dailyLimit
  const available     = Math.max(0, rawNum - agentReserved)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-28 lg:pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#122d45]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Wallet
        </h1>
        <Badge variant="blue" size="sm">Arc Testnet</Badge>
      </div>

      {/* Balance card */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#2775CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>$</span>
          <div className="text-xs font-bold text-[#6b6580] uppercase tracking-wider">Total Balance</div>
        </div>

        {isLoading ? (
          <div className="h-12 w-48 bg-[#f5f5f8] rounded-xl animate-pulse mb-4" />
        ) : (
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-[#122d45] tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.04em' }}>
              {balance ?? '0.00'}
            </span>
            <span className="text-lg font-semibold text-[#6b6580]">USDC</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#f9f9fc] rounded-xl p-3">
            <div className="text-xs text-[#6b6580] font-medium mb-1">Available</div>
            <div className="text-base font-bold text-[#122d45] tabular-nums">{formatUSDC(available)}</div>
            <div className="text-xs text-[#8a849c]">USDC</div>
          </div>
          <div className="bg-[#f9f9fc] rounded-xl p-3">
            <div className="text-xs text-[#6b6580] font-medium mb-1">Reserved for agent</div>
            <div className="text-base font-bold text-[#1a6fd4] tabular-nums">{formatUSDC(agentReserved)}</div>
            <div className="text-xs text-[#8a849c]">USDC daily limit</div>
          </div>
        </div>

        <div className="flex gap-2.5">
          <Button fullWidth onClick={() => setSubView('send')} icon={<ArrowUpRight size={16} />}>Send</Button>
          <Button fullWidth variant="secondary" onClick={() => setSubView('receive')} icon={<ArrowDownLeft size={16} />}>Receive</Button>
        </div>
      </Card>

      {/* Wallet address */}
      <Card padding="md">
        <div className="text-xs font-bold text-[#6b6580] uppercase tracking-wider mb-3">Wallet address</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#f9f9fc] rounded-xl px-3 py-2.5">
            <div className="text-sm font-mono text-[#122d45] truncate">{address || 'Loading...'}</div>
          </div>
          <button onClick={handleCopy} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#f5f5f8] hover:bg-[#eeeef4] text-[#334155] transition-colors flex-shrink-0">
            {copied ? <Check size={16} className="text-[#1a8047]" /> : <Copy size={16} />}
          </button>
          <button onClick={() => setSubView('receive')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#f5f5f8] hover:bg-[#eeeef4] text-[#334155] transition-colors flex-shrink-0">
            <QrCode size={16} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#6b6580]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1a8047]" />
          Connected to Arc Testnet
          {address && (
            <a
              href={`${ARC_EXPLORER}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[#1a6fd4] hover:text-[#122d45] font-semibold transition-colors"
            >
              Explorer <ExternalLink size={11} />
            </a>
          )}
        </div>
      </Card>
    </div>
  )
}

// ─── Send Flow ────────────────────────────────────────────────────────────────

type SendStep = 'recipient' | 'amount' | 'note' | 'review' | 'submitting' | 'success' | 'error'

function SendFlow({
  balance, address, email, sessionToken, walletId, onBack, onSuccess, addActivity,
}: {
  balance: number
  address: string
  email: string
  sessionToken: string
  walletId: string
  onBack: () => void
  onSuccess: () => void
  addActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}) {
  const [step, setStep]         = useState<SendStep>('recipient')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount]     = useState('')
  const [note, setNote]         = useState('')
  const [recipientError, setRecipientError] = useState('')
  const [amountError, setAmountError]       = useState('')
  const [txError, setTxError]   = useState('')
  const [txHash, setTxHash]     = useState('')

  const validateRecipient = () => {
    if (!recipient) { setRecipientError('Recipient address is required'); return false }
    if (!isAddress(recipient)) { setRecipientError('Enter a valid 0x address'); return false }
    setRecipientError(''); return true
  }

  const validateAmount = () => {
    const n = parseFloat(amount)
    if (!amount || isNaN(n) || n <= 0) { setAmountError('Enter a valid amount'); return false }
    if (n > balance) { setAmountError(`Insufficient balance. You have ${formatUSDC(balance)} USDC`); return false }
    setAmountError(''); return true
  }

  const handleSend = async () => {
    setStep('submitting')
    try {
      const result = await sendUsdc(email, sessionToken, recipient, amount)
      setTxHash((result as Record<string, string>).txHash ?? '')
      setStep('success')
      addActivity({
        type: 'sent',
        description: note || 'Sent USDC',
        amount: parseFloat(amount),
        sign: '-',
        status: 'confirmed',
        counterparty: formatAddress(recipient),
        txHash: (result as Record<string, string>).txHash ?? undefined,
      })
      toast.success(`Sent ${amount} USDC successfully`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed'
      setTxError(msg)
      setStep('error')
      toast.error(msg)
    }
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-[#1a8047]" />
        </div>
        <h2 className="text-2xl font-bold text-[#122d45] mb-1">Payment sent</h2>
        <p className="text-[#6b6580] text-sm mb-4">Your USDC has been sent successfully.</p>
        <div className="bg-[#f9f9fc] rounded-2xl p-4 text-left space-y-2.5 mb-6 max-w-xs mx-auto">
          <Row label="Amount" value={`${formatUSDC(parseFloat(amount))} USDC`} mono />
          <Row label="Recipient" value={formatAddress(recipient)} mono />
          <Row label="Network" value="Arc Testnet" />
          {txHash && (
            <div className="pt-2 border-t border-[rgba(18,45,69,0.06)]">
              <a href={`${ARC_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#1a6fd4] font-semibold">
                <ExternalLink size={12} /> View on explorer
              </a>
            </div>
          )}
        </div>
        <Button onClick={onSuccess} fullWidth>Back to Wallet</Button>
      </div>
    )
  }

  if (step === 'submitting') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#dbeafe] flex items-center justify-center mx-auto">
          <div className="w-7 h-7 border-2 border-[#1a6fd4] border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[#122d45]">Sending USDC</h2>
        <p className="text-sm text-[#6b6580]">Submitting via Circle developer-controlled wallets...</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-28 lg:pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={step === 'recipient' ? onBack : () => setStep(step === 'review' ? 'note' : step === 'note' ? 'amount' : 'recipient')}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f5f8] text-[#334155]"
        >
          <X size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#122d45]">Send USDC</h1>
          <p className="text-xs text-[#6b6580]">
            {step === 'recipient' && 'Step 1 of 4 — Recipient'}
            {step === 'amount'    && 'Step 2 of 4 — Amount'}
            {step === 'note'      && 'Step 3 of 4 — Note (optional)'}
            {step === 'review'    && 'Step 4 of 4 — Review'}
            {step === 'error'     && 'Transaction failed'}
          </p>
        </div>
      </div>

      {step === 'recipient' && (
        <Card padding="lg">
          <Input label="Recipient address" placeholder="0x..." value={recipient}
            onChange={e => setRecipient(e.target.value)} error={recipientError} autoFocus />
          <div className="mt-4">
            <Button fullWidth onClick={() => { if (validateRecipient()) setStep('amount') }} iconRight={<ChevronRight size={16} />}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 'amount' && (
        <Card padding="lg">
          <Input label="Amount" placeholder="0.00" type="number" min="0" step="0.01"
            value={amount} onChange={e => setAmount(e.target.value)} error={amountError}
            suffix={<span className="text-xs font-bold text-[#6b6580]">USDC</span>} autoFocus />
          <div className="mt-2 flex items-center justify-between text-xs text-[#6b6580]">
            <span>Available: <span className="font-semibold text-[#122d45]">{formatUSDC(balance)} USDC</span></span>
            <button onClick={() => setAmount(balance.toFixed(6))} className="text-[#1a6fd4] font-semibold">Max</button>
          </div>
          <div className="flex gap-2 mt-3">
            {[5, 10, 25, 50].map(v => (
              <button key={v} onClick={() => setAmount(v.toString())} disabled={v > balance}
                className="flex-1 h-9 text-sm font-semibold rounded-xl bg-[#f5f5f8] hover:bg-[#eeeef4] text-[#334155] disabled:opacity-40">
                {v}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button fullWidth onClick={() => { if (validateAmount()) setStep('note') }} iconRight={<ChevronRight size={16} />}>Continue</Button>
          </div>
        </Card>
      )}

      {step === 'note' && (
        <Card padding="lg">
          <Textarea label="Add a note (optional)" placeholder="What's this payment for?"
            value={note} onChange={e => setNote(e.target.value)} rows={3} />
          <div className="mt-4">
            <Button fullWidth onClick={() => setStep('review')} iconRight={<ChevronRight size={16} />}>Review</Button>
          </div>
        </Card>
      )}

      {step === 'review' && (
        <Card padding="lg">
          <h2 className="text-base font-bold text-[#122d45] mb-4">Review transaction</h2>
          <div className="space-y-3 mb-6">
            <Row label="Recipient" value={formatAddress(recipient)} mono />
            <Row label="Amount"    value={`${formatUSDC(parseFloat(amount || '0'))} USDC`} mono />
            <Row label="Network"   value="Arc Testnet" />
            {note && <Row label="Note" value={note} />}
            <div className="pt-2 border-t border-[rgba(18,45,69,0.06)]">
              <Row label="Fee" value="~0.00 USDC (sponsored)" />
            </div>
          </div>
          <Button fullWidth onClick={() => void handleSend()} size="lg">Confirm & Send</Button>
        </Card>
      )}

      {step === 'error' && (
        <div className="space-y-3">
          <Card padding="md">
            <div className="flex items-start gap-2 text-[#ba2b4c]">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Transaction failed</p>
                <p className="text-xs mt-1">{txError}</p>
              </div>
            </div>
          </Card>
          <Button fullWidth variant="secondary" onClick={() => setStep('review')}>Try again</Button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-[#6b6580]">{label}</span>
      <span className={`text-sm font-semibold text-[#122d45] ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

// ─── Receive View ─────────────────────────────────────────────────────────────

function ReceiveView({ address, onBack }: { address: string; onBack: () => void }) {
  const [copied, setCopied] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [requestAmount, setRequestAmount] = useState('')
  const [requestNote, setRequestNote]     = useState('')

  const handleCopy = () => {
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Address copied')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-28 lg:pb-8">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f5f8] text-[#334155]">
          <X size={18} />
        </button>
        <h1 className="text-xl font-bold text-[#122d45]">Receive USDC</h1>
      </div>

      <Card padding="lg" className="text-center">
        <div className="w-44 h-44 mx-auto mb-4 bg-[#f9f9fc] rounded-2xl flex items-center justify-center border border-[rgba(18,45,69,0.1)]">
          <div className="text-center">
            <QrCode size={56} className="text-[#122d45] mx-auto mb-2" />
            <p className="text-xs text-[#6b6580]">QR code</p>
          </div>
        </div>
        <p className="text-xs text-[#6b6580] font-medium mb-2">Your wallet address</p>
        <p className="text-sm font-mono text-[#122d45] break-all px-2 mb-4">{address}</p>
        <div className="flex gap-2">
          <Button fullWidth variant="secondary" onClick={handleCopy} icon={copied ? <Check size={15} /> : <Copy size={15} />}>
            {copied ? 'Copied' : 'Copy address'}
          </Button>
          <Button fullWidth variant="secondary"
            onClick={() => { void navigator.share?.({ title: 'My Nan Address', text: address }) }}>
            Share
          </Button>
        </div>
      </Card>

      <Card padding="md">
        <button onClick={() => setShowRequest(!showRequest)} className="w-full flex items-center justify-between">
          <span className="text-sm font-bold text-[#122d45]">Create payment request</span>
          <ChevronRight size={16} className={`text-[#6b6580] transition-transform ${showRequest ? 'rotate-90' : ''}`} />
        </button>
        {showRequest && (
          <div className="mt-4 space-y-3">
            <Input label="Amount (USDC)" placeholder="25.00" type="number"
              value={requestAmount} onChange={e => setRequestAmount(e.target.value)}
              suffix={<span className="text-xs font-bold text-[#6b6580]">USDC</span>} />
            <Input label="Description (optional)" placeholder="What's this for?"
              value={requestNote} onChange={e => setRequestNote(e.target.value)} />
            {requestAmount && (
              <div className="bg-[#f9f9fc] rounded-xl p-3">
                <p className="text-xs text-[#6b6580] mb-1 font-medium">Payment request</p>
                <p className="text-sm font-bold text-[#122d45]">Request {formatUSDC(parseFloat(requestAmount))} USDC</p>
                <button
                  onClick={() => { const link = `nan://pay?to=${address}&amount=${requestAmount}${requestNote ? `&note=${encodeURIComponent(requestNote)}` : ''}`; void navigator.clipboard.writeText(link); toast.success('Request link copied') }}
                  className="mt-2 flex items-center gap-1.5 text-xs text-[#1a6fd4] font-semibold"
                >
                  <Copy size={12} /> Copy request link
                </button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
