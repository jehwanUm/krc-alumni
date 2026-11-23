import { revalidatePath } from 'next/cache';
import { teamProfiles } from '@/lib/store';
import { memberOf } from '@/lib/session';

// 운영진: 팀이 바꾼 후원사 확인
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const me = await memberOf(req);
  if (!me?.admin) return Response.json({ error: '관리자만 할 수 있어요' }, { status: 403 });
  const n = Number((await req.json().catch(() => ({})))?.team);
  if (!Number.isInteger(n) || !(await teamProfiles.get(n))) return Response.json({ error: '팀을 찾지 못했어요' }, { status: 400 });
  await teamProfiles.checkSponsors(n);
  revalidatePath(`/teams/${n}`);
  return Response.json({ ok: true });
}
