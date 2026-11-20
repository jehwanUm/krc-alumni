import { config, getLive, FtcError } from '../../../lib/ftc';
import { liveCfg } from '../../../lib/krc';
import { arrivals } from '../../../lib/store';
import { eventId } from '../../../lib/calls';

// 대회 Live 데이터. 브라우저는 이 주소만 부르고, FTC 토큰은 서버에만 있다.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const c = liveCfg(config());
    // 심판이 체크한 대기석 도착 (경기|팀). 저장소가 안 되면 빼고 보낸다
    const [data, arrived] = await Promise.all([getLive(c), arrivals.list(eventId(c)).then((a) => a.map((x) => `${x.match}|${x.team}`)).catch(() => [])]);
    // CDN이 30초 동안 같은 응답을 나눠 준다 → 접속자가 많아도 FTC API 호출은 30초에 한 번
    return Response.json({ ...data, arrived }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' } });
  } catch (e) {
    const status = e instanceof FtcError ? e.status : -1;
    return Response.json({ error: (e as Error).message, status }, { status: status === 0 ? 503 : 502 });
  }
}
