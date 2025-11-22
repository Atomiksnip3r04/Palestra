const CACHE_NAME = 'ironflow-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './user.html',
  './analysis.html',
  './diary.html',
  './body.html',
  './creator.html',
  './css/style.css',
  './js/main.js',
  './js/auth-service.js',
  './js/firestore-service.js',
  './js/exercise-db.js',
  './js/notification-manager.js',
  './assets/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force new SW to take control immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all clients immediately
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
