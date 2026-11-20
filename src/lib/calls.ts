// 경기 호출: 자동(1차·2차)과 심판 수동 호출, 심판 화면에 보여 줄 대기 현황.
import { config, getLive, koDesc, type Cfg } from './ftc';
import { liveCfg } from './krc';
import { dueCalls, hideFuturePlayoffs, matchKey, states, divsOf, inDiv, type M, type Stage } from './livestate';
import { arrivals, log, type LogRow } from './store';
import { sendToTeams, type Payload } from './push';

export const eventId = (c: Cfg) => `${c.season}/${c.event}`;
const label = (m: M) => m.label ?? koDesc(m.desc);

// at: 리허설(지난 대회 재생)일 때 그 시각. 실제 대회는 지금.
async function liveAt(at?: number) {
  const c = liveCfg(config());
  const t = at ?? Date.now();
  let d = await getLive(c);
  if (at) d = hideFuturePlayoffs(d, t);
  return { c, ev: eventId(c), t, d: d as typeof d & { matches: M[] } };
}

// 알림 본문: 「지금 장영실 디비전 블루 동맹으로 입장해주세요.」 (디비전 없는 대회는 디비전 빼고, 결승은 「결승」)
export const enterText = (m: M, team: number) => {
  const where = !m.div ? '' : m.div === '결승' ? '결승 ' : `${m.div} 디비전 `;
  return `지금 ${where}${m.red.includes(team) ? '레드' : '블루'} 동맹으로 입장해주세요.`;
};

function payload(m: M, team: number, stage: Stage | 'manual'): Payload {
  const title = `[${label(m)}] ${stage === 1 ? '2경기 남았어요' : stage === 2 ? '다음 경기예요!' : '지금 바로 와 주세요!'}`;
  return { title, body: enterText(m, team), url: `/live?team=${team}`, tag: `call-${matchKey(m)}` };
}

const arrivedSet = async (ev: string) => new Set((await arrivals.list(ev)).map((a) => `${a.match}|${a.team}`));

// 자동 호출: 지금 보낼 차례인데 아직 안 보냈고, 대기석에 도착하지 않은 팀에게만
export const runCalls = async (at?: number) => callsOn(await liveAt(at));
async function callsOn({ ev, t, d }: Awaited<ReturnType<typeof liveAt>>) {
  const due = dueCalls(d.matches, t);
  const here = await arrivedSet(ev);
  const rows: LogRow[] = due.flatMap(({ m, stage }) => [...m.red, ...m.blue].filter((n) => !here.has(`${matchKey(m)}|${n}`))
    .map((n) => ({ key: `${ev}|${matchKey(m)}|${stage}|${n}`, event: ev, match: matchKey(m), team: n, stage: String(stage) as '1' | '2', at: new Date(t).toISOString() })));
  const fresh = await log.addNew(rows);
  const byKey = new Map(due.map((x) => [matchKey(x.m), x]));
  let phones = 0;
  for (const r of fresh) { const x = byKey.get(r.match)!; phones += await sendToTeams([r.team], (n) => payload(x.m, n, x.stage)); }
  return { event: ev, due: due.map((x) => `${label(x.m)}:${x.stage}`), called: fresh.map((r) => `${r.team}@${r.match}:${r.stage}`), phones };
}

// 심판 수동 호출
export async function manualCall(match: string, teams: number[], at?: number) {
  const { ev, t, d } = await liveAt(at);
  const m = d.matches.find((x) => matchKey(x) === match);
  if (!m) throw new Error('경기를 찾을 수 없어요');
  const ok = teams.filter((n) => m.red.includes(n) || m.blue.includes(n));
  await log.addNew(ok.map((n) => ({ key: `${ev}|${match}|manual|${n}|${t}`, event: ev, match, team: n, stage: 'manual', at: new Date(t).toISOString() })));
  const phones = await sendToTeams(ok, (n) => payload(m, n, 'manual'));
  return { teams: ok, phones };
}

export async function setArrival(match: string, team: number, on: boolean, at?: number) {
  await arrivals.set(eventId(liveCfg(config())), match, team, on, at);
}

// 심판 화면: 구분(디비전)마다 진행 중 경기 + 다음 5경기, 팀별 도착·호출 시각
// tick: 심판 화면을 부를 때 자동 호출도 같이 (FTC 데이터는 한 번만 받는다)
export async function queueView(at?: number, tick = false) {
  const live = await liveAt(at);
  if (tick) await callsOn(live).catch((e) => console.error('자동 호출 실패', e));
  const { ev, t, d } = live;
  // 리허설로 시각을 되돌렸을 때 그 뒤에 기록된 호출은 안 보이게
  // 저장소가 끊겨도 경기 목록은 보여 준다 (도착·호출 기록만 빠지고 화면에 경고)
  let store = '';
  const fail = (e: unknown) => { store = (e as Error).message; return [] as never[]; };
  const [arr, logs] = await Promise.all([arrivals.list(ev).catch(fail), log.list(ev).then((ls) => ls.filter((x) => Date.parse(x.at) <= t)).catch(fail)]);
  const names: Record<number, string> = Object.fromEntries((d.rankings ?? []).map((r: any) => [r.team, r.name]));
  const divs = divsOf(d.matches).map((v) => {
    const ms = inDiv(d.matches, v), s = states(ms, t);
    const live = ms.filter((m) => s(m) === 'live');
    const next = ms.filter((m) => s(m) === 'wait').slice(0, 5);
    return { div: v, matches: [...live, ...next].map((m) => {
      const k = matchKey(m);
      const team = (n: number) => {
        const a = arr.find((x) => x.match === k && x.team === n);
        const ls = logs.filter((x) => x.match === k && x.team === n);
        return { n, name: names[n] ?? '', arrived: a?.at ?? null, firstCall: ls[0]?.at ?? null };
      };
      return { key: k, label: label(m), state: s(m), start: m.start, actual: m.actual, red: m.red.map(team), blue: m.blue.map(team),
        calls: logs.filter((x) => x.match === k).reduce<Record<string, { at: string; teams: number[] }>>((acc, x) => {
          const g = x.stage === 'manual' ? `수동 ${x.at}` : `${x.stage}차`;
          (acc[g] ??= { at: x.at, teams: [] }).teams.push(x.team);
          return acc;
        }, {}) };
    }) };
  });
  return { event: d.event, now: new Date(t).toISOString(), divisions: divs, store };
}
