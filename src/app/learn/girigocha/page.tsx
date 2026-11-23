import Link from 'next/link';
import { meta } from '@/lib/meta';
import Doc from './Doc';
import { APK, APK_SHA256, VERSION } from './docs';

export const metadata = meta('/learn/girigocha');

export default function Page() {
  return (
    <Doc path="/learn/girigocha" lead="FTC 메카넘 로봇이 그린 경로를 그대로 따라가게 하는 경로 추종 라이브러리예요. KRC 동문회가 만들어요.">
      <div className="cta">
        <a className="btn pri" href={APK} download>설치 파일 내려받기 (APK {VERSION})</a>
        <Link className="btn" href="/learn/girigocha/install">시작하기</Link>
        <small>베타 · FTC SDK 12.0 · 약 49 MB</small>
      </div>
      <p className="dim small apknote">SHA-256 <code>{APK_SHA256}</code><br />로봇에 쓰기 전에 반드시 안전한 연습 공간에서 먼저 시험해 주세요. 충분히 시험하지 않고 써서 생긴 로봇 파손이나 안전사고는 동문회가 책임지지 않아요.</p>

      <h2>무엇을 해 주나요</h2>
      <ul>
        <li><b>경로를 그리면 로봇이 따라가요.</b> 직선, 곡선, 제자리 회전을 이어서 오토노머스를 만들어요.</li>
        <li><b>튜닝은 두 번 실행하면 끝나요.</b> 「점검」이 배선·방향 실수를 찾아 고치고, 「측정」이 로봇 값을 스스로 재요. 숫자를 직접 맞추는 단계가 없어요.</li>
        <li><b>Blocks와 Java 둘 다 돼요.</b> 같은 기능을 블록 48개로 쓸 수 있어요.</li>
        <li><b>막히면 이유를 알려 줘요.</b> 화면에 <code>GRG-E101</code> 같은 코드와 고치는 법이 한국어로 나와요.</li>
      </ul>

      <h2>쓸 수 있는 로봇</h2>
      <table className="tbl">
        <tbody>
          <tr><td>드라이브</td><td>메카넘 바퀴 4개</td></tr>
          <tr><td>위치 추정</td><td>① 데드휠 2개 + goBILDA Pinpoint · ② 데드휠 2개 + 허브 IMU · ③ 데드휠 3개</td></tr>
          <tr><td>앱</td><td>FTC SDK 12.0 (Robot Controller · Driver Station)</td></tr>
        </tbody>
      </table>
      <p className="note">지금은 베타예요. ① Pinpoint 구성은 실제 로봇 두 대에서 시험했고, ②·③ 구성은 시뮬레이터에서만 확인했어요.</p>

      <h2>순서</h2>
      <ol>
        <li><Link href="/learn/girigocha/install">설치</Link> — 설치 파일을 Control Hub에 올려요 (10분)</li>
        <li><Link href="/learn/girigocha/setup">로봇 설정</Link> — 브라우저에서 모터 이름·바퀴·데드휠을 넣어요 (5분)</li>
        <li><Link href="/learn/girigocha/check">점검</Link> → <Link href="/learn/girigocha/measure">측정</Link> — 로봇이 스스로 움직이며 확인하고 재요 (10분)</li>
        <li><Link href="/learn/girigocha/first-auto">첫 오토</Link> — Blocks로 경로를 만들어 달려요 (20분)</li>
      </ol>
    </Doc>
  );
}
