import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { migrateCategories } from './lib/motifs'

// Before the first render, so an open motif is loaded already migrated.
migrateCategories()

// Ask the browser not to clear this site's storage under pressure (granted
// silently by Chrome / Firefox for engaged sites; Safari keeps installed apps).
void navigator.storage?.persist?.().catch(() => false)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
