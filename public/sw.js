// Service Worker for Pitch Cicero
// Caches static assets for improved repeat visit performance

const CACHE_NAME = 'pitch-cicero-v1';
const STATIC_CACHE_NAME = 'pitch-cicero-static-v1';
const FONT_CACHE_NAME = 'pitch-cicero-fonts-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old cache versions
            return name.startsWith('pitch-cicero-') && 
                   name !== CACHE_NAME && 
                   name !== STATIC_CACHE_NAME && 
                   name !== FONT_CACHE_NAME;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls and analytics
  if (url.pathname.startsWith('/api') || 
      url.hostname.includes('supabase') ||
      url.hostname.includes('posthog')) {
    return;
  }

  // Font caching - cache first, long TTL
  if (url.pathname.includes('/fonts/') || 
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'cdn.gpteng.co') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Static assets (JS, CSS, images) - cache first with network fallback
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return offline fallback if available
            return cachedResponse;
          });
        });
      })
    );
    return;
  }

  // HTML pages - network first with cache fallback (stale-while-revalidate)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            return cache.match(request).then((cachedResponse) => {
              return cachedResponse || cache.match('/');
            });
          });
      })
    );
    return;
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
