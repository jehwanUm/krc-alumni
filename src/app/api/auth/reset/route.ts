import { members } from '@/lib/store';
import { resetHash, hashPw, pwError } from '@/lib/member';

// 관리자가 만든 재설정 링크로 새 비밀번호 설정. 링크는 한 번만, 30분 안에
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const t = String(b?.t ?? '');
  const m = t.length >= 20 ? await members.byResetHash(resetHash(t)) : null;
  if (!m || !m.reset_exp || Date.parse(m.reset_exp) < Date.now()) return Response.json({ error: '링크가 만료됐거나 이미 사용됐어요. 운영진에게 새 링크를 요청해 주세요' }, { status: 400 });
  const e = pwError(b?.pw);
  if (e) return Response.json({ error: e }, { status: 400 });
  await members.update(m.id, { pw: hashPw(String(b.pw)), sess: (m.sess ?? 0) + 1, reset_hash: null, reset_exp: null, fails: 0, locked_until: null });
  return Response.json({ ok: true });
}
