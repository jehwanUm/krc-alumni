import Link from 'next/link';
import { meta } from '@/lib/meta';

export const metadata = meta('/learn/season');

// 출처: FTC Competition Manual TU10(2026-11-19), Team Update 00~10. 원문 사본: dev/reference/ftc-2026-biobuzz/
const X = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
const Sec = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="sec"><div className="in"><div><span className="label">§{n}</span><h2>{title}</h2></div><div className="body">{children}</div></div></section>
);

const SCORE: [string, string, string][] = [
  ['LEAVE (벽에서 떨어지기)', '3', '–'], ['PARK (LOADING ZONE에 일부라도)', '5', '5'], ['HIVE TIP', '20', '20'],
  ['CELL에 남은 공 (개당)', '–', '2'], ['Bottom NECTAR 보너스', '–', '5'], ['소유 FLOWER 안의 공 (개당)', '–', '2'], ['GARDEN 안의 공 (개당)', '–', '1'],
];
const RP: [string, string, string][] = [
  ['WIN', '상대보다 점수가 높음', '3'], ['TIE', '동점', '1'], ['SWARM', 'LEAVE + PARK 합계 16점 이상', '1'],
  ['POLLINATOR 1', 'TIP 4번 이상', '1'], ['POLLINATOR 2', 'TIP 7번 이상', '1'],
];
const TU: [string, string, string][] = [
  ['TU10', '11/19', 'RP 기준: 지역 챔피언십도 SWARM 16점 · TIP 4/7번 그대로, 세계 대회는 미정'],
  ['TU09', '11/12', 'G411 쌓아 두기 금지: 상대가 8개 넘는 득점 요소에 못 가게 막으면 STRATEGIC일 때 MAJOR + 옐로카드. 필드 보정 가이드 26-27.2'],
  ['TU08', '11/5', 'G405 득점 요소를 일부러 필드 밖으로 내보내면 개당 MAJOR. R612 전원 경로 개조 금지, T402 DISABLED는 심판만 선언'],
  ['TU07', '10/29', 'G304 시작 위치·POLLEN 4개 접촉 정리, G412 로봇 통제, G419 상대 로봇 손상 예시 추가'],
  ['TU06', '10/22', 'G402 오토 중 상대 진영 진입은 STRATEGIC으로 볼 수 있음, G401 오토 중 로봇 건드리기 금지. Digital Animation Award, 검사 체크리스트 26-27.2'],
  ['TU05', '10/15', 'G407 한 번에 4개까지(5개 이상 반복은 STRATEGIC), G408 상대 NECTAR 잡기 금지, 필드 리셋 절차, 로봇 사인 팀 번호(R403)'],
  ['TU04', '10/8', 'Escalation Guidelines 공개, 심사 피드백 양식·인터뷰 질문 은행 링크, 1:00 FLOWER 소유 알림음'],
  ['TU03', '10/1', '로봇은 POLLEN 4개를 미리 싣고 시작 (10.3.4, G304), 아웃리치 용어 정의 갱신'],
  ['TU02', '9/24', '반칙 해석 예시 표(10.6.4) 정리, G420 넘어뜨리기·엉킴, G423·G425·G426 사람 관련 규칙'],
  ['TU01', '9/17', 'HIVE 아랫면 높이 30.6in(77.70cm)로 정정, G204 예시, Question Box 절차'],
  ['TU00', '9/12', '지난 시즌 대비 변경 요약 — 아래 §03'],
];
const LINKS: [string, string, string][] = [
  ['Competition Manual', 'https://ftc-resources.firstinspires.org/ftc/game/manual', '공식 규칙 원문 (TU10)'],
  ['팀 업데이트 모음', 'https://ftc-resources.firstinspires.org/ftc/game/tu-combined', 'TU00~ 변경 요약 PDF'],
  ['공식 Q&A', 'https://ftc-qa.firstinspires.org/', '규칙 질문·답변'],
  ['공식 AI 챗봇', 'https://ftc-cmchatbot.firstinspires.org/', '규칙 찾기 도우미 (답은 매뉴얼로 확인)'],
  ['FTC 팀 자료실', 'https://ftc-resources.firstinspires.org/ftc/team', '필드·심사·검사 자료'],
  ['FtcRobotController', 'https://github.com/FIRST-Tech-Challenge/FtcRobotController/releases', 'SDK v12.0'],
  ['goBILDA StarterBot', 'https://www.gobilda.com/ftc-starter-bot-resource-guide-2026-2027-season/', 'BIOBUZZ 스타터봇'],
  ['FEST창의공학교육협회', 'https://fest.or.kr', 'KRC 공지'],
];

const Table = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table>
);

