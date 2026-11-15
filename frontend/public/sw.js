/**
 * @file sw.js
 * @description Service Worker para PWA con soporte Offline limitado y seguro.
 * Implementa:
 * - Cache-First para el App Shell (HTML, CSS, JS, Iconos).
 * - Network-First con fallback a caché para endpoints de la API (/api/items).
 * - Protección ante mutaciones offline (POST, PUT, DELETE) devolviendo respuestas informativas.
 */

const CACHE_NAME = 'inventario-pwa-v1';
const API_CACHE_NAME = 'inventario-api-v1';

// Recursos esenciales del App Shell a pre-cachear durante la instalación
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Evento Install: Pre-cacheo del App Shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando y almacenando App Shell en caché...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[Service Worker] Advertencia al pre-cachear algunos recursos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Evento Activate: Limpieza de versiones obsoletas de caché
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activado. Limpiando cachés antiguas...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== API_CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché obsoleta:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento Fetch: Estrategias de Caché diferenciadas
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Peticiones a la API (/api/items): Estrategia NETWORK-FIRST con Fallback a Caché
  if (url.pathname.startsWith('/api/items')) {
    // Si es una mutación (POST, PUT, DELETE)
    if (request.method !== 'GET') {
      // Las mutaciones se envían a la red; si no hay red, fallan de forma segura
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(
            JSON.stringify({
              estado: 'error',
              status: 'error',
              codigo: 503,
              mensaje: 'Operación deshabilitada en modo offline. Conéctese a internet para modificar el inventario.',
              detalles: ['La base de datos SQLite requiere conectividad con el servidor para garantizar consistencia.']
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
      return;
    }

    // Peticiones GET de la API: Network-First con fallback a última respuesta en caché
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[Service Worker] Red no disponible. Recuperando datos de la API desde caché:', request.url);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({
              estado: 'error',
              status: 'error',
              codigo: 503,
              mensaje: 'Sin conexión de red y sin datos previamente almacenados en caché para este recurso.',
              detalles: ['Verifique su conexión e intente nuevamente.']
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // 2. Recursos Estáticos y Navegación SPA: Estrategia CACHE-FIRST con Fallback a Red
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        // Cachear dinámicamente scripts, estilos e imágenes cargados
        if (
          networkResponse.ok &&
          (request.destination === 'style' ||
           request.destination === 'script' ||
           request.destination === 'image' ||
           request.destination === 'font')
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback de navegación para SPA (redirigir al App Shell index.html)
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

