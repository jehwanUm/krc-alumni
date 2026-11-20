import { meta } from '@/lib/meta';
import Doc from '../Doc';
import { CODE_GROUPS } from '../codes';

export const metadata = meta('/learn/girigocha/codes');

export default function Page() {
  return (
    <Doc path="/learn/girigocha/codes" lead="Driver Station 화면에 [오류 GRG-E101]처럼 나오는 코드의 뜻과 고치는 법이에요. E 오류 · W 경고 · L 위치 센서 이상 · I 알림.">
      <p>「X」 표시가 있는 항목은 「기리고차 점검」에서 게임패드 X를 누르면 설정을 자동으로 고쳐요 (이전 설정은 백업).</p>
      {CODE_GROUPS.map((g) => (
        <section key={g.name}>
          <h2>{g.name}</h2>
          <div className="tscroll">
            <table className="tbl">
              <thead><tr><th>코드</th><th>뜻</th><th>고치는 법</th><th>X</th></tr></thead>
              <tbody>
                {g.rows.map((r, i) => (
                  <tr key={r.code + i} id={r.code}>
                    <td className="num">{r.code}</td><td>{r.what}</td><td>{r.fix}</td><td>{r.auto ? 'X' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </Doc>
  );
}
