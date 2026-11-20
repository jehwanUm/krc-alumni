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

// 홈 버튼: 팀 번호를 이 기기에 저장해 두고(Live 화면과 같은 'krc-team'), 다음부터는 우리 팀으로 바로 간다.
// shortcut: 팀 계정 로그인이 생기면 저장 대신 로그인으로 바꾼다
export function TeamButton({ live }: { live: boolean }) {
  const [team, setTeam] = useState(0);
  const [edit, setEdit] = useState(false);
  useEffect(() => { try { setTeam(Number(localStorage.getItem('krc-team')) || 0); } catch {} }, []);
  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = Number(new FormData(e.currentTarget).get('team'));
    if (!Number.isInteger(n) || n <= 0 || n > 99999) return;
    try { localStorage.setItem('krc-team', String(n)); } catch {}
    setTeam(n); setEdit(false);
  };
  if (edit) return (
    <form className="team-form" onSubmit={save}>
      <label htmlFor="team-no" className="sr">팀 번호</label>
      <input id="team-no" name="team" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="팀 번호" defaultValue={team || ''} autoFocus />
      <button className="btn pri" type="submit">저장</button>
    </form>
  );
  if (!team) return <button className="btn pri" type="button" onClick={() => setEdit(true)}>우리 팀 연결하기</button>;
  return (
    <div className="team-go">
      <Link className="btn pri" href={live ? `/live?team=${team}` : `/teams/${team}`}>{team} · {live ? '우리 팀 다음 경기' : '우리 팀 페이지'}</Link>
      <button className="link" type="button" onClick={() => setEdit(true)}>팀 바꾸기</button>
    </div>
  );
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
