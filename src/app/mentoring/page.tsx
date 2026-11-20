import Link from 'next/link';
import { meta } from '@/lib/meta';

export const metadata = meta('/mentoring');

export default function Page() {
  return (
    <main>
      <section className="page-head"><div className="in">
        <span className="label">Mentoring · 준비 중</span>
        <h1>멘토링</h1>
        <p>동문 멘토(설계·코딩·전략·3D 모델링)와 팀을 이어 드려요. 준비 중이에요.</p>
      </div></section>
      <section className="sec"><div className="in"><div><span className="label">§01</span><h2>준비 중이에요</h2></div><div className="body"><div className="soon-box"><p>멘토 신청과 오피스아워 예약이 이곳에 생겨요. 소식은 <Link href="/alumni#discord">Discord</Link>에서 가장 먼저 알려요.</p></div></div></div></section>
    </main>
  );
}
