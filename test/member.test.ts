import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPw, checkPw, makeToken, readToken, parseSignup } from '../src/lib/member.ts';

test('비밀번호 해시', () => {
  const h = hashPw('Abcdefg!');
  assert.ok(checkPw('Abcdefg!', h));
  assert.ok(!checkPw('abcdefg!', h));
  assert.ok(!checkPw('x', 'broken'));
});

test('로그인 쿠키: 서명·만료', () => {
  const id = '11111111-2222-3333-4444-555555555555', t = makeToken(id, 0);
  assert.equal(readToken(t, 1000), id);
  assert.equal(readToken(t, 31 * 864e5), null);                 // 30일 지나면 끝
  assert.equal(readToken(t.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')), 1000), null);   // 서명 바뀌면 거절
  assert.equal(readToken(`${id}.99999999999999.x`), null);
  assert.equal(readToken(undefined), null);
});

test('가입 입력 검사', () => {
  const ok = { name: '박지훈', school: '협회고', team: 'Eagles', verify: '2026 팀원', email: 'A@B.kr', pw: 'Abcdefg!', agree: true };
  assert.equal(parseSignup(ok).data?.email, 'a@b.kr');
  assert.match(parseSignup({ ...ok, team: ' ' }).error!, /필수/);
  assert.match(parseSignup({ ...ok, email: 'nope' }).error!, /이메일/);
  assert.match(parseSignup({ ...ok, pw: 'abcdefgh' }).error!, /대문자.*특수기호/);
  assert.match(parseSignup({ ...ok, agree: false }).error!, /동의/);
  assert.equal(parseSignup(null).error, '필수 항목을 모두 채워 주세요');
});
