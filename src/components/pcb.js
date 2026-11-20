// 홈 배경 회로 기판: 동문회는 기판, 팀은 그 위에 놓이는 부품. 부품이 놓일 때마다 배선이 이어지고 신호가 흐른다.
// 어두운 바탕용 색. 홈의 바로가기(.go a)가 기판에 꽂힌 모듈이고, 배선이 그 윗변 핀까지 이어진다.
export function startPcb() {
  var cv = document.getElementById('pcb'); if (!cv) return;
  var x = cv.getContext('2d'), stop = false, raf = 0, W = 0, H = 0, dpr = 1;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = { ink: '233,236,241', blue: '76,141,255', red: '240,86,91', yel: '245,197,66', mut: '138,146,160' };
  var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(11);
  var GRID = 12;                                   // 배선은 12px 격자 위에서 직각·45°로
  var chips = [], nets = [], pulses = [], blocks = [], cards = [], hot = null, T = 0, nextChip = 0, chipNo = 0, added = 0, MAX_NEW = 3, START = 6;   // 처음 6개, 그 뒤로 새로 생기는 칩은 3개까지 (배경이 번잡하지 않게)
  var snap = function (v) { return Math.round(v / GRID) * GRID; };

  function measure() {
    var br = cv.getBoundingClientRect(); dpr = devicePixelRatio || 1;
    W = br.width; H = br.height; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var rel = function (el, pad) { var r = el.getBoundingClientRect(); return { x: r.left - br.left - pad, y: r.top - br.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 }; };
    blocks = [rel(document.querySelector('.home .hero > div'), 24), rel(document.querySelector('.home .dd'), 18), rel(document.querySelector('.home .go'), 0)];
    cards = Array.prototype.map.call(document.querySelectorAll('.home .go a'), function (el, i) {
      var r = rel(el, 0);
      return { el: el, i: i, r: r, c: el.dataset.c, pins: [0.25, 0.5, 0.75].map(function (f) { return { x: snap(r.x + r.w * f), y: r.y - 6, top: true }; }) };
    });
    
  }
  function free(px, py, w, h) {
    if (px < 8 || py < 8 || px + w > W - 8 || py + h > H - 8) return false;
    for (var i = 0; i < blocks.length; i++) { var b = blocks[i]; if (px < b.x + b.w && px + w > b.x && py < b.y + b.h && py + h > b.y) return false; }
    for (var k = 0; k < chips.length; k++) { var c = chips[k]; if (px < c.x + c.w + 30 && px + w + 30 > c.x && py < c.y + c.h + 30 && py + h + 30 > c.y) return false; }
    return true;
  }
  // A에서 B로: 먼저 수평, 남은 거리만큼 45° 대각선, 마지막 수직
  function route(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, sx = Math.sign(dx) || 1, sy = Math.sign(dy) || 1, d = Math.min(Math.abs(dx), Math.abs(dy)) * .6;
    var p1 = { x: snap(b.x - sx * d - (Math.abs(dx) - d) * .35 * sx), y: a.y }, p2 = { x: snap(p1.x + sx * d), y: snap(a.y + sy * d) };
    return [a, p1, p2, { x: p2.x, y: b.y }, b];
  }
  function hits(p) { for (var i = 1; i < p.length; i++) { var s = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); for (var d = 0; d <= s; d += 6) { var f = s ? d / s : 0, qx = p[i - 1].x + (p[i].x - p[i - 1].x) * f, qy = p[i - 1].y + (p[i].y - p[i - 1].y) * f; for (var k = 0; k < 3; k++) { var b = blocks[k]; if (qx > b.x && qx < b.x + b.w && qy > b.y && qy < b.y + b.h) return true; } } } return false; }
  function len(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); return L; }
  function at(p, d) { for (var i = 1; i < p.length; i++) { var s = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); if (d <= s) { var f = s ? d / s : 0; return { x: p[i - 1].x + (p[i].x - p[i - 1].x) * f, y: p[i - 1].y + (p[i].y - p[i - 1].y) * f }; } d -= s; } return p[p.length - 1]; }
  function pin(c, toward) { var left = toward.x < c.x + c.w / 2, k = Math.floor(rnd() * c.n); return { x: left ? c.x - 6 : c.x + c.w + 6, y: c.y + 6 + k * ((c.h - 12) / Math.max(1, c.n - 1)) }; }

  function place() {
    for (var tries = 0; tries < 60; tries++) {
      var w = snap(36 + rnd() * 36), h = snap(24 + rnd() * 24), px = snap(rnd() * W), py = snap(rnd() * H);
      if (!free(px, py, w, h)) continue;
      var col = rnd() < .22 ? 'blue' : rnd() < .2 ? 'red' : 'ink';
      var c = { x: px, y: py, w: w, h: h, n: Math.max(2, Math.round(h / 10)), born: T, no: ++chipNo, c: col };
      chips.push(c);
      // 가까운 부품 1~2개와 잇고, 가끔은 카드(모듈) 핀까지
      var near = chips.filter(function (o) { return o !== c; }).sort(function (a, b) { return Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y); }).slice(0, 1 + (rnd() < .5 ? 1 : 0));
      near.forEach(function (o) { var a = pin(c, o), b = pin(o, c); var p = route(a, b); if (hits(p)) return; nets.push({ p: p, L: len(p), c: c.c !== 'ink' ? c.c : o.c, born: T, card: null }); });
      if (cards.length && rnd() < .55) {
        var cd = cards.slice().sort(function (a, b) { return Math.hypot(a.r.x + a.r.w / 2 - c.x, a.r.y - c.y) - Math.hypot(b.r.x + b.r.w / 2 - c.x, b.r.y - c.y); })[0];
        var pins = cd.pins.filter(function (q) { return q.top ? c.y < cd.r.y : c.y > cd.r.y + cd.r.h; }); if (!pins.length) pins = cd.pins;
        var q = pins[Math.floor(rnd() * pins.length)], a2 = pin(c, q), p2 = route(a2, { x: q.x, y: q.y + (q.top ? -GRID : GRID) }); p2.push({ x: q.x, y: q.y }); if (!hits(p2))
        nets.push({ p: p2, L: len(p2), c: cd.c, born: T, card: cd.i });
      }
      return true;
    }
    return false;
  }

  function draw(dt) {
    T += dt / 1000; x.clearRect(0, 0, W, H);
    // 기판 바탕: 아주 연한 격자 점 (실크스크린 그리드)
    x.fillStyle = 'rgba(' + C.mut + ',.10)';
    for (var gx = GRID; gx < W; gx += GRID * 4) for (var gy = GRID; gy < H; gy += GRID * 4) x.fillRect(gx, gy, 1.5, 1.5);
    // 배선: 놓인 뒤 0.6초 동안 그려지며 나타남
    nets.forEach(function (n) {
      var grow = Math.min(1, (T - n.born) / .6), lit = hot !== null && n.card === hot;
      x.strokeStyle = 'rgba(' + C[n.c] + ',' + (lit ? .45 : n.c === 'ink' ? .12 : .2) + ')'; x.lineWidth = lit ? 2.5 : 2; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(n.p[0].x, n.p[0].y);
      var d = 0, target = n.L * grow;
      for (var i = 1; i < n.p.length; i++) { var s = Math.hypot(n.p[i].x - n.p[i - 1].x, n.p[i].y - n.p[i - 1].y); if (d + s >= target) { var e = at(n.p, target); x.lineTo(e.x, e.y); break; } x.lineTo(n.p[i].x, n.p[i].y); d += s; }
      x.stroke();
      if (grow >= 1) { [n.p[0], n.p[n.p.length - 1]].forEach(function (v) { x.strokeStyle = 'rgba(' + C.ink + ',.3)'; x.lineWidth = 1.2; x.beginPath(); x.arc(v.x, v.y, 3, 0, 7); x.stroke(); }); }
      // 신호: 배선을 따라 흐르는 작은 펄스
      if (grow >= 1 && pulses.length < 3 && (rnd() < (lit ? .02 : .002))) pulses.push({ n: n, d: 0, sp: 40 + rnd() * 25 });
    });
    pulses = pulses.filter(function (p) { p.d += p.sp * dt / 1000; if (p.d > p.n.L) return false; var q = at(p.n.p, p.d); x.fillStyle = 'rgba(' + C[p.n.c === 'ink' ? 'yel' : p.n.c] + ',.4)'; x.fillRect(q.x - 2, q.y - 2, 4, 4); return true; });
    // 부품(팀): 놓일 때 살짝 내려앉음
    chips.forEach(function (c) {
      var k = Math.min(1, (T - c.born) / .45), oy = (1 - k) * -10;
      x.globalAlpha = k;
      x.fillStyle = 'rgba(' + C.ink + ',.07)'; x.fillRect(c.x, c.y + oy, c.w, c.h);
      x.strokeStyle = 'rgba(' + C[c.c] + ',' + (c.c === 'ink' ? .35 : .55) + ')'; x.lineWidth = 1.2; x.strokeRect(c.x + .5, c.y + oy + .5, c.w - 1, c.h - 1);
      x.fillStyle = 'rgba(' + C.ink + ',.35)';
      for (var i = 0; i < c.n; i++) { var py = c.y + oy + 6 + i * ((c.h - 12) / Math.max(1, c.n - 1)); x.fillRect(c.x - 6, py - 1.5, 6, 3); x.fillRect(c.x + c.w, py - 1.5, 6, 3); }
      x.beginPath(); x.arc(c.x + 6, c.y + oy + 6, 1.8, 0, 7); x.fill();
      x.fillStyle = 'rgba(' + C.mut + ',.7)'; x.font = '10.5px "IBM Plex Mono", monospace'; x.fillText('U' + c.no, c.x + 4, c.y + oy + c.h - 5); /* taste-skill-ignore */
      x.globalAlpha = 1;
    });
    // 새 부품(팀)이 놓인다 — 기판이 찰 때까지
    if (T > nextChip && added < MAX_NEW) { if (place()) added++; nextChip = T + 5 + rnd() * 4; }
  }

  measure();
  for (var i = 0; i < START; i++) { T += .1; place(); }                // 처음부터 몇 팀은 이미 이어져 있다
  T += 1; nextChip = T + 1;
  cards.forEach(function (c) { c.el.addEventListener('mouseenter', function () { hot = c.i; }); c.el.addEventListener('mouseleave', function () { hot = null; }); c.el.addEventListener('focus', function () { hot = c.i; }); c.el.addEventListener('blur', function () { hot = null; }); });
  var rt, onResize = function () { clearTimeout(rt); rt = setTimeout(function () { chips = []; nets = []; pulses = []; chipNo = 0; added = 0; measure(); for (var i = 0; i < START; i++) { T += .1; place(); } }, 200); };
  addEventListener('resize', onResize);
  var last = performance.now();
  function frame(now) { if (stop) return; var dt = Math.min(50, now - last); last = now; draw(dt); raf = requestAnimationFrame(frame); }
  if (reduce) { T += 5; draw(16); } else raf = requestAnimationFrame(frame);
  // 글꼴이 들어오고 카드 등장 애니메이션(약 1.3초)이 끝난 뒤 자리를 다시 잰다
  Promise.all([document.fonts ? document.fonts.ready : 0, new Promise(function (r) { setTimeout(r, reduce ? 0 : 1300); })]).then(function () { if (stop) return; chips = []; nets = []; pulses = []; chipNo = 0; added = 0; measure(); for (var i = 0; i < START; i++) { T += .1; place(); } });
  return function () { stop = true; cancelAnimationFrame(raf); clearTimeout(rt); removeEventListener('resize', onResize); };
}
