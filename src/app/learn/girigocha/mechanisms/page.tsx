import { meta } from '@/lib/meta';
import Doc, { B, Blocks } from '../Doc';

export const metadata = meta('/learn/girigocha/mechanisms');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/mechanisms" lead="팔·집게·흡입기 같은 메커니즘을 오토에 넣는 방법 두 가지: 멈춰서 움직이기, 달리면서 움직이기.">
      <p className="note">쓰는 모터·서보는 Configure Robot에 등록돼 있어야 해요. 드라이브 모터 4개는 기리고차가 움직이니 팀 블록에서 직접 출력을 주지 마세요.</p>

      <h2>멈춰서 움직이기</h2>
      <p>경로 블록 사이에 Blocks의 기본 모터·서보 블록을 그대로 넣어요. 가장 쉬워요.</p>
      <Blocks>
        <B n="만약 「경로 끝까지 달리기」 이면" v="경로 가기" />
        <B d={1} n="서보 집게 . Position 정하기" v="0" />
        <B d={1} n="「기다리기」" v="초 0.5" />
        <B n="만약 「경로 끝까지 달리기」 이면" v="경로 돌아오기" />
      </Blocks>
      <p>기다릴 때는 Blocks의 sleep 대신 <b>「기다리기」</b>를 쓰세요. 기다리는 동안에도 로봇이 제자리를 지켜요.</p>

      <h2>달리면서 움직이기 (마커)</h2>
      <p>구간을 추가한 <b>바로 다음</b>에 마커 블록을 붙이면, 그 구간의 정해진 지점을 지날 때 한 번 실행돼요.</p>
      <Blocks>
        <B n="경로 만들기" v="이름 가기 · 0 · 0 · 0" />
        <B n="직선 추가" v="경로 가기 · x 48 · y 0" />
        <B n="마커: 서보 위치" v="경로 가기 · 구간 비율 0.5 · 서보 이름 arm · 위치 1" />
        <B n="마커: 모터 출력" v="경로 가기 · 구간 비율 0.2 · 모터 이름 intake · 출력 1" />
        <B n="만약 「경로 끝까지 달리기」 이면" v="경로 가기" />
      </Blocks>
      <table className="tbl">
        <thead><tr><th>블록</th><th>하는 일</th></tr></thead>
        <tbody>
          <tr><td>마커: 서보 위치</td><td>그 지점에서 서보를 정한 위치로</td></tr>
          <tr><td>마커: 모터 출력</td><td>그 지점에서 모터 출력을 정한 값으로 (0이면 멈춤)</td></tr>
          <tr><td>마커: 모터 위치로</td><td>그 지점에서 모터를 엔코더 목표 틱까지 (팔 각도)</td></tr>
          <tr><td>마커 (끝 전 거리)</td><td>경로 끝에서 정한 거리 전에 이름표 — 「마커 지났나?」로 확인</td></tr>
        </tbody>
      </table>
      <ul>
        <li><b>구간 비율</b>은 바로 앞 구간의 0(시작)~1(끝)이에요. 0.5는 가운데예요.</li>
        <li>경로가 중간에 막혀서 멈추면 남은 마커는 실행하지 않아요.</li>
      </ul>
      <p className="note red">마커 블록은 아직 시뮬레이터에서만 확인했어요. 메커니즘이 달린 실제 로봇에서는 처음 쓸 때 천천히, 손을 멀리 두고 시험해 주세요.</p>
    </Doc>
  );
}
