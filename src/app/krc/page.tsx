import Link from 'next/link';
import { meta } from '@/lib/meta';
import JsonLd from '@/components/JsonLd';

export const metadata = meta('/krc');

// 사실 정보는 확인된 것만 (근거: CLAUDE.md, research-2026-10-23.md). 확인 전 칸은 「자료 모으는 중」.
const ld = [
  {
    '@context': 'https://schema.org', '@type': 'SportsEvent', name: 'Korea Robot Championship 2027', alternateName: 'KRC 2027',
    startDate: '2027-01-29', endDate: '2027-01-30', sport: 'Robotics (FIRST Tech Challenge)',
    organizer: { '@type': 'Organization', name: '창의공학교육협회' },
  },
  {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'KRC는 어떤 대회인가요?', acceptedAnswer: { '@type': 'Answer', text: 'KRC(Korea Robot Championship)는 창의공학교육협회가 주관하는 학생 로봇 대회로, 미국 FIRST 재단의 FIRST Tech Challenge(FTC)에 해당하는 국내 대회입니다. 약 14년 동안 이어져 왔습니다.' } },
      { '@type': 'Question', name: 'KRC 경기는 어떻게 진행되나요?', acceptedAnswer: { '@type': 'Answer', text: '두 팀이 한 동맹(얼라이언스)을 이뤄 레드 동맹과 블루 동맹이 겨룹니다. 경기는 로봇이 스스로 움직이는 오토노머스 구간으로 시작해, 드라이버가 조종하는 텔레옵 구간으로 이어집니다. 게임 과제는 시즌마다 바뀝니다.' } },
      { '@type': 'Question', name: 'KRC 2027은 언제 열리나요?', acceptedAnswer: { '@type': 'Answer', text: 'KRC 2027은 2027년 1월 29일부터 30일까지 열립니다.' } },
    ],
  },
];

export default function Page() {
  return (
    <main>
      <JsonLd data={ld} />
      <section className="page-head"><div className="in">
        <span className="label">KRC · Korea Robot Championship</span>
        <h1>Korea Robot Championship</h1>
        <p>KRC는 창의공학교육협회가 주관하는 학생 로봇 대회예요. 미국 FIRST 재단의 FIRST Tech Challenge(FTC)에 해당하는 국내 대회로, 약 14년 동안 이어져 왔어요.</p>
      </div></section>

      <section className="sec" id="about"><div className="in">
        <div><span className="label">§01</span><h2>KRC는 어떤 대회인가요</h2></div>
        <div className="body">
          <p>학생 팀이 한 시즌 동안 로봇을 직접 설계하고, 만들고, 프로그래밍해서 출전하는 대회예요. 시즌마다 새 게임 과제가 발표되고, 팀은 그 과제를 푸는 로봇을 처음부터 만들어요.</p>
          <p>KRC는 FTC 공식 운영 시스템으로 진행돼요. 그래서 경기 일정과 결과가 FIRST의 공식 대회 사이트에도 올라가요.</p>
        </div>
      </div></section>

      <section className="sec" id="first"><div className="in">
        <div><span className="label">§02</span><h2>창의공학교육협회와 FIRST</h2></div>
        <div className="body">
          <p>창의공학교육협회는 2011년부터 FIRST의 한국 공식 파트너로 국내 FTC 대회를 열고 있어요.</p>
          <p>FIRST는 학생들이 로봇을 만들며 과학·기술·공학을 배우도록 돕는 미국의 비영리 재단이에요. FTC는 FIRST가 운영하는 프로그램 가운데 하나예요.</p>
        </div>
      </div></section>

      <section className="sec" id="game"><div className="in">
        <div><span className="label">§03</span><h2>경기 방식</h2></div>
        <div className="body">
          <ul>
            <li><b>동맹 대 동맹</b> — 두 팀이 한 동맹(얼라이언스)을 이뤄, 레드 동맹과 블루 동맹이 한 경기에서 겨뤄요. 동맹은 경기마다 바뀌어요.</li>
            <li><b>오토노머스</b> — 경기는 로봇이 미리 짠 프로그램만으로 스스로 움직이는 구간으로 시작해요.</li>
            <li><b>텔레옵</b> — 이어서 드라이버가 컨트롤러로 로봇을 조종해요.</li>
            <li><b>예선과 본선</b> — 예선 경기 순위로 상위 팀이 정해지고, 본선(플레이오프)에서 동맹을 골라 우승을 겨뤄요.</li>
          </ul>
          <p className="note">게임 과제와 점수 규칙은 시즌마다 바뀌어요. 이번 시즌 규칙 요약은 <Link href="/learn/season">시즌 자료실</Link>에 정리할 예정이에요.</p>
        </div>
      </div></section>

      <section className="sec" id="krc2027"><div className="in">
        <div><span className="label">§04</span><h2>KRC 2027</h2></div>
        <div className="body">
          <table className="tbl"><tbody>
            <tr><th scope="row">날짜</th><td>2027년 1월 29일(금) – 30일(토)</td></tr>
            <tr><th scope="row">장소</th><td>협회 공지 후 안내</td></tr>
            <tr><th scope="row">참가 신청</th><td>협회 공지 후 안내</td></tr>
            <tr><th scope="row">대진·결과</th><td>대회 당일 <Link href="/live">대회 Live</Link>에서 실시간으로</td></tr>
          </tbody></table>
        </div>
      </div></section>

      <section className="sec" id="history"><div className="in">
        <div><span className="label">§05</span><h2>역대 대회</h2></div>
        <div className="body">
          <table className="tbl">
            <thead><tr><th>시즌</th><th>날짜</th><th>장소</th><th>기록</th></tr></thead>
            <tbody>
              <tr><td>2025–26</td><td className="num">2026-01-30 – 31</td><td>대전컨벤션센터</td><td><a href="https://ftc-events.firstinspires.org/2025/KRCMP" rel="external">FTC 공식 결과</a></td></tr>
              <tr><td>2024–25</td><td className="num">2025-01-20</td><td>대전</td><td><a href="https://ftc-events.firstinspires.org/2024/KRCMP" rel="external">FTC 공식 결과</a></td></tr>
              <tr><td>2023–24</td><td className="num">2024-01-27</td><td>대전컨벤션센터</td><td><a href="https://ftc-events.firstinspires.org/2023/KRCMP" rel="external">FTC 공식 결과</a></td></tr>
              <tr><td>2022–23</td><td className="num">2023-02-04</td><td>대전컨벤션센터</td><td><a href="https://ftc-events.firstinspires.org/2022/KRCMP" rel="external">FTC 공식 결과</a></td></tr>
            </tbody>
          </table>
          <p className="note">2022–23 시즌부터는 FTC 공식 사이트에 기록이 있어요. 그 이전 대회와 역대 우승팀 기록을 모으고 있어요. 지난 대회 자료(결과표, 사진, 우승팀)를 가진 동문은 <Link href="/alumni#contact">동문회</Link>로 알려 주세요.</p>
        </div>
      </div></section>

      <section className="sec" id="alumni"><div className="in">
        <div><span className="label">§06</span><h2>KRC 동문</h2></div>
        <div className="body">
          <p>KRC에 참가했던 동문의 프로필을 이곳에 모아요. 본인이 공개를 선택한 경우에만 실려요.</p>
          <p><Link className="btn" href="/alumni#join">동문 프로필 신청</Link></p>
        </div>
      </div></section>
    </main>
  );
}
