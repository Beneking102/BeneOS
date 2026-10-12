"use strict";
/* Service Worker: Network-first für eigene Dateien (neue Deploys sind sofort sichtbar),
   mit Cache-Fallback für Offline-Betrieb. Fremde Hosts (GitHub-API) werden nicht angefasst. */
const CACHE = "beneos-v4";
const CORE = ["./", "index.html", "style.css", "os.js", "lab.js", "lab2.js", "login.js", "shell.js", "shell2.js", "apps1.js", "tools.js", "live.js", "wallpaper.js", "sounds.js", "repos-fallback.js", "manifest.webmanifest", "icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
