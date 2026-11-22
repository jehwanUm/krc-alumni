import { members } from '@/lib/store';
import { parseSignup, hashPw } from '@/lib/member';

// 회원가입 → 승인 대기. 로그인은 운영진이 승인한 뒤에 된다
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { data, error } = parseSignup(await req.json().catch(() => null));
  if (!data) return Response.json({ error }, { status: 400 });
  const { pw, agree, ...rest } = data;
  const ok = await members.create({ ...rest, pw: hashPw(pw) });
  if (!ok) return Response.json({ error: '이미 가입한 이메일이에요. 로그인해 주세요' }, { status: 409 });
  return Response.json({ ok: true });
}
