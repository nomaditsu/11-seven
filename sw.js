// Service worker: keeps a copy of the game on the device so it plays offline after one visit.
// scripts/build.mjs writes this file to sw.js with the cache version and file list filled in. Never edit sw.js by hand.
// Cache first: a launch always gets the saved copy at once. The browser checks sw.js for changes in the background;
// a new build installs a new cache and drops the old one, so an update shows on the launch after it downloads.
const CACHE = '11seven-896709d238ba';
const FILES = ["index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('11seven-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Every page in scope is the game, whatever its query (?lang=th, ?q=low).
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(CACHE).then((c) => c.match(key, { ignoreSearch: true })).then((hit) => hit || fetch(req)));
});
