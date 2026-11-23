import { teamProfiles } from '@/lib/store';
import { memberOf } from '@/lib/session';
import { refreshTeam } from '@/lib/refresh';

// 운영진: 팀이 바꾼 후원사 확인, 팀 설정 숨기기·다시 보이기, 사진 지우기
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const me = await memberOf(req);
  if (!me?.admin) return Response.json({ error: '관리자만 할 수 있어요' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const n = Number(b?.team);
  if (!Number.isInteger(n) || !(await teamProfiles.get(n))) return Response.json({ error: '팀을 찾지 못했어요' }, { status: 400 });
  const stamp = { updated_at: new Date().toISOString(), updated_by: me.email };
  switch (b.action ?? 'sponsors') {
    case 'sponsors': await teamProfiles.checkSponsors(n); break;
    case 'hide': await teamProfiles.patch(n, { hidden: true, ...stamp }); break;
    case 'show': await teamProfiles.patch(n, { hidden: false, ...stamp }); break;
    case 'clear_robot': await teamProfiles.patch(n, { robot_url: null, ...stamp }); break;
    case 'clear_logo': await teamProfiles.patch(n, { logo_url: null, ...stamp }); break;
    case 'clear_intro': await teamProfiles.patch(n, { intro: '', ...stamp }); break;
    default: return Response.json({ error: '잘못된 요청이에요' }, { status: 400 });
  }
  refreshTeam(n);
  return Response.json({ ok: true });
}
