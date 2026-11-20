'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// 이 기기에 저장된 우리 팀 (/start에서 정함)을 대회 페이지 위에 보여 준다
export function MyTeam({ names }: { names: Record<number, string> }) {
  const [n, setN] = useState(0);
  useEffect(() => { try { setN(Number(localStorage.getItem('krc-team')) || 0); } catch {} }, []);
  if (!n) return <p className="myteam"><Link href="/start">우리 팀 설정하기 →</Link></p>;
  return <p className="myteam">✓ 우리 팀 <b>{n}{names[n] ? ` ${names[n]}` : ''}</b> · <Link href="/start">팀 바꾸기</Link></p>;
}
