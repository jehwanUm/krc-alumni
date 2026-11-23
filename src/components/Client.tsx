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

// 로그인 상태: 로그인 쿠키로 자동 확인 (/api/me, 볼 때마다 로그인 30일 연장). 한 페이지에서 한 번만 부른다
type Me = { login: boolean; team?: number | null; teamName?: string };
let meP: Promise<Me> | null = null;
const getMe = () => (meP ??= fetch('/api/me').then((r) => r.json()).catch(() => ({ login: false })));
function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { getMe().then(setMe); }, []);
  return me;
}

// 상단 버튼: 로그인 안 함 → 로그인, 로그인 + 팀 → 우리 팀 페이지, 팀 없음 → 내 계정
export function HeaderAuth() {
  const me = useMe();
  if (me?.login && me.team) return <Link className="btn pri" href={`/teams/${me.team}`}>{me.team} · 우리 팀</Link>;
  if (me?.login) return <Link className="btn pri" href="/login">내 계정</Link>;
  return <Link className="btn pri" href="/login">로그인</Link>;
}

// 첫 화면 버튼: 로그인 + 팀 연결일 때만 우리 팀 페이지(대회 날엔 Live). 로그인 버튼은 상단에만
export function TeamButton({ live }: { live: boolean }) {
  const me = useMe();
  if (!me?.login || !me.team) return null;
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
