import { members } from '@/lib/store';
import { newResetToken, resetHash, RESET_MIN } from '@/lib/member';
import { memberOf } from '@/lib/session';
import { refreshTeam } from '@/lib/refresh';

// 운영진: 승인·거절, 관리자 지정·해제, 비밀번호 재설정 링크, 회원 삭제. 승인된 관리자만
export const dynamic = 'force-dynamic';
const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const me = await memberOf(req);
  if (!me?.admin) return bad('관리자만 할 수 있어요', 403);
  const b = await req.json().catch(() => ({}));
  const m = await members.byId(String(b?.id ?? ''));
  if (!m) return bad('회원을 찾지 못했어요');
  if (m.id === me.id && b.action !== 'reset') return bad('내 계정은 여기서 바꿀 수 없어요');

  if (b.action === 'status' && ['approved', 'rejected', 'pending'].includes(b.status)) {
    await members.update(m.id, { status: b.status, decided_at: new Date().toISOString(), decided_by: me.email });
    refreshTeam(m.team_no);
    return Response.json({ ok: true });
  }
  if (b.action === 'admin') {
    if (m.status !== 'approved') return bad('승인된 회원만 관리자로 지정할 수 있어요');
    await members.update(m.id, { admin: !!b.on });
    return Response.json({ ok: true });
  }
  if (b.action === 'team') {
    const team_no = b.team_no == null || b.team_no === '' ? null : Number(b.team_no);
    if (team_no !== null && !(Number.isInteger(team_no) && team_no > 0 && team_no < 100000)) return bad('팀 번호를 확인해 주세요');
    await members.update(m.id, { team_no, team_leader: team_no !== null && !!b.leader });
    refreshTeam(m.team_no, team_no);
    return Response.json({ ok: true });
  }
  if (b.action === 'reset') {
    const t = newResetToken();
    await members.update(m.id, { reset_hash: resetHash(t), reset_exp: new Date(Date.now() + RESET_MIN * 60e3).toISOString() });
    return Response.json({ ok: true, link: `${new URL(req.url).origin}/login/reset?t=${t}`, minutes: RESET_MIN });
  }
  if (b.action === 'delete') {
    await members.remove(m.id);
    await members.scrub(m.email);
    refreshTeam(m.team_no);
    return Response.json({ ok: true });
  }
  return bad('잘못된 요청이에요');
}
