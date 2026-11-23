'use client';
import { useEffect, useState } from 'react';

// 경로 에디터(같은 주소의 iframe)는 브라우저 저장소에 경로를 둔다. 여기서 그 값을 읽어 계정에 저장하고, 불러올 때 써 넣은 뒤 에디터를 다시 연다
const STORE = 'girigocha-editor-v2', OTHER = 'girigocha-editor-other';
const VIS = { private: '비공개', alliance: '동맹이 되면 공개', teams: '지정 팀만', public: '모두에게' } as const;
type Vis = keyof typeof VIS;
type Meta = { id: string; team: number; name: string; visibility: Vis; share_teams: number[]; updated_at: string; updated_by: string | null };

const reloadEditor = () => (document.getElementById('ed') as HTMLIFrameElement | null)?.contentWindow?.location.reload();
async function call(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || '잠시 후 다시 시도해 주세요');
  return j;
}
const kst = (iso: string) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ');
function current() { try { return JSON.parse(localStorage.getItem(STORE) ?? 'null'); } catch { return null; } }

// 남의 팀 경로를 Ghost로 (에디터의 「다른 로봇」 자리)
export async function loadGhost(id: string) {
  const { auto } = await call(`/api/autos/${id}`);
  localStorage.setItem(OTHER, JSON.stringify({ name: `${auto.team} ${auto.name}`, project: auto.project }));
  reloadEditor();
  document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
}

