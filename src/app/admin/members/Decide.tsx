'use client';
import { useState } from 'react';

// 회원 한 명에 대한 운영진 버튼: 승인·거절·대기, 관리자 지정·해제, 재설정 링크, 삭제
// 알림은 자동 메일 대신 운영진 메일 앱에 내용을 채워서 연다 (보내는 사람: 운영진 메일 계정)
type Who = { name: string; email: string };
const mailto = (to: string, subject: string, body: string) => `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const SIGN = '\n\nKRC 동문회 운영진 드림';
export const MAILS = {
  approved: (w: Who, site: string) => mailto(w.email, '[KRC 동문회] 가입이 승인됐어요', `${w.name}님, 안녕하세요.\n\nKRC 동문회 홈페이지 가입이 승인됐어요. 이제 가입한 이메일과 비밀번호로 로그인할 수 있어요.\n\n로그인: ${site}/login${SIGN}`),
  rejected: (w: Who, _site: string) => mailto(w.email, '[KRC 동문회] 가입 신청 결과 안내', `${w.name}님, 안녕하세요.\n\n보내 주신 정보로는 KRC 참가 사실을 확인하지 못해서 가입을 승인하지 못했어요.\n참가한 시즌과 팀을 보여 줄 자료(대회 사진, 상장, 참가 확인서 등)가 있으면 이 메일에 답장으로 보내 주세요. 확인되면 바로 승인할게요.${SIGN}`),
  evidence: (w: Who, _site: string) => mailto(w.email, '[KRC 동문회] 참가 확인 자료를 보내 주세요', `${w.name}님, 안녕하세요. KRC 동문회 가입 신청 고마워요.\n\n승인 전에 KRC에 참가한 사실을 확인하고 있어요. 참가한 시즌과 팀을 보여 줄 자료(대회 사진, 상장, 참가 확인서, 팀 명단 등) 하나를 이 메일에 답장으로 보내 주세요.\n확인이 끝나면 자료는 보관하지 않고 지워요.${SIGN}`),
  reset: (w: Who, link: string) => mailto(w.email, '[KRC 동문회] 비밀번호 재설정 링크', `${w.name}님, 안녕하세요.\n\n아래 링크에서 새 비밀번호를 정해 주세요. 30분 동안 한 번만 쓸 수 있어요.\n${link}\n\n요청하지 않았다면 이 메일은 무시해 주세요.${SIGN}`),
};

export function Decide({ id, status, admin, self, who }: { id: string; status: string; admin: boolean; self: boolean; who: Who }) {
  const [busy, setBusy] = useState(false);
  const [mail, setMail] = useState<{ href: string; note: string } | null>(null);
  const site = typeof location === 'undefined' ? '' : location.origin;
  const act = async (body: Record<string, unknown>, ask?: string) => {
    if (ask && !confirm(ask)) return;
    setBusy(true);
    const r = await fetch('/api/admin/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return alert(j.error || '처리하지 못했어요');
    if (j.link) return setMail({ href: MAILS.reset(who, j.link), note: '재설정 링크를 만들었어요 (30분, 한 번). 본인에게 보내 주세요.' });
    if (body.status === 'approved') return setMail({ href: MAILS.approved(who, site), note: '승인했어요. 본인에게 알려 주세요.' });
    if (body.status === 'rejected') return setMail({ href: MAILS.rejected(who, site), note: '거절했어요. 본인에게 알려 주세요.' });
    location.reload();
  };
  if (mail) return (
    <div className="mailbox" role="status">
      <p>{mail.note}</p>
      <div className="row">
        <a className="btn pri" href={mail.href}>메일 쓰기 ({who.email})</a>
        <button className="btn" onClick={() => location.reload()}>닫기</button>
      </div>
      <p className="dim small">메일 앱이 열리고 받는 사람·제목·내용이 채워져요. 운영진 메일(jh.um@fest.or.kr)로 보내 주세요.</p>
    </div>
  );
  return (
    <div className="row">
      {!self && status !== 'approved' && <button className="btn pri" disabled={busy} onClick={() => act({ action: 'status', status: 'approved' })}>승인</button>}
      {!self && status === 'pending' && <a className="btn" href={MAILS.evidence(who, site)}>증빙 요청 메일</a>}
      {!self && status !== 'rejected' && <button className="btn" disabled={busy} onClick={() => act({ action: 'status', status: 'rejected' }, '이 신청을 거절할까요?')}>거절</button>}
      {!self && status !== 'pending' && <button className="btn" disabled={busy} onClick={() => act({ action: 'status', status: 'pending' })}>대기로 되돌리기</button>}
      {!self && status === 'approved' && <button className="btn" disabled={busy} onClick={() => act({ action: 'admin', on: !admin }, admin ? '관리자 권한을 회수할까요?' : '관리자로 지정할까요? 가입 승인과 회원 삭제를 할 수 있게 돼요')}>{admin ? '관리자 해제' : '관리자 지정'}</button>}
      <button className="btn" disabled={busy} onClick={() => act({ action: 'reset' })}>비밀번호 재설정 링크</button>
      {!self && <button className="btn danger" disabled={busy} onClick={() => act({ action: 'delete' }, '이 회원 정보를 지울까요? 되돌릴 수 없어요')}>삭제</button>}
    </div>
  );
}
