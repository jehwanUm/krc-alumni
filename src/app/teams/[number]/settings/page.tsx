import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDirectory, teamKo } from '@/lib/teams';
import { logoFor, hasOwnLogo } from '@/lib/logos';
import { TeamSettings } from './TeamSettings';
import '../../../login/login.css';
import './settings.css';

// 팀 설정 화면 미리보기 (저장 안 됨). 항목을 정한 뒤 회원-팀 연결·저장·사진 저장소를 붙인다
export const metadata: Metadata = { title: '팀 설정 (미리보기) · KRC Alumni', robots: { index: false } };
export const revalidate = 600;

export default async function Page({ params }: { params: Promise<{ number: string }> }) {
  const n = Number((await params).number);
  if (!Number.isInteger(n) || n <= 0) notFound();
  const t = (await getDirectory().catch(() => null))?.teams.find((x) => x.n === n);
  const ko = teamKo(n);
  const name = t?.name || `팀 ${n}`;
  return (
    <main className="pg-login pg-tset">
      <div className="preview-bar" role="note">미리보기 화면이에요. 입력해도 저장되지 않아요.</div>
      <section className="page-head"><div className="in">
        <span className="label">Team {n} · Settings</span>
        <h1>팀 설정</h1>
        <p>{n} {name}의 팀 페이지에 보이는 내용을 팀원이 직접 고쳐요. <Link href={`/teams/${n}`}>팀 페이지 보기 →</Link></p>
      </div></section>
      <section className="sec wide"><div className="in"><div className="body">
        <TeamSettings n={n} name={name} seasons={t?.seasons ?? []} school={ko.school} region={ko.region} sponsors={ko.sponsors} logo={logoFor(n).src} ownLogo={hasOwnLogo(n)} />
      </div></div></section>
    </main>
  );
}
