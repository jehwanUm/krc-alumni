// node --test test/  (Node 24: .ts를 그대로 실행)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config, ftc, getTeams, getLive, getKrcHistory, divName, toBreakdown, koDesc, FtcError } from '../src/lib/ftc.ts';

const cfg = config({ FTC_API_USER: 'u', FTC_API_TOKEN: 't', KRC_SEASON: '2023', KRC_EVENT_CODE: 'krcmp' });

// 주소별 응답을 돌려주는 가짜 fetch. 형식만 흉내 낸 테스트용 값이고 실제 대회 결과가 아니다.
function fake(routes: Record<string, any>, seen: string[] = []) {
  return (async (url: string, init: any) => {
    seen.push(url + ' ' + init.headers.Authorization);
    const key = Object.keys(routes).find((k) => url.endsWith(k));
    if (!key) return new Response('nf', { status: 404 });
    if (routes[key] === 400) return new Response('bad', { status: 400 });
    return new Response(JSON.stringify(routes[key]), { status: 200 });
  }) as typeof fetch;
}

test('config 기본값과 대문자 대회 코드', () => {
  assert.equal(cfg.event, 'KRCMP');
  assert.equal(config({}).season, 2025);
  assert.equal(config({}).token, '');
});

test('토큰 없으면 요청하지 않고 FtcError', async () => {
  await assert.rejects(ftc('/x', config({}), fake({})), (e: any) => e instanceof FtcError && e.status === 0);
});

test('Basic 인증 헤더와 HTTP 오류', async () => {
  const seen: string[] = [];
  await assert.rejects(ftc('/2023/none', cfg, fake({}, seen)), (e: any) => e.status === 404);
  assert.match(seen[0], /Basic dTp0$/); // base64("u:t")
});

test('팀 목록은 모든 페이지를 모은다', async () => {
  const f = fake({
    'eventCode=KRCMP&page=1': { teams: [{ teamNumber: 1 }], pageTotal: 2 },
    'eventCode=KRCMP&page=2': { teams: [{ teamNumber: 2 }], pageTotal: 2 },
  });
  assert.deepEqual((await getTeams(cfg, f)).map((t) => t.teamNumber), [1, 2]);
});

test('getLive: 순위·경기를 화면용 모양으로', async () => {
  const f = fake({
    'events?eventCode=KRCMP': { events: [{ code: 'KRCMP', name: 'TEST EVENT', venue: 'V', dateStart: 'a', dateEnd: 'b' }] },
    'rankings/KRCMP': { rankings: [{ rank: 1, teamNumber: 10, teamName: 'A', wins: 3, losses: 0, ties: 0, matchesPlayed: 3 }] },
    'qual/hybrid': { schedule: [{ tournamentLevel: 'QUALIFICATION', matchNumber: 1, description: 'Qualification 1', startTime: 't0',
      teams: [{ teamNumber: 10, station: 'Red1' }, { teamNumber: 11, station: 'Red2' }, { teamNumber: 12, station: 'Blue1' }, { teamNumber: 13, station: 'Blue2' }],
      scoreRedFinal: 50, scoreBlueFinal: 40 }] },
    'playoff/hybrid': { schedule: [] },
  });
  const live = await getLive(cfg, f);
  assert.equal(live.event.name, 'TEST EVENT');
  assert.equal(live.rankings[0].team, 10);
  assert.deepEqual(live.matches[0].red, [10, 11]);
  assert.deepEqual(live.matches[0].blue, [12, 13]);
  assert.equal(live.matches[0].redScore, 50);
});

