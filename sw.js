const CACHE='arkguia-v2.2.0';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./creatures.js','./services.js','./progress-migration.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
async function injectProgress(r){
  if(!r)return r;
  const type=r.headers.get('content-type')||'';
  if(!type.includes('text/html'))return r;
  let html=await r.text();
  if(!html.includes('progress-migration.js')) html=html.replace('<script src="services.js"></script>','<script src="services.js"></script><script src="progress-migration.js"></script>');
  const h=new Headers(r.headers);h.delete('content-length');
  return new Response(html,{status:r.status,statusText:r.statusText,headers:h});
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith((async()=>{
    try{
      const net=await fetch(e.request);
      const out=e.request.mode==='navigate'?await injectProgress(net):net;
      const copy=out.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return out;
    }catch(err){
      let cached=await caches.match(e.request)||await caches.match('./index.html');
      return e.request.mode==='navigate'?await injectProgress(cached):cached;
    }
  })());
});