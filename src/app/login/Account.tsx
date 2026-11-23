'use client';
import { useState } from 'react';
import { post, PwField, PwInput, ok } from './LoginForm';

type Me = { name: string; school: string; team: string; role: string; intro: string; admin: boolean };

// 내 계정: 정보 수정 · 비밀번호 변경 · 로그아웃 · 탈퇴
export function Account({ me }: { me: Me }) {
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [pw, setPw] = useState(''), [pw2, setPw2] = useState('');
  const say = (k: string, v: string) => setMsg((m) => ({ ...m, [k]: v }));
  const run = (k: string, fn: (f: FormData) => Promise<string | void>) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); say(k, '');
    try { const r = await fn(new FormData(e.currentTarget)); if (r) say(k, r); } catch (x) { say(k, '⚠ ' + (x as Error).message); }
  };

  return (
    <div className="acct">
      <div className="done">
        {me.admin && <a className="btn pri" href="/admin/members">가입 신청 관리 →</a>}
        <button className="btn" type="button" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.reload(); }}>로그아웃</button>
      </div>

      <details open>
        <summary>내 정보</summary>
        <form className="f" onSubmit={run('p', async (f) => { await post('/api/auth/profile', Object.fromEntries(f)); return '저장했어요'; })}>
          <label className="full"><span>이름 <i>*</i></span><input name="name" defaultValue={me.name} required maxLength={40} /></label>
          <label><span>학교 <i>*</i></span><input name="school" defaultValue={me.school} required maxLength={80} /></label>
          <label><span>소속 팀 이름 <i>*</i></span><input name="team" defaultValue={me.team} required maxLength={80} /></label>
          <label>역할<input name="role" defaultValue={me.role} maxLength={60} /></label>
          <label>간단 소개<input name="intro" defaultValue={me.intro} maxLength={300} /></label>
          {msg.p && <p className="full msg" role="status">{msg.p}</p>}
          <button className="btn full">정보 저장</button>
        </form>
      </details>

      <details>
        <summary>비밀번호 변경</summary>
        <form className="f" onSubmit={run('w', async (f) => {
          if (pw !== pw2) throw new Error('새 비밀번호 확인이 달라요');
          await post('/api/auth/password', { cur: f.get('cur'), next: pw });
          setPw(''); setPw2(''); (document.getElementById('cur') as HTMLInputElement).value = '';
          return '바꿨어요. 다른 기기에서는 로그아웃됐어요';
        })}>
          <label className="full">현재 비밀번호<PwInput id="cur" name="cur" autoComplete="current-password" required /></label>
          <PwField pw={pw} setPw={setPw} pw2={pw2} setPw2={setPw2} label="새 비밀번호" />
          {msg.w && <p className="full msg" role="status">{msg.w}</p>}
          <button className="btn full" disabled={!ok(pw) || pw !== pw2}>비밀번호 바꾸기</button>
        </form>
      </details>

      <details>
        <summary>회원 탈퇴</summary>
        <form className="f" onSubmit={run('d', async (f) => {
          if (!confirm('탈퇴하면 회원 정보가 바로 지워지고 되돌릴 수 없어요. 탈퇴할까요?')) return;
          await post('/api/auth/delete', { pw: f.get('pw') });
          location.assign('/');
        })}>
          <p className="full dim">탈퇴하면 이름·학교·팀·이메일 등 가입 정보가 바로 지워져요. 다시 쓰려면 새로 가입하고 승인받아야 해요.</p>
          <label className="full">비밀번호 확인<PwInput name="pw" autoComplete="current-password" required /></label>
          {msg.d && <p className="full msg" role="status">{msg.d}</p>}
          <button className="btn full danger">탈퇴하기</button>
        </form>
      </details>
    </div>
  );
}
