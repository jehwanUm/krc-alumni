import type { MetadataRoute } from 'next';

// 홈 화면에 추가했을 때의 앱 설정 (아이폰 웹 푸시는 홈 화면 앱에서만 된다)
// start_url을 두지 않는다: 그러면 「홈 화면에 추가」한 그 주소(/live?team=…&replay=…)로 열린다.
// 아이폰 홈 화면 앱은 사파리와 저장 공간이 따로라서, 팀 번호가 주소에 남아 있어야 한다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KRC Alumni', short_name: 'KRC', description: 'KRC 대회 Live와 경기 호출',
    scope: '/', display: 'standalone', background_color: '#0B0D12', theme_color: '#0B0D12', lang: 'ko',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
  };
}
