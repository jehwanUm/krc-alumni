import Link from 'next/link';
import { meta } from '@/lib/meta';
import { FullscreenButton } from './Fullscreen';
import { AutoTeam, GhostBox, PublicGhost } from './AutoTeam';
import { autos } from '@/lib/store';
import { getDirectory } from '@/lib/teams';
import { ReportLink } from '@/components/Report';
import { abs } from '@/lib/meta';
import './auto.css';

export const metadata = meta('/auto');
export const revalidate = 600;

// 오토: 페이지를 열면 바로 경로 에디터(기리고차 Path Editor, public/editor — `npm run sync-editor`로 girigocha 저장소에서 복사).
// 우리 팀 경로 저장·공개 범위·Ghost는 AutoTeam(로그인한 팀원), 공개 오토 모음은 서버가 10분 캐시로 그린다.
export default async function Page() {
  const [pub, dir] = await Promise.all([autos.publicAll().catch(() => []), getDirectory().catch(() => null)]);
  const tname = (n: number) => dir?.teams.find((t) => t.n === n)?.name ?? '';
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
            <GhostBox />
          </div>
          <p className="dim small">로그인 없이 그려 볼 수 있어요. 경로는 이 브라우저에 저장되고, 로그인하면 아래 「우리 팀 경로」에 팀 계정으로 저장할 수 있어요. 기리고차 팀은 에디터의 「Send to robot」으로 로봇에 바로 보내고, 다른 라이브러리는 File에서 좌표를 내보내요.</p>
        </div>
      </div></section>

      <section className="sec wide" id="mine"><div className="in">
        <div><span className="label">§02</span><h2>우리 팀 경로</h2></div>
        <div className="body">
          <AutoTeam />
        </div>
      </div></section>

      <section className="sec wide" id="public"><div className="in">
        <div><span className="label">§03</span><h2>공개 오토 모음</h2><p className="dim small" style={{ margin: '6px 0 0' }}>이번 시즌 · 모두에게 공개된 경로</p></div>
        <div className="body">{pub.length ? <ul className="alist">{pub.map((a) => (
          <li key={a.id}><div><b>{a.name}</b> <Link href={`/teams/${a.team}`} className="dim small">{a.team} {tname(a.team)}</Link></div><div className="acts"><PublicGhost id={a.id} /><ReportLink what={`공개 오토 「${a.name}」 (팀 ${a.team})`} url={abs('/auto#public')} /></div></li>
        ))}</ul> : <p className="dim">아직 공개된 경로가 없어요. 팀이 경로를 「모두에게」 공개하면 여기에 모여요.</p>}</div>
      </div></section>
    </main>
  );
}
