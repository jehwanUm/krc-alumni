import Link from 'next/link';
import { meta, abs } from '@/lib/meta';
import JsonLd from '@/components/JsonLd';
import { getDirectory, sponsorId } from '@/lib/teams';
import { getTeamsView } from '@/lib/directory';
import './sponsors.css';

// 후원사별로 후원하는 KRC 팀을 모은다. 팀 데이터로 만드는 페이지라 서버 HTML + ISR 10분.
export const revalidate = 600;
export const metadata = meta('/sponsors');

const sl = (y: number) => `${y}–${String(y + 1).slice(2)}`;

export default async function Page() {
  let dir: Awaited<ReturnType<typeof getTeamsView>> | null = null, error = '';
  try { dir = await getTeamsView(); } catch (e) { error = (e as Error).message; }
  const seasons = dir ? Object.keys(dir.res).map(Number).sort((a, b) => b - a) : [];
  const sponsors = dir ? [...new Set(dir.teams.flatMap((t) => t.sponsors))]
    .map((s) => ({ name: s, teams: dir!.teams.filter((t) => t.sponsors.includes(s)) }))
    .sort((a, b) => b.teams.length - a.teams.length || a.name.localeCompare(b.name, 'ko')) : [];
  const ld = sponsors.map((s) => ({ '@context': 'https://schema.org', '@type': 'Organization', name: s.name,
    subjectOf: s.teams.map((t) => ({ '@type': 'SportsTeam', name: `${t.n} ${t.name}`, url: abs(`/teams/${t.n}`) })) }));
  return (
    <main className="pg-sponsors">
      <JsonLd data={ld} />
      <section className="page-head"><div className="in">
        <span className="label">Sponsors</span>
        <h1>후원 기업</h1>
        <p>여기에 적힌 기업·기관 이름은 각 참가 팀이 FTC 대회 등록 때 직접 밝힌 팀별 후원사예요. KRC 동문회 홈페이지나 대회를 공식 후원한다는 뜻은 아니며, 동문회가 실제 계약 여부를 따로 확인하지는 않아요.</p>
      </div></section>

      <section className="sec wide"><div className="in"><div><span className="label">§01</span><h2>팀이 밝힌 후원사</h2></div><div className="body">
        {error ? <p className="note">후원 정보를 불러오지 못했어요. {error}</p> : sponsors.map((s) => (
          <article className="sp" id={sponsorId(s.name)} key={s.name}>
            <div className="sp-top">
              <div className="sp-logo" aria-hidden="true">{s.name.slice(0, 1)}</div>
              <div><h3>{s.name}</h3><p className="dim">후원사로 적은 팀 {s.teams.length}</p></div>
            </div>
            <div className="sp-teams">
              {s.teams.map((t) => {
                const best = seasons.map((y) => ({ y, r: dir!.res[y]?.[t.n] })).find((x) => x.r?.rank || x.r?.awards.length);
                const r = best?.r;
                return (
                  <Link className="sp-team" href={`/teams/${t.n}`} key={t.n}>
                    <img className="avatar" src={t.logo} width="48" height="48" alt="" loading="lazy" />
                    <span><b>{t.n} {t.name}</b><span className="dim">{[t.school, t.region].filter(Boolean).join(' · ')}</span>
                      {best && r && <span className="res"><span className="dim">{sl(best.y)}</span>{r.worlds && <span className="chip yel">FIRST Championship</span>}{r.rank && <span className={r.cap && r.rank <= r.cap ? 'chip blue' : 'dim'}>{r.div ? `${r.div} ` : ''}{r.rank}위</span>}{r.awards.length > 0 && <span className="dim">수상 {r.awards.length}</span>}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          </article>
        ))}
        <p className="note">FTC 공식 팀 이름에 적힌 후원사를 옮긴 것이라 운영진이 확인하고 있어요. 빠진 후원사는 동문회로 알려 주세요.</p>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§02</span><h2>동문회와 함께하는 기업</h2></div><div className="body">
        <div className="soon-box"><p>KRC 동문회와 협업하는 기업 소개, 협업 프로젝트, 장학·장비 지원 프로그램이 이곳에 실려요. 준비 중이에요.</p></div>
      </div></div></section>
    </main>
  );
}
