const CACHE='arkguia-v2.7.1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./creatures.js','./services.js','./resource-data.js','./progress-migration.js','./firebase-sync.js','./app.js','./creature-images.js','./crafting-data.js','./crafting.js'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request);
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }catch(_){
      const cached=await caches.match(event.request);
      if(cached) return cached;
      if(event.request.mode==='navigate') return (await caches.match('./index.html'))||Response.error();
      return Response.error();
    }
  })());
});
