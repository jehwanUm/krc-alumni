import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrub } from '../src/instrumentation.ts';

test('오류 알림 개인정보 가리기', () => {
  assert.equal(scrub('fail for kim@example.com'), 'fail for [이메일]');
  assert.equal(scrub('call 010-1234-5678'), 'call [전화]');
  assert.equal(scrub('from 203.0.113.5'), 'from [IP]');
  assert.equal(scrub('/login/reset bxTLjiA0s5huSsrWSP-Hj2KIAoXD77n5'), '/login/reset [토큰]');
  assert.equal(scrub('member 11111111-2222-3333-4444-555555555555'), 'member [id]');
  assert.equal(scrub('저장소 오류 409: duplicate key'), '저장소 오류 409: duplicate key');
});
