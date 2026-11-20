import { meta } from '@/lib/meta';
import { QueueApp } from './QueueApp';
import './queue.css';

// 심판용 입장 체크 (PIN). 화면은 QueueApp이 /api/queue를 10초마다 불러 그린다.
export const metadata = meta('/live/queue');

export default function Page() {
  return <main className="pg-queue"><QueueApp /></main>;
}
