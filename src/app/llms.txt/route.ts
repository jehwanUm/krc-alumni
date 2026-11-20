import { PAGES } from '../../lib/pages';
import { abs } from '../../lib/meta';
import { KRC_SEASONS } from '../../lib/ftc';

// AI 검색(GEO)용 사이트 안내 (llmstxt.org 형식). 페이지 목록은 src/lib/pages.ts에서 자동으로.
export const dynamic = 'force-static';

export function GET() {
  const pages = PAGES.filter((p) => !p.noindex && p.path !== '/');
  const sections = [...new Set(pages.map((p) => p.section))];
  const sl = (y: number) => `${y}–${String(y + 1).slice(2)}`;
  const body = `# KRC Alumni

> Korea Robot Championship(KRC) 동문회 커뮤니티. KRC는 창의공학교육협회가 주관하는 FIRST Tech Challenge(FTC) 국내 대회예요. 다음 대회 KRC 2027은 2027년 1월 29~30일.

이 사이트의 대회·팀 기록은 FIRST의 공식 FTC Events 데이터(${sl(KRC_SEASONS[0])} 시즌부터)에서 가져와요. 팀 페이지는 /teams/<팀 번호> 주소에 있어요.

${sections.map((s) => `## ${s}\n${pages.filter((p) => p.section === s).map((p) => `- [${p.title}](${abs(p.path)}): ${p.desc}`).join('\n')}`).join('\n\n')}

## 데이터
- [사이트맵](${abs('/sitemap.xml')}): 공개 페이지와 KRC에 참가한 모든 팀의 페이지
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
