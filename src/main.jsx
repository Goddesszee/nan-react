import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './App.css'

// Route /app and /app/* to the new premium TypeScript UI
// Everything else uses the original Nan landing + auth flow
const path = window.location.pathname

if (path === '/app' || path.startsWith('/app/')) {
  // Lazy-load the new TypeScript app so it doesn't bloat the landing bundle
  import('./AppNew.tsx').then(({ default: AppNew }) => {
    import('@tanstack/react-query').then(({ QueryClient, QueryClientProvider }) => {
      import('wagmi').then(({ WagmiProvider }) => {
        import('connectkit').then(({ ConnectKitProvider }) => {
          import('sonner').then(({ Toaster }) => {
            import('./config.ts').then(({ config }) => {
              const queryClient = new QueryClient()
              ReactDOM.createRoot(document.getElementById('root')).render(
                <React.StrictMode>
                  <WagmiProvider config={config}>
                    <QueryClientProvider client={queryClient}>
                      <ConnectKitProvider theme="auto" mode="dark">
                        <AppNew />
                        <Toaster position="top-right" toastOptions={{
                          style: {
                            background: '#111118',
                            border: '1px solid rgba(37,99,235,0.22)',
                            color: '#F4F4F8',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                          }
                        }} />
                      </ConnectKitProvider>
                    </QueryClientProvider>
                  </WagmiProvider>
                </React.StrictMode>
              )
            })
          })
        })
      })
    })
  })
} else {
  // Original Nan landing + auth flow
  import('./App').then(({ default: App }) => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
}
