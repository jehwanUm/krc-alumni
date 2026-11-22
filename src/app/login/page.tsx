import { meta } from '@/lib/meta';

export const metadata = meta('/login');

export default function Page() {
  return (
    <main>
      <section className="page-head"><div className="in">
        <span className="label">Team login</span>
        <h1>팀 로그인</h1>
        <p>팀 계정으로 우리 팀 페이지와 오토 경로를 관리해요. 로그인은 준비 중이에요. 열리면 동문회 소식으로 알려요.</p>
      </div></section>
    </main>
  );
}
