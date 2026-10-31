// Pensell: بيخلّي التطبيق يفتح على طول من الموبايل، ويجيب التحديثات في الخلفية.
const CACHE='pensell-v5';
const CORE=['/app.html','/logo-l.png','/logo-d.png','/icon-192.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const notify=()=>self.clients.matchAll({type:'window'}).then(cs=>cs.forEach(c=>c.postMessage({type:'update'})));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  // مكتبات Firebase والخطوط: نسخ ثابتة، بتتحمّل مرة واحدة وتتحفظ
  if(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/')||u.hostname==='fonts.gstatic.com'||u.hostname==='fonts.googleapis.com'||u.hostname==='cdnjs.cloudflare.com'){
    e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{c.put(r,res.clone());return res}))));return}
  if(u.origin!==location.origin)return;
  // صفحة التطبيق: بتفتح من النسخة المحفوظة على طول، وبتشوف لو فيه تحديث في الخلفية
  if(u.pathname==='/app.html'||(r.mode==='navigate'&&u.pathname==='/app.html')){
    e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match('/app.html');const oldP=hit?hit.clone().text():Promise.resolve('');
      const net=fetch('/app.html',{cache:'no-cache'}).then(async res=>{if(res.ok){const old=await oldP;const nw=await res.clone().text();await c.put('/app.html',res.clone());if(hit&&old!==nw)notify()}return res}).catch(()=>hit);
      if(hit){e.waitUntil(net);return hit}return net}));return}
  if(/\.(png|webmanifest)$/.test(u.pathname)){e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res});return hit||net})));return}
});
// ---------- الإشعارات ----------
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){d={title:'Pensell',body:e.data?e.data.text():''}}
  const call=d.kind==='call'||d.kind==='alarm',opt={body:d.body||'',tag:d.tag||'pensell',renotify:true,icon:'/icon-192.png',badge:'/icon-192.png',data:{url:d.url||'/app.html'},
    vibrate:call?[1000,400,1000,400,1000,400,1000,400,1000,400,1000]:[250,100,250,100,500],requireInteraction:call,silent:false};
  if(d.kind==='call')opt.actions=[{action:'join',title:'انضم'}];
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    // لو التطبيق مفتوح قدامه، هو اللي بيرن ويعرض التنبيه بنفسه
    if(d.kind==='alarm')cs.forEach(c=>c.postMessage({type:'alarm',title:d.title,body:d.body}));
    if(d.kind!=='alarm'&&cs.some(c=>c.visibilityState==='visible'&&new URL(c.url).pathname==='/app.html'))return;
    return self.registration.showNotification(d.title||'Pensell',opt)}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=e.notification.data?.url||'/app.html';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{const c=cs.find(x=>new URL(x.url).pathname==='/app.html');
    if(c){c.postMessage({type:'open',url});return c.focus()}return self.clients.openWindow(url)}))});
