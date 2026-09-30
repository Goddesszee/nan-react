import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { Toaster } from 'sonner'
import { config } from './config'
import './index.css'
import './App.css'

const queryClient = new QueryClient()
const path = window.location.pathname

const NEW_ROUTES = ['/shop', '/agent', '/activity']

if (NEW_ROUTES.includes(path)) {
  // Load the new premium UI for these routes
  Promise.all([
    import('./AppNew'),
  ]).then(([{ default: AppNew }]) => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <ConnectKitProvider theme="auto" mode="dark">
              <AppNew initialView={path.slice(1)} />
              <Toaster position="top-right" toastOptions={{
                style: {
                  background: '#111118',
                  border: '1px solid rgba(37,99,235,0.22)',
                  color: '#F4F4F8',
                  fontFamily: 'Inter, sans-serif',
                }
              }} />
            </ConnectKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </React.StrictMode>
    )
  })
} else {
  // All other routes → original Nan app
  import('./App').then(({ default: App }) => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
}
