import { meta } from '@/lib/meta';
import { FieldApp } from './FieldApp';
import '../queue/queue.css';
import './field.css';

// 경기장 심판 화면 (보기만, 입장 체크와 같은 PIN). 화면은 FieldApp이 /api/queue를 10초마다 불러 그린다.
export const metadata = meta('/live/field');

export default function Page() {
  return <main className="pg-queue pg-field"><FieldApp /></main>;
}
