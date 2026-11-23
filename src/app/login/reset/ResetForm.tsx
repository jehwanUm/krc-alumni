'use client';
import { useState } from 'react';
import { post, PwField, ok } from '../LoginForm';

export function ResetForm({ t }: { t: string }) {
  const [pw, setPw] = useState(''), [pw2, setPw2] = useState('');
  const [err, setErr] = useState(''), [done, setDone] = useState(false), [busy, setBusy] = useState(false);
  if (done) return <div className="sent" role="status"><h2>비밀번호를 바꿨어요</h2><p>새 비밀번호로 로그인해 주세요.</p><a className="btn pri" href="/login">로그인하기</a></div>;
  return (
    <form className="f auth" onSubmit={async (e) => {
      e.preventDefault(); setErr(''); setBusy(true);
      try { await post('/api/auth/reset', { t, pw }); setDone(true); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
    }}>
      <PwField pw={pw} setPw={setPw} pw2={pw2} setPw2={setPw2} label="새 비밀번호" />
      {err && <p className="err full" role="alert">{err}</p>}
      <button className="btn pri full" disabled={busy || !ok(pw) || pw !== pw2}>{busy ? '바꾸는 중…' : '비밀번호 바꾸기'}</button>
    </form>
  );
}
