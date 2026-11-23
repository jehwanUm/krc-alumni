// 호출 구독·입장 체크·호출 기록 저장소. SUPABASE_URL이 있으면 Supabase(REST), 없으면 로컬 파일(개발용).
// 표 구조: supabase/schema.sql
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

export type SubRow = { endpoint: string; team: number; sub: any };
export type Arrival = { event: string; match: string; team: number; at: string };
export type LogRow = { key: string; event: string; match: string; team: number; stage: '1' | '2' | 'manual'; at: string };

export type Member = { id: string; email: string; pw: string; name: string; school: string; team: string; verify: string; role: string; intro: string; status: 'pending' | 'approved' | 'rejected'; admin: boolean; created_at: string; decided_at: string | null; decided_by: string | null;
  sess: number; fails: number; locked_until: string | null; reset_hash: string | null; reset_exp: string | null;
  team_no: number | null; team_leader: boolean };

type Db = { push_subs: SubRow[]; arrivals: Arrival[]; push_log: LogRow[]; members?: Member[]; team_profiles?: TeamProfile[] };
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

// 홈페이지 회원 (가입 → 운영진 승인 → 로그인)
export type MemberPatch = Partial<Omit<Member, 'id' | 'email' | 'created_at'>>;
const one = async (q: string): Promise<Member | null> => (await rest(`members?${q}&select=*`))?.[0] ?? null;
export const members = {
  async byEmail(email: string): Promise<Member | null> {
    if (local()) return load().members?.find((m) => m.email === email) ?? null;
    return one(`email=${eq(email)}`);
  },
  async byId(id: string): Promise<Member | null> {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    if (local()) return load().members?.find((m) => m.id === id) ?? null;
    return one(`id=${eq(id)}`);
  },
  async byResetHash(h: string): Promise<Member | null> {
    if (local()) return load().members?.find((m) => m.reset_hash === h) ?? null;
    return one(`reset_hash=${eq(h)}`);
  },
  async byTeam(n: number): Promise<Member[]> {
    if (local()) return (load().members ?? []).filter((m) => m.team_no === n);
    return rest(`members?team_no=${eq(n)}&select=*&order=created_at`);
  },
  async list(): Promise<Member[]> {
    if (local()) return [...(load().members ?? [])].reverse();
    return rest('members?select=*&order=created_at.desc');
  },
  // 같은 이메일이 있으면 false
  async create(m: Pick<Member, 'email' | 'pw' | 'name' | 'school' | 'team' | 'verify' | 'role' | 'intro' | 'team_no'>): Promise<boolean> {
    if (local()) {
      const db = load(); db.members ??= [];
      if (db.members.some((x) => x.email === m.email)) return false;
      db.members.push({ ...m, id: crypto.randomUUID(), status: 'pending', admin: false, created_at: new Date().toISOString(), decided_at: null, decided_by: null, sess: 0, fails: 0, locked_until: null, reset_hash: null, reset_exp: null, team_leader: false });
      save(db); return true;
    }
    try { await rest('members', { method: 'POST', body: JSON.stringify(m) }); return true; }
    catch (e) { if (String(e).includes(' 409')) return false; throw e; }
  },
  async update(id: string, patch: MemberPatch) {
    if (local()) { const db = load(); const m = db.members?.find((x) => x.id === id); if (m) Object.assign(m, patch); return save(db); }
    await rest(`members?id=${eq(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  async remove(id: string) {
    if (local()) { const db = load(); db.members = (db.members ?? []).filter((x) => x.id !== id); return save(db); }
    await rest(`members?id=${eq(id)}`, { method: 'DELETE' });
  },
};

// 팀 설정: 팀장이 고치는 팀 페이지 내용 (표 team_profiles)
export type TeamProfile = { team: number; school: string; region: string; intro: string; robot_name: string; logo_url: string | null; robot_url: string | null;
  instagram: string; youtube: string; web: string; email: string; sponsors: string[]; sponsors_ok: boolean; updated_at: string; updated_by: string | null };
export const teamProfiles = {
  async get(team: number): Promise<TeamProfile | null> {
    if (local()) return load().team_profiles?.find((t) => t.team === team) ?? null;
    return (await rest(`team_profiles?team=${eq(team)}&select=*`))?.[0] ?? null;
  },
  async put(row: TeamProfile) {
    if (local()) { const db = load(); db.team_profiles = [...(db.team_profiles ?? []).filter((t) => t.team !== row.team), row]; return save(db); }
    await rest('team_profiles?on_conflict=team', { method: 'POST', body: JSON.stringify(row), prefer: 'resolution=merge-duplicates' });
  },
  async unchecked(): Promise<TeamProfile[]> {
    if (local()) return (load().team_profiles ?? []).filter((t) => !t.sponsors_ok);
    return rest('team_profiles?sponsors_ok=eq.false&select=*');
  },
  async checkSponsors(team: number) {
    if (local()) { const db = load(); const t = db.team_profiles?.find((x) => x.team === team); if (t) t.sponsors_ok = true; return save(db); }
    await rest(`team_profiles?team=${eq(team)}`, { method: 'PATCH', body: JSON.stringify({ sponsors_ok: true }) });
  },
};

// 사진 올리기 → 공개 주소. 로컬 개발은 data: 주소로 대신한다
// shortcut: 로컬은 파일 대신 data URL, 여러 사람이 로컬로 시험하게 되면 public/uploads로
export async function uploadImage(path: string, bytes: ArrayBuffer, type: string): Promise<string> {
  if (local()) return `data:${type};base64,${Buffer.from(bytes).toString('base64')}`;
  const { url, key } = env();
  const res = await fetch(`${url}/storage/v1/object/team-images/${path}`, {
    method: 'POST', body: bytes,
    headers: { apikey: key!, ...(key!.startsWith('eyJ') && { Authorization: `Bearer ${key}` }), 'Content-Type': type, 'x-upsert': 'true', 'cache-control': 'max-age=3600' },
  });
  if (!res.ok) throw new Error(`사진 저장 오류 ${res.status}: ${await res.text()}`);
  return `${url}/storage/v1/object/public/team-images/${path}`;
}
