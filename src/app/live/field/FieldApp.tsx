'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PinForm, WHY, KST, hm, hmLocal, divLabel, type QM, type Team, type View } from '../queue/QueueApp';

// 경기장 심판 화면 (보기만). 지금 경기와 다음 3경기의 4팀이 왔는지, 안 왔으면 왜인지 크게 보여 준다.
// 기록은 인스펙션 심판이 입장 체크(/live/queue)에서 한다. 같은 PIN. ?replay=… 리허설도 같다.
export function FieldApp() {
  const [view, setView] = useState<View | null>(null);
  const [need, setNeed] = useState(false);
  const [err, setErr] = useState('');
  const [div, setDiv] = useState<string | null>(null);
  const replay = useRef<{ base: number; loaded: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const at = replay.current ? `?at=${KST(replay.current.base + Date.now() - replay.current.loaded)}` : '';
      const r = await fetch(`/api/queue${at}`, { cache: 'no-store' });
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
    const id = setInterval(load, 10e3);
    let lock: any = null;
    const keepAwake = () => { if (document.visibilityState === 'visible') (navigator as any).wakeLock?.request('screen').then((l: any) => (lock = l)).catch(() => {}); };
    const onVis = () => { keepAwake(); if (document.visibilityState === 'visible') load(); };
    keepAwake();
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch(() => {}); };
  }, [load]);

  if (need) return <PinForm onOk={load} />;
  if (!view) return <div className="in"><p className="note err">{err || '불러오는 중…'}</p></div>;

  const now = Date.parse(view.now);
  const divs = view.divisions.filter((d) => d.matches.length);
  const cur = divs.find((d) => d.div === div) ?? divs[0];
  const live = cur?.matches.filter((m) => m.state === 'live') ?? [];
  const next = cur?.matches.filter((m) => m.state === 'wait').slice(0, 3) ?? [];
  const mins = (iso: string) => Math.max(0, Math.round((now - Date.parse(iso)) / 60e3));

  // 팀 한 칸: 도착 > 사유(대회 불참·경기 불참·기권) > 호출 중 > 호출 전
  const tile = (t: Team) => {
    const w = !t.arrived && t.status;
    const cls = t.arrived ? 'ok' : w ? w.s : t.firstCall ? 'call' : 'pre';
    const head = t.arrived ? '도착' : w ? WHY[w.s] : t.firstCall ? '아직 안 옴' : '호출 전';
    const sub = t.arrived ? `${hm(t.arrived)}에 도착`
      : w ? `${hm(w.at)} 기록`
      : t.firstCall ? `호출 ${mins(t.firstCall)}분째` : '';
    return (
      <div className={`ft ${cls}`} key={t.n}>
        <span className="n">{t.n}</span><span className="nm">{t.name}</span>
        <span className="h">{head}</span>{sub && <span className="s">{sub}</span>}
        {w && w.note && <span className="memo">{w.note}</span>}
      </div>
    );
  };
  const summary = (m: QM) => {
    const ts = [...m.red, ...m.blue], away = ts.filter((t) => !t.arrived);
    if (!away.length) return <span className="sum ok">4팀 모두 도착</span>;
    const c = (s: string) => away.filter((t) => t.status?.s === s).length;
    const parts = (['event', 'noshow', 'forfeit'] as const).filter((s) => c(s)).map((s) => `${WHY[s]} ${c(s)}`);
    return <span className="sum">미도착 {away.length}팀{parts.length ? ` · ${parts.join(' · ')}` : ''}</span>;
  };

  return (
    <>
      <header className="qbar"><div className="in">
        <h1>경기장</h1>
        <span className="ev">{view.event?.name}{cur && divs.length > 1 ? ` · ${divLabel(cur.div)}` : ''}</span>
        <span className="lock">보기 전용{replay.current ? ' · 리허설' : ''}</span>
        <span className="clock">{hm(view.now)}</span>
      </div></header>
      <div className="in">
        {divs.length > 1 && <div className="tools"><div className="divs" role="group" aria-label="구분">
          {divs.map((d) => <button type="button" key={d.div} aria-pressed={d === cur} onClick={() => setDiv(d.div)}>{divLabel(d.div)}</button>)}
        </div></div>}
        {err && <p className="note err">연결이 끊겨 마지막 화면을 보여 주고 있어요. {err}</p>}
        {view.store && <p className="note err">저장소에 연결되지 않아 도착·사유 기록을 못 불러와요. 운영진에게 알려 주세요.</p>}
        {live.map((m) => <p className="fnow" key={m.key}><b>진행 중</b> {m.label} · {m.red.map((t) => t.n).join(' · ')} vs {m.blue.map((t) => t.n).join(' · ')}</p>)}
        {!next.length && <p className="dim">남은 경기가 없어요.</p>}
        <div className="flist">
          {next.map((m, i) => (
            <section className={`fm${i === 0 ? ' first' : ''}`} key={m.key}>
              <div className="mh"><b>{m.label}</b>{i === 0 && <span className="st go">다음 경기</span>}<span className="t">{m.start ? `예정 ${hmLocal(m.start)}` : ''}</span>{summary(m)}</div>
              <div className="al">
                <div className="side r"><h3>레드</h3><div className="fts">{m.red.map(tile)}</div></div>
                <div className="side b"><h3>블루</h3><div className="fts">{m.blue.map(tile)}</div></div>
              </div>
            </section>
          ))}
        </div>
        <p className="dim small">10초마다 새로 고쳐요. 도착과 대회 불참·경기 불참·기권은 인스펙션 심판이 입장 체크 화면에서 기록해요.</p>
      </div>
    </>
  );
}
