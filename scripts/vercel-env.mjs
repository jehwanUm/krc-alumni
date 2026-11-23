// .env 값을 Vercel(production) 환경변수로 올린다. 엄제환이 `npx vercel login`, `npx vercel link` 한 뒤 직접 실행:
//   node scripts/vercel-env.mjs
// 비밀 값은 화면에 찍지 않는다. 비어 있는 값은 건너뛴다.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const KEYS = ['FTC_API_USER', 'FTC_API_TOKEN', 'KRC_SEASON', 'KRC_EVENT_CODE', 'LIVE_EVENT', 'LIVE_DATES', 'SITE_URL',
  'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET', 'QUEUE_PIN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((l) => /^\w+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) { console.error('.env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 먼저 넣어 주세요 (배포에서는 로컬 파일 저장소를 쓸 수 없어요)'); process.exit(1); }
for (const k of KEYS) {
  if (!env[k]) { console.log(`건너뜀  ${k} (비어 있음)`); continue; }
  spawnSync('node_modules/.bin/vercel', ['env', 'rm', k, 'production', '-y'], { stdio: 'ignore' });
  const r = spawnSync('node_modules/.bin/vercel', ['env', 'add', k, 'production'], { input: env[k], stdio: ['pipe', 'ignore', 'pipe'] });
  console.log(r.status === 0 ? `올림    ${k}` : `실패    ${k}: ${String(r.stderr).trim().split('\n').pop()}`);
}
console.log('\n끝나면: npm run deploy');
