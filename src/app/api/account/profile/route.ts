import { members } from '@/lib/store';
import { parseProfile, showOnTeam } from '@/lib/member';
import { refreshTeam } from '@/lib/refresh';
import { memberOf } from '@/lib/session';

// 내 정보 수정 (이름·학교·팀·역할·소개). 이메일은 바꾸지 않는다
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const me = await memberOf(req);
  if (!me) return Response.json({ error: '다시 로그인해 주세요' }, { status: 401 });
  const b = await req.json().catch(() => null);
  const { data, error } = parseProfile(b);
  if (!data) return Response.json({ error }, { status: 400 });
  await members.update(me.id, { ...data, show_on_team: showOnTeam(b) });
  refreshTeam(me.team_no);
  return Response.json({ ok: true });
}
