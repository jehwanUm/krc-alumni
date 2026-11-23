// 저장소 백업 (암호화): SQLite 파일 + 팀 사진 폴더 → backups/<날짜>.krcbak  (AES-256-GCM, 30일 지난 백업은 지움)
// 개인정보(이름·이메일·비밀번호 해시)가 들어 있어서 평문으로 남기지 않는다. 암호는 파일·.env에 저장하지 말고 따로 기억할 것.
//   백업:  npm run backup                       (암호를 물어봄. 또는 BACKUP_PASSPHRASE 환경변수)
//   풀기:  npm run backup -- --open backups/<파일>.krcbak  → backups/open-<시각>/ 에 krc.sqlite·uploads/ 가 풀림 (확인 뒤 바로 지울 것)
//   되돌리기: 서버를 멈추고 풀린 krc.sqlite를 DB_PATH 자리에, uploads/를 UPLOAD_DIR 자리에 복사한 뒤 다시 켠다
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, unlinkSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createInterface } from 'node:readline';
import { DatabaseSync } from 'node:sqlite';

const KEEP_DAYS = 30;
const DB = process.env.DB_PATH || '.data/krc.sqlite', UP = process.env.UPLOAD_DIR || '.data/uploads';
const ask = (q) => new Promise((res) => {
  if (process.env.BACKUP_PASSPHRASE) return res(process.env.BACKUP_PASSPHRASE);
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); };   // 입력한 암호는 화면에 안 보이게
  rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); res(a); });
});
const key = (pass, salt) => scryptSync(pass, salt, 32);
const files = (dir) => (existsSync(dir) ? readdirSync(dir, { recursive: true }).map(String).filter((f) => statSync(join(dir, f)).isFile()) : []);

// 풀기
const openAt = process.argv.indexOf('--open');
if (openAt > 0) {
  const buf = readFileSync(process.argv[openAt + 1]);
  const [salt, iv, tag, data] = [buf.subarray(0, 16), buf.subarray(16, 28), buf.subarray(28, 44), buf.subarray(44)];
  const d = createDecipheriv('aes-256-gcm', key(await ask('백업 암호: '), salt), iv); d.setAuthTag(tag);
  let bundle;
  try { bundle = JSON.parse(gunzipSync(Buffer.concat([d.update(data), d.final()])).toString()); } catch { console.error('암호가 틀렸거나 파일이 망가졌어요'); process.exit(1); }
  const dir = `backups/open-${Date.now()}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/krc.sqlite`, Buffer.from(bundle.sqlite, 'base64'));
  for (const [p, b64] of Object.entries(bundle.uploads)) { mkdirSync(dirname(`${dir}/uploads/${p}`), { recursive: true }); writeFileSync(`${dir}/uploads/${p}`, Buffer.from(b64, 'base64')); }
  console.log(`${dir} 에 풀었어요 (krc.sqlite, uploads/). 확인이 끝나면 이 폴더를 바로 지워 주세요.`);
  process.exit(0);
}

if (!existsSync(DB)) { console.error(`${DB} 가 없어요 (DB_PATH 확인)`); process.exit(1); }
const pass = await ask('백업 암호 (12자 이상, 따로 기억해 두세요): ');
if (pass.length < 12) { console.error('암호는 12자 이상으로 해 주세요'); process.exit(1); }

// 서버가 켜져 있어도 일관된 사본을 뜬다 (VACUUM INTO)
mkdirSync('backups', { recursive: true });
const snap = `backups/.snap-${Date.now()}.sqlite`;
const src = new DatabaseSync(DB); src.exec(`vacuum into '${snap}'`); src.close();
const count = (t) => { const d = new DatabaseSync(snap); try { return d.prepare(`select count(*) n from ${t}`).get().n; } finally { d.close(); } };
const sum = ['members', 'team_profiles', 'autos', 'push_subs', 'push_log'].map((t) => `${t} ${count(t)}`).join(' · ');
const uploads = Object.fromEntries(files(UP).map((f) => [f, readFileSync(join(UP, f)).toString('base64')]));
const bundle = { at: new Date().toISOString(), sqlite: readFileSync(snap).toString('base64'), uploads };
unlinkSync(snap);

const salt = randomBytes(16), iv = randomBytes(12);
const c = createCipheriv('aes-256-gcm', key(pass, salt), iv);
const data = Buffer.concat([c.update(gzipSync(JSON.stringify(bundle))), c.final()]);
const file = `backups/${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace(/[T:]/g, '-')}.krcbak`;
writeFileSync(file, Buffer.concat([salt, iv, c.getAuthTag(), data]));

// 30일 지난 백업 지우기
let gone = 0;
for (const f of readdirSync('backups')) if (f.endsWith('.krcbak') && Date.now() - statSync(`backups/${f}`).mtimeMs > KEEP_DAYS * 864e5) { unlinkSync(`backups/${f}`); gone++; }
console.log(`${file}  ${sum} · 사진 ${Object.keys(uploads).length}${gone ? ` · 오래된 백업 ${gone}개 지움` : ''}`);
