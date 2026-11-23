import Link from 'next/link';
import { meta } from '@/lib/meta';

export const metadata = meta('/learn/new-team');

// 출처: FTC Competition Manual TU10(2026-11-19), FTC Docs, Game Manual 0 — 인스타 「FTC 입문 시리즈 ①~④」와 같은 원고
const X = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;

const Sec = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="sec"><div className="in"><div><span className="label">§{n}</span><h2>{title}</h2></div><div className="body">{children}</div></div></section>
);

export default function Page() {
  return (
    <main className="guide">
      <section className="page-head"><div className="in">
        <span className="label">Learn · New team</span>
        <h1>신생 팀 가이드</h1>
        <p>처음 KRC에 나가는 팀이 한 시즌을 끝까지 갈 수 있도록, 순서대로 정리해요. FTC 공식 매뉴얼 TU10(2026-11-19)과 FTC Docs, Game Manual 0을 바탕으로 썼어요.</p>
      </div></section>

      <Sec n="01" title="KRC와 FTC">
        <p><b>KRC(Korea Robot Championship)</b>는 FIRST의 한국 공식 파트너인 FEST창의공학교육협회가 여는 <b>FTC(FIRST Tech Challenge)</b> 한국 대회예요. 두 팀이 한 동맹이 되어 빨강·파랑 동맹이 겨뤄요.</p>
        <ul>
          <li><b>KRC 2027</b> — 1월 말 예정</li>
          <li><b>팀 등록·참가비·일정</b> — 협회 공지를 따르세요</li>
        </ul>
        <p className="note">대회 운영은 협회가 정해요. 정확한 내용은 <X href="https://fest.or.kr">fest.or.kr</X>에서 확인하세요.</p>
      </Sec>

      <Sec n="02" title="첫 시즌 순서">
        <ol>
          <li><b>대회 확인</b> — 협회 공지로 일정·등록 방법 확인</li>
          <li><b>규칙 읽기</b> — 공식 매뉴얼부터 (§03)</li>
          <li><b>로봇</b> — 스타터 키트와 스타터봇으로 시작 (§04)</li>
          <li><b>코딩</b> — Blocks부터 (§05)</li>
          <li><b>연습</b> — 로봇은 절반일 뿐, 나머지는 드라이버 연습</li>
          <li><b>기록·심사</b> — 상은 인터뷰와 포트폴리오로 받아요 (§06)</li>
        </ol>
      </Sec>

      <Sec n="03" title="먼저 읽을 자료">
        <ul>
          <li><b><X href="https://ftc-resources.firstinspires.org/ftc/game/manual">Competition Manual</X></b> — 규칙의 최종 기준. 지금은 TU10(2026-11-19). 팀 업데이트가 거의 매주 나와요</li>
          <li><b><X href="https://ftc-docs.firstinspires.org/en/latest/persona_pages/rookie_teams/rookie_teams.html">FTC Docs · New Teams</X></b> — 컨트롤 시스템, 코딩, CAD, 상 기준을 한곳에 모은 공식 문서</li>
          <li><b><X href="https://game-manual-0.readthedocs.io/">Game Manual 0</X></b> — 전 세계 입문 팀이 보는 커뮤니티 가이드 (공식 문서 아님)</li>
          <li><b><X href="https://ftc-cmchatbot.firstinspires.org/">공식 AI 챗봇</X></b> — 최신 매뉴얼로 학습한 규칙 챗봇. 답은 매뉴얼로 꼭 다시 확인</li>
          <li><b><X href="https://ftc-qa.firstinspires.org/">공식 Q&amp;A 게시판</X></b> — 애매한 판정은 여기서 (2026-09-28부터 열림)</li>
          <li><b><X href="https://ftc-resources.firstinspires.org/ftc/game/tu-combined">팀 업데이트 모음</X></b> — 매뉴얼이 바뀔 때마다 나오는 변경 요약</li>
        </ul>
        <p>이번 시즌 게임 BIOBUZZ의 한국어 요약은 <Link href="/learn/season">시즌 자료실</Link>에 있어요.</p>
      </Sec>

      <Sec n="04" title="로봇 · 키트">
        <ul>
          <li><b>스타터 키트로 시작</b> — Game Manual 0도 신생 팀에게 강하게 추천해요</li>
          <li><b><X href="https://www.gobilda.com/ftc-starter-bot-resource-guide-2026-2027-season/">goBILDA StarterBot</X></b> — BIOBUZZ용 설계도·조립 설명서·예제 코드 공개. 2026-27 스타터 키트(또는 업그레이드 팩) + REV Control Hub 필요</li>
          <li><b>기본 규격</b> — 시작은 18인치 큐브 안(R102), 무게 제한 없음(R104), 모터·서보 각 8개까지(R503)</li>
          <li><b>CAD</b> — <X href="https://www.onshape.com/en/education/robotics">Onshape</X>는 FTC 팀에게 무료. 3D 모델링은 <Link href="/learn/lectures">강의</Link>도 있어요</li>
        </ul>
      </Sec>

      <Sec n="05" title="프로그래밍">
        <p>FIRST는 <b>모든 사람에게 Blocks로 시작하라</b>고 권해요.</p>
        <ul>
          <li><b>Blocks</b> — 끌어다 놓는 블록, 브라우저에서. 입문 팀에게 가장 좋은 도구</li>
          <li><b>OnBot Java</b> — 브라우저에서 쓰는 Java. Java를 제대로 알아야 해요</li>
          <li><b>Android Studio</b> — 설치형 개발 환경. Java 경험이 많은 고급 사용자용, 전용 노트북 권장</li>
        </ul>
        <ul>
          <li>Blocks·OnBot Java는 브라우저만 있으면 돼요 (FTC Docs: iPad, 안드로이드 폰, 크롬북도 가능)</li>
          <li>로봇이 없어도 <X href="https://ftcsim.org/">FTCSim</X>에서 연습할 수 있어요 (Blockly·Java, 한국어 메뉴)</li>
          <li>Blocks 처음이라면 <X href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/blocks/Blocks-Tutorial.html">FTC Docs · Blocks 튜토리얼</X></li>
          <li>Android Studio를 쓴다면 SDK <X href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/releases">FtcRobotController v12.0</X>(2026-09-12)과 Android Studio Narwhal 3 Feature Drop 이상</li>
          <li>오토 경로 추종은 블록으로도 — <Link href="/learn/girigocha">기리고차 가이드</Link></li>
        </ul>
        <p className="note">더 자세한 비교: <X href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/shared/choosing_program_lang/choosing-program-lang.html">FTC Docs · Choosing a Programming Tool</X></p>
      </Sec>

      <Sec n="06" title="심사 · 포트폴리오">
        <p>입문 팀도 상을 받을 수 있어요. 수상 팀은 &ldquo;최고&rdquo;가 아니라 &ldquo;기준의 좋은 예시&rdquo;예요. 로봇이 없어도 심사·수상이 가능해요.</p>
        <ul>
          <li><b>상의 구조</b> — Inspire(최고상) / 로봇 MCI: Innovate·Design·Control / 팀 TA: Connect·Reach·Sustain / 문서: Think</li>
          <li><b>포트폴리오 필수</b> — Inspire, Think, Control. 나머지 상도 심사위원이 팀을 이해하는 가장 좋은 자료예요</li>
          <li><b>Think</b> — 엔지니어링 과정, 배우고 적용한 점, 아이디어 비교, 수학으로 내린 결정 중 하나 이상</li>
          <li><b>Control</b> — 제어 부품과 역할·해결한 문제, 센서 등 외부 피드백으로 로봇을 제어. 코드 전체는 안 넣어도 돼요</li>
        </ul>
        <ul>
          <li><b>포트폴리오 규칙</b> — 2026년 1월 1일 이후 내용만 · 표지 1장(팀 번호 필수) + 본문 15쪽 · Letter 또는 A4 · 디지털은 15MB 미만</li>
          <li>심사위원은 링크·영상을 열지 않아요. 보여 주고 싶은 건 포트폴리오 안에</li>
          <li>AI를 써도 되지만 출처 표기 · 이름은 이름 + 성 이니셜만 · 글씨 10pt 이상 권장</li>
        </ul>
        <ul>
          <li><b>첫 인터뷰(Initial Interview)</b> — 참여해야 심사 대상이 돼요. 대면 예약·대면 즉석·원격 중 대회가 정한 한 가지</li>
          <li>끊김 없이 약 5분 발표 → 공통 질문 2개(로봇 MCI 1개, 팀 TA 1개) → 자유 질문. 공식 질문 은행으로 미리 연습 (<X href="https://ftc-resources.firstinspires.org/ftc/team">FTC 팀 자료실</X>)</li>
          <li>그 뒤 심사위원이 피트에 찾아올 수 있어요. 시제품·사진·편지로 보여 주기</li>
          <li>한 번의 행사보다 꾸준한 아웃리치를 더 높게 봐요. 숫자로 영향을 보여 주면 좋아요</li>
        </ul>
        <p>심사 기준 원문: <X href="https://ftc-resources.firstinspires.org/ftc/event/award-summary">Award Summary</X> · <X href="https://ftc-resources.firstinspires.org/ftc/event/judging-guide">Judging Guide</X> · <X href="https://ftc-resources.firstinspires.org/ftc/game/manual">매뉴얼 6장 Awards</X></p>
        <p className="note">FIRST Tech Challenge 공식 문서 기준이에요. Korea Robot Championship 적용 내용은 다를 수 있으니, 정확한 내용은 <X href="https://fest.or.kr">fest.or.kr</X>에서 확인하세요.</p>
      </Sec>

      <Sec n="07" title="자주 하는 실수 13">
        <p>Game Manual 0의 「Rookie Mistakes」를 요약했어요.</p>
        <ul>
          <li><b>제작</b> — 구동 모터 2개 → 4개 · 연습용 기본 로봇 그대로 출전 → 메카넘·6륜 등 검증된 구동부 · 집게 → 능동 인테이크 · 평기어 기어박스 → 유성 기어박스 · 관절형 팔 → 리니어 슬라이드</li>
          <li><b>대회</b> — 드라이버 연습 부족 → 운동부처럼 꾸준히 · 전략 없이 운전 → 오토·텔레옵·막판 전환 미리 계획 · 전부 손으로 조작 → 반복 동작은 자동으로</li>
          <li><b>원칙</b> — 한 번에 다 하기 → 한 가지 득점부터 · 복잡하게 → 단순하게 · 최고 점수만 → 매번 같은 점수 · 대충 조립 → 배선 정리까지 신뢰성 있게 · 설계만 계속 고민 → 정한 설계로 실행, 시즌 중 갈아엎기는 비추천</li>
        </ul>
        <p className="note">출처: <X href="https://game-manual-0.readthedocs.io/en/stable/docs/rookie-mistakes/index.html">Game Manual 0 · Rookie Mistakes</X></p>
      </Sec>

      <Sec n="08" title="지금 할 일">
        <ol>
          <li>협회 공지로 KRC 2027 일정 확인</li>
          <li>매뉴얼 TU10 · 게임 규칙 읽기</li>
          <li>스타터 키트 · 스타터봇 준비</li>
          <li>Blocks로 첫 TeleOp 만들기</li>
          <li>드라이버 연습 일정 잡기</li>
          <li>오늘부터 개발 기록 남기기</li>
        </ol>
        <p>막히면 <Link href="/alumni#discord">동문회 Discord</Link>에서 선배들에게 물어보세요.</p>
        <p className="note">2026-11-23 기준이에요. 규칙은 팀 업데이트로 바뀔 수 있어요.</p>
      </Sec>

      <Sec n="09" title="자료 링크 모음">
        <ul>
          <li><X href="https://fest.or.kr">FEST창의공학교육협회</X> — KRC 공지·등록</li>
          <li><X href="https://ftc-resources.firstinspires.org/ftc/game/manual">Competition Manual</X> — 공식 규칙 (TU10)</li>
          <li><X href="https://ftc-resources.firstinspires.org/ftc/game/tu-combined">팀 업데이트 모음</X> — 규칙 변경 요약</li>
          <li><X href="https://ftc-qa.firstinspires.org/">공식 Q&amp;A</X> — 규칙 질문</li>
          <li><X href="https://ftc-cmchatbot.firstinspires.org/">공식 AI 챗봇</X> — 규칙 찾기 도우미</li>
          <li><X href="https://ftc-docs.firstinspires.org/en/latest/persona_pages/rookie_teams/rookie_teams.html">FTC Docs · New Teams</X> — 신생 팀 공식 문서</li>
          <li><X href="https://ftc-resources.firstinspires.org/ftc/team">FTC 팀 자료실</X> — 팀 운영·심사 준비 자료</li>
          <li><X href="https://ftc-resources.firstinspires.org/ftc/event/award-summary">Award Summary</X> — 상별 기준 요약</li>
          <li><X href="https://game-manual-0.readthedocs.io/">Game Manual 0</X> — 커뮤니티 입문 가이드</li>
          <li><X href="https://www.gobilda.com/ftc-starter-bot-resource-guide-2026-2027-season/">goBILDA StarterBot</X> — BIOBUZZ 스타터봇</li>
          <li><X href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/releases">FtcRobotController</X> — SDK v12.0</li>
          <li><X href="https://ftcsim.org/">FTCSim</X> — 로봇 없이 코딩 연습</li>
          <li><X href="https://www.onshape.com/en/education/robotics">Onshape for Robotics</X> — 무료 CAD</li>
        </ul>
        <p>동문회 자료: <Link href="/learn/season">시즌 자료실</Link> · <Link href="/learn/girigocha">기리고차 가이드</Link> · <Link href="/learn/lectures">강의</Link> · <Link href="/krc">KRC 소개</Link></p>
      </Sec>
    </main>
  );
}
