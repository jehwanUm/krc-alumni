// 새 페이지를 만들고 src/lib/pages.ts에 안 넣으면 실패한다 (그래야 llms.txt·제목·설명이 빠지지 않는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PAGES } from '../src/lib/pages.ts';

const root = new URL('../src/app/', import.meta.url).pathname;
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

test('모든 page.tsx가 pages.ts에 있다 (동적 경로 [..] 제외)', () => {
  const paths = walk(root).filter((f) => f.endsWith('/page.tsx') && !f.includes('['))
    .map((f) => '/' + relative(root, f).replace(/\/?page\.tsx$/, ''));
  const known = new Set(PAGES.map((p) => p.path));
  assert.deepEqual(paths.filter((p) => !known.has(p)), []);
});

test('pages.ts의 경로는 겹치지 않고, 제목·설명이 있다', () => {
  assert.equal(new Set(PAGES.map((p) => p.path)).size, PAGES.length);
  for (const p of PAGES) assert.ok(p.title && p.desc.length >= 20, p.path);
});
