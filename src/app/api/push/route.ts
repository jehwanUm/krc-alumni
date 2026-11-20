import { subs } from '@/lib/store';
import { publicKey } from '@/lib/push';

// 휴대폰 호출 구독: GET 공개 키, POST {team, sub} 등록(같은 휴대폰은 팀만 바뀜), DELETE {endpoint} 해제
export const dynamic = 'force-dynamic';

export function GET() { return Response.json({ key: publicKey() }); }

export async function POST(req: Request) {
  const { team, sub } = await req.json().catch(() => ({}));
  const n = Number(team);
  if (!Number.isInteger(n) || n <= 0 || n > 999999 || typeof sub?.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth)
    return Response.json({ error: '잘못된 요청' }, { status: 400 });
  await subs.put(n, { endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json().catch(() => ({}));
  if (typeof endpoint !== 'string') return Response.json({ error: '잘못된 요청' }, { status: 400 });
  await subs.del(endpoint);
  return Response.json({ ok: true });
}
