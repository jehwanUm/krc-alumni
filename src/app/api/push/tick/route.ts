import { runCalls } from '@/lib/calls';
import { cronOk, atParam } from '@/lib/auth';

// 자동 호출 한 번 실행. 대회 중 1분마다 부른다 (cron-job.org, 대회장 노트북 scripts/tick.mjs).
export const dynamic = 'force-dynamic';

async function run(req: Request) {
  if (!cronOk(req)) return Response.json({ error: '권한 없음' }, { status: 401 });
  try { return Response.json(await runCalls(atParam(req))); }
  catch (e) { return Response.json({ error: (e as Error).message }, { status: 500 }); }
}
export const GET = run;
export const POST = run;
