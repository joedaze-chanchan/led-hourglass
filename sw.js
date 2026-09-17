// 오프라인 실행용 서비스워커.
// 껍데기 파일 몇 개뿐이라 설치할 때 통째로 담아두고, 그 뒤로는 캐시에서 먼저 준다.
'use strict';

var 캐시이름 = 'led-모래시계-v1';
var 담을것 = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(캐시이름)
      .then(function (c) { return c.addAll(담을것); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  // 옛 버전 캐시는 지운다.
  e.waitUntil(
    caches.keys().then(function (키들) {
      return Promise.all(키들.map(function (k) {
        return k === 캐시이름 ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }
  e.respondWith(
    caches.match(e.request).then(function (맞음) {
      if (맞음) { return 맞음; }
      return fetch(e.request).then(function (답) {
        // 같은 출처의 것만 캐시에 더한다 (글꼴 등 외부는 그냥 통과).
        if (답 && 답.status === 200 && 답.type === 'basic') {
          var 사본 = 답.clone();
          caches.open(캐시이름).then(function (c) { c.put(e.request, 사본); });
        }
        return 답;
      }).catch(function () {
        // 오프라인이고 캐시에도 없으면 첫 화면이라도 준다.
        return caches.match('./index.html');
      });
    })
  );
});
