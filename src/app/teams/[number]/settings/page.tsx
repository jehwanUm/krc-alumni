import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDirectory, teamKo } from '@/lib/teams';
import { logoFor } from '@/lib/logos';
import { members, teamProfiles } from '@/lib/store';
import { MEMBER_COOKIE, canManageTeam } from '@/lib/member';
import { memberFrom } from '@/lib/session';
import { TeamSettings } from './TeamSettings';
import '../../../login/login.css';
import './settings.css';

// 팀 설정: 팀장(과 운영진)이 팀 페이지 내용과 팀원을 관리한다
export const metadata: Metadata = { title: '팀 설정 · KRC Alumni', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ number: string }> }) {
  const n = Number((await params).number);
  if (!Number.isInteger(n) || n <= 0) notFound();
  const me = await memberFrom((await cookies()).get(MEMBER_COOKIE)?.value);
  const t = (await getDirectory().catch(() => null))?.teams.find((x) => x.n === n);
  const name = t?.name || `팀 ${n}`;
  const head = (p: string) => (
    <section className="page-head"><div className="in">
      <span className="label">Team {n} · Settings</span>
      <h1>팀 설정</h1>
      <p>{n} {name} · {p} <Link href={`/teams/${n}`}>팀 페이지 보기 →</Link></p>
    </div></section>
  );
  if (!canManageTeam(me, n)) return (
    <main className="pg-login pg-tset">{head(me ? '이 팀의 팀장만 고칠 수 있어요.' : '팀장 계정으로 로그인해야 해요.')}
      <section className="sec"><div className="in"><div className="body">
        <p className="note">{me ? `${me.name}님은 이 팀의 팀장이 아니에요. 팀장 지정은 운영진에게 요청해 주세요.` : '팀장 계정으로 로그인한 뒤 다시 열어 주세요.'}</p>
        {!me && <p><Link className="btn pri" href="/login">로그인</Link></p>}
      </div></div></section>
    </main>
  );
  const [p, team] = await Promise.all([teamProfiles.get(n), members.byTeam(n)]);
  const ko = teamKo(n);
  const init = {
    school: p?.school || ko.school, region: p?.region || ko.region, intro: p?.intro ?? '', robot_name: p?.robot_name ?? '',
    logo: p?.logo_url ?? logoFor(n).src, robot: p?.robot_url ?? '', hasLogo: !!p?.logo_url,
    instagram: p?.instagram ?? '', youtube: p?.youtube ?? '', web: p?.web ?? '', email: p?.email ?? '',
    sponsors: p ? p.sponsors : ko.sponsors, sponsorsPending: p?.sponsors_ok === false,
  };
  const roster = team.filter((m) => m.status !== 'rejected').map((m) => ({ id: m.id, name: m.name, school: m.school, role: m.role, verify: m.verify, status: m.status, leader: m.team_leader, me: m.id === me!.id, admin: m.admin }));
  return (
    <main className="pg-login pg-tset">{head('팀 페이지에 보이는 내용과 팀원을 관리해요.')}
      {p?.hidden && <div className="preview-bar" role="note">운영진이 이 팀이 올린 내용을 숨겼어요. 고쳐서 저장한 뒤 운영진에게 다시 보이게 해 달라고 요청해 주세요.</div>}
      <section className="sec wide"><div className="in"><div className="body">
        <TeamSettings n={n} name={name} init={init} roster={roster} />
      </div></div></section>
    </main>
  );
}
