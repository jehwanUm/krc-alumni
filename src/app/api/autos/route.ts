import { autos } from '@/lib/store';
import { memberOf } from '@/lib/session';
import { canSee, isVis, teamList } from '@/lib/autoAccess';
import { refreshAutos } from '@/lib/refresh';
import { NEXT } from '@/lib/krc';

// 오토 경로 목록·저장. 팀에 연결된 승인 회원만 저장. ?team=N은 그 팀 경로 중 내가 볼 수 있는 것 (Ghost용)
export const dynamic = 'force-dynamic';
const MAX = 300_000;   // 프로젝트 JSON 최대 크기
const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function GET(req: Request) {
  const me = await memberOf(req);
  const q = Number(new URL(req.url).searchParams.get('team'));
  if (q) {
    const list = await autos.ofTeam(q);
    const ok = await Promise.all(list.map((a) => canSee(a, me?.team_no ?? null)));
    return Response.json({ autos: list.filter((_, i) => ok[i]) });
  }
  if (!me) return bad('로그인해 주세요', 401);
  if (!me.team_no) return Response.json({ team: null, autos: [] });
  return Response.json({ team: me.team_no, autos: await autos.ofTeam(me.team_no) });
}

export async function POST(req: Request) {
  const me = await memberOf(req);
  if (!me?.team_no) return bad('팀에 연결된 회원만 저장할 수 있어요', 403);
  const b = await req.json().catch(() => null);
  const name = String(b?.name ?? '').trim().slice(0, 60);
  if (!name) return bad('경로 이름을 적어 주세요');
  if (!b?.project || typeof b.project !== 'object' || !Array.isArray(b.project.paths)) return bad('에디터 경로를 읽지 못했어요');
  if (JSON.stringify(b.project).length > MAX) return bad('경로가 너무 커요');
  const visibility = isVis(b.visibility) ? b.visibility : 'private';
  const id = await autos.create({ team: me.team_no, season: NEXT.season, name, project: b.project, visibility, share_teams: teamList(b.share_teams), created_by: me.email });
  if (visibility === 'public') refreshAutos(me.team_no);
  return Response.json({ ok: true, id });
}
