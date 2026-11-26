import { queueView, setArrival, manualCall, setTeamStatus } from '@/lib/calls';
import { queueOk, atParam } from '@/lib/auth';

// 심판 입장 체크: GET 대기 현황, POST {action:'arrive', match, team, on} | {action:'call', match, teams} | {action:'status', match, team, status(event|noshow|forfeit|null), note}
const STATUS = ['event', 'noshow', 'forfeit'] as const;
export const dynamic = 'force-dynamic';
const deny = () => Response.json({ error: 'PIN이 필요해요' }, { status: 401 });

// 심판 화면이 열려 있는 동안 10초마다 자동 호출도 같이 확인한다 (같은 호출은 한 번만 가므로 cron·노트북 예비와 겹쳐도 됨)
export async function GET(req: Request) {
  if (!queueOk(req)) return deny();
  try { return Response.json(await queueView(atParam(req), true)); }
  catch (e) { return Response.json({ error: (e as Error).message }, { status: 502 }); }
}

export async function POST(req: Request) {
  if (!queueOk(req)) return deny();
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === 'arrive' && typeof b.match === 'string' && Number.isInteger(b.team)) { await setArrival(b.match, b.team, !!b.on, atParam(req)); return Response.json({ ok: true }); }
    if (b.action === 'status' && typeof b.match === 'string' && Number.isInteger(b.team) && (b.status === null || STATUS.includes(b.status))) {
      await setTeamStatus(b.match, b.team, b.status, typeof b.note === 'string' ? b.note.trim() : '', atParam(req)); return Response.json({ ok: true });
    }
    if (b.action === 'call' && typeof b.match === 'string' && Array.isArray(b.teams)) return Response.json(await manualCall(b.match, b.teams.map(Number).filter(Number.isInteger), atParam(req)));
    return Response.json({ error: '잘못된 요청' }, { status: 400 });
  } catch (e) { return Response.json({ error: (e as Error).message }, { status: 500 }); }
}
