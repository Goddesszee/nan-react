// api/chat.js — AI shopping agent powered by OpenAI with wallet context
// POST { messages, usdcBal, userAddress } -> { reply, action?, productId?, amount? }

import { requireEmailSession } from './_lib/auth.js'

const PRODUCTS = [
  { id: 'p1', name: 'Wireless Mechanical Keyboard', price: 24, merchant: 'TechFlow', category: 'tech', inStock: true },
  { id: 'p2', name: 'Noise-Cancelling Headphones', price: 49, merchant: 'AudioHub', category: 'tech', inStock: true },
  { id: 'p3', name: 'Laptop Stand Adjustable', price: 18, merchant: 'DeskMate', category: 'tech', inStock: true },
  { id: 'p4', name: 'LED Desk Lamp', price: 12, merchant: 'LightUp', category: 'home', inStock: true },
  { id: 'p5', name: 'Urban Backpack 30L', price: 38, merchant: 'UrbanGear', category: 'fashion', inStock: true },
  { id: 'p6', name: 'UI Kit Template Pro', price: 9, merchant: 'DesignLab', category: 'digital', inStock: true },
  { id: 'p7', name: 'Premium Icon Set', price: 7, merchant: 'DesignLab', category: 'digital', inStock: true },
  { id: 'p8', name: 'Braided USB-C Cable 2m', price: 5, merchant: 'TechFlow', category: 'tech', inStock: true },
  { id: 'p9', name: 'Minimalist Leather Wallet', price: 22, merchant: 'UrbanGear', category: 'fashion', inStock: true },
  { id: 'p10', name: 'USB Hub 7-Port', price: 16, merchant: 'TechFlow', category: 'tech', inStock: true },
]

const SYSTEM_PROMPT = `You are the NAN AI shopping agent — a helpful, concise assistant built into a USDC payment app on Arc Testnet (powered by Circle).

The user has a USDC wallet. Your job is to help them find and purchase products from the NAN marketplace.

Available products (JSON):
${JSON.stringify(PRODUCTS, null, 2)}

Rules:
- Recommend products within the user's stated budget or daily limit.
- When the user says "buy", "purchase", "get", or "order" a specific item, reply with a purchase confirmation request and include {"action":"purchase_request","productId":"<id>","amount":<price>} as the last line of your response as a JSON code block.
- When the user wants to search or browse, list 1-3 matching products with name, price in USDC, and merchant.
- Keep replies short (2-4 sentences) unless listing products.
- Always mention the price in USDC.
- If they're out of daily budget, say so and suggest cheaper options.
- NEVER make up products not in the list.
- The user's wallet is on Arc Testnet — all payments are test USDC with real Circle SDK transactions.`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!requireEmailSession(req, res)) return

  const { messages = [], usdcBal, userAddress } = req.body || {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, error: 'messages array required' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Demo fallback when OpenAI key is absent
    const last = messages[messages.length - 1]?.content || ''
    return res.json({
      success: true,
      reply: `[Demo mode — OpenAI key not configured] You said: "${last.slice(0, 80)}". I can help you find products when the OPENAI_API_KEY is set in Vercel env vars.`,
    })
  }

  // Build OpenAI messages array with wallet context injected
  const contextNote = `[User context: USDC balance ≈ ${usdcBal || 'unknown'} USDC, wallet ${userAddress ? userAddress.slice(0, 8) + '...' : 'unknown'}]`
  const openAiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextNote },
    // Keep last 10 turns to stay within context limits
    ...messages.slice(-10).map(m => ({
      role: m.role === 'agent' ? 'assistant' : m.role,
      content: String(m.content || ''),
    })),
  ]

  try {
    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAiMessages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    })
    if (!chatRes.ok) {
      const err = await chatRes.json().catch(() => ({}))
      throw new Error(err.error?.message || `OpenAI error ${chatRes.status}`)
    }
    const data = await chatRes.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not process your request.'

    // Parse embedded action JSON if present
    let action, productId, amount
    const jsonMatch = reply.match(/```json\s*([\s\S]+?)\s*```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        action = parsed.action
        productId = parsed.productId
        amount = parsed.amount
      } catch {}
    }

    return res.json({ success: true, reply: reply.replace(/```json[\s\S]*?```/g, '').trim(), action, productId, amount })
  } catch (err) {
    console.error('[chat]', err.message)
    return res.status(500).json({ success: false, error: err.message })
  }
}
