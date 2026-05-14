const CACHE_NAME = "gds-cache-v1";

const urlsToCache = [
  "/gdsnotes/",
  "/gdsnotes/index.html",
  "/gdsnotes/manifest.json",
  "/gdsnotes/icon-192.png",
  "/gdsnotes/icon-512.png",
  "/gdsnotes/RSH.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );

  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((response) => {

      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((networkResponse) => {

          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });

        })
        .catch(() => {
          return caches.match("/index.html");
        });

    })
  );

});
