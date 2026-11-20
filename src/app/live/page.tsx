import { Fragment } from 'react';
import Link from 'next/link';
import { meta } from '@/lib/meta';
import { config, getEventSummary, getKoreanEvents } from '@/lib/ftc';
import { NEXT, LAST_SEASON, isEventDay, daysToNext, liveCfg } from '@/lib/krc';
import { logoFor } from '@/lib/logos';
import eventsKo from '@/data/events-ko.json';
import ops from '@/data/ops-schedule.json';
import { LiveBoot } from './LiveBoot';
import { EventTabs } from './EventTabs';
import './live.css';

// 대회 페이지. 평상시: 다음 대회 + 지난 KRC 결과 + 국내 대회 (서버 HTML, ISR 10분).
// 대회 날(또는 ?replay=시각 리허설): 브라우저가 /api/live를 30초마다 불러 Live 화면을 그린다 (LiveBoot).
export const revalidate = 600;
export const metadata = meta('/live');

const sl = (y: number) => `${y}–${String(y + 1).slice(2)}`;
const day = (d: string) => d.slice(0, 10);
const range = (a: string, b: string) => (day(a) === day(b) ? day(a) : `${day(a)} – ${day(b).slice(5)}`);
const KO = eventsKo as Record<string, { name?: string; venue?: string }>;

