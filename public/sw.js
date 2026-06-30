
/**
 * Habitex Calcula Pro - Service Worker
 * Versión: 6.4
 * Funcionalidad offline completa y compatibilidad con PWABuilder
 */

const CACHE_NAME = 'habitex-calcula-v6.4';

const URLS_TO_PRECACHE = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/manifest.json',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/icons/shortcut-icon-96x96.png'
];

// Orígenes de confianza para la caché (CDNs y dominio local)
const TRUSTED_DOMAINS = [
    'cdn.tailwindcss.com',
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'aistudiocdn.com',
    'esm.sh',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
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
    
    // Todo lo que sea del propio origen se procesa siempre.
    // Para orígenes externos (CDNs o fuentes), verificamos si está en dominios de confianza.
    const isSameOrigin = url.origin === location.origin;
    const isCDNDomain = TRUSTED_DOMAINS.some(domain => url.hostname.includes(domain));
    if (!isSameOrigin && !isCDNDomain) return;

    // Estrategia de caché:
    // Considerar navegación real, peticiones directas de root del mismo origen, o archivos de código fuente local (.tsx, .ts, .js, .css) para Network-First
    const isCodeFile = isSameOrigin && (
        url.pathname.endsWith('.tsx') || 
        url.pathname.endsWith('.ts') || 
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.json')
    );
    const isNavigation = event.request.mode === 'navigate' || 
                         (isSameOrigin && (url.pathname === '/' || url.pathname === '/index.html')) ||
                         isCodeFile;

    // Función auxiliar para determinar si la respuesta es válida para cachear.
    // Guardamos respuestas exitosas (status 200) y de orígenes cruzados opacos (status 0).
    const isCacheable = (res) => {
        return res && (res.status === 200 || res.status === 0);
    };

    if (isNavigation || url.pathname.endsWith('manifest.json') || url.pathname.endsWith('manifest.webmanifest')) {
        // --- Network-First con fallback a caché (muy útil para index.html o manifest.json cambiantes) ---
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (isCacheable(networkResponse)) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Usamos { ignoreSearch: true } para que parámetros de testing o trackers (like ?utm_source) no rompan la búsqueda en la caché
                    return caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
                        if (cachedResponse) return cachedResponse;
                        // Fallback absoluto para SPA offline
                        return caches.match('index.html', { ignoreSearch: true })
                            .then(r => r || caches.match('./', { ignoreSearch: true }))
                            .then(r => r || caches.match('/index.html', { ignoreSearch: true }))
                            .then(r => r || caches.match('/', { ignoreSearch: true }));
                    });
                })
        );
    } else {
        // --- Cache-First con actualización silenciosa de fondo (ideal para JS dinámico y CDNs estáticos) ---
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
                if (cachedResponse) {
                    // Seguimos refrescando en segundo plano para cachear nuevas actualizaciones
                    fetch(event.request).then(networkResponse => {
                        if (isCacheable(networkResponse)) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse.clone());
                            });
                        }
                    }).catch(() => {/* Silenciar caídas de red de background o modo offline */});

                    return cachedResponse;
                }

                // Si no está registrado en la caché, hacemos el fetch de red
                return fetch(event.request).then(networkResponse => {
                    if (isCacheable(networkResponse)) {
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
