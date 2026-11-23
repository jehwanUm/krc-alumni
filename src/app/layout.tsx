import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { IBM_Plex_Sans_KR, IBM_Plex_Mono } from 'next/font/google';
import Nav from '../components/Nav';
import { NAV, COMPETITION_ONLY, DISCORD_URL } from '../lib/nav';
import { HeaderAuth } from '@/components/Client';
import JsonLd from '../components/JsonLd';
import { SITE, SITE_NAME, abs } from '../lib/meta';
import '../styles/lab.css';

// 모든 페이지 공통: 머리글·바닥글, 사이트 전체 구조화 데이터. 페이지별 제목·설명은 각 page.tsx의 metadata(src/lib/meta.ts).
// 글꼴은 빌드 때 받아 우리 도메인에서 내보낸다 (구글 글꼴 서버를 기다리지 않음). 한글은 쓰는 글자 조각만 내려받는다.
const sans = IBM_Plex_Sans_KR({ weight: ['400', '500', '600', '700'], subsets: ['latin'], preload: false, display: 'swap', variable: '--font-sans' });
const mono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], display: 'swap', variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  // 홈 화면에 추가하면 앱처럼 열린다 (아이폰 경기 호출에 필요)
  appleWebApp: { capable: true, title: 'KRC', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0B0D12' };

const org = {
  '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, alternateName: 'KRC 동문회', url: abs('/'),
  description: 'Korea Robot Championship(KRC) 참가 경험자와 현재 참가 학생이 함께하는 동문회 커뮤니티',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <JsonLd data={[org]} />
        <header className="hdr"><div className="in">
          <Link className="logo" href={COMPETITION_ONLY ? '/live' : '/'}>KRC Alumni</Link>
          <Nav />
          <div className="right">{!COMPETITION_ONLY && DISCORD_URL && <a className="btn" href={DISCORD_URL} rel="external">Discord</a>}<HeaderAuth /></div>
        </div></header>
        {children}
        <footer className="ftr"><div className="in">
          <span>KRC Alumni · Korea Robot Championship 동문회</span>
          <nav aria-label="바닥 메뉴">
            {NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
            {!COMPETITION_ONLY && <><Link href="/sponsors">후원 기업</Link><Link href="/mentoring">멘토링</Link></>}<Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link>
          </nav>
        </div></footer>
      </body>
    </html>
  );
}
