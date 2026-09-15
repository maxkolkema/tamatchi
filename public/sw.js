const CACHE = "tamatchi-v2";
const CORE = ["/", "/manifest.webmanifest", "/icon.svg", "/animations/idle_blink.gif"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE))));
self.addEventListener("fetch", (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }))));
