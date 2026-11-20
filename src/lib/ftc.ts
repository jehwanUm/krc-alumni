// FTC Events API (FIRST 공식) 읽기 전용 클라이언트. 서버에서만 쓴다: 토큰이 브라우저로 나가면 안 된다.
// 문서: https://ftc-events.firstinspires.org/api · 인증: Basic base64(사용자이름:토큰)
// 조건: 상업적 목적 사용 금지 (plan-v0 쟁점 2).

const BASE = 'https://ftc-api.firstinspires.org/v2.0';

export type Cfg = { user: string; token: string; season: number; event: string };
type Fetch = typeof fetch;

// season은 시즌 시작 연도(2026–27 시즌 = 2026). KRC 코드는 매 시즌 KRCMP (2022~2025 확인). 2026 시즌 대회가 공식 시스템에 생기기 전까지는 가장 최근 KRC(2025 KRCMP)로 개발한다.
export function config(env: Record<string, string | undefined> = process.env): Cfg {
  return {
    user: env.FTC_API_USER ?? '',
    token: env.FTC_API_TOKEN ?? '',
    season: Number(env.KRC_SEASON ?? 2025),
    event: (env.KRC_EVENT_CODE ?? 'KRCMP').toUpperCase(),
  };
}

export class FtcError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function ftc(path: string, cfg: Cfg, f: Fetch = fetch): Promise<any> {
  if (!cfg.user || !cfg.token) throw new FtcError('FTC API 토큰이 설정되지 않았어요 (FTC_API_USER, FTC_API_TOKEN)', 0);
  const res = await f(BASE + path, {
    headers: { Authorization: 'Basic ' + btoa(`${cfg.user}:${cfg.token}`), Accept: 'application/json' },
  });
  if (!res.ok) throw new FtcError(`FTC API ${res.status} ${path}`, res.status);
  return res.json();
}

const enc = encodeURIComponent;

export async function getEvent(c: Cfg, f?: Fetch) {
  const d = await ftc(`/${c.season}/events?eventCode=${enc(c.event)}`, c, f);
  return d.events?.[0] ?? null;
}

// 팀 목록은 페이지로 나뉘어 온다
export async function getTeams(c: Cfg, f?: Fetch) {
  const teams: any[] = [];
  for (let page = 1; ; page++) {
    const d = await ftc(`/${c.season}/teams?eventCode=${enc(c.event)}&page=${page}`, c, f);
    teams.push(...(d.teams ?? []));
    if (!d.pageTotal || page >= d.pageTotal) return teams;
  }
}

// 그 시즌에 없던 팀 번호는 400이 온다 → 없음으로
const none400 = (e: unknown) => { if (e instanceof FtcError && e.status === 400) return {}; throw e; };

export async function getTeam(c: Cfg, number: number, f?: Fetch) {
  const d = await ftc(`/${c.season}/teams?teamNumber=${number}`, c, f).catch(none400);
  return d.teams?.[0] ?? null;
}

export async function getRankings(c: Cfg, f?: Fetch) {
  const d = await ftc(`/${c.season}/rankings/${enc(c.event)}`, c, f);
  return d.rankings ?? d.Rankings ?? [];
}

// hybrid = 일정 + 끝난 경기 점수. level: qual(예선) | playoff(본선)
export async function getSchedule(c: Cfg, level: 'qual' | 'playoff', f?: Fetch) {
  const d = await ftc(`/${c.season}/schedule/${enc(c.event)}/${level}/hybrid`, c, f);
  return d.schedule ?? [];
}

// 경기 세부 점수 (동맹 단위): 오토·텔레옵·페널티와 랭킹 포인트.
// 페널티 = 상대가 저지른 반칙으로 받은 점수 (상대의 foulPointsCommitted). 2025–26 실제 데이터 90/90 확인.
// RP = 승리 3 · 무승부 1 + 보너스 RP(시즌마다 이름이 다름, '...RP' 항목, 영문 그대로 표시). 예선에만.
export type Side = { auto: number; tele: number; pen: number; minor: number; major: number; rp: number | null; rpItems: string[] };
export type Breakdown = { red: Side; blue: Side };
export function toBreakdown(ms: any, qual: boolean): Breakdown | null {
  const by = Object.fromEntries((ms.alliances ?? []).map((a: any) => [String(a.alliance).toLowerCase(), a]));
  if (!by.red || !by.blue) return null;
  const side = (a: any, o: any): Side => {
    const bonus = Object.keys(a).filter((k) => /RP$/.test(k) && a[k] === true);
    const res = a.totalPoints > o.totalPoints ? 3 : a.totalPoints === o.totalPoints ? 1 : 0;
    return { auto: a.autoPoints ?? 0, tele: a.teleopPoints ?? 0, pen: o.foulPointsCommitted ?? 0, minor: a.minorFouls ?? 0, major: a.majorFouls ?? 0,
      rp: qual ? res + bonus.length : null, rpItems: qual ? [...(res === 3 ? ['승리'] : res === 1 ? ['무승부'] : []), ...bonus.map((k) => `${k.replace(/RP$/, '').replace(/^./, (c) => c.toUpperCase())} RP`)] : [] };
  };
  return { red: side(by.red, by.blue), blue: side(by.blue, by.red) };
}

