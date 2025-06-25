// Service Worker за напредно кеширање и offline функционалност
const CACHE_NAME = 'link-drvo-v1.2.0';
const STATIC_CACHE = 'link-drvo-static-v1.2.0';
const DYNAMIC_CACHE = 'link-drvo-dynamic-v1.2.0';

// Ресурси за кеширање
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/site.webmanifest'
];

// Инсталација Service Worker-а
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Кеширај статичке ресурсе
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Форсирај активацију новог SW
      self.skipWaiting()
    ])
  );
});

// Активација Service Worker-а
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Обриши старе кешове
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Преузми контролу над свим клијентима
      self.clients.claim()
    ])
  );
});

// Fetch event - Network First са Fallback стратегијом
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнориши non-GET захтеве
  if (request.method !== 'GET') return;

  // Игнориши external API позиве (favicon сервиси)
  if (url.origin !== location.origin && 
      !url.hostname.includes('google.com')) {
    return;
  }

  event.respondWith(
    // Network First стратегија за HTML
    request.destination === 'document' ? 
      networkFirstStrategy(request) :
    // Cache First за статичке ресурсе
    request.destination === 'style' || 
    request.destination === 'script' || 
    request.destination === 'image' ?
      cacheFirstStrategy(request) :
    // Network First за остало
      networkFirstStrategy(request)
  );
});

// Network First стратегија
async function networkFirstStrategy(request) {
  try {
    // Покушај мрежни захтев
    const networkResponse = await fetch(request);
    
    // Ако је успешан, кеширај и врати
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Ако мрежа није доступна, покушај кеш
    console.log('Service Worker: Network failed, trying cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ако ни кеш није доступан, врати offline страницу
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    throw error;
  }
}

// Cache First стратегија
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Ажурирај кеш у позадини
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  // Ако није у кешу, преузми са мреже
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch resource:', request.url);
    throw error;
  }
}

// Background Sync за синхронизацију података
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-links') {
    event.waitUntil(syncLinksData());
  }
  
  if (event.tag === 'sync-groups') {
    event.waitUntil(syncGroupsData());
  }
});

// Синхронизација линкова
async function syncLinksData() {
  try {
    console.log('Service Worker: Syncing links data...');
    
    // Пошаљи поруку главној апликацији да синхронизује податке
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_LINKS',
        timestamp: Date.now()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Links sync failed:', error);
    return Promise.reject(error);
  }
}

// Синхронизација група
async function syncGroupsData() {
  try {
    console.log('Service Worker: Syncing groups data...');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_GROUPS',
        timestamp: Date.now()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Groups sync failed:', error);
    return Promise.reject(error);
  }
}

// Push нотификације
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'Имате нове линкове за проверу!',
    icon: '/apple-touch-icon.png',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Отвори апликацију',
        icon: '/favicon.svg'
      },
      {
        action: 'dismiss',
        title: 'Одбаци',
        icon: '/favicon.svg'
      }
    ],
    requireInteraction: true,
    tag: 'link-reminder'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.log('Service Worker: Invalid push payload');
    }
  }

  event.waitUntil(
    self.registration.showNotification('Линк-Дрво', options)
  );
});

// Клик на нотификацију
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Отвори или фокусирај апликацију
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Ако је апликација већ отворена, фокусирај је
        for (const client of clientList) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Иначе отвори нову
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Периодична синхронизација (ако је подржана)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered:', event.tag);
  
  if (event.tag === 'daily-sync') {
    event.waitUntil(performDailySync());
  }
});

async function performDailySync() {
  try {
    console.log('Service Worker: Performing daily sync...');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'DAILY_SYNC',
        timestamp: Date.now()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Daily sync failed:', error);
    return Promise.reject(error);
  }
}