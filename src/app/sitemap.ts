import type { MetadataRoute } from 'next';
import { PAGES } from '../lib/pages';
import { abs } from '../lib/meta';
import { config, getTeams, KRC_SEASONS } from '../lib/ftc';

// 공개 페이지(noindex 제외) + 공식 사이트에 있는 모든 KRC 시즌의 참가 팀 페이지. 10분마다 다시 만든다.
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = config();
  const lists = await Promise.all(KRC_SEASONS.map((season) => getTeams({ ...c, season, event: 'KRCMP' }).catch(() => [])));
  const teams = [...new Set(lists.flat().map((t: any) => t.teamNumber as number))].sort((a, b) => a - b);
  return [...PAGES.filter((p) => !p.noindex).map((p) => ({ url: abs(p.path) })), ...teams.map((n) => ({ url: abs(`/teams/${n}`) }))];
}
