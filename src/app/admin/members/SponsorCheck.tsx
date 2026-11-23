'use client';
// 운영진 팀 설정 버튼 (후원사 확인, 숨기기, 사진·소개 지우기)
export function TeamAct({ team, action, label, ask, pri }: { team: number; action: string; label: string; ask?: string; pri?: boolean }) {
  return <button className={`btn${pri ? ' pri' : action.startsWith('clear') || action === 'hide' ? ' danger' : ''}`} onClick={async () => {
    if (ask && !confirm(ask)) return;
    const r = await fetch('/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team, action }) });
    if (!r.ok) return alert((await r.json().catch(() => ({}))).error || '처리하지 못했어요');
    location.reload();
  }}>{label}</button>;
}
