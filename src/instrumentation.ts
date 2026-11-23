import type { Instrumentation } from 'next';

// 오류 알림: 서버에서 페이지·API가 오류로 끝나면 운영진 Discord 채널로 알린다 (ALERT_WEBHOOK = Discord 웹훅 주소)
// 같은 오류는 서버 한 대에서 10분에 한 번만 (shortcut: 메모리 기준이라 서버가 여러 대면 중복될 수 있음, 시끄러우면 DB로)
const seen = new Map<string, number>();

export const onRequestError: Instrumentation.onRequestError = async (err, req, ctx) => {
  const hook = process.env.ALERT_WEBHOOK;
  if (!hook) return;
  const e = err as Error & { digest?: string };
  const key = `${ctx.routePath}|${e.message}`.slice(0, 300);
  const now = Date.now();
  if ((seen.get(key) ?? 0) > now - 600e3) return;
  seen.set(key, now);
  const text = [
    `🚨 **홈페이지 오류** · ${new Date(now + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ')}`,
    `${req.method} \`${req.path}\` (${ctx.routerKind} · ${ctx.routeType} · ${ctx.routePath})`,
    '```' + String(e.message || e).slice(0, 800) + '```',
    e.digest ? `digest: ${e.digest} — Vercel 로그에서 찾기` : '',
  ].filter(Boolean).join('\n');
  await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text, allowed_mentions: { parse: [] } }) }).catch(() => {});
};
