import { ImageResponse } from 'next/og';

// 카톡·인스타·디스코드 등에 링크를 붙였을 때 나오는 미리보기 그림 (모든 페이지 공통, 빌드 때 한 번 만든다)
// 글자는 영어만: 기본 글꼴에 한글이 없어서
export const alt = 'KRC Alumni — Korea Robot Championship 동문회';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const line = (x: number, y: number, w: number, h: number, c: string) => <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: c }} />;
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 96px', background: '#0B0D12', color: '#E9ECF1', position: 'relative' }}>
      {line(0, 64, 360, 2, '#2E6BFF')}{line(358, 0, 2, 66, '#2E6BFF')}{line(900, 470, 300, 2, '#E5484D')}{line(900, 470, 2, 160, '#E5484D')}
      <div style={{ display: 'flex', marginBottom: 40 }}>{['#2E6BFF', '#E5484D', '#F5C542'].map((c) => <div key={c} style={{ width: 56, height: 14, background: c }} />)}</div>
      <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>KRC Alumni</div>
      <div style={{ fontSize: 40, color: '#C3C8D1', marginTop: 24 }}>The match ends. The team doesn&apos;t.</div>
      <div style={{ fontSize: 28, color: '#8A92A0', marginTop: 48, fontFamily: 'monospace' }}>Korea Robot Championship · Alumni</div>
    </div>,
    size,
  );
}
