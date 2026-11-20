import Link from 'next/link';
import { meta } from '@/lib/meta';
import Doc, { Screen, Steps } from '../Doc';

export const metadata = meta('/learn/girigocha/check');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/check" lead="로봇이 바퀴를 하나씩 돌리고 조금씩 움직여 보면서 배선·방향·설정 실수를 찾아요. 약 1분.">
      <Steps>
        <li><p>로봇을 매트 가운데에 두고 주변 <b>40 inch</b>를 비워요.</p></li>
        <li><p>Driver Station에서 <b>기리고차 점검</b> → INIT → ▶ → 게임패드 <b>A</b>.</p></li>
        <li>
          <p>끝나면 화면을 봐요.</p>
          <Screen>모든 점검을 통과했어요 ✅</Screen>
          <p>이 줄이 나오면 <Link href="/learn/girigocha/measure">측정</Link>으로 넘어가요.</p>
        </li>
      </Steps>

      <h2>오류나 경고가 나오면</h2>
      <Screen>{'[오류 GRG-E101] 왼쪽 앞 모터(FL) 방향이 반대예요.\nX: 자동으로 고치기'}</Screen>
      <ul>
        <li><code>X: 자동으로 고치기</code>가 보이면 <b>X</b>를 누르고 OpMode를 다시 실행해요. 보통 한두 번이면 통과해요.</li>
        <li>X가 없는 항목은 화면에 적힌 대로 로봇을 고쳐요 (케이블, 설정 이름 등).</li>
        <li>코드의 뜻은 <Link href="/learn/girigocha/codes">진단 코드</Link>에서 찾을 수 있어요.</li>
      </ul>
      <table className="tbl">
        <thead><tr><th>종류</th><th>뜻</th></tr></thead>
        <tbody>
          <tr><td>오류 (E)</td><td>이대로는 달릴 수 없어요. 고쳐야 다음으로 가요</td></tr>
          <tr><td>경고 (W)</td><td>달릴 수는 있지만 정확도가 떨어질 수 있어요. 가능하면 고쳐요</td></tr>
          <tr><td>알림 (I)</td><td>참고용이에요</td></tr>
        </tbody>
      </table>

      <h2>자주 나오는 것</h2>
      <ul>
        <li><b>모터 방향이 반대예요 (E101)</b> — X로 고쳐져요.</li>
        <li><b>데드휠 방향이 반대예요 (E203)</b> — X로 고쳐져요.</li>
        <li><b>바퀴 하나가 훨씬 덜 돌아요 (W108)</b> — 소프트웨어로 못 고쳐요. 그 바퀴를 손으로 돌려 보고 벨트·기어·케이블을 확인하세요.</li>
        <li><b>데드휠 위치 값이 실제와 달라요 (W205)</b> — <Link href="/learn/girigocha/setup">로봇 설정</Link>에서 데드휠 거리를 다시 재서 넣어요. 평행·수직 데드휠이 바뀌어 꽂혀 있지 않은지도 보세요.</li>
      </ul>
    </Doc>
  );
}
