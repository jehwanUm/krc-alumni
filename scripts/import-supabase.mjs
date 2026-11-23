// 한 번만: 예전 저장소(Supabase)의 표와 팀 사진을 SQLite로 옮긴다. 서버에서 처음 켜기 전에 실행
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node --env-file=.env scripts/import-supabase.mjs
// 이미 있는 줄은 건너뛴다(여러 번 실행해도 안전). 사진 주소는 /uploads/… 로 바꾼다
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { db, uploadDir } from '../src/lib/store.ts';

const url = process.env.SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) { console.error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요해요'); process.exit(1); }
const H = { apikey: key, ...(key.startsWith('eyJ') && { Authorization: `Bearer ${key}` }) };
const pull = async (t) => { const r = await fetch(`${url}/rest/v1/${t}?select=*`, { headers: H }); if (!r.ok) throw new Error(`${t}: ${r.status}`); return r.json(); };
const val = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v !== null && typeof v === 'object' ? JSON.stringify(v) : (v ?? null));
const pub = `${url}/storage/v1/object/public/team-images/`;
const localUrl = (u) => (u && u.startsWith(pub) ? `/uploads/${u.slice(pub.length)}` : u);

const COLS = {
  members: ['id', 'email', 'pw', 'name', 'school', 'team', 'verify', 'role', 'intro', 'status', 'admin', 'created_at', 'decided_at', 'decided_by', 'sess', 'fails', 'locked_until', 'reset_hash', 'reset_exp', 'team_no', 'team_leader', 'show_on_team', 'agreed_at', 'terms_ver'],
  team_profiles: ['team', 'school', 'region', 'intro', 'robot_name', 'logo_url', 'robot_url', 'instagram', 'youtube', 'web', 'email', 'sponsors', 'sponsors_ok', 'hidden', 'sns_ok', 'updated_at', 'updated_by'],
  autos: ['id', 'team', 'season', 'name', 'project', 'visibility', 'share_teams', 'created_by', 'updated_by', 'created_at', 'updated_at'],
  push_subs: ['endpoint', 'team', 'sub', 'created_at'],
  arrivals: ['event', 'match', 'team', 'at'],
  push_log: ['key', 'event', 'match', 'team', 'stage', 'at'],
};
for (const [t, cols] of Object.entries(COLS)) {
  const rows = await pull(t);
  const st = db().prepare(`insert into ${t} (${cols.join(',')}) values (${cols.map(() => '?').join(',')}) on conflict do nothing`);
  let n = 0;
  for (const r of rows) {
    if (t === 'team_profiles') { r.logo_url = localUrl(r.logo_url); r.robot_url = localUrl(r.robot_url); }
    n += Number(st.run(...cols.map((c) => val(r[c] === undefined ? null : r[c]))).changes);
  }
  console.log(`${t}: ${rows.length}줄 중 ${n}줄 옮김`);
}

// 팀 사진
const list = async (prefix) => (await (await fetch(`${url}/storage/v1/object/list/team-images`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix, limit: 1000 }) })).json());
let files = 0;
for (const f of await list('')) for (const p of f.id ? [f.name] : (await list(f.name)).map((x) => `${f.name}/${x.name}`)) {
  const r = await fetch(`${url}/storage/v1/object/team-images/${p}`, { headers: H });
  if (!r.ok) continue;
  const to = join(uploadDir(), p); mkdirSync(dirname(to), { recursive: true }); writeFileSync(to, Buffer.from(await r.arrayBuffer())); files++;
}
console.log(`사진 ${files}개 → ${uploadDir()}`);
