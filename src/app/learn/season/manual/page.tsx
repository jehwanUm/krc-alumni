import Link from 'next/link';
import { meta } from '@/lib/meta';
import data from '@/data/manual-ko-tu10.json';
import { OpenAll } from './OpenAll';

export const metadata = meta('/learn/season/manual');

// 원문: FTC Competition Manual TU10(2026-11-19). 번역문이 아니라 동문회가 장별로 요약한 것 (원문 저작권은 FIRST)
type Item = { id: string | null; text: string };
type Group = { no: string; title: string; items: Item[] };
type Section = { no: string; title: string; summary: string; groups: Group[] };
const SECTIONS = data.sections as Section[];

export default function Page() {
  return (
    <main className="guide">
      <section className="page-head"><div className="in">
        <span className="label">Learn · Season · Manual</span>
        <h1>BIOBUZZ 매뉴얼 한국어 요약</h1>
        <p>FTC(FIRST Tech Challenge) 2026-27 Competition Manual <b>TU10(2026-11-19)</b>을 장별·항목별로 한국어로 요약했어요. 규칙 번호는 <kbd>Ctrl/⌘ + F</kbd>로 찾아보세요.</p>
      </div></section>

      <section className="sec"><div className="in"><div><span className="label">목차</span><h2>장 바로가기</h2></div><div className="body">
        <ul>{SECTIONS.map((s) => <li key={s.no}><a href={`#s${s.no}`}>{s.no}. {s.title}</a></li>)}</ul>
        <p className="note">요약은 이해를 돕기 위한 것이고, 규칙의 최종 기준은 <a href="https://ftc-resources.firstinspires.org/ftc/game/manual" target="_blank" rel="noopener noreferrer">영문 공식 매뉴얼</a>이에요. Korea Robot Championship 적용 내용은 다를 수 있으니, 정확한 내용은 <a href="https://fest.or.kr" target="_blank" rel="noopener noreferrer">fest.or.kr</a>에서 확인하세요.</p>
        <p className="row"><OpenAll /> <Link href="/learn/season">← 시즌 자료실</Link></p>
      </div></div></section>

      {SECTIONS.map((s) => (
        <section className="sec" id={`s${s.no}`} key={s.no}><div className="in">
          <div><span className="label">§{s.no}</span><h2>{s.title}</h2></div>
          <div className="body">
            <p>{s.summary}</p>
            {/* 처음엔 접어 두고, 누르면 이 장 내용이 다 펼쳐진다 */}
            <details className="ch">
              <summary>자세히 보기 · {s.groups.reduce((n, g) => n + g.items.length, 0)}항목</summary>
              {s.groups.map((g) => (
                <div key={g.no + g.title}>
                  <h3>{g.no} {g.title}</h3>
                  <ul>{g.items.map((it, i) => <li key={i}>{it.id && <span className="rule">{it.id}</span>}{it.text}</li>)}</ul>
                </div>
              ))}
            </details>
          </div>
        </div></section>
      ))}
    </main>
  );
}
