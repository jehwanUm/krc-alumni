// 팀 목록·후원 페이지가 쓰는 팀 디렉터리 + 팀장이 고친 팀 설정(소속·지역·로고·확인된 후원사)
import { getDirectory, type Directory, type DirTeam } from './teams';
import { teamProfiles, type TeamProfile } from './store';
import { logoFor } from './logos';

export type ViewTeam = DirTeam & { logo: string };
export type TeamsView = Omit<Directory, 'teams'> & { teams: ViewTeam[] };
export async function getTeamsView(): Promise<TeamsView> {
  const [dir, ps]: [Directory, TeamProfile[]] = await Promise.all([getDirectory(), teamProfiles.all().catch(() => [])]);
  const by = new Map(ps.filter((p) => !p.hidden).map((p) => [p.team, p]));
  return {
    ...dir,
    teams: dir.teams.map((t) => {
      const p = by.get(t.n);
      return { ...t, school: p?.school || t.school, region: p?.region || t.region, sponsors: p?.sponsors_ok ? p.sponsors : t.sponsors, logo: p?.logo_url ?? logoFor(t.n).src };
    }),
  };
}
