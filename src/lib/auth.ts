// 서버끼리·심판 화면 인증. 비밀 값은 환경변수에만 있다.
import { createHash, timingSafeEqual } from 'node:crypto';

const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

// 자동 호출 실행 주소: Authorization: Bearer <CRON_SECRET> (cron-job.org·Vercel Cron) 또는 ?key=
export function cronOk(req: Request) {
  const want = process.env.CRON_SECRET;
  if (!want) return false;
  const got = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? new URL(req.url).searchParams.get('key') ?? '';
  return same(got, want);
}

// 심판 화면: PIN이 맞으면 쿠키에 PIN에서 만든 값을 넣는다 (PIN을 바꾸면 기존 쿠키는 무효)
export const QUEUE_COOKIE = 'krc-queue';
export const queueToken = () => createHash('sha256').update(`queue:${process.env.QUEUE_PIN}:${process.env.CRON_SECRET}`).digest('hex');
export const pinOk = (pin: string) => !!process.env.QUEUE_PIN && same(pin, process.env.QUEUE_PIN);
export function queueOk(req: Request) {
  if (!process.env.QUEUE_PIN) return false;
  const c = req.headers.get('cookie') ?? '';
  const v = c.split(/;\s*/).find((x) => x.startsWith(QUEUE_COOKIE + '='))?.slice(QUEUE_COOKIE.length + 1) ?? '';
  return same(v, queueToken());
}

// 리허설 시각(?at=2026-01-31T11:15 한국 시각). 없으면 실제 시각.
export const atParam = (req: Request) => { const a = new URL(req.url).searchParams.get('at'); return a ? Date.parse(a.slice(0, 19) + '+09:00') || undefined : undefined; };