// 일정(hybrid) + 세부 점수를 합친 경기 목록. 세부 점수를 못 받아도 경기 목록은 돌려준다.
export async function getMatches(c: Cfg, level: 'qual' | 'playoff', f?: Fetch) {
  const [sched, sc] = await Promise.all([getSchedule(c, level, f), ftc(`/${c.season}/scores/${enc(c.event)}/${level}`, c, f).catch(() => ({}))]);
  const bd = new Map((sc.matchScores ?? []).map((x: any) => [`${x.matchSeries ?? 0}-${x.matchNumber}`, toBreakdown(x, level === 'qual')]));
  return sched.map((m: any) => ({ ...toMatch(m), bd: bd.get(`${m.series ?? 0}-${m.matchNumber}`) ?? null }));
}

// 화면에 필요한 모양으로 줄인다: 경기 번호, 예정 시각, 빨강/파랑 팀, 점수
// 공식 경기 이름(영문)을 한글로. 모르는 형식은 그대로.
export function koDesc(desc: string | null | undefined): string {
  const d = String(desc ?? '').replace(/\s+/g, ' ').trim();   // 공식 데이터에 띄어쓰기가 두 칸인 이름이 있음
  let x: RegExpMatchArray | null;
  if ((x = d.match(/^Qualification (\d+)$/))) return `예선 ${x[1]}`;
  if ((x = d.match(/^(Upper|Lower) Bracket Round (\d+) Match (\d+)$/))) return `본선 ${x[1] === 'Upper' ? '승자조' : '패자조'} ${x[2]}라운드 · ${x[3]}경기`;
  if ((x = d.match(/^Final Bracket Round \d+ Match (\d+)$/))) return `본선 결승 라운드 · ${x[1]}경기`;
  if ((x = d.match(/^Finals?(?: Match)? (\d+)$/))) return `결승 ${x[1]}`;
  if ((x = d.match(/^Semifinal (\d+)(?: Match (\d+))?$/))) return `준결승 ${x[1]}${x[2] ? ` · ${x[2]}경기` : ''}`;
  return d;
}

export function toMatch(m: any) {
  const side = (s: string) => (m.teams ?? []).filter((t: any) => String(t.station ?? '').startsWith(s)).map((t: any) => t.teamNumber);
  return {
    level: m.tournamentLevel, no: m.matchNumber, series: m.series ?? 0, desc: m.description, label: koDesc(m.description),
    start: m.startTime ?? null, red: side('Red'), blue: side('Blue'),
    redScore: m.scoreRedFinal ?? null, blueScore: m.scoreBlueFinal ?? null,
    actual: m.actualStartTime ?? null, posted: m.postResultTime ?? null, // 실제 시작·결과 게시 시각 (실제 진행 계산용)
  };
}

