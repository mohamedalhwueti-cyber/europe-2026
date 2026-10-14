'use strict';
const CACHE='europe26-app-shell-v5-0-20261014';
const SHELL=['./','./index.html','./style.css','./app.js','./archive-import.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];const SHELL_PATHS=new Set(SHELL.map(p=>new URL(p,self.registration.scope).pathname));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('europe26-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!SHELL_PATHS.has(u.pathname))return;e.respondWith(caches.open(CACHE).then(cache=>cache.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{if(res.ok)cache.put(e.request,res.clone());return res;}))))});
