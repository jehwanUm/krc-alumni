'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

// 에디터와 같은 계산(public/editor/girigocha-path.js)을 그대로 쓴다 — 시간표·위치·블록·Java가 에디터와 똑같다
type Proj = { units: string; field: { size: number; origin: string }; paths: { name: string; wait?: number }[]; routineName: string };
type Ex = { id: string; title: string; note: string; r1: Proj; r2: Proj };
type TL = { items: { path: number; t0: number; t1: number; t2: number }[]; total: number };
type G = {
  biobuzzAutos(): Ex[]; timeline(p: Proj): TL; poseAt(p: Proj, tl: TL, t: number): { x: number; y: number; h: number } | null;
  analyze(p: Proj, q: unknown): { geo?: { length: number } }; geoPoint(g: unknown, s: number): number[]; fromM(v: number, u: string): number;
  blocksList(p: Proj): string[][]; javaOpMode(p: Proj, cls?: string, name?: string): string;
  BIOBUZZ: { half: number; hive: Box; red: Side; blue: Side };
};
type Box = { xMin: number; xMax: number; yMin: number; yMax: number };
type Side = { loadingZone: Box; garden: Box; flowers: { x: number; y: number }[] };
declare global { interface Window { GPath?: G } }

function useGPath() {
  const [g, setG] = useState<G | null>(null);
  useEffect(() => {
    if (window.GPath) { setG(window.GPath); return; }
    const s = document.createElement('script');
    s.src = '/editor/girigocha-path.js';
    s.onload = () => setG(window.GPath ?? null);
    document.head.appendChild(s);
  }, []);
  return g;
}

const ROBOT = 18; // inch, 예시 오토와 같은 크기

