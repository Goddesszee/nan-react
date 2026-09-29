// api/marketplace.js — product catalog + USDC order execution via Circle SDK
// GET  /api/marketplace?action=products            -> { products }
// GET  /api/marketplace?action=product&id=...      -> { product }
// POST /api/marketplace { action:'order', productId, quantity } -> { orderId, txId, state }
// GET  /api/marketplace?action=orders              -> { orders }

import crypto from 'crypto'
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'
import { requireEmailSession } from './_lib/auth.js'

// Treasury address comes from env — set NAN_TREASURY_ADDRESS in Vercel
// (the USDC contract address is read from onchain-facts on the frontend;
// here we only need the destination wallet address for payments)
const TREASURY_ADDRESS = process.env.NAN_TREASURY_ADDRESS
const ARC_TESTNET_USDC = process.env.VITE_ARC_USDC_ADDRESS // set via printf in .env

// ── Product catalog ────────────────────────────────────────────────────────────
function buildProducts() {
  const dest = TREASURY_ADDRESS || null
  return [
    { id: 'p1', name: 'Wireless Mechanical Keyboard', price: 24, merchant: 'TechFlow', merchantAddress: dest, category: 'tech', inStock: true, rating: 4.8, reviewCount: 124, description: 'Compact TKL layout with tactile brown switches, per-key RGB lighting, and 2.4GHz wireless receiver. Up to 70-hour battery.', tags: ['wireless', 'mechanical', 'rgb'], imageUrl: 'https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=400&q=80' },
    { id: 'p2', name: 'Noise-Cancelling Headphones', price: 49, merchant: 'AudioHub', merchantAddress: dest, category: 'tech', inStock: true, rating: 4.6, reviewCount: 89, description: 'Active noise cancellation, 30-hour playtime, foldable design, premium 40mm drivers with Hi-Res Audio certification.', tags: ['anc', 'wireless', 'audio'], imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
    { id: 'p3', name: 'Laptop Stand Adjustable', price: 18, merchant: 'DeskMate', merchantAddress: dest, category: 'tech', inStock: true, rating: 4.7, reviewCount: 203, description: 'Ergonomic aluminium stand, 6 height settings, fits laptops 10-17 inches. Improves posture and airflow.', tags: ['ergonomic', 'aluminium', 'adjustable'], imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80' },
    { id: 'p4', name: 'LED Desk Lamp', price: 12, merchant: 'LightUp', merchantAddress: dest, category: 'home', inStock: true, rating: 4.5, reviewCount: 67, description: 'Touch-dimmer, 5 colour temperatures 2700-6500K, USB-A charging port, flexible gooseneck.', tags: ['led', 'dimmable', 'usb'], imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
    { id: 'p5', name: 'Urban Backpack 30L', price: 38, merchant: 'UrbanGear', merchantAddress: dest, category: 'fashion', inStock: true, rating: 4.9, reviewCount: 156, description: 'Water-resistant 420D nylon, dedicated 16" laptop compartment, hidden anti-theft pocket, USB-A pass-through port.', tags: ['waterproof', 'laptop', 'commute'], imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80' },
    { id: 'p6', name: 'UI Kit Template Pro', price: 9, merchant: 'DesignLab', merchantAddress: dest, category: 'digital', inStock: true, rating: 4.8, reviewCount: 44, description: '320+ components, 12 page templates, dark + light modes, auto-layout, Figma native. Instant download.', tags: ['figma', 'components', 'design-system'], imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80' },
    { id: 'p7', name: 'Premium Icon Set 1200+', price: 7, merchant: 'DesignLab', merchantAddress: dest, category: 'digital', inStock: true, rating: 4.7, reviewCount: 31, description: '1200+ icons in SVG and PNG, 3 weights (Regular, Medium, Bold), MIT licensed for commercial use.', tags: ['svg', 'icons', 'mit'], imageUrl: 'https://images.unsplash.com/photo-1618788372246-79faff0c3742?w=400&q=80' },
    { id: 'p8', name: 'Braided USB-C Cable 2m', price: 5, merchant: 'TechFlow', merchantAddress: dest, category: 'tech', inStock: true, rating: 4.4, reviewCount: 312, description: 'USB 3.2 Gen 2, 100W PD charging, 10Gbps data, Aramid fibre braid, USB-IF certified.', tags: ['fast-charge', '100w', 'data'], imageUrl: 'https://images.unsplash.com/photo-1625315700946-4e24d504df1d?w=400&q=80' },
    { id: 'p9', name: 'Minimalist Leather Wallet', price: 22, merchant: 'UrbanGear', merchantAddress: dest, category: 'fashion', inStock: true, rating: 4.6, reviewCount: 78, description: 'Full-grain veg-tanned leather, holds 6 cards + cash, slim 6mm profile, RFID blocking lining.', tags: ['rfid', 'slim', 'leather'], imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80' },
    { id: 'p10', name: 'USB Hub 7-Port', price: 16, merchant: 'TechFlow', merchantAddress: dest, category: 'tech', inStock: true, rating: 4.5, reviewCount: 91, description: '4× USB-A 3.0 + 3× USB-A 2.0, individual LED power switches, braided 1m cable, bus-powered.', tags: ['usb3', 'hub', 'bus-powered'], imageUrl: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&q=80' },
  ]
}

// In-memory order store (in production: use a DB — Vercel serverless resets per cold start)
const orders = new Map()

function getCircleClient() {
  const apiKey = process.env.CIRCLE_API_KEY || process.env.CIRCLE_DEVELOPER_CONTROLLED_API_KEY
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET
  if (!apiKey || !entitySecret) return null
  return initiateDeveloperControlledWalletsClient({ apiKey, entitySecret })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const action = req.method === 'GET'
    ? (req.query?.action || 'products')
    : (req.body?.action)

  const PRODUCTS = buildProducts()

  // ── Public: product catalog ──────────────────────────────────────────────────
  if (action === 'products') {
    const { category, search, maxPrice } = req.query || {}
    let list = PRODUCTS
    if (category && category !== 'all') list = list.filter(p => p.category === category)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.merchant.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      )
    }
    if (maxPrice) list = list.filter(p => p.price <= parseFloat(maxPrice))
    // Strip merchantAddress from public listing
    return res.json({ success: true, products: list.map(({ merchantAddress, ...p }) => p) })
  }

  if (action === 'product') {
    const id = req.query?.id
    const product = PRODUCTS.find(p => p.id === id)
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' })
    const { merchantAddress, ...safe } = product
    return res.json({ success: true, product: safe })
  }

  // ── Auth required ────────────────────────────────────────────────────────────
  if (!requireEmailSession(req, res)) return
  const { walletId, walletAddress } = req.session

  // ── POST order ───────────────────────────────────────────────────────────────
  if (action === 'order') {
    if (req.method !== 'POST') return res.status(405).end()
    const { productId, quantity = 1 } = req.body || {}
    const product = PRODUCTS.find(p => p.id === productId)
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' })
    if (!product.inStock) return res.status(400).json({ success: false, error: 'Product out of stock' })
    if (!product.merchantAddress) {
      return res.status(503).json({ success: false, error: 'NAN_TREASURY_ADDRESS not configured in Vercel env vars' })
    }
    const qty = Math.max(1, parseInt(quantity) || 1)
    const total = (product.price * qty).toFixed(6)

    if (!ARC_TESTNET_USDC) {
      return res.status(503).json({ success: false, error: 'VITE_ARC_USDC_ADDRESS not configured in Vercel env vars' })
    }

    const orderId = crypto.randomUUID()
    let txId = null

    const sdk = getCircleClient()
    if (sdk) {
      try {
        const idem = `nan-order-${orderId}`.slice(0, 64)
        const txRes = await sdk.createTransaction({
          walletId,
          tokenAddress: ARC_TESTNET_USDC,
          destinationAddress: product.merchantAddress,
          amounts: [total],
          fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
          idempotencyKey: idem,
        })
        txId = txRes.data?.id
      } catch (err) {
        console.error('[marketplace/order] tx error:', err.message)
      }
    }

    const order = {
      orderId,
      productId,
      productName: product.name,
      merchant: product.merchant,
      quantity: qty,
      total: parseFloat(total),
      walletId,
      buyerAddress: walletAddress,
      txId,
      state: txId ? 'INITIATED' : 'PENDING_TX',
      createdAt: new Date().toISOString(),
    }
    orders.set(orderId, order)
    return res.json({ success: true, orderId, txId, state: order.state, total: parseFloat(total) })
  }

  // ── GET orders ───────────────────────────────────────────────────────────────
  if (action === 'orders') {
    const userOrders = [...orders.values()]
      .filter(o => o.walletId === walletId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return res.json({ success: true, orders: userOrders })
  }

  return res.status(400).json({ success: false, error: 'Unknown action' })
}
