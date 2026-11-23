import { PRIVACY_EMAIL } from '@/lib/nav';

// 권리침해·부적절 게시물 신고: 운영진 메일로 (정보통신망법 제44조의2 — 받으면 숨기고 게시자에게 알림)
export function ReportLink({ what, url }: { what: string; url: string }) {
  if (!PRIVACY_EMAIL) return null;
  const body = `신고할 곳: ${what}\n주소: ${url}\n\n무엇이 문제인가요? (예: 허락 없이 올라간 사진, 개인정보, 비방)\n\n\n신고하는 분 (선택): 이름·연락처\n\n※ 받으면 확인할 동안 해당 내용을 숨기고, 게시한 팀에 알려요.`;
  return <a className="report" href={`mailto:${PRIVACY_EMAIL}?subject=${encodeURIComponent(`[신고] ${what}`)}&body=${encodeURIComponent(body)}`}>권리침해·부적절 게시물 신고</a>;
}
