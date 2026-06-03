/* ΠΡΟΜΗΘΕΑΣ AI — service worker: app-shell cache για offline άνοιγμα */
const CACHE = 'promitheas-v3';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const u = new URL(e.request.url);
  // Ζωντανά δεδομένα (καιρός, εστίες, χάρτες) → πάντα δίκτυο, να είναι φρέσκα
  if(/open-meteo|firms|effis|basemaps|tile\.openstreetmap/.test(u.hostname)) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp=>{
      const cp = resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request, cp)).catch(()=>{});
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
