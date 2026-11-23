// 저장소 백업: Supabase 표 전부(JSON) + 팀 사진 → backups/<날짜>/  (backups/는 git에 안 올라감: 개인정보·비밀번호 해시 포함)
// node --env-file=.env scripts/backup.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) { console.error('.env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요해요'); process.exit(1); }
const H = { apikey: key, ...(key.startsWith('eyJ') && { Authorization: `Bearer ${key}` }) };
const TABLES = ['members', 'team_profiles', 'autos', 'push_subs', 'arrivals', 'push_log'];
const dir = `backups/${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace(/[T:]/g, '-')}`;
mkdirSync(`${dir}/team-images`, { recursive: true });

async function all(table) {   // 1000줄씩 끝까지
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${url}/rest/v1/${table}?select=*`, { headers: { ...H, Range: `${from}-${from + 999}` } });
    if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
    const part = await r.json(); rows.push(...part);
    if (part.length < 1000) return rows;
  }
}
const sum = {};
for (const t of TABLES) { const rows = await all(t); writeFileSync(`${dir}/${t}.json`, JSON.stringify(rows, null, 1)); sum[t] = rows.length; }

// 팀 사진: 폴더(팀 번호)마다 목록 → 내려받기
const list = async (prefix) => (await (await fetch(`${url}/storage/v1/object/list/team-images`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix, limit: 1000 }) })).json());
let files = 0;
for (const f of await list('')) {
  for (const o of f.id ? [{ name: f.name, path: f.name }] : (await list(f.name)).map((x) => ({ name: x.name, path: `${f.name}/${x.name}` }))) {
    const r = await fetch(`${url}/storage/v1/object/team-images/${o.path}`, { headers: H });
    if (!r.ok) continue;
    mkdirSync(`${dir}/team-images/${o.path.split('/').slice(0, -1).join('/') || '.'}`, { recursive: true });
    writeFileSync(`${dir}/team-images/${o.path}`, Buffer.from(await r.arrayBuffer())); files++;
  }
}
writeFileSync(`${dir}/README.txt`, `KRC Alumni 백업 ${new Date().toISOString()}\n${JSON.stringify(sum)}\n사진 ${files}개\n개인정보가 들어 있어요. 외장하드나 개인 드라이브에만 보관하세요.\n`);
console.log(`${dir}  ${Object.entries(sum).map(([k, v]) => `${k} ${v}`).join(' · ')} · 사진 ${files}`);
