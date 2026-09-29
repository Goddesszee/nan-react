import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#111118',
          border: '1px solid rgba(37,99,235,0.22)',
          color: '#F4F4F8',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        },
      }}
    />
  </StrictMode>
)
