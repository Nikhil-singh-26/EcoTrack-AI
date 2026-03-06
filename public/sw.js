const CACHE_NAME = 'ecotrack-ai-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.jpeg'
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker Installing");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error("Failed to cache static assets:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker Activating");
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-first strategy for static assets
  if (STATIC_CACHE_URLS.includes(url.pathname) || 
      url.pathname.startsWith('/icons/') ||
      request.destination === 'image' ||
      request.destination === 'script' ||
      request.destination === 'style') {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone response since it can only be consumed once
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Return cached version if network fails
              return caches.match(request);
            });
        })
    );
  }
});