# KRC Alumni 커뮤니티 사이트 (Next.js)

Next.js 16 (App Router) + Vercel. `../site`(Astro)에서 옮긴 판이고, 화면·주소·데이터는 같다.

## 실행
```
npm install
cp .env.example .env    # FTC API 토큰 넣기
npm run dev             # http://localhost:3000
npm test                # FTC API 클라이언트·페이지 목록 테스트
npm run build
```

## 구조
- 빌드 때 HTML: `/`, `/krc`, `/auto`, `/learn/*`, `/alumni`, `/mentoring`, `/login`
- 서버가 HTML로 만들고 10분 캐시(ISR, 각 page.tsx의 `revalidate = 600`): `/teams`, `/teams/[번호]`(처음 열릴 때), `/sponsors`, `/live`, `/sitemap.xml`
- 브라우저 동작: 페이지 폴더의 `*Boot.tsx`·`Fullscreen.tsx`, 홈 배경 `src/components/pcb.js`
- `/live`는 대회 날 `/api/live`(CDN 30초 캐시)를 30초마다 불러 Live 화면이 된다. 다른 대회를 띄우려면 `LIVE_EVENT=2026/<코드>`, `LIVE_DATES=2026-11-21`
- FTC API 클라이언트: `src/lib/ftc.ts` (토큰은 서버에서만)
- 검색·AI: 페이지 메타 `src/lib/meta.ts`(제목·설명은 `src/lib/pages.ts`), JSON-LD `src/components/JsonLd.tsx`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`
- 디자인: `src/styles/lab.css` 공통, 페이지 전용 CSS는 `.pg-<이름>` 아래(페이지 폴더의 .css). 글꼴은 next/font로 자체 제공
- 팀 로고: `public/team-logos/` + `src/data/team-logos.json`
- 경로 에디터: `public/editor/` 는 girigocha 저장소 `editor/` 복사본. 에디터를 고치면 `npm run sync-editor`

## 대회 당일: 경기 호출·입장 체크
- 학생: 팀 QR(`/live?team=팀번호`) → 「🔔 경기 호출 받기」. 아이폰은 공유 → 「홈 화면에 추가」 후 홈 화면 아이콘으로 열어야 호출이 온다(iOS 16.4+).
- 자동 호출(`src/lib/calls.ts`, 시점 계산 `src/lib/livestate.ts`): 1차 = 두 경기 앞 경기 시작, 2차 = 바로 앞 경기 시작. 심판이 대기석 도착을 체크한 팀은 보내지 않는다. 같은 호출은 한 번만.
- 심판: `/live/queue` (PIN = `QUEUE_PIN`). 팀을 눌러 도착 체크, 「찾는 중」에서 팀별 다시 호출, 경기 카드에서 미도착 팀 한꺼번에 호출.
- 자동 호출 실행 (겹쳐도 같은 호출은 한 번만):
  - 기본: 심판 화면(`/live/queue`)이 열려 있으면 10초마다 같이 돈다
  - 예비: 대회장 노트북에서 `node scripts/tick.mjs --url https://사이트주소` (30초마다 `/api/push/tick`, 헤더 `Authorization: Bearer <CRON_SECRET>`)
  - 선택: cron-job.org에서 1분마다 `/api/push/tick` (Vercel 무료 요금제의 예약 작업은 하루 한 번뿐이라 못 씀)
- 리허설: 지난 대회 재생 `node scripts/tick.mjs --replay 2026-01-31T11:00` + `/live?replay=…`, `/live/queue?replay=…` (같은 시각)
- 저장소: Supabase (`supabase/schema.sql`을 SQL Editor에서 한 번 실행, `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`). 비우면 로컬 파일 `.data/store.json`(개발용)
- 환경변수 전체: `.env.example`
