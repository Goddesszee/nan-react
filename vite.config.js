import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    // Required for wagmi / viem / connectkit in browser builds
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        if (warning.code === 'INVALID_ANNOTATION') return
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // zod/mini is a zod v4 subpath; wagmi's porto connector imports it but
      // zod v3 exposes it as ./v4-mini. Map it to the ESM dist directly so
      // both local and Vercel builds resolve it identically.
      'zod/mini': path.resolve(__dirname, 'node_modules/zod/dist/esm/v4/mini/index.js'),
    },
  },
  server: {
    port: 5174,
    // In local dev, proxy /api to the local Express server (bun run server).
    // On Vercel, /api/* is handled natively by the serverless functions in api/.
    proxy: {
      '/api': {
        target: process.env.VITE_NAN_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => {
            // Silently ignore proxy errors — backend may not be running locally
          })
        },
      },
    },
  },
})
