import type { Cfg } from './ftc';

// 다음 KRC와 지난 KRC. 대회 날(한국 시각)에는 대회 페이지가 Live 화면이 된다.
export const NEXT = { name: 'KRC 2027', season: 2026, start: '2027-01-29', end: '2027-01-30' };
export const LAST_SEASON = 2025;
const KST = (d: string) => Date.parse(`${d}T00:00:00+09:00`);

// KRC가 아닌 대회(예: 시험 운영 대회)를 Live로 띄울 때만 설정: LIVE_EVENT=2026/KRXXX, LIVE_DATES=2026-11-21 (여러 날이면 2026-11-21~2026-11-22)
// 팀 목록·팀 페이지는 계속 KRC_SEASON·KRC_EVENT_CODE를 쓴다.
export type LiveEvent = { season: number; event: string; start: string; end: string };
// 2026–27 시즌 국내 지역 대회 (FTC 공식 시스템 등록, 2026-11-19 확인). 그날(한국 시각)이 되면 설정 없이 Live로 띄운다.
// shortcut: 날짜가 바뀌거나 대회가 새로 등록되면 여기를 고친다
// title: 공식 대회 이름 (FTC 공식 데이터), city: 지역, sponsor: 후원 (엄제환 확인한 것만)
export const REGIONALS: (LiveEvent & { title: string; city: string; sponsor?: string })[] = [
  { season: 2026, event: 'KRYON', start: '2026-11-21', end: '2026-11-21', title: 'Advance Insights Challenge', city: '용인', sponsor: 'KLA Foundation 장학팀 참가 대회' },
  { season: 2026, event: 'KRYEN', start: '2026-11-28', end: '2026-11-28', title: 'Yeongju Robot Challenge', city: '영주' },
  { season: 2026, event: 'KRWGN', start: '2026-12-19', end: '2026-12-19', title: 'Jeonra Region Tournament', city: '완주' },
];
export function liveEvent(env: Record<string, string | undefined> = process.env, now = Date.now()): LiveEvent | null {
  const e = String(env.LIVE_EVENT ?? '').trim().match(/^(\d{4})\/(\w+)$/);
  const d = String(env.LIVE_DATES ?? '').trim().match(/^(\d{4}-\d\d-\d\d)(?:~(\d{4}-\d\d-\d\d))?$/);
  if (e && d) return { season: Number(e[1]), event: e[2].toUpperCase(), start: d[1], end: d[2] ?? d[1] };
  return REGIONALS.find((r) => now >= KST(r.start) && now < KST(r.end) + 864e5) ?? null;
}
// Live 화면이 불러올 대회: 설정한 대회가 있으면 그 대회, 없으면 KRC
export const liveCfg = (c: Cfg, ev = liveEvent()): Cfg => (ev ? { ...c, season: ev.season, event: ev.event } : c);

export const isEventDay = (now = Date.now(), ev = liveEvent(process.env, now)) => {
  const { start, end } = ev ?? NEXT;
  return now >= KST(start) && now < KST(end) + 864e5;
};
export const daysToNext = (now = Date.now()) => Math.ceil((KST(NEXT.start) - now) / 864e5);
