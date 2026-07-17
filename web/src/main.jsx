import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DevGate from './components/DevGate'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DevGate>
      <App />
    </DevGate>
  </React.StrictMode>
)
