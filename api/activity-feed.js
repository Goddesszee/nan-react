// api/activity-feed.js — transaction history from Circle SDK
// GET /api/activity-feed -> { items: ActivityItem[] }

import { requireEmailSession } from './_lib/auth.js'

async function getCircleClient() {
  const apiKey = process.env.CIRCLE_API_KEY || process.env.CIRCLE_DEVELOPER_CONTROLLED_API_KEY
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET
  if (!apiKey || !entitySecret) throw new Error('Circle credentials not configured')
  const { initiateDeveloperControlledWalletsClient } = await import('@circle-fin/developer-controlled-wallets')
  return initiateDeveloperControlledWalletsClient({ apiKey, entitySecret })
}

function mapCircleTxToActivity(tx, myAddress) {
  const isInbound = tx.destinationAddress?.toLowerCase() === myAddress?.toLowerCase()
  return {
    id: tx.id,
    type: isInbound ? 'received' : 'sent',
    description: isInbound
      ? `Received USDC from ${tx.sourceAddress?.slice(0, 6)}...`
      : `Sent USDC to ${tx.destinationAddress?.slice(0, 6)}...`,
    amount: parseFloat(tx.amounts?.[0] || '0'),
    sign: isInbound ? '+' : '-',
    timestamp: tx.createDate || new Date().toISOString(),
    status: tx.state === 'COMPLETE' ? 'confirmed'
      : tx.state === 'FAILED' || tx.state === 'DENIED' ? 'failed'
      : 'pending',
    counterparty: isInbound ? tx.sourceAddress : tx.destinationAddress,
    txHash: tx.txHash,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (!requireEmailSession(req, res)) return
  const { walletId, walletAddress } = req.session

  try {
    const sdk = await getCircleClient()
    // List outbound transactions from this wallet
    const [outRes, inRes] = await Promise.allSettled([
      sdk.listTransactions({ walletIds: [walletId], pageSize: 50 }),
      sdk.listTransactions({ destinationAddress: walletAddress, pageSize: 50 }),
    ])

    const outTxs = outRes.status === 'fulfilled' ? (outRes.value.data?.transactions || []) : []
    const inTxs = inRes.status === 'fulfilled' ? (inRes.value.data?.transactions || []) : []

    // Deduplicate by id
    const seen = new Set()
    const allTxs = [...outTxs, ...inTxs].filter(tx => {
      if (seen.has(tx.id)) return false
      seen.add(tx.id); return true
    })

    // Sort newest first
    allTxs.sort((a, b) => new Date(b.createDate || 0) - new Date(a.createDate || 0))

    const items = allTxs.map(tx => mapCircleTxToActivity(tx, walletAddress))
    return res.json({ success: true, items })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
