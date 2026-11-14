/* RADIO REWARDS service worker — works on any GitHub Pages path (all URLs are relative to the SW scope). */
const VERSION = 'rr-v6';
const CORE = ['./', 'index.html', 'cashier.html', 'admin.html', 'rr.css', 'rr-config.js', 'rr-core.js', 'rr-qr.js', 'rr-customer.js', 'rr-cashier.js', 'rr-admin.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/logo.png'];
const CDN_OK = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('index.html')) || Response.error();
  }
}
async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // API calls (POST) are never cached
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') return e.respondWith(networkFirst(req));
    return e.respondWith(staleWhileRevalidate(req));
  }
  if (CDN_OK.includes(url.hostname)) return e.respondWith(staleWhileRevalidate(req));
  // everything else (e.g. Supabase) goes straight to the network
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'RADIO CAFÉ', {
    body: d.body || 'مستني إيه؟ كارتك مستنيك', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: d.url || './#card' }, tag: d.tag || 'rr-push',
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || './#card', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.focus(); if ('navigate' in c) c.navigate(target).catch(() => {}); return; } }
    return self.clients.openWindow(target);
  }));
});
