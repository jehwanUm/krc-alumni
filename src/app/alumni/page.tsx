import { meta } from '@/lib/meta';
import { DISCORD_URL, JOIN_URL } from '@/lib/nav';

export const metadata = meta('/alumni');

export default function Page() {
  return (
    <main>
      <section className="page-head"><div className="in">
        <span className="label">Alumni</span>
        <h1>동문회</h1>
        <p>KRC에 참가했던 동문과 지금 참가하는 학생이 함께하는 모임이에요. 대회 심판·운영에 참여하고, 다음 팀을 도와요.</p>
      </div></section>
      <section className="sec" id="news"><div className="in">
        <div><span className="label">§01</span><h2>소식 · 행사</h2></div>
        <div className="body"><p>동문회 소식과 행사가 이곳에 올라와요.</p></div>
      </div></section>
      <section className="sec" id="volunteer"><div className="in">
        <div><span className="label">§02</span><h2>자원봉사 · 심판 모집</h2></div>
        <div className="body">
          <p>KRC 대회의 심판, 운영, 기술 지원을 함께할 사람을 모아요. 대회별 모집 공고와 지원서가 이곳에 올라와요.</p>
          <p className="note">KRC 2027 모집 공고는 12월 초에 열려요.</p>
        </div>
      </div></section>
      <section className="sec" id="join"><div className="in">
        <div><span className="label">§03</span><h2>동문 가입</h2></div>
        <div className="body"><p>KRC에 참가했거나 지금 참가하는 학생이면 누구나 가입할 수 있어요. 운영진이 확인한 뒤 승인해요.</p>{JOIN_URL ? <p><a className="btn pri" href={JOIN_URL}>회원가입 →</a></p> : <p className="note">가입 신청은 준비 중이에요.</p>}</div>
      </div></section>
      <section className="sec" id="discord"><div className="in">
        <div><span className="label">§04</span><h2>Discord</h2></div>
        <div className="body"><p>질문과 대화는 동문회 Discord에서 나눠요.</p>{DISCORD_URL ? <p><a className="btn" href={DISCORD_URL} rel="external">Discord 들어가기 →</a></p> : <p className="note">Discord는 준비 중이에요.</p>}</div>
      </div></section>
      <section className="sec" id="contact"><div className="in">
        <div><span className="label">§05</span><h2>연락</h2></div>
        <div className="body"><p className="note">연락 창구는 준비 중이에요.</p></div>
      </div></section>
    </main>
  );
}
