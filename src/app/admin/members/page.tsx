import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { meta } from '@/lib/meta';
import { members } from '@/lib/store';
import { MEMBER_COOKIE } from '@/lib/member';
import { memberFrom } from '@/lib/session';
import { mailReady } from '@/lib/mail';
import { getDirectory } from '@/lib/teams';
import { Decide } from './Decide';
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
  const [list, dir] = await Promise.all([members.list(), getDirectory().catch(() => null)]);
  const match = (team: string) => (dir?.teams ?? []).filter((t) => norm(t.name) === norm(team) || String(t.n) === team.trim()).map((t) => `${t.n} ${t.name} (${t.seasons.join('·')})`);
  const order = { pending: 0, rejected: 1, approved: 2 } as const;
  const rows = [...list].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <main className="pg-login pg-admin">
      <section className="page-head"><div className="in">
        <span className="label">Admin</span>
        <h1>가입 신청 관리</h1>
        <p>대기 {list.filter((m) => m.status === 'pending').length}명 · 승인 {list.filter((m) => m.status === 'approved').length}명. 팀 명단과 비교해 지금 참가 학생이면 승인하고, 졸업생은 참가 증빙을 이메일로 받은 뒤 승인해요.</p>
        <p className="dim small">{mailReady() ? '승인·거절하면 본인에게 알림 메일이 가요.' : '알림 메일은 아직 설정 전이에요. 승인·거절 뒤 본인에게 직접 알려 주세요.'}</p>
      </div></section>
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
                {m.decided_by && <><dt>처리</dt><dd className="dim">{m.decided_by} · {m.decided_at && kst(m.decided_at)}</dd></>}
              </dl>
              <Decide id={m.id} status={m.status} admin={m.admin} self={m.id === me!.id} />
            </article>
          );
        })}
      </div></div></section>
    </main>
  );
}
