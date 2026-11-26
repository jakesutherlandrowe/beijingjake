// Keeps the site working offline. Network first, so updates show straight away.
// Bump CACHE when you change what's in ASSETS.
const CACHE = "bj-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./drill/",
  "./drill/index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

// Cache each asset on its own: one missing file no longer breaks the whole install.
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((url) => c.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((hit) => {
          if (hit) return hit;
          // Offline and not cached: send page requests to the nearest shell.
          if (e.request.mode === "navigate") {
            return caches.match(url.pathname.includes("/drill") ? "./drill/index.html" : "./index.html");
          }
          return Response.error();
        })
      )
  );
});
