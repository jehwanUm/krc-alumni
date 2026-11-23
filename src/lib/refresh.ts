// 팀 정보가 바뀌면 팀 페이지·팀 목록·후원 페이지 캐시를 바로 비운다
import { revalidatePath, revalidateTag } from 'next/cache';
import { teamTag, PROFILES_TAG } from './store';

export function refreshTeam(...teams: (number | null | undefined)[]) {
  for (const n of new Set(teams.filter((x): x is number => !!x))) { revalidateTag(teamTag(n), { expire: 0 }); revalidatePath(`/teams/${n}`); }
  revalidateTag(PROFILES_TAG, { expire: 0 });
  revalidatePath('/teams'); revalidatePath('/sponsors');
}
