const CACHE_NAME = 'precinto-digital-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js'
];

// Instalar el Service Worker y guardar los archivos esenciales en la memoria del móvil
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cacheando archivos de la app...');
      return cache.addAll(ASSETS);
    })
  );
});

// Activar y limpiar cachés antiguas si las hubiera
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Interceptar las peticiones: si no hay cobertura, sirve los archivos guardados en local
self.addEventListener('fetch', (event) => {
  // Ignoramos las peticiones a la base de datos (Render/Supabase), esas se gestionan en app.js
  if (event.request.url.includes('/api/db')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el archivo está en la caché del móvil, lo devuelve de inmediato (vuela)
      if (cachedResponse) {
        return cachedResponse;
      }
      // Si no, intenta buscarlo en internet de forma normal
      return fetch(event.request).catch(() => {
        // Si falla internet y no está en caché (por ejemplo una imagen externa), da error limpio
        return null;
      });
    })
  );
});