export default async function Page() {
  const cfg = config();
  const live = isEventDay();
  let sum: Awaited<ReturnType<typeof getEventSummary>> | null = null, error = '';
  let seasons: { season: number; events: Awaited<ReturnType<typeof getKoreanEvents>> }[] = [];
  try {
    const [s, now, last] = await Promise.all([getEventSummary(cfg, LAST_SEASON), getKoreanEvents(cfg, NEXT.season).catch(() => []), getKoreanEvents(cfg, LAST_SEASON)]);
    sum = s; seasons = [{ season: NEXT.season, events: now }, { season: LAST_SEASON, events: last }].filter((x) => x.events.length);
  } catch (e) { error = (e as Error).message; }
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);   // 한국 날짜
  const name = (n: number) => sum?.names[n] ?? '';
  const lc = liveCfg(cfg);
  const opsList = ((ops as any)[`${lc.season}/${lc.event}`] ?? []) as [string, string][];
  const dday = daysToNext();
  const team = (t: number, avatar = false) => (
    <Link className={avatar ? 't' : undefined} href={`/teams/${t}`} key={t} prefetch={false}>
      {avatar && <img className="avatar" src={logoFor(t).src} width="40" height="40" alt="" loading="lazy" />}{t} {name(t)}
      {avatar && sum!.worlds.includes(t) && <span className="chip yel">FIRST Championship</span>}
    </Link>
  );
  const joined = (ts: number[]) => ts.map((t, i) => <Fragment key={t}>{i > 0 && ' · '}{team(t)}</Fragment>);

  return (
    <main className="pg-live" data-live={live ? '1' : '0'} data-venues={JSON.stringify(KO)}>
      {/* 평상시 */}
      <div id="normal" hidden={live}>
        <section className="page-head"><div className="in">
          <span className="label">Competition · KRC</span>
          <h1>대회</h1>
          <p>KRC 일정과 지난 대회 결과, 국내 FTC 대회를 모았어요. 대회 당일에는 이 페이지가 실시간 화면으로 바뀌어요.</p>
          <EventTabs cur="KRCMP" />
        </div></section>

        <section className="sec"><div className="in"><div><span className="label">§01</span><h2>다음 대회</h2></div><div className="body">
          <div className="next-card">
            <div><span className="label">{NEXT.name}</span><div className="big" suppressHydrationWarning>{dday > 0 ? `D-${dday}` : 'D-DAY'}</div></div>
            <dl className="kv">
              <dt>날짜</dt><dd>2027년 1월 29일(금) – 30일(토)</dd>
              <dt>장소</dt><dd className="dim">협회 공지 후 안내</dd>
              <dt>참가 팀</dt><dd className="dim">공식 시스템에 대회가 만들어지면 자동으로 표시</dd>
              <dt>당일</dt><dd>이 페이지가 Live 화면으로 바뀌고, 우리 팀 경기 5분 전에 알림이 와요</dd>
            </dl>
          </div>
        </div></div></section>

        {error ? (
          <section className="sec"><div className="in"><div><span className="label">§02</span><h2>지난 대회</h2></div><div className="body"><p className="note">대회 데이터를 불러오지 못했어요. {error}</p></div></div></section>
        ) : sum && (
          <section className="sec wide"><div className="in">
            <div><span className="label">§02</span><h2>지난 대회 · {sl(sum.season)} KRC</h2>
              <p className="dim sub">{range(sum.start, sum.end)} · {KO.KRCMP?.venue ?? sum.venue} · {sum.teamCount}팀{sum.rankings.some((r) => r.div) && ` · ${sum.rankings.map((r) => r.div).join('·')} 디비전`}</p></div>
            <div className="body">
              {sum.finals.games.length > 0 && <>
                <h3>결승</h3>
                <div className="final">
                  <div className="al win"><span className="tag">우승 동맹</span>{sum.finals.win.map((t) => team(t, true))}</div>
                  <div className="scores">
                    <b>{sum.finals.games.filter((g) => g.win > g.lose).length} : {sum.finals.games.filter((g) => g.win < g.lose).length}</b>
                    {sum.finals.games.map((g, i) => <span key={i}>결승 {i + 1} <span className="w">{g.win}</span> : <span className="l">{g.lose}</span><br /></span>)}
                  </div>
                  <div className="al"><span className="tag">결승 동맹</span>{sum.finals.lose.map((t) => team(t, true))}</div>
                </div>
              </>}

              {sum.divWinners.length > 0 && <>
                <h3>디비전 우승</h3>
                <div className="cols2">
                  {sum.divWinners.map((d) => (
                    <div className="box" key={d.div}><h4>{d.div} 디비전</h4>
                      <p><span className="dim">우승</span> {joined(d.win)}</p>
                      <p><span className="dim">결승</span> {joined(d.fin)}</p>
                    </div>
                  ))}
                </div>
              </>}

              {sum.worlds.length > 0 && <>
                <h3>세계 대회 진출</h3>
                <p className="worlds">{sum.worlds.map((t) => <Link href={`/teams/${t}`} key={t} prefetch={false}><span className="chip yel">FIRST Championship</span> {t} {name(t)}</Link>)}</p>
              </>}

              {sum.awards.length > 0 && <>
                <h3>수상</h3>
                <div className="box"><div className="aw">
                  <div className="h">상</div><div className="h">수상</div><div className="h">2위</div>
                  {sum.awards.map((a) => <Fragment key={a.name}>
                    <div>{a.name}</div>
                    <div>{a.first.map((t) => team(t))}</div>
                    <div>{a.second.length ? a.second.map((t) => team(t)) : <span className="dim">–</span>}</div>
                  </Fragment>)}
                </div></div>
              </>}

              <h3>{sum.rankings.some((r) => r.div) ? '디비전 순위' : '예선 순위'}</h3>
              {sum.rankings.map((r) => (
                <details key={r.div || 'all'}>
                  <summary><b>{r.div ? `${r.div} 디비전` : '예선'}</b><span className="dim">{r.rows.length}팀</span></summary>
                  <div className="tscroll"><table className="tbl">
                    <thead><tr><th>순위</th><th>팀</th><th>승-패-무</th></tr></thead>
                    <tbody>{r.rows.map((x) => <tr key={x.team}><td className="num">{r.cap && x.rank <= r.cap ? <span className="chip blue">{x.rank}위</span> : `${x.rank}위`}</td><td>{team(x.team)}</td><td className="num">{x.rec}</td></tr>)}</tbody>
                  </table></div>
                </details>
              ))}
              <p className="legend"><span className="chip yel">FIRST Championship</span><span className="chip blue">Captain</span><a className="dim replay" href={`?replay=${day(sum.end)}T11:15`}>이 대회 당일 화면 다시 보기 →</a></p>
            </div>
          </div></section>
        )}

        {seasons.map(({ season, events }, i) => (
          <section className="sec wide" key={season}><div className="in"><div><span className="label">§0{3 + i}</span><h2>국내 FTC 대회 · {sl(season)}</h2></div><div className="body">
            <div className="tscroll"><table className="tbl">
              <thead><tr><th>날짜</th><th>대회</th><th>장소</th><th>참가</th><th>결과</th></tr></thead>
              <tbody>{events.map((e) => (
                <tr key={e.code}>
                  <td className="num">{range(e.start, e.end)}</td><td>{KO[e.code]?.name ?? e.name}</td><td>{KO[e.code]?.venue ?? e.venue}</td><td className="num">{e.teams ? `${e.teams}팀` : <span className="dim">–</span>}</td>
                  <td>{e.results ? <a className="ok" href={`https://ftc-events.firstinspires.org/${season}/${e.code}`} rel="external">공식 결과 →</a>
                    : day(e.end) >= today ? <span className="dim">예정</span> : <span className="dim">결과 비공개</span>}</td>
                </tr>
              ))}</tbody>
            </table></div>
            <p className="note">FTC 공식 시스템에 올라온 한국 대회예요. 주최 측이 결과를 올리지 않은 대회는 참가 팀까지만 보여요.</p>
          </div></div></section>
        ))}
      </div>

      {/* 대회 당일 Live (LiveBoot가 채움) */}
      <div id="live" hidden={!live}>
        <section className="page-head"><div className="in">
          <div className="livebar"><span className="dot"></span><span id="liveClock">LIVE</span></div>
          <h1 id="ev">대회 Live</h1>
          <p id="meta">경기 일정, 결과, 순위가 30초마다 새로 고쳐져요.</p>
          <EventTabs cur={lc.event} />
        </div></section>

        <section className="sec wide"><div className="in"><div><span className="label">§01</span><h2>우리 팀</h2></div><div className="body">
          <form id="myform" className="myform"><label htmlFor="my">팀 번호</label><input id="my" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="예: 12345" /><button className="btn" type="submit">보기</button><span className="dim small">팀 로그인하면 자동으로 우리 팀이 선택돼요</span></form>
          <div id="mine"></div>
        </div></div></section>

        <section className="sec wide"><div className="in"><div><span className="label">§02</span><h2 id="h2main">지금 진행 중</h2></div><div className="body" id="main2"><p className="note">불러오는 중…</p></div></div></section>

        <section className="sec wide alt"><div className="in"><div><span className="label">§03</span><h2 id="h2other">다른 디비전</h2></div><div className="body" id="other"></div></div></section>

        <section className="sec"><div className="in"><div><span className="label">§04</span><h2>운영 일정</h2></div><div className="body">
          {opsList.length ? <ol className="tl" id="ops">{opsList.map(([t, x]) => <li data-t={t} key={t}><time>{t.slice(11, 16)}</time>{x}</li>)}</ol>
            : <p className="dim">운영진이 개회식·점심·동맹 선택·시상 일정을 올리면 여기에 보여요.</p>}
        </div></div></section>
      </div>
      <LiveBoot />
    </main>
  );
}
