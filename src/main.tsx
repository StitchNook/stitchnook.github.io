import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initDataStore, setExternalChangeHandler } from './lib/db'
import { notifyStoreChange } from './lib/storeEvents'

// Ask the browser not to clear this site's storage under pressure (granted
// silently by Chrome / Firefox for engaged sites; Safari keeps installed apps).
void navigator.storage?.persist?.().catch(() => false)

async function start() {
  // Projects live in IndexedDB: load them (and move old localStorage data)
  // before anything reads them. The app module is loaded afterwards for the
  // same reason.
  await initDataStore()
  setExternalChangeHandler(notifyStoreChange)
  const [{ default: App }, { migrateCategories }] = await Promise.all([import('./App.tsx'), import('./lib/motifs')])

  // Before the first render, so an open motif is loaded already migrated.
  migrateCategories()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
