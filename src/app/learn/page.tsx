import Link from 'next/link';
import { meta } from '@/lib/meta';

export const metadata = meta('/learn');

export default function Page() {
  return (
    <main>
      <section className="page-head"><div className="in">
        <span className="label">Learn</span>
        <h1>배움</h1>
        <p>동문과 상위권 팀이 함께 정리하는 FTC 자료예요. 처음 시작하는 팀부터 오토노머스를 다듬는 팀까지.</p>
      </div></section>
      <section className="sec"><div className="in">
        <div><span className="label">§01</span><h2>자료</h2></div>
        <div className="body links">
          <Link href="/learn/season"><b>시즌 자료실</b><span>필드 도면, 게임 매뉴얼 한국어 요약, 규칙 Q&amp;A, CAD·3D 모델</span></Link>
          <Link href="/learn/new-team"><b>신생 팀 가이드</b><span>등록부터 대회 당일까지, 첫 시즌 체크리스트</span></Link>
          <Link href="/learn/girigocha"><b>기리고차 가이드</b><span>메카넘 경로 추종 라이브러리 시작하기·동작 원리·진단 코드</span></Link>
          <Link href="/learn/lectures"><b>강의와 인터뷰</b><span>3D 모델링 강의, 우승자 인터뷰</span></Link>
        </div>
      </div></section>
    </main>
  );
}
