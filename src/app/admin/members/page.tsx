import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { meta } from '@/lib/meta';
import { members, teamProfiles } from '@/lib/store';
import { MEMBER_COOKIE } from '@/lib/member';
import { memberFrom } from '@/lib/session';
import { getDirectory } from '@/lib/teams';
import { Decide } from './Decide';
import { TeamAssign } from './TeamAssign';
import { TeamAct } from './SponsorCheck';
import { teamKo } from '@/lib/teams';
import '../../login/login.css';

// 운영진: 가입 신청 확인. 팀 이름이 KRC 참가 팀 명단(FTC 공식 기록)에 있으면 표시해서 비교를 돕는다
export const dynamic = 'force-dynamic';
export const metadata = meta('/admin/members');

const LABEL = { pending: '대기', approved: '승인', rejected: '거절' } as const;
const kst = (iso: string) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');   // 한국 시각
const norm = (s: string) => s.toLowerCase().replace(/[\s._-]/g, '');

export default async function Page() {
  const me = await memberFrom((await cookies()).get(MEMBER_COOKIE)?.value);
  if (!me?.admin) redirect('/login');
  const [list, dir, pend, profs] = await Promise.all([members.list(), getDirectory().catch(() => null), teamProfiles.unchecked().catch(() => []), teamProfiles.all().catch(() => [])]);
  const hits = (team: string) => (dir?.teams ?? []).filter((t) => norm(t.name) === norm(team) || String(t.n) === team.trim());
  const match = (team: string) => hits(team).map((t) => `${t.n} ${t.name} (${t.seasons.join('·')})`);
  const nameOf = (n: number) => dir?.teams.find((t) => t.n === n)?.name ?? '';
  const order = { pending: 0, rejected: 1, approved: 2 } as const;
  const rows = [...list].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <main className="pg-login pg-admin">
      <section className="page-head"><div className="in">
        <span className="label">Admin</span>
        <h1>가입 신청 관리</h1>
        <p>대기 {list.filter((m) => m.status === 'pending').length}명 · 승인 {list.filter((m) => m.status === 'approved').length}명. 팀 명단과 비교해 지금 참가 학생이면 승인하고, 졸업생은 참가 증빙을 이메일로 받은 뒤 승인해요.</p>
        <p className="dim small">승인·거절·재설정을 하면 보낼 메일이 채워진 채로 메일 앱에서 열려요. 대기 중인 졸업생에게는 「증빙 요청 메일」을 보내 주세요.</p>
      </div></section>
      {pend.length > 0 && <section className="sec wide"><div className="in"><div className="body mlist">
        <h2>후원사 확인 대기</h2>
        {pend.map((t) => (
          <article className="mrow pending" key={t.team}>
            <div className="mhead"><b>{t.team} {nameOf(t.team)}</b><span className="dim small">{t.updated_by}</span></div>
            <dl className="kv"><dt>지금 공개</dt><dd>{teamKo(t.team).sponsors.join(', ') || '없음'}</dd><dt>팀이 바꾼 목록</dt><dd>{t.sponsors.join(', ') || '없음'}</dd></dl>
            <div className="row"><TeamAct team={t.team} action="sponsors" label="확인 · 공개" pri /></div>
          </article>
        ))}
      </div></div></section>}
      {profs.length > 0 && <section className="sec wide"><div className="in"><div className="body mlist">
        <h2>팀이 올린 내용</h2>
        <p className="dim small">팀장이 저장하면 확인 없이 바로 공개돼요. 문제가 있으면 숨기거나 사진·소개를 지우세요.</p>
        {[...profs].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map((t) => (
          <article className={`mrow${t.hidden ? ' hiddenrow' : ''}`} key={t.team}>
            <div className="mhead"><b><a href={`/teams/${t.team}`}>{t.team} {nameOf(t.team)}</a></b>{t.hidden && <span className="chip">숨김</span>}{t.sns_ok && <span className="chip blue">SNS 동의</span>}<span className="dim small">{kst(t.updated_at)} · {t.updated_by}</span></div>
            <div className="tprev">
              {t.logo_url && <img src={t.logo_url} width="56" height="56" alt="로고" />}
              {t.robot_url && <img src={t.robot_url} height="56" alt="로봇 사진" />}
              <p className="small">{t.intro ? t.intro.slice(0, 160) : <span className="dim">소개 없음</span>}</p>
            </div>
            <div className="row">
              {t.hidden ? <TeamAct team={t.team} action="show" label="다시 보이기" /> : <TeamAct team={t.team} action="hide" label="전체 숨기기" ask="이 팀이 올린 내용을 모두 숨길까요? 팀 페이지는 기본 정보만 보여요" />}
              {t.robot_url && <TeamAct team={t.team} action="clear_robot" label="로봇 사진 지우기" ask="로봇 사진을 지울까요?" />}
              {t.logo_url && <TeamAct team={t.team} action="clear_logo" label="로고 지우기" ask="로고를 지울까요?" />}
              {t.intro && <TeamAct team={t.team} action="clear_intro" label="소개 지우기" ask="팀 소개를 지울까요?" />}
            </div>
          </article>
        ))}
      </div></div></section>}
      <section className="sec wide"><div className="in"><div className="body mlist">
        {rows.length === 0 && <p className="dim">가입 신청이 없어요.</p>}
        {rows.map((m) => {
          const hit = match(m.team);
          return (
            <article className={`mrow ${m.status}`} key={m.id}>
              <div className="mhead"><b>{m.name}</b><span className={`chip ${m.status === 'approved' ? 'blue' : m.status === 'pending' ? 'yel' : ''}`}>{LABEL[m.status]}</span>{m.admin && <span className="chip">관리자</span>}<span className="dim small">{kst(m.created_at)}</span></div>
              <dl className="kv">
                <dt>학교 · 팀</dt><dd>{m.school} · {m.team} {hit.length ? <span className="ok">명단 있음: {hit.join(', ')}</span> : <span className="dim">명단에서 같은 팀 이름 못 찾음</span>}</dd>
                <dt>인증 내용</dt><dd>{m.verify}</dd>
                {m.role && <><dt>역할</dt><dd>{m.role}</dd></>}
                {m.intro && <><dt>소개</dt><dd>{m.intro}</dd></>}
                <dt>이메일</dt><dd><a href={`mailto:${m.email}`}>{m.email}</a></dd>
                <dt>팀 연결</dt><dd>{m.team_no ? <><a href={`/teams/${m.team_no}`}>{m.team_no} {nameOf(m.team_no)}</a>{m.team_leader && <span className="chip blue">팀장</span>}</> : <span className="dim">없음</span>}</dd>
                {m.decided_by && <><dt>처리</dt><dd className="dim">{m.decided_by} · {m.decided_at && kst(m.decided_at)}</dd></>}
              </dl>
              <TeamAssign id={m.id} teamNo={m.team_no} leader={m.team_leader} hint={hits(m.team).map((t) => t.n)} />
              <Decide id={m.id} status={m.status} admin={m.admin} self={m.id === me!.id} who={{ name: m.name, email: m.email }} />
            </article>
          );
        })}
      </div></div></section>
    </main>
  );
}
