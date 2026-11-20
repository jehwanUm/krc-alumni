import { pinOk, queueToken, QUEUE_COOKIE } from '@/lib/auth';

// 심판 PIN 확인 → 12시간 쿠키
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { pin } = await req.json().catch(() => ({}));
  if (!pinOk(String(pin ?? ''))) { await new Promise((r) => setTimeout(r, 800)); return Response.json({ error: 'PIN이 맞지 않아요' }, { status: 401 }); }
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': `${QUEUE_COOKIE}=${queueToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}` } });
}
