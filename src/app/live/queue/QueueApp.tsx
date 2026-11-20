'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// 심판용 입장 체크. 팀을 누르면 도착/취소, 안 온 팀은 「찾는 중」에 모이고 직접 호출할 수 있다.
// ?replay=2026-01-31T11:15 이면 지난 대회를 그 시각부터 재생(리허설).

type Team = { n: number; name: string; arrived: string | null; firstCall: string | null };
type QM = { key: string; label: string; state: 'wait' | 'live' | 'done'; start: string | null; actual: string | null; red: Team[]; blue: Team[]; calls: Record<string, { at: string; teams: number[] }> };
type View = { event: { name: string } | null; now: string; divisions: { div: string; matches: QM[] }[] };
type Ask = { title: string; teams: number[]; match: QM };

const KST = (ms: number) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 19);
const hm = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }) : '');
const hmLocal = (s: string | null) => (s ? s.slice(11, 16) : '');   // 공식 데이터 시각(한국 시각 문자열)
const divLabel = (v: string) => (v ? (v === '결승' ? '결승' : `${v} 디비전`) : '경기');

export function QueueApp() {
  const [view, setView] = useState<View | null>(null);
  const [need, setNeed] = useState(false);   // PIN 필요
  const [err, setErr] = useState('');
  const [div, setDiv] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);
  const replay = useRef<{ base: number; loaded: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const atQs = () => (replay.current ? `?at=${KST(replay.current.base + Date.now() - replay.current.loaded)}` : '');
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/queue${atQs()}`, { cache: 'no-store' });
      if (r.status === 401) return setNeed(true);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setView(d); setErr(''); setNeed(false);
    } catch (e) { setErr((e as Error).message); }
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search).get('replay');
    if (p) replay.current = { base: Date.parse(p.slice(0, 19).padEnd(19, ':00') + '+09:00'), loaded: Date.now() };
    load();
    // 이 화면이 자동 호출도 돌리므로, 다른 탭으로 가 있어도 계속 부른다 (브라우저가 느리게 할 수는 있음)
    const id = setInterval(load, 10e3);
    // 화면이 꺼지면 멈추니 켜진 채로 둔다 (Wake Lock, 지원하는 브라우저만). 다시 화면에 돌아오면 다시 요청
    let lock: any = null;
    const keepAwake = () => { if (document.visibilityState === 'visible') (navigator as any).wakeLock?.request('screen').then((l: any) => (lock = l)).catch(() => {}); };
    const onVis = () => { keepAwake(); if (document.visibilityState === 'visible') load(); };
    keepAwake();
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch(() => {}); };
  }, [load]);

  const say = (msg: string, undo?: () => void) => { clearTimeout(toastTimer.current); setToast({ msg, undo }); toastTimer.current = setTimeout(() => setToast(null), 4000); };
  const post = (body: object) => fetch(`/api/queue${atQs()}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then((r) => r.json()).then((d) => { if (d.error) throw new Error(d.error); return d; });

  // 화면을 먼저 바꾸고 서버에 저장 (실패하면 다시 불러와 되돌린다)
  function setArrived(m: QM, ns: number[], on: boolean) {
    setView((v) => v && { ...v, divisions: v.divisions.map((d) => ({ ...d, matches: d.matches.map((x) => x.key !== m.key ? x : {
      ...x, red: x.red.map((t) => (ns.includes(t.n) ? { ...t, arrived: on ? new Date().toISOString() : null } : t)), blue: x.blue.map((t) => (ns.includes(t.n) ? { ...t, arrived: on ? new Date().toISOString() : null } : t)) }) })) });
    Promise.all(ns.map((team) => post({ action: 'arrive', match: m.key, team, on }))).catch((e) => { say(`저장 실패: ${e.message}`); load(); });
  }
  function tap(m: QM, t: Team) {
    const on = !t.arrived;
    setArrived(m, [t.n], on);
    say(`${t.n} ${t.name} ${on ? '도착' : '도착 취소'}`, () => setArrived(m, [t.n], !on));
  }
  async function sendCall(a: Ask) {
    setAsk(null);
    try { const d = await post({ action: 'call', match: a.match.key, teams: a.teams }); say(`${d.teams.length}팀에 호출을 보냈어요 · 휴대폰 ${d.phones}대`); load(); }
    catch (e) { say(`호출 실패: ${(e as Error).message}`); }
  }

  if (need) return <PinForm onOk={load} />;
  if (!view) return <div className="in"><p className="note err">{err || '불러오는 중…'}</p></div>;

  const now = Date.parse(view.now);
  const divs = view.divisions.filter((d) => d.matches.length);
  const cur = divs.find((d) => d.div === div) ?? divs[0];
  const mins = (iso: string) => Math.max(0, Math.round((now - Date.parse(iso)) / 60e3));
  const teams = (m: QM) => [...m.red, ...m.blue];
  const missing = (m: QM) => teams(m).filter((t) => !t.arrived);
  // 찾는 중: 호출했는데 아직 안 온 팀 (오래 기다린 순)
  const finding = (cur?.matches ?? []).filter((m) => m.state === 'wait')
    .flatMap((m) => teams(m).filter((t) => !t.arrived && t.firstCall).map((t) => ({ m, t, red: m.red.includes(t) })))
    .sort((a, b) => Date.parse(a.t.firstCall!) - Date.parse(b.t.firstCall!));
  const firstWait = cur?.matches.find((m) => m.state === 'wait');
  const where = !cur?.div ? '' : cur.div === '결승' ? '결승 ' : `${cur.div} 디비전 `;   // 알림 문구 미리보기 (src/lib/calls.ts enterText와 같은 규칙)

  const btn = (m: QM, t: Team) => {
    const cls = t.arrived ? 'ok' : t.firstCall ? 'miss' : '';
    const s = t.arrived ? `✓ 도착 ${hm(t.arrived)}` : t.firstCall ? `아직 안 옴 · ${mins(t.firstCall)}분째` : '호출 전';
    return <button type="button" key={t.n} id={`t${t.n}-${m.key}`} className={`tb ${cls}`} onClick={() => tap(m, t)}><span className="n">{t.n}</span><span className="nm">{t.name}</span><span className="s">{s}</span></button>;
  };

  return (
    <>
      <header className="qbar"><div className="in">
        <h1>입장 체크</h1>
        <span className="ev">{view.event?.name}{cur && divs.length > 1 ? ` · ${divLabel(cur.div)}` : ''}</span>
        <span className="lock">심판{replay.current ? ' · 리허설' : ''}</span>
        <span className="clock">{hm(view.now)}</span>
      </div></header>
      <div className="in">
        {divs.length > 1 && <div className="tools"><div className="divs" role="group" aria-label="구분">
          {divs.map((d) => <button type="button" key={d.div} aria-pressed={d === cur} onClick={() => setDiv(d.div)}>{divLabel(d.div)}</button>)}
        </div></div>}
        {err && <p className="note err">연결이 끊겨 마지막 화면을 보여 주고 있어요. {err}</p>}

        <section className={`find-list${finding.length ? '' : ' clear'}`}>
          {finding.length ? <>
            <h2>찾는 중 {finding.length}팀 <small>호출했는데 아직 안 온 팀</small></h2>
            {finding.map(({ m, t, red }) => (
              <div className="fr" key={`${m.key}-${t.n}`}>
                <a href={`#t${t.n}-${m.key}`}>{t.n}</a>
                <span className="w"><b>{t.name}</b> {m.label} · <span className={red ? 'dr' : 'db'}>{red ? '레드' : '블루'}</span> · {mins(t.firstCall!)}분째</span>
                <button type="button" onClick={() => setAsk({ title: `${t.n} ${t.name} 다시 호출`, teams: [t.n], match: m })}>🔔 다시 호출</button>
              </div>
            ))}
          </> : '✓ 호출한 팀이 모두 도착했어요'}
        </section>

        <div className="list">
          {!cur?.matches.length && <p className="dim">남은 경기가 없어요.</p>}
          {cur?.matches.map((m) => {
            if (m.state === 'live') return (
              <section className="m now" key={m.key}><div className="mh"><b>{m.label}</b><span className="st live">진행 중</span><span className="t">{hmLocal(m.actual)} 시작</span></div>
                <span className="nowteams">{m.red.map((t) => t.n).join(' · ')} vs {m.blue.map((t) => t.n).join(' · ')}</span></section>);
            const miss = missing(m), next = m === firstWait;
            return (
              <section className={`m${next ? ' next' : ''}`} key={m.key}>
                <div className="mh"><b>{m.label}</b>{next && <span className="st go">다음 경기</span>}<span className="t">{m.start ? `예정 ${hmLocal(m.start)}` : ''}</span>
                  {miss.length > 0 && <button type="button" className="all" onClick={() => { setArrived(m, miss.map((t) => t.n), true); say(`${m.label} 모두 도착`, () => setArrived(m, miss.map((t) => t.n), false)); }}>{miss.length === 4 ? '4팀 모두 도착' : `나머지 ${miss.length}팀 도착`}</button>}
                </div>
                <div className="al">
                  <div className="side r"><h3>레드 동맹</h3><div className="ts">{m.red.map((t) => btn(m, t))}</div></div>
                  <div className="side b"><h3>블루 동맹</h3><div className="ts">{m.blue.map((t) => btn(m, t))}</div></div>
                </div>
                <div className="foot">
                  <div className="calls">{Object.entries(m.calls).map(([g, c]) => <span key={g} className={g.startsWith('수동') ? 'man' : ''}>{g.startsWith('수동') ? `수동 ${hm(c.at)}` : `${g} ${hm(c.at)}`} · {c.teams.join(', ')}</span>)}</div>
                  {miss.length > 0 && <button type="button" className="call" onClick={() => setAsk({ title: `${m.label} · 미도착 ${miss.length}팀 호출`, teams: miss.map((t) => t.n), match: m })}>🔔 미도착 {miss.length}팀 호출</button>}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {toast && <div className="toast" role="status"><span>{toast.msg}</span>{toast.undo && <button type="button" onClick={() => { toast.undo!(); setToast(null); }}>되돌리기</button>}</div>}
      {ask && (
        <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><div className="box">
          <h2 id="dlg-t">{ask.title}</h2>
          <p>{ask.teams.join(', ')} 팀원 휴대폰에 바로 알림이 가요.</p>
          <div className="msg"><b>🔔 [{ask.match.label}] 지금 바로 와 주세요!</b>
            {[true, false].filter((red) => ask.teams.some((n) => ask.match.red.some((t) => t.n === n) === red)).map((red) => (
              <div key={String(red)}>지금 {where}{red ? '레드' : '블루'} 동맹으로 입장해주세요.</div>
            ))}</div>
          <div className="row"><button type="button" className="btn" onClick={() => setAsk(null)}>취소</button><button type="button" className="btn pri" onClick={() => sendCall(ask)}>호출 보내기</button></div>
        </div></div>
      )}
    </>
  );
}

function PinForm({ onOk }: { onOk: () => void }) {
  const [pin, setPin] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const r = await fetch('/api/queue/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    setBusy(false);
    if (r.ok) onOk(); else { setErr('PIN이 맞지 않아요'); setPin(''); }
  }
  return (
    <form className="pin" onSubmit={submit}>
      <h1>입장 체크</h1>
      <p className="dim">심판용 화면이에요. 운영진에게 받은 PIN을 넣어 주세요.</p>
      <label htmlFor="pin" className="label">PIN</label>
      <input id="pin" type="password" inputMode="numeric" autoComplete="one-time-code" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
      {err && <p className="note" style={{ margin: 0 }}>{err}</p>}
      <button className="btn pri" disabled={busy || !pin}>들어가기</button>
    </form>
  );
}
