import { autos } from '@/lib/store';
import { memberOf } from '@/lib/session';
import { canSee, isVis, teamList } from '@/lib/autoAccess';
import { refreshAutos } from '@/lib/refresh';

// 경로 하나: 열기(볼 수 있으면), 고치기·지우기(우리 팀만)
export const dynamic = 'force-dynamic';
const bad = (error: string, status = 400) => Response.json({ error }, { status });
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const a = await autos.get((await params).id);
  const me = await memberOf(req);
  if (!a || !(await canSee(a, me?.team_no ?? null))) return bad('볼 수 없는 경로예요', 404);
  return Response.json({ auto: a });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await autos.get((await params).id);
  const me = await memberOf(req);
  if (!a || !me || me.team_no !== a.team) return bad('우리 팀 경로만 고칠 수 있어요', 403);
  const b = await req.json().catch(() => ({}));
  const patch: Parameters<typeof autos.update>[1] = { updated_by: me.email };
  if (b.name != null) { const n = String(b.name).trim().slice(0, 60); if (!n) return bad('경로 이름을 적어 주세요'); patch.name = n; }
  if (b.project != null) { if (!Array.isArray(b.project?.paths) || JSON.stringify(b.project).length > 300_000) return bad('경로를 읽지 못했어요'); patch.project = b.project; }
  if (b.visibility != null) { if (!isVis(b.visibility)) return bad('공개 범위를 확인해 주세요'); patch.visibility = b.visibility; }
  if (b.share_teams != null) patch.share_teams = teamList(b.share_teams);
  await autos.update(a.id, patch);
  if (a.visibility === 'public' || patch.visibility === 'public') refreshAutos(a.team);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const a = await autos.get((await params).id);
  const me = await memberOf(req);
  if (!a || !me || me.team_no !== a.team) return bad('우리 팀 경로만 지울 수 있어요', 403);
  await autos.remove(a.id);
  if (a.visibility === 'public') refreshAutos(a.team);
  return Response.json({ ok: true });
}
