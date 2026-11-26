// 공개 페이지 목록: 제목·설명의 한 곳. 페이지 메타(src/lib/meta.ts), sitemap, robots, llms.txt가 여기서 가져간다.
// 새 페이지를 만들면 여기에 한 줄 추가 (test/pages.test.ts가 빠진 페이지를 잡는다). noindex 페이지는 sitemap·llms.txt에서 빠진다.
export type PageInfo = { path: string; title: string; desc: string; section: string; noindex?: boolean };

export const PAGES: PageInfo[] = [
  { path: "/", section: "소개", title: "KRC Alumni", desc: "Korea Robot Championship(KRC) 동문회 커뮤니티. 대회 대진과 동맹, 오토 경로 공유, 시즌 자료와 신생 팀 가이드, KRC 대회 소개와 역대 기록." },
  { path: "/krc", section: "대회", title: "Korea Robot Championship", desc: "KRC(Korea Robot Championship)는 창의공학교육협회가 주관하는 FIRST Tech Challenge 국내 대회예요. 대회 소개, 경기 방식, KRC 2027 일정, 역대 대회 기록." },
  { path: "/teams", section: "대회", title: "팀 · KRC 참가 팀", desc: "KRC(Korea Robot Championship) 참가 팀 목록. 팀 번호, 팀 이름, 소속, 지역과 팀별 KRC 기록." },
  { path: "/live", section: "대회", title: "대회 · KRC 일정과 결과", desc: "다음 KRC 일정, 지난 KRC 결승·수상·세계 대회 진출 팀과 순위, 국내 FTC 대회. 대회 당일에는 경기와 순위를 실시간으로.", noindex: true },
  { path: "/start", section: "대회", title: "우리 팀 설정", desc: "대회장 QR로 여는 첫 화면: 팀 번호를 넣어 이 기기에 우리 팀을 저장하고 대회 정보와 대진표로 가요.", noindex: true },
  { path: "/live/queue", section: "대회", title: "입장 체크", desc: "대회 심판용 입장 체크: 다음 경기 팀의 대기석 도착을 체크하고, 안 온 팀을 휴대폰으로 호출해요.", noindex: true },
  { path: "/auto", section: "오토", title: "오토 · 경로 에디터", desc: "FTC 오토노머스 경로를 브라우저에서 그리고, 다른 팀 경로를 Ghost로 겹쳐 비교해요. 기리고차는 로봇으로 바로 보내고, 다른 라이브러리는 좌표를 내보내요." },
  { path: "/alumni", section: "동문회", title: "동문회 · 소식과 자원봉사·심판 모집", desc: "KRC 동문회 소식과 행사, KRC 대회 자원봉사·심판 모집, 동문 가입과 Discord." },
  { path: "/sponsors", section: "동문회", title: "후원 기업", desc: "KRC(Korea Robot Championship) 팀을 후원하는 기업과 기관, 후원 팀과 성적. KRC 동문회와 함께하는 기업의 협업·장학 프로그램." },
  { path: "/mentoring", section: "동문회", title: "멘토링", desc: "KRC 동문 멘토와 팀을 잇는 멘토링 매칭: 설계, 코딩, 전략, 3D 모델링." },
  { path: "/links", section: "동문회", title: "링크 모음", desc: "KRC 동문회 인스타그램 프로필 링크 모음: 지금 받는 신청서, 기리고차 가이드, 경로 에디터, 홈페이지.", noindex: true },
  { path: "/login", section: "계정", title: "로그인 · 회원가입", desc: "KRC 참가 학생과 동문의 홈페이지 계정. 가입 신청 후 운영진이 확인하면 로그인할 수 있어요.", noindex: true },
  { path: "/login/reset", section: "계정", title: "비밀번호 재설정", desc: "운영진이 보낸 링크로 새 비밀번호를 정해요.", noindex: true },
  { path: "/terms", section: "안내", title: "이용약관", desc: "KRC 동문회 홈페이지 회원가입·팀 페이지·올리는 내용에 관한 규칙." },
  { path: "/privacy", section: "안내", title: "개인정보처리방침", desc: "KRC 동문회 홈페이지가 모으는 개인정보와 보관·파기, 문의처." },
  { path: "/admin/members", section: "계정", title: "가입 신청 관리", desc: "운영진 전용: 회원가입 신청 확인과 승인.", noindex: true },
];

export function page(path: string) {
  const p = PAGES.find((x) => x.path === path);
  if (!p) throw new Error(`src/lib/pages.ts에 ${path} 가 없어요`);
  return { title: p.title, desc: p.desc, noindex: p.noindex };
}

export const NOINDEX = PAGES.filter((p) => p.noindex).map((p) => p.path);
