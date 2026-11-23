import Link from 'next/link';
import { meta } from '@/lib/meta';
import data from '@/data/manual-ko-tu10.json';

export const metadata = meta('/learn/season/manual');

// 원문: FTC Competition Manual TU10(2026-11-19). 장마다 한 단락 소개만 공개 (원문 저작권은 FIRST).
// 항목별 요약(data의 groups)은 FIRST·협회 허락을 받기 전까지 화면에 내지 않는다 — 2026-11-23 법률 검토
type Section = { no: string; title: string; summary: string };
const SECTIONS = data.sections as Section[];

export default function Page() {
  return (
    <main className="guide">
      <section className="page-head"><div className="in">
        <span className="label">Learn · Season · Manual</span>
        <h1>BIOBUZZ 매뉴얼 한국어 요약</h1>
        <p>FTC(FIRST Tech Challenge) 2026-27 Competition Manual <b>TU10(2026-11-19)</b>의 각 장이 무엇을 다루는지 한국어로 짧게 정리했어요. 규칙의 정확한 문장은 공식 매뉴얼에서 확인해 주세요.</p>
      </div></section>

      <section className="sec"><div className="in"><div><span className="label">목차</span><h2>장 바로가기</h2></div><div className="body">
        <ul>{SECTIONS.map((s) => <li key={s.no}><a href={`#s${s.no}`}>{s.no}. {s.title}</a></li>)}</ul>
        <p className="note">요약은 이해를 돕기 위한 것이고, 규칙의 최종 기준은 <a href="https://ftc-resources.firstinspires.org/ftc/game/manual" target="_blank" rel="noopener noreferrer">영문 공식 매뉴얼</a>이에요. Korea Robot Championship 적용 내용은 다를 수 있으니, 정확한 내용은 <a href="https://fest.or.kr" target="_blank" rel="noopener noreferrer">fest.or.kr</a>에서 확인하세요.</p>
        <p className="note">항목별 상세 요약은 FIRST·창의공학교육협회의 이용 허락을 확인한 뒤 공개할게요. 지금은 장마다 핵심만 적었어요.</p>
        <p><Link href="/learn/season">← 시즌 자료실</Link></p>
      </div></div></section>

      {SECTIONS.map((s) => (
        <section className="sec" id={`s${s.no}`} key={s.no}><div className="in">
          <div><span className="label">§{s.no}</span><h2>{s.title}</h2></div>
          <div className="body">
            <p>{s.summary}</p>
          </div>
        </div></section>
      ))}
    </main>
  );
}
