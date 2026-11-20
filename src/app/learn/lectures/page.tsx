import { meta } from '@/lib/meta';

export const metadata = meta('/learn/lectures');

export default function Page() {
  return (
    <main>
      <section className="page-head"><div className="in">
        <span className="label">Learn · Lectures</span>
        <h1>강의와 인터뷰</h1>
        <p>동문회가 만든 3D 모델링 강의와 지난 시즌 우승자 인터뷰를 모아요.</p>
      </div></section>
      <section className="sec"><div className="in"><div><span className="label">§01</span><h2>목록</h2></div><div className="body"><p className="note">강의와 인터뷰 영상을 정리하는 중이에요.</p></div></div></section>
    </main>
  );
}
