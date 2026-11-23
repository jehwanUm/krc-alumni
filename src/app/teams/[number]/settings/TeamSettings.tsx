'use client';
import { useState } from 'react';

type P = { n: number; name: string; seasons: number[]; school: string; region: string; sponsors: string[]; logo: string; ownLogo: boolean };
const pick = (set: (u: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) set(URL.createObjectURL(f)); };

// 팀 설정 미리보기: 왼쪽 입력, 오른쪽 팀 페이지 머리글 미리보기. 저장 버튼은 꺼 둠
export function TeamSettings(p: P) {
  const [school, setSchool] = useState(p.school), [region, setRegion] = useState(p.region);
  const [logo, setLogo] = useState(p.logo), [robot, setRobot] = useState('');
  const [intro, setIntro] = useState(''), [robotName, setRobotName] = useState('');
  const [sponsors, setSponsors] = useState<string[]>(p.sponsors), [sp, setSp] = useState('');
  const [links, setLinks] = useState({ instagram: '', youtube: '', web: '', email: '' });
  const org = [school, region].filter(Boolean).join(' · ');

  return (
    <div className="tset">
      <form className="f" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="full"><legend>§01 기본 정보</legend><div className="grid">
          <label className="full">팀 이름 <small>FTC 공식 등록 이름이라 여기서 못 바꿔요</small><input value={`${p.n} ${p.name}`} disabled /></label>
          <label>학교 · 소속<input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="예: 대영중학교" maxLength={80} /></label>
          <label>지역<input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 경북 영주" maxLength={40} /></label>
        </div></fieldset>

        <fieldset className="full"><legend>§02 팀 로고</legend><div className="grid">
          <div className="full up">
            <img className="logo-pv" src={logo} width="88" height="88" alt="" />
            <label className="btn">로고 올리기<input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={pick(setLogo)} hidden /></label>
            <small>정사각형 PNG·JPG·SVG, 1MB 이하. {p.ownLogo ? '지금 로고가 등록돼 있어요.' : '지금은 기본 KRC 로고가 보여요.'}</small>
          </div>
        </div></fieldset>

        <fieldset className="full"><legend>§03 팀 소개 · 로봇</legend><div className="grid">
          <label className="full">팀 소개 <small>{intro.length}/500</small><textarea value={intro} onChange={(e) => setIntro(e.target.value.slice(0, 500))} rows={5} placeholder="우리 팀은 어떤 팀인가요? 언제 만들어졌고, 무엇을 잘하고, 이번 시즌 목표는 뭔가요?" /></label>
          <label>올해 로봇 이름<input value={robotName} onChange={(e) => setRobotName(e.target.value)} placeholder="예: 버즈비 3호" maxLength={40} /></label>
          <div className="up">
            {robot ? <img className="robot-pv" src={robot} alt="" /> : <div className="robot-pv ph">로봇 사진</div>}
            <label className="btn">사진 올리기<input type="file" accept="image/png,image/jpeg" onChange={pick(setRobot)} hidden /></label>
          </div>
          <small className="full">사진에 학생 얼굴이 크게 나오면 팀원 동의를 받고 올려 주세요.</small>
        </div></fieldset>

        <fieldset className="full"><legend>§04 SNS · 연락</legend><div className="grid">
          {([['instagram', '인스타그램', 'https://instagram.com/…'], ['youtube', '유튜브', 'https://youtube.com/@…'], ['web', '홈페이지', 'https://…'], ['email', '공개 연락 이메일', 'team@example.com']] as const).map(([k, l, ph]) => (
            <label key={k}>{l}<input value={links[k]} onChange={(e) => setLinks({ ...links, [k]: e.target.value })} placeholder={ph} type={k === 'email' ? 'email' : 'url'} /></label>
          ))}
          <small className="full">공개 연락 이메일은 팀 페이지에 그대로 보여요. 개인 이메일 대신 팀 계정을 권해요.</small>
        </div></fieldset>

        <fieldset className="full"><legend>§05 후원사</legend><div className="grid">
          <div className="full chips">{sponsors.length ? sponsors.map((s) => <span key={s} className="chip">{s}<button type="button" aria-label={`${s} 빼기`} onClick={() => setSponsors(sponsors.filter((x) => x !== s))}>×</button></span>) : <span className="dim">등록된 후원사가 없어요.</span>}</div>
          <label className="full">후원사 추가<span className="addrow"><input value={sp} onChange={(e) => setSp(e.target.value)} placeholder="예: 노벨리스 코리아" maxLength={60} /><button type="button" className="btn" onClick={() => { const v = sp.trim(); if (v && !sponsors.includes(v)) setSponsors([...sponsors, v]); setSp(''); }}>추가</button></span></label>
          <small className="full">새 후원사는 운영진이 확인한 뒤 팀 페이지와 후원 기업 페이지에 나와요.</small>
        </div></fieldset>

        <fieldset className="full"><legend>§06 공개 오토 · 팀원</legend><div className="grid">
          <p className="full">오토 경로 저장과 공개 범위는 <a href="/auto">오토 페이지</a>에서 정해요.</p>
          <p className="full dim">팀원 목록: 이 팀으로 승인된 회원이 여기 보이고, 팀 관리자가 팀원을 내보내거나 다른 팀원에게 관리 권한을 줄 수 있어요.</p>
        </div></fieldset>

        <button className="btn pri full" disabled>저장 (미리보기라 꺼져 있어요)</button>
      </form>

      <aside className="pv" aria-label="팀 페이지 미리보기">
        <span className="label">팀 페이지에서 이렇게 보여요</span>
        <div className="pv-head">
          <img src={logo} width="64" height="64" alt="" />
          <div><b>{p.n} {p.name}</b>{org && <span>{org}</span>}{sponsors.length > 0 && <span className="by">Supported by {sponsors.join(' · ')}</span>}</div>
        </div>
        {robot && <img className="pv-robot" src={robot} alt="" />}
        {robotName && <p className="pv-rn">{robotName}</p>}
        <p className={intro ? '' : 'dim'}>{intro || '팀 소개가 여기에 나와요.'}</p>
        <p className="pv-links">{Object.entries(links).filter(([, v]) => v).map(([k]) => ({ instagram: '인스타그램', youtube: '유튜브', web: '홈페이지', email: '이메일' } as Record<string, string>)[k]).join(' · ')}</p>
      </aside>
    </div>
  );
}
