// 저장소: SQLite 파일 하나 (Node 내장 node:sqlite, 추가 패키지 없음). 경로는 DB_PATH (기본 .data/krc.sqlite)
// 표는 처음 열 때 자동으로 만든다 (SCHEMA). 서버 한 대에서 Next 프로세스 하나가 쓰는 구조
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type SubRow = { endpoint: string; team: number; sub: any };
export type Arrival = { event: string; match: string; team: number; at: string };
export type LogRow = { key: string; event: string; match: string; team: number; stage: '1' | '2' | 'manual'; at: string };

export type Member = { id: string; email: string; pw: string; name: string; school: string; team: string; verify: string; role: string; intro: string; status: 'pending' | 'approved' | 'rejected'; admin: boolean; created_at: string; decided_at: string | null; decided_by: string | null;
  sess: number; fails: number; locked_until: string | null; reset_hash: string | null; reset_exp: string | null;
  team_no: number | null; team_leader: boolean; show_on_team: boolean; agreed_at?: string | null; terms_ver?: string | null };

const SCHEMA = `
create table if not exists push_subs (endpoint text primary key, team integer not null, sub text not null, created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
create index if not exists push_subs_team on push_subs (team);
create table if not exists arrivals (event text not null, match text not null, team integer not null, at text not null, primary key (event, match, team));
create table if not exists push_log (key text primary key, event text not null, match text not null, team integer not null, stage text not null, at text not null);
create index if not exists push_log_event on push_log (event);
create table if not exists members (
  id text primary key, email text not null unique, pw text not null, name text not null, school text not null, team text not null, verify text not null,
  role text not null default '', intro text not null default '', status text not null default 'pending', admin integer not null default 0,
  created_at text not null, decided_at text, decided_by text,
  sess integer not null default 0, fails integer not null default 0, locked_until text, reset_hash text, reset_exp text,
  team_no integer, team_leader integer not null default 0, show_on_team integer not null default 0, agreed_at text, terms_ver text);
create index if not exists members_status on members (status);
create index if not exists members_team on members (team_no);
create table if not exists team_profiles (
  team integer primary key, school text not null default '', region text not null default '', intro text not null default '', robot_name text not null default '',
  logo_url text, robot_url text, instagram text not null default '', youtube text not null default '', web text not null default '', email text not null default '',
  sponsors text not null default '[]', sponsors_ok integer not null default 1, hidden integer not null default 0, sns_ok integer not null default 0,
  updated_at text not null, updated_by text);
create table if not exists autos (
  id text primary key, team integer not null, season integer not null, name text not null, project text not null,
  visibility text not null default 'private', share_teams text not null default '[]',
  created_by text, updated_by text, created_at text not null, updated_at text not null);
create index if not exists autos_team on autos (team);
create index if not exists autos_vis on autos (visibility);
create table if not exists signup_log (id integer primary key autoincrement, ip_hash text not null, at text not null);
create index if not exists signup_log_at on signup_log (at);
`;

// 한 프로세스에 연결 하나 (개발 서버가 모듈을 다시 읽어도 새로 만들지 않게 globalThis에 둔다)
const g = globalThis as unknown as { __krcDb?: DatabaseSync };
export function db() {
  if (g.__krcDb) return g.__krcDb;
  const path = process.env.DB_PATH || '.data/krc.sqlite';
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const d = new DatabaseSync(path);
  d.exec('pragma journal_mode = wal; pragma busy_timeout = 5000; pragma foreign_keys = on;');
  d.exec(SCHEMA);
  return (g.__krcDb = d);
}
const all = (sql: string, ...p: any[]) => db().prepare(sql).all(...p) as any[];
const get = (sql: string, ...p: any[]) => db().prepare(sql).get(...p) as any;
const run = (sql: string, ...p: any[]) => db().prepare(sql).run(...p);
const now = () => new Date().toISOString();
// 값 → SQLite: 참/거짓은 1/0, 배열·객체는 JSON 글자
const val = (v: unknown) => (typeof v === 'boolean' ? (v ? 1 : 0) : v !== null && typeof v === 'object' ? JSON.stringify(v) : (v ?? null));
// 고칠 칸만 골라 UPDATE (칸 이름은 정해 둔 목록만 — 밖에서 들어온 이름으로 SQL을 만들지 않게)
function patchRow(table: string, cols: readonly string[], where: string, id: unknown, patch: Record<string, unknown>) {
  const ks = Object.keys(patch).filter((k) => cols.includes(k) && patch[k] !== undefined);
  if (!ks.length) return;
  run(`update ${table} set ${ks.map((k) => `${k} = ?`).join(', ')} where ${where} = ?`, ...ks.map((k) => val(patch[k])), id);
}

