import Link from 'next/link';
import { meta } from '@/lib/meta';
import Doc, { B, Blocks, Steps } from '../Doc';

export const metadata = meta('/learn/girigocha/first-auto');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/first-auto" lead="Blocks로 「앞으로 24 inch → 왼쪽으로 24 inch → 왼쪽으로 90° 회전」하는 오토를 만들어 달려 봐요. 약 20분.">
      <p className="note"><Link href="/learn/girigocha/measure">측정</Link>에서 「경로 만들 준비 완료 ✅」를 본 뒤에 하세요. 로봇 앞쪽과 왼쪽으로 40 inch를 비워 주세요.</p>

      <h2>1. 기리고차 블록 찾기</h2>
      <Steps>
        <li><p>노트북을 로봇 Wi‑Fi에 연결하고 <code>http://192.168.43.1:8080</code> → <b>Blocks</b> → <b>Create New Op Mode</b>. 이름은 <code>FirstAuto</code>, 종류는 Autonomous로 해요.</p></li>
        <li><p>왼쪽 메뉴 맨 아래 <b>Java Classes</b> → <b>GirigochaBlocks</b>를 열어요. 기리고차 블록이 모두 여기 있어요.</p></li>
      </Steps>

      <h2>2. 블록 놓기</h2>
      <p><code>waitForStart</code> 아래, 「if opModeIsActive」 안에 다음 순서로 놓아요.</p>
      <Blocks title="FirstAuto — 위에서 아래로">
        <B n="만약 「기리고차 시작」 이면" />
        <B d={1} n="경로 만들기" v="이름 첫경로 · 시작 x 0 · 시작 y 0 · 시작 방향 0" />
        <B d={1} n="직선 추가" v="경로 첫경로 · x 24 · y 0" />
        <B d={1} n="직선 추가" v="경로 첫경로 · x 24 · y 24" />
        <B d={1} n="만약 「경로 끝까지 달리기」 이면" v="경로 첫경로" />
        <B d={2} n="변수 ok 를 「제자리 회전」 으로 정하기" v="방향 90" />
        <B n="기리고차 끝내기" />
      </Blocks>
      <ul>
        <li><b>「기리고차 시작」, 「경로 끝까지 달리기」, 「제자리 회전」은 참/거짓을 돌려주는 블록</b>이에요. 「만약」 블록의 조건 칸에 끼우거나 변수에 담아요. 잘 끝나면 참, 막히거나 멈추면 거짓이에요.</li>
        <li><b>「기리고차 끝내기」는 꼭 넣어요.</b> 모터를 멈추고 로그를 저장해요.</li>
        <li>경로 이름(<code>첫경로</code>)은 만들 때와 쓸 때 글자가 똑같아야 해요.</li>
      </ul>

      <h2>3. 좌표 읽는 법</h2>
      <p>「기리고차 시작」을 부른 자리가 <code>(0, 0)</code>, 그때 로봇이 보는 쪽이 0°예요.</p>
      <table className="tbl">
        <tbody>
          <tr><td>x</td><td>출발할 때 로봇 <b>앞쪽</b>이 +</td></tr>
          <tr><td>y</td><td>출발할 때 로봇 <b>왼쪽</b>이 +</td></tr>
          <tr><td>방향</td><td>왼쪽으로(반시계) 돌면 +. 90°는 왼쪽을 봐요</td></tr>
          <tr><td>단위</td><td>길이는 inch, 각도는 도(°)</td></tr>
        </tbody>
      </table>
      <p>그래서 위 프로그램은 <code>(0,0) → (24,0) → (24,24)</code>: 앞으로 24, 그다음 왼쪽으로 24예요. 「직선 추가」만 쓰면 로봇은 방향을 그대로 둔 채 옆으로 가요.</p>
      <p>필드 좌표를 쓰고 싶으면 「기리고차 시작」 바로 다음에 <b>「위치 설정」</b>으로 지금 위치와 방향을 알려 주세요.</p>

      <h2>4. 달리기</h2>
      <Steps>
        <li><p><b>Save Op Mode</b>를 누르고 Driver Station에서 Autonomous 목록의 <b>FirstAuto</b> → INIT → ▶.</p></li>
        <li><p>로봇이 앞으로 갔다가 왼쪽으로 가고, 제자리에서 왼쪽으로 90° 돌면 성공이에요.</p></li>
      </Steps>
      <div className="ok">멈추고 싶으면 언제든 Driver Station의 ■를 누르세요.</div>

      <h2>안 될 때</h2>
      <ul>
        <li><b>바로 끝나요</b> — 「기리고차 시작」이 거짓이에요. 화면에 나온 이유(<Link href="/learn/girigocha/codes">진단 코드</Link>)를 보고, <Link href="/learn/girigocha/check">점검</Link>을 다시 해요.</li>
        <li><b>가다가 멈춰요</b> — 「경로 끝까지 달리기」 다음에 <b>「멈춘 이유」</b> 블록을 텔레메트리에 넣으면 막힘 / 시간 초과 / 고장 중 무엇인지 나와요.</li>
        <li><b>Java Classes가 안 보여요</b> — 기리고차 앱이 설치되지 않았어요. <Link href="/learn/girigocha/install">설치</Link>를 확인하세요.</li>
      </ul>

      <h2>다음에 해 볼 것</h2>
      <ul>
        <li>곡선: 「곡선 추가 (제어점 1개)」 — 제어점 쪽으로 휘어서 끝점까지 가요.</li>
        <li>가는 쪽을 보며 달리기: 구간을 추가한 바로 다음에 「방향: 가는 쪽 보기」.</li>
        <li>그려서 만들기: <Link href="/learn/girigocha/editor">에디터로 그려서 보내기</Link>.</li>
      </ul>
    </Doc>
  );
}
