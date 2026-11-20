// 호출 구독·입장 체크·호출 기록 저장소. SUPABASE_URL이 있으면 Supabase(REST), 없으면 로컬 파일(개발용).
// 표 구조: supabase/schema.sql
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

export type SubRow = { endpoint: string; team: number; sub: any };
export type Arrival = { event: string; match: string; team: number; at: string };
export type LogRow = { key: string; event: string; match: string; team: number; stage: '1' | '2' | 'manual'; at: string };

type Db = { push_subs: SubRow[]; arrivals: Arrival[]; push_log: LogRow[] };
// 주소는 https://xxxx.supabase.co (화면에서 …/rest/v1/까지 복사해도 받아 준다)
const env = () => ({ url: process.env.SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, ''), key: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() });

async function rest(path: string, init: RequestInit & { prefer?: string } = {}) {
  const { url, key } = env();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init, cache: 'no-store',
    // 예전 service_role 키(JWT, eyJ…)는 Authorization에도, 새 secret 키(sb_secret_…)는 apikey에만
    headers: { apikey: key!, ...(key!.startsWith('eyJ') && { Authorization: `Bearer ${key}` }), 'Content-Type': 'application/json', ...(init.prefer && { Prefer: init.prefer }) },
  });
  if (!res.ok) throw new Error(`저장소 오류 ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}
const inList = (xs: (string | number)[]) => `in.(${xs.map((x) => encodeURIComponent(String(x))).join(',')})`;
const eq = (x: string | number) => `eq.${encodeURIComponent(String(x))}`;

// shortcut: 로컬 파일은 서버 한 대 개발용. 배포(Vercel)에서는 반드시 Supabase
const FILE = '.data/store.json';
const load = (): Db => { try { return JSON.parse(readFileSync(FILE, 'utf8')); } catch { return { push_subs: [], arrivals: [], push_log: [] }; } };
const save = (db: Db) => { mkdirSync('.data', { recursive: true }); writeFileSync(FILE, JSON.stringify(db)); };
const local = () => !env().url;

export const subs = {
  async put(team: number, sub: any) {
    const row = { endpoint: String(sub.endpoint), team, sub };
    if (local()) { const db = load(); db.push_subs = [...db.push_subs.filter((r) => r.endpoint !== row.endpoint), row]; return save(db); }
    await rest('push_subs?on_conflict=endpoint', { method: 'POST', body: JSON.stringify(row), prefer: 'resolution=merge-duplicates' });
  },
  async del(endpoint: string) {
    if (local()) { const db = load(); db.push_subs = db.push_subs.filter((r) => r.endpoint !== endpoint); return save(db); }
    await rest(`push_subs?endpoint=${eq(endpoint)}`, { method: 'DELETE' });
  },
  async forTeams(teams: number[]): Promise<SubRow[]> {
    if (!teams.length) return [];
    if (local()) return load().push_subs.filter((r) => teams.includes(r.team));
    return rest(`push_subs?team=${inList(teams)}&select=endpoint,team,sub`);
  },
};

export const arrivals = {
  async list(event: string): Promise<Arrival[]> {
    if (local()) return load().arrivals.filter((r) => r.event === event);
    return rest(`arrivals?event=${eq(event)}&select=*`);
  },
  async set(event: string, match: string, team: number, on: boolean, at = Date.now()) {
    const row = { event, match, team, at: new Date(at).toISOString() };
    if (local()) {
      const db = load(); db.arrivals = db.arrivals.filter((r) => !(r.event === event && r.match === match && r.team === team));
      if (on) db.arrivals.push(row);
      return save(db);
    }
    if (on) await rest('arrivals?on_conflict=event,match,team', { method: 'POST', body: JSON.stringify(row), prefer: 'resolution=merge-duplicates' });
    else await rest(`arrivals?event=${eq(event)}&match=${eq(match)}&team=${eq(team)}`, { method: 'DELETE' });
  },
};

export const log = {
  async list(event: string): Promise<LogRow[]> {
    if (local()) return load().push_log.filter((r) => r.event === event);
    return rest(`push_log?event=${eq(event)}&select=*&order=at`);
  },
  // 처음 기록되는 것만 돌려준다 (이미 보낸 자동 호출은 다시 보내지 않기 위해)
  async addNew(rows: LogRow[]): Promise<LogRow[]> {
    if (!rows.length) return [];
    if (local()) {
      const db = load(), have = new Set(db.push_log.map((r) => r.key));
      const fresh = rows.filter((r) => !have.has(r.key));
      db.push_log.push(...fresh); save(db); return fresh;
    }
    return rest('push_log?on_conflict=key', { method: 'POST', body: JSON.stringify(rows), prefer: 'resolution=ignore-duplicates,return=representation' });
  },
};
