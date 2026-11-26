// 머리글·바닥글 메뉴
// 대회 기간 모드: 12월 말 정식 공개 전까지는 대회 쪽(대회·팀)만 연다. 공개할 때 false로 바꾼다
export const COMPETITION_ONLY = false;
// 대회 기간에도 여는 주소: 대회·팀·팀 로그인(Live에서 우리 팀 선택)과, 테스트 팀에 이미 나간 기리고차 가이드·에디터·링크 모음
export const OPEN = ['/start', '/live', '/teams', '/login', '/auto', '/links'];

const ALL = [
  ['/live', '대회'], ['/teams', '팀'], ['/auto', '오토'], ['https://www.krcalumni.com/tech-blog/', '배움'], ['/alumni', '동문회'], ['/krc', 'KRC 소개'],
] as const;
export const NAV: readonly (readonly [string, string])[] = COMPETITION_ONLY ? ALL.filter(([h]) => h === '/live' || h === '/teams') : ALL;

// 동문회 링크. 비어 있으면 버튼을 숨기고 「준비 중」으로 보여 준다
export const DISCORD_URL = 'https://discord.gg/UUmKQchB3X';
export const JOIN_URL = '/login';
// 개인정보 보호책임자 (개인정보처리방침에 실린다). 비어 있으면 Discord로 문의 안내
export const PRIVACY_OWNER = '엄제환';
export const PRIVACY_EMAIL = 'jh.um@fest.or.kr';
