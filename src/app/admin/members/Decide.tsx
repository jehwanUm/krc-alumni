'use client';
import { useState } from 'react';

export function Decide({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const set = async (s: string) => {
    setBusy(true);
    const r = await fetch('/api/admin/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: s }) });
    if (!r.ok) { alert((await r.json().catch(() => ({}))).error || '처리하지 못했어요'); setBusy(false); return; }
    location.reload();
  };
  return (
    <div className="row">
      {status !== 'approved' && <button className="btn pri" disabled={busy} onClick={() => set('approved')}>승인</button>}
      {status !== 'rejected' && <button className="btn" disabled={busy} onClick={() => { if (confirm('이 신청을 거절할까요?')) set('rejected'); }}>거절</button>}
      {status !== 'pending' && <button className="btn" disabled={busy} onClick={() => set('pending')}>대기로 되돌리기</button>}
    </div>
  );
}
