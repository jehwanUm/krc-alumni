'use client';
import { useEffect } from 'react';
import { T, states, hideFuturePlayoffs, matchKey, type M, type Live } from '@/lib/livestate';
import { pushSupported, isIOS, standalone, pushTeam, enablePush, disablePush } from '@/lib/pushClient';

// 대회 Live 화면: /api/live를 30초마다 불러 서버가 만든 빈 칸(#main2, #other, #mine)을 채운다. 페이지를 떠나면 타이머를 멈춘다.
function start(): (() => void) | undefined {

  const main = document.querySelector<HTMLElement>('main.pg-live')!;
  const params = new URLSearchParams(location.search);
  const replayAt = params.get('replay');
  if (main.dataset.live !== '1' && !replayAt) return;
  document.getElementById('normal')!.hidden = true;
  document.getElementById('live')!.hidden = false;
  return startLive();

  function startLive() {
    const $ = (id: string) => document.getElementById(id)!;
    const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
    const loaded = Date.now(), base = replayAt ? T(replayAt.length === 16 ? replayAt + ':00' : replayAt) : NaN;
    const now = () => (replayAt ? base + (Date.now() - loaded) : Date.now());   // 리허설: 정한 시각부터 실제 속도로 흐른다
    const hm = (ms: number) => new Date(ms).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
    let mine = 0; try { mine = Number(localStorage.getItem('krc-team')) || 0; } catch {}
    // 팀 QR(/live?team=번호)로 들어오면 그 팀을 우리 팀으로
    const qTeam = Number(params.get('team'));
    if (Number.isInteger(qTeam) && qTeam > 0) { mine = qTeam; try { localStorage.setItem('krc-team', String(mine)); } catch {} }
    ($('my') as HTMLInputElement).value = mine ? String(mine) : '';
    let tab = '';   // 경기 탭 (처음엔 우리 팀이 있으면 내 경기, 없으면 남은 경기)
    let last: Live | null = null; try { last = JSON.parse(localStorage.getItem('krc-live') || 'null'); } catch {}

    // 경기 간격: 최근 시작한 경기들의 시작 간격 중앙값 (없으면 6분)
    function cycle(ms: M[], t: number) {
      const st = ms.map((m) => T(m.actual)).filter((x) => x <= t).sort((a, b) => a - b).slice(-7);
      const gaps = st.slice(1).map((x, i) => x - st[i]).filter((g) => g > 60e3 && g < 20 * 60e3).sort((a, b) => a - b);
      return gaps.length ? gaps[gaps.length >> 1] : 6 * 60e3;
    }
    // 우리 팀은 형광펜
    const hl = (n: number) => (n === mine ? `<mark class="hl">${n}</mark>` : String(n));
    // 번호와 팀명이 같이 나오면 둘을 함께 형광펜
    const teamLink = (n: number, names: Record<number, string>) => { const x = `${n}${names[n] ? ' ' + esc(names[n]) : ''}`; return `<a href="/teams/${n}">${n === mine ? `<mark class="hl">${x}</mark>` : x}</a>`; };
    const nums = (ts: number[]) => ts.map(hl).join(' · ');
    // 경기 호출(웹 푸시): 아이폰은 홈 화면 앱에서만 된다
    const pushBtn = () => (!pushSupported() || (isIOS() && !standalone()) ? '' : pushTeam() === mine
      ? '<button class="btn" data-push="off">🔔 호출 켜짐 · 끄기</button>' : '<button class="btn pri" data-push="on">🔔 경기 호출 받기</button>');
    const pushHint = () => `<p class="hint">${isIOS() && !standalone() ? '아이폰은 공유 버튼 → 「홈 화면에 추가」 → 홈 화면의 KRC 아이콘으로 열면 「경기 호출 받기」가 생겨요.'
      : !pushSupported() ? '이 브라우저는 경기 호출을 받을 수 없어요. 크롬이나 사파리에서 열어 주세요.'
      : pushTeam() === mine ? '우리 경기 2경기 전, 바로 앞 경기가 시작될 때 이 휴대폰으로 호출이 와요. 대기석 도착이 체크되면 두 번째 호출은 오지 않아요.'
      : '우리 경기 2경기 전과 바로 앞 경기가 시작될 때 휴대폰으로 알려 줘요. 화면이 꺼져 있어도 와요.'}</p>`;
    const divLabel = (v: string) => (v ? (v === '결승' ? '결승' : `${v} 디비전`) : '경기');

    function draw(d: Live) {
      const t = now();
      if (replayAt) d = hideFuturePlayoffs(d, t);
      const venues = JSON.parse(main.dataset.venues || '{}');
      if (d.event) { $('ev').textContent = d.event.name; $('meta').textContent = `${venues[d.event.code]?.venue ?? String(d.event.venue ?? '').trim()} · 30초마다 새로 고쳐져요${replayAt ? ' · 리허설(지난 대회 재생)' : ''}`; }
      $('liveClock').textContent = `LIVE · ${hm(t)}${replayAt ? ' (재생)' : ''}`;
      const names: Record<number, string> = Object.fromEntries((d.rankings ?? []).map((r: any) => [r.team, r.name]));
      const divs = [...new Set(d.matches.map((m) => m.div || ''))];
      const byDiv: Record<string, M[]> = Object.fromEntries(divs.map((v) => [v, d.matches.filter((m) => (m.div || '') === v)]));
      const st = Object.fromEntries(divs.map((v) => [v, states(byDiv[v], t)]));
      const stOf = (m: M) => st[m.div || ''](m);
      const isMine = (m: M) => m.red.includes(mine) || m.blue.includes(mine);
      const qdivs = divs.filter((v) => v !== '결승');
      // 결승 단계: 결승이 시작됐거나, 디비전 경기가 모두 끝났을 때
      const finals = byDiv['결승'] ?? [];
      const finalsPhase = finals.length > 0 && (finals.some((m) => stOf(m) !== 'wait') || qdivs.every((v) => byDiv[v].every((m) => stOf(m) === 'done')));
      const myDiv = mine ? (d.matches.find((m) => isMine(m) && m.level === 'QUALIFICATION')?.div ?? null) : null;

      // 예상 시각: 끝난 경기는 실제 시작, 남은 경기는 실제 진행 속도로 (본선은 대진표 예정 시각보다 이르지 않게)
      const est = new Map<M, number>();
      for (const v of divs) {
        const ms = byDiv[v], s = st[v], c = cycle(ms, t);
        const dn = ms.filter((m) => s(m) === 'done'), rs = ms.filter((m) => s(m) !== 'done'), p = dn[dn.length - 1];
        dn.forEach((m) => est.set(m, T(m.actual)));
        const b0 = rs[0] && s(rs[0]) === 'live' ? T(rs[0].actual) : p ? Math.max(t, T(p.actual) + c) : Math.max(t, T(rs[0]?.start) || t);
        rs.forEach((m, i) => est.set(m, s(m) === 'live' ? T(m.actual) : Math.max(t, b0 + i * c, m.level !== 'QUALIFICATION' ? T(m.start) || 0 : 0)));
      }
      const whenOf = (m: M) => (stOf(m) === 'live' ? `${hm(T(m.actual))} 시작` : est.get(m)! - t < 60e3 ? '곧 시작' : `약 ${hm(est.get(m)!)}`);
      const vsHtml = (m: M) => `<span class="red">${nums(m.red)}</span> vs <span class="blue">${nums(m.blue)}</span>`;

      // 지금 진행 중: 방금 끝남 → 진행 중(빨간 테두리, 천천히 깜빡임) → 다음 → 그다음
      function nowRows(v: string, compact = false) {
        const ms = byDiv[v], s = st[v];
        const done = ms.filter((m) => s(m) === 'done'), rest = ms.filter((m) => s(m) !== 'done');
        let rows = '';
        const p = done[done.length - 1];
        if (p && !compact) rows += `<div class="mrow"><span class="lbl">방금 끝남</span><span>${esc(p.label ?? p.desc)} · ${vsHtml(p)}</span><span class="num"><span class="red">${p.redScore ?? ''}</span> : <span class="blue">${p.blueScore ?? ''}</span></span></div>`;
        rest.slice(0, compact ? 2 : 3).forEach((m, i) => {
          const lbl = i === 0 ? (s(m) === 'live' ? '진행 중' : '다음') : i === 1 ? '다음' : '그다음';
          rows += `<div class="mrow${i === 0 ? ' cur' : ''}"><span class="lbl">${lbl}</span><span>${esc(m.label ?? m.desc)} · ${vsHtml(m)}</span><span class="num dim">${whenOf(m)}</span></div>`;
        });
        if (!rest.length) rows += '<p class="dim">경기가 모두 끝났어요.</p>';
        return rows;
      }
      const progress = (v: string) => { const q = byDiv[v].filter((m) => m.level === 'QUALIFICATION'); return q.length ? `예선 ${q.filter((m) => stOf(m) === 'done').length}/${q.length}` : ''; };

      // 경기 표 + 탭 (끝난 경기는 누르면 세부 점수)
      const sideBd = (x: any, name: string, cls: string, total: number | null) => `<div class="bs ${cls}"><b>${name} ${total ?? ''}</b><span>오토 ${x.auto} · 텔레옵 ${x.tele} · 페널티 +${x.pen}</span><span class="dim">반칙 마이너 ${x.minor} · 메이저 ${x.major}</span>${x.rp != null ? `<span>RP ${x.rp}${x.rpItems.length ? ' · ' + x.rpItems.join(' · ') : ''}</span>` : ''}</div>`;
      const bdRow = (m: any) => (m.bd ? `<tr class="bd" hidden><td colspan="5"><div class="bdx">${sideBd(m.bd.red, '레드', 'r', m.redScore)}${sideBd(m.bd.blue, '블루', 'b', m.blueScore)}</div></td></tr>` : '');
      const row = (m: M) => {
        const sm = stOf(m), done = sm === 'done';
        const when = done ? `<span class="red">${m.redScore}</span> : <span class="blue">${m.blueScore}</span>` : sm === 'live' ? '<span class="live-t">진행 중</span>' : `<span class="dim">${whenOf(m)}</span>`;
        return `<tr class="${done && (m as any).bd ? 'open-bd' : ''}" data-k="${esc((m.div || '') + '/' + m.desc)}"><td>${esc(m.div || '')}</td><td>${esc(m.label ?? m.desc)}</td><td class="red">${nums(m.red)}</td><td class="blue">${nums(m.blue)}</td><td class="num">${when}</td></tr>${done ? bdRow(m) : ''}`;
      };
      const table = (L: M[], head = '점수 · 예상') => `<div class="tscroll"><table class="tbl mt"><thead><tr><th>구분</th><th>경기</th><th>레드</th><th>블루</th><th>${head}</th></tr></thead><tbody>${L.map(row).join('')}</tbody></table></div>`;
      function matchTabs(scope: M[]) {
        const lists: Record<string, M[]> = { mine: mine ? scope.filter(isMine) : [], rest: scope.filter((m) => stOf(m) !== 'done'), done: scope.filter((m) => stOf(m) === 'done') };
        if (!tab) tab = mine ? 'mine' : 'rest';
        const L = [...lists[tab]].sort((a, b) => (tab === 'done' ? est.get(b)! - est.get(a)! : est.get(a)! - est.get(b)!));
        const btn = (k: string, label: string) => `<button type="button" data-tab="${k}" aria-pressed="${tab === k}">${label}${k === 'mine' && !mine ? '' : ` <span>${lists[k].length}</span>`}</button>`;
        return `<div class="mtabs" role="group" aria-label="경기 보기">${btn('mine', '내 경기')}${btn('rest', '남은 경기')}${btn('done', '끝난 경기')}</div>` +
          (tab === 'mine' && !mine ? '<p class="dim">위에 팀 번호를 넣으면 우리 팀 경기만 모아 보여 줘요.</p>' : !L.length ? '<p class="dim">경기가 없어요.</p>' : table(L, tab === 'done' ? '점수' : tab === 'rest' ? '예상 시각' : '점수 · 예상')) +
          (tab !== 'rest' ? '<p class="dim small">끝난 경기를 누르면 오토·텔레옵·페널티 점수가 펼쳐져요.</p>' : '');
      }
      // 순위: 우리 팀은 행만 노란 배경, Captain 아래에 파란 선. limit이면 위 몇 위만 보이고 펼치기
      function rankTable(v: string, limit = 0) {
        const rs = (d.rankings ?? []).filter((r: any) => (r.div || '') === v);
        // shortcut: 동맹 선택 전에는 동맹 수가 없어 지난 KRC 기준(디비전 6, 단일 대회 4)으로 Captain 선을 긋는다
        const cap = rs[0]?.cap ?? (qdivs.some(Boolean) ? 6 : 4);
        const open = rankOpen.has(v) || !limit;
        const trs = rs.map((r: any, i: number) => `<tr class="${r.team === mine ? 'us' : ''}${r.rank === cap ? ' capline' : ''}"${!open && i >= limit ? ' hidden' : ''}><td class="num">${r.rank <= cap ? `<span class="chip blue">${r.rank}위</span>` : `${r.rank}위`}</td><td><a href="/teams/${r.team}">${r.team} ${esc(r.name ?? '')}</a></td><td class="num">${r.wins}-${r.losses}-${r.ties}</td></tr>`).join('');
        return `<div class="tscroll"><table class="tbl rk"><thead><tr><th>순위</th><th>팀</th><th>승-패-무</th></tr></thead><tbody>${trs}</tbody></table></div>` +
          (limit && rs.length > limit ? `<button type="button" class="more" data-rank="${esc(v)}">${open ? '접기 –' : `전체 ${rs.length}팀 보기 +`}</button>` : '');
      }
      const remember = (id: string) => new Set([...document.querySelectorAll(`#${id} details[open] summary b`)].map((b) => b.textContent));
      const restore = (id: string, open: Set<string | null>) => document.querySelectorAll<HTMLDetailsElement>(`#${id} details`).forEach((x) => { if (open.has(x.querySelector('summary b')!.textContent)) x.open = true; });
      const openMain = remember('main2'), openOther = remember('other');

      // §02 · §03
      if (finalsPhase) {
        const f0 = finals[0], dn = finals.filter((m) => stOf(m) === 'done');
        const rw = dn.filter((m) => m.redScore! > m.blueScore!).length, bw = dn.filter((m) => m.blueScore! > m.redScore!).length;
        // 결승 동맹이 예선을 치른 디비전
        const divOf = (ts: number[]) => qdivs.find((v) => byDiv[v].some((m) => m.level === 'QUALIFICATION' && ts.some((x) => m.red.includes(x) || m.blue.includes(x)))) ?? '';
        const sideF = (ts: number[], cls: string, color: string) => `<div class="fside ${cls}"><span class="tag">${color}${divOf(ts) ? ` · ${esc(divOf(ts))} 우승 동맹` : ''}</span>${ts.map((n) => `<div>${teamLink(n, names)}</div>`).join('')}</div>`;
        $('h2main').textContent = '결승';
        $('main2').innerHTML = `<div class="fboard">${sideF(f0.red, 'r', '레드')}<div class="series"><b>${rw} : ${bw}</b><span>시리즈 · 2선승</span></div>${sideF(f0.blue, 'b', '블루')}</div>` +
          `<div class="now" style="margin-top:16px">${finals.map((m) => { const sm = stOf(m); return `<div class="mrow${sm === 'live' ? ' cur' : ''}"><span class="lbl">${sm === 'done' ? '끝남' : sm === 'live' ? '진행 중' : '남음'}</span><span>${esc(m.label ?? m.desc)}</span><span class="num">${sm === 'done' ? `<span class="red">${m.redScore}</span> : <span class="blue">${m.blueScore}</span>` : sm === 'live' ? `<span class="live-t">진행 중 · ${hm(T(m.actual))} 시작</span>` : `<span class="dim">필요하면 · ${whenOf(m)}</span>`}</span></div>`; }).join('')}</div>` +
          `<details style="margin-top:12px"><summary><b>결승 세부 점수</b><span class="dim">끝난 경기를 누르면 오토·텔레옵·페널티</span></summary>${table(finals, '점수')}</details>`;
        // 디비전 결과: 디비전 본선 마지막 경기의 승자·패자
        $('h2other').textContent = '디비전 결과';
        $('other').innerHTML = `<div class="cols2">${qdivs.map((v) => {
          const po = byDiv[v].filter((m) => m.level !== 'QUALIFICATION' && stOf(m) === 'done');
          const fm = po[po.length - 1];
          const [win, lose] = fm ? (fm.redScore! > fm.blueScore! ? [fm.red, fm.blue] : [fm.blue, fm.red]) : [[], []];
          return `<div class="box"><div class="divhead"><h4 style="margin:0">${esc(divLabel(v))}</h4>${v === myDiv ? '<span class="divtag">우리 디비전</span>' : ''}</div>
            <p style="margin:10px 0 4px"><span class="dim">우승</span> ${win.map((n) => teamLink(n, names)).join(' · ') || '–'}</p><p><span class="dim">결승</span> ${lose.map((n) => teamLink(n, names)).join(' · ') || '–'}</p>
            <details><summary><b>${esc(v)} 순위</b><span class="dim">${(d.rankings ?? []).filter((r: any) => (r.div || '') === v).length}팀</span></summary>${rankTable(v)}</details></div>`;
        }).join('')}</div>`;
      } else if (myDiv !== null) {
        // 우리 디비전이 메인
        $('h2main').textContent = myDiv ? divLabel(myDiv) : '지금 진행 중';
        $('main2').innerHTML = `<div class="divhead">${myDiv ? '<span class="divtag">우리 디비전</span>' : ''}<span class="dim">${progress(myDiv)}</span></div>
          <div class="two"><div><h4>지금 진행 중</h4><div class="now">${nowRows(myDiv)}</div><div style="margin-top:20px">${matchTabs(byDiv[myDiv])}</div></div>
          <div><h4>순위 <span class="dim small" style="font-weight:400">· 파란 선 위가 Captain${replayAt ? ' · 최종 기준' : ''}</span></h4>${rankTable(myDiv, 12)}</div></div>`;
        const others = qdivs.filter((v) => v !== myDiv);
        $('h2other').textContent = '다른 디비전';
        $('other').innerHTML = others.length ? others.map((v) => `<div class="box"><div class="divhead"><h4 style="margin:0">${esc(divLabel(v))}</h4><span class="dim">${progress(v)}</span></div>
          <div class="now" style="margin-top:10px">${nowRows(v, true)}</div>
          <details style="margin-top:10px"><summary><b>${esc(v)} 경기 목록</b><span class="dim">${byDiv[v].length}경기</span></summary>${table(byDiv[v])}</details>
          <details><summary><b>${esc(v)} 순위</b><span class="dim">${(d.rankings ?? []).filter((r: any) => (r.div || '') === v).length}팀</span></summary>${rankTable(v)}</details></div>`).join('') +
          (finals.length ? '<p class="dim small" style="margin-top:12px">결승은 두 디비전 우승 동맹이 만나는 경기라, 디비전 본선이 끝나면 맨 위로 올라와요.</p>' : '')
          : '';
      } else {
        // 우리 팀을 안 골랐을 때: 디비전을 나란히
        $('h2main').textContent = '지금 진행 중';
        $('main2').innerHTML = `<div class="cols2">${qdivs.map((v) => `<div class="box"><div class="divhead"><h4 style="margin:0">${esc(divLabel(v))}</h4><span class="dim">${progress(v)}</span></div><div class="now" style="margin-top:10px">${nowRows(v)}</div></div>`).join('')}</div><div style="margin-top:20px">${matchTabs(d.matches)}</div>`;
        $('h2other').textContent = '순위';
        $('other').innerHTML = qdivs.map((v) => `<details><summary><b>${esc(v ? v + ' 디비전 순위' : '순위')}</b><span class="dim">${replayAt ? '최종 기준' : ''}</span></summary>${rankTable(v)}</details>`).join('');
      }
      // 디비전이 하나뿐인 대회(우리 팀 선택 시)는 §03이 비니 숨긴다
      $('other').closest('section')!.hidden = !$('other').innerHTML.trim();
      restore('main2', openMain); restore('other', openOther);
      document.querySelectorAll<HTMLElement>('#live tr.open-bd').forEach((tr) => { if (openRows.has(tr.dataset.k!)) (tr.nextElementSibling as HTMLElement).hidden = false; });

      // §01 우리 팀
      if (!mine) $('mine').innerHTML = '<p class="dim">팀 번호를 넣으면 우리 디비전이 맨 위로 오고, 다음 경기·동맹·남은 시간이 나와요.</p>';
      else {
        const ours = d.matches.filter(isMine);
        if (!ours.length) $('mine').innerHTML = `<p class="dim">${mine}팀의 경기가 이 대회에 없어요.</p>`;
        else {
          const next = ours.find((m) => stOf(m) !== 'done');
          const done = ours.filter((m) => stOf(m) === 'done');
          const w = done.filter((m) => (m.redScore! > m.blueScore!) === m.red.includes(mine)).length;
          let lead = '<div class="box lead"><span class="label">다음 경기</span><div class="cd">남은 경기 없음</div></div>';
          if (next) {
            const v = next.div || '', ms = byDiv[v], s = st[v];
            const curIdx = ms.findIndex((m) => s(m) !== 'done'), ahead = ms.indexOf(next) - curIdx;
            const red = next.red.includes(mine), ally = red ? next.red : next.blue, opp = red ? next.blue : next.red;
            const eta = s(next) === 'live' ? 0 : est.get(next)! - t;
            const fin = v === '결승', fd = finals.filter((m) => stOf(m) === 'done');
            const my = fd.filter((m) => (m.redScore! > m.blueScore!) === m.red.includes(mine)).length;
            const here = (d.arrived ?? []).includes(`${matchKey(next)}|${mine}`);   // 심판이 대기석 도착을 체크함
            lead = `<div class="box lead"><span class="label">다음 경기${v ? ` · ${esc(divLabel(v))}` : ''} · ${red ? '레드' : '블루'} 동맹</span>
              <div class="cd">${s(next) === 'live' ? '진행 중' : eta < 60e3 ? '곧 시작' : `약 ${Math.round(eta / 60e3)}분 후`}</div>
              <p style="margin:0">${esc(next.label ?? next.desc)}${fin ? ` · 결승 시리즈 <b>${my} : ${fd.length - my}</b> · 2승하면 우승` : ` · ${ahead > 0 ? `실제 진행 기준 <b>${ahead}경기 전</b>` : '<b>바로 다음 경기</b>'}${next.start ? ` · 대진표 예정 ${hm(T(next.start))}` : ''}`}</p>
              <div class="vs"><div class="side ${red ? 'r' : 'b'}"><span>동맹</span>${ally.map((n) => teamLink(n, names)).join('')}</div><div class="side ${red ? 'b' : 'r'}"><span>상대</span>${opp.map((n) => teamLink(n, names)).join('')}</div></div>
              ${here ? '<p class="arrived">✓ 대기석 도착 확인됨</p>' : ''}
              <div class="btns">${pushBtn()}<button class="btn" disabled title="오토 공유 기능 이후">동맹 Ghost 보기</button></div>${pushHint()}</div>`;
          }
          const qd = done.filter((m) => m.level === 'QUALIFICATION'), qw = qd.filter((m) => (m.redScore! > m.blueScore!) === m.red.includes(mine)).length;
          const rank = (d.rankings ?? []).find((r: any) => r.team === mine);
          $('mine').innerHTML = `<div class="mine">${lead}<div class="box"><span class="label">우리 팀 · ${mine} ${esc(names[mine] ?? '')}</span>
            <dl class="kv" style="margin-top:10px"><dt>예선</dt><dd>${esc(myDiv ? myDiv + ' 디비전 · ' : '')}${qd.length}경기 ${qw}승 ${qd.length - qw}패</dd><dt>남은 예선</dt><dd>${ours.filter((m) => m.level === 'QUALIFICATION' && stOf(m) !== 'done').length}경기</dd>${done.length > qd.length ? `<dt>본선·결승</dt><dd>${done.length - qd.length}경기 ${w - qw}승</dd>` : ''}${rank && !replayAt ? `<dt>현재 순위</dt><dd>${rank.rank}위</dd>` : ''}</dl></div></div>`;
        }
      }
      // §04 운영 일정: 지금 순서 표시
      const items = [...document.querySelectorAll<HTMLElement>('#ops li')];
      const curOp = items.reduce((a, li, i) => (T(li.dataset.t!) <= t ? i : a), -1);
      items.forEach((li, i) => (li.className = i < curOp ? 'done' : i === curOp ? 'on' : ''));
    }

    async function load() {
      try {
        const r = await fetch('/api/live');
        const d: Live = await r.json();
        if (d.error) throw new Error(d.error);
        last = d; draw(d);
        try { if (!replayAt) localStorage.setItem('krc-live', JSON.stringify(d)); } catch {}
      } catch (e) {
        // 대회장 인터넷이 끊겨도 마지막으로 받은 화면은 그대로 둔다
        if (!last) $('main2').innerHTML = `<p class="note">대회 데이터를 불러오지 못했어요. ${esc((e as Error).message)}</p>`;
        else $('meta').textContent = '연결이 끊겨 마지막 화면을 보여 주고 있어요';
      }
    }
    // 세부 점수 펼침: 다시 그려도 펼친 경기는 펼친 채로
    const openRows = new Set<string>(), rankOpen = new Set<string>();
    $('live').addEventListener('click', (e) => {
      const pb = (e.target as HTMLElement).closest<HTMLElement>('[data-push]');
      if (pb) {
        pb.setAttribute('disabled', '');
        (pb.dataset.push === 'on' ? enablePush(mine) : disablePush()).catch((x) => alert((x as Error).message)).finally(() => { if (last) draw(last); });
        return;
      }
      const tb = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
      if (tb) { tab = tb.dataset.tab!; if (last) draw(last); return; }
      const rk = (e.target as HTMLElement).closest<HTMLElement>('[data-rank]');
      if (rk) { const v = rk.dataset.rank!; rankOpen.has(v) ? rankOpen.delete(v) : rankOpen.add(v); if (last) draw(last); return; }
      const tr = (e.target as HTMLElement).closest<HTMLElement>('tr.open-bd');
      if (!tr || (e.target as HTMLElement).closest('a')) return;
      const bd = tr.nextElementSibling as HTMLElement; bd.hidden = !bd.hidden;
      bd.hidden ? openRows.delete(tr.dataset.k!) : openRows.add(tr.dataset.k!);
    });
    $('myform').addEventListener('submit', (e) => {
      e.preventDefault();
      mine = Number(($('my') as HTMLInputElement).value) || 0;
      try { localStorage.setItem('krc-team', String(mine)); } catch {}
      // 호출을 켜 둔 휴대폰이면 새 팀으로 옮긴다
      if (pushTeam() && pushTeam() !== mine && mine) enablePush(mine).catch(() => {});
      if (last) draw(last);
    });
    if (last && !replayAt) draw(last);
    load();
    const timers = [
      setInterval(() => { if (!document.hidden) load(); }, 30000),
      setInterval(() => { if (last && !document.hidden) draw(last); }, 15000),   // 남은 시간은 데이터가 안 바뀌어도 흐른다
    ];
    return () => timers.forEach(clearInterval);
  }
}

export function LiveBoot() {
  useEffect(start, []);
  return null;
}
