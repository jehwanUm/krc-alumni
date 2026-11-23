'use client';
export function SponsorCheck({ team }: { team: number }) {
  return <button className="btn pri" onClick={async () => {
    const r = await fetch('/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team }) });
    if (!r.ok) return alert((await r.json().catch(() => ({}))).error || '처리하지 못했어요');
    location.reload();
  }}>확인 · 공개</button>;
}
