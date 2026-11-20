import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { config, getLive, getTeams } from '@/lib/ftc';
import { REGIONALS, isEventDay } from '@/lib/krc';
import eventsKo from '@/data/events-ko.json';
import { EventTabs } from '../EventTabs';
import '../live.css';

// 지역 대회 한 곳: 일정·장소, 참가 팀, (올라오면) 순위와 경기. 대회 당일 실시간 화면은 /live
export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const code = (await params).code.toUpperCase();
  const r = REGIONALS.find((x) => x.event === code);
  return { title: r ? `${r.title} · ${r.start} · KRC Alumni` : '대회 · KRC Alumni', robots: { index: false } };
}
const KO = eventsKo as Record<string, { name?: string; venue?: string }>;
const hm = (iso: string | null) => (iso ? iso.slice(11, 16) : '–');

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  const r = REGIONALS.find((x) => x.event === code);
  if (!r) notFound();
  const c = { ...config(), season: r.season, event: r.event };
  let d: Awaited<ReturnType<typeof getLive>> | null = null, teams: any[] = [], error = '';
  try { [d, teams] = await Promise.all([getLive(c), getTeams(c)]); } catch (e) { error = (e as Error).message; }
  const ev = d?.event;
  const today = isEventDay(Date.now(), r);
  const played = (d?.rankings ?? []).some((x: any) => x.played > 0);
  const name = (n: number) => teams.find((t) => t.teamNumber === n)?.nameShort?.trim() ?? '';
  const team = (n: number) => <Link href={`/teams/${n}`} prefetch={false} key={n}>{n}</Link>;

  return (
    <main className="pg-live">
      <section className="page-head"><div className="in">
        <span className="label">Competition · {r.city}</span>
        <h1>{KO[r.event]?.name ?? r.title}</h1>
        {r.sponsor && <p className="sponsor"><span className="chip yel">Sponsor</span> {r.sponsor}</p>}
        <p>{r.start === r.end ? r.start : `${r.start} – ${r.end.slice(5)}`} · {KO[r.event]?.venue ?? ev?.venue ?? ''} · 참가 {teams.length}팀</p>
        {today && <p><Link className="btn pri" href="/live">지금 Live 보기 →</Link></p>}
        <EventTabs cur={r.event} />
      </div></section>

      {error && <section className="sec"><div className="in"><div /><div className="body"><p className="note">대회 데이터를 불러오지 못했어요. {error}</p></div></div></section>}

      {played && (
        <section className="sec wide"><div className="in"><div><span className="label">§01</span><h2>순위</h2></div><div className="body">
          <div className="tscroll"><table className="tbl">
            <thead><tr><th>순위</th><th>팀</th><th>승-패-무</th></tr></thead>
            <tbody>{d!.rankings.map((x: any) => <tr key={x.team}><td className="num">{x.rank}위</td><td>{team(x.team)} {x.name}</td><td className="num">{x.wins}-{x.losses}-{x.ties}</td></tr>)}</tbody>
          </table></div>
        </div></div></section>
      )}

      <section className="sec wide"><div className="in"><div><span className="label">§0{played ? 2 : 1}</span><h2>경기</h2></div><div className="body">
        {d?.matches.length ? (
          <div className="tscroll"><table className="tbl">
            <thead><tr><th>경기</th><th>시각</th><th>레드</th><th>블루</th><th>점수</th></tr></thead>
            <tbody>{d.matches.map((m: any) => (
              <tr key={`${m.level}-${m.series}-${m.no}`}>
                <td>{m.label}</td><td className="num">{hm(m.start)}</td>
                <td>{m.red.map((n: number, i: number) => <span key={n}>{i > 0 && ' · '}{team(n)}</span>)}</td>
                <td>{m.blue.map((n: number, i: number) => <span key={n}>{i > 0 && ' · '}{team(n)}</span>)}</td>
                <td className="num">{m.redScore == null ? '–' : `${m.redScore} : ${m.blueScore}`}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="dim">주최 측이 공식 시스템에 대진표를 올리면 여기에 보여요.</p>}
      </div></div></section>

      <section className="sec wide"><div className="in"><div><span className="label">§0{played ? 3 : 2}</span><h2>참가 팀</h2></div><div className="body">
        {teams.length ? (
          <div className="tscroll"><table className="tbl">
            <thead><tr><th>번호</th><th>팀</th><th>지역</th></tr></thead>
            <tbody>{[...teams].sort((a, b) => a.teamNumber - b.teamNumber).map((t) => <tr key={t.teamNumber}><td className="num">{team(t.teamNumber)}</td><td>{name(t.teamNumber)}</td><td className="dim">{t.city}</td></tr>)}</tbody>
          </table></div>
        ) : <p className="dim">아직 공식 시스템에 등록된 팀이 없어요.</p>}
        <p className="note">FTC 공식 시스템 기준, 5분마다 새로 고쳐져요. <a href={`https://ftc-events.firstinspires.org/${r.season}/${r.event}`} rel="external">공식 페이지 →</a></p>
      </div></div></section>
    </main>
  );
}
