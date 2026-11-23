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
  { path: "/learn", section: "배움", title: "배움 · FTC 가이드와 시즌 자료", desc: "KRC·FTC 팀을 위한 배움 공간. 시즌 자료실(필드 도면·매뉴얼 요약·CAD), 신생 팀 가이드, 기리고차 경로 추종 가이드, 3D 모델링 강의." },
  { path: "/learn/season", section: "배움", title: "시즌 자료실", desc: "FTC 이번 시즌 자료 모음: KRC 필드 도면, 게임 매뉴얼 한국어 요약, 규칙 Q&A, CAD·3D 모델 라이브러리." },
  { path: "/learn/new-team", section: "배움", title: "신생 팀 가이드", desc: "FTC·KRC에 처음 나가는 팀을 위한 가이드: 등록, 부품, 로봇 제작, 대회 당일까지 첫 시즌 체크리스트와 자주 하는 실수." },
  { path: "/learn/girigocha", section: "배움", title: "기리고차 가이드", desc: "기리고차: FTC 메카넘 로봇용 경로 추종 라이브러리. 설치 파일 내려받기, 시작하기, 튜닝, 첫 오토 만들기, 진단 코드." },
  { path: "/learn/girigocha/install", section: "배움", title: "기리고차 준비물과 설치", desc: "기리고차 설치: 준비물, 팀 코드 백업, 설치 파일(APK)을 Control Hub에 올리는 방법, 원래 앱으로 돌아가는 법." },
  { path: "/learn/girigocha/setup", section: "배움", title: "기리고차 로봇 설정", desc: "브라우저 설정 페이지에서 모터 이름, 드라이브 모터, 바퀴, 트랙 폭, 데드휠 구성과 위치를 입력하는 방법." },
  { path: "/learn/girigocha/check", section: "배움", title: "기리고차 점검", desc: "「기리고차 점검」 OpMode: 모터·데드휠 방향과 배선 실수를 찾아 X로 자동 수정. 오류·경고 읽는 법." },
  { path: "/learn/girigocha/measure", section: "배움", title: "기리고차 측정과 확인 주행", desc: "「기리고차 측정」 OpMode: kS·kV·kA, 옆 마찰, 지연을 로봇이 스스로 재고 S자 확인 주행으로 경로 만들 준비를 확인." },
  { path: "/learn/girigocha/tuning", section: "배움", title: "기리고차 세부 튜닝", desc: "기리고차 세부 튜닝: 경로 보정 이득, 가감속, 도착 조건을 브라우저 설정 페이지에서 바꾸는 법과 값마다 시뮬레이터로 본 효과 (Pedro PIDF와 비교)." },
  { path: "/learn/girigocha/first-auto", section: "배움", title: "Blocks로 첫 오토 만들기", desc: "FTC Blocks에서 기리고차 블록으로 첫 오토노머스 만들기: 경로 만들기, 직선 추가, 경로 끝까지 달리기, 제자리 회전, 좌표 읽는 법." },
  { path: "/learn/girigocha/editor", section: "배움", title: "에디터로 그려서 로봇으로 보내기", desc: "경로 에디터에서 그린 오토를 Control Hub로 보내고 「기리고차 경로 실행」이나 「보낸 경로 달리기」 블록으로 달리는 방법." },
  { path: "/learn/girigocha/mechanisms", section: "배움", title: "오토에 모터·서보 넣기", desc: "기리고차 오토에 팔·집게·흡입기 넣기: 경로 사이에 멈춰서 움직이기, 마커 블록으로 달리면서 움직이기." },
  { path: "/learn/girigocha/biobuzz", section: "배움", title: "BIOBUZZ 예시 오토", desc: "기리고차 BIOBUZZ 30초 오토 예시 4가지: HIVE TIP 전략, 같은 편 두 대 시뮬레이션 재생, Blocks 목록과 Java 코드, Robits 스타터봇 오토." },
  { path: "/learn/girigocha/codes", section: "배움", title: "기리고차 진단 코드", desc: "기리고차 진단 코드 표: GRG-E101, W108, E201 등 Driver Station에 나오는 오류·경고의 뜻과 고치는 법." },
  { path: "/learn/lectures", section: "배움", title: "강의와 인터뷰", desc: "KRC 동문회 3D 모델링 강의와 KRC 우승자 인터뷰." },
  { path: "/alumni", section: "동문회", title: "동문회 · 소식과 자원봉사·심판 모집", desc: "KRC 동문회 소식과 행사, KRC 대회 자원봉사·심판 모집, 동문 가입과 Discord." },
  { path: "/sponsors", section: "동문회", title: "후원 기업", desc: "KRC(Korea Robot Championship) 팀을 후원하는 기업과 기관, 후원 팀과 성적. KRC 동문회와 함께하는 기업의 협업·장학 프로그램." },
  { path: "/mentoring", section: "동문회", title: "멘토링", desc: "KRC 동문 멘토와 팀을 잇는 멘토링 매칭: 설계, 코딩, 전략, 3D 모델링." },
  { path: "/links", section: "동문회", title: "링크 모음", desc: "KRC 동문회 인스타그램 프로필 링크 모음: 지금 받는 신청서, 기리고차 가이드, 경로 에디터, 홈페이지.", noindex: true },
  { path: "/login", section: "계정", title: "로그인 · 회원가입", desc: "KRC 참가 학생과 동문의 홈페이지 계정. 가입 신청 후 운영진이 확인하면 로그인할 수 있어요.", noindex: true },
  { path: "/login/reset", section: "계정", title: "비밀번호 재설정", desc: "운영진이 보낸 링크로 새 비밀번호를 정해요.", noindex: true },
  { path: "/privacy", section: "안내", title: "개인정보처리방침", desc: "KRC 동문회 홈페이지가 모으는 개인정보와 보관·파기, 문의처." },
  { path: "/admin/members", section: "계정", title: "가입 신청 관리", desc: "운영진 전용: 회원가입 신청 확인과 승인.", noindex: true },
];

export function page(path: string) {
  const p = PAGES.find((x) => x.path === path);
  if (!p) throw new Error(`src/lib/pages.ts에 ${path} 가 없어요`);
  return { title: p.title, desc: p.desc, noindex: p.noindex };
}

export const NOINDEX = PAGES.filter((p) => p.noindex).map((p) => p.path);
