import { members, signupLog } from '@/lib/store';
import { parseSignup, hashPw, ipHash, tooMany } from '@/lib/member';

// 회원가입 → 승인 대기. 스팸 막기: 숨은 칸(website)에 값이 있으면 봇, IP·전체 시간당 횟수 제한
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (b?.website) return Response.json({ ok: true });   // 봇: 성공한 척하고 저장 안 함
  const h = ipHash(req);
  const limit = tooMany(await signupLog.recent(new Date(Date.now() - 3600e3).toISOString()), h);
  if (limit) return Response.json({ error: limit }, { status: 429 });
  await signupLog.add(h);
  const { data, error } = parseSignup(b);
  if (!data) return Response.json({ error }, { status: 400 });
  const { pw, agree, ...rest } = data;
  const ok = await members.create({ ...rest, pw: hashPw(pw) });
  if (!ok) return Response.json({ error: '이미 가입한 이메일이에요. 로그인해 주세요' }, { status: 409 });
  return Response.json({ ok: true });
}
