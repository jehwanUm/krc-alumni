'use client';
import { useState } from 'react';

type Init = { school: string; region: string; intro: string; robot_name: string; logo: string; robot: string; hasLogo: boolean; instagram: string; youtube: string; web: string; email: string; sponsors: string[]; sponsorsPending: boolean; sns_ok: boolean };
type Mate = { id: string; name: string; school: string; role: string; verify: string; status: string; leader: boolean; me: boolean; admin: boolean };
const LINKS = [['instagram', '인스타그램', 'https://instagram.com/…'], ['youtube', '유튜브', 'https://youtube.com/@…'], ['web', '홈페이지', 'https://…'], ['email', '공개 연락 이메일', 'team@example.com']] as const;

// 팀 설정: 왼쪽 입력, 오른쪽 팀 페이지 머리글 미리보기. 아래 팀원 관리
export function TeamSettings({ n, name, init, roster }: { n: number; name: string; init: Init; roster: Mate[] }) {
  const [v, setV] = useState(init);
  const [logoFile, setLogoFile] = useState<File | null>(null), [robotFile, setRobotFile] = useState<File | null>(null);
  const [sp, setSp] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const [photoOk, setPhotoOk] = useState(false);   // [필수 확인] 사진 속 사람 동의 (새 사진을 올릴 때)
  const newPhoto = !!(logoFile || robotFile);
  const set = (k: keyof Init) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const pick = (k: 'logo' | 'robot', setF: (f: File) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setF(f); setV((x) => ({ ...x, [k]: URL.createObjectURL(f) }));
  };
  const org = [v.school, v.region].filter(Boolean).join(' · ');

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(''); setBusy(true);
    const f = new FormData();
    for (const k of ['school', 'region', 'intro', 'robot_name', 'instagram', 'youtube', 'web', 'email'] as const) f.set(k, v[k]);
    f.set('sponsors', v.sponsors.join('\n'));
    if (v.sns_ok) f.set('sns_ok', '1');
    if (newPhoto && !photoOk) { setBusy(false); return setMsg('⚠ 사진을 올리려면 [필수 확인]에 체크해 주세요'); }
    if (newPhoto) f.set('photo_ok', '1');
    if (logoFile) f.set('logo', logoFile);
    if (robotFile) f.set('robot', robotFile);
    if (!v.robot) f.set('robot_clear', '1');
    const r = await fetch(`/api/teams/${n}/profile`, { method: 'POST', body: f });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg('⚠ ' + (j.error || '저장하지 못했어요'));
    setLogoFile(null); setRobotFile(null);
    setMsg(j.sponsorsPending ? '저장했어요. 바뀐 후원사는 운영진이 확인한 뒤 공개돼요' : '저장했어요. 팀 페이지에 바로 반영돼요');
  };

  return (
    <>
      <div className="tset">
        <form className="f" onSubmit={save}>
          <fieldset className="full"><legend>§01 기본 정보</legend><div className="grid">
            <label className="full">팀 이름 <small>FTC 공식 등록 이름이라 여기서 못 바꿔요</small><input value={`${n} ${name}`} disabled /></label>
            <label>학교 · 소속<input value={v.school} onChange={set('school')} placeholder="예: 대영중학교" maxLength={80} /></label>
            <label>지역<input value={v.region} onChange={set('region')} placeholder="예: 경북 영주" maxLength={40} /></label>
          </div></fieldset>

          <fieldset className="full"><legend>§02 팀 로고</legend><div className="grid">
            <div className="full up">
              <img className="logo-pv" src={v.logo} width="88" height="88" alt="" />
              <label className="btn">로고 올리기<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick('logo', setLogoFile)} hidden /></label>
              <small>정사각형 PNG·JPG·WEBP, 1MB 이하.</small>
            </div>
          </div></fieldset>

          <fieldset className="full"><legend>§03 팀 소개 · 로봇</legend><div className="grid">
            <label className="full">팀 소개 <small>{v.intro.length}/500</small><textarea value={v.intro} onChange={(e) => setV({ ...v, intro: e.target.value.slice(0, 500) })} rows={5} placeholder="우리 팀은 어떤 팀인가요? 언제 만들어졌고, 무엇을 잘하고, 이번 시즌 목표는 뭔가요?" /></label>
            <label>올해 로봇 이름<input value={v.robot_name} onChange={set('robot_name')} placeholder="예: 버즈비 3호" maxLength={40} /></label>
            <div className="up">
              {v.robot ? <img className="robot-pv" src={v.robot} alt="" /> : <div className="robot-pv ph">로봇 사진</div>}
              <label className="btn">사진 올리기<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick('robot', setRobotFile)} hidden /></label>
              {v.robot && <button type="button" className="btn" onClick={() => { setRobotFile(null); setV({ ...v, robot: '' }); }}>사진 빼기</button>}
            </div>
            <small className="full">3MB 이하. 사진에 학생 얼굴이 크게 나오면 팀원 동의를 받고 올려 주세요.</small>
            {newPhoto && <label className="full agree"><input type="checkbox" checked={photoOk} onChange={(e) => setPhotoOk(e.target.checked)} /><span><b>[필수 확인]</b> 사진에 얼굴이 나온 사람(미성년자라면 본인)에게 홈페이지 공개 동의를 받았어요.</span></label>}
            <label className="full agree"><input type="checkbox" checked={v.sns_ok} onChange={(e) => setV({ ...v, sns_ok: e.target.checked })} /><span><b>[선택]</b> KRC 동문회 공식 SNS에 팀 소개와 함께 이 사진이 올라가는 것에도 동의해요. <small>사진에 나온 팀원 모두의 동의를 받았을 때만 켜 주세요. 끄면 SNS에 쓰지 않아요.</small></span></label>
          </div></fieldset>

          <fieldset className="full"><legend>§04 SNS · 연락</legend><div className="grid">
            {LINKS.map(([k, l, ph]) => <label key={k}>{l}<input value={v[k]} onChange={set(k)} placeholder={ph} type={k === 'email' ? 'email' : 'url'} /></label>)}
            <small className="full">공개 연락 이메일은 팀 페이지에 그대로 보여요. 개인 이메일 대신 팀 계정을 권해요.</small>
          </div></fieldset>

          <fieldset className="full"><legend>§05 후원사</legend><div className="grid">
            <div className="full chips">{v.sponsors.length ? v.sponsors.map((s) => <span key={s} className="chip">{s}<button type="button" aria-label={`${s} 빼기`} onClick={() => setV({ ...v, sponsors: v.sponsors.filter((x) => x !== s) })}>×</button></span>) : <span className="dim">등록된 후원사가 없어요.</span>}</div>
            <label className="full">후원사 추가<span className="addrow"><input value={sp} onChange={(e) => setSp(e.target.value)} placeholder="예: 노벨리스 코리아" maxLength={60} /><button type="button" className="btn" onClick={() => { const x = sp.trim(); if (x && !v.sponsors.includes(x)) setV({ ...v, sponsors: [...v.sponsors, x] }); setSp(''); }}>추가</button></span></label>
            <small className="full">{v.sponsorsPending ? '⏳ 바꾼 후원사를 운영진이 확인하고 있어요. ' : ''}새 후원사는 운영진이 확인한 뒤 팀 페이지와 후원 기업 페이지에 나와요.</small>
          </div></fieldset>

          <p className="full">오토 경로 저장과 공개 범위는 <a href="/auto">오토 페이지</a>에서 정해요.</p>
          {msg && <p className="full msg" role="status">{msg}</p>}
          <button className="btn pri full" disabled={busy}>{busy ? '저장하는 중…' : '저장'}</button>
        </form>

        <aside className="pv" aria-label="팀 페이지 미리보기">
          <span className="label">팀 페이지에서 이렇게 보여요</span>
          <div className="pv-head">
            <img src={v.logo} width="64" height="64" alt="" />
            <div><b>{n} {name}</b>{org && <span>{org}</span>}{v.sponsors.length > 0 && <span className="by">Supported by {v.sponsors.join(' · ')}</span>}</div>
          </div>
          {v.robot && <img className="pv-robot" src={v.robot} alt="" />}
          {v.robot_name && <p className="pv-rn">{v.robot_name}</p>}
          <p className={v.intro ? '' : 'dim'}>{v.intro || '팀 소개가 여기에 나와요.'}</p>
        </aside>
      </div>
      <Roster n={n} roster={roster} />
    </>
  );
}

