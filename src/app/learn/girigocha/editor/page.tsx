import Link from 'next/link';
import { meta } from '@/lib/meta';
import Doc, { B, Blocks, Steps } from '../Doc';

export const metadata = meta('/learn/girigocha/editor');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/editor" lead="경로를 좌표로 적지 않고 필드 그림 위에 그려서 로봇으로 보내요. Blocks에서는 블록 하나로 달려요.">
      <h2>1. 경로 그리기</h2>
      <Steps>
        <li><p><Link href="/auto">오토 · 경로 에디터</Link>를 열어요. (로봇 Wi‑Fi에 연결하면 인터넷이 끊기니, 에디터를 먼저 열어 두세요.)</p></li>
        <li>
          <p>필드를 눌러 점을 찍거나, 위쪽 <b>Command</b> 칸에 말로 적어요.</p>
          <p><code>앞으로 24, 왼쪽으로 24, 뒤로 24, 오른쪽으로 24</code> → Enter 두 번 → 사각형 경로가 생겨요.</p>
        </li>
        <li><p>아래 시간표에서 걸리는 시간을 확인해요.</p></li>
      </Steps>

      <h2>2. 로봇으로 보내기</h2>
      <Steps>
        <li><p>노트북을 로봇 Wi‑Fi에 연결해요.</p></li>
        <li><p>오른쪽 위 <b>Send to robot</b> → Routine name에 이름(예: <code>오토1</code>) → <b>Send</b>. 브라우저가 로컬 네트워크 접근을 물으면 <b>허용</b>.</p></li>
        <li><p>빨간 글씨가 나오면 <b>Download file</b>로 파일을 받고, 새 탭에서 <code>192.168.43.1:8080/girigocha</code> → 파일 선택 → <b>올리기</b>.</p></li>
      </Steps>

      <h2>3. 달리기</h2>
      <h3>블록 없이 바로</h3>
      <p>Driver Station → <b>기리고차 경로 실행</b> → INIT → 화면에서 이름 확인 → ▶.</p>
      <h3>Blocks 프로그램 안에서</h3>
      <Blocks>
        <B n="만약 「기리고차 시작」 이면" />
        <B d={1} n="만약 「보낸 경로 달리기」 이면" v="이름 오토1 · 출발 위치로 정하기 참" />
        <B d={2} n="(다음 동작)" />
        <B n="기리고차 끝내기" />
      </Blocks>
      <p>「출발 위치로 정하기」를 참으로 두면, 에디터에서 그린 출발점에 로봇이 놓여 있다고 봐요. 오토의 첫 경로에서만 참으로 해요.</p>

      <h2>알아 둘 것</h2>
      <ul>
        <li>같은 이름으로 다시 보내면 덮어써요. 바로 앞 판은 로봇에 하나 남아요.</li>
        <li>보낸 경로 목록은 <code>192.168.43.1:8080/girigocha</code>에서 볼 수 있어요.</li>
        <li>에디터의 시간표는 아직 옆으로 가는 구간을 실제보다 조금 짧게 계산해요.</li>
      </ul>
    </Doc>
  );
}