// KRC는 2024 시즌부터 디비전 2개(예선·디비전 본선)와 본 대회(KRCMP: 결승)로 나뉜다.
// 디비전은 시즌 전체 대회 목록에서 divisionCode로 찾고, 자주 바뀌지 않으니 6시간 기억한다. 목록을 못 받으면 디비전 없이 간다.
const divCache = new Map<string, { at: number; list: any[] }>();
// 시즌 전체 대회 목록(약 1,300개, 1MB 넘음)은 자주 안 바뀌니 6시간 기억한다
export async function getSeasonEvents(c: Cfg, season: number, f?: Fetch): Promise<any[]> {
  const hit = divCache.get(String(season));
  if (hit && Date.now() - hit.at < 6 * 3600e3) return hit.list;
  const list = (await ftc(`/${season}/events`, { ...c, season }, f)).events ?? [];
  divCache.set(String(season), { at: Date.now(), list });
  return list;
}
export async function getDivisions(c: Cfg, f?: Fetch): Promise<any[]> {
  try { return (await getSeasonEvents(c, c.season, f)).filter((e: any) => e.divisionCode === c.event); } catch { return []; }
}
// KRC 디비전 이름은 해마다 영문 표기가 달라서(Jang Yeong-sil / JangYeongsil) 한글로 맞춘다
const KO_DIV: Record<string, string> = { jangyeongsil: '장영실', kingsejong: '세종대왕' };
export const divName = (e: any) => {
  const en = (String(e.name).split(' - ')[1] ?? e.code).replace(/ Division$/, '');
  return KO_DIV[en.replace(/[^a-z]/gi, '').toLowerCase()] ?? en;
};

async function part(c: Cfg, div: string, f?: Fetch) {
  const [rankings, qual, playoff, al] = await Promise.all([getRankings(c, f), getMatches(c, 'qual', f), getMatches(c, 'playoff', f),
    ftc(`/${c.season}/alliances/${enc(c.event)}`, c, f).catch(() => ({}))]);
  const cap = al.count || null;   // 본선 동맹 수 = Captain 순위 (동맹 선택 전에는 없음)
  return {
    rankings: rankings.map((r: any) => ({ div, rank: r.rank, team: r.teamNumber, name: r.teamName, wins: r.wins, losses: r.losses, ties: r.ties, played: r.matchesPlayed, cap })),
    matches: [...qual, ...playoff].map((m: any) => ({ ...m, div })),
  };
}

export async function getLive(c: Cfg, f?: Fetch) {
  // 본 대회 데이터는 디비전 목록을 기다리지 않고 같이 받는다
  const [event, divs, main] = await Promise.all([getEvent(c, f), getDivisions(c, f), part(c, '', f)]);
  const sub = await Promise.all(divs.map((d) => part({ ...c, event: d.code }, divName(d), f)));
  if (divs.length) main.matches.forEach((m) => (m.div = '결승'));
  return {
    event: event && { code: event.code, name: event.name, venue: event.venue, start: event.dateStart, end: event.dateEnd },
    divisions: divs.map(divName),
    // 디비전이 있으면 순위는 디비전에서 매긴다 (본 대회 순위표는 경기 수 0)
    rankings: divs.length ? sub.flatMap((p) => p.rankings) : main.rankings,
    matches: [...sub.flatMap((p) => p.matches), ...main.matches],
    updated: new Date().toISOString(),
  };
}

// 공식 사이트에 KRC가 있는 시즌 (2022–23부터, 코드는 매 시즌 KRCMP). shortcut: 새 시즌이 끝나면 여기에 추가
export const KRC_SEASONS = [2022, 2023, 2024, 2025];

// 팀의 시즌별 KRC 기록: 디비전, 예선 순위·승패, KRC 수상, 같은 시즌 FIRST Championship(세계 대회) 출전 여부
export async function getKrcHistory(c: Cfg, team: number, f?: Fetch, seasons = KRC_SEASONS) {
  const rows = await Promise.all(seasons.map(async (season) => {
    const s = { ...c, season };
    const evs: any[] = (await ftc(`/${season}/events?teamNumber=${team}`, s, f).catch(none400)).events ?? [];
    const krc = evs.filter((e) => String(e.code).startsWith('KRCMP'));
    if (!krc.length) return null;
    const div = krc.find((e) => e.divisionCode);
    const code = enc(div?.code ?? 'KRCMP');
    const [r, aw, al] = await Promise.all([
      ftc(`/${season}/rankings/${code}?teamNumber=${team}`, s, f).catch(none400),
      ftc(`/${season}/awards/${team}`, s, f).catch(none400),
      ftc(`/${season}/alliances/${code}`, s, f).catch(() => ({})),
    ]);
    const rk = r.rankings?.[0];
    return {
      season,
      division: div ? divName(div) : null,
      rank: rk?.rank ?? null,
      record: rk ? `${rk.wins}-${rk.losses}-${rk.ties}` : null,
      // 본선 동맹 수 = 예선 순위로 캡틴이 될 수 있는 등수 (KRC 디비전 6, 2023–24는 4). 모르면 null
      captains: al.count ?? al.alliances?.length ?? null,
      awards: (aw.awards ?? []).filter((a: any) => String(a.eventCode).startsWith('KRCMP')).map((a: any) => String(a.name).replace(/<[^>]+>/g, '')),
      worlds: evs.some((e) => String(e.code).startsWith('FTCCMP')),
    };
  }));
  return rows.filter((x) => x !== null).sort((a, b) => b.season - a.season);
}

