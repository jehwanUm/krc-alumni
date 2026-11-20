// 리허설 기록(호출·도착 체크) 지우기: node --env-file=.env scripts/reset-rehearsal.mjs [대회=2025/KRCMP]
// 같은 호출은 한 번만 가므로, 리허설을 다시 하거나 실제 대회 전에 지운다. 호출 구독(휴대폰)은 남긴다.
const event = process.argv[2] ?? '2025/KRCMP';
const url = process.env.SUPABASE_URL.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
const h = { apikey: key, ...(key.startsWith('eyJ') && { Authorization: `Bearer ${key}` }), Prefer: 'return=representation' };
for (const t of ['push_log', 'arrivals']) {
  const r = await fetch(`${url}/rest/v1/${t}?event=eq.${encodeURIComponent(event)}`, { method: 'DELETE', headers: h });
  console.log(t, r.ok ? `${(await r.json()).length}건 지움` : `실패 ${r.status}`);
}
