// 머리글·바닥글 메뉴
// 대회 기간 모드: 12월 말 정식 공개 전까지는 대회 쪽(대회·팀)만 연다. 공개할 때 false로 바꾼다
export const COMPETITION_ONLY = true;
// 대회 기간에도 여는 주소: 대회·팀·팀 로그인(Live에서 우리 팀 선택)과, 테스트 팀에 이미 나간 기리고차 가이드·에디터·링크 모음
export const OPEN = ['/start', '/live', '/teams', '/login', '/learn/girigocha', '/auto', '/links'];

const ALL = [
  ['/live', '대회'], ['/teams', '팀'], ['/auto', '오토'], ['/learn', '배움'], ['/alumni', '동문회'], ['/krc', 'Korea Robot Championship'],
] as const;
export const NAV: readonly (readonly [string, string])[] = COMPETITION_ONLY ? ALL.filter(([h]) => h === '/live' || h === '/teams') : ALL;