// 지난 KRC 예선 대회 (디비전 2개가 생긴 2024 시즌부터는 디비전별). 지난 시즌은 바뀌지 않으니 적어 두고, 새 시즌은 getDivisions로 찾는다.
const KRC_QUAL: Record<number, { code: string; div: string | null }[]> = {
  2022: [{ code: 'KRCMP', div: null }],
  2023: [{ code: 'KRCMP', div: null }],
  2024: [{ code: 'KRCMPJYS', div: '장영실' }, { code: 'KRCMPKSJ', div: '세종대왕' }],
  2025: [{ code: 'KRCMPJYSD', div: '장영실' }, { code: 'KRCMPKSJD', div: '세종대왕' }],
};
export async function qualEvents(c: Cfg, season: number, f?: Fetch) {
  if (KRC_QUAL[season]) return KRC_QUAL[season];
  const divs = await getDivisions({ ...c, season, event: 'KRCMP' }, f);
  return divs.length ? divs.map((d) => ({ code: d.code as string, div: divName(d) })) : [{ code: 'KRCMP', div: null }];
}

export type SeasonResult = { div: string | null; rank: number | null; rec: string | null; cap: number | null; awards: string[]; worlds: boolean };

// 한 시즌 KRC 결과를 팀 번호별로: 디비전·예선 순위·Captain 기준(본선 동맹 수)·KRC 수상·세계 대회 출전
export async function getSeasonResults(c: Cfg, season: number, f?: Fetch): Promise<Record<number, SeasonResult>> {
  const s = { ...c, season, event: 'KRCMP' };
  const res: Record<number, SeasonResult> = {};
  const blank = (): SeasonResult => ({ div: null, rank: null, rec: null, cap: null, awards: [], worlds: false });
  for (const e of await qualEvents(c, season, f)) {
    const [r, al] = await Promise.all([
      ftc(`/${season}/rankings/${enc(e.code)}`, s, f).catch(none400),
      ftc(`/${season}/alliances/${enc(e.code)}`, s, f).catch(() => ({})),
    ]);
    for (const x of r.rankings ?? []) res[x.teamNumber] = { ...blank(), div: e.div, rank: x.rank, rec: `${x.wins}-${x.losses}-${x.ties}`, cap: al.count ?? null };
  }
  const [aw, worlds] = await Promise.all([
    ftc(`/${season}/awards/KRCMP`, s, f).catch(none400),
    getTeams({ ...s, event: 'FTCCMP1' }, f).catch(() => []),
  ]);
  for (const a of aw.awards ?? []) if (a.teamNumber) (res[a.teamNumber] ??= blank()).awards.push(String(a.name).replace(/<[^>]+>/g, ''));
  for (const t of worlds) if (res[t.teamNumber]) res[t.teamNumber].worlds = true;
  return res;
}

// 팀 한 곳의 KRC 경기: 그 시즌 예선 대회(디비전)와 본 대회(결승)의 예선·본선 경기 중 이 팀이 나온 것
export async function getTeamMatches(c: Cfg, team: number, season: number, f?: Fetch) {
  const s = { ...c, season, event: 'KRCMP' };
  const q = await qualEvents(c, season, f);
  const evs = q.some((e) => e.code !== 'KRCMP') ? [...q, { code: 'KRCMP', div: '결승' }] : q;
  const lists = await Promise.all(evs.flatMap((e) => (['qual', 'playoff'] as const).map(async (lvl) =>
    (await getMatches({ ...s, event: e.code }, lvl, f).catch(() => [])).map((m: any) => ({ ...m, div: e.div })))));
  return lists.flat().filter((m: any) => m.red.includes(team) || m.blue.includes(team));
}

