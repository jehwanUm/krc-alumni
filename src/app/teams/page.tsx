import Link from 'next/link';
import { meta } from '@/lib/meta';
import { getDirectory, type DirTeam } from '@/lib/teams';
import { getTeamsView } from '@/lib/directory';
import type { SeasonResult } from '@/lib/ftc';
import { TeamsBoot } from './TeamsBoot';
import './teams.css';

// 서버가 FTC API로 HTML을 만들고 ISR로 10분 캐시. 시즌 탭·검색·정렬·카드/표 전환은 TeamsBoot가 같은 HTML을 다시 배치한다.
export const revalidate = 600;
export const metadata = meta('/teams');

const sl = (y: number) => `${y}–${String(y + 1).slice(2)}`;
// 시즌 성적 점수 (작을수록 위): 우승 동맹 → 결승 동맹 → 세계 대회 → 예선 순위
const perf = (r?: SeasonResult) => {
  if (!r) return 9999;
  let s = r.rank ?? 500;
  if (r.awards.some((a) => /^Winning Alliance/.test(a))) s -= 3000;
  else if (r.awards.some((a) => /^Finalist Alliance/.test(a))) s -= 2000;
  if (r.worlds) s -= 1000;
  return s;
};
// 이번 시즌(FTC 시즌) 공개 오토 경로 수. shortcut: 오토 공유(로그인 이후)가 생기기 전까지 0, 생기면 DB에서 센다
const autoCount = (_n: number) => 0;

export default async function Page() {
  let dir: Awaited<ReturnType<typeof getTeamsView>> | null = null, error = '';
  try { dir = await getTeamsView(); } catch (e) { error = (e as Error).message; }
  const seasons = dir ? Object.keys(dir.res).map(Number).sort((a, b) => b - a) : [];
  const latest = seasons[0];
  const resOf = (t: DirTeam, s: number) => dir!.res[s]?.[t.n];
  return (
    <main className="pg-teams">
      <section className="page-head"><div className="in">
        <span className="label">Teams · KRC 참가 팀</span>
        <h1>팀</h1>
        <p>Korea Robot Championship에 참가한 팀이에요. 팀을 누르면 시즌별 기록, 공개 오토, 후원사를 볼 수 있어요.</p>
      </div></section>

      <div className="in">
        {error || !dir ? <p className="note">팀 목록을 불러오지 못했어요. {error}</p> : (
          <>
            <div className="ctrl">
              <div className="tabs" role="group" aria-label="시즌">
                {seasons.map((s) => <button type="button" key={s} data-season={s} aria-pressed={s === latest}>{sl(s)}</button>)}
                <button type="button" data-season="all" aria-pressed="false">전체</button>
              </div>
              <div className="tools">
                <input id="q" type="search" placeholder="번호·이름·소속·후원사 검색" aria-label="팀 검색" />
                <select id="sort" aria-label="정렬" defaultValue="n">
                  <option value="n">번호순</option><option value="name">이름순</option><option value="school">소속순</option>
                  <option value="sponsor">후원사순</option><option value="count">출전 횟수순</option><option value="perf">시즌 성적순</option>
                </select>
                <div className="seg" role="group" aria-label="보기">
                  <button type="button" data-view="card" aria-pressed="true">카드</button><button type="button" data-view="table" aria-pressed="false">표</button>
                </div>
              </div>
            </div>
            <div className="sub">
              <p className="count-line" id="cnt">{sl(latest)} 시즌 · {dir.teams.filter((t) => t.seasons.includes(latest)).length}팀</p>
              <label className="only-auto"><input type="checkbox" id="onlyAuto" /> 오토 공개 팀만</label>
            </div>

            <div className="dir view-card" id="dir">
              <div className="dir-head" aria-hidden="true"><span>팀</span><span>소속 · 지역</span><span>후원사</span><span>성적</span><span>출전 · 이번 시즌 오토</span></div>
              <p className="no-auto" id="noAuto" hidden>아직 이번 시즌 오토를 공개한 팀이 없어요.</p>
              {dir.teams.map((t) => {
                const lastSeason = t.seasons[0];
                return (
                  <Link className="tm" href={`/teams/${t.n}`} key={t.n} prefetch={false} hidden={!t.seasons.includes(latest)}
                    data-auto={autoCount(t.n)} data-n={t.n} data-name={t.name.toLowerCase()} data-school={t.school} data-sponsor={t.sponsors.join(' ')} data-count={t.seasons.length}
                    data-seasons={t.seasons.join(' ')} data-search={[t.n, t.name, t.school, t.region, ...t.sponsors].join(' ').toLowerCase()}
                    data-perf-all={perf(resOf(t, lastSeason))} {...Object.fromEntries(seasons.map((s) => [`data-perf-${s}`, perf(resOf(t, s))]))}>
                    <div className="tm-who">
                      <img className="avatar" src={t.logo} width="64" height="64" alt="" loading="lazy" />
                      <div><span className="num">{t.n}</span><b>{t.name}</b></div>
                    </div>
                    <div className="tm-org">{t.school || <span className="dim">소속 확인 필요</span>}{t.region && ` · ${t.region}`}</div>
                    <div className="tm-sp">{t.sponsors.length ? <>Supported by {t.sponsors.join(' · ')}</> : <span className="only-table">–</span>}</div>
                    <div className="tm-res">
                      {[...seasons, 'all' as const].map((s) => {
                        const y = s === 'all' ? lastSeason : s;
                        const r = resOf(t, y);
                        return (
                          <span className="r" data-s={s} key={s} hidden={s !== latest}>
                            {s === 'all' && <span className="dim">{sl(y)}</span>}
                            {r?.worlds && <span className="chip yel">FIRST Championship</span>}
                            {r?.rank ? <span className={r.cap && r.rank <= r.cap ? 'chip blue' : 'dim'}>{r.div ? `${r.div} ` : ''}{r.rank}위</span> : !r?.awards.length && <span className="dim">공식 결과 없음</span>}
                            {r?.awards.length ? <span className="dim">수상 {r.awards.length}</span> : null}
                          </span>
                        );
                      })}
                    </div>
                    <div className="tm-foot"><span>KRC 출전 {t.seasons.length}회</span><span className={autoCount(t.n) ? 'has' : undefined}>이번 시즌 오토 {autoCount(t.n)}</span></div>
                  </Link>
                );
              })}
            </div>
            <p className="note">소속·지역·후원사는 FTC 공식 영문 이름을 한글로 옮긴 것이라 운영진이 확인하고 있어요. 틀린 곳은 동문회로 알려 주세요.</p>
            <TeamsBoot />
          </>
        )}
      </div>
    </main>
  );
}
