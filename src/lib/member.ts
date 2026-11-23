// 홈페이지 회원: 비밀번호 해시, 로그인 쿠키, 잠금, 재설정 링크, 입력 검사. 저장은 store.ts의 members
import { scryptSync, randomBytes, createHmac, createHash, timingSafeEqual } from 'node:crypto';
import type { Member } from './store';

export const MEMBER_COOKIE = 'krc-member';
const DAYS = 30;
export const LOCK_AFTER = 5, LOCK_MIN = 10, RESET_MIN = 30;

const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export function hashPw(pw: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(pw, salt, 32).toString('hex')}`;
}
export function checkPw(pw: string, stored: string) {
  const [salt, hash] = stored.split(':');
  return !!salt && !!hash && same(scryptSync(pw, salt, 32).toString('hex'), hash);
}

// 쿠키 = 회원 id.세션 버전.만료시각.서명. 비밀번호를 바꾸면 버전이 올라가 다른 기기의 쿠키가 무효가 된다
const secret = () => `member:${process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || 'dev-only'}`;
const sign = (s: string) => createHmac('sha256', secret()).update(s).digest('base64url');
export function makeToken(id: string, sess: number, now = Date.now()) {
  const body = `${id}.${sess}.${now + DAYS * 864e5}`;
  return `${body}.${sign(body)}`;
}
export function readToken(t: string | undefined, now = Date.now()): { id: string; sess: number } | null {
  const [id, sess, exp, sig] = String(t ?? '').split('.');
  if (!id || !sess || !exp || !sig || !same(sig, sign(`${id}.${sess}.${exp}`)) || Number(exp) < now) return null;
  return { id, sess: Number(sess) };
}
export const cookieOf = (req: Request) => (req.headers.get('cookie') ?? '').split(/;\s*/).find((x) => x.startsWith(MEMBER_COOKIE + '='))?.slice(MEMBER_COOKIE.length + 1);
export function setCookie(req: Request, value: string, maxAge = DAYS * 86400) {
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return `${MEMBER_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
export const loginCookie = (req: Request, m: Pick<Member, 'id' | 'sess'>) => setCookie(req, makeToken(m.id, m.sess ?? 0));


// 재설정 링크: 원래 값은 링크에만, 저장은 해시만
export const resetHash = (t: string) => createHash('sha256').update(t).digest('hex');
export const newResetToken = () => randomBytes(24).toString('base64url');

// 비밀번호 규칙 (KRC Tech와 같음): 8자 이상, 영문 소문자·대문자, 특수기호
export const PW_RULES: [string, (p: string) => boolean][] = [
  ['8자 이상', (p) => p.length >= 8],
  ['영문 소문자', (p) => /[a-z]/.test(p)],
  ['영문 대문자', (p) => /[A-Z]/.test(p)],
  ['특수기호', (p) => /[^A-Za-z0-9\s]/.test(p)],
];
export function pwError(pw: unknown) {
  const p = String(pw ?? '');
  const miss = PW_RULES.filter(([, ok]) => !ok(p)).map(([n]) => n);
  return miss.length || p.length > 200 ? `비밀번호 조건: ${miss.join(', ') || '200자 이하'}` : '';
}

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
export type Profile = { name: string; school: string; team: string; role: string; intro: string };
export const showOnTeam = (b: any) => b?.show_on_team === true || b?.show_on_team === 'on';
export function parseProfile(b: any): { data?: Profile; error?: string } {
  const d = { name: str(b?.name, 40), school: str(b?.school, 80), team: str(b?.team, 80), role: str(b?.role, 60), intro: str(b?.intro, 300) };
  return d.name && d.school && d.team ? { data: d } : { error: '이름·학교·팀은 비울 수 없어요' };
}

export type SignupIn = Profile & { verify: string; email: string; pw: string; agree: boolean; team_no: number | null };
export const teamNo = (v: unknown) => { const n = Number(String(v ?? '').trim()); return Number.isInteger(n) && n > 0 && n < 100000 ? n : null; };
// 입력 정리 + 검사. 틀리면 error에 화면에 띄울 문장
export function parseSignup(b: any): { data?: SignupIn; error?: string } {
  const p = parseProfile(b);
  const d: SignupIn = { ...(p.data ?? { name: '', school: '', team: '', role: '', intro: '' }), verify: str(b?.verify, 500), email: str(b?.email, 120).toLowerCase(), pw: String(b?.pw ?? ''), agree: b?.agree === true, team_no: teamNo(b?.team_no) };
  if (!p.data || !d.verify) return { error: '필수 항목을 모두 채워 주세요' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return { error: '이메일 주소를 확인해 주세요' };
  const e = pwError(d.pw);
  if (e) return { error: e };
  if (!d.agree) return { error: '개인정보 수집·이용에 동의해야 가입할 수 있어요' };
  return { data: d };
}

// 팀 설정 권한: 운영진 관리자, 또는 그 팀의 승인된 팀장
export const canManageTeam = (m: Pick<Member, 'admin' | 'team_leader' | 'team_no' | 'status'> | null, n: number) =>
  !!m && m.status === 'approved' && (m.admin || (m.team_leader && m.team_no === n));

// 팀 설정 입력 정리. 링크는 http(s)만, 이메일은 형식만 본다
const url = (v: unknown) => { const u = str(v, 200); return /^https?:\/\/\S+$/.test(u) ? u : ''; };
export function parseTeamForm(f: FormData) {
  const g = (k: string) => f.get(k);
  const sponsors = [...new Set(String(g('sponsors') ?? '').split('\n').map((s) => s.trim().slice(0, 60)).filter(Boolean))].slice(0, 10);
  const email = str(g('email'), 120);
  return {
    school: str(g('school'), 80), region: str(g('region'), 40), intro: str(g('intro'), 500), robot_name: str(g('robot_name'), 40),
    instagram: url(g('instagram')), youtube: url(g('youtube')), web: url(g('web')), email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '', sponsors,
  };
}
export const IMG_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
