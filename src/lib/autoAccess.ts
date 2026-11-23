// 오토 경로 공개 범위: 누가 다른 팀 경로를 볼 수 있나
import type { AutoMeta, Visibility } from './store';
import { config, getLive } from './ftc';
import { liveCfg, isEventDay } from './krc';

export const VIS: Record<Visibility, string> = { private: '비공개', alliance: '동맹이 되면 공개', teams: '지정 팀만', public: '모두에게' };
export const isVis = (v: unknown): v is Visibility => typeof v === 'string' && v in VIS;
export const teamList = (v: unknown) => [...new Set(String(v ?? '').split(/[\s,]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0 && n < 100000))].slice(0, 30);

// 오늘 대회 대진에서 두 팀이 한 번이라도 같은 동맹인가 (대회 날만)
export async function sameAlliance(a: number, b: number): Promise<boolean> {
  if (!isEventDay()) return false;
  const d = await getLive(liveCfg(config())).catch(() => null);
  return !!d?.matches?.some((m: { red: number[]; blue: number[] }) => (m.red.includes(a) && m.red.includes(b)) || (m.blue.includes(a) && m.blue.includes(b)));
}

// viewer: 보는 사람의 팀 번호 (없으면 null)
export async function canSee(a: AutoMeta, viewer: number | null): Promise<boolean> {
  if (viewer === a.team || a.visibility === 'public') return true;
  if (!viewer) return false;
  if (a.visibility === 'teams') return a.share_teams.includes(viewer);
  if (a.visibility === 'alliance') return sameAlliance(a.team, viewer);
  return false;
}
