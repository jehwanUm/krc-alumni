'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '../lib/nav';


// 머리글 메뉴: 지금 있는 섹션에 밑줄 (aria-current)
export default function Nav() {
  const here = usePathname();
  return (
    <nav aria-label="주 메뉴">
      {NAV.map(([href, label]) => href.startsWith('http') ? <a key={href} href={href}>{label}</a> : <Link key={href} href={href} aria-current={here.startsWith(href) ? 'page' : undefined}>{label}</Link>)}
    </nav>
  );
}
