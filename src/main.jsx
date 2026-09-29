import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './App.css'

// All routes → original Nan app (App.jsx → Landing.jsx → /legacy/app.html)
import('./App').then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
