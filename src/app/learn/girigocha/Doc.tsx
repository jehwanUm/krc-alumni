import Link from 'next/link';
import { page } from '@/lib/pages';
import { DOCS, FLAT } from './docs';

/** 문서 한 쪽: 제목(pages.ts) + 본문 + 이전/다음. */
export default function Doc({ path, lead, children }: { path: string; lead?: string; children: React.ReactNode }) {
  const i = FLAT.findIndex(([p]) => p === path);
  const prev = FLAT[i - 1], next = FLAT[i + 1];
  const group = DOCS.find((g) => g.items.some(([p]) => p === path))?.group;
  return (
    <article className="doc">
      <span className="label">기리고차 · {group}</span>
      <h1>{FLAT[i][1]}</h1>
      {lead && <p className="lead">{lead}</p>}
      {children}
      <nav className="doc-pn" aria-label="이전·다음 문서">
        {prev ? <Link href={prev[0]}><span className="label">이전</span><b>{prev[1]}</b></Link> : <span />}
        {next ? <Link href={next[0]} className="nx"><span className="label">다음</span><b>{next[1]}</b></Link> : <span />}
      </nav>
    </article>
  );
}

/** 따라 하는 단계 묶음. */
export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="steps">{children}</ol>;
}

/** Driver Station 화면에 나오는 글. */
export function Screen({ children }: { children: React.ReactNode }) {
  return <pre className="screen" aria-label="Driver Station 화면">{children}</pre>;
}

/** Blocks 프로그램 한 줄: 블록 이름 + 칸에 넣는 값. */
export function B({ n, v, d = 0 }: { n: string; v?: string; d?: 0 | 1 | 2 }) {
  return <li className={d ? `d${d}` : undefined}><b>{n}</b>{v && <code>{v}</code>}</li>;
}
export function Blocks({ children, title }: { children: React.ReactNode; title?: string }) {
  return <figure className="blocks">{title && <figcaption>{title}</figcaption>}<ol>{children}</ol></figure>;
}
