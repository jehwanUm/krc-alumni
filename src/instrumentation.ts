import type { Instrumentation } from 'next';

// 오류 알림: 서버에서 페이지·API가 오류로 끝나면 운영진 Discord 채널로 알린다 (ALERT_WEBHOOK = Discord 웹훅 주소)
// 같은 오류는 서버 한 대에서 10분에 한 번만 (shortcut: 메모리 기준이라 서버가 여러 대면 중복될 수 있음, 시끄러우면 DB로)
const seen = new Map<string, number>();
// 개인정보 가리기: 주소의 ?뒤(재설정 토큰 등) 버리고, 이메일·전화·긴 토큰·IP·UUID는 가린다. 요청 본문·헤더·쿠키는 보내지 않는다
export const scrub = (s: string) => s
  .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[이메일]')
  .replace(/\b01[016789]-?\d{3,4}-?\d{4}\b/g, '[전화]')
  .replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, '[IP]')
  .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]')
  .replace(/[A-Za-z0-9_\-]{24,}/g, '[토큰]');

export const onRequestError: Instrumentation.onRequestError = async (err, req, ctx) => {
  const hook = process.env.ALERT_WEBHOOK;
  if (!hook) return;
  const e = err as Error & { digest?: string };
  const msg = scrub(String(e.message || e)).slice(0, 800), path = scrub(req.path.split('?')[0]);
  const key = `${ctx.routePath}|${msg}`.slice(0, 300);
  const now = Date.now();
  if ((seen.get(key) ?? 0) > now - 600e3) return;
  seen.set(key, now);
  const text = [
    `🚨 **홈페이지 오류** · ${new Date(now + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ')}`,
    `${req.method} \`${path}\` (${ctx.routerKind} · ${ctx.routeType} · ${ctx.routePath})`,
    '```' + msg + '```',
    e.digest ? `digest: ${e.digest} — Vercel 로그에서 찾기` : '',
  ].filter(Boolean).join('\n');
  await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text, allowed_mentions: { parse: [] } }) }).catch(() => {});
};
