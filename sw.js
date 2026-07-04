/* ΠΡΟΜΗΘΕΑΣ AI — service worker: app-shell cache για offline άνοιγμα */
const CACHE = 'promitheas-v26';
const SHELL = [
  './', './index.html', './styles.css?v=9', './fire_model.js?v=1', './app.js?v=15', './manifest.webmanifest', './icon.svg',
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
  // Ζωντανά δεδομένα (καιρός, εστίες, χάρτες) → πάντα δίκτυο
  if(/open-meteo|firms|effis|basemaps|tile\.openstreetmap/.test(u.hostname)) return;
  // Network-first: πάντα φρέσκο περιεχόμενο όταν υπάρχει δίκτυο, cache fallback offline
  e.respondWith(
    fetch(e.request).then(resp=>{
      const cp = resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request, cp)).catch(()=>{});
      return resp;
    }).catch(()=>caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
