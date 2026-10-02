/* Service worker Dompet Kampus: agar aplikasi tetap terbuka saat offline.
   Strategi "network-first": selalu ambil versi terbaru dari internet,
   dan pakai salinan tersimpan hanya jika internet mati. Jadi update dari
   GitHub/Vercel tetap langsung terlihat. */
const CACHE = "dompet-kampus-v1";
const CORE = ["./", "index.html", "style.css", "script.js", "sfx.js", "intro.js", "pet.js",
  "site.webmanifest", "favicon.ico", "img/favicon.svg", "img/apple-touch-icon.png",
  "img/icon-192.png", "img/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {})))) // satu file hilang tidak menggagalkan semuanya
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
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === "opaque") { // termasuk Google Fonts
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});