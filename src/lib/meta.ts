import type { Metadata } from 'next';
import { PAGES } from './pages';

// 모든 페이지의 검색·공유용 메타: 제목, 설명, canonical, OG, noindex. 제목·설명은 pages.ts 한 곳에서.
export const SITE = process.env.SITE_URL || 'http://localhost:3000'; // shortcut: 도메인 미정, 정해지면 SITE_URL로
export const SITE_NAME = 'KRC Alumni';
export const abs = (path: string) => new URL(path, SITE).href;

export function meta(path: string, over?: { title: string; desc: string }): Metadata {
  const p = over ? { ...over, noindex: false } : PAGES.find((x) => x.path === path);
  if (!p) throw new Error(`src/lib/pages.ts에 ${path} 가 없어요`);
  const full = path === '/' ? `${SITE_NAME} · Korea Robot Championship 동문회` : `${p.title} · ${SITE_NAME}`;
  return {
    title: { absolute: full },
    description: p.desc,
    alternates: { canonical: abs(path) },
    robots: p.noindex ? { index: false } : undefined,
    openGraph: { type: 'website', siteName: SITE_NAME, title: full, description: p.desc, url: abs(path), locale: 'ko_KR' },
  };
}
