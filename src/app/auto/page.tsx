import Link from 'next/link';
import { meta } from '@/lib/meta';
import { FullscreenButton } from './Fullscreen';
import './auto.css';

export const metadata = meta('/auto');

// 오토: 페이지를 열면 바로 경로 에디터(기리고차 Path Editor, public/editor — `npm run sync-editor`로 girigocha 저장소에서 복사).
// 저장·공개 범위·공유 코드·Ghost 불러오기는 팀 로그인과 서버 저장소가 생기면(11월 중순) 켠다.
export default function Page() {
  return (
    <main className="pg-auto">
      <section className="page-head"><div className="in">
        <span className="label">Auto · 경로 에디터</span>
        <h1>오토</h1>
        <p>FTC 오토노머스 경로를 그리고, 다른 팀 경로를 Ghost로 겹쳐 비교해요. 어떤 라이브러리를 쓰든 쓸 수 있어요.</p>
        <div className="first">
          <div><b>기리고차가 처음인가요?</b><p>기리고차는 동문회가 만든 메카넘 경로 추종 라이브러리예요. 설치부터 첫 주행까지 가이드를 따라가 보세요.</p></div>
          <Link className="btn pri" href="/learn/girigocha">기리고차 가이드 보기 →</Link>
        </div>
      </div></section>

      <section className="sec wide" id="editor"><div className="in">
        <div><span className="label">§01</span><h2>경로 에디터</h2></div>
        <div className="body">
          <div className="edbar">
            <FullscreenButton />
            <a className="btn sm" href="/editor/index.html" target="_blank" rel="noopener">새 탭에서 열기 ↗</a>
          </div>
          <div className="edwrap">
            <iframe className="ed" id="ed" src="/editor/index.html" title="경로 에디터" loading="lazy" allow="fullscreen"></iframe>
            <aside className="ghost" aria-label="Ghost 불러오기">
              <h3>Ghost 불러오기</h3>
              <div className="gb"><b>공유 코드</b><input placeholder="예: K7Q-2MX" disabled /><span className="dim small">다른 팀이 준 코드를 넣으면 그 경로가 Ghost로 떠요.</span></div>
              <div className="gb"><b>팀 번호로 찾기</b><input placeholder="예: 25316" inputMode="numeric" disabled /><span className="dim small">그 팀이 우리에게 공개한 경로가 나와요.</span></div>
              <div className="gb"><b>대회 동맹 자동</b><span className="dim small">대회 당일 대진이 나오면 다음 경기 동맹의 공개 경로가 자동으로 들어와요.</span></div>
              <p className="note">Ghost 공유는 팀 로그인이 열리는 11월 중순에 켜져요.</p>
            </aside>
          </div>
          <p className="dim small">로그인 없이 그려 볼 수 있어요. 경로는 이 브라우저에 저장돼요. 기리고차 팀은 에디터의 「Send to robot」으로 로봇에 바로 보내고, 다른 라이브러리는 File에서 좌표를 내보내요.</p>
        </div>
      </div></section>

      <section className="sec wide" id="mine"><div className="in">
        <div><span className="label">§02</span><h2>우리 팀 경로</h2></div>
        <div className="body">
          <div className="lock">
            <div><b>팀으로 로그인하면 경로를 저장하고 공유할 수 있어요</b><p className="dim small">경로마다 비공개 · 동맹이 되면 공개 · 지정 팀만 · 모두에게 중에서 골라요. 처음 값은 비공개예요.</p></div>
            <Link className="btn pri" href="/login">팀 로그인</Link>
          </div>
        </div>
      </div></section>

      <section className="sec wide" id="public"><div className="in">
        <div><span className="label">§03</span><h2>공개 오토 모음</h2><p className="dim small" style={{ margin: '6px 0 0' }}>이번 시즌 · 모두에게 공개된 경로</p></div>
        <div className="body"><p className="dim">아직 공개된 경로가 없어요. 팀이 경로를 「모두에게」 공개하면 여기에 모여요.</p></div>
      </div></section>
    </main>
  );
}
