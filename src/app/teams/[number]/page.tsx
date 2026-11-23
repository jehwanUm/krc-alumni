import { Fragment, cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { meta, abs } from '@/lib/meta';
import JsonLd from '@/components/JsonLd';
import { config, getTeam, getKrcHistory, getTeamMatches, KRC_SEASONS } from '@/lib/ftc';
import { teamKo, sponsorId, getDirectory } from '@/lib/teams';
import { teamProfiles } from '@/lib/store';
import { logoFor, hasOwnLogo } from '@/lib/logos';
import { NEXT } from '@/lib/krc';
import { BreakdownToggle } from './BreakdownToggle';
import './team.css';

// 팀 페이지: 처음 열릴 때 서버가 만들고 ISR로 10분 캐시 (빌드 때는 만들지 않음).
export const revalidate = 600;
export const dynamicParams = true;
export const generateStaticParams = async () => [];

type Props = { params: Promise<{ number: string }> };
const sl = (y: number) => `${y}–${String(y + 1).slice(2)}`;

// 메타와 본문이 같이 쓰므로 요청마다 한 번만 불러온다
const load = cache(async (n: number) => {
  let team: any = null, history: Awaited<ReturnType<typeof getKrcHistory>> = [], matches: Record<number, any[]> = {}, sameSponsor: Record<string, number> = {}, error = '';
  const cfg = config();
  // 팀장이 고친 팀 설정이 있으면 소속·지역·후원사(운영진 확인 후)를 덮어쓴다
  const p = await teamProfiles.get(n).catch(() => null);
  const base = teamKo(n);
  const ko = { ...base, school: p?.school || base.school, region: p?.region || base.region, sponsors: p?.sponsors_ok ? p.sponsors : base.sponsors };
  try {
    // 이번 시즌(신생 팀 포함) → 개발 기준 시즌 → 지난 KRC 시즌 순으로 찾는다
    for (const season of new Set([NEXT.season, cfg.season, ...[...KRC_SEASONS].reverse()])) { team = await getTeam({ ...cfg, season }, n); if (team) break; }
    if (team) {
      history = await getKrcHistory(cfg, n);
      const ms = await Promise.all(history.map((h) => getTeamMatches(cfg, n, h.season)));
      history.forEach((h, i) => (matches[h.season] = ms[i]));
      if (ko.sponsors.length) {
        const dir = await getDirectory();
        for (const s of ko.sponsors) sameSponsor[s] = dir.teams.filter((t) => t.sponsors.includes(s)).length;
      }
    }
  } catch (e) { error = (e as Error).message; }
  const name = String(team?.nameShort ?? `팀 ${n}`).trim();
  return { team, history, matches, sameSponsor, error, ko, name, p };
});

const num = async (params: Props['params']) => {
  const n = Number((await params).number);
  if (!Number.isInteger(n) || n <= 0) notFound();
  return n;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await num(params);
  const { history, ko, name } = await load(n);
  const last = history[0];
  const desc = `FTC 팀 ${n} ${name}${ko.school ? `(${ko.school})` : ''}의 KRC 기록` + (last?.rank ? ` — ${sl(last.season)} 시즌 ${last.division ? last.division + ' 디비전 ' : ''}예선 ${last.rank}위` : '') + (history.some((h) => h.awards.length) ? ', 수상 기록' : '') + ', 공개 오토, 후원사.';
  return meta(`/teams/${n}`, { title: `${n} ${name} · 팀`, desc });
}

export default async function Page({ params }: Props) {
  const n = await num(params);
  const { team, history, matches, sameSponsor, error, ko, name, p } = await load(n);
  const logo = p?.logo_url ?? logoFor(n).src, ownLogo = !!p?.logo_url || hasOwnLogo(n);
  const links = p ? ([['인스타그램', p.instagram], ['유튜브', p.youtube], ['홈페이지', p.web]] as const).filter(([, u]) => u) : [];
  if (!team && !error) notFound();
  const org = [ko.school, ko.region].filter(Boolean).join(' · ') || [team?.city, team?.country].filter(Boolean).join(' · ');
  const won = (m: any) => (m.redScore == null ? null : m.red.includes(n) ? m.redScore > m.blueScore : m.blueScore > m.redScore);
  const ld = team ? [{ '@context': 'https://schema.org', '@type': 'SportsTeam', name, sport: 'Robotics (FIRST Tech Challenge)',
    identifier: String(n), ...(ownLogo && { logo: logo.startsWith('http') ? logo : abs(logo) }), memberOf: { '@type': 'SportsOrganization', name: 'FIRST Tech Challenge' },
    location: org, ...(ko.school && { affiliation: { '@type': 'EducationalOrganization', name: ko.school } }),
    ...(ko.sponsors.length && { sponsor: ko.sponsors.map((s) => ({ '@type': 'Organization', name: s })) }),
    award: history.flatMap((h) => h.awards.map((a) => `${a} (KRC ${sl(h.season)})`)) }] : [];
  const teamsOf = (ts: number[]) => ts.map((t, i) => <Fragment key={t}>{i > 0 && ' · '}{t === n ? <mark className="hl">{t}</mark> : <Link href={`/teams/${t}`} prefetch={false}>{t}</Link>}</Fragment>);

  return (
    <main className="pg-team">
      <JsonLd data={ld} />
      <section className="page-head"><div className="in">
        <div className="team-head">
          <img className="avatar lg" src={logo} width="136" height="136" alt={ownLogo ? `${name} 팀 로고` : ''} />
          <div>
            <span className="label">Team {n}</span>
            <h1>{n} {name}</h1>
            {org && <p>{org}</p>}
            {ko.sponsors.length > 0 && <p className="by">Supported by {ko.sponsors.map((s, i) => <Fragment key={s}>{i > 0 && ' · '}<Link href={`/sponsors#${sponsorId(s)}`}>{s}</Link></Fragment>)}</p>}
          </div>
        </div>
      </div></section>
      {error ? (
        <section className="sec"><div className="in"><div><span className="label">§01</span><h2>정보</h2></div><div className="body"><p className="note">팀 정보를 불러오지 못했어요. {error}</p></div></div></section>
      ) : (
        <>
          <section className="sec"><div className="in"><div><span className="label">§01</span><h2>팀 소개 · 로봇</h2></div><div className="body">
            {p?.intro || p?.robot_url ? (
              <div className="intro">
                {p.robot_url && <img className="robot" src={p.robot_url} alt={p.robot_name ? `로봇 ${p.robot_name}` : `${name} 로봇`} loading="lazy" />}
                <div>{p.robot_name && <p><b>{p.robot_name}</b></p>}{p.intro && <p className="txt">{p.intro}</p>}</div>
              </div>
            ) : (
              <div className="empty">
                <div className="ph">로봇 사진</div>
                <div><p><b>아직 팀 소개가 없어요.</b></p><p className="dim">팀장이 로그인하면 소개글과 올해 로봇 사진을 올릴 수 있어요.</p></div>
              </div>
            )}
            <p className="edit"><Link href={`/teams/${n}/settings`} prefetch={false}>팀 설정 (팀장) →</Link></p>
            <table className="tbl facts"><tbody>
              {team.rookieYear && <tr><th scope="row">창단</th><td>{team.rookieYear}</td></tr>}
              <tr><th scope="row">KRC 출전</th><td>{history.length}회</td></tr>
            </tbody></table>
          </div></div></section>

          <section className="sec"><div className="in"><div><span className="label">§02</span><h2>공개 오토</h2></div><div className="body">
            <p>이 팀이 공개한 경로가 아직 없어요.</p>
          </div></div></section>

          <section className="sec"><div className="in"><div><span className="label">§03</span><h2>KRC 기록</h2></div><div className="body">
            {history.length ? (
              <div className="tscroll"><table className="tbl">
                <thead><tr><th>시즌</th><th>디비전</th><th>예선 순위</th><th>수상</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.season}>
                      <td><a href={`https://ftc-events.firstinspires.org/${h.season}/KRCMP`} rel="external">{sl(h.season)}</a></td>
                      <td>{h.division ?? '–'}</td>
                      <td className="num">{h.rank ? <span className={h.captains && h.rank <= h.captains ? 'chip blue' : ''}>{h.rank}위 · {h.record}</span> : <span title="이 시즌 대회는 공식 사이트에 경기 결과가 올라가 있지 않아요">공식 기록 없음</span>}</td>
                      <td><div className="badges">{h.worlds && <span className="chip yel">FIRST Championship 출전</span>}{h.awards.map((a) => <span className="award" key={a}>{a}</span>)}{!h.awards.length && !h.worlds && '–'}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            ) : <p>{sl(KRC_SEASONS[0])} 시즌 이후 KRC 출전 기록이 없어요.</p>}
            <p className="legend"><span className="chip yel">FIRST Championship 출전</span><span className="chip blue">Captain</span></p>
            <p className="note">FTC 공식 기록 기준({sl(KRC_SEASONS[0])} 시즌부터). 예선 순위는 승-패-무. Captain은 예선 순위가 그 대회 본선 동맹 수 이내(KRC 디비전은 6위, 2023–24 KRC는 4위).</p>
          </div></div></section>

          <section className="sec wide"><div className="in"><div><span className="label">§04</span><h2>시즌별 경기 기록</h2></div><div className="body">
            {history.filter((h) => matches[h.season]?.length).map((h) => {
              const ms = matches[h.season];
              const w = ms.filter((m) => won(m) === true).length, l = ms.filter((m) => won(m) === false).length;
              return (
                <details key={h.season}>
                  <summary><b>{sl(h.season)}</b><span>{h.division ? `${h.division} 디비전 · ` : ''}{ms.length}경기 · {w}승 {l}패</span><span className="dim small">경기를 누르면 세부 점수</span></summary>
                  <div className="tscroll"><table className="tbl">
                    <thead><tr><th>구분</th><th>경기</th><th>레드</th><th>블루</th><th>점수</th><th>결과</th></tr></thead>
                    <tbody>
                      {ms.map((m, i) => (
                        <Fragment key={i}>
                          <tr className={m.bd ? 'open-bd' : undefined}>
                            <td>{m.div ?? ''}</td><td>{m.label ?? m.desc}</td>
                            <td className="red">{teamsOf(m.red)}</td><td className="blue">{teamsOf(m.blue)}</td>
                            <td className="num">{m.redScore != null && <><span className="red">{m.redScore}</span> : <span className="blue">{m.blueScore}</span></>}</td>
                            <td>{won(m) === true ? '승' : won(m) === false ? '패' : ''}</td>
                          </tr>
                          {m.bd && (
                            <tr className="bd" hidden><td colSpan={6}><div className="bdx">
                              {([['red', '레드', 'r', m.redScore], ['blue', '블루', 'b', m.blueScore]] as const).map(([k, label, cls, total]) => {
                                const x = m.bd[k];
                                return (
                                  <div className={`bs ${cls}${m[k].includes(n) ? ' ours' : ''}`} key={k}>
                                    <b>{label} {total}{m[k].includes(n) && ' · 우리 동맹'}</b>
                                    <span>오토 {x.auto} · 텔레옵 {x.tele} · 페널티 +{x.pen}</span>
                                    <span className="dim">반칙 마이너 {x.minor} · 메이저 {x.major}</span>
                                    {x.rp != null && <span>RP {x.rp}{x.rpItems.length > 0 && ` · ${x.rpItems.join(' · ')}`}</span>}
                                  </div>
                                );
                              })}
                            </div></td></tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table></div>
                </details>
              );
            })}
            {!history.some((h) => matches[h.season]?.length) && <p>공식 사이트에 올라간 경기 기록이 없어요.</p>}
            <BreakdownToggle />
          </div></div></section>

          <section className="sec"><div className="in"><div><span className="label">§05</span><h2>SNS · 연락</h2></div><div className="body">
            {links.length || p?.email || team.website ? <ul className="links">
              {links.map(([l, u]) => <li key={l}><a href={u} rel="external nofollow noopener">{l}</a></li>)}
              {!p?.web && team.website && <li><a href={team.website} rel="external nofollow noopener">{team.website}</a></li>}
              {p?.email && <li><a href={`mailto:${p.email}`}>{p.email}</a></li>}
            </ul> : <p className="dim">팀이 인스타그램, 유튜브, 홈페이지 링크를 등록하면 여기에 나와요.</p>}
          </div></div></section>

          <section className="sec"><div className="in"><div><span className="label">§06</span><h2>후원사</h2></div><div className="body">
            {ko.sponsors.length ? ko.sponsors.map((s) => (
              <div className="sp-card" key={s}>
                <div className="sp-logo" aria-hidden="true">{s.slice(0, 1)}</div>
                <div>
                  <h3>{s}</h3>
                  <dl>
                    <dt>같은 후원사 팀</dt><dd>{sameSponsor[s] ?? 1}팀</dd>
                  </dl>
                  <p className="more"><Link href={`/sponsors#${sponsorId(s)}`}>후원 기업 페이지에서 보기 →</Link></p>
                </div>
              </div>
            )) : <p className="dim">등록된 후원사가 없어요.</p>}
          </div></div></section>
        </>
      )}
    </main>
  );
}
