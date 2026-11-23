import { cookies } from 'next/headers';
import { meta } from '@/lib/meta';
import { MEMBER_COOKIE } from '@/lib/member';
import { memberFrom } from '@/lib/session';
import { LoginForm } from './LoginForm';
import { Account } from './Account';
import './login.css';

// 로그인 · 회원가입 · 내 계정. 가입하면 승인 대기 → 운영진이 팀 명단과 비교해 승인 → 로그인
export const dynamic = 'force-dynamic';
export const metadata = meta('/login');

export default async function Page() {
  const on = await memberFrom((await cookies()).get(MEMBER_COOKIE)?.value);
  return (
    <main className="pg-login">
      <section className="page-head"><div className="in">
        <span className="label">Account</span>
        <h1>{on ? `${on.name}님` : '로그인'}</h1>
        <p>{on ? `${on.team} · ${on.school} · ${on.email}` : 'KRC에 참가했거나 지금 참가하는 학생이면 가입할 수 있어요. 운영진이 확인한 뒤 승인하면 로그인돼요.'}</p>
        {on ? <Account me={{ name: on.name, school: on.school, team: on.team, role: on.role, intro: on.intro, admin: on.admin }} /> : <LoginForm />}
      </div></section>
    </main>
  );
}
