import { readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { uploadDir } from '@/lib/store';

// 팀이 올린 사진 내보내기: /uploads/<팀번호>/<파일> → UPLOAD_DIR 안의 파일 (밖으로 나가는 경로는 막는다)
const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const root = resolve(uploadDir()), file = resolve(join(root, ...parts));
  const type = TYPES[file.split('.').pop()!.toLowerCase()];
  if (!type || !file.startsWith(root + sep)) return new Response('Not found', { status: 404 });
  try {
    // 파일 이름에 저장 시각이 들어가서 내용이 바뀌지 않는다 → 오래 캐시
    return new Response(await readFile(file), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Not found', { status: 404 }); }
}