export default function AutoPlayer() {
  const G = useGPath();
  const [idx, setIdx] = useState(3);
  const [t, setT] = useState(0);
  const [on, setOn] = useState(false);
  const [tab, setTab] = useState<'blocks' | 'java'>('blocks');
  const [who, setWho] = useState<'r1' | 'r2'>('r1');
  const [show, setShow] = useState<'both' | 'r1' | 'r2'>('both'); // 시뮬레이션에 보일 로봇
  const cv = useRef<HTMLCanvasElement>(null);

  const data = useMemo(() => {
    if (!G) return null;
    const ex = G.biobuzzAutos()[idx];
    const tl1 = G.timeline(ex.r1), tl2 = G.timeline(ex.r2);
    const line = (p: Proj) => p.paths.map((q) => {
      const a = G.analyze(p, q), pts: number[][] = [];
      if (a.geo) for (let s = 0; s <= a.geo.length + 1e-9; s += a.geo.length / 60) { const g = G.geoPoint(a.geo, s); pts.push([G.fromM(g[0], p.units), G.fromM(g[1], p.units)]); }
      return pts;
    });
    const total = show === 'r1' ? tl1.total : show === 'r2' ? tl2.total : Math.max(tl1.total, tl2.total);
    return { ex, tl1, tl2, total, l1: line(ex.r1), l2: line(ex.r2) };
  }, [G, idx, show]);

  // 재생
  useEffect(() => {
    if (!on || !data) return;
    let last = performance.now(), raf = 0;
    const step = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      setT((v) => { const n = v + dt; if (n >= Math.min(30, data.total)) { setOn(false); return Math.min(30, data.total); } return n; });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, data]);

  // 그리기
  useEffect(() => {
    const c = cv.current;
    if (!c || !G || !data) return;
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr; c.height = r.width * dpr;
    const x = c.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(c), col = (n: string, d: string) => css.getPropertyValue(n).trim() || d;
    const ink = col('--ink', '#111'), mut = col('--mut', '#888'), line = col('--line', '#ddd'), blue = col('--blue', '#2F6FED'), red = col('--red', '#D33');
    const F = G.BIOBUZZ, W = r.width, sc = W / (2 * F.half);
    const px = (v: number) => (v + F.half) * sc, py = (v: number) => (F.half - v) * sc;
    const box = (b: Box) => [px(b.xMin), py(b.yMax), (b.xMax - b.xMin) * sc, (b.yMax - b.yMin) * sc] as const;
    x.clearRect(0, 0, W, W);
    // 타일 6×6
    x.strokeStyle = line; x.lineWidth = 1;
    for (let i = 0; i <= 6; i++) { const v = i * W / 6; x.beginPath(); x.moveTo(v, 0); x.lineTo(v, W); x.moveTo(0, v); x.lineTo(W, v); x.stroke(); }
    // HIVE: 왼쪽 반 빨강, 오른쪽 반 파랑 · LOADING ZONE · GARDEN · FLOWER
    const h = F.hive;
    x.globalAlpha = 0.22; x.fillStyle = red; x.fillRect(...box({ ...h, xMax: 0 })); x.fillStyle = blue; x.fillRect(...box({ ...h, xMin: 0 })); x.globalAlpha = 1;
    x.strokeStyle = mut; x.strokeRect(...box(h));
    ([[F.red, red], [F.blue, blue]] as const).forEach(([s, c2]) => {
      x.globalAlpha = 0.18; x.fillStyle = c2; x.fillRect(...box(s.loadingZone)); x.fillRect(...box(s.garden)); x.globalAlpha = 1;
      x.fillStyle = c2; s.flowers.forEach((f) => { x.beginPath(); x.arc(px(f.x), py(f.y), 4 * sc, 0, 7); x.fill(); });
    });
    x.fillStyle = mut; x.font = `${Math.max(10, W / 50)}px sans-serif`; x.textAlign = 'center'; x.fillText('관중 쪽', W / 2, W - 4);
    // 경로
    const drawLines = (ls: number[][][], c2: string, w: number, dash: number[]) => {
      x.strokeStyle = c2; x.lineWidth = w; x.setLineDash(dash); x.lineCap = 'round';
      ls.forEach((pts) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(px(p[0]), py(p[1])) : x.moveTo(px(p[0]), py(p[1])))); x.stroke(); });
      x.setLineDash([]);
    };
    if (show === 'r2') drawLines(data.l2, ink, 2.5, []);
    else if (show === 'both') drawLines(data.l2, mut, 2, [5, 5]);
    if (show !== 'r2') drawLines(data.l1, ink, 2.5, []);
    // 로봇 (로봇2는 회색)
    const robot = (p: Proj, tl: TL, fill: string, alpha: number) => {
      const q = G.poseAt(p, tl, t); if (!q) return;
      x.save(); x.translate(px(q.x), py(q.y)); x.rotate(-q.h); x.globalAlpha = alpha;
      const s = ROBOT * sc; x.fillStyle = fill; x.fillRect(-s / 2, -s / 2, s, s);
      x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(s / 2, 0); x.stroke(); x.restore();
    };
    if (show !== 'r1') robot(data.ex.r2, data.tl2, mut, 0.8);
    if (show !== 'r2') robot(data.ex.r1, data.tl1, red, 0.9);
  }, [G, data, t, show]);

  if (!G || !data) return <p className="note">시뮬레이션을 불러오는 중…</p>;
  const { ex } = data;
  const leg = (p: Proj, tl: TL) => tl.items.findIndex((it) => t < it.t2);
  const cur1 = leg(ex.r1, data.tl1), cur2 = leg(ex.r2, data.tl2);
  const proj = who === 'r1' ? ex.r1 : ex.r2;
  const end = Math.min(30, data.total);

  return (
    <div className="auto-player">
      <div className="ap-tabs" role="tablist" aria-label="예시 오토">
        {G.biobuzzAutos().map((e, i) => (
          <button key={e.id} role="tab" aria-selected={i === idx} className={i === idx ? 'on' : ''}
            onClick={() => { setIdx(i); setT(0); setOn(false); }}>{e.title.replace('BIOBUZZ ', '')}</button>
        ))}
      </div>
      <p className="ap-note">{ex.note}</p>
      <div className="ap-grid">
        <canvas ref={cv} className="ap-field" aria-label={`${ex.title} 시뮬레이션 — 빨강 사각형이 로봇1, 회색이 로봇2`} />
        <div className="ap-side">
          <div className="ap-tabs small" role="group" aria-label="재생할 로봇">
            {([['r1', '로봇1'], ['r2', '로봇2'], ['both', '같이']] as const).map(([k, n]) => (
              <button key={k} className={show === k ? 'on' : ''} onClick={() => { setShow(k); setT(0); setOn(false); if (k !== 'both') setWho(k); }}>{n}</button>
            ))}
          </div>
          <div className="ap-ctl">
            <button className="btn" onClick={() => { if (t >= end) setT(0); setOn(!on); }}>{on ? '일시정지' : '재생'}</button>
            <span className="ap-time">{t.toFixed(1)} / {end.toFixed(1)}초</span>
          </div>
          <input type="range" min={0} max={end} step={0.05} value={t} aria-label="시각"
            onChange={(e) => { setOn(false); setT(Number(e.target.value)); }} />
          {([['r1', '로봇1 (진한 선)', ex.r1, data.tl1, cur1], ['r2', '로봇2 (점선)', ex.r2, data.tl2, cur2]] as const).filter(([k]) => show === 'both' || show === k).map(([, name, p, tl, cur]) => (
            <div key={name} className="ap-legs">
              <b>{name}</b> · {tl.total.toFixed(1)}초
              <ol>{p.paths.map((q, i) => (
                <li key={i} className={i === cur ? 'on' : ''}>
                  <span>{tl.items[i].t0.toFixed(1)}초</span> {q.name}{q.wait ? ` · ${q.wait}초 멈춤` : ''}
                </li>
              ))}</ol>
            </div>
          ))}
        </div>
      </div>

      <div className="ap-code">
        <div className="ap-tabs small">
          <button className={who === 'r1' ? 'on' : ''} onClick={() => setWho('r1')}>로봇1</button>
          <button className={who === 'r2' ? 'on' : ''} onClick={() => setWho('r2')}>로봇2</button>
          <span className="sep" />
          <button className={tab === 'blocks' ? 'on' : ''} onClick={() => setTab('blocks')}>Blocks</button>
          <button className={tab === 'java' ? 'on' : ''} onClick={() => setTab('java')}>Java</button>
        </div>
        {tab === 'blocks' ? (
          <figure className="blocks"><ol>
            {G.blocksList(proj).map((b, i) => (
              <li key={i} className={/^\(/.test(b[0]) ? 'hint' : undefined}><b>{b[0]}</b>{b.slice(1).map((v, j) => <code key={j}>{v}</code>)}</li>
            ))}
          </ol></figure>
        ) : (
          <pre className="screen ap-java">{G.javaOpMode(proj, 'BiobuzzAuto', proj.routineName)}</pre>
        )}
      </div>
    </div>
  );
}
