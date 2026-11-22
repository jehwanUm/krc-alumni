// 홈페이지 회원: 비밀번호 해시, 로그인 쿠키, 가입 입력 검사. 저장은 store.ts의 members
import { scryptSync, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

export const MEMBER_COOKIE = 'krc-member';
const DAYS = 30;

const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export function hashPw(pw: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(pw, salt, 32).toString('hex')}`;
}
export function checkPw(pw: string, stored: string) {
  const [salt, hash] = stored.split(':');
  return !!salt && !!hash && same(scryptSync(pw, salt, 32).toString('hex'), hash);
}

// 쿠키 = 회원 id.만료시각.서명. 서명 키는 서버 비밀 값에서 만든다 (그 값을 바꾸면 모두 로그아웃)
const secret = () => `member:${process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || 'dev-only'}`;
const sign = (s: string) => createHmac('sha256', secret()).update(s).digest('base64url');
export function makeToken(id: string, now = Date.now()) {
  const body = `${id}.${now + DAYS * 864e5}`;
  return `${body}.${sign(body)}`;
}
export function readToken(t: string | undefined, now = Date.now()): string | null {
  const [id, exp, sig] = String(t ?? '').split('.');
  if (!id || !exp || !sig || !same(sig, sign(`${id}.${exp}`)) || Number(exp) < now) return null;
  return id;
}
export const cookieOf = (req: Request) => (req.headers.get('cookie') ?? '').split(/;\s*/).find((x) => x.startsWith(MEMBER_COOKIE + '='))?.slice(MEMBER_COOKIE.length + 1);
export function setCookie(req: Request, value: string, maxAge = DAYS * 86400) {
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return `${MEMBER_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

// 비밀번호 규칙 (KRC Tech와 같음): 8자 이상, 영문 소문자·대문자, 특수기호
export const PW_RULES: [string, (p: string) => boolean][] = [
  ['8자 이상', (p) => p.length >= 8],
  ['영문 소문자', (p) => /[a-z]/.test(p)],
  ['영문 대문자', (p) => /[A-Z]/.test(p)],
  ['특수기호', (p) => /[^A-Za-z0-9\s]/.test(p)],
];

export type SignupIn = { name: string; school: string; team: string; verify: string; role: string; intro: string; email: string; pw: string; agree: boolean };
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
// 입력 정리 + 검사. 틀리면 error에 화면에 띄울 문장
export function parseSignup(b: any): { data?: SignupIn; error?: string } {
  const d: SignupIn = {
    name: str(b?.name, 40), school: str(b?.school, 80), team: str(b?.team, 80), verify: str(b?.verify, 500),
    role: str(b?.role, 60), intro: str(b?.intro, 300), email: str(b?.email, 120).toLowerCase(), pw: String(b?.pw ?? ''), agree: b?.agree === true,
  };
  if (!d.name || !d.school || !d.team || !d.verify) return { error: '필수 항목을 모두 채워 주세요' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return { error: '이메일 주소를 확인해 주세요' };
  const miss = PW_RULES.filter(([, ok]) => !ok(d.pw)).map(([n]) => n);
  if (miss.length || d.pw.length > 200) return { error: `비밀번호 조건: ${miss.join(', ') || '200자 이하'}` };
  if (!d.agree) return { error: '개인정보 수집·이용에 동의해야 가입할 수 있어요' };
  return { data: d };
}
