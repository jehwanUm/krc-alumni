import Link from 'next/link';
import { meta } from '@/lib/meta';
import { PRIVACY_OWNER, PRIVACY_EMAIL, DISCORD_URL } from '@/lib/nav';

// 개인정보처리방침. 바뀌면 시행일을 새로 적고 이전 내용은 git 기록으로 남긴다
export const metadata = meta('/privacy');
const SINCE = '2026-11-23';

export default function Page() {
  return (
    <main className="pg-privacy">
      <section className="page-head"><div className="in">
        <span className="label">Privacy</span>
        <h1>개인정보처리방침</h1>
        <p>KRC 동문회(이하 「동문회」)는 홈페이지 회원과 이용자의 개인정보를 아래처럼 다뤄요. 시행일: {SINCE}</p>
      </div></section>

      <section className="sec"><div className="in"><div><span className="label">§01</span><h2>모으는 정보와 목적</h2></div><div className="body">
        <table className="tbl"><thead><tr><th>구분</th><th>항목</th><th>목적</th></tr></thead><tbody>
          <tr><td>회원가입 (필수)</td><td>이름, 학교, 소속 팀 이름, 팀 인증 신청 내용, 이메일, 비밀번호(암호화해서 저장)</td><td>KRC 참가 여부 확인, 로그인, 동문회 안내</td></tr>
          <tr><td>회원가입 (선택)</td><td>역할, 간단 소개</td><td>회원 소개</td></tr>
          <tr><td>참가 증빙 (졸업생, 요청 시)</td><td>대회 사진·상장·참가 확인서 등 본인이 보낸 자료</td><td>KRC 참가 사실 확인. 확인이 끝나면 보관하지 않아요</td></tr>
          <tr><td>경기 호출 알림</td><td>팀 번호, 브라우저 알림 주소</td><td>대회 날 우리 팀 경기 차례 알림. 이름·전화번호는 받지 않아요</td></tr>
          <tr><td>자동으로 생기는 정보</td><td>로그인 쿠키, 이 기기에 저장한 팀 번호·오토 경로</td><td>로그인 유지, 화면 설정. 기기 안에만 있거나 30일 뒤 만료돼요</td></tr>
        </tbody></table>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§02</span><h2>보관 기간과 파기</h2></div><div className="body">
        <p>회원 정보는 탈퇴할 때까지 보관하고, 탈퇴하면 바로 지워요. 가입 신청이 거절되면 6개월 안에 지워요. 경기 호출 정보는 알림을 끄거나 대회 시즌이 끝나면 지워요.</p>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§03</span><h2>제3자 제공 · 처리 위탁</h2></div><div className="body">
        <p>개인정보를 다른 곳에 팔거나 제공하지 않아요. 홈페이지 운영을 위해 아래 서비스에 저장·처리를 맡겨요. 이 서비스들은 해외 클라우드 서버를 쓰기 때문에 정보가 국외에서 저장될 수 있어요.</p>
        <ul><li>Supabase — 회원·알림 정보 저장</li><li>Vercel — 홈페이지 호스팅</li><li>Resend — 가입 승인 알림 메일 발송 (메일을 켠 경우)</li></ul>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§04</span><h2>내 정보 보기 · 고치기 · 지우기</h2></div><div className="body">
        <p>로그인한 뒤 <Link href="/login">내 계정</Link>에서 정보를 고치거나 탈퇴할 수 있어요. 그 밖의 요청은 아래 연락처로 알려 주세요.</p>
        <p>만 14세 미만은 회원으로 가입할 수 없어요.</p>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§05</span><h2>개인정보 보호책임자</h2></div><div className="body">
        {PRIVACY_OWNER || PRIVACY_EMAIL
          ? <p>{PRIVACY_OWNER} {PRIVACY_EMAIL && <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>}</p>
          : <p>KRC 동문회 운영진 — {DISCORD_URL ? <a href={DISCORD_URL} rel="external">동문회 Discord</a> : '동문회 Discord'}로 문의해 주세요.</p>}
      </div></div></section>
    </main>
  );
}
