import { members } from '@/lib/store';
import { checkPw, setCookie } from '@/lib/member';
import { refreshTeam } from '@/lib/refresh';
import { memberOf } from '@/lib/session';

// 회원 탈퇴: 비밀번호 확인 후 회원 정보를 바로 지운다 (개인정보처리방침: 탈퇴 시 파기)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const me = await memberOf(req);
  if (!me) return Response.json({ error: '다시 로그인해 주세요' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!checkPw(String(b?.pw ?? ''), me.pw)) { await new Promise((r) => setTimeout(r, 600)); return Response.json({ error: '비밀번호가 맞지 않아요' }, { status: 400 }); }
  await members.remove(me.id);
  await members.scrub(me.email);
  refreshTeam(me.team_no);
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': setCookie(req, '', 0) } });
}
