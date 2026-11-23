import { revalidatePath, revalidateTag } from 'next/cache';
import { teamProfiles, uploadImage, teamTag } from '@/lib/store';
import { memberOf } from '@/lib/session';
import { canManageTeam, parseTeamForm, IMG_TYPES } from '@/lib/member';
import { teamKo } from '@/lib/teams';

// 팀 설정 저장 (팀장·운영진). 사진은 Supabase Storage, 후원사가 바뀌면 운영진 확인 대기
export const dynamic = 'force-dynamic';
const LIMIT = { logo: 1 << 20, robot: 3 << 20 };

export async function POST(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const n = Number((await params).number);
  const me = await memberOf(req);
  if (!Number.isInteger(n) || !canManageTeam(me, n)) return Response.json({ error: '이 팀의 팀장만 고칠 수 있어요' }, { status: 403 });
  const f = await req.formData().catch(() => null);
  if (!f) return Response.json({ error: '잘못된 요청이에요' }, { status: 400 });
  const cur = await teamProfiles.get(n);
  const d = parseTeamForm(f);

  const img = async (k: 'logo' | 'robot') => {
    const file = f.get(k);
    if (!(file instanceof File) || !file.size) return undefined;
    const ext = IMG_TYPES[file.type];
    if (!ext) throw new Error('사진은 PNG·JPG·WEBP만 올릴 수 있어요');
    if (file.size > LIMIT[k]) throw new Error(`${k === 'logo' ? '로고는 1MB' : '로봇 사진은 3MB'} 이하로 올려 주세요`);
    return uploadImage(`${n}/${k}-${Date.now()}.${ext}`, await file.arrayBuffer(), file.type);
  };
  let logo_url, robot_url;
  try { [logo_url, robot_url] = await Promise.all([img('logo'), img('robot')]); }
  catch (e) { return Response.json({ error: (e as Error).message }, { status: 400 }); }

  const before = cur?.sponsors_ok === false ? cur.sponsors : cur?.sponsors ?? teamKo(n).sponsors;
  const changed = d.sponsors.join('\n') !== before.join('\n');
  await teamProfiles.put({
    team: n, ...d,
    logo_url: f.get('logo_clear') ? null : logo_url ?? cur?.logo_url ?? null,
    robot_url: f.get('robot_clear') ? null : robot_url ?? cur?.robot_url ?? null,
    sponsors_ok: me!.admin || (!changed && (cur?.sponsors_ok ?? true)),
    updated_at: new Date().toISOString(), updated_by: me!.email,
  });
  revalidateTag(teamTag(n), { expire: 0 }); revalidatePath(`/teams/${n}`);
  return Response.json({ ok: true, sponsorsPending: changed && !me!.admin });
}
