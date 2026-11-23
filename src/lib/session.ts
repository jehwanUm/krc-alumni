// 쿠키 → 지금 로그인한 승인 회원 (탈퇴·거절·비밀번호 변경이면 null)
import { members, type Member } from './store';
import { readToken, cookieOf } from './member';
export async function memberFrom(cookie: string | undefined): Promise<Member | null> {
  const t = readToken(cookie);
  if (!t) return null;
  const m = await members.byId(t.id).catch(() => null);
  return m && m.status === 'approved' && (m.sess ?? 0) === t.sess ? m : null;
}
export const memberOf = (req: Request) => memberFrom(cookieOf(req));
