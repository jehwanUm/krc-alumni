import { members } from '@/lib/store';
import { checkPw, makeToken, setCookie } from '@/lib/member';

// 이메일·비밀번호 확인 → 승인된 회원만 30일 쿠키
export const dynamic = 'force-dynamic';
const fail = async (error: string, status: number) => { await new Promise((r) => setTimeout(r, 600)); return Response.json({ error }, { status }); };

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const m = await members.byEmail(String(b?.email ?? '').trim().toLowerCase());
  if (!m || !checkPw(String(b?.pw ?? ''), m.pw)) return fail('이메일 또는 비밀번호가 맞지 않아요', 401);
  if (m.status === 'pending') return fail('운영진이 가입 신청을 확인하고 있어요. 승인되면 로그인할 수 있어요', 403);
  if (m.status !== 'approved') return fail('가입이 승인되지 않았어요. 운영진에게 문의해 주세요', 403);
  return Response.json({ ok: true, name: m.name, admin: m.admin }, { headers: { 'Set-Cookie': setCookie(req, makeToken(m.id)) } });
}
