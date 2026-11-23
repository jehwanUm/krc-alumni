// 알림 메일 (Resend). RESEND_API_KEY·MAIL_FROM이 없으면 보내지 않고 false — 화면에서 운영진이 직접 연락하면 된다
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM;
  if (!key || !from) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text }),
  }).catch(() => null);
  return !!r?.ok;
}
export const mailReady = () => !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
