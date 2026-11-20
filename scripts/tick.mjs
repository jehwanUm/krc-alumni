// 자동 호출을 30초마다 실행한다. 대회장 노트북 예비용·리허설용.
//   node scripts/tick.mjs                                   → http://localhost:3000, 실제 시각
//   node scripts/tick.mjs --url https://사이트주소            → 배포된 사이트 (cron-job.org가 멈췄을 때 예비)
//   node scripts/tick.mjs --replay 2026-01-31T11:00          → 지난 대회를 그 시각부터 실제 속도로 재생 (리허설)
// CRON_SECRET은 환경변수나 .env에서 읽는다.
import { readFileSync } from 'node:fs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const url = (arg('--url') ?? 'http://localhost:3000').replace(/\/$/, '');
const replay = arg('--replay');
const envFile = (() => { try { return Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((l) => /^\w+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])); } catch { return {}; } })();
const secret = process.env.CRON_SECRET ?? envFile.CRON_SECRET;
if (!secret) { console.error('CRON_SECRET이 없어요'); process.exit(1); }

const started = Date.now(), base = replay ? Date.parse(replay.slice(0, 19).padEnd(19, ':00') + '+09:00') : NaN;
const kst = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 19);

async function tick() {
  const at = replay ? kst(base + Date.now() - started) : '';
  try {
    const r = await fetch(`${url}/api/push/tick${at ? `?at=${at}` : ''}`, { headers: { Authorization: `Bearer ${secret}` } });
    const d = await r.json();
    console.log(new Date().toLocaleTimeString('ko-KR'), at && `(재생 ${at.slice(11, 16)})`, r.ok ? `호출 ${d.called.length}건 · 휴대폰 ${d.phones}대 ${d.called.join(' ')}` : `오류 ${d.error}`);
  } catch (e) { console.log(new Date().toLocaleTimeString('ko-KR'), '연결 실패', e.message); }
}
tick();
setInterval(tick, 30e3);
