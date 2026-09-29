# NAN Wallet

Stablecoin-native DeFi wallet on Arc Testnet.

## Monorepo structure (frontend + backend merged)

All API route handlers live in `api/` — Vercel serves them as serverless functions
automatically. The React/Vite frontend is built to `dist/` and served as the static site.
No Railway proxy needed; `/api/*` routes resolve on the same Vercel domain.

### Local development

```bash
# Start the Vite dev server (frontend, proxies /api to localhost:3000)
bun run dev

# In a second terminal — run the Express server (uses the same api/ handlers)
node _server/index.js    # or: node --env-file=.env _server/index.js
```

### Required environment variables (Vercel → Settings → Environment Variables)

| Variable | Description |
|---|---|
| `CIRCLE_API_KEY` | Circle Developer API key |
| `CIRCLE_ENTITY_SECRET` | Circle entity secret (for developer-controlled wallets) |
| `OTP_SECRET` | HMAC secret for OTP signing |
| `SMTP_PASS` | Resend API key (for OTP emails) |
| `SMTP_FROM` | From address e.g. `NAN <noreply@nanarc.xyz>` |
| `OPENAI_API_KEY` | OpenAI key for the AI chat |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key |

<!-- deploy logo 58px -->
<!-- bridge relayer deploy -->
<!-- deploy: Swap page pool liquidity + add liquidity panel -->
