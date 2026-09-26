// Service worker: makes the app work offline after the first visit.
// Pages come from the network first (so new deployments show up right away),
// built files from the cache (their names change with every build).
const CACHE = 'burn-rate-meter'
const PAGE = './'

/** Same-origin files referenced by the page: scripts, styles, icons, manifest. */
function filesIn(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], self.registration.scope).href)
    .filter((url) => url.startsWith(self.location.origin))
}

/** Caches a page and its files, and forgets files the page no longer uses. */
async function storePage(response) {
  const cache = await caches.open(CACHE)
  const html = await response.clone().text()
  const files = filesIn(html)
  await cache.put(PAGE, response)
  await cache.addAll(files.filter((url) => !url.endsWith('/sw.js')))
  const pageUrl = new URL(PAGE, self.registration.scope).href
  for (const request of await cache.keys()) {
    if (request.url !== pageUrl && !files.includes(request.url)) await cache.delete(request)
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(fetch(PAGE, { cache: 'no-cache' }).then(storePage))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) event.waitUntil(storePage(response.clone()))
          return response
        })
        .catch(() => caches.match(PAGE, { ignoreVary: true })),
    )
    return
  }

  // ignoreVary: scripts load with `crossorigin`, and a `Vary: Origin` header would
  // otherwise keep them from matching the copies cached at install time
  event.respondWith(caches.match(request, { ignoreVary: true }).then((cached) => cached ?? fetch(request)))
})