export const subs = {
  async put(team: number, sub: any) {
    run('insert into push_subs (endpoint, team, sub) values (?, ?, ?) on conflict(endpoint) do update set team = excluded.team, sub = excluded.sub', String(sub.endpoint), team, JSON.stringify(sub));
  },
  async del(endpoint: string) { run('delete from push_subs where endpoint = ?', endpoint); },
  async forTeams(teams: number[]): Promise<SubRow[]> {
    if (!teams.length) return [];
    return all(`select endpoint, team, sub from push_subs where team in (${teams.map(() => '?').join(',')})`, ...teams).map((r) => ({ ...r, sub: JSON.parse(r.sub) }));
  },
};

export const arrivals = {
  async list(event: string): Promise<Arrival[]> { return all('select * from arrivals where event = ?', event); },
  async set(event: string, match: string, team: number, on: boolean, at = Date.now()) {
    if (on) run('insert into arrivals (event, match, team, at) values (?, ?, ?, ?) on conflict(event, match, team) do update set at = excluded.at', event, match, team, new Date(at).toISOString());
    else run('delete from arrivals where event = ? and match = ? and team = ?', event, match, team);
  },
};

export const log = {
  async list(event: string): Promise<LogRow[]> { return all('select * from push_log where event = ? order by at', event); },
  // 처음 기록되는 것만 돌려준다 (이미 보낸 자동 호출은 다시 보내지 않기 위해)
  async addNew(rows: LogRow[]): Promise<LogRow[]> {
    const st = db().prepare('insert into push_log (key, event, match, team, stage, at) values (?, ?, ?, ?, ?, ?) on conflict(key) do nothing');
    return rows.filter((r) => Number(st.run(r.key, r.event, r.match, r.team, r.stage, r.at).changes) > 0);
  },
};

// 홈페이지 회원 (가입 → 운영진 승인 → 로그인)
export type MemberPatch = Partial<Omit<Member, 'id' | 'email' | 'created_at'>>;
const MEMBER_COLS = ['pw', 'name', 'school', 'team', 'verify', 'role', 'intro', 'status', 'admin', 'decided_at', 'decided_by', 'sess', 'fails', 'locked_until', 'reset_hash', 'reset_exp', 'team_no', 'team_leader', 'show_on_team', 'agreed_at', 'terms_ver'] as const;
const member = (r: any): Member | null => (r ? { ...r, admin: !!r.admin, team_leader: !!r.team_leader, show_on_team: !!r.show_on_team } : null);
export const members = {
  async byEmail(email: string) { return member(get('select * from members where email = ?', email)); },
  async byId(id: string) { return /^[0-9a-f-]{36}$/.test(id) ? member(get('select * from members where id = ?', id)) : null; },
  async byResetHash(h: string) { return member(get('select * from members where reset_hash = ?', h)); },
  async byTeam(n: number): Promise<Member[]> { return all('select * from members where team_no = ? order by created_at', n).map((r) => member(r)!); },
  // 팀 페이지에 공개할 팀원 (승인 + 본인이 공개 선택). 이름·역할·팀장만
  async publicOfTeam(n: number): Promise<{ name: string; role: string; team_leader: boolean }[]> {
    return all("select name, role, team_leader from members where team_no = ? and status = 'approved' and show_on_team = 1 order by team_leader desc, created_at", n).map((r) => ({ ...r, team_leader: !!r.team_leader }));
  },
  async list(): Promise<Member[]> { return all('select * from members order by created_at desc').map((r) => member(r)!); },
  // 같은 이메일이 있으면 false
  async create(m: Pick<Member, 'email' | 'pw' | 'name' | 'school' | 'team' | 'verify' | 'role' | 'intro' | 'team_no' | 'agreed_at' | 'terms_ver'>): Promise<boolean> {
    const r = run(`insert into members (id, email, pw, name, school, team, verify, role, intro, team_no, agreed_at, terms_ver, created_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict(email) do nothing`,
      crypto.randomUUID(), m.email, m.pw, m.name, m.school, m.team, m.verify, m.role, m.intro, m.team_no ?? null, m.agreed_at ?? null, m.terms_ver ?? null, now());
    return Number(r.changes) > 0;
  },
  async update(id: string, patch: MemberPatch) { patchRow('members', MEMBER_COLS, 'id', id, patch); },
  async remove(id: string) { run('delete from members where id = ?', id); },
  // 탈퇴한 회원 이메일을 남은 팀 내용·오토·처리 기록에서 지운다 (약관 제3조)
  async scrub(email: string) {
    const gone = '탈퇴한 회원';
    for (const [t, c] of [['autos', 'created_by'], ['autos', 'updated_by'], ['team_profiles', 'updated_by'], ['members', 'decided_by']]) run(`update ${t} set ${c} = ? where ${c} = ?`, gone, email);
  },
};

// 팀 설정: 팀장이 고치는 팀 페이지 내용 (표 team_profiles)
export type TeamProfile = { team: number; school: string; region: string; intro: string; robot_name: string; logo_url: string | null; robot_url: string | null;
  instagram: string; youtube: string; web: string; email: string; sponsors: string[]; sponsors_ok: boolean; hidden?: boolean; sns_ok?: boolean; updated_at: string; updated_by: string | null };