export function GhostBox() {
  const [team, setTeam] = useState(''), [list, setList] = useState<Meta[] | null>(null), [err, setErr] = useState('');
  const find = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setList(null);
    try { setList((await call(`/api/autos?team=${team}`)).autos); } catch (x) { setErr((x as Error).message); }
  };
  return (
    <aside className="ghost" aria-label="Ghost 불러오기">
      <h3>Ghost 불러오기</h3>
      <form className="gb" onSubmit={find}><b>팀 번호로 찾기</b>
        <span className="addrow"><input value={team} onChange={(e) => setTeam(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="예: 25316" inputMode="numeric" /><button className="btn sm" disabled={!team}>찾기</button></span>
        <span className="dim small">그 팀이 우리에게 공개한 경로가 나와요.</span></form>
      {err && <p className="note">{err}</p>}
      {list && (list.length ? <ul className="glist">{list.map((a) => <li key={a.id}><button type="button" className="linkbtn" onClick={() => loadGhost(a.id).catch((x) => alert(x.message))}>{a.name}</button><span className="dim small">{VIS[a.visibility]}</span></li>)}</ul> : <p className="dim small">볼 수 있는 경로가 없어요.</p>)}
      <div className="gb"><b>대회 동맹</b><span className="dim small">「동맹이 되면 공개」로 둔 경로는 대회 날 같은 동맹이 되면 팀 번호로 찾을 수 있어요.</span></div>
    </aside>
  );
}

export function PublicGhost({ id }: { id: string }) {
  return <button type="button" className="btn sm" onClick={() => loadGhost(id).catch((x) => alert(x.message))}>Ghost로 보기</button>;
}

// 우리 팀 경로: 지금 에디터 경로 저장, 목록에서 열기·덮어쓰기·공개 범위·지우기
export function AutoTeam() {
  const [st, setSt] = useState<{ login: boolean; team: number | null; autos: Meta[] } | null>(null);
  const [name, setName] = useState(''), [vis, setVis] = useState<Vis>('private'), [share, setShare] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const load = async () => {
    const r = await fetch('/api/autos');
    if (r.status === 401) return setSt({ login: false, team: null, autos: [] });
    const j = await r.json().catch(() => ({ team: null, autos: [] }));
    setSt({ login: true, team: j.team, autos: j.autos ?? [] });
  };
  useEffect(() => { load(); }, []);
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true); setMsg('');
    try { await fn(); if (done) setMsg(done); await load(); } catch (x) { setMsg('⚠ ' + (x as Error).message); } finally { setBusy(false); }
  };

  if (!st) return <p className="dim">불러오는 중…</p>;
  if (!st.login) return (
    <div className="lock">
      <div><b>로그인하면 경로를 우리 팀 계정에 저장하고 공유할 수 있어요</b><p className="dim small">경로마다 비공개 · 동맹이 되면 공개 · 지정 팀만 · 모두에게 중에서 골라요. 처음 값은 비공개예요.</p></div>
      <a className="btn pri" href="/login">로그인</a>
    </div>
  );
  if (!st.team) return <div className="lock"><div><b>팀이 연결되면 저장할 수 있어요</b><p className="dim small">가입할 때 팀 번호를 적었다면 팀장 승인을 기다려 주세요. 아니면 운영진에게 팀 연결을 요청해 주세요.</p></div></div>;

  return (
    <div className="mine">
      <form className="save" onSubmit={(e) => { e.preventDefault(); const project = current(); if (!project) return setMsg('⚠ 에디터에 저장할 경로가 없어요'); run(() => call('/api/autos', { method: 'POST', body: JSON.stringify({ name, project, visibility: vis, share_teams: share }) }), '저장했어요').then(() => setName('')); }}>
        <b>지금 에디터 경로를 {st.team} 팀에 저장</b>
        <span className="addrow">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="경로 이름 (예: 빨강 왼쪽 3샘플)" maxLength={60} required />
          <select value={vis} onChange={(e) => setVis(e.target.value as Vis)} aria-label="공개 범위">{Object.entries(VIS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <button className="btn pri" disabled={busy}>저장</button>
        </span>
        {vis === 'teams' && <input value={share} onChange={(e) => setShare(e.target.value)} placeholder="볼 수 있는 팀 번호 (쉼표로, 예: 24906, 25324)" />}
        {msg && <span className="small" role="status">{msg}</span>}
      </form>

      {st.autos.length === 0 ? <p className="dim">아직 저장한 경로가 없어요.</p> : (
        <ul className="alist">{st.autos.map((a) => (
          <li key={a.id}>
            <div><b>{a.name}</b><span className="dim small"> · {kst(a.updated_at)} · {a.updated_by}</span>
              {a.visibility === 'teams' && <span className="dim small"> · {a.share_teams.join(', ') || '지정 팀 없음'}</span>}</div>
            <div className="acts">
              <select value={a.visibility} disabled={busy} aria-label="공개 범위" onChange={(e) => {
                const v = e.target.value as Vis;
                const teams = v === 'teams' ? prompt('볼 수 있는 팀 번호를 쉼표로 적어 주세요', a.share_teams.join(', ')) : null;
                if (v === 'teams' && teams === null) return;
                run(() => call(`/api/autos/${a.id}`, { method: 'PATCH', body: JSON.stringify({ visibility: v, ...(teams !== null && { share_teams: teams }) }) }));
              }}>{Object.entries(VIS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <button className="btn sm" disabled={busy} onClick={() => run(async () => {
                if (!confirm(`「${a.name}」을 에디터로 열까요? 지금 에디터에 있는 경로는 바뀌어요`)) return;
                const { auto } = await call(`/api/autos/${a.id}`);
                localStorage.setItem(STORE, JSON.stringify(auto.project)); reloadEditor();
                document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
              })}>열기</button>
              <button className="btn sm" disabled={busy} onClick={() => { const project = current(); if (project && confirm(`지금 에디터 경로로 「${a.name}」을 덮어쓸까요?`)) run(() => call(`/api/autos/${a.id}`, { method: 'PATCH', body: JSON.stringify({ project }) }), '덮어썼어요'); }}>덮어쓰기</button>
              <button className="btn sm danger" disabled={busy} onClick={() => { if (confirm(`「${a.name}」을 지울까요?`)) run(() => call(`/api/autos/${a.id}`, { method: 'DELETE' })); }}>지우기</button>
            </div>
          </li>
        ))}</ul>
      )}
    </div>
  );
}
