import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueCalls, dueStage, states, matchKey, type M } from '../src/lib/livestate.ts';

// 형식만 흉내 낸 테스트용 경기 (실제 대회 결과 아님). 6분 간격, 10:00부터.
const t = (min: number) => Date.parse('2026-11-21T10:00:00+09:00') + min * 60e3;
const at = (min: number) => new Date(t(min) + 9 * 3600e3).toISOString().slice(0, 19);   // 한국 시각 문자열 (공식 데이터 형식)
const mk = (no: number, started?: number, posted?: number): M => ({ level: 'QUALIFICATION', no, desc: `Qualification ${no}`, start: at((no - 1) * 6),
  actual: started == null ? null : at(started), posted: posted == null ? null : at(posted), red: [no * 10 + 1, no * 10 + 2], blue: [no * 10 + 3, no * 10 + 4], redScore: null, blueScore: null, div: '' });

test('진행 상태: 마지막으로 시작한 경기만 진행 중', () => {
  const ms = [mk(1, 0, 4), mk(2, 6), mk(3)];
  const s = states(ms, t(7));
  assert.deepEqual(ms.map(s), ['done', 'live', 'wait']);
});

test('호출 시점: 두 경기 앞 시작 → 1차, 바로 앞 시작 → 2차', () => {
  const ms = [mk(1, 0, 4), mk(2, 6), mk(3), mk(4), mk(5)];
  assert.deepEqual(dueCalls(ms, t(7)).map((x) => `${x.m.no}:${x.stage}`), ['3:2', '4:1']);
  assert.equal(matchKey(ms[2]), '|QUALIFICATION|0|3');
});

test('첫 경기들: 예정 시각 15분 전 1차, 5분 전 2차', () => {
  const ms = [mk(1), mk(2), mk(3)];
  assert.equal(dueStage(ms, 0, t(-20)), 0);
  assert.equal(dueStage(ms, 0, t(-10)), 1);
  assert.equal(dueStage(ms, 0, t(-4)), 2);
  assert.equal(dueStage(ms, 1, t(-10)), 0);  // 2경기(예정 10:06): 15분 전은 9:51 → 9:50엔 아직
  assert.equal(dueStage(ms, 1, t(-4)), 1);   // 앞 경기가 안 시작했으니 2차는 아님
});

test('이미 시작한 경기·대진 없는 경기는 호출하지 않음', () => {
  const ms = [mk(1, 0), mk(2), { ...mk(3), red: [], blue: [] }];
  assert.deepEqual(dueCalls(ms, t(1)).map((x) => `${x.m.no}:${x.stage}`), ['2:2']);
});