// 캐시 태그 (저장하면 refresh.ts가 페이지를 다시 만든다)
export const teamTag = (team: number) => `team-${team}`;
export const PROFILES_TAG = 'team-profiles';
const PROFILE_COLS = ['school', 'region', 'intro', 'robot_name', 'logo_url', 'robot_url', 'instagram', 'youtube', 'web', 'email', 'sponsors', 'sponsors_ok', 'hidden', 'sns_ok', 'updated_at', 'updated_by'] as const;
const profile = (r: any): TeamProfile | null => (r ? { ...r, sponsors: JSON.parse(r.sponsors || '[]'), sponsors_ok: !!r.sponsors_ok, hidden: !!r.hidden, sns_ok: !!r.sns_ok } : null);
export const teamProfiles = {
  async get(team: number, _cached = false) { return profile(get('select * from team_profiles where team = ?', team)); },
  // 저장에 없는 칸(hidden 등)은 그대로 둔다
  async put(row: Omit<TeamProfile, 'hidden'>) {
    run('insert into team_profiles (team, updated_at) values (?, ?) on conflict(team) do nothing', row.team, row.updated_at);
    const { team, ...rest } = row;
    patchRow('team_profiles', PROFILE_COLS, 'team', team, rest);
  },
  async all(): Promise<TeamProfile[]> { return all('select * from team_profiles').map((r) => profile(r)!); },
  async unchecked(): Promise<TeamProfile[]> { return all('select * from team_profiles where sponsors_ok = 0').map((r) => profile(r)!); },
  // 운영진: 숨기기·사진 지우기 등
  async patch(team: number, p: Partial<TeamProfile>) { patchRow('team_profiles', PROFILE_COLS, 'team', team, p); },
  async checkSponsors(team: number) { run('update team_profiles set sponsors_ok = 1 where team = ?', team); },
};

// 사진 올리기 → 서버 폴더(UPLOAD_DIR, 기본 .data/uploads)에 저장, 주소는 /uploads/<경로> (app/uploads/[...path]가 내보냄)
export const uploadDir = () => process.env.UPLOAD_DIR || '.data/uploads';
export async function uploadImage(path: string, bytes: ArrayBuffer, _type: string): Promise<string> {
  if (!/^\d+\/[\w.-]+$/.test(path)) throw new Error('사진 경로가 올바르지 않아요');
  const file = join(uploadDir(), path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(bytes));
  return `/uploads/${path}`;
}

// 오토 경로 (표 autos). 목록은 project 없이 가볍게
export type Visibility = 'private' | 'alliance' | 'teams' | 'public';
export type Auto = { id: string; team: number; season: number; name: string; project: unknown; visibility: Visibility; share_teams: number[]; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
export type AutoMeta = Omit<Auto, 'project'>;
const META = 'id, team, season, name, visibility, share_teams, created_by, updated_by, created_at, updated_at';
const meta = (r: any): AutoMeta => ({ ...r, share_teams: JSON.parse(r.share_teams || '[]') });
export const AUTOS_TAG = 'autos-public';
const AUTO_COLS = ['name', 'project', 'visibility', 'share_teams', 'updated_by', 'updated_at'] as const;
export const autos = {
  async ofTeam(team: number): Promise<AutoMeta[]> { return all(`select ${META} from autos where team = ? order by updated_at desc`, team).map(meta); },
  async get(id: string): Promise<Auto | null> {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    const r = get('select * from autos where id = ?', id);
    return r ? { ...meta(r), project: JSON.parse(r.project) } : null;
  },
  // 모두에게 공개된 경로 (오토 모음·팀 목록·팀 페이지용)
  async publicAll(): Promise<AutoMeta[]> { return all(`select ${META} from autos where visibility = 'public' order by updated_at desc`).map(meta); },
  async create(a: Pick<Auto, 'team' | 'season' | 'name' | 'project' | 'visibility' | 'share_teams' | 'created_by'>): Promise<string> {
    const id = crypto.randomUUID(), t = now();
    run('insert into autos (id, team, season, name, project, visibility, share_teams, created_by, updated_by, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, a.team, a.season, a.name, JSON.stringify(a.project), a.visibility, JSON.stringify(a.share_teams), a.created_by, a.created_by, t, t);
    return id;
  },
  async update(id: string, patch: Partial<Pick<Auto, 'name' | 'project' | 'visibility' | 'share_teams' | 'updated_by'>>) { patchRow('autos', AUTO_COLS, 'id', id, { ...patch, updated_at: now() }); },
  async remove(id: string) { run('delete from autos where id = ?', id); },
};

// 가입 시도 기록 (스팸 막기). 하루 지난 기록은 넣을 때 지운다
export const signupLog = {
  async recent(sinceIso: string): Promise<{ ip_hash: string }[]> { return all('select ip_hash from signup_log where at >= ?', sinceIso); },
  async add(ip_hash: string) {
    run('insert into signup_log (ip_hash, at) values (?, ?)', ip_hash, now());
    run('delete from signup_log where at < ?', new Date(Date.now() - 864e5).toISOString());
  },
};
