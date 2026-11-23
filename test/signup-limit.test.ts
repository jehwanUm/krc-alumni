import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tooMany, SIGNUP_PER_IP, SIGNUP_ALL } from '../src/lib/member.ts';

test('가입 횟수 제한', () => {
  const rows = (h: string, n: number) => Array.from({ length: n }, () => ({ ip_hash: h }));
  assert.equal(tooMany(rows('a', SIGNUP_PER_IP - 1), 'a'), '');
  assert.match(tooMany(rows('a', SIGNUP_PER_IP), 'a'), /1시간/);
  assert.equal(tooMany(rows('a', SIGNUP_PER_IP), 'b'), '');              // 다른 IP는 괜찮음
  assert.match(tooMany(rows('x', SIGNUP_ALL), 'b'), /몰리고/);
});
