const CACHE_NAME = 'precinto-digital-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json' // Añadido explícitamente a la memoria
];

// Instalar y guardar archivos esenciales en local
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cacheando archivos esenciales...');
      return cache.addAll(ASSETS);
    })
  );
});

// Limpiar cachés viejas
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

// Interceptar peticiones de forma segura
self.addEventListener('fetch', (event) => {
  // Pasamos olímpicamente de las llamadas a tu API de Render, se manejan en app.js
  if (event.request.url.includes('/api/db')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el archivo está guardado en el móvil, se sirve al instante
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Si no está, se busca en internet de forma normal
      return fetch(event.request).catch(() => {
        // CORRECCIÓN CRÍTICA: Devolvemos una respuesta de error HTTP limpia en lugar de "null"
        return new Response('Error de red fuera de cobertura', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});
