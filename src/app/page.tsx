import Link from 'next/link';
import { meta } from '@/lib/meta';
import JsonLd from '@/components/JsonLd';
import { DDay, Pcb, TeamButton } from '@/components/Client';
import { isEventDay } from '@/lib/krc';

export const metadata = meta('/');
export const revalidate = 600;   // 대회 날이면 홈 버튼이 Live로 간다

// 다음 대회 (info: KRC 2027, 2027-01-29~30). 빌드 때 값을 넣고, 방문 시점 기준으로 다시 센다.
const START = '2027-01-29';
const ld = [{
  '@context': 'https://schema.org', '@type': 'SportsEvent', name: 'Korea Robot Championship 2027', alternateName: 'KRC 2027',
  startDate: '2027-01-29', endDate: '2027-01-30', sport: 'Robotics (FIRST Tech Challenge)',
  organizer: { '@type': 'Organization', name: '창의공학교육협회' },
}];

const GO = [
  ['/live', '대회', '일정·경기·순위', 'blue'],
  ['/teams', '팀', '역대 기록과 수상', 'ink'],
  ['/auto', '오토', '경로 그리고 공유', 'red'],
  ['/learn', '배움', '시즌 자료와 가이드', 'yel'],
] as const;

export default function Page() {
  return (
    <>
    <JsonLd data={ld} />
    <main className="home">
      <Pcb />
      <section className="hero" aria-labelledby="h1"><div>
        <h1 id="h1">KRC Alumni</h1>
        <p className="sub">The match ends. The team doesn&apos;t.</p>
        <p className="dd"><DDay id="dday" start={START} after="KRC 2027" /><span><em>KRC 2027</em>2027년 1월 29일(금) – 30일(토)</span></p>
        <div className="cta"><TeamButton live={isEventDay()} /></div>
      </div></section>
      <nav className="go" aria-label="바로가기">
        {GO.map(([href, h, d, c]) => <Link key={href} href={href} data-c={c}><b>{h}</b><span>{d}</span></Link>)}
      </nav>
    </main>
    </>
  );
}
