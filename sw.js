// Pensell: خدمة بسيطة علشان الموبايل يعرض «تثبيت التطبيق».
// بتجيب أحدث نسخة من النت دايماً، ولو مفيش نت بتفتح آخر نسخة اتحفظت من التطبيق.
const CACHE='pensell-v1';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/app.html','/icon-192.png'])).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin!==location.origin)return; // Firebase وجوجل مالناش دعوة بيهم
  e.respondWith(fetch(r).then(res=>{if(u.pathname==='/app.html'){const cp=res.clone();caches.open(CACHE).then(c=>c.put('/app.html',cp))}return res}).catch(()=>caches.match(u.pathname==='/'?'/app.html':u.pathname)));
});
