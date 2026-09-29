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
    // Suppress chunk size warnings
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Treat porto's zod/mini import as external — it's only used for
      // runtime type validation inside wagmi connectors and has no effect
      // on the wallet connection UI we actually use.
      external: (id) => id === 'zod/mini',
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        if (warning.code === 'INVALID_ANNOTATION') return
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        if (warning.code === 'UNRESOLVED_IMPORT') return
        if (warning.code === 'INVALID_RESOLVE_ID') return
        if (warning.message?.includes('zod/mini')) return
        try { warn(warning) } catch {}
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: process.env.VITE_NAN_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => {})
        },
      },
    },
  },
})
