// Offline support, kept minimal on purpose.
// - Pages (navigations): network first, so a new version shows up as soon as
//   it is online; the cached copy is the offline fallback.
// - Other same-origin files (hashed JS/CSS, icons): served from the cache and
//   refreshed in the background.
// Cross-origin requests (Google Fonts…) are left to the browser.
const CACHE = 'stitchnook-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((hit) => hit ?? caches.match('./'))),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request)
      const refresh = fetch(request)
        .then((response) => {
          if (response.ok) void cache.put(request, response.clone())
          return response
        })
        .catch(() => hit ?? Response.error())
      return hit ?? refresh
    }),
  )
})
