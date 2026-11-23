import { members } from '@/lib/store';
import { checkPw, hashPw, pwError, loginCookie } from '@/lib/member';
import { memberOf } from '@/lib/session';

// 비밀번호 변경 (로그인 상태, 현재 비밀번호 확인). 다른 기기는 로그아웃, 이 기기는 새 쿠키
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const me = await memberOf(req);
  if (!me) return Response.json({ error: '다시 로그인해 주세요' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!checkPw(String(b?.cur ?? ''), me.pw)) { await new Promise((r) => setTimeout(r, 600)); return Response.json({ error: '현재 비밀번호가 맞지 않아요' }, { status: 400 }); }
  const e = pwError(b?.next);
  if (e) return Response.json({ error: e }, { status: 400 });
  const sess = (me.sess ?? 0) + 1;
  await members.update(me.id, { pw: hashPw(String(b.next)), sess });
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': loginCookie(req, { id: me.id, sess }) } });
}
