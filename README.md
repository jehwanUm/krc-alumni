# KRC Alumni — Korea Robot Championship 동문회 홈페이지

KRC(FIRST Tech Challenge 국내 대회) 동문회 홈페이지 코드예요. 대회 Live·경기 호출, 팀 페이지, 오토 경로 공유, 시즌 자료, 회원(운영진 승인제)을 담고 있어요.

- Next.js 16 (App Router), Node 22.13+ (권장 24 LTS)
- 저장소: SQLite 파일 하나 (Node 내장 `node:sqlite`, 추가 패키지 없음), 팀 사진은 서버 폴더
- **서버에 올리기: [`deploy/README.md`](deploy/README.md)** (Ubuntu 24.04, systemd, nginx)
- 라이선스: 이 저장소 코드는 MIT (`LICENSE`). FIRST®, FTC®, BIOBUZZ™는 FIRST의 상표예요. 배움(/learn) 글은 KRC Tech(/tech-blog)로 옮겼고, 옛 주소는 `next.config.ts`에서 그 글로 리디렉트해요

## 실행
```
npm install
cp .env.example .env    # FTC API 토큰 넣기
npm run dev             # http://localhost:3000
npm test                # FTC API·저장소·회원·페이지 목록 테스트
npm run build
```

## 구조
- 빌드 때 HTML: `/`, `/krc`, `/auto`, `/alumni`, `/mentoring`, `/login`
- 서버가 HTML로 만들고 10분 캐시(ISR, 각 page.tsx의 `revalidate = 600`): `/teams`, `/teams/[번호]`(처음 열릴 때), `/sponsors`, `/live`, `/sitemap.xml`
- 브라우저 동작: 페이지 폴더의 `*Boot.tsx`·`Fullscreen.tsx`, 홈 배경 `src/components/pcb.js`
- `/live`는 대회 날 `/api/live`(CDN 30초 캐시)를 30초마다 불러 Live 화면이 된다. 다른 대회를 띄우려면 `LIVE_EVENT=2026/<코드>`, `LIVE_DATES=2026-11-21`
- FTC API 클라이언트: `src/lib/ftc.ts` (토큰은 서버에서만)
- 검색·AI: 페이지 메타 `src/lib/meta.ts`(제목·설명은 `src/lib/pages.ts`), JSON-LD `src/components/JsonLd.tsx`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`
- 디자인: `src/styles/lab.css` 공통, 페이지 전용 CSS는 `.pg-<이름>` 아래(페이지 폴더의 .css). 글꼴은 next/font로 자체 제공
- 팀 로고: `public/team-logos/` + `src/data/team-logos.json`
- 경로 에디터: `public/editor/` 는 기리고차 저장소 `editor/` 복사본 (`npm run sync-editor`는 두 저장소를 나란히 받아 둔 경우에만)
- 회원·팀장·오토 저장: `src/lib/store.ts`(SQLite, 표는 처음 열 때 자동 생성), `src/lib/member.ts`(비밀번호·쿠키), 운영진 화면 `/admin/members`

## 대회 당일: 경기 호출·입장 체크
- 학생: 팀 QR(`/live?team=팀번호`) → 「🔔 경기 호출 받기」. 아이폰은 공유 → 「홈 화면에 추가」 후 홈 화면 아이콘으로 열어야 호출이 온다(iOS 16.4+).
- 자동 호출(`src/lib/calls.ts`, 시점 계산 `src/lib/livestate.ts`): 1차 = 두 경기 앞 경기 시작, 2차 = 바로 앞 경기 시작. 심판이 대기석 도착을 체크한 팀은 보내지 않는다. 같은 호출은 한 번만.
- 심판: `/live/queue` (PIN = `QUEUE_PIN`). 팀을 눌러 도착 체크, 「찾는 중」에서 팀별 다시 호출, 경기 카드에서 미도착 팀 한꺼번에 호출.
- 자동 호출 실행 (겹쳐도 같은 호출은 한 번만):
  - 기본: 심판 화면(`/live/queue`)이 열려 있으면 10초마다 같이 돈다
  - 서버: systemd `krc-alumni-tick`이 30초마다 `/api/push/tick` (헤더 `Authorization: Bearer <CRON_SECRET>`)
  - 예비: 대회장 노트북에서 `node scripts/tick.mjs --url https://사이트주소`
- 리허설: 지난 대회 재생 `node scripts/tick.mjs --replay 2026-01-31T11:00` + `/live?replay=…`, `/live/queue?replay=…` (같은 시각)
- 저장소: SQLite (`DB_PATH`, 기본 `.data/krc.sqlite`), 사진 `UPLOAD_DIR`. 백업 `npm run backup`(암호화), 예전 Supabase 데이터 옮기기 `npm run import:supabase`
- 환경변수 전체: `.env.example`
