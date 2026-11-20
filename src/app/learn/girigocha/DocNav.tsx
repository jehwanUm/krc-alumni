'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS } from './docs';

// 문서 왼쪽 목차: 지금 페이지 표시. 휴대폰에서는 본문 위에 묶음별로 줄바꿈해서 보인다.
export default function DocNav() {
  const here = usePathname();
  return (
      <nav className="doc-nav" aria-label="기리고차 문서">
        {DOCS.map((g) => (
          <div key={g.group}>
            <span className="label">{g.group}</span>
            <ul>{g.items.map(([href, label]) => <li key={href}><Link href={href} aria-current={here === href ? 'page' : undefined}>{label}</Link></li>)}</ul>
          </div>
        ))}
      </nav>
  );
}
