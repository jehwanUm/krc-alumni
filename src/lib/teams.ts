// 팀 목록·후원사: 공식 FTC 데이터 + 한글 소속·지역·후원사(src/data/teams-ko.json, 운영진 확인용 초안)
import ko from '../data/teams-ko.json';
import { config, getTeams, getSeasonResults, KRC_SEASONS, type SeasonResult } from './ftc';

export type TeamKo = { school: string; region: string; sponsors: string[]; checked: boolean };
const KO = ko.teams as Record<string, TeamKo & { official: string | null }>;
export const teamKo = (n: number): TeamKo => KO[n] ?? { school: '', region: '', sponsors: [], checked: false };

export type DirTeam = { n: number; name: string; seasons: number[] } & TeamKo;
export type Directory = { teams: DirTeam[]; res: Record<number, Record<number, SeasonResult>> };

// shortcut: 서버 메모리에 10분 기억 (ISR과 같은 주기). 여러 서버로 늘면 DB 캐시로
let memo: { at: number; v: Directory } | null = null;

export async function getDirectory(): Promise<Directory> {
  if (memo && Date.now() - memo.at < 600e3) return memo.v;
  const c = config();
  const seasons = [...KRC_SEASONS].sort((a, b) => b - a);
  const [lists, results] = await Promise.all([
    Promise.all(seasons.map((season) => getTeams({ ...c, season, event: 'KRCMP' }))),
    Promise.all(seasons.map((season) => getSeasonResults(c, season))),
  ]);
  const map = new Map<number, DirTeam>();
  seasons.forEach((season, i) => {
    for (const t of lists[i]) {
      const cur = map.get(t.teamNumber);
      if (cur) cur.seasons.push(season);
      else map.set(t.teamNumber, { n: t.teamNumber, name: String(t.nameShort ?? '').trim(), seasons: [season], ...teamKo(t.teamNumber) });
    }
  });
  const v = { teams: [...map.values()].sort((a, b) => a.n - b.n), res: Object.fromEntries(seasons.map((s, i) => [s, results[i]])) };
  memo = { at: Date.now(), v };
  return v;
}

// 후원사 이름 → 주소 조각 (후원 기업 페이지 #sp-...)
export const sponsorId = (name: string) => 'sp-' + name.replace(/\s+/g, '-');
