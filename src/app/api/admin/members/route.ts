import { members } from '@/lib/store';
import { readToken, cookieOf } from '@/lib/member';

// 운영진: 가입 신청 승인·거절. 승인된 관리자 회원만
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const id = readToken(cookieOf(req));
  const me = id ? await members.byId(id) : null;
  if (!me || me.status !== 'approved' || !me.admin) return Response.json({ error: '관리자만 할 수 있어요' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const status = b?.status;
  if (!['approved', 'rejected', 'pending'].includes(status) || !(await members.byId(String(b?.id ?? '')))) return Response.json({ error: '잘못된 요청이에요' }, { status: 400 });
  await members.decide(String(b.id), status, me.email);
  return Response.json({ ok: true });
}
