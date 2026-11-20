import Link from 'next/link';
import { meta } from '@/lib/meta';
import Doc, { Steps } from '../Doc';

export const metadata = meta('/learn/girigocha/setup');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/setup" lead="로봇의 모터 이름, 바퀴, 데드휠 위치를 브라우저에서 넣어요. 코드를 고치거나 다시 빌드하지 않아요.">
      <Steps>
        <li>
          <p>노트북을 로봇 Wi‑Fi에 연결하고 <code>http://192.168.43.1:8080/girigocha/setup</code> 을 열어요.</p>
        </li>
        <li>
          <p>칸을 채워요. 길이는 모두 <b>inch</b>예요.</p>
          <table className="tbl">
            <thead><tr><th>칸</th><th>넣는 것</th></tr></thead>
            <tbody>
              <tr><td>모터 이름</td><td>Driver Station → Configure Robot에 적힌 이름 그대로 (왼쪽 앞·왼쪽 뒤·오른쪽 앞·오른쪽 뒤)</td></tr>
              <tr><td>드라이브 모터</td><td>목록에서 고르기 (예: goBILDA 5203 312 RPM). 없으면 「기타」로 RPM과 엔코더 tick을 직접</td></tr>
              <tr><td>바퀴 수</td><td>모터 1바퀴에 바퀴가 도는 수. 직결이나 1:1 기어면 1</td></tr>
              <tr><td>트랙 폭 · 휠베이스</td><td>좌우·앞뒤 바퀴 <b>중심 사이</b> 거리</td></tr>
              <tr><td>위치 추정</td><td>① Pinpoint / ② 데드휠 2개 + IMU / ③ 데드휠 3개 중 하나</td></tr>
              <tr><td>데드휠 거리</td><td>로봇 가운데(바퀴 4개의 중심)에서 데드휠 바퀴까지. 앞뒤를 재는 데드휠은 <b>왼쪽(+)/오른쪽(−)</b>, 좌우를 재는 데드휠은 <b>앞(+)/뒤(−)</b></td></tr>
            </tbody>
          </table>
        </li>
        <li>
          <p><b>로봇에 저장</b>을 눌러요. "저장했어요"가 나오면 끝이에요. 빠진 칸이 있으면 빨간 글씨로 알려 줘요.</p>
        </li>
      </Steps>

      <h2>알아 둘 것</h2>
      <ul>
        <li><b>모터·데드휠 방향은 안 넣어요.</b> 다음 단계인 「점검」이 돌려 보고 고쳐요.</li>
        <li><b>자로 대충 재도 돼요.</b> 데드휠 거리가 많이 틀리면 「점검」이 알려 줘요.</li>
        <li><b>최대 출력은 0.6으로 시작하세요.</b> 점검·측정이 끝나고 익숙해지면 올려요. 올린 뒤에는 측정을 다시 해요.</li>
        <li>저장할 때마다 이전 설정은 로봇 안에 백업돼요. 측정으로 저장한 값은 설정을 고쳐도 남아요.</li>
      </ul>
      <p>다음은 <Link href="/learn/girigocha/check">점검</Link>이에요.</p>
    </Doc>
  );
}
