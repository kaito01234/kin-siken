import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Cloudflare Web Analytics（トークンが設定されている場合のみ）
const cfToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN
if (cfToken) {
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset.cfBeacon = JSON.stringify({ token: cfToken })
  document.body.appendChild(script)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