// 팀원 관리: 우리 팀으로 가입 신청한 사람 승인·거절, 팀원 내보내기, 팀장 지정·해제
function Roster({ n, roster }: { n: number; roster: Mate[] }) {
  const [busy, setBusy] = useState(false);
  const act = async (id: string, body: Record<string, unknown>, ask?: string) => {
    if (ask && !confirm(ask)) return;
    setBusy(true);
    const r = await fetch(`/api/teams/${n}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) });
    setBusy(false);
    if (!r.ok) return alert((await r.json().catch(() => ({}))).error || '처리하지 못했어요');
    location.reload();
  };
  const pend = roster.filter((m) => m.status === 'pending'), mates = roster.filter((m) => m.status === 'approved');
  return (
    <section className="roster">
      <h2>팀원 관리</h2>
      <p className="dim">가입할 때 팀 번호를 {n}으로 적은 사람이 여기 보여요. 가입 승인은 운영진이 해요. 우리 팀원이 아닌 사람이 있으면 운영진에게 알려 주세요.</p>
      {pend.length > 0 && <><h3>운영진 승인 대기 {pend.length}</h3>{pend.map((m) => (
        <div className="mate pending" key={m.id}>
          <div><b>{m.name}</b> <span className="dim">{m.school}{m.role && ` · ${m.role}`}</span><br /><small>{m.verify}</small></div>
          <div className="row"><button className="btn danger" disabled={busy} onClick={() => act(m.id, { action: 'remove' }, `${m.name}님은 우리 팀이 아닌가요? 팀 연결을 풀어요 (가입 신청은 운영진에게 남아요)`)}>우리 팀 아님</button></div>
        </div>
      ))}</>}
      <h3>팀원 {mates.length}</h3>
      {mates.map((m) => (
        <div className="mate" key={m.id}>
          <div><b>{m.name}</b> {m.leader && <span className="chip blue">팀장</span>}{m.me && <span className="chip">나</span>} <span className="dim">{m.school}{m.role && ` · ${m.role}`}</span></div>
          {!m.me && !m.admin && <div className="row">
            <button className="btn" disabled={busy} onClick={() => act(m.id, { action: 'leader', on: !m.leader }, m.leader ? `${m.name}님의 팀장 권한을 뺄까요?` : `${m.name}님도 팀장으로 지정할까요? 팀 설정과 팀원 관리를 할 수 있게 돼요`)}>{m.leader ? '팀장 해제' : '팀장 지정'}</button>
            <button className="btn danger" disabled={busy} onClick={() => act(m.id, { action: 'remove' }, `${m.name}님을 팀에서 내보낼까요? 계정은 남고 팀 연결만 풀려요`)}>내보내기</button>
          </div>}
        </div>
      ))}
    </section>
  );
}
