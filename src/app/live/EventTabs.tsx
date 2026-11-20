import Link from 'next/link';
import { NEXT, REGIONALS } from '@/lib/krc';

// 대회 고르기: 이번 시즌 지역 대회와 KRC를 날짜순으로. KRC는 /live, 지역 대회는 /live/<코드>
const md = (d: string) => `${+d.slice(5, 7)}/${+d.slice(8, 10)}`;
export const TABS = [
  ...REGIONALS.map((r) => ({ code: r.event, href: `/live/${r.event}`, name: r.title, when: md(r.start) })),
  { code: 'KRCMP', href: '/live', name: NEXT.name, when: `${md(NEXT.start)}–${+NEXT.end.slice(8, 10)}` },
];

export function EventTabs({ cur }: { cur: string }) {
  return (
    <nav className="evtabs" aria-label="대회 선택">
      {TABS.map((t) => <Link key={t.code} href={t.href} prefetch={false} aria-current={t.code === cur ? 'page' : undefined}><span className="w">{t.when}</span>{t.name}</Link>)}
    </nav>
  );
}
