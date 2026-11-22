import { config, getTeams } from '@/lib/ftc';
import { meta } from '@/lib/meta';
import { nextRegional, isEventDay } from '@/lib/krc';
import { StartForm } from './StartForm';
import './start.css';

// 대회장 QR이 여는 첫 화면: 팀 번호 → 「○○○ 팀으로 등록할까요?」 확인 → 이 기기에 우리 팀 저장 → 대회 페이지(당일엔 Live 대진표)
export const revalidate = 300;
export const metadata = meta('/start');

export default async function Page() {
  const r = nextRegional();
  const teams = r ? await getTeams({ ...config(), season: r.season, event: r.event }).catch(() => []) : [];
  const list = teams.map((t: any) => ({ n: t.teamNumber as number, name: String(t.nameShort ?? '').trim() }));
  const live = r ? isEventDay(Date.now(), r) : false;
  return (
    <main className="pg-start">
      <section className="page-head"><div className="in">
        <span className="label">{r ? r.title : 'KRC'}</span>
        <h1>우리 팀 설정</h1>
        <p>팀 번호를 넣으면 이 휴대폰에 우리 팀이 저장돼요. 대회 날에는 우리 팀 경기와 대진표가 바로 보여요.</p>
        <StartForm teams={list} next={r ? (live ? '/live?live=1' : `/live/${r.event}`) : '/live'} live={live} />
      </div></section>
    </main>
  );
}
