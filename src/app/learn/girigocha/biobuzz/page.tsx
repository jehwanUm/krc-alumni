import Link from 'next/link';
import { meta } from '@/lib/meta';
import Doc, { B, Blocks } from '../Doc';
import AutoPlayer from './AutoPlayer';

export const metadata = meta('/learn/girigocha/biobuzz');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/biobuzz" lead="코드 흐름을 익히기 위한 BIOBUZZ 30초 오토 예시 4가지예요. 재생해 보고, 같은 경로를 Blocks와 Java로 확인해요.">
      <p className="note red"><b>이 예시는 코드의 흐름을 보여 주기 위한 것일 뿐이에요.</b> 경로를 어떻게 나누고, 언제 기다리고, 언제 모터를 켜고 끄는지 보여 주려고 만들었어요. 실제 필드나 로봇에서 시험한 오토가 아니고, 좌표·시간·전략도 정답이 아니에요. 그대로 넣어 쓰지 말고 흐름을 참고해서 자기 팀 오토를 직접 만들어요.</p>
      <p className="note">예시는 빨강 동맹 기준이고, 같은 편 두 대(로봇1·로봇2)를 따로 또는 같이 재생할 수 있어요. 흡입·발사 시간, 꽃에서 공을 빼는 시간은 가정값이에요.</p>

      <AutoPlayer />

      <h2>전략의 뼈대</h2>
      <ul>
        <li><b>HIVE TIP이 오토에서 가장 큰 점수(20점)예요.</b> 처음 위로 올라가 있는 칸(빨강은 관중 쪽)에는 NECTAR 3개가 들어 있어서 POLLEN 3개면 넘어가요.</li>
        <li>TIP 하면 반대쪽 칸이 위로 올라와요. 이 칸은 비어 있어서 POLLEN 8개가 필요해요. 로봇은 한 번에 4개까지만 들 수 있어서(G407) 두 대가 4개씩 넣거나 한 대가 두 번 가져와야 해요.</li>
        <li>칸 입구는 그 칸이 있는 끝(관중 쪽·뒤쪽)을 봐요. 그래서 위로 올라간 칸 쪽 <b>벽 앞</b>에서 쏴요.</li>
        <li>TIP은 마지막 공이 들어가고 3~5초 뒤에 끝나요. 다음 칸에 쏘기 전에 그만큼 기다려요.</li>
      </ul>

      <h2>멈춰서 하는 일은 「기다리기」 자리에</h2>
      <p>Blocks 목록의 <b>기다리기</b>는 발사·흡입 시간을 비워 둔 자리예요. 자기 로봇의 동작 블록으로 바꿔 넣어요. ④ Robits 캐터펄트라면 이렇게 4번 반복해요.</p>
      <Blocks title="기다리기 6.3초 대신 — 캐터펄트 4발">
        <B n="기다리기" v="0.3초 (공이 자리 잡게)" />
        <B n="반복 4번" />
        <B n="catapult 출력" v="0.65" d={1} />
        <B n="기다리기" v="1.0초 (감기)" d={1} />
        <B n="catapult 출력" v="0" d={1} />
        <B n="기다리기" v="0.5초 (다음 공이 내려오게)" d={1} />
      </Blocks>
      <p><b>흡입</b>은 Blocks 목록의 <b>마커: 모터 출력</b>으로 꽃에 도착하기 직전(구간 0.8)에 켜고, 다음 경로 가운데(0.5)에서 꺼요. 예시의 모터 이름 <code>intake</code>·<code>rollerI</code>·<code>rollerF</code>는 자기 팀 Configure 이름으로 바꿔요. Robits 롤러는 연속 회전 서보라 같은 블록으로 돌릴 수 있고, rollerI는 반대 방향이라 출력 −1이에요. 자세한 방법은 <Link href="/learn/girigocha/mechanisms">모터·서보 넣기</Link>에 있어요.</p>

      <h2>자기 팀 오토로 바꾸기</h2>
      <ol>
        <li><Link href="/learn/girigocha/editor">경로 에디터</Link>의 Examples에서 같은 예시를 열고, 출발 위치·발사 자리를 자기 로봇에 맞게 옮겨요.</li>
        <li>발사·흡입 시간을 실제로 재서 멈춤 시간에 넣어요. 30초가 넘거나 HIVE에 닿으면 에디터가 알려 줘요.</li>
        <li>같은 편 팀과 누가 어느 칸·어느 꽃을 맡을지 정해요. 같은 편 경로를 Ghost로 같이 보면서 부딪히지 않는지 확인해요.</li>
      </ol>
    </Doc>
  );
}
