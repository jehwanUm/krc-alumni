'use client';
import { useState } from 'react';

// 회원 한 명에 대한 운영진 버튼: 승인·거절·대기, 관리자 지정·해제, 재설정 링크, 삭제
export function Decide({ id, status, admin, self }: { id: string; status: string; admin: boolean; self: boolean }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const act = async (body: Record<string, unknown>, ask?: string) => {
    if (ask && !confirm(ask)) return;
    setBusy(true);
    const r = await fetch('/api/admin/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return alert(j.error || '처리하지 못했어요');
    if (j.link) { setLink(j.link); try { await navigator.clipboard.writeText(j.link); } catch {} return; }
    if (body.action === 'status' && body.status !== 'pending' && !j.mailed) alert('처리했어요. 알림 메일은 보내지 않았어요 — 본인에게 직접 알려 주세요');
    location.reload();
  };
  return (
    <>
      <div className="row">
        {!self && status !== 'approved' && <button className="btn pri" disabled={busy} onClick={() => act({ action: 'status', status: 'approved' })}>승인</button>}
        {!self && status !== 'rejected' && <button className="btn" disabled={busy} onClick={() => act({ action: 'status', status: 'rejected' }, '이 신청을 거절할까요?')}>거절</button>}
        {!self && status !== 'pending' && <button className="btn" disabled={busy} onClick={() => act({ action: 'status', status: 'pending' })}>대기로 되돌리기</button>}
        {!self && status === 'approved' && <button className="btn" disabled={busy} onClick={() => act({ action: 'admin', on: !admin }, admin ? '관리자 권한을 회수할까요?' : '관리자로 지정할까요? 가입 승인과 회원 삭제를 할 수 있게 돼요')}>{admin ? '관리자 해제' : '관리자 지정'}</button>}
        <button className="btn" disabled={busy} onClick={() => act({ action: 'reset' })}>비밀번호 재설정 링크</button>
        {!self && <button className="btn danger" disabled={busy} onClick={() => act({ action: 'delete' }, '이 회원 정보를 지울까요? 되돌릴 수 없어요')}>삭제</button>}
      </div>
      {link && <p className="link">30분 동안 한 번 쓸 수 있는 링크예요 (복사됨). 본인에게만 보내 주세요.<br /><code>{link}</code></p>}
    </>
  );
}
