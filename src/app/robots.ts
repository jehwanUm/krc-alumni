import type { MetadataRoute } from 'next';
import { NOINDEX } from '../lib/pages';
import { abs } from '../lib/meta';

// 검색엔진과 AI 크롤러(GEO) 모두 공개 영역을 읽게 허용. 실시간·로그인 화면(pages.ts의 noindex)과 API는 제외.
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Yeti'];

export default function robots(): MetadataRoute.Robots {
  const rule = { allow: '/', disallow: ['/api/', ...NOINDEX] };
  return { rules: [{ userAgent: '*', ...rule }, { userAgent: AI_BOTS, ...rule }], sitemap: abs('/sitemap.xml') };
}
