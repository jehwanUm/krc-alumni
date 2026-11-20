import { NextResponse, type NextRequest } from 'next/server';
import { COMPETITION_ONLY, OPEN } from './lib/nav';

// 대회 기간 모드: 열어 둔 주소가 아니면 대회 페이지로 보낸다 (API·정적 파일은 matcher에서 뺌)
export function proxy(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (!COMPETITION_ONLY || OPEN.some((o) => p === o || p.startsWith(o + '/'))) return NextResponse.next();
  return NextResponse.redirect(new URL('/live', req.url));
}

export const config = { matcher: ['/((?!api/|_next/|.*\\.).*)'] };
