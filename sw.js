"use strict";
/* HZ MC cache. Bump VERSION whenever you replace classes.js or assets.epk. */
var VERSION = "hzmc-v1";
var BIG = /\/(classes\.js|assets\.epk)$|\/lang\//;

self.addEventListener("install", function () { self.skipWaiting(); });

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VERSION; })
                               .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  var url = new URL(req.url);
  if (url.origin !== location.origin || !BIG.test(url.pathname)) return; // HTML etc. go straight to the network

  e.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(req).then(function (hit) {
        if (hit) return hit; // cache-first: no network at all
        return fetch(req).then(function (res) {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        });
      });
    })
  );
});
