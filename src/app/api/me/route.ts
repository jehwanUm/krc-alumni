import { memberOf } from '@/lib/session';
import { loginCookie } from '@/lib/member';
import { getDirectory } from '@/lib/teams';

// 지금 로그인한 회원 (첫 화면 버튼용). 들어올 때마다 로그인 쿠키를 30일로 다시 늘려서, 자주 쓰는 사람은 로그아웃되지 않는다
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const me = await memberOf(req);
  if (!me) return Response.json({ login: false }, { headers: { 'Cache-Control': 'no-store' } });
  const name = me.team_no ? (await getDirectory().catch(() => null))?.teams.find((t) => t.n === me.team_no)?.name ?? '' : '';
  return Response.json({ login: true, name: me.name, team: me.team_no, teamName: name, admin: me.admin },
    { headers: { 'Cache-Control': 'no-store', 'Set-Cookie': loginCookie(req, me) } });
}
