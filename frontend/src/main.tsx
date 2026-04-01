import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="flex items-center justify-center min-h-svh bg-surface">
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient">
        <h1 className="text-4xl font-bold text-primary-container">Tixora</h1>
        <p className="text-sm text-on-surface-variant">Powering Every Request</p>
      </div>
    </div>
  </StrictMode>,
)
