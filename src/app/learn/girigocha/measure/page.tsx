import Link from 'next/link';
import { meta } from '@/lib/meta';
import Doc, { Screen, Steps } from '../Doc';

export const metadata = meta('/learn/girigocha/measure');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/measure" lead="로봇이 스스로 달리면서 추종에 필요한 값을 재요. 마지막에 S자 확인 주행까지 통과하면 바로 경로를 만들 수 있어요. 약 1분.">
      <p className="note">「점검」을 통과한 뒤에 해요. 충전된 배터리로, 로봇 앞쪽과 한쪽 옆으로 <b>72 inch</b>를 비워 주세요.</p>
      <Steps>
        <li><p>Driver Station에서 <b>기리고차 측정</b> → INIT.</p></li>
        <li><p><b>D-pad ◀ / ▶</b>로 비워 둔 옆쪽을 골라요 (왼쪽 또는 오른쪽).</p></li>
        <li><p>▶ → <b>A</b>. 약 30초 동안 앞·옆·회전으로 천천히 빨라졌다가 돌아오기를 반복해요. 손대지 말고 지켜보세요. 멈추려면 <b>B</b>.</p></li>
        <li>
          <p>값이 화면에 나오면 <b>X</b>로 저장해요.</p>
          <Screen>{'측정 끝\nkS (달리는 중 마찰 출력) 앞 0.073 / 옆 0.129\n출발에 필요한 출력 앞 0.116 / 옆 0.198\n...\nX: robot.json 에 저장하기'}</Screen>
        </li>
        <li>
          <p><b>A</b>를 한 번 더 눌러 <b>확인 주행</b>을 해요. 앞으로 48 inch 가면서 옆으로 24 inch 옮기는 S자를 갔다가 돌아와요 (약 7초).</p>
          <Screen>경로 만들 준비 완료 ✅  (경로 오차 0.2 inch, 돌아온 자리 0.1 inch)</Screen>
          <p>이 줄이 나오면 튜닝이 끝났어요. <Link href="/learn/girigocha/first-auto">첫 오토</Link>로 넘어가요.</p>
        </li>
      </Steps>

      <h2>무엇을 재나요</h2>
      <table className="tbl">
        <thead><tr><th>값</th><th>쓰이는 곳</th></tr></thead>
        <tbody>
          <tr><td>kS · kV · kA</td><td>원하는 속도·가속을 내려면 모터에 얼마를 줘야 하는지</td></tr>
          <tr><td>옆 마찰 · 측면 비율</td><td>메카넘은 옆으로 갈 때 더 느려요. 옆 방향 최고 속도를 여기서 정해요</td></tr>
          <tr><td>출발에 필요한 출력</td><td>멈췄다가 출발할 때 머뭇거리지 않게</td></tr>
          <tr><td>회전 반지름 · 지연</td><td>회전 속도 계산, 센서·모터가 늦는 만큼 미리 보정</td></tr>
          <tr><td>기준 전압</td><td>배터리가 닳아도 같은 속도로 달리게</td></tr>
        </tbody>
      </table>

      <h2>확인 주행에서 「고칠 점이 있어요」가 나오면</h2>
      <ul>
        <li><b>곡선에서 경로를 많이 벗어났어요</b> — 바닥이 미끄럽거나 바퀴가 헛돌 수 있어요. 매트 위에서 측정을 다시 해 보세요.</li>
        <li><b>돌아온 자리가 달라요</b> — 데드휠이 바닥에 잘 닿는지 보고 <Link href="/learn/girigocha/check">점검</Link>을 다시 해요.</li>
        <li><b>「막힘」으로 멈췄어요</b> — 주변에 걸리는 것이 없는지 보고 측정을 다시 해요.</li>
      </ul>

      <h2>측정을 다시 해야 할 때</h2>
      <ul>
        <li>로봇 무게가 많이 바뀌었을 때 (메커니즘을 달았을 때)</li>
        <li>바퀴·모터·기어를 바꿨을 때, 최대 출력을 바꿨을 때</li>
        <li>바닥이 달라졌을 때 (연습 매트 → 대회 필드)</li>
      </ul>
    </Doc>
  );
}
