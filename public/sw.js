// Service Worker for Babylon Multiplayer Game PWA
const CACHE_NAME = 'babylon-game-v1';
const STATIC_CACHE = 'babylon-static-v1';
const DYNAMIC_CACHE = 'babylon-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icons/sigma-logo-64.png',
  '/icons/sigma-logo-192.png',
  '/icons/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
        // Continue with installation even if some files fail to cache
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first, then cache
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    // Static assets - cache first, then network
    event.respondWith(cacheFirst(request));
  } else {
    // HTML pages - network first, then cache
    event.respondWith(networkFirst(request));
  }
});

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    
    // For API requests, return a basic response instead of throwing
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache and network failed', error);
    throw error;
  }
}

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New game update available!',
    icon: '/icons/sigma-logo-192.png',
    badge: '/icons/sigma-logo-64.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Join Game',
        icon: '/icons/sigma-logo-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/sigma-logo-64.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Babylon Multiplayer Game', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'join') {
    event.waitUntil(
      clients.openWindow('/?action=join')
    );
  } else if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/?action=join')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event);
  
  if (event.tag === 'game-sync') {
    event.waitUntil(syncGameData());
  }
});

// Sync game data when back online
async function syncGameData() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, action.options);
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync action', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingActions() {
  // Implementation would use IndexedDB to get pending actions
  return [];
}

async function removePendingAction(id) {
  // Implementation would use IndexedDB to remove completed action
  console.log('Service Worker: Removed pending action', id);
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
