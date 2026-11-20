import type { NextConfig } from 'next';

// 페이지별 캐시는 각 page.tsx의 `revalidate`(ISR 10분)로, 대회 Live API는 응답 헤더(CDN 30초)로 정한다.
const config: NextConfig = { trailingSlash: false, poweredByHeader: false };
export default config;
