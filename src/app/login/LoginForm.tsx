'use client';
import { useState } from 'react';

// 로그인 / 회원가입 탭 (KRC Tech와 같은 항목). 서버: /api/auth/login, /api/auth/signup
export const RULES: [string, (p: string) => boolean][] = [
  ['8자 이상', (p) => p.length >= 8], ['영문 소문자', (p) => /[a-z]/.test(p)], ['영문 대문자', (p) => /[A-Z]/.test(p)], ['특수기호', (p) => /[^A-Za-z0-9\s]/.test(p)],
];

// 비밀번호 칸 + 눈 버튼 (누르면 입력한 글자가 보임)
export function PwInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <span className="pwbox">
      <input {...props} type={show ? 'text' : 'password'} autoCapitalize="off" spellCheck={false} />
      <button type="button" className="eye" onClick={() => setShow((v) => !v)} aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'} aria-pressed={show}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{show && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </span>
  );
}

export const ok = (p: string) => RULES.every(([, f]) => f(p));

// 비밀번호 + 확인 (규칙 칩 표시)
export function PwField({ pw, setPw, pw2, setPw2, label = '비밀번호' }: { pw: string; setPw: (v: string) => void; pw2: string; setPw2: (v: string) => void; label?: string }) {
  return <>
    <label className="full"><span>{label} <i>*</i></span><PwInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8자 이상 (영문 대·소문자, 특수기호 포함)" autoComplete="new-password" required />
      <span className="rules">{RULES.map(([n, f]) => <span key={n} className={f(pw) ? 'on' : ''}>✓ {n}</span>)}</span></label>
    <label className="full"><span>{label} 확인 <i>*</i></span><PwInput value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="한 번 더 입력해 주세요" autoComplete="new-password" required />
      {pw2 && pw !== pw2 && <small className="bad">비밀번호가 달라요</small>}</label>
  </>;
}

export async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || '잠시 후 다시 시도해 주세요');
  return j;
}

export function LoginForm() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  const run = async (e: React.FormEvent<HTMLFormElement>, fn: (f: FormData) => Promise<void>) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await fn(new FormData(e.currentTarget)); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const login = (e: React.FormEvent<HTMLFormElement>) => run(e, async (f) => {
    await post('/api/auth/login', { email: f.get('email'), pw: f.get('pw') });
    location.reload();
  });
  const signup = (e: React.FormEvent<HTMLFormElement>) => run(e, async (f) => {
    if (pw !== pw2) throw new Error('비밀번호 확인이 달라요');
    await post('/api/auth/signup', { ...Object.fromEntries(f), pw, agree: f.get('agree') === 'on' });
    setSent(true);
  });

  if (sent) return (
    <div className="sent" role="status">
      <h2>가입 신청을 받았어요</h2>
      <p>운영진이 대회 팀 명단과 비교해 확인한 뒤 승인하면 로그인할 수 있어요.</p>
      <p className="dim">졸업생이라면 KRC에 참가했다는 걸 보여 줄 자료(대회 사진, 상장, 참가 확인서 등)를 이메일로 요청드릴 수 있어요.</p>
      <button className="btn" type="button" onClick={() => { setSent(false); setTab('login'); }}>로그인으로</button>
    </div>
  );

  return (
    <div className="auth">
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => { setTab('login'); setErr(''); }}>로그인</button>
        <button type="button" role="tab" aria-selected={tab === 'signup'} onClick={() => { setTab('signup'); setErr(''); }}>회원가입</button>
      </div>

      {tab === 'login' ? (
        <form onSubmit={login} className="f">
          <label className="full">이메일<input name="email" type="email" autoComplete="email" required /></label>
          <label className="full">비밀번호<PwInput name="pw" autoComplete="current-password" required /></label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn pri full" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button>
          <details className="full forgot"><summary>비밀번호를 잊었어요</summary><p>운영진에게 가입한 이메일을 알려 주세요(<a href="/alumni#discord">Discord</a>). 30분 동안 쓸 수 있는 재설정 링크를 보내 드려요.</p></details>
        </form>
      ) : (
        <form onSubmit={signup} className="f">
          <label className="full"><span>이름 <i>*</i></span><input name="name" placeholder="예: 박지훈" autoComplete="name" required maxLength={40} /></label>
          <label><span>학교 <i>*</i></span><input name="school" placeholder="예: 창의공학교육협회" required maxLength={80} /></label>
          <label><span>소속 팀 이름 <i>*</i></span><input name="team" placeholder="예: KRC 동문회" required maxLength={80} /></label>
          <label className="full">FTC 팀 번호<input name="team_no" inputMode="numeric" pattern="[0-9]*" maxLength={5} placeholder="예: 25316" />
            <small>지금 참가하는 팀이면 적어 주세요. 그 팀 팀장이 바로 승인할 수 있어요.</small></label>
          <label className="full"><span>팀 인증 신청 내용 <i>*</i></span><input name="verify" placeholder="예: 2026 시즌 구동계 파트 팀원 / 학번·기수 또는 팀장 확인 메모" required maxLength={500} />
            <small>졸업생은 참가한 시즌과 팀을 적어 주세요. 확인을 위해 증빙 자료를 요청할 수 있어요.</small></label>
          <label>역할<input name="role" placeholder="예: 하드웨어 제작" maxLength={60} /></label>
          <label>간단 소개<input name="intro" placeholder="담당 연구/개발 분야를 소개해 주세요" maxLength={300} /></label>
          <label className="full"><span>이메일 <i>*</i></span><input name="email" type="email" placeholder="engineer@krcalumni.com" autoComplete="email" required /></label>
          <PwField pw={pw} setPw={setPw} pw2={pw2} setPw2={setPw2} />
          <label className="full agree"><input type="checkbox" name="agree" required />
            <span>만 14세 이상이며, 개인정보 수집·이용에 동의해요 (<a href="/privacy" target="_blank">개인정보처리방침</a>). <small>수집: 이름·학교·팀·인증 내용·역할·소개·이메일 / 목적: 회원 확인과 동문회 안내 / 보관: 탈퇴 요청 시까지</small></span></label>
          {err && <p className="err full" role="alert">{err}</p>}
          <button className="btn pri full" disabled={busy || !ok(pw) || pw !== pw2}>{busy ? '보내는 중…' : '가입 신청'}</button>
        </form>
      )}
    </div>
  );
}

