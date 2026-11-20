// 브라우저 쪽 호출 구독. 아이폰은 「홈 화면에 추가」한 앱에서만 웹 푸시가 된다 (iOS 16.4+).
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const KEY = 'krc-push-team';
export const pushTeam = () => { try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; } };

const b64 = (s: string) => {
  const raw = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export async function enablePush(team: number) {
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('알림이 허용되지 않았어요. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.');
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const { key } = await fetch('/api/push').then((r) => r.json());
  if (!key) throw new Error('호출 기능이 아직 설정되지 않았어요');
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }));
  const r = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team, sub }) });
  if (!r.ok) throw new Error('호출 등록에 실패했어요');
  try { localStorage.setItem(KEY, String(team)); } catch {}
}

export async function disablePush() {
  const sub = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
  if (sub) { await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
  try { localStorage.removeItem(KEY); } catch {}
}
