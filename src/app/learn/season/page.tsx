import { meta } from '@/lib/meta';

export const metadata = meta('/learn/season');

export default function Page() {
  return (
    <main>
      <section className="page-head"><div className="in">
        <span className="label">Learn · Season</span>
        <h1>시즌 자료실</h1>
        <p>이번 시즌을 준비하는 데 필요한 자료를 한곳에 모아요. 시즌별로 정리해요.</p>
      </div></section>
      <section className="sec"><div className="in"><div><span className="label">§01</span><h2>이번 시즌</h2></div><div className="body"><ul><li><b>KRC 필드 도면</b> — 대회 필드 도면 (사용 허락 받음)</li><li><b>게임 매뉴얼 요약</b> — 한국어로 핵심만</li><li><b>규칙 Q&amp;A 모음</b></li><li><b>CAD·3D 모델</b> — 3D 모델링 강의와 연결</li></ul><p className="note">자료를 올리는 중이에요. 11월 말에 채워져요.</p></div></div></section>
    </main>
  );
}