test('getLive: 디비전이 있으면 디비전 순위·경기 + 본 대회 결승', async () => {
  const c = { ...cfg, season: 2024 };
  const f = fake({
    'events?eventCode=KRCMP': { events: [{ code: 'KRCMP', name: 'TEST' }] },
    '/2024/events': { events: [
      { code: 'KRCMPA', divisionCode: 'KRCMP', name: 'TEST - Alpha Division' },
      { code: 'KRCMPB', divisionCode: 'KRCMP', name: 'TEST - Beta Division' },
      { code: 'OTHER', divisionCode: null, name: 'X' },
    ] },
    'rankings/KRCMP': { rankings: [{ rank: 1, teamNumber: 99, matchesPlayed: 0 }] },
    'rankings/KRCMPA': { rankings: [{ rank: 1, teamNumber: 1, matchesPlayed: 5 }] },
    'rankings/KRCMPB': { rankings: [{ rank: 1, teamNumber: 2, matchesPlayed: 5 }] },
    'KRCMP/qual/hybrid': { schedule: [] },
    'KRCMP/playoff/hybrid': { schedule: [{ description: 'Finals 1', teams: [] }] },
    'KRCMPA/qual/hybrid': { schedule: [{ description: 'Qualification 1', teams: [] }] },
    'KRCMPA/playoff/hybrid': { schedule: [] },
    'KRCMPB/qual/hybrid': { schedule: [{ description: 'Qualification 1', teams: [] }] },
    'KRCMPB/playoff/hybrid': { schedule: [] },
  });
  const live = await getLive(c, f);
  assert.deepEqual(live.divisions, ['Alpha', 'Beta']);
  assert.deepEqual(live.rankings.map((r) => `${r.div}:${r.team}`), ['Alpha:1', 'Beta:2']);
  assert.deepEqual(live.matches.map((m) => `${m.div}:${m.desc}`), ['Alpha:Qualification 1', 'Beta:Qualification 1', '결승:Finals 1']);
});

test('getKrcHistory: 출전 시즌만, 디비전 순위, KRC 수상만, 세계 대회 여부', async () => {
  const f = fake({
    '/2022/events?teamNumber=7': 400,
    '/2023/events?teamNumber=7': { events: [{ code: 'KRCMP' }] },
    '/2024/events?teamNumber=7': { events: [] },
    '/2025/events?teamNumber=7': { events: [{ code: 'FTCCMP1' }, { code: 'KRCMP' }, { code: 'KRCMPJYSD', divisionCode: 'KRCMP', name: 'X - JangYeongsil Division' }] },
    '/2023/rankings/KRCMP?teamNumber=7': { rankings: [{ rank: 4, wins: 3, losses: 2, ties: 0 }] },
    '/2025/rankings/KRCMPJYSD?teamNumber=7': { rankings: [{ rank: 1, wins: 5, losses: 0, ties: 0 }] },
    '/2023/awards/7': { awards: [] },
    '/2025/alliances/KRCMPJYSD': { alliances: [], count: 6 },
    '/2025/awards/7': { awards: [{ eventCode: 'KRCMP', name: '<i>FIRST</i>® Leadership Award' }, { eventCode: 'FTCCMP1', name: 'Other' }] },
  });
  const h = await getKrcHistory(cfg, 7, f);
  assert.deepEqual(h.map((r) => r.season), [2025, 2023]);
  assert.equal(h[0].division, '장영실');
  assert.equal(h[0].record, '5-0-0');
  assert.deepEqual(h[0].awards, ['FIRST® Leadership Award']);
  assert.equal(h[0].worlds, true);
  assert.equal(h[1].rank, 4);
  assert.equal(h[1].worlds, false);
  assert.equal(h[0].captains, 6);
  assert.equal(h[1].captains, null);
});

test('디비전 이름은 표기가 달라도 한글로', () => {
  assert.equal(divName({ name: 'South Korea Championship - Jang Yeong-sil Division' }), '장영실');
  assert.equal(divName({ name: 'South Korea Championship - JangYeongsil Division' }), '장영실');
  assert.equal(divName({ name: 'South Korea Championship - King Sejong Division' }), '세종대왕');
  assert.equal(divName({ name: 'X - Alpha Division' }), 'Alpha');
});

