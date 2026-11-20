import { meta } from '@/lib/meta';
import './links.css';

export const metadata = meta('/links');
export const revalidate = 3600; // 마감이 지난 링크가 한 시간 안에 빠지게

// 인스타 프로필 링크(링크 트리). 링크를 더하거나 뺄 때는 이 목록만 고친다.
// until: 이 시각(KST)이 지나면 숨김. url이 비어 있으면 숨김.
const LINKS: { title: string; sub?: string; url: string; until?: string; hot?: boolean }[] = [
  { title: '기리고차 테스트 팀 신청', sub: '5팀 모집 · 12/6(일) 마감', url: '', until: '2026-12-06T23:59:59+09:00', hot: true }, // 구글 폼 주소를 넣으면 보여요
  { title: '기리고차 가이드', sub: '설치부터 첫 오토까지', url: '/learn/girigocha' },
  { title: '경로 에디터', sub: '오토 경로를 그리고 미리 재생', url: '/auto' },
  { title: 'KRC Alumni 홈페이지', sub: '대회 일정 · 팀 · 시즌 자료', url: '/' },
];

export default function Page() {
  const now = Date.now();
  const live = LINKS.filter((l) => l.url && (!l.until || now <= Date.parse(l.until)));
  return (
    <main className="links">
      <div className="links-in">
        <span className="label">KRC 동문회</span>
        <h1>KRC Alumni</h1>
        <p>Korea Robot Championship 동문회 링크 모음</p>
        <ul>
          {live.map((l) => {
            const ext = l.url.startsWith('http');
            return (
              <li key={l.title}>
                <a className={l.hot ? 'hot' : undefined} href={l.url} {...(ext ? { target: '_blank', rel: 'noopener' } : {})}>
                  <b>{l.title}</b>{l.sub && <small>{l.sub}</small>}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