export default function Page() {
  return (
    <main className="guide">
      <section className="page-head"><div className="in">
        <span className="label">Learn · Season 2026-27</span>
        <h1>시즌 자료실 · BIOBUZZ</h1>
        <p>FTC(FIRST Tech Challenge) 2026-27 시즌 게임 BIOBUZZ를 한국어로 정리했어요. 공식 매뉴얼 TU10(2026-11-19) 기준이에요.</p>
      </div></section>

      <Sec n="01" title="BIOBUZZ 한눈에">
        <p>두 팀이 한 동맹이 되어 빨강·파랑 동맹이 겨뤄요. 공 두 종류를 모아 <b>HIVE</b>에 쏘고 <b>FLOWER</b>를 채워요.</p>
        <ul>
          <li><b>POLLEN</b> — 노란 공 40개, 약 2.8in(7.1cm). FLOWER 안, GARDEN, 로봇마다 4개씩 싣고 시작</li>
          <li><b>NECTAR</b> — 빨강·파랑 각 8개, 약 3.6in(9.1cm). CELL에 3개, 나머지 5개는 필드 밖 동맹 구역에서 대기</li>
          <li><b>HIVE</b> — 필드 가운데, 시소처럼 기우는 구조물. 동맹마다 CELL 2개. 위를 향한 CELL에 쏴서(LAUNCH) 넘기면 TIP</li>
          <li><b>FLOWER</b> — 벽에 붙은 꽃 4개. 위로 공을 넣고, 아래 구멍에서 POLLEN을 꺼낼 수 있어요</li>
        </ul>
        <ul>
          <li><b>오토 30초</b> → <b>전환 8초</b>(로봇 정지, G403) → <b>텔레옵 2분</b></li>
          <li>HIVE를 TIP할 때마다 대기 중인 NECTAR를 1개씩 넣을 수 있어요. 60초 남으면 남은 NECTAR 모두</li>
          <li>FLOWER 득점은 <b>1분 남았을 때부터</b> (G410). 맨 위 NECTAR 색 동맹이 그 꽃의 주인</li>
        </ul>
        <Table head={['점수', '오토', '텔레옵']} rows={SCORE} />
        <Table head={['RP', '조건', 'RP']} rows={RP} />
        <p className="note">RP 기준은 일반 대회·지역 챔피언십 기준(TU10)이에요. 반칙은 MINOR 5점, MAJOR 20점이 <b>상대 동맹</b>에게 더해져요.</p>
      </Sec>

      <Sec n="02" title="매뉴얼 한국어 요약">
        <p>175쪽 공식 매뉴얼의 각 장이 무엇을 다루는지 한국어로 짧게 정리했어요. 규칙의 정확한 문장은 공식 매뉴얼에서 확인해 주세요.</p>
        <p><Link href="/learn/season/manual"><b>매뉴얼 장별 안내 보기 →</b></Link></p>
      </Sec>

      <Sec n="03" title="지난 시즌과 달라진 것">
        <ul>
          <li><b>매뉴얼 철학</b> — 모든 경우를 다 적는 대신 &ldquo;규칙의 취지&rdquo;와 의도된 플레이를 기준으로 심판이 판단해요. 다음 시즌에도 이어져요</li>
          <li><b>STRATEGIC</b> — 경쟁 우위를 노린 행동. 많은 규칙에서 STRATEGIC이면 MAJOR + 옐로카드로 커지고, 실수는 구두 경고로 끝나는 경우가 많아요</li>
          <li><b>경기 무결성 서약(CIC)</b> — G202: 속이지 않고 규칙대로, 정직하게. 검사에서 모든 규칙을 확인하지 않아도 팀은 모든 규칙을 지켜야 해요</li>
          <li><b>로봇</b> — 서보 최대 8개로 줄었어요(모터 8 · 서보 8, R503). WATTOS Stingray 모터 추가(R501). 게임패드 제한 규칙(구 R903) 삭제</li>
          <li><b>대회</b> — 로봇 부품을 데우거나 식혀서 이득 보기 금지(E510). 심판과 대화는 최대 2명(T301), 동맹 선택에 학생 대표 최대 2명(T701)</li>
          <li><b>심사</b> — Structured Interview → Initial Interview (대면 예약·대면 즉석·원격). 포트폴리오는 2026-01-01 이후 내용만</li>
        </ul>
      </Sec>

      <Sec n="04" title="팀 업데이트 기록">
        <p>매뉴얼이 바뀔 때마다 팀 업데이트(TU)가 나와요. 날짜순 한 줄 요약이에요.</p>
        <Table head={['TU', '날짜', '주요 내용']} rows={TU} />
        <p className="note">원문: <X href="https://ftc-resources.firstinspires.org/ftc/game/tu-combined">팀 업데이트 모음 (PDF)</X>. 거의 매주 새 업데이트가 나와요.</p>
      </Sec>

      <Sec n="05" title="오토 예시">
        <p>BIOBUZZ 30초 오토 흐름을 시뮬레이션으로 재생하고 Blocks·Java로 볼 수 있어요.</p>
        <p><Link href="/learn/girigocha/biobuzz">기리고차 BIOBUZZ 예시 오토 →</Link></p>
      </Sec>

      <Sec n="06" title="공식 자료 링크">
        <ul>{LINKS.map(([t, u, d]) => <li key={u}><X href={u}>{t}</X> — {d}</li>)}</ul>
      </Sec>

      <Sec n="07" title="준비 중">
        <ul>
          <li><b>KRC 필드 도면</b> — 협회와 게시 형태를 확인하고 올려요</li>
          <li><b>규칙 Q&amp;A 모음</b> — Discord·DM으로 들어온 질문을 정리해요</li>
          <li><b>CAD·3D 모델</b> — <Link href="/learn/lectures">3D 모델링 강의</Link>와 연결해요</li>
        </ul>
        <p className="note">FIRST Tech Challenge 공식 문서 기준이에요. Korea Robot Championship 적용 내용은 다를 수 있으니, 정확한 내용은 <X href="https://fest.or.kr">fest.or.kr</X>에서 확인하세요.</p>
      </Sec>
    </main>
  );
}
