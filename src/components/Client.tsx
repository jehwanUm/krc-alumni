'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { startPcb } from './pcb.js';

// 페이지에 붙는 작은 브라우저 동작들. 페이지 HTML은 서버가 다 만들고, 여기서는 움직임만 더한다.

const dday = (start: string, after: string) => {
  const d = Math.ceil((Date.parse(start + 'T00:00:00+09:00') - Date.now()) / 864e5);
  return d > 0 ? `D-${d}` : d === 0 ? 'D-DAY' : after;
};

// 남은 날: 빌드 때 값으로 그리고, 방문 시점 기준으로 다시 센다
export function DDay({ start, after, id }: { start: string; after: string; id?: string }) {
  const [v, setV] = useState(() => dday(start, after));
  useEffect(() => setV(dday(start, after)), [start, after]);
  return <b id={id} suppressHydrationWarning>{v}</b>;
}

// 홈 버튼: 로그인 쿠키로 자동 로그인 상태를 확인한다 (/api/me, 볼 때마다 로그인 30일 연장)
// 로그인 + 팀 연결 → 우리 팀 페이지(대회 날엔 Live), 로그인만 → 내 계정, 로그인 안 함 → 로그인
type Me = { login: boolean; team?: number | null; teamName?: string };
export function TeamButton({ live }: { live: boolean }) {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { fetch('/api/me').then((r) => r.json()).then(setMe).catch(() => setMe({ login: false })); }, []);
  if (!me) return <span className="btn pri ghost" aria-hidden="true">&nbsp;</span>;   // 자리만 잡아 화면이 덜컹이지 않게
  if (!me.login) return <Link className="btn pri" href="/login">로그인</Link>;
  if (!me.team) return <Link className="btn pri" href="/login">내 계정</Link>;
  const t = `${me.team}${me.teamName ? ` ${me.teamName}` : ''}`;
  return <Link className="btn pri" href={live ? `/live?live=1&team=${me.team}` : `/teams/${me.team}`}>{t} · {live ? '우리 팀 다음 경기' : '우리 팀 페이지'}</Link>;
}

// 홈 배경 회로 기판 (#pcb 캔버스)
export function Pcb() {
  useEffect(() => startPcb(), []);
  return <canvas id="pcb" aria-hidden="true"></canvas>;
}

// 페이지 스크립트를 화면에 들어올 때 실행하고, 나갈 때 정리한다 (start가 정리 함수를 돌려줌)
export function useBoot(start: () => (() => void) | void) {
  useEffect(() => start() ?? undefined, []); // eslint-disable-line react-hooks/exhaustive-deps
}
