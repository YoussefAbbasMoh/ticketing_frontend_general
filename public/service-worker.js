// Service Worker for ABSAI Ticket Management System
// This keeps the app running in the background and handles notifications

// Bump version when changing caching rules so old caches are deleted on activate
const CACHE_NAME = 'absai-tms-v4';
const RUNTIME_CACHE = 'absai-runtime-v4';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/notification-sound.mp3',
  '/logo4.webp',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      // Clear any cached images/API calls from runtime cache
      return caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys
              .filter((request) => {
                const url = new URL(request.url);
                // Remove any cached images, uploads, or API calls
                return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
                       url.pathname.startsWith('/uploads/') ||
                       url.pathname.startsWith('/back/uploads/') ||
                       url.pathname.startsWith('/api/') ||
                       url.pathname.startsWith('/back/api/');
              })
              .map((request) => {
                console.log('[Service Worker] Removing cached image/API:', request.url);
                return cache.delete(request);
              })
          );
        });
      });
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const path = url.pathname;

  // Do not intercept — browser goes to network. Fixes Next.js on :3000, Vite dev HMR, etc.
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/@') ||
    path.startsWith('/src/') ||
    path.includes('node_modules') ||
    path.endsWith('.tsx') ||
    path.endsWith('.ts') ||
    (path.endsWith('.jsx') && path.startsWith('/src'))
  ) {
    return;
  }
  
  // NEVER cache images, uploads, or API calls - always fetch fresh
  const shouldNotCache = 
    // Image files
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
    // Upload directories
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/back/uploads/') ||
    // API endpoints
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/back/api/') ||
    // Socket.io
    url.pathname.startsWith('/socket.io/');

  // For images, uploads, and API calls - always fetch from network, never cache
  if (shouldNotCache) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // If network fails, return a placeholder or error
          return new Response('Network error', { status: 408 });
        })
    );
    return;
  }

  // Network-first for HTML + hashed JS/CSS (CRA / Vite). Cache-first here kept users on OLD bundles forever.
  const isAppShellOrBundle =
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.startsWith('/assets/');

  if (isAppShellOrBundle) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const poweredBy = response.headers.get('x-powered-by') || '';
          const isNext = poweredBy.toLowerCase().includes('next');
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic' &&
            !isNext
          ) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html').then(
                (page) => page || new Response('Offline', { status: 503 })
              );
            }
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // For other requests (manifest, precache assets not under /static/), use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // If cached, return it but also update in background
        if (cachedResponse) {
          // Update cache in background (stale-while-revalidate)
          fetch(event.request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }).catch(() => {
            // Ignore network errors for background updates
          });
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request).then((response) => {
          // Only cache successful responses for static assets
          if (response && response.status === 200 && response.type === 'basic') {
            // Only cache HTML, CSS, JS, and manifest files
            const shouldCache = 
              url.pathname.endsWith('.html') ||
              url.pathname.endsWith('.css') ||
              url.pathname.endsWith('.js') ||
              url.pathname.endsWith('.json') ||
              url.pathname === '/' ||
              url.pathname === '/manifest.json';

            if (shouldCache) {
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }

          return response;
        });
      })
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html').then(
            (page) => page || new Response('Offline', { status: 503 })
          );
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

// Background sync for offline support (optional)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Push notification event - handle push notifications from server
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  let notificationData = {
    title: 'ABSAI TMS',
    body: 'You have a new notification',
    icon: '/logo4.webp',
    badge: '/logo4.webp',
    tag: 'absai-notification',
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        tag: data.tag || notificationData.tag,
        data: data.data || {}
      };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event - handle when user clicks on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let urlToOpen = '/';

  // Determine URL based on notification type
  if (notificationData.type === 'new_ticket' || notificationData.type === 'ticket_reply') {
    urlToOpen = notificationData.ticketId 
      ? `/ticket/${notificationData.ticketId}`
      : '/';
  } else if (notificationData.type === 'new_chat_message') {
    urlToOpen = notificationData.conversationId
      ? `/chat?conversation=${notificationData.conversationId}`
      : '/chat';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }
});

// Helper function to sync notifications
async function syncNotifications() {
  // This can be used to sync notifications when coming back online
  console.log('[Service Worker] Syncing notifications...');
}

