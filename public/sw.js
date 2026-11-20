// 서비스 워커: 경기 호출 알림을 받아 띄우고, 누르면 Live 화면을 연다.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'KRC 경기 호출', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'KRC 경기 호출', {
    body: d.body || '', tag: d.tag, renotify: true, requireInteraction: true,
    icon: '/icon-192.png', badge: '/icon-192.png', vibrate: [300, 100, 300, 100, 300], data: { url: d.url || '/live' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || '/live', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    const w = ws.find((x) => x.url.startsWith(self.location.origin));
    return w ? w.navigate(url).then((x) => (x || w).focus()) : self.clients.openWindow(url);
  }));
});
