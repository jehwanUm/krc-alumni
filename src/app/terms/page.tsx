import Link from 'next/link';
import { meta } from '@/lib/meta';
import { PRIVACY_EMAIL } from '@/lib/nav';

// 이용약관. 바뀌면 시행일을 새로 적고 이전 내용은 git 기록으로 남긴다
export const metadata = meta('/terms');
const SINCE = '2026-11-23';

const S = ({ n, t, children }: { n: string; t: string; children: React.ReactNode }) => (
  <section className="sec"><div className="in"><div><span className="label">§{n}</span><h2>{t}</h2></div><div className="body">{children}</div></div></section>
);

export default function Page() {
  return (
    <main className="pg-terms">
      <section className="page-head"><div className="in">
        <span className="label">Terms</span>
        <h1>이용약관</h1>
        <p>KRC 동문회(이하 「동문회」) 홈페이지를 쓰는 규칙이에요. 시행일: {SINCE}</p>
      </div></section>

      <S n="01" t="이 홈페이지는">
        <p>KRC(Korea Robot Championship)에 참가했거나 참가하는 학생과 동문을 위해 KRC 동문회 운영진이 무료로 운영해요. 대회 정보, 팀 페이지, 오토 경로 도구, 학습 자료를 제공해요.</p>
      </S>
      <S n="02" t="회원가입과 승인">
        <ul>
          <li>만 14세 이상이고 KRC에 참가했거나 참가하는 사람이 가입할 수 있어요.</li>
          <li>가입하면 운영진이나 그 팀 팀장이 확인한 뒤 승인해요. 참가 사실을 확인할 수 없으면 승인하지 않을 수 있어요.</li>
          <li>가입할 때는 사실대로 적어 주세요. 다른 사람인 척하거나 계정을 다른 사람과 같이 쓰면 안 돼요.</li>
        </ul>
      </S>
      <S n="03" t="팀장과 팀원">
        <ul>
          <li>팀장은 팀 페이지 내용과 우리 팀 가입 신청을 관리해요. 팀장은 운영진이 지정하거나 다른 팀장이 지정해요.</li>
          <li>팀 페이지에 올리는 내용은 팀 전체를 대표해요. 팀원들과 상의하고 올려 주세요.</li>
        </ul>
      </S>
      <S n="04" t="올리는 내용">
        <ul>
          <li>회원이 올린 소개글·사진·로고·오토 경로의 권리는 올린 사람이나 그 팀에 있어요. 동문회는 이 홈페이지에서 보여 주는 데에만 써요.</li>
          <li>다른 사람의 사진·글·로고를 허락 없이 올리면 안 돼요. 학생 얼굴이 크게 나온 사진은 본인 동의를 받고 올려 주세요.</li>
          <li>욕설, 차별, 광고, 개인정보(전화번호·주소 등), 다른 팀을 깎아내리는 내용은 올릴 수 없어요.</li>
          <li>오토 경로의 공개 범위는 팀이 정해요. 「모두에게」로 공개한 경로는 누구나 보고 Ghost로 겹쳐 볼 수 있어요.</li>
        </ul>
      </S>
      <S n="05" t="운영진이 할 수 있는 조치">
        <p>위 규칙에 어긋나는 내용은 운영진이 알리지 않고 숨기거나 지울 수 있어요. 반복되면 팀장 권한이나 회원 승인을 취소할 수 있어요.</p>
      </S>
      <S n="06" t="서비스와 책임">
        <ul>
          <li>대학생 운영진이 운영하는 무료 서비스라 기능이 바뀌거나 잠시 멈출 수 있어요.</li>
          <li>대진표·경기 호출·순위는 FTC 공식 데이터를 옮긴 것이에요. 공식 결과는 대회 운영 측 발표가 우선이에요. 경기 호출이 늦거나 오지 않을 수 있으니 대회장 안내도 함께 확인해 주세요.</li>
          <li>오토 경로와 기리고차 코드는 참고용이에요. 로봇에 쓸 때는 팀이 직접 시험하고 안전을 확인해 주세요.</li>
        </ul>
      </S>
      <S n="07" t="문의">
        <p>{PRIVACY_EMAIL ? <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> : '동문회 운영진'}로 알려 주세요. 개인정보는 <Link href="/privacy">개인정보처리방침</Link>을 따라요.</p>
      </S>
    </main>
  );
}
