// 관리자 지정: 가입한 회원을 승인 + 관리자로. 처음 한 번(운영진 계정) 쓰고, 이후 승인은 /admin/members 화면에서
// node --env-file=.env scripts/member-admin.mjs <이메일> [--remove]
import { members } from '../src/lib/store.ts';

const [email, flag] = process.argv.slice(2);
if (!email) { console.error('사용법: node --env-file=.env scripts/member-admin.mjs <이메일> [--remove]'); process.exit(1); }
const m = await members.byEmail(email.toLowerCase());
if (!m) { console.error('그 이메일로 가입한 회원이 없어요. 먼저 홈페이지에서 회원가입하세요'); process.exit(1); }
const admin = flag !== '--remove';
await members.update(m.id, admin ? { admin, status: 'approved', decided_at: new Date().toISOString(), decided_by: 'script' } : { admin });
console.log(`${m.name} (${m.email}) → ${admin ? '관리자 + 승인' : '관리자 해제'}`);
