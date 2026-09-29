// api/circle-wallets.js — wallet balance + USDC transfer using Circle SDK
// GET  /api/circle-wallets?action=balance               -> { balance, walletId, walletAddress }
// GET  /api/circle-wallets?action=wallet                -> { walletId, walletAddress, state, blockchain }
// POST /api/circle-wallets { action:'transfer', to, amount } -> { txId, state, txHash }
// GET  /api/circle-wallets?action=txStatus&txId=...      -> { txId, state, txHash }

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'
import { requireEmailSession } from './_lib/auth.js'

const ARC_TESTNET_USDC = '0x3600000000000000000000000000000000000000'
const ARC_CHAIN = 'ARC-TESTNET'

function getCircleClient() {
  const apiKey = process.env.CIRCLE_API_KEY || process.env.CIRCLE_DEVELOPER_CONTROLLED_API_KEY
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET
  if (!apiKey || !entitySecret) throw new Error('Circle credentials not configured')
  return initiateDeveloperControlledWalletsClient({ apiKey, entitySecret })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!requireEmailSession(req, res)) return
  const { walletId, walletAddress } = req.session

  const action = req.method === 'GET'
    ? (req.query?.action || 'wallet')
    : (req.body?.action)

  // ── GET wallet info ──────────────────────────────────────────────────────────
  if (action === 'wallet') {
    try {
      const sdk = getCircleClient()
      const r = await sdk.getWallet({ id: walletId })
      const w = r.data?.wallet
      return res.json({
        success: true,
        walletId: w?.id || walletId,
        walletAddress: w?.address || walletAddress,
        state: w?.state || 'LIVE',
        blockchain: w?.blockchain || ARC_CHAIN,
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  // ── GET balance ──────────────────────────────────────────────────────────────
  if (action === 'balance') {
    try {
      const sdk = getCircleClient()
      const r = await sdk.getWalletTokenBalance({ id: walletId })
      const balances = r.data?.tokenBalances || []
      // Find USDC balance (by token address or symbol)
      const usdcEntry = balances.find(b =>
        b.token?.symbol === 'USDC' ||
        b.token?.tokenAddress?.toLowerCase() === ARC_TESTNET_USDC.toLowerCase()
      )
      const balance = usdcEntry ? parseFloat(usdcEntry.amount || '0') : 0
      return res.json({
        success: true,
        balance,
        balanceFormatted: balance.toFixed(6),
        walletId,
        walletAddress,
        raw: balances,
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  // ── POST transfer ────────────────────────────────────────────────────────────
  if (action === 'transfer') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { to, amount } = req.body || {}
    if (!to || !amount) {
      return res.status(400).json({ success: false, error: '`to` and `amount` are required' })
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(to)) {
      return res.status(400).json({ success: false, error: 'Invalid destination address' })
    }
    const amtFloat = parseFloat(amount)
    if (isNaN(amtFloat) || amtFloat <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' })
    }
    if (amtFloat > 10000) {
      return res.status(400).json({ success: false, error: 'Amount exceeds per-request safety limit (10,000 USDC)' })
    }
    try {
      const sdk = getCircleClient()
      // Idempotency key: walletId + to + amount + minute-floored timestamp
      const idem = `nan-tx-${walletId}-${to}-${amtFloat}-${Math.floor(Date.now() / 60000)}`
        .replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 64)
      const txRes = await sdk.createTransaction({
        walletId,
        tokenAddress: ARC_TESTNET_USDC,
        destinationAddress: to,
        amounts: [amtFloat.toString()],
        fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
        idempotencyKey: idem,
      })
      const txId = txRes.data?.id
      if (!txId) throw new Error('No transaction ID returned')
      return res.json({ success: true, txId, state: 'INITIATED' })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  // ── GET txStatus ─────────────────────────────────────────────────────────────
  if (action === 'txStatus') {
    const txId = req.query?.txId
    if (!txId) return res.status(400).json({ success: false, error: 'txId required' })
    try {
      const sdk = getCircleClient()
      const r = await sdk.getTransaction({ id: txId })
      const tx = r.data?.transaction
      return res.json({
        success: true,
        txId: tx?.id,
        state: tx?.state,
        txHash: tx?.txHash,
        errorReason: tx?.errorReason,
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  return res.status(400).json({ success: false, error: 'Unknown action' })
}
