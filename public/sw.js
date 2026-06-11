
/**
 * Habitex Calcula Pro - Service Worker
 * Versión: 6.0
 * Funcionalidad offline completa y compatibilidad con PWABuilder
 */

const CACHE_NAME = 'habitex-calcula-v6.0';

const URLS_TO_PRECACHE = [
    './',
    'index.html',
    'manifest.json',
    'assets/icons/icon-192x192.png',
    'assets/icons/icon-512x512.png',
    'assets/icons/shortcut-icon-96x96.png'
];

// Orígenes de confianza para la caché (CDNs y dominio local)
const TRUSTED_DOMAINS = [
    'cdn.tailwindcss.com',
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'aistudiocdn.com',
    'esm.sh',
    location.hostname
];

// Evento de Instalación: Precargar los recursos primarios estáticos
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('SW: Precachando recursos principales...');
            // Usamos Promise.allSettled para asegurar que la instalación tenga éxito total
            // incluso si un recurso falla temporalmente en la red.
            return Promise.allSettled(
                URLS_TO_PRECACHE.map(url => {
                    return cache.add(url).catch(err => {
                        console.warn(`SW: No se pudo precachar de forma inmediata: ${url}`, err);
                    });
                })
            );
        })
    );
});

// Evento de Activación: Limpieza de cachés antiguas para que no ocupen espacio
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(name => {
                        if (name !== CACHE_NAME) {
                            console.log('SW: Borrando caché antigua:', name);
                            return caches.delete(name);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Intercepción de mensajes desde la UI
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Evento de Fetch: Servir desde caché o red según el recurso
self.addEventListener('fetch', event => {
    // Solo manejamos peticiones GET
    if (event.request.method !== 'GET') return;
    
    // Evitamos extensiones de navegador
    if (event.request.url.startsWith('chrome-extension://')) return;

    const url = new URL(event.request.url);
    const isDomainTrusted = TRUSTED_DOMAINS.some(domain => url.hostname.includes(domain));
    if (!isDomainTrusted) return;

    // Estrategia de caché:
    const isNavigation = event.request.mode === 'navigate';
    const isStaticAsset = url.pathname.includes('/assets/') || url.pathname.includes('/icons/') || url.hostname !== location.hostname;

    if (isNavigation || url.pathname.endsWith('manifest.json')) {
        // --- Network-First con fallback a caché (muy útil para index.html o manifest.json cambiantes) ---
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then(cachedResponse => {
                        if (cachedResponse) return cachedResponse;
                        // Fallback absoluto para SPA offline
                        return caches.match('./index.html') || caches.match('./') || caches.match('index.html');
                    });
                })
        );
    } else {
        // --- Cache-First con actualización silenciosa de fondo (ideal para JS dinámico y CDNs estáticos) ---
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    // Seguimos refrescando en segundo plano para cachear nuevas actualizaciones
                    fetch(event.request).then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse);
                            });
                        }
                    }).catch(() => {/* Silenciar caídas de red de background o modo offline */});

                    return cachedResponse;
                }

                // Si no está registrado en la caché, hacemos el fetch de red
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
        );
    }
});
