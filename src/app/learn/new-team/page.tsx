import { meta } from '@/lib/meta';

export const metadata = meta('/learn/new-team');

export default function Page() {
  return (
    <main>
      <section className="page-head"><div className="in">
        <span className="label">Learn · New team</span>
        <h1>신생 팀 가이드</h1>
        <p>처음 KRC에 나가는 팀이 한 시즌을 끝까지 갈 수 있도록, 순서대로 정리해요.</p>
      </div></section>
      <section className="sec"><div className="in"><div><span className="label">§01</span><h2>첫 시즌 순서</h2></div><div className="body"><ol><li>팀 등록</li><li>부품 준비 · 예산</li><li>로봇 만들기 · 프로그래밍 시작</li><li>대회 당일</li></ol><p className="note">단계별 내용을 쓰고 있어요. 11월 말에 채워져요.</p></div></div></section>
    </main>
  );
}
