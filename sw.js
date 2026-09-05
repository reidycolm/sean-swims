const CACHE_NAME = 'tarbert-swim-v8';
const APP_ROOT = new URL('./', self.location.href);
const OFFLINE_ASSETS = [
    './', 'index.html', 'style.css?v=17', 'script.js?v=11',
    'data/tides-2026.js?v=1', 'tides.js?v=1', 'tide-ui.js?v=3',
    'logo_v2.png', 'coast_bg.png', 'manifest.json',
    'icons/icon-192.png', 'icons/icon-512.png'
].map(path => new URL(path, APP_ROOT).href);

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS))
        .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key.startsWith('tarbert-swim-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
});

// Cache only this static app. External weather/marine APIs and CDNs stay live.
// Relative URLs support /sean-swims/ on Pages and a local server's root.
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== APP_ROOT.origin ||
        !url.pathname.startsWith(APP_ROOT.pathname)) return;
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
            const response = await fetch(event.request);
            if (response.ok) await cache.put(event.request, response.clone());
            return response;
        } catch {
            const cached = await cache.match(event.request);
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
                const index = await cache.match(new URL('index.html', APP_ROOT).href);
                if (index) return index;
            }
            return Response.error();
        }
    })());
});
