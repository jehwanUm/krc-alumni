'use client';
import { useEffect, useState } from 'react';

type T = { n: number; name: string };
// 팀 번호 → 확인 → 'krc-team'(Live 화면·홈과 같은 저장 이름)에 저장 → 대회 페이지로
export function StartForm({ teams, next, live }: { teams: T[]; next: string; live: boolean }) {
  const [saved, setSaved] = useState(0);
  const [ask, setAsk] = useState<{ n: number; name: string; known: boolean } | null>(null);
  const [edit, setEdit] = useState(true);
  useEffect(() => { try { const s = Number(localStorage.getItem('krc-team')) || 0; setSaved(s); setEdit(!s); } catch {} }, []);
  const nameOf = (n: number) => teams.find((t) => t.n === n)?.name ?? '';
  const go = (n: number) => location.assign(live ? `${next}?team=${n}` : next);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = Number(String(new FormData(e.currentTarget).get('team')).trim());
    if (!Number.isInteger(n) || n <= 0 || n > 99999) return;
    setAsk({ n, name: nameOf(n), known: !teams.length || teams.some((t) => t.n === n) });
  };
  const confirm = () => {
    try { localStorage.setItem('krc-team', String(ask!.n)); } catch {}
    go(ask!.n);
  };

  if (ask) return (
    <div className="ask" role="alertdialog" aria-labelledby="askq">
      <p id="askq"><b className="no">{ask.n}</b>{ask.name && <b> {ask.name}</b>} 팀으로 등록하시겠습니까?</p>
      {!ask.known && <p className="warn">이 대회 참가 팀 목록에 없는 번호예요. 번호를 다시 확인해 주세요.</p>}
      <div className="row"><button className="btn" type="button" onClick={() => setAsk(null)}>취소</button><button className="btn pri" type="button" onClick={confirm} autoFocus>확인</button></div>
    </div>
  );
  if (!edit) return (
    <div className="ask">
      <p><b className="no">{saved}</b>{nameOf(saved) && <b> {nameOf(saved)}</b>} 팀으로 설정돼 있어요.</p>
      <div className="row"><button className="btn" type="button" onClick={() => setEdit(true)}>팀 바꾸기</button><button className="btn pri" type="button" onClick={() => go(saved)}>계속</button></div>
    </div>
  );
  return (
    <form className="start-form" onSubmit={submit}>
      <label htmlFor="team">팀 번호</label>
      <input id="team" name="team" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="예: 12345" maxLength={5} required autoFocus />
      <button className="btn pri" type="submit">다음</button>
    </form>
  );
}
