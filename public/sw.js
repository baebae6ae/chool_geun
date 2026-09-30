// 오프라인 지원용 서비스워커.
//  - 설치할 때 앱 껍데기(페이지 + 빌드 파일)를 미리 받아 둔다 → 설치 직후 오프라인이어도 열린다
//  - 해시가 붙은 빌드 파일(assets/)은 캐시 우선, 페이지·아이콘·manifest는 네트워크 우선(업데이트가 바로 반영)
const CACHE = 'hamster-worklog-v3';

/** 쿼리(?t= 등)를 뗀 주소로 통일해서 저장/조회한다 */
const keyOf = (url) => {
  const u = new URL(url);
  u.search = '';
  return u.href;
};

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const res = await fetch('./', { cache: 'reload' });
      const html = await res.clone().text();
      await cache.put(keyOf(new URL('./', self.location).href), res);
      const urls = new Set(['./manifest.webmanifest', './icon-192.png', './icon-512.png', './icon.svg']);
      for (const m of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g)) urls.add(m[1]);
      await Promise.all([...urls].map((u) => cache.add(u).catch(() => {})));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  if (!new URL(req.url).pathname.includes('/assets/')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(keyOf(req.url), copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(keyOf(req.url))
            .then((r) => r || (req.mode === 'navigate' ? caches.match(keyOf(new URL('./', self.location).href)) : Response.error())),
        ),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => (list[0] ? list[0].focus() : self.clients.openWindow('./'))),
  );
});
