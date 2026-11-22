// 관리자 지정: 가입한 회원을 승인 + 관리자로. 처음 한 번(엄제환·안찬빈 계정) 쓰고, 이후 승인은 /admin/members 화면에서
// node --env-file=.env scripts/member-admin.mjs <이메일> [--remove]
const [email, flag] = process.argv.slice(2);
if (!email) { console.error('사용법: node --env-file=.env scripts/member-admin.mjs <이메일> [--remove]'); process.exit(1); }
const url = process.env.SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) { console.error('.env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요해요'); process.exit(1); }
const admin = flag !== '--remove';
const body = admin ? { admin, status: 'approved', decided_at: new Date().toISOString(), decided_by: 'script' } : { admin };
const res = await fetch(`${url}/rest/v1/members?email=eq.${encodeURIComponent(email.toLowerCase())}`, {
  method: 'PATCH', body: JSON.stringify(body),
  headers: { apikey: key, ...(key.startsWith('eyJ') && { Authorization: `Bearer ${key}` }), 'Content-Type': 'application/json', Prefer: 'return=representation' },
});
const rows = await res.json().catch(() => []);
if (!res.ok) { console.error('오류', res.status, rows); process.exit(1); }
if (!rows.length) { console.error('그 이메일로 가입한 회원이 없어요. 먼저 홈페이지에서 회원가입하세요'); process.exit(1); }
console.log(`${rows[0].name} (${rows[0].email}) → ${admin ? '관리자 + 승인' : '관리자 해제'}`);
