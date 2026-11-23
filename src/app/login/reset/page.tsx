import { meta } from '@/lib/meta';
import { ResetForm } from './ResetForm';
import '../login.css';

// 운영진이 보낸 재설정 링크(/login/reset?t=…)로 새 비밀번호 정하기
export const dynamic = 'force-dynamic';
export const metadata = meta('/login/reset');

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = '' } = await searchParams;
  return (
    <main className="pg-login">
      <section className="page-head"><div className="in">
        <span className="label">Account</span>
        <h1>비밀번호 재설정</h1>
        <p>새 비밀번호를 정하면 바로 로그인할 수 있어요. 이 링크는 한 번만, 받은 뒤 30분 안에 쓸 수 있어요.</p>
        {t ? <ResetForm t={t} /> : <p className="note">링크가 올바르지 않아요. 운영진에게 새 링크를 요청해 주세요.</p>}
      </div></section>
    </main>
  );
}