// 한 시즌의 한국 FTC 대회 (디비전 대회는 본 대회에 묶음). 결과가 공식 시스템에 올라왔는지도 본다.
export async function getKoreanEvents(c: Cfg, season: number, f?: Fetch) {
  const all = await getSeasonEvents(c, season, f);
  const evs = all.filter((e: any) => e.regionCode === 'KR' && !e.divisionCode);
  const rows = await Promise.all(evs.map(async (e: any) => {
    const s = { ...c, season, event: e.code };
    const [teams, q, p] = await Promise.all([getTeams(s, f).catch(() => []), getSchedule(s, 'qual', f).catch(() => []), getSchedule(s, 'playoff', f).catch(() => [])]);
    const hasDiv = all.some((d: any) => d.divisionCode === e.code);
    return { code: e.code as string, name: e.name as string, type: e.typeName as string, venue: String(e.venue ?? '').trim(), city: e.city as string,
      start: e.dateStart as string, end: e.dateEnd as string, teams: teams.length, results: q.length + p.length > 0 || hasDiv };
  }));
  return rows.sort((a, b) => a.start.localeCompare(b.start));
}

// 지난 KRC 한 시즌 요약: 결승, 디비전 우승·결승 동맹, 세계 대회 진출, 수상, 디비전 순위
export async function getEventSummary(c: Cfg, season: number, f?: Fetch) {
  const s = { ...c, season, event: 'KRCMP' };
  const q = await qualEvents(c, season, f);
  const [ev, teams, playoff, aw, worlds, divs] = await Promise.all([
    getEvent(s, f), getTeams(s, f), getSchedule(s, 'playoff', f).catch(() => []),
    ftc(`/${season}/awards/KRCMP`, s, f).catch(none400), getTeams({ ...s, event: 'FTCCMP1' }, f).catch(() => []),
    Promise.all(q.map(async (e) => {
      const [r, al] = await Promise.all([ftc(`/${season}/rankings/${enc(e.code)}`, s, f).catch(none400), ftc(`/${season}/alliances/${enc(e.code)}`, s, f).catch(() => ({}))]);
      return { div: e.div, cap: al.count ?? null, rows: (r.rankings ?? []).map((x: any) => ({ rank: x.rank, team: x.teamNumber, rec: `${x.wins}-${x.losses}-${x.ties}` })) };
    })),
  ]);
  const names: Record<number, string> = Object.fromEntries(teams.map((t: any) => [t.teamNumber, String(t.nameShort ?? '').trim()]));
  const awards = (aw.awards ?? []).filter((a: any) => a.teamNumber).map((a: any) => ({ name: String(a.name).replace(/<[^>]+>/g, ''), team: a.teamNumber as number }));
  const who = (re: RegExp) => awards.filter((a: any) => re.test(a.name)).map((a: any) => a.team);
  const finals = playoff.map(toMatch).filter((m: any) => /^Final/.test(m.desc ?? ''));
  const win = who(/^Winning Alliance/), lose = who(/^Finalist Alliance/);
  const winRed = finals[0] ? win.some((t: number) => finals[0].red.includes(t)) : true;
  // 디비전 우승·결승: "<디비전> Division Winning Alliance - ..." 수상에서
  const divNames = [...new Set(awards.map((a: any) => a.name.match(/^(.+) Division (Winning|Finalist) Alliance/)?.[1]).filter(Boolean))] as string[];
  const divWinners = divNames.map((en) => ({ div: divName({ name: `x - ${en} Division` }), win: who(new RegExp(`^${en} Division Winning Alliance`)), fin: who(new RegExp(`^${en} Division Finalist Alliance`)) }));
  // 수상: 동맹·봉사 상은 빼고, 상 이름별로 1위와 2위
  const groups = new Map<string, { first: number[]; second: number[] }>();
  for (const a of awards) {
    if (/Alliance|Volunteer/.test(a.name)) continue;
    const base = a.name.replace(/ (2nd|3rd) Place$/, '').replace(/ sponsored by .+$/, '');
    const g = groups.get(base) ?? { first: [], second: [] }; groups.set(base, g);
    if (/2nd Place$/.test(a.name)) g.second.push(a.team); else if (!/3rd Place$/.test(a.name)) g.first.push(a.team);
  }
  return {
    season, name: ev?.name as string, venue: String(ev?.venue ?? '').trim(), start: ev?.dateStart as string, end: ev?.dateEnd as string, teamCount: teams.length, names,
    finals: { win, lose, games: finals.map((m: any) => ({ desc: m.desc, win: winRed ? m.redScore : m.blueScore, lose: winRed ? m.blueScore : m.redScore })) },
    divWinners, worlds: worlds.map((t: any) => t.teamNumber).filter((n: number) => names[n]),
    awards: [...groups].map(([name, g]) => ({ name, ...g })),
    rankings: divs.filter((d) => d.rows.length),
  };
}
