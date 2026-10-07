'use strict';
// Service worker: caches the whole game so it plays offline after the first visit.
// Bump VERSION whenever any file below changes, so players get the update.
// For a release, also update the version and date shown on the map screen (index.html, .version).

const VERSION = 'bugame-v24';
const FILES = [
  './',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'js/sprites.js', 'js/art.js', 'js/art-bugs.js',
  'js/engine.js',
  'js/tank.js', 'js/tools.js',
  'js/secrets.js',
  'js/missions.js', 'js/missions2.js', 'js/flight.js', 'js/garden.js', 'js/web.js', 'js/dig.js', 'vendor/three.min.js',
  'js/ui.js', 'js/night.js', 'js/tree.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first, then network. New files fetched online are added to the cache.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    })
  );
});
