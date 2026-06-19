// Hisaab Kitaab service worker — offline app shell
const CACHE = "hisaab-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // never cache the Apps Script API calls
  if(url.hostname.includes("script.google")) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp=>{
      if(e.request.method==="GET" && resp.ok){
        const copy = resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy));
      }
      return resp;
    }).catch(()=>caches.match("./index.html")))
  );
});
