import type { NextConfig } from 'next';

// 배움(/learn) 글은 KRC Tech로 옮겼다 (2026-11-26). 옛 주소(인스타·QR·검색)는 같은 글로 보낸다
const TECH = 'https://www.krcalumni.com/tech-blog';
const post = (slug: string) => `${TECH}/post/${encodeURIComponent(slug)}`;
const LEARN: [string, string][] = [
  ['/learn', `${TECH}/`],
  ['/learn/season', post('시즌-자료실-biobuzz')],
  ['/learn/season/manual', post('시즌-자료실-biobuzz')], // 매뉴얼 요약 §01~§16 목차가 이 글에 있다
  ['/learn/new-team', post('신생-팀-가이드')],
  ['/learn/lectures', `${TECH}/category/${encodeURIComponent('강의와-인터뷰')}`],
  ['/learn/girigocha', post('기리고차-기리고차란')],
  ['/learn/girigocha/install', post('기리고차-준비물과-설치')],
  ['/learn/girigocha/setup', post('기리고차-로봇-설정')],
  ['/learn/girigocha/check', post('기리고차-점검')],
  ['/learn/girigocha/measure', post('기리고차-측정과-확인-주행')],
  ['/learn/girigocha/tuning', post('기리고차-세부-튜닝')],
  ['/learn/girigocha/first-auto', post('기리고차-blocks로-첫-경로')],
  ['/learn/girigocha/editor', post('기리고차-에디터로-그려서-보내기')],
  ['/learn/girigocha/mechanisms', post('기리고차-모터-서보-넣기')],
  ['/learn/girigocha/biobuzz', post('기리고차-biobuzz-예시-오토')],
  ['/learn/girigocha/codes', post('기리고차-진단-코드')],
];

// 페이지별 캐시는 각 page.tsx의 `revalidate`(ISR 10분)로, 대회 Live API는 응답 헤더(CDN 30초)로 정한다.
const config: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false,
  async redirects() {
    return [
      ...LEARN.map(([source, destination]) => ({ source, destination, permanent: true })),
      { source: '/learn/:path*', destination: `${TECH}/`, permanent: true }, // 그 밖의 옛 배움 주소
    ];
  },
};
export default config;
