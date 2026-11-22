import { cookies } from 'next/headers';
import { meta } from '@/lib/meta';
import { members } from '@/lib/store';
import { readToken, MEMBER_COOKIE } from '@/lib/member';
import { LoginForm, Logout } from './LoginForm';
import './login.css';

// 로그인 · 회원가입. 가입하면 승인 대기 → 운영진이 팀 명단과 비교해 승인 → 로그인
export const dynamic = 'force-dynamic';
export const metadata = meta('/login');

export default async function Page() {
  const id = readToken((await cookies()).get(MEMBER_COOKIE)?.value);
  const me = id ? await members.byId(id).catch(() => null) : null;
  const on = me?.status === 'approved' ? me : null;
  return (
    <main className="pg-login">
      <section className="page-head"><div className="in">
        <span className="label">Account</span>
        <h1>{on ? `${on.name}님` : '로그인'}</h1>
        <p>{on ? `${on.team} · ${on.school}` : 'KRC에 참가했거나 지금 참가하는 학생이면 가입할 수 있어요. 운영진이 확인한 뒤 승인하면 로그인돼요.'}</p>
        {on ? (
          <div className="done">
            {on.admin && <a className="btn pri" href="/admin/members">가입 신청 관리 →</a>}
            <Logout />
          </div>
        ) : <LoginForm />}
      </div></section>
    </main>
  );
}
