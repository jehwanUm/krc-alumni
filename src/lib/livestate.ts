// 대회 진행 상태 계산: Live 화면(브라우저)과 자동 호출(서버)이 같이 쓴다.
// 공식 데이터의 시각은 대회장(한국) 시각이라 +09:00

export type M = { level: string; no: number; series?: number; desc: string; label?: string; start: string | null; actual: string | null; posted: string | null; red: number[]; blue: number[]; redScore: number | null; blueScore: number | null; div: string };
export type Live = { event: any; divisions?: string[]; rankings: any[]; matches: M[]; updated: string; error?: string; arrived?: string[] };
export type Stage = 1 | 2;

export const T = (s: string | null | undefined) => (s ? Date.parse(s.slice(0, 19) + '+09:00') : NaN);
export const matchKey = (m: M) => `${m.div || ''}|${m.level}|${m.series ?? 0}|${m.no}`;
export const divsOf = (ms: M[]) => [...new Set(ms.map((m) => m.div || ''))];
export const inDiv = (ms: M[], v: string) => ms.filter((m) => (m.div || '') === v);

// 실제 진행 상태: 지금보다 먼저 시작한 경기 중 마지막 경기는 결과가 게시되기 전까지 '진행 중', 그 앞은 '끝남'
export function states(ms: M[], t: number) {
  const started = ms.filter((m) => T(m.actual) <= t);
  const lastStarted = started.reduce<M | null>((a, m) => (!a || T(m.actual) > T(a.actual) ? m : a), null);
  return (m: M): 'wait' | 'live' | 'done' => (!(T(m.actual) <= t) ? 'wait' : m === lastStarted && !(T(m.posted) <= t) ? 'live' : 'done');
}

// 리허설 전용: 실제 대회에서는 동맹 선택 전까지 본선 대진이 없다. 끝난 대회 데이터에는 미리 다 있으니,
// 그 구분의 예선이 끝나기 전 본선은 숨기고, 결승은 디비전 경기가 모두 끝나기 전까지 숨긴다.
export function hideFuturePlayoffs<D extends { matches: M[] }>(d: D, t: number): D {
  const allDone = (ms: M[]) => { const s = states(ms, t); return ms.length > 0 && ms.every((m) => s(m) === 'done'); };
  const qualsDone = (v: string) => allDone(d.matches.filter((m) => (m.div || '') === v && m.level === 'QUALIFICATION'));
  let ms = d.matches.filter((m) => m.level === 'QUALIFICATION' || m.div === '결승' || qualsDone(m.div || ''));
  const divsDone = [...new Set(ms.filter((m) => m.div !== '결승').map((m) => m.div || ''))].every((v) => allDone(ms.filter((m) => (m.div || '') === v)));
  ms = ms.filter((m) => m.div !== '결승' || divsDone);
  return { ...d, matches: ms };
}

// 자동 호출 시점: 1차 = 두 경기 앞 경기가 시작됐을 때, 2차 = 바로 앞 경기가 시작됐을 때.
// 그 구분의 첫 경기들은 앞 경기가 없으니 대진표 예정 시각 기준(1차 15분 전, 2차 5분 전).
export function dueStage(ms: M[], k: number, t: number, s = states(ms, t)): Stage | 0 {
  const m = ms[k];
  if (s(m) !== 'wait' || !(m.red.length + m.blue.length)) return 0;
  const started = (j: number) => s(ms[j]) !== 'wait';
  const before = (min: number) => T(m.start) - t <= min * 60e3;
  if (k >= 1 ? started(k - 1) : before(5)) return 2;
  if (k >= 2 ? started(k - 2) : before(15)) return 1;
  return 0;
}

// 지금 호출해야 할 (경기, 단계) 목록
export function dueCalls(matches: M[], t: number) {
  return divsOf(matches).flatMap((v) => {
    const ms = inDiv(matches, v), s = states(ms, t);
    return ms.map((m, k) => ({ m, stage: dueStage(ms, k, t, s) })).filter((x) => x.stage > 0) as { m: M; stage: Stage }[];
  });
}
