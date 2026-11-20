// 기리고차 문서 목차 — 왼쪽 메뉴와 이전/다음 버튼이 이 순서를 쓴다. 제목·설명은 src/lib/pages.ts.
export const DOCS: { group: string; items: [path: string, label: string][] }[] = [
  { group: '시작하기', items: [
    ['/learn/girigocha', '기리고차란'],
    ['/learn/girigocha/install', '준비물과 설치'],
    ['/learn/girigocha/setup', '로봇 설정'],
  ] },
  { group: '튜닝', items: [
    ['/learn/girigocha/check', '점검'],
    ['/learn/girigocha/measure', '측정과 확인 주행'],
    ['/learn/girigocha/tuning', '세부 튜닝'],
  ] },
  { group: '첫 오토 만들기', items: [
    ['/learn/girigocha/first-auto', 'Blocks로 첫 경로'],
    ['/learn/girigocha/editor', '에디터로 그려서 보내기'],
    ['/learn/girigocha/mechanisms', '모터·서보 넣기'],
    ['/learn/girigocha/biobuzz', 'BIOBUZZ 예시 오토'],
  ] },
  { group: '찾아보기', items: [
    ['/learn/girigocha/codes', '진단 코드'],
  ] },
];
export const FLAT = DOCS.flatMap((g) => g.items);
export const VERSION = '0.12.1';
export const APK = `/downloads/girigocha-${VERSION}.apk`;
