/**
 * « Something changed in the project index or the motif folders. » Every
 * write to them bumps this counter, so lists (motif library, manager) stay in
 * step with storage whatever wrote to it: autosave, restore, another dialog.
 */
let version = 0
const listeners = new Set<() => void>()

export function notifyStoreChange(): void {
  version++
  for (const listener of listeners) listener()
}

export function subscribeStore(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const storeVersion = () => version
