// 저장소 백업 (암호화): Supabase 표 전부 + 팀 사진 → backups/<날짜>.krcbak  (AES-256-GCM, 30일 지난 백업은 지움)
// 개인정보(이름·이메일·비밀번호 해시)가 들어 있어서 평문으로 남기지 않는다. 암호는 파일·.env에 저장하지 말고 따로 기억할 것.
//   백업:  npm run backup                       (암호를 물어봄. 또는 BACKUP_PASSPHRASE 환경변수)
//   풀기:  npm run backup -- --open backups/<파일>.krcbak  → backups/open-<날짜>/ 에 풀림 (확인 뒤 바로 지울 것)
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createInterface } from 'node:readline';

const KEEP_DAYS = 30;
const ask = (q) => new Promise((res) => {
  if (process.env.BACKUP_PASSPHRASE) return res(process.env.BACKUP_PASSPHRASE);
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); };   // 입력한 암호는 화면에 안 보이게
  rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); res(a); });
});
const key = (pass, salt) => scryptSync(pass, salt, 32);

// 풀기
const openAt = process.argv.indexOf('--open');
if (openAt > 0) {
  const buf = readFileSync(process.argv[openAt + 1]);
  const [salt, iv, tag, data] = [buf.subarray(0, 16), buf.subarray(16, 28), buf.subarray(28, 44), buf.subarray(44)];
  const d = createDecipheriv('aes-256-gcm', key(await ask('백업 암호: '), salt), iv); d.setAuthTag(tag);
  let bundle;
  try { bundle = JSON.parse(gunzipSync(Buffer.concat([d.update(data), d.final()])).toString()); } catch { console.error('암호가 틀렸거나 파일이 망가졌어요'); process.exit(1); }
  const dir = `backups/open-${Date.now()}`;
  for (const [t, rows] of Object.entries(bundle.tables)) { mkdirSync(dir, { recursive: true }); writeFileSync(`${dir}/${t}.json`, JSON.stringify(rows, null, 1)); }
  for (const [p, b64] of Object.entries(bundle.images)) { mkdirSync(`${dir}/team-images/${p.split('/').slice(0, -1).join('/')}`, { recursive: true }); writeFileSync(`${dir}/team-images/${p}`, Buffer.from(b64, 'base64')); }
  console.log(`${dir} 에 풀었어요. 확인이 끝나면 이 폴더를 바로 지워 주세요.`);
  process.exit(0);
}

const url = process.env.SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, ''), skey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !skey) { console.error('.env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요해요'); process.exit(1); }
const pass = await ask('백업 암호 (12자 이상, 따로 기억해 두세요): ');
if (pass.length < 12) { console.error('암호는 12자 이상으로 해 주세요'); process.exit(1); }

const H = { apikey: skey, ...(skey.startsWith('eyJ') && { Authorization: `Bearer ${skey}` }) };
const TABLES = ['members', 'team_profiles', 'autos', 'push_subs', 'arrivals', 'push_log'];
async function all(table) {   // 1000줄씩 끝까지
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${url}/rest/v1/${table}?select=*`, { headers: { ...H, Range: `${from}-${from + 999}` } });
    if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
    const part = await r.json(); rows.push(...part);
    if (part.length < 1000) return rows;
  }
}
const tables = {};
for (const t of TABLES) tables[t] = await all(t);

const list = async (prefix) => (await (await fetch(`${url}/storage/v1/object/list/team-images`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix, limit: 1000 }) })).json());
const images = {};
for (const f of await list('')) {
  for (const p of f.id ? [f.name] : (await list(f.name)).map((x) => `${f.name}/${x.name}`)) {
    const r = await fetch(`${url}/storage/v1/object/team-images/${p}`, { headers: H });
    if (r.ok) images[p] = Buffer.from(await r.arrayBuffer()).toString('base64');
  }
}

const salt = randomBytes(16), iv = randomBytes(12);
const c = createCipheriv('aes-256-gcm', key(pass, salt), iv);
const data = Buffer.concat([c.update(gzipSync(JSON.stringify({ at: new Date().toISOString(), tables, images }))), c.final()]);
mkdirSync('backups', { recursive: true });
const file = `backups/${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace(/[T:]/g, '-')}.krcbak`;
writeFileSync(file, Buffer.concat([salt, iv, c.getAuthTag(), data]));

// 30일 지난 백업 지우기
let gone = 0;
for (const f of readdirSync('backups')) if (f.endsWith('.krcbak') && Date.now() - statSync(`backups/${f}`).mtimeMs > KEEP_DAYS * 864e5) { unlinkSync(`backups/${f}`); gone++; }
console.log(`${file}  ${Object.entries(tables).map(([k, v]) => `${k} ${v.length}`).join(' · ')} · 사진 ${Object.keys(images).length}${gone ? ` · 오래된 백업 ${gone}개 지움` : ''}`);
