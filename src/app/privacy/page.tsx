import Link from 'next/link';
import { meta } from '@/lib/meta';
import { PRIVACY_OWNER, PRIVACY_EMAIL } from '@/lib/nav';

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
        <div className="tscroll"><table className="tbl"><thead><tr><th>구분</th><th>항목</th><th>목적</th></tr></thead><tbody>
          <tr><td>회원가입 (필수)</td><td>이름, 학교, 소속 팀 이름, 팀 인증 신청 내용, 이메일, 비밀번호(암호화해서 저장)</td><td>KRC 참가 여부 확인, 로그인, 동문회 안내</td></tr>
          <tr><td>회원가입 (선택)</td><td>역할, 간단 소개</td><td>회원 소개</td></tr>
          <tr><td>팀 페이지 공개 (선택)</td><td>이름, 역할, 팀장 여부</td><td>본인이 「팀 페이지에 공개」를 켠 경우에만 팀 페이지에 보여요. 언제든 끌 수 있어요</td></tr>
          <tr><td>팀 설정 (팀장)</td><td>팀 소개, 로봇·로고 사진, 팀 SNS·공개 연락 이메일</td><td>팀 페이지 공개</td></tr>
          <tr><td>참가 증빙 (졸업생, 요청 시)</td><td>대회 사진·상장·참가 확인서 등 본인이 보낸 자료</td><td>KRC 참가 사실 확인. 확인이 끝나면 보관하지 않아요</td></tr>
          <tr><td>경기 호출 알림</td><td>팀 번호, 브라우저 알림 주소</td><td>대회 날 우리 팀 경기 차례 알림. 이름·전화번호는 받지 않아요</td></tr>
          <tr><td>가입 시도 기록</td><td>접속 주소(IP)를 바꿔 만든 값 — 원래 주소는 저장하지 않아요</td><td>자동 가입 스팸 막기. 하루 뒤 지워요</td></tr>
          <tr><td>오토 경로 (팀원)</td><td>경로 이름, 경로 데이터, 저장한 사람 이메일</td><td>팀 경로 저장·공유. 공개 범위는 팀이 정해요</td></tr>
          <tr><td>자동으로 생기는 정보</td><td>로그인 쿠키, 이 기기에 저장한 팀 번호·오토 경로</td><td>로그인 유지, 화면 설정. 기기 안에만 있거나 30일 뒤 만료돼요</td></tr>
        </tbody></table></div>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§02</span><h2>보관 기간과 파기</h2></div><div className="body">
        <ul>
          <li>회원 정보는 탈퇴할 때까지 보관하고, 탈퇴하면 바로 지워요. 가입 신청이 거절되면 6개월 안에 지워요. 경기 호출 정보는 알림을 끄거나 대회 시즌이 끝나면 지워요. 가입 시도 기록은 하루 뒤에 지워요.</li>
          <li>탈퇴하거나 보관 기간이 끝나면 지체 없이(원칙적으로 5일 안에) 파기해요. 전자 파일은 복구할 수 없는 방법으로 영구 삭제하고, 종이 문서가 있다면 분쇄해요.</li>
          <li>졸업생이 보낸 참가 증빙 자료는 확인하면 메일함 휴지통과 내려받은 파일까지 바로 영구 삭제하고, 이름을 가린 파기 기록만 남겨요.</li>
          <li>탈퇴해도 팀 페이지에 올린 팀 소개·사진과 팀이 공유한 오토 경로는 팀 활동을 위해 남을 수 있어요. 여기에 남은 작성자 이메일은 탈퇴할 때 지워요.</li>
        </ul>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§03</span><h2>제3자 제공 · 처리 위탁 · 국외 이전</h2></div><div className="body">
        <p>개인정보를 다른 곳에 팔거나 제공하지 않아요. 홈페이지를 운영하기 위해 아래 해외 클라우드 서비스에 저장·처리를 맡겨요. 서비스를 쓰는 동안 데이터가 네트워크를 통해 수시로 아래 국가의 서버로 전송·저장돼요. 이는 계약 이행을 위한 국외 처리위탁·보관이에요(개인정보 보호법 제28조의8 제1항 제3호).</p>
        <div className="tscroll"><table className="tbl"><thead><tr><th>이전받는 곳</th><th>국가</th><th>이전 항목</th><th>목적 · 보유 기간</th></tr></thead><tbody>
          <tr><td>Supabase Inc.<br /><a href="mailto:privacy@supabase.com">privacy@supabase.com</a></td><td>싱가포르</td><td>회원가입 정보(이름·학교·팀·이메일·암호화한 비밀번호), 팀 사진·소개, 경기 호출 알림 정보, 오토 경로, 가입 시도 기록</td><td>데이터베이스·파일 저장 / 회원 탈퇴 또는 위탁 계약 종료 때까지</td></tr>
          <tr><td>Vercel Inc.<br /><a href="mailto:privacy@vercel.com">privacy@vercel.com</a></td><td>대한민국(서울 리전)에서 실행, 회사는 미국</td><td>접속 기록, 로그인 쿠키, 화면을 만드는 과정의 데이터</td><td>홈페이지 호스팅·전송 / 서비스 종료 또는 위탁 계약 종료 때까지</td></tr>
        </tbody></table></div>
        <p className="dim small">가입 승인 알림 메일을 켜면 메일 발송 서비스를 이 표에 추가하고 미리 알려 드려요.</p>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§04</span><h2>개인정보를 안전하게 지키는 방법</h2></div><div className="body">
        <ul>
          <li>비밀번호는 운영진도 원래 내용을 알 수 없도록 단방향 암호화(해시)해서 저장해요.</li>
          <li>비밀번호를 잊으면 한 번만 쓸 수 있고 30분 뒤 만료되는 재설정 링크를 발급해요. 비밀번호를 여러 번 틀리면 로그인을 잠시 막아요.</li>
          <li>모든 통신은 HTTPS로 암호화하고, 개인정보에 접근할 수 있는 운영진 계정을 최소 인원으로 제한해요.</li>
          <li>데이터 백업은 강력한 암호로 잠근(AES-256) 파일로만 운영진 기기에 보관하고, 30일이 지나면 영구 삭제해요.</li>
          <li>홈페이지 오류가 나면 운영진 메신저(텔레그램)로 알림이 가는데, 이때 이메일·주소·토큰 같은 개인정보는 자동으로 지우고 오류 종류와 위치만 보내요.</li>
        </ul>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§05</span><h2>내 정보 보기 · 고치기 · 지우기</h2></div><div className="body">
        <ul>
          <li>로그인한 뒤 <Link href="/login">내 계정</Link>에서 내 정보를 보고 고치거나 탈퇴(삭제)할 수 있어요.</li>
          <li>회원 본인뿐 아니라 법정대리인(부모님)도 아래 이메일로 정보 열람·정정·삭제를 요청할 수 있어요. 요청을 받으면 10일 안에 처리 결과를 알려 드려요.</li>
          <li>만 14세 미만은 회원으로 가입할 수 없어요.</li>
        </ul>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§06</span><h2>운영 주체와 개인정보 보호책임자</h2></div><div className="body">
        <ul>
          <li>운영 주체: KRC 동문회 운영진 (비법인 임의단체, 창의공학교육협회와 별도로 운영)</li>
          <li>개인정보 보호책임자: {PRIVACY_OWNER ? `${PRIVACY_OWNER} (KRC 동문회 운영진)` : 'KRC 동문회 운영진'} {PRIVACY_EMAIL && <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>} <span className="dim">(창의공학교육협회와 업무 협력을 위해, 협회의 확인을 받아 협회 도메인 메일을 함께 써요)</span></li>
        </ul>
      </div></div></section>

      <section className="sec"><div className="in"><div><span className="label">§07</span><h2>개인정보 침해 신고·상담</h2></div><div className="body">
        <p>개인정보 침해로 도움이 필요하면 아래 기관에 문의할 수 있어요.</p>
        <ul>
          <li>개인정보분쟁조정위원회: 1833-6972 (<a href="https://www.kopico.go.kr" rel="external">www.kopico.go.kr</a>)</li>
          <li>개인정보침해신고센터: 118 (<a href="https://privacy.kisa.or.kr" rel="external">privacy.kisa.or.kr</a>)</li>
          <li>대검찰청: 1301 (<a href="https://www.spo.go.kr" rel="external">www.spo.go.kr</a>)</li>
          <li>경찰청: 182 (<a href="https://ecrm.police.go.kr" rel="external">ecrm.police.go.kr</a>)</li>
        </ul>
      </div></div></section>

    </main>
  );
}
