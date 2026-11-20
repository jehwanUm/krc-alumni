// 테스트 호출 보내기: node --env-file=.env scripts/test-push.mjs <팀번호>
// 그 팀으로 호출을 켜 둔 휴대폰에 알림을 보낸다 (저장소는 .env의 Supabase).
import webpush from 'web-push';

const team = Number(process.argv[2]);
if (!Number.isInteger(team) || team <= 0) { console.error('사용법: node --env-file=.env scripts/test-push.mjs <팀번호>'); process.exit(1); }
const url = process.env.SUPABASE_URL.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
const rows = await fetch(`${url}/rest/v1/push_subs?team=eq.${team}&select=endpoint,sub`, { headers: { apikey: key, ...(key.startsWith('eyJ') && { Authorization: `Bearer ${key}` }) } }).then((r) => r.json());
console.log(`${team}팀 호출을 켠 휴대폰: ${rows.length}대`);
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:krc-alumni@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
for (const r of rows) {
  const host = new URL(r.endpoint).host;
  try {
    await webpush.sendNotification(r.sub, JSON.stringify({ title: '[테스트] 경기 호출', body: `${team}팀 휴대폰으로 호출이 잘 와요. 대회 날엔 이렇게 알려 드려요.`, url: `/live?team=${team}`, tag: 'test' }), { TTL: 600, urgency: 'high' });
    console.log('보냄 →', host);
  } catch (e) { console.log('실패 →', host, e.statusCode, String(e.body || e.message).slice(0, 120)); }
}
