'use client';
import { useEffect } from 'react';

// 팀 목록: 서버가 만든 카드들을 시즌 탭·검색·정렬·카드/표 전환에 맞춰 다시 배치한다 (React 다시 그리기 없이 DOM만).
function start() {

  const dir = document.getElementById('dir');
  if (!dir) return;
  {
    const items = [...dir.querySelectorAll<HTMLElement>('.tm')];
    const onlyAuto = document.getElementById('onlyAuto') as HTMLInputElement, noAuto = document.getElementById('noAuto')!;
    const q = document.getElementById('q') as HTMLInputElement, sort = document.getElementById('sort') as HTMLSelectElement;
    const cnt = document.getElementById('cnt')!;
    let season = (document.querySelector('.tabs [aria-pressed="true"]') as HTMLElement).dataset.season!;
    const sl = (y: string) => `${y}–${String(Number(y) + 1).slice(2)}`;
    const num = (el: HTMLElement, k: string) => Number(el.dataset[k]);
    const cmp: Record<string, (a: HTMLElement, b: HTMLElement) => number> = {
      n: (a, b) => num(a, 'n') - num(b, 'n'),
      name: (a, b) => a.dataset.name!.localeCompare(b.dataset.name!, 'ko'),
      school: (a, b) => (a.dataset.school || '힣').localeCompare(b.dataset.school || '힣', 'ko'),
      sponsor: (a, b) => Number(!a.dataset.sponsor) - Number(!b.dataset.sponsor) || a.dataset.sponsor!.localeCompare(b.dataset.sponsor!, 'ko'),
      count: (a, b) => num(b, 'count') - num(a, 'count'),
      // data-perf-2025 → dataset['perf-2025'] (숫자 앞 하이픈은 camelCase로 안 바뀜)
      perf: (a, b) => num(a, season === 'all' ? 'perfAll' : `perf-${season}`) - num(b, season === 'all' ? 'perfAll' : `perf-${season}`),
    };
    function apply() {
      const text = q.value.trim().toLowerCase();
      let shown = 0;
      for (const el of items) {
        const ok = (season === 'all' || el.dataset.seasons!.split(' ').includes(season)) && (!text || el.dataset.search!.includes(text)) && (!onlyAuto.checked || num(el, 'auto') > 0);
        el.hidden = !ok; if (ok) shown++;
        el.querySelectorAll<HTMLElement>('.r').forEach((r) => (r.hidden = r.dataset.s !== season));
      }
      items.sort((a, b) => cmp[sort.value](a, b) || num(a, 'n') - num(b, 'n')).forEach((el) => dir!.appendChild(el));
      cnt.textContent = `${season === 'all' ? '전체' : sl(season) + ' 시즌'} · ${shown}팀`;
      noAuto.hidden = !(onlyAuto.checked && shown === 0);
    }
    document.querySelectorAll<HTMLButtonElement>('.tabs button').forEach((b) => b.addEventListener('click', () => {
      season = b.dataset.season!;
      document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    }));
    document.querySelectorAll<HTMLButtonElement>('.seg button').forEach((b) => b.addEventListener('click', () => {
      dir.className = `dir view-${b.dataset.view}`;
      document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      try { localStorage.setItem('krc-teams-view', b.dataset.view!); } catch {}
    }));
    q.addEventListener('input', apply); sort.addEventListener('change', apply); onlyAuto.addEventListener('change', apply);
    try { const v = localStorage.getItem('krc-teams-view'); if (v === 'table') (document.querySelector('.seg [data-view="table"]') as HTMLElement).click(); } catch {}
  }
}

export function TeamsBoot() {
  useEffect(start, []);
  return null;
}
