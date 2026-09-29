/**
 * parseBody — safely parse a Vercel serverless function request body.
 *
 * Vercel auto-parses req.body for CommonJS functions but NOT for ESM modules
 * ("type":"module" in package.json). This helper handles both cases:
 *   - Already parsed (object)  → return as-is
 *   - Raw string               → JSON.parse
 *   - Readable stream          → collect chunks, then JSON.parse
 *   - undefined / null         → return {}
 */
export async function parseBody(req) {
  // Already parsed by Vercel/Express
  if (req.body !== null && req.body !== undefined && typeof req.body === 'object' && !req.body.readable) {
    return req.body
  }

  // String body
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }

  // Stream — collect chunks
  if (req.body && typeof req.body.on === 'function') {
    return new Promise((resolve) => {
      const chunks = []
      req.body.on('data', chunk => chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8')))
      req.body.on('end', () => {
        const raw = chunks.join('')
        try { resolve(JSON.parse(raw)) } catch { resolve({}) }
      })
      req.body.on('error', () => resolve({}))
    })
  }

  // Fallback — try to read req itself as a stream (Vercel Node 18 ESM)
  if (req && typeof req.on === 'function') {
    return new Promise((resolve) => {
      const chunks = []
      req.on('data', chunk => chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8')))
      req.on('end', () => {
        const raw = chunks.join('')
        try { resolve(JSON.parse(raw)) } catch { resolve({}) }
      })
      req.on('error', () => resolve({}))
    })
  }

  return {}
}

/**
 * parseQuery — safely extract query string parameters.
 * Works whether req.query is already parsed or only req.url is available.
 */
export function parseQuery(req) {
  if (req.query && typeof req.query === 'object') return req.query
  try {
    const url = new URL(req.url, 'http://localhost')
    const q = {}
    for (const [k, v] of url.searchParams.entries()) q[k] = v
    return q
  } catch {
    return {}
  }
}
