'use client';
import { useEffect } from 'react';

// 경기 줄을 누르면 세부 점수(오토·텔레옵·페널티, 예선은 RP)를 펼친다
export function BreakdownToggle() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement, tr = t.closest<HTMLElement>('tr.open-bd');
      if (!tr || t.closest('a')) return;
      const bd = tr.nextElementSibling as HTMLElement; bd.hidden = !bd.hidden;
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
