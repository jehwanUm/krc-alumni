'use client';
import { useState } from 'react';

// 운영진: 회원의 팀 번호·팀장 지정
export function TeamAssign({ id, teamNo, leader, hint }: { id: string; teamNo: number | null; leader: boolean; hint: number[] }) {
  const [no, setNo] = useState(teamNo ? String(teamNo) : ''), [ld, setLd] = useState(leader), [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const r = await fetch('/api/admin/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'team', team_no: no, leader: ld }) });
    setBusy(false);
    if (!r.ok) return alert((await r.json().catch(() => ({}))).error || '저장하지 못했어요');
    location.reload();
  };
  return (
    <div className="assign">
      <label>팀 번호 <input value={no} onChange={(e) => setNo(e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" placeholder="없음" /></label>
      {hint.filter((h) => String(h) !== no).slice(0, 4).map((h) => <button key={h} type="button" className="chip" onClick={() => setNo(String(h))}>{h}</button>)}
      <label className="ck"><input type="checkbox" checked={ld} onChange={(e) => setLd(e.target.checked)} disabled={!no} /> 팀장</label>
      <button className="btn" disabled={busy || (no === String(teamNo ?? '') && ld === leader)} onClick={save}>팀 저장</button>
    </div>
  );
}
