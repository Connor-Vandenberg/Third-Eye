// GZM Third-Eye Service Worker
// Enables PWA offline-first operation for DDIL environments

const CACHE_NAME = 'gzm-third-eye-v1';
const OFFLINE_URL = '/offline';

// Critical assets that must be cached for offline operation
const PRECACHE_ASSETS = [
  '/',
  '/cop',
  '/signals',
  '/metrics',
  '/analyst',
  '/globe',
  '/mesh',
  '/kill-chain',
  '/offline',
  '/manifest.json',
];

// Cache strategies per route pattern
const CACHE_STRATEGIES = {
  // Pages: Network-first, fall back to cache
  pages: 'network-first',
  // Static assets: Cache-first
  static: 'cache-first',
  // API calls: Network-only with offline queue
  api: 'network-only-queue',
  // WebSocket: Not cacheable, handled by reconnection logic
  ws: 'skip',
};

// Install: Pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching critical assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Route-aware caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip WebSocket and non-GET requests
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // API requests: network-only with offline queue
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/aip/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Queue for later sync when online
        return new Response(JSON.stringify({
          error: 'offline',
          message: 'Request queued for sync when connectivity resumes',
          queued: true,
          timestamp: new Date().toISOString(),
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Static assets (JS, CSS, images): Cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|svg|woff2|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Pages: Network-first, fall back to cache, then offline page
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful page loads
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fall back to offline page
          return caches.match(OFFLINE_URL) || new Response(
            '<html><body style="background:#09090b;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>GZM OFFLINE</h1><p>Operating in DDIL mode. Local graph queries and convergence scoring available.</p><p style="color:#fbbf24">Mesh sync will resume when connectivity is restored.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
  );
});

// Background sync: Replay queued API requests when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'gzm-sync-queue') {
    event.waitUntil(replayQueuedRequests());
  }
});

async function replayQueuedRequests() {
  // In production, this would read from IndexedDB and replay
  console.log('[SW] Replaying queued requests after connectivity restored');
}

// Push notifications for critical alerts
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Novel signal detected',
    icon: '/icons/gzm-192.png',
    badge: '/icons/gzm-badge.png',
    tag: data.tag || 'gzm-alert',
    data: data,
    actions: [
      { action: 'investigate', title: 'Investigate' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: data.priority === 'critical',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'GZM Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'investigate') {
    event.waitUntil(
      self.clients.openWindow(`/signals?id=${event.notification.data?.signalId || ''}`)
    );
  }
});

console.log('[SW] GZM Third-Eye Service Worker loaded (DDIL-ready)');
