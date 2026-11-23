'use client';
import { useEffect, useState } from 'react';

// 「모두 펼치기」(규칙 번호를 Ctrl/⌘+F로 찾을 때) + 목차 링크로 온 장은 자동으로 펼침
export function OpenAll() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const go = () => { const d = document.querySelector<HTMLDetailsElement>(`${location.hash} details.ch`); if (d) d.open = true; };
    if (location.hash) go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, []);
  const toggle = () => { const v = !open; document.querySelectorAll<HTMLDetailsElement>('details.ch').forEach((d) => (d.open = v)); setOpen(v); };
  return <button type="button" className="btn sm" onClick={toggle}>{open ? '모두 접기' : '모두 펼치기'}</button>;
}