test('세부 점수: 페널티는 상대 반칙 점수, RP는 승리 3 + 보너스', () => {
  const b = toBreakdown({ alliances: [
    { alliance: 'Red', autoPoints: 28, teleopPoints: 38, foulPointsCommitted: 20, minorFouls: 1, majorFouls: 1, totalPoints: 66, movementRP: false, goalRP: false, patternRP: true },
    { alliance: 'Blue', autoPoints: 16, teleopPoints: 31, foulPointsCommitted: 0, minorFouls: 0, majorFouls: 0, totalPoints: 67, movementRP: false, goalRP: false, patternRP: false },
  ] }, true)!;
  assert.deepEqual([b.red.auto, b.red.tele, b.red.pen, b.red.rp], [28, 38, 0, 1]);
  assert.deepEqual(b.red.rpItems, ['Pattern RP']);
  assert.deepEqual([b.blue.pen, b.blue.rp, b.blue.rpItems], [20, 3, ['승리']]);
  assert.equal(toBreakdown({ alliances: [{ alliance: 'Red', totalPoints: 1 }, { alliance: 'Blue', totalPoints: 1 }] }, false)!.red.rp, null);
});

test('경기 이름 한글', () => {
  assert.equal(koDesc('Qualification 36'), '예선 36');
  assert.equal(koDesc('Upper Bracket Round 2 Match 3'), '본선 승자조 2라운드 · 3경기');
  assert.equal(koDesc('Upper Bracket  Round 1 Match 1'), '본선 승자조 1라운드 · 1경기');
  assert.equal(koDesc('Lower Bracket Round 3 Match 5'), '본선 패자조 3라운드 · 5경기');
  assert.equal(koDesc('Final Bracket Round 6 Match 10'), '본선 결승 라운드 · 10경기');
  assert.equal(koDesc('Finals 2'), '결승 2');
  assert.equal(koDesc('Finals Match 3'), '결승 3');
  assert.equal(koDesc('Something else'), 'Something else');
});

test('Live 대회 설정: 시험 대회를 가리키면 그 날이 대회 날', async () => {
  const { liveEvent, liveCfg, isEventDay } = await import('../src/lib/krc.ts');
  assert.equal(liveEvent({}), null);
  assert.equal(liveEvent({ LIVE_EVENT: '2026/krtest' }), null);   // 날짜 없으면 무시
  const ev = liveEvent({ LIVE_EVENT: '2026/krtest', LIVE_DATES: '2026-11-21' })!;
  assert.deepEqual(ev, { season: 2026, event: 'KRTEST', start: '2026-11-21', end: '2026-11-21' });
  assert.deepEqual([liveCfg(cfg, ev).season, liveCfg(cfg, ev).event, liveCfg(cfg, null).event], [2026, 'KRTEST', 'KRCMP']);
  const at = (s: string) => Date.parse(s + '+09:00');
  assert.equal(isEventDay(at('2026-11-21T00:00:00'), ev), true);
  assert.equal(isEventDay(at('2026-11-21T23:59:00'), ev), true);
  assert.equal(isEventDay(at('2026-11-22T00:00:00'), ev), false);
  assert.equal(isEventDay(at('2026-11-21T12:00:00'), null), false);   // 설정 없으면 KRC 날짜
  assert.equal(isEventDay(at('2027-01-30T12:00:00'), null), true);
  assert.equal(isEventDay(at('2027-01-27T12:00:00'), null), false);   // 옛 날짜 1/26-27
  // 설정이 없어도 지역 대회 날에는 그 대회
  assert.equal(liveEvent({}, at('2026-11-21T09:00:00'))?.event, 'KRYON');
  assert.equal(liveEvent({}, at('2026-11-28T23:59:00'))?.event, 'KRYEN');
  assert.equal(liveEvent({}, at('2026-11-22T09:00:00')), null);
  assert.equal(liveEvent({ LIVE_EVENT: '2026/krtest', LIVE_DATES: '2026-11-21' }, at('2026-11-21T09:00:00'))?.event, 'KRTEST');   // 설정이 우선
});
