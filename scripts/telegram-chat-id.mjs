// 텔레그램 오류 알림 준비: 봇에게 아무 말이나 보낸 뒤 실행하면 chat id를 알려 주고 시험 메시지를 보낸다
// TELEGRAM_BOT_TOKEN=<토큰> node scripts/telegram-chat-id.mjs
const t = process.env.TELEGRAM_BOT_TOKEN;
if (!t) { console.error('TELEGRAM_BOT_TOKEN이 필요해요'); process.exit(1); }
const u = await (await fetch(`https://api.telegram.org/bot${t}/getUpdates`)).json();
if (!u.ok) { console.error('토큰이 맞지 않아요:', u.description); process.exit(1); }
const chat = u.result.map((x) => x.message?.chat).filter(Boolean).pop();
if (!chat) { console.error('봇에게 먼저 아무 메시지나 보내 주세요 (예: /start)'); process.exit(1); }
const r = await (await fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat.id, text: '✅ KRC 홈페이지 오류 알림이 연결됐어요' }) })).json();
console.log(`chat id: ${chat.id} (${chat.first_name ?? chat.title ?? ''}) · 시험 메시지 ${r.ok ? '보냄' : '실패: ' + r.description}`);
