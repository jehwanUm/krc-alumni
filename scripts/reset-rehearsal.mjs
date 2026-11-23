// 리허설 기록(호출·도착 체크) 지우기: node --env-file=.env scripts/reset-rehearsal.mjs [대회=2025/KRCMP]
// 같은 호출은 한 번만 가므로, 리허설을 다시 하거나 실제 대회 전에 지운다. 호출 구독(휴대폰)은 남긴다.
import { db } from '../src/lib/store.ts';

const event = process.argv[2] ?? '2025/KRCMP';
for (const t of ['push_log', 'arrivals']) console.log(t, `${db().prepare(`delete from ${t} where event = ?`).run(event).changes}건 지움`);
