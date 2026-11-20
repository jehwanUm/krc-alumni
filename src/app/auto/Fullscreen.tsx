'use client';

// 전체화면: 에디터만 화면을 꽉 채운다 (Esc로 돌아옴). 지원하지 않는 브라우저(일부 아이폰)는 새 탭으로 연다.
export function FullscreenButton() {
  const open = () => {
    const ed = document.getElementById('ed') as HTMLIFrameElement;
    if (ed.requestFullscreen) ed.requestFullscreen().catch(() => window.open('/editor/index.html', '_blank'));
    else window.open('/editor/index.html', '_blank');
  };
  return <button type="button" className="btn sm" id="fs" onClick={open}>전체화면</button>;
}
