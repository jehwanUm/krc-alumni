import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DB_PATH = ':memory:';
const { members, teamProfiles, autos, log, signupLog, subs, arrivals, teamStatus } = await import('../src/lib/store.ts');

test('SQLite 저장소: 회원', async () => {
  const base = { pw: 'h', name: '가', school: 's', team: 't', verify: 'v', role: '', intro: '', team_no: 25316, agreed_at: null, terms_ver: null };
  assert.equal(await members.create({ ...base, email: 'a@x.kr' }), true);
  assert.equal(await members.create({ ...base, email: 'a@x.kr' }), false);          // 같은 이메일
  const m = (await members.byEmail('a@x.kr'))!;
  assert.equal(m.status, 'pending'); assert.equal(m.admin, false);
  await members.update(m.id, { status: 'approved', admin: true, show_on_team: true, role: '코딩', bogus: 1 } as any);
  const m2 = (await members.byId(m.id))!;
  assert.deepEqual([m2.status, m2.admin, m2.show_on_team], ['approved', true, true]);
  assert.deepEqual(await members.publicOfTeam(25316), [{ name: '가', role: '코딩', team_leader: false }]);
  await members.scrub('a@x.kr'); await members.remove(m.id);
  assert.equal(await members.byId(m.id), null);
});

test('SQLite 저장소: 팀 설정은 숨김 값을 지키며 저장', async () => {
  const row = { team: 1, school: 'a', region: '', intro: 'hi', robot_name: '', logo_url: null, robot_url: null, instagram: '', youtube: '', web: '', email: '', sponsors: ['X'], sponsors_ok: true, sns_ok: false, updated_at: 't', updated_by: 'e' };
  await teamProfiles.put(row);
  await teamProfiles.patch(1, { hidden: true });
  await teamProfiles.put({ ...row, intro: 'bye', sponsors_ok: false });
  const p = (await teamProfiles.get(1))!;
  assert.deepEqual([p.intro, p.hidden, p.sponsors, p.sponsors_ok], ['bye', true, ['X'], false]);
  assert.equal((await teamProfiles.unchecked()).length, 1);
});

test('SQLite 저장소: 오토·호출 기록·가입 기록·구독', async () => {
  const id = await autos.create({ team: 7, season: 2026, name: 'p', project: { paths: [1] }, visibility: 'public', share_teams: [3], created_by: 'e' });
  assert.deepEqual((await autos.get(id))!.project, { paths: [1] });
  assert.deepEqual((await autos.publicAll())[0].share_teams, [3]);
  await autos.update(id, { visibility: 'private' }); assert.equal((await autos.publicAll()).length, 0);
  const r = { key: 'k', event: 'E', match: 'Q1', team: 7, stage: '1' as const, at: 't' };
  assert.equal((await log.addNew([r])).length, 1); assert.equal((await log.addNew([r])).length, 0);
  await signupLog.add('h'); assert.equal((await signupLog.recent('2000')).length, 1);
  await subs.put(7, { endpoint: 'u', keys: {} }); assert.equal((await subs.forTeams([7]))[0].sub.endpoint, 'u');
  await arrivals.set('E', 'Q1', 7, true); assert.equal((await arrivals.list('E')).length, 1);
  await arrivals.set('E', 'Q1', 7, false); assert.equal((await arrivals.list('E')).length, 0);
  await teamStatus.set('E', 'Q1', 7, 'noshow', '인스펙션 재검사');
  await teamStatus.set('E', 'Q1', 7, 'forfeit'); // 덮어쓰기
  const ts = await teamStatus.list('E'); assert.equal(ts.length, 1); assert.equal(ts[0].status, 'forfeit'); assert.equal(ts[0].note, '');
  await teamStatus.set('E', 'Q1', 7, null); assert.equal((await teamStatus.list('E')).length, 0);
});
