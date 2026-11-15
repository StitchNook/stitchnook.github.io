/**
 * Where the user's data lives: projects, the project index, motif folders and
 * reference images. Stored in IndexedDB (room for hundreds of megabytes,
 * unlike the ~5 MB of localStorage), but read synchronously from an in-memory
 * copy loaded once before the app renders (`initDataStore`), so the rest of the
 * code keeps its simple synchronous calls. Writes update the copy at once and
 * reach IndexedDB in the background, in order.
 *
 * Preferences (theme, language, open panels, tabs, reminders) stay in
 * localStorage: they are tiny and some are needed before the first paint.
 *
 * If IndexedDB cannot be opened (very old or locked-down browser), everything
 * falls back to localStorage, as before.
 */

const DB_NAME = 'stitchnook'
const STORE = 'kv'
const CHANNEL = 'stitchnook-data'

/** Keys of user data, moved out of localStorage on the first start. */
export const isDataKey = (key: string) =>
  key === 'stitchly.index.v1' ||
  key === 'stitchly.motifFolders.v1' ||
  key.startsWith('stitchly.project.') ||
  key.startsWith('stitchly.reference.')

let db: IDBDatabase | null = null
const cache = new Map<string, string>()
let channel: BroadcastChannel | null = null

/* ------------------------------------------------------------------ errors */

const errorListeners = new Set<(error: unknown) => void>()

/** Called when a background write fails (e.g. the disk is full). */
export function subscribeDataErrors(listener: (error: unknown) => void): () => void {
  errorListeners.add(listener)
  return () => errorListeners.delete(listener)
}

function reportError(error: unknown) {
  for (const listener of errorListeners) listener(error)
}

/* -------------------------------------------------------------- start-up */

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB blocked'))
  })
}

/** Open the database, move old localStorage data into it, load everything in memory. */
export async function initDataStore(): Promise<void> {
  try {
    db = await openDb()
  } catch {
    db = null // Fallback: localStorage, read directly.
    return
  }

  // Load what IndexedDB holds.
  const tx = db.transaction(STORE, 'readonly')
  const store = tx.objectStore(STORE)
  const [keys, values] = await Promise.all([request(store.getAllKeys()), request(store.getAll())])
  keys.forEach((key, i) => {
    if (typeof key === 'string' && typeof values[i] === 'string') cache.set(key, values[i] as string)
  })

  await migrateFromLocalStorage()

  // Keep tabs of the app in step: another tab's writes update this copy.
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (event: MessageEvent<{ key: string; value: string | null }>) => {
      const { key, value } = event.data
      if (value === null) cache.delete(key)
      else cache.set(key, value)
      onExternalChange?.()
    }
  }
}

/** Data written by an older version in localStorage: copied, then removed once safely stored. */
async function migrateFromLocalStorage() {
  if (!db) return
  let keys: string[] = []
  try {
    keys = Object.keys(localStorage).filter(isDataKey)
  } catch {
    return
  }
  if (keys.length === 0) return
  const moved: string[] = []
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  for (const key of keys) {
    const value = localStorage.getItem(key)
    if (value === null) continue
    // IndexedDB wins if both exist (a newer write already landed there).
    if (!cache.has(key)) {
      cache.set(key, value)
      store.put(value, key)
    }
    moved.push(key)
  }
  try {
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    for (const key of moved) localStorage.removeItem(key)
  } catch {
    // Not stored: keep using localStorage for this session, the next start tries again.
    db?.close()
    db = null
    cache.clear()
  }
}

let onExternalChange: (() => void) | null = null
/** Run when another tab changed the data (used to refresh the lists). */
export function setExternalChangeHandler(handler: () => void): void {
  onExternalChange = handler
}

/* ------------------------------------------------------------ read / write */

export function dataGet(key: string): string | null {
  if (!db) return localStorage.getItem(key)
  return cache.get(key) ?? null
}

export function dataKeys(prefix: string): string[] {
  if (!db) return Object.keys(localStorage).filter((key) => key.startsWith(prefix))
  return [...cache.keys()].filter((key) => key.startsWith(prefix))
}

/** Store a value. Throws only in the localStorage fallback (quota); IndexedDB errors are reported. */
export function dataSet(key: string, value: string): void {
  if (!db) {
    localStorage.setItem(key, value)
    return
  }
  cache.set(key, value)
  write(key, value)
}

export function dataRemove(key: string): void {
  if (!db) {
    localStorage.removeItem(key)
    return
  }
  cache.delete(key)
  write(key, null)
}

function write(key: string, value: string | null) {
  if (!db) return
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    if (value === null) store.delete(key)
    else store.put(value, key)
    tx.onerror = () => reportError(tx.error)
    tx.onabort = () => reportError(tx.error)
  } catch (error) {
    reportError(error)
  }
  channel?.postMessage({ key, value })
}

/** True when data lives in IndexedDB (false: localStorage fallback). */
export const usesIndexedDb = () => db !== null
