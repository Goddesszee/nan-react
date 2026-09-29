// api/agent-wallets.js — agent sub-wallet with per-day spending policy enforced server-side
// GET  /api/agent-wallets?action=status              -> { agentWalletId, agentAddress, dailyUsed, dailyLimit, enabled }
// POST { action:'configure', dailyLimit, perTxLimit, autoApproveUnder, requireApproval, enabled }
// POST { action:'execute', productId, amount, description } -> { txId, state }
// GET  /api/agent-wallets?action=history             -> { transactions[] }

import crypto from 'crypto'
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'
import { requireEmailSession } from './_lib/auth.js'

const ARC_TESTNET_USDC = process.env.VITE_ARC_USDC_ADDRESS
const TREASURY_ADDRESS = process.env.NAN_TREASURY_ADDRESS

// In-memory per-wallet policy store
// Production: use a DB row per walletId
const policyStore = new Map()
const spendStore = new Map()   // walletId -> { date: 'YYYY-MM-DD', used: number }
const agentWalletMap = new Map() // walletId -> agentWalletId

function getPolicy(walletId) {
  return policyStore.get(walletId) || {
    dailyLimit: 20,
    perTxLimit: 10,
    autoApproveUnder: 5,
    requireApproval: true,
    enabled: false,
  }
}

function getTodaySpend(walletId) {
  const today = new Date().toISOString().slice(0, 10)
  const rec = spendStore.get(walletId)
  if (!rec || rec.date !== today) return 0
  return rec.used
}

function addSpend(walletId, amount) {
  const today = new Date().toISOString().slice(0, 10)
  const rec = spendStore.get(walletId)
  if (!rec || rec.date !== today) {
    spendStore.set(walletId, { date: today, used: amount })
  } else {
    rec.used += amount
  }
}

function getCircleClient() {
  const apiKey = process.env.CIRCLE_API_KEY || process.env.CIRCLE_DEVELOPER_CONTROLLED_API_KEY
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET
  if (!apiKey || !entitySecret) return null
  return initiateDeveloperControlledWalletsClient({ apiKey, entitySecret })
}

async function getOrCreateAgentWallet(sdk, walletSetId, ownerWalletId) {
  if (agentWalletMap.has(ownerWalletId)) return agentWalletMap.get(ownerWalletId)
  const emailHash = crypto.createHash('sha256').update(ownerWalletId).digest('hex').slice(0, 16)
  const agentName = `nan-agent-${emailHash}`

  // Try to find existing agent wallet
  try {
    const listRes = await sdk.listWallets({ pageSize: 50 })
    const existing = (listRes.data?.wallets || []).find(w => w.name === agentName)
    if (existing) {
      const entry = { agentWalletId: existing.id, agentAddress: existing.address }
      agentWalletMap.set(ownerWalletId, entry)
      return entry
    }
  } catch {}

  // Create new
  const wsRes = await sdk.createWallets({
    accountType: 'EOA',
    blockchains: ['ARC-TESTNET'],
    count: 1,
    walletSetId,
    metadata: [{ name: agentName, refId: `agent-for-${ownerWalletId}` }],
  })
  const wallet = wsRes.data?.wallets?.[0]
  if (!wallet) throw new Error('Agent wallet creation failed')
  const entry = { agentWalletId: wallet.id, agentAddress: wallet.address }
  agentWalletMap.set(ownerWalletId, entry)
  return entry
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!requireEmailSession(req, res)) return
  const { walletId } = req.session

  const action = req.method === 'GET'
    ? (req.query?.action || 'status')
    : (req.body?.action)

  // ── GET status ───────────────────────────────────────────────────────────────
  if (action === 'status') {
    const policy = getPolicy(walletId)
    const dailyUsed = getTodaySpend(walletId)
    const agentInfo = agentWalletMap.get(walletId) || { agentWalletId: null, agentAddress: null }
    return res.json({
      success: true,
      ...policy,
      dailyUsed,
      dailyRemaining: Math.max(0, policy.dailyLimit - dailyUsed),
      ...agentInfo,
    })
  }

  // ── POST configure ───────────────────────────────────────────────────────────
  if (action === 'configure') {
    if (req.method !== 'POST') return res.status(405).end()
    const { dailyLimit, perTxLimit, autoApproveUnder, requireApproval, enabled } = req.body || {}
    const current = getPolicy(walletId)
    const updated = {
      dailyLimit: typeof dailyLimit === 'number' ? Math.max(0, dailyLimit) : current.dailyLimit,
      perTxLimit: typeof perTxLimit === 'number' ? Math.max(0, perTxLimit) : current.perTxLimit,
      autoApproveUnder: typeof autoApproveUnder === 'number' ? Math.max(0, autoApproveUnder) : current.autoApproveUnder,
      requireApproval: typeof requireApproval === 'boolean' ? requireApproval : current.requireApproval,
      enabled: typeof enabled === 'boolean' ? enabled : current.enabled,
    }
    policyStore.set(walletId, updated)
    return res.json({ success: true, policy: updated })
  }

  // ── POST execute (agent-initiated purchase) ──────────────────────────────────
  if (action === 'execute') {
    if (req.method !== 'POST') return res.status(405).end()
    const { amount, description, destinationAddress } = req.body || {}
    const policy = getPolicy(walletId)

    if (!policy.enabled) {
      return res.status(403).json({ success: false, error: 'Agent spending is disabled' })
    }
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ success: false, error: 'amount required' })
    }
    const amt = parseFloat(amount)
    if (amt > policy.perTxLimit) {
      return res.status(403).json({ success: false, error: `Amount ${amt} USDC exceeds per-transaction limit of ${policy.perTxLimit} USDC` })
    }
    const dailyUsed = getTodaySpend(walletId)
    if (dailyUsed + amt > policy.dailyLimit) {
      return res.status(403).json({
        success: false,
        error: `Daily limit would be exceeded (used: ${dailyUsed} USDC, limit: ${policy.dailyLimit} USDC)`,
      })
    }
    if (!ARC_TESTNET_USDC) {
      return res.status(503).json({ success: false, error: 'VITE_ARC_USDC_ADDRESS not configured' })
    }

    const dest = destinationAddress || TREASURY_ADDRESS
    if (!dest) {
      return res.status(503).json({ success: false, error: 'Destination address not configured. Set NAN_TREASURY_ADDRESS in Vercel env vars.' })
    }

    const sdk = getCircleClient()
    if (!sdk) {
      // No Circle creds — record spend locally anyway (demo mode)
      addSpend(walletId, amt)
      return res.json({ success: true, txId: null, state: 'DEMO', description })
    }

    try {
      const walletSetId = process.env.NAN_WALLET_SET_ID
      const agentInfo = walletSetId
        ? await getOrCreateAgentWallet(sdk, walletSetId, walletId)
        : { agentWalletId: walletId } // fall back to owner wallet

      const idem = `nan-agent-${walletId}-${Math.floor(Date.now() / 60000)}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 64)
      const txRes = await sdk.createTransaction({
        walletId: agentInfo.agentWalletId || walletId,
        tokenAddress: ARC_TESTNET_USDC,
        destinationAddress: dest,
        amounts: [amt.toFixed(6)],
        fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
        idempotencyKey: idem,
      })
      const txId = txRes.data?.id
      addSpend(walletId, amt)
      return res.json({ success: true, txId, state: 'INITIATED', description })
    } catch (err) {
      console.error('[agent-wallets/execute]', err.message)
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  return res.status(400).json({ success: false, error: 'Unknown action' })
}
