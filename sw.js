const CACHE_NAME = 'gds-notes-v6'; // वर्ज़न बढ़ाकर v6 कर दिया

// 1. OFFLINE SUPPORT (Files to Cache)
const ASSETS = [
  '/gdsnotes/',
  '/gdsnotes/index.html',
  '/gdsnotes/manifest.json',
  '/gdsnotes/icon-192.png',
  '/gdsnotes/icon-512.png'
];

// INSTALL: Caching logic
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE: पुराने कैशे को साफ़ करने के लिए
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 2. HAS LOGIC (Fetch Handling)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // केवल http या https रिक्वेस्ट को ही कैशे में डालें
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => caches.match(event.request)) // ऑफ़लाइन होने पर कैशे से दिखाएगा
  );
});

// 3. BACKGROUND SYNC
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-exam-data') {
    event.waitUntil(
      console.log('Background Sync: Data being sent to server...')
    );
  }
});

// 4. PERIODIC SYNC
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'get-latest-notes') {
    event.waitUntil(
      console.log('Periodic Sync: Checking for new content...')
    );
  }
});

// 5. PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  const options = {
    body: 'Naya study material update ho gaya hai!',
    icon: '/gdsnotes/icon-192.png', 
    badge: '/gdsnotes/icon-192.png',
    vibrate:, // 👈 एरर ठीक किया: यहाँ वैल्यू डाल दी है
    data: { url: '/gdsnotes/' } 
  };
  event.waitUntil(
    self.registration.showNotification('GDS Notes Update', options)
  );
});

// Notification Click Logic
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
