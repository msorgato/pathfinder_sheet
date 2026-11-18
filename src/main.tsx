import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import '@fontsource-variable/literata/opsz.css'
import '@fontsource-variable/cinzel'
import './index.css'
import App from './App.tsx'
import { initPwaUpdates } from './lib/pwaUpdate'

initPwaUpdates()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
