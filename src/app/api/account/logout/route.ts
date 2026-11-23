import { setCookie } from '@/lib/member';

export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': setCookie(req, '', 0) } });
}
