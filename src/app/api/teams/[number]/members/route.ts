import { members } from '@/lib/store';
import { memberOf } from '@/lib/session';
import { canManageTeam } from '@/lib/member';
import { refreshTeam } from '@/lib/refresh';

// 팀장: 우리 팀 가입 신청 승인·거절, 팀원 내보내기, 팀장 넘기기·추가
export const dynamic = 'force-dynamic';
const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const n = Number((await params).number);
  const me = await memberOf(req);
  if (!Number.isInteger(n) || !canManageTeam(me, n)) return bad('이 팀의 팀장만 할 수 있어요', 403);
  const b = await req.json().catch(() => ({}));
  const m = await members.byId(String(b?.id ?? ''));
  if (!m || m.team_no !== n) return bad('이 팀 회원이 아니에요');
  if (m.id === me!.id) return bad('내 계정은 여기서 바꿀 수 없어요');
  if (m.admin && !me!.admin) return bad('운영진 계정은 바꿀 수 없어요', 403);
  const now = new Date().toISOString();
  switch (b.action) {
    case 'approve': if (m.status !== 'pending') return bad('대기 중인 신청만 승인할 수 있어요'); await members.update(m.id, { status: 'approved', decided_at: now, decided_by: me!.email }); break;
    case 'reject': if (m.status !== 'pending') return bad('대기 중인 신청만 거절할 수 있어요'); await members.update(m.id, { status: 'rejected', decided_at: now, decided_by: me!.email }); break;
    case 'remove': await members.update(m.id, { team_no: null, team_leader: false }); break;
    case 'leader': if (m.status !== 'approved') return bad('승인된 팀원만 팀장이 될 수 있어요'); await members.update(m.id, { team_leader: !!b.on }); break;
    default: return bad('잘못된 요청이에요');
  }
  refreshTeam(n);
  return Response.json({ ok: true });
}
