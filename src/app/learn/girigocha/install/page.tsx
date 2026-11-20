import Link from 'next/link';
import { meta } from '@/lib/meta';
import Doc, { Steps } from '../Doc';
import { APK, VERSION } from '../docs';

export const metadata = meta('/learn/girigocha/install');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/install" lead="기리고차가 들어 있는 Robot Controller 앱을 Control Hub에 설치해요. 설치 전에 팀 코드를 꼭 백업하세요.">
      <h2>준비물</h2>
      <ul>
        <li>메카넘 로봇 (데드휠 2개 또는 3개가 달려 있어야 해요)</li>
        <li>FTC SDK <b>12.0</b> — Driver Station ⋮ → About에서 확인. 아니면 먼저 업데이트</li>
        <li>노트북 (Chrome 또는 Edge), 게임패드 1개, 충전된 배터리</li>
        <li>로봇 앞쪽과 한쪽 옆으로 <b>72 inch</b> 빈 바닥 (필드 타일 3 × 3장)</li>
      </ul>

      <h2>1. 백업</h2>
      <p className="note red">기리고차 앱을 설치하면 지금 Control Hub에 있는 팀 앱이 바뀌어요. 아래를 끝내기 전에는 설치하지 마세요.</p>
      <table className="tbl">
        <tbody>
          <tr><td>Blocks 팀</td><td>브라우저 <code>192.168.43.1:8080</code> → Blocks → 프로그램마다 <b>Download</b>. Blocks 프로그램은 설치 뒤에도 남지만, 만일을 위해 받아 두세요</td></tr>
          <tr><td>Android Studio 팀</td><td>팀 프로젝트 폴더를 통째로 복사 (USB·클라우드에도 한 부). 나중에 프로젝트를 다시 Run 하면 원래 앱으로 돌아가요</td></tr>
          <tr><td>공통</td><td>Configure Robot 화면 사진, 허브 Wi‑Fi 이름과 비밀번호 메모</td></tr>
        </tbody>
      </table>

      <h2>2. 설치</h2>
      <div className="cta">
        <a className="btn pri" href={APK} download>설치 파일 내려받기 (APK {VERSION})</a>
        <small>인터넷이 될 때 먼저 받아 두세요 — 로봇 Wi‑Fi에 연결하면 인터넷이 끊겨요</small>
      </div>
      <Steps>
        <li><p>노트북을 <b>로봇 Wi‑Fi</b>에 연결하고 브라우저에서 <code>http://192.168.43.1:8080</code> 을 열어요.</p></li>
        <li><p><b>Manage</b> → <b>Select App</b> → 받은 <code>.apk</code> 파일 → <b>Update</b>. "기존 앱을 지우고 계속할까요?"가 나오면 <b>OK</b>.</p></li>
        <li><p>"installed successfully"가 나오면 끝이에요. Driver Station의 OpMode 목록(TeleOp)에 <b>기리고차 점검</b>, <b>기리고차 측정</b>이 보이면 성공이에요.</p></li>
      </Steps>

      <h2>원래 앱으로 돌아가려면</h2>
      <ul>
        <li><b>Android Studio 팀:</b> 팀 프로젝트를 ▶ Run</li>
        <li><b>그 밖:</b> REV Hardware Client → Update → Robot Controller App</li>
      </ul>
      <p>다음은 <Link href="/learn/girigocha/setup">로봇 설정</Link>이에요.</p>
    </Doc>
  );
}
