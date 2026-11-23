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
// 동문회가 만든 것 (인스타 소개글과 같은 3가지)
const MADE = [
  { href: '/live', ext: false, tag: 'Live', h: '대회 Live · 경기 호출', d: '대진표와 결과를 실시간으로 보고, 우리 팀 경기 차례가 다가오면 휴대폰으로 알려 줘요.' },
  { href: 'https://www.krcalumni.com/tech-blog/', ext: true, tag: 'KRC Tech', h: 'KRC Tech', d: '선배들과 팀들이 로봇 개발 과정을 올리는 기술 아카이브예요. 종이 엔지니어링 노트를 온라인으로.' },
  { href: '/learn/girigocha', ext: false, tag: 'Girigocha', h: '기리고차', d: '동문회가 만든 메카넘 경로 추종 라이브러리예요. 경로 에디터로 그리고, 블록으로도 오토를 짜요.' },
] as const;
// 누구를 위한 곳인지: 세 갈래
const FOR = [
  { who: '지금 참가하는 학생', d: '우리 팀 번호를 등록하면 대진표·경기 호출·오토 공유를 바로 쓸 수 있어요.', href: '/start', go: '우리 팀 설정' },
  { who: 'KRC 동문', d: '회원가입하고 대회 심판·운영 자원봉사와 후배 지원에 함께해요.', href: '/alumni', go: '동문회 보기' },
  { who: '기업 · 기관', d: 'KRC 팀을 후원하거나 동문회와 함께할 일을 찾고 있다면 여기서 시작해요.', href: '/sponsors', go: '후원 기업 보기' },
] as const;

export default function Page() {
  return (
    <>
    <JsonLd data={ld} />
    <main>
    <div className="home">
      <Pcb />
      <section className="hero" aria-labelledby="h1"><div>
        <h1 id="h1">KRC Alumni</h1>
        <p className="sub">The match ends. The team doesn&apos;t.</p>
        <p className="dd"><DDay id="dday" start={START} after="KRC 2027" /><span><em>KRC 2027</em>2027년 1월 29일(금) – 30일(토)</span></p>
        <div className="cta"><TeamButton live={isEventDay()} /><Link className="btn" href="/login">회원가입</Link></div>
      </div></section>
      <nav className="go" aria-label="바로가기">
        {GO.map(([href, h, d, c]) => <Link key={href} href={href} data-c={c}><b>{h}</b><span>{d}</span></Link>)}
      </nav>
    </div>

    <section className="sec made"><div className="in">
      <div><span className="label">§01</span><h2>동문회가 만든 것</h2><p className="dim">KRC를 뛰었던 선배들이 대회에서 필요했던 도구를 만들었어요.</p></div>
      <div className="body cards3">
        {MADE.map((m) => (
          <a key={m.h} href={m.href} {...(m.ext && { target: '_blank', rel: 'noopener' })}>
            <span className="label">{m.tag}</span><b>{m.h}{m.ext && ' ↗'}</b><p>{m.d}</p>
          </a>
        ))}
      </div>
    </div></section>

    <section className="sec for"><div className="in">
      <div><span className="label">§02</span><h2>누구를 위한 곳인가요</h2></div>
      <div className="body rows3">
        {FOR.map((f) => (
          <div key={f.who}><b>{f.who}</b><p>{f.d}</p><Link className="btn sm" href={f.href}>{f.go} →</Link></div>
        ))}
      </div>
    </div></section>
    </main>
    </>
  );
}
