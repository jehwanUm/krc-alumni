// 휴대폰으로 호출 보내기 (웹 푸시). 구독이 만료된 휴대폰(404·410)은 저장소에서 지운다.
import webpush from 'web-push';
import { subs } from './store';

export const publicKey = () => process.env.VAPID_PUBLIC_KEY ?? '';
let ready = false;
function setup() {
  if (ready) return;
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subj } = process.env;
  if (!pub || !priv) throw new Error('VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY가 설정되지 않았어요');
  webpush.setVapidDetails(subj || 'mailto:krc-alumni@example.com', pub, priv);
  ready = true;
}

export type Payload = { title: string; body: string; url: string; tag: string };

// 팀들에게 보내고, 실제로 도착한 휴대폰 수를 돌려준다
export async function sendToTeams(teams: number[], p: (team: number) => Payload) {
  setup();
  const rows = await subs.forTeams(teams);
  const res = await Promise.all(rows.map(async (r) => {
    try {
      await webpush.sendNotification(r.sub, JSON.stringify(p(r.team)), { TTL: 600, urgency: 'high' });
      return 1;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await subs.del(r.endpoint);
      return 0;
    }
  }));
  return res.reduce<number>((a, b) => a + b, 0);
}
