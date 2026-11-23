// 호출 구독·입장 체크·호출 기록 저장소. SUPABASE_URL이 있으면 Supabase(REST), 없으면 로컬 파일(개발용).
// 표 구조: supabase/schema.sql
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

export type SubRow = { endpoint: string; team: number; sub: any };
export type Arrival = { event: string; match: string; team: number; at: string };
export type LogRow = { key: string; event: string; match: string; team: number; stage: '1' | '2' | 'manual'; at: string };

export type Member = { id: string; email: string; pw: string; name: string; school: string; team: string; verify: string; role: string; intro: string; status: 'pending' | 'approved' | 'rejected'; admin: boolean; created_at: string; decided_at: string | null; decided_by: string | null;
  sess: number; fails: number; locked_until: string | null; reset_hash: string | null; reset_exp: string | null;
  team_no: number | null; team_leader: boolean; show_on_team: boolean };

type Db = { push_subs: SubRow[]; arrivals: Arrival[]; push_log: LogRow[]; members?: Member[]; team_profiles?: TeamProfile[]; autos?: Auto[] };
// 주소는 https://xxxx.supabase.co (화면에서 …/rest/v1/까지 복사해도 받아 준다)
const env = () => ({ url: process.env.SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, ''), key: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() });

async function rest(path: string, init: RequestInit & { prefer?: string; next?: { revalidate?: number; tags?: string[] } } = {}) {
  const { url, key } = env();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    // 기본은 매번 새로. 공개 페이지(ISR)는 next 옵션으로 캐시
    ...(init.next ? {} : { cache: 'no-store' as const }), ...init,
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
  // 팀 페이지에 공개할 팀원 (승인 + 본인이 공개 선택). 이름·역할·팀장만, 10분 캐시
  async publicOfTeam(n: number): Promise<{ name: string; role: string; team_leader: boolean }[]> {
    if (local()) return (load().members ?? []).filter((m) => m.team_no === n && m.status === 'approved' && m.show_on_team).map(({ name, role, team_leader }) => ({ name, role, team_leader }));
    return rest(`members?team_no=${eq(n)}&status=eq.approved&show_on_team=eq.true&select=name,role,team_leader&order=team_leader.desc,created_at`, { next: { revalidate: 600, tags: [teamTag(n)] } });
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
      db.members.push({ ...m, id: crypto.randomUUID(), status: 'pending', admin: false, created_at: new Date().toISOString(), decided_at: null, decided_by: null, sess: 0, fails: 0, locked_until: null, reset_hash: null, reset_exp: null, team_leader: false, show_on_team: false });
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
export const teamTag = (team: number) => `team-${team}`;
export const PROFILES_TAG = 'team-profiles';
export const teamProfiles = {
  // cached: 공개 팀 페이지용 (10분 캐시, 저장하면 teamTag로 비움). 설정 화면·저장은 매번 새로
  async get(team: number, cached = false): Promise<TeamProfile | null> {
    if (local()) return load().team_profiles?.find((t) => t.team === team) ?? null;
    return (await rest(`team_profiles?team=${eq(team)}&select=*`, cached ? { next: { revalidate: 600, tags: [teamTag(team)] } } : {}))?.[0] ?? null;
  },
  async put(row: TeamProfile) {
    if (local()) { const db = load(); db.team_profiles = [...(db.team_profiles ?? []).filter((t) => t.team !== row.team), row]; return save(db); }
    await rest('team_profiles?on_conflict=team', { method: 'POST', body: JSON.stringify(row), prefer: 'resolution=merge-duplicates' });
  },
  // 팀 목록·후원 페이지용 전체 (10분 캐시, 저장하면 PROFILES_TAG로 비움)
  async all(): Promise<TeamProfile[]> {
    if (local()) return load().team_profiles ?? [];
    return rest('team_profiles?select=*', { next: { revalidate: 600, tags: [PROFILES_TAG] } });
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

// 오토 경로 (표 autos). 목록은 project 없이 가볍게
export type Visibility = 'private' | 'alliance' | 'teams' | 'public';
export type Auto = { id: string; team: number; season: number; name: string; project: unknown; visibility: Visibility; share_teams: number[]; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
export type AutoMeta = Omit<Auto, 'project'>;
const META = 'id,team,season,name,visibility,share_teams,created_by,updated_by,created_at,updated_at';
const noProject = ({ project, ...m }: Auto): AutoMeta => m;
export const AUTOS_TAG = 'autos-public';
export const autos = {
  async ofTeam(team: number): Promise<AutoMeta[]> {
    if (local()) return (load().autos ?? []).filter((a) => a.team === team).map(noProject).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return rest(`autos?team=${eq(team)}&select=${META}&order=updated_at.desc`);
  },
  async get(id: string): Promise<Auto | null> {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    if (local()) return load().autos?.find((a) => a.id === id) ?? null;
    return (await rest(`autos?id=${eq(id)}&select=*`))?.[0] ?? null;
  },
  // 모두에게 공개된 경로 (오토 모음·팀 목록·팀 페이지용, 10분 캐시)
  async publicAll(): Promise<AutoMeta[]> {
    if (local()) return (load().autos ?? []).filter((a) => a.visibility === 'public').map(noProject);
    return rest(`autos?visibility=eq.public&select=${META}&order=updated_at.desc`, { next: { revalidate: 600, tags: [AUTOS_TAG] } });
  },
  async create(a: Pick<Auto, 'team' | 'season' | 'name' | 'project' | 'visibility' | 'share_teams' | 'created_by'>): Promise<string> {
    const now = new Date().toISOString();
    if (local()) { const db = load(); const id = crypto.randomUUID(); (db.autos ??= []).push({ ...a, id, updated_by: a.created_by, created_at: now, updated_at: now }); save(db); return id; }
    return (await rest('autos?select=id', { method: 'POST', body: JSON.stringify({ ...a, updated_by: a.created_by }), prefer: 'return=representation' }))[0].id;
  },
  async update(id: string, patch: Partial<Pick<Auto, 'name' | 'project' | 'visibility' | 'share_teams' | 'updated_by'>>) {
    const p = { ...patch, updated_at: new Date().toISOString() };
    if (local()) { const db = load(); const a = db.autos?.find((x) => x.id === id); if (a) Object.assign(a, p); return save(db); }
    await rest(`autos?id=${eq(id)}`, { method: 'PATCH', body: JSON.stringify(p) });
  },
  async remove(id: string) {
    if (local()) { const db = load(); db.autos = (db.autos ?? []).filter((a) => a.id !== id); return save(db); }
    await rest(`autos?id=${eq(id)}`, { method: 'DELETE' });
  },
};
