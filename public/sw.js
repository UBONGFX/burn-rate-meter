// Service worker: makes the app work offline after the first visit.
// Pages come from the network first (so new deployments show up right away),
// built files from the cache (their names change with every build).
const CACHE = 'burn-rate-meter'
const PAGE = './'
// On a slow connection, wait this long for a fresh page before using the cached one
const NETWORK_TIMEOUT = 3000

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])
}

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
    // Fresh page when the network is quick; the cached one when it's slow or offline.
    // Either way the cache is updated in the background for the next launch.
    const network = fetch(request).then((response) => ({ response, copy: response.clone() }))
    event.waitUntil(network.then(({ response, copy }) => response.ok && storePage(copy)).catch(() => {}))
    const fresh = network.then(({ response }) => response)
    event.respondWith(
      withTimeout(fresh, NETWORK_TIMEOUT).catch(async () => (await caches.match(PAGE, { ignoreVary: true })) ?? fresh),
    )
    return
  }

  // ignoreVary: scripts load with `crossorigin`, and a `Vary: Origin` header would
  // otherwise keep them from matching the copies cached at install time
  event.respondWith(caches.match(request, { ignoreVary: true }).then((cached) => cached ?? fetch(request)))
})
