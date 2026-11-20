/*
 * 기리고차 경로 에디터 — 경로 계산과 코드 만들기 (화면과 무관한 부분).
 * 브라우저(index.html)와 Node(테스트) 양쪽에서 쓴다. 외부 라이브러리 없음.
 *
 * 좌표: 사용자 단위(cm·in·m), x 오른쪽, y 위, 방향 0° = +x, 반시계가 +. core(Java)와 같다.
 * 속도표는 core/profile/VelocityProfile.java를 그대로 옮겼다 — sim 테스트(EditorParityTest)가 같은지 확인한다.
 */
(function (root) {
  'use strict';

  var UNIT_M = { cm: 0.01, in: 0.0254, m: 1 };
  var CUSP_DEG = 120;

  // ---------------------------------------------------------------- 프로젝트 모양

  function defaultRobot() {
    // templates/robot-deadwheel3.json + FollowerConfig 기본값과 같은 결과 (측정 전)
    return {
      length: 45, width: 45,             // 사용자 단위 (외곽)
      maxPower: 0.6, kS: 0.05, kV: null,  // kV: 출력/(m/s), null이면 모터 사양으로
      motorRpm: 312, wheelDiameter: 4.094 * 2.54, wheelRevPerMotorRev: 1.0, // cm로 적되 템플릿의 inch 값과 똑같게
      trackWidth: 12.992 * 2.54, wheelBase: 10.63 * 2.54,
      maxVel: null, maxAccel: 1.5, maxDecel: 1.2, maxLateralAccel: 1.5, // m/s, m/s² (null = 계산)
      traction: 3.0, cornerTime: 0.12, effectiveRadius: null, maxOmega: null
    };
  }

  function newProject(units) {
    // 기본 로봇 값은 cm로 적혀 있으니 cm로 만든 뒤 바꾼다
    var p = {
      format: 'girigocha-editor', version: 2, units: 'cm',
      field: { size: fromM(3.6576, 'cm'), origin: 'center' },
      robot: defaultRobot(), limit: 30,
      paths: [newPath('경로1', 0, 0, 0)]
    };
    return convertUnits(p, units || 'cm');
  }

  function newPath(name, x, y, h) {
    return { name: name, start: { x: x, y: y, h: h }, points: [], startActions: [] };
  }

  function toM(v, u) { return v * UNIT_M[u]; }
  function fromM(v, u) { return v / UNIT_M[u]; }

  // ---------------------------------------------------------------- 점(웨이포인트) 방식 → 구간

  /*
   * 에디터 2판은 "로봇이 지나갈 점"을 찍는다: path.points = [{x, y, curve, heading, actions, maxSpeed, pushing, c1?, c2?}].
   * 곡선의 제어점은 자동 (Catmull-Rom 접선, 이웃이 직선이면 그 직선 방향 → 꺾임 없이 이어짐). c1·c2가 있으면 그 값 (고급).
   * 할 일(actions)은 그 점으로 가는 구간의 마커가 된다: 도착할 때 1.0, 도착 조금 전 0.8, 가는 중간 0.5. 출발점의 할 일은 첫 구간 0.
   * 1판 파일(path.segments)은 그대로 쓴다.
   */
  var WHEN_F = { arrive: 1.0, before: 0.8, middle: 0.5, leave: 0.0 };

  function segsOf(path) {
    if (!path.points) return path.segments || [];
    var P = [path.start].concat(path.points), n = path.points.length;
    var unit = function (x, y) { var m = Math.hypot(x, y); return m < 1e-9 ? [1, 0] : [x / m, y / m]; };
    var d = function (k) { return [P[k].x - P[k - 1].x, P[k].y - P[k - 1].y]; }; // k번째 구간 (1..n)
    var curve = function (k) { return !!path.points[k - 1].curve; };
    var T = [];
    for (var k = 0; k <= n; k++) {
      var t;
      if (n === 0) t = [1, 0];
      else if (k === 0) t = unit(d(1)[0], d(1)[1]);
      else if (k === n) t = unit(d(n)[0], d(n)[1]);
      else if (!curve(k)) t = unit(d(k)[0], d(k)[1]);
      else if (!curve(k + 1)) t = unit(d(k + 1)[0], d(k + 1)[1]);
      else t = unit(P[k + 1].x - P[k - 1].x, P[k + 1].y - P[k - 1].y);
      T.push(t);
    }
    return path.points.map(function (q, i) {
      var k = i + 1, L = Math.hypot(d(k)[0], d(k)[1]);
      var s = { type: q.curve ? 'curve' : 'line', end: { x: q.x, y: q.y }, heading: q.heading || { mode: 'keep' },
        maxSpeed: q.maxSpeed, pushing: q.pushing, markers: [] };
      if (q.curve) {
        // 자동 제어점은 소수 첫째 자리로 — Blocks에 옮겨 적기 쉽고, 코드와 에디터 계산이 같은 값을 쓴다
        var r1 = function (v) { return Math.round(v * 10) / 10; };
        s.c1 = q.c1 || { x: r1(P[k - 1].x + T[k - 1][0] * L / 3), y: r1(P[k - 1].y + T[k - 1][1] * L / 3) };
        s.c2 = q.c2 || { x: r1(q.x - T[k][0] * L / 3), y: r1(q.y - T[k][1] * L / 3) };
      }
      var acts = (q.actions || []).slice();
      if (i === 0) acts = (path.startActions || []).map(function (a) { return Object.assign({}, a, { when: 'leave' }); }).concat(acts);
      acts.forEach(function (a, j) {
        s.markers.push({ f: WHEN_F[a.when] == null ? 1 : WHEN_F[a.when], name: a.name || actionName(a, i === 0 && a.when === 'leave' ? '출발' : '점' + (i + 1), j),
          action: a.type || 'name', device: a.device, value: a.value, power: a.power });
      });
      return s;
    });
  }

  function actionName(a, where, j) {
    var dev = a.device || '';
    if (a.type === 'servo') return dev + ' ' + a.value;
    if (a.type === 'motor') return dev + ' 출력 ' + a.value;
    if (a.type === 'motorPos') return dev + ' → ' + Math.round(a.value);
    return where + ' 할 일 ' + (j + 1);
  }

  /** 1판(구간) 경로 → 2판(점). 제어점은 직접 조정한 값으로 남긴다. */
  function toPoints(path) {
    if (path.points) return path;
    path.points = (path.segments || []).map(function (s) {
      var q = { x: s.end.x, y: s.end.y, curve: s.type === 'curve', heading: s.heading || { mode: 'keep' }, actions: [],
        maxSpeed: s.maxSpeed, pushing: s.pushing };
      if (s.type === 'curve') { q.c1 = s.c1; q.c2 = s.c2; }
      (s.markers || []).forEach(function (m) {
        var when = m.f >= 0.95 ? 'arrive' : m.f >= 0.7 ? 'before' : 'middle';
        q.actions.push({ when: when, type: m.action || 'name', device: m.device, value: m.value, power: m.power, name: m.name });
      });
      return q;
    });
    path.startActions = path.startActions || [];
    delete path.segments;
    return path;
  }

  /** 처음 써 보는 사람을 위한 예시 (cm). */
  function examples() {
    var P = function (x, y, curve, heading, actions) { return { x: x, y: y, curve: !!curve, heading: heading || { mode: 'keep' }, actions: actions || [] }; };
    return [
      { title: '앞으로 갔다가 돌아오기', path: { name: '왕복', start: { x: 0, y: 0, h: 0 }, startActions: [], points: [P(90, 0), P(0, 0)] } },
      { title: '곡선으로 비켜 가기', path: { name: '곡선', start: { x: -90, y: -60, h: 0 }, startActions: [],
        points: [P(0, -60, true, { mode: 'tangent' }), P(60, 30, true, { mode: 'tangent' }), P(120, 30, true, { mode: 'keep' })] } },
      { title: '사각형 한 바퀴 (돌면서)', path: { name: '사각형', start: { x: 0, y: 0, h: 0 }, startActions: [],
        points: [P(90, 0, false, { mode: 'linear', deg: 90 }), P(90, 90, false, { mode: 'linear', deg: 180 }), P(0, 90, false, { mode: 'linear', deg: -90 }), P(0, 0, false, { mode: 'linear', deg: 0 })] } },
      { title: '가면서 팔 올리고, 도착하면 집게 열기', path: { name: '배달', start: { x: -120, y: 0, h: 0 }, startActions: [],
        points: [P(0, 0, false, { mode: 'keep' }, [{ when: 'middle', type: 'motorPos', device: 'arm', value: 300, power: 0.8 }]),
          P(90, 60, true, { mode: 'tangent' }, [{ when: 'arrive', type: 'servo', device: 'claw', value: 0 }])] } }
    ];
  }

  // ---------------------------------------------------------------- 3판: 시간표·뒤집기·다른 로봇

  /**
   * 오토 전체 시간표: 경로를 순서대로 달리고, 경로마다 끝난 뒤 기다리기(path.wait 초).
   * 반환: { items: [{ path: i, t0, t1(주행 끝), t2(기다리기 끝), a(분석) }], total }
   */
  function timeline(project, analyses) {
    var t = 0, items = [];
    project.paths.forEach(function (p, i) {
      var a = analyses ? analyses[i] : analyze(project, p);
      var drive = a && a.time ? a.time : 0;
      var wait = p.wait > 0 ? p.wait : 0;
      items.push({ path: i, t0: t, t1: t + drive, t2: t + drive + wait, a: a });
      t += drive + wait;
    });
    return { items: items, total: t };
  }

  /** 시각 t에서 로봇 위치 (사용자 단위, rad). 경로가 없거나 비어 있으면 그 경로의 시작 위치. */
  function poseAt(project, tl, t) {
    var u = project.units;
    if (!tl.items.length) return null;
    var it = tl.items[tl.items.length - 1];
    for (var k = 0; k < tl.items.length; k++) if (t < tl.items[k].t2 || k === tl.items.length - 1) { it = tl.items[k]; break; }
    var p = project.paths[it.path], a = it.a;
    if (!a || !a.geo) return { x: p.start.x, y: p.start.y, h: rad(p.start.h), path: it.path, phase: 'wait', v: 0 };
    var local = Math.max(0, t - it.t0);
    var pr = progressAt(a.prof, Math.min(local, a.prof.time));
    var pt = geoPoint(a.geo, pr.s);
    return { x: fromM(pt[0], u), y: fromM(pt[1], u), h: geoHeading(a.geo, pr.s), path: it.path,
      phase: local > a.prof.time ? 'wait' : 'drive', v: fromM(pr.v, u) };
  }

  /** 할 일(마커)이 실행되는 시각들 (오토 시간 기준). */
  function actionTimes(project, tl) {
    var out = [];
    tl.items.forEach(function (it) {
      var a = it.a;
      if (!a || !a.geo) return;
      segsOf(project.paths[it.path]).forEach(function (sg, i) {
        sg.markers.forEach(function (m) {
          var s = a.geo.start[i] + a.geo.segs[i].curve.length * m.f;
          var idx = Math.max(0, Math.min(a.prof.n, Math.round(s / a.prof.ds)));
          out.push({ t: it.t0 + a.prof.times[idx], name: m.name, path: it.path });
        });
      });
    });
    return out;
  }

  /**
   * 뒤집기 (빨강 ↔ 파랑 진영): axis 'y'는 위아래(y → −y), 'x'는 좌우(x → −x). 원점이 왼쪽 아래면 필드 가운데를 기준으로.
   * 방향도 함께: 위아래는 θ → −θ, 좌우는 θ → 180° − θ. 가는 쪽·뒤로·그대로는 모양을 따라가므로 그대로 둔다.
   */
  function mirrorPath(project, path, axis) {
    var c = project.field.origin === 'center' ? 0 : project.field.size / 2;
    var fp = function (q) { if (!q) return; if (axis === 'y') q.y = 2 * c - q.y; else q.x = 2 * c - q.x; };
    // 방향은 (−180°, 180°] 안으로 — 두 번 뒤집으면 원래 숫자 그대로 (180이 −180으로 바뀌지 않게)
    var fh = function (d) { var r = axis === 'y' ? -d : 180 - d; r = ((r % 360) + 360) % 360; if (r > 180) r -= 360; return Math.round(r * 100) / 100; };
    fp(path.start); path.start.h = fh(path.start.h);
    (path.points || []).forEach(function (q) {
      fp(q); fp(q.c1); fp(q.c2);
      if (q.heading && (q.heading.mode === 'constant' || q.heading.mode === 'linear')) q.heading.deg = fh(q.heading.deg || 0);
    });
    (path.segments || []).forEach(function (s) {
      fp(s.end); fp(s.c1); fp(s.c2);
      if (s.heading && (s.heading.mode === 'constant' || s.heading.mode === 'linear')) s.heading.deg = fh(s.heading.deg || 0);
    });
    return path;
  }

  /** 두 직사각형 로봇이 겹치는지 (분리축). r = {x, y, h, L, W} */
  function overlap(a, b) {
    function corners(r) {
      var c = Math.cos(r.h), s = Math.sin(r.h), out = [];
      [[1, 1], [1, -1], [-1, -1], [-1, 1]].forEach(function (k) {
        var lx = k[0] * r.L / 2, ly = k[1] * r.W / 2;
        out.push([r.x + c * lx - s * ly, r.y + s * lx + c * ly]);
      });
      return out;
    }
    var A = corners(a), B = corners(b);
    var axes = [[Math.cos(a.h), Math.sin(a.h)], [-Math.sin(a.h), Math.cos(a.h)], [Math.cos(b.h), Math.sin(b.h)], [-Math.sin(b.h), Math.cos(b.h)]];
    for (var i = 0; i < axes.length; i++) {
      var ax = axes[i], amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
      A.forEach(function (p) { var d = p[0] * ax[0] + p[1] * ax[1]; amin = Math.min(amin, d); amax = Math.max(amax, d); });
      B.forEach(function (p) { var d = p[0] * ax[0] + p[1] * ax[1]; bmin = Math.min(bmin, d); bmax = Math.max(bmax, d); });
      if (amax < bmin || bmax < amin) return false;
    }
    return true;
  }

  /**
   * 우리 로봇과 다른 로봇(같은 단위로 맞춘 프로젝트)이 같은 시각에 겹치는 구간들 [{t0, t1}].
   * 다른 로봇의 오토가 먼저 끝나면 그 끝 위치에 서 있다고 본다.
   */
  function collisions(project, tl, other, otl) {
    var spans = [], cur = null, T = Math.max(tl.total, otl.total), step = 0.05;
    var L1 = project.robot.length, W1 = project.robot.width, L2 = other.robot.length, W2 = other.robot.width;
    for (var t = 0; t <= T + 1e-9; t += step) {
      var a = poseAt(project, tl, t), b = poseAt(other, otl, t);
      var hit = a && b && overlap({ x: a.x, y: a.y, h: a.h, L: L1, W: W1 }, { x: b.x, y: b.y, h: b.h, L: L2, W: W2 });
      if (hit && !cur) cur = { t0: t, t1: t };
      if (hit) cur.t1 = t;
      if (!hit && cur) { spans.push(cur); cur = null; }
    }
    if (cur) spans.push(cur);
    return spans;
  }

  // ---------------------------------------------------------------- 로봇 한계 (FollowerConfig.from과 같은 계산)

  function limits(project) {
    var r = project.robot, u = project.units;
    var free = r.motorRpm > 0 ? r.motorRpm / 60 * r.wheelRevPerMotorRev * Math.PI * toM(r.wheelDiameter, u) : 1.6;
    var kV = r.kV > 0 ? r.kV : 1 / (0.85 * free);
    var kS = r.kS >= 0 ? r.kS : 0.05;
    var k = r.effectiveRadius > 0 ? toM(r.effectiveRadius, u)
      : (r.trackWidth > 0 && r.wheelBase > 0 ? toM(r.trackWidth + r.wheelBase, u) / 2 : 0.30);
    var powerLimited = (r.maxPower - kS) / kV * 0.85;
    var maxVel = r.maxVel > 0 ? Math.min(r.maxVel, powerLimited) : Math.min(0.8 / kV, powerLimited);
    var traction = r.traction > 0 ? r.traction : 3.0;
    return {
      maxVel: maxVel, maxAccel: r.maxAccel || 1.5, maxDecel: r.maxDecel || 1.2,
      maxLateralAccel: Math.min(r.maxLateralAccel || 1.5, traction),
      maxOmega: r.maxOmega > 0 ? r.maxOmega : Math.min(3.0, maxVel / k), k: k, traction: traction, cornerTime: r.cornerTime || 0.12
    };
  }

  /** robot.json 글 → 에디터 로봇 설정 (단위도). 모르는 값은 기본값. */
  function robotFromJson(text, project) {
    var j = JSON.parse(text);
    var u = (j.units || 'inch').toLowerCase();
    if (u === 'inch' || u === 'inches') u = 'in';
    if (u !== 'in') throw new Error('robot.json 단위가 inch가 아니에요 (' + j.units + ') — 기리고차는 inch만 써요');
    var d = j.drive || {}, f = j.follower || {};
    var r = defaultRobot();
    r.maxPower = d.maxPower || r.maxPower;
    r.motorRpm = d.motorRpm || 0;
    r.wheelDiameter = d.wheelDiameter || r.wheelDiameter;
    r.wheelRevPerMotorRev = d.wheelRevPerMotorRev || 1;
    r.trackWidth = d.trackWidth || 0;
    r.wheelBase = d.wheelBase || 0;
    var perUnit = 1 / UNIT_M[u]; // 1 m/s = perUnit 단위/s
    if (f.kV > 0) r.kV = f.kV * perUnit;                 // 파일: 출력/(단위/s) → 출력/(m/s)
    if (f.kS >= 0 && f.kS !== undefined) r.kS = f.kS;
    if (f.maxSpeed > 0) r.maxVel = toM(f.maxSpeed, u);
    if (f.maxTurnRateDeg > 0) r.maxOmega = f.maxTurnRateDeg * Math.PI / 180;
    if (f.maxAccel > 0) r.maxAccel = toM(f.maxAccel, u);
    if (f.maxDecel > 0) r.maxDecel = toM(f.maxDecel, u);
    if (f.maxLateralAccel > 0) r.maxLateralAccel = toM(f.maxLateralAccel, u);
    if (f.traction > 0) r.traction = toM(f.traction, u);
    if (f.effectiveRadius > 0) r.effectiveRadius = f.effectiveRadius;
    if (f.robotRadius > 0) { r.length = r.width = f.robotRadius * Math.SQRT2; }
    return { robot: r, units: u };
  }

  // ---------------------------------------------------------------- 기하 (m 단위 내부 계산)

  /** 경로 하나를 m 단위 구간 목록으로: {p:[점들], heading, maxSpeed, pushing, markers} */
  function buildGeometry(project, path) {
    var u = project.units;
    var P = function (q) { return [toM(q.x, u), toM(q.y, u)]; };
    var cur = P(path.start);
    var prevEnd = rad(path.start.h);
    var segs = [];
    var list = segsOf(path);
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var pts = s.type === 'line' ? [cur, P(s.end)] : [cur, P(s.c1), P(s.c2), P(s.end)];
      var c = curve(pts);
      var hm = headingMode(s.heading || { mode: 'keep' }, prevEnd);
      prevEnd = hm.at(c, c.length);
      segs.push({
        curve: c, hm: hm,
        maxSpeed: s.maxSpeed > 0 ? toM(s.maxSpeed, u) : Infinity,
        pushing: !!s.pushing, src: s
      });
      cur = P(s.end);
    }
    var start = [0];
    for (var j = 0; j < segs.length; j++) start.push(start[j] + segs[j].curve.length);
    return { segs: segs, start: start, length: start[segs.length] };
  }

  /** 베지어 곡선 (1차 또는 3차). 호 길이 표로 s → t. BezierCurve.java와 같은 방식. */
  function curve(pts) {
    var n = pts.length - 1;
    function pt(t) {
      if (n === 1) return [pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t];
      var a = 1 - t;
      var b0 = a * a * a, b1 = 3 * a * a * t, b2 = 3 * a * t * t, b3 = t * t * t;
      return [b0 * pts[0][0] + b1 * pts[1][0] + b2 * pts[2][0] + b3 * pts[3][0],
        b0 * pts[0][1] + b1 * pts[1][1] + b2 * pts[2][1] + b3 * pts[3][1]];
    }
    function d1(t) {
      if (n === 1) return [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]];
      var a = 1 - t;
      return [3 * a * a * (pts[1][0] - pts[0][0]) + 6 * a * t * (pts[2][0] - pts[1][0]) + 3 * t * t * (pts[3][0] - pts[2][0]),
        3 * a * a * (pts[1][1] - pts[0][1]) + 6 * a * t * (pts[2][1] - pts[1][1]) + 3 * t * t * (pts[3][1] - pts[2][1])];
    }
    function d2(t) {
      if (n === 1) return [0, 0];
      var a = 1 - t;
      return [6 * a * (pts[2][0] - 2 * pts[1][0] + pts[0][0]) + 6 * t * (pts[3][0] - 2 * pts[2][0] + pts[1][0]),
        6 * a * (pts[2][1] - 2 * pts[1][1] + pts[0][1]) + 6 * t * (pts[3][1] - 2 * pts[2][1] + pts[1][1])];
    }
    var N = 512, ts = [0], ss = [0], prev = pt(0);
    for (var i = 1; i <= N; i++) {
      var t = i / N, q = pt(t);
      ss.push(ss[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1]));
      ts.push(t);
      prev = q;
    }
    var L = ss[N];
    function tAt(s) {
      if (s <= 0) return 0;
      if (s >= L) return 1;
      var lo = 0, hi = N;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (ss[mid] < s) lo = mid; else hi = mid; }
      var f = (s - ss[lo]) / Math.max(1e-12, ss[hi] - ss[lo]);
      return ts[lo] + f * (ts[hi] - ts[lo]);
    }
    return {
      pts: pts, length: L,
      point: function (s) { return pt(tAt(s)); },
      tangent: function (s) { var d = d1(tAt(s)); var m = Math.hypot(d[0], d[1]); return m < 1e-12 ? [1, 0] : [d[0] / m, d[1] / m]; },
      curvature: function (s) {
        var t = tAt(s), a = d1(t), b = d2(t);
        var m = Math.hypot(a[0], a[1]);
        return m < 1e-9 ? 0 : (a[0] * b[1] - a[1] * b[0]) / (m * m * m);
      }
    };
  }

  function headingMode(h, prevEnd) {
    var mode = h.mode || 'keep';
    if (mode === 'constant') { var c = rad(h.deg); return { mode: mode, at: function () { return c; }, rate: function () { return 0; } }; }
    if (mode === 'linear') {
      var from = prevEnd, delta = norm(rad(h.deg) - from);
      return { mode: mode, at: function (cv, s) { return from + delta * (s / cv.length); }, rate: function (cv) { return delta / cv.length; } };
    }
    if (mode === 'tangent' || mode === 'reverse') {
      var off = mode === 'reverse' ? Math.PI : 0;
      return { mode: mode,
        at: function (cv, s) { var t = cv.tangent(s); return Math.atan2(t[1], t[0]) + off; },
        rate: function (cv, s) { return cv.curvature(s); } };
    }
    var k = prevEnd; // keep = 앞 방향 그대로 (core MODE_KEEP)
    return { mode: 'keep', at: function () { return k; }, rate: function () { return 0; } };
  }

  function segmentAt(g, s) {
    var n = g.segs.length;
    for (var i = 0; i < n; i++) if (s < g.start[i + 1] || i === n - 1) return i;
    return n - 1;
  }

  function geoPoint(g, s) { var i = segmentAt(g, s); return g.segs[i].curve.point(s - g.start[i]); }
  function geoHeading(g, s) { var i = segmentAt(g, s); return norm(g.segs[i].hm.at(g.segs[i].curve, s - g.start[i])); }

  function junctionAngleDeg(g, j) {
    var a = g.segs[j - 1].curve, b = g.segs[j].curve;
    var ta = a.tangent(a.length), tb = b.tangent(0);
    var d = Math.max(-1, Math.min(1, ta[0] * tb[0] + ta[1] * tb[1]));
    return Math.acos(d) * 180 / Math.PI;
  }

  // ---------------------------------------------------------------- 속도표 (VelocityProfile.java와 같음)

  function tangentialAllowance(lim, v, kappa, limit) {
    var a = Math.min(limit, lim.traction);
    if (!isFinite(lim.traction)) return limit;
    var an = v * v * Math.abs(kappa);
    var left = a * a - an * an;
    return Math.max(0.1 * a, left > 0 ? Math.sqrt(left) : 0);
  }

  function profile(g, lim) {
    var L = g.length;
    var n = Math.max(2, Math.ceil(L / 0.01));
    var ds = L / n;
    var cap = new Array(n + 1), kap = new Array(n + 1), v = new Array(n + 1);
    for (var i = 0; i <= n; i++) {
      var s = i * ds, si = segmentAt(g, s), seg = g.segs[si], ls = s - g.start[si];
      var c = Math.min(lim.maxVel, seg.maxSpeed);
      if (seg.pushing) c = Math.min(c, 0.5 * lim.maxVel);
      var k = Math.abs(seg.curve.curvature(ls));
      kap[i] = k;
      if (k > 1e-6) c = Math.min(c, Math.sqrt(lim.maxLateralAccel / k));
      var turn = Math.abs(seg.hm.rate(seg.curve, ls));
      if (turn > 1e-6) {
        c = Math.min(c, lim.maxOmega / turn);
        c = Math.min(c, lim.maxVel / (1 + lim.k * turn));
      }
      cap[i] = c;
    }
    for (var j = 1; j < g.segs.length; j++) {
      var deg = junctionAngleDeg(g, j), vc = Infinity;
      if (deg >= CUSP_DEG) vc = 0.03;
      else if (deg >= 2 && isFinite(lim.cornerTime)) vc = Math.min(lim.maxDecel, lim.traction) * lim.cornerTime / (2 * Math.sin(deg * Math.PI / 360));
      if (!isFinite(vc)) continue;
      var ii = Math.round(g.start[j] / ds);
      for (var q = Math.max(0, ii - 1); q <= Math.min(n, ii + 1); q++) cap[q] = Math.min(cap[q], vc);
    }
    v[n] = Math.min(0, cap[n]);
    for (var b = n - 1; b >= 0; b--) {
      var d = tangentialAllowance(lim, v[b + 1], kap[b], lim.maxDecel);
      v[b] = Math.min(cap[b], Math.sqrt(v[b + 1] * v[b + 1] + 2 * d * ds));
    }
    // 출발 가속까지 넣어 시간 (estimatedTime(0))과, 미리보기용 시간 → 진행 거리 표
    var t = 0, prev = 0, times = [0], speeds = [0];
    for (var f = 1; f <= n; f++) {
      var a = tangentialAllowance(lim, prev, kap[f], lim.maxAccel);
      var cur = Math.min(v[f], Math.sqrt(prev * prev + 2 * a * ds));
      var avg = (prev + cur) / 2;
      t += avg > 1e-6 ? ds / avg : 0;
      times.push(t);
      speeds.push(cur);
      prev = cur;
    }
    return { time: t, ds: ds, times: times, speeds: speeds, n: n };
  }

  /** 미리보기: 시각 t(s)에서 진행 거리(m)·속도. */
  function progressAt(prof, t) {
    var tt = prof.times;
    if (t <= 0) return { s: 0, v: 0 };
    if (t >= prof.time) return { s: prof.n * prof.ds, v: 0 };
    var lo = 0, hi = tt.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (tt[mid] < t) lo = mid; else hi = mid; }
    var f = (t - tt[lo]) / Math.max(1e-9, tt[hi] - tt[lo]);
    return { s: (lo + f) * prof.ds, v: prof.speeds[lo] + f * (prof.speeds[hi] - prof.speeds[lo]) };
  }

  // ---------------------------------------------------------------- 점검 (경고)

  function check(project, path, g) {
    var u = project.units, w = [], r = project.robot;
    var half = project.field.size / 2;
    var lo = project.field.origin === 'center' ? -half : 0, hi = project.field.origin === 'center' ? half : 2 * half;
    var hl = toM(r.length, u) / 2, hw = toM(r.width, u) / 2;
    var out = false;
    if (g.length > 0) {
      for (var s = 0; s <= g.length + 1e-9 && !out; s += Math.max(0.02, g.length / 300)) {
        var p = geoPoint(g, Math.min(s, g.length)), h = geoHeading(g, Math.min(s, g.length));
        var c = Math.cos(h), sn = Math.sin(h);
        for (var a = -1; a <= 1; a += 2) for (var b = -1; b <= 1; b += 2) {
          var x = fromM(p[0] + c * a * hl - sn * b * hw, u), y = fromM(p[1] + sn * a * hl + c * b * hw, u);
          if (x < lo - 0.5 || x > hi + 0.5 || y < lo - 0.5 || y > hi + 0.5) out = true;
        }
      }
    }
    if (out) w.push({ level: 'error', text: '로봇이 필드 밖으로 나가요 (로봇 크기 포함)' });
    for (var j = 1; j < g.segs.length; j++) {
      var deg = junctionAngleDeg(g, j);
      if (deg >= CUSP_DEG) w.push({ level: 'info', seg: j, text: (j + 1) + '번 구간 시작: 되돌아가는 곳 — 여기서 거의 멈췄다가 출발해요' });
      else if (deg >= 20) w.push({ level: 'warn', seg: j, text: (j + 1) + '번 구간 시작: ' + Math.round(deg) + '° 꺾여서 느려져요 — 곡선으로 이으면 빨라요' });
    }
    var list = segsOf(path);
    for (var i = 0; i < list.length; i++) {
      var ms = list[i].markers || [];
      for (var m = 0; m < ms.length; m++) {
        if (!(ms[m].f >= 0 && ms[m].f <= 1)) w.push({ level: 'error', seg: i, text: (i + 1) + '번 구간 마커 「' + ms[m].name + '」 비율은 0~1이어야 해요' });
        if (!ms[m].name) w.push({ level: 'error', seg: i, text: (i + 1) + '번 구간 마커에 이름이 없어요' });
        if (ms[m].action && ms[m].action !== 'name' && !ms[m].device) {
          w.push({ level: 'warn', seg: i, text: (i + 1) + '번 구간 마커 「' + ms[m].name + '」: 장치 이름이 없어 동작 없이 이름만 붙어요' });
        }
      }
      if (g.segs[i] && g.segs[i].curve.length < 0.01) w.push({ level: 'error', seg: i, text: (i + 1) + '번 구간 길이가 거의 0이에요' });
    }
    return w;
  }

  // ---------------------------------------------------------------- 코드 만들기

  function n2(v) {
    var r = Math.round(v * 100) / 100;
    if (Object.is(r, -0)) r = 0;
    return String(r);
  }

  function jstr(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
  /** Java 변수 이름 (한글 이름이면 fallback 사용). */
  function ident(name, used, fallback) {
    var base = String(name).replace(/[^A-Za-z0-9_]/g, '_');
    if (!/[A-Za-z]/.test(base)) base = fallback || 'device';
    if (!/^[A-Za-z_]/.test(base)) base = 'd_' + base;
    var id = base, k = 2;
    while (used[id] && used[id] !== name) id = base + (k++);
    used[id] = name;
    return id;
  }

  /** 마커 동작에 쓰는 장치 목록 {이름: 'servo'|'motor'} */
  function devices(project) {
    var d = {};
    project.paths.forEach(function (p) {
      segsOf(p).forEach(function (s) {
        (s.markers || []).forEach(function (m) {
          if (!m.device) return; // 장치 이름이 없으면 이름만 마커로 (점검에서 알려 줌)
          if (m.action === 'servo') d[m.device] = 'servo';
          else if ((m.action === 'motor' || m.action === 'motorPos') && d[m.device] !== 'servo') d[m.device] = m.action === 'motorPos' ? 'dcmotor' : (d[m.device] || 'motor');
        });
      });
    });
    return d;
  }

  /** PathBuilder 식 하나 (unitsExpr: 예 "robot.units()"). devVar: 장치 이름 → 변수 이름. */
  function javaPathExpr(path, unitsExpr, devVar, indent) {
    indent = indent || '        ';
    var out = 'new PathBuilder(' + unitsExpr + ', ' + n2(path.start.x) + ', ' + n2(path.start.y) + ', ' + n2(path.start.h) + ')';
    var prevEnd = path.start.h;
    segsOf(path).forEach(function (s) {
      if (s.type === 'line') out += '\n' + indent + '.lineTo(' + n2(s.end.x) + ', ' + n2(s.end.y) + ')';
      else out += '\n' + indent + '.curveTo(' + [s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.end.x, s.end.y].map(n2).join(', ') + ')';
      var h = s.heading || { mode: 'keep' };
      if (h.mode === 'constant') { out += '.constantHeading(' + n2(h.deg) + ')'; prevEnd = h.deg; }
      else if (h.mode === 'linear') { out += '.linearHeading(' + n2(h.deg) + ')'; prevEnd = h.deg; }
      else if (h.mode === 'tangent') out += '.tangentHeading()';
      else if (h.mode === 'reverse') out += '.reverseTangentHeading()';
      if (s.maxSpeed > 0) out += '.maxSpeed(' + n2(s.maxSpeed) + ')';
      if (s.pushing) out += '.pushing()';
      (s.markers || []).forEach(function (m) {
        out += '\n' + indent + '    ' + javaMarker(m, devVar);
      });
    });
    return out + '\n' + indent + '.build()';
  }

  function javaMarker(m, devVar) {
    var f = n2(m.f), nm = jstr(m.name);
    var v = devVar && m.device ? devVar[m.device] : null;
    if (m.action === 'servo' && v) return '.atFraction(' + f + ', ' + nm + ', () -> ' + v + '.setPosition(' + n2(m.value) + '))';
    if (m.action === 'motor' && v) return '.atFraction(' + f + ', ' + nm + ', () -> ' + v + '.setPower(' + n2(m.value) + '))';
    if (m.action === 'motorPos' && v) {
      return '.atFraction(' + f + ', ' + nm + ', () -> { ' + v + '.setTargetPosition(' + Math.round(m.value) + '); ' +
        v + '.setMode(DcMotor.RunMode.RUN_TO_POSITION); ' + v + '.setPower(' + n2(m.power == null ? 0.8 : m.power) + '); })';
    }
    return '.atFraction(' + f + ', ' + nm + ')   // robot.takeMarker(' + nm + ')로 확인';
  }

  /** 경로만 (팀 코드에 붙여 넣기). */
  function javaSnippet(project) {
    var used = {}, dv = {};
    var devs = devices(project);
    Object.keys(devs).forEach(function (d, i) { dv[d] = ident(d, used, 'device' + (i + 1)); });
    var lines = ['// 기리고차 경로 에디터에서 만듦 — 길이 단위 ' + project.units + ' (robot.json "units"와 같아야 해요)'];
    Object.keys(devs).forEach(function (d) {
      var cls = devs[d] === 'servo' ? 'Servo' : (devs[d] === 'dcmotor' ? 'DcMotor' : 'DcMotorSimple');
      lines.push(cls + ' ' + dv[d] + ' = hardwareMap.get(' + cls + '.class, ' + jstr(d) + ');');
    });
    project.paths.forEach(function (p, i) {
      lines.push('PathChain ' + ident(p.name || '', used, 'path' + (i + 1)) + ' = ' + javaPathExpr(p, 'robot.units()', dv, '        ') + ';');
    });
    return lines.join('\n');
  }

  /** OpMode 전체 (새 파일로). */
  function javaOpMode(project, className, opName) {
    className = className || 'MyGirigochaAuto';
    opName = opName || '기리고차 오토';
    var used = {}, dv = {};
    var devs = devices(project);
    Object.keys(devs).forEach(function (d, i) { dv[d] = ident(d, used, 'device' + (i + 1)); });
    var pathVars = project.paths.map(function (p, i) { return ident(p.name || '', used, 'path' + (i + 1)); });
    var L = [];
    L.push('package org.firstinspires.ftc.teamcode;');
    L.push('');
    L.push('import com.qualcomm.robotcore.eventloop.opmode.Autonomous;');
    L.push('import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;');
    if (Object.keys(devs).some(function (d) { return devs[d] === 'dcmotor'; })) L.push('import com.qualcomm.robotcore.hardware.DcMotor;');
    if (Object.keys(devs).some(function (d) { return devs[d] === 'motor'; })) L.push('import com.qualcomm.robotcore.hardware.DcMotorSimple;');
    if (Object.keys(devs).some(function (d) { return devs[d] === 'servo'; })) L.push('import com.qualcomm.robotcore.hardware.Servo;');
    L.push('import girigocha.core.path.PathBuilder;');
    L.push('import girigocha.core.path.PathChain;');
    L.push('import girigocha.ftc.GirigochaRobot;');
    L.push('');
    L.push('/** 기리고차 경로 에디터에서 만듦. 길이 단위 ' + project.units + ' (robot.json "units"와 같아야 해요). */');
    L.push('@Autonomous(name = ' + jstr(opName) + ')');
    L.push('public class ' + className + ' extends LinearOpMode {');
    L.push('    @Override');
    L.push('    public void runOpMode() {');
    L.push('        GirigochaRobot robot = GirigochaRobot.create(hardwareMap, ' + jstr(className) + ');');
    Object.keys(devs).forEach(function (d) {
      var cls = devs[d] === 'servo' ? 'Servo' : (devs[d] === 'dcmotor' ? 'DcMotor' : 'DcMotorSimple');
      L.push('        ' + cls + ' ' + dv[d] + ' = hardwareMap.get(' + cls + '.class, ' + jstr(d) + ');');
    });
    L.push('        try {');
    L.push('            if (!robot.ready()) {');
    L.push('                telemetry.addLine("기리고차 준비 안 됨 — 「기리고차 점검」을 해 보세요");');
    L.push('                telemetry.update();');
    L.push('                waitForStart();');
    L.push('                return;');
    L.push('            }');
    project.paths.forEach(function (p, i) {
      L.push('            PathChain ' + pathVars[i] + ' = ' + javaPathExpr(p, 'robot.units()', dv, '                    ') + ';');
    });
    var s0 = project.paths[0].start;
    L.push('            robot.setPose(robot.units().pose(' + n2(s0.x) + ', ' + n2(s0.y) + ', ' + n2(s0.h) + '));');
    L.push('            waitForStart();');
    project.paths.forEach(function (p, i) {
      L.push('');
      L.push('            // ' + (p.name || pathVars[i]));
      L.push('            robot.follow(' + pathVars[i] + ');');
      L.push('            while (opModeIsActive() && robot.isBusy()) robot.update();');
      L.push('            if (robot.isBlocked()) return; // 막히면 그만 (robot.failureReason()으로 이유)');
      if (p.wait > 0) {
        L.push('            // ' + n2(p.wait) + '초 기다리기 (그 자리를 버팀)');
        L.push('            double until' + (i + 1) + ' = robot.time() + ' + n2(p.wait) + ';');
        L.push('            while (opModeIsActive() && robot.time() < until' + (i + 1) + ') robot.update();');
      }
    });
    L.push('        } finally {');
    L.push('            robot.close();');
    L.push('        }');
    L.push('    }');
    L.push('}');
    return L.join('\n');
  }

  /** Blocks: 쌓을 블록 목록 (화면 글자 그대로). */
  function blocksList(project) {
    var B = [];
    B.push(['기리고차 시작']);
    var s0 = project.paths[0].start;
    B.push(['위치 설정', 'x ' + n2(s0.x), 'y ' + n2(s0.y), '방향 ' + n2(s0.h)]);
    B.push(['(waitForStart 다음에)']);
    project.paths.forEach(function (p) {
      var nm = '"' + p.name + '"';
      B.push(['경로 만들기', '이름 ' + nm, 'x ' + n2(p.start.x), 'y ' + n2(p.start.y), '방향 ' + n2(p.start.h)]);
      segsOf(p).forEach(function (s) {
        if (s.type === 'line') B.push(['직선 추가', '경로 ' + nm, 'x ' + n2(s.end.x), 'y ' + n2(s.end.y)]);
        else B.push(['곡선 추가 (제어점 2개)', '경로 ' + nm, '제어점1 x ' + n2(s.c1.x) + ' y ' + n2(s.c1.y), '제어점2 x ' + n2(s.c2.x) + ' y ' + n2(s.c2.y), '끝 x ' + n2(s.end.x) + ' y ' + n2(s.end.y)]);
        var h = s.heading || { mode: 'keep' };
        if (h.mode === 'constant') B.push(['방향: 고정', '경로 ' + nm, n2(h.deg)]);
        else if (h.mode === 'linear') B.push(['방향: 돌면서 가기', '경로 ' + nm, n2(h.deg)]);
        else if (h.mode === 'tangent') B.push(['방향: 가는 쪽 보기', '경로 ' + nm]);
        else if (h.mode === 'reverse') B.push(['방향: 뒤로 가기', '경로 ' + nm]);
        if (s.maxSpeed > 0) B.push(['속도 제한', '경로 ' + nm, n2(s.maxSpeed)]);
        if (s.pushing) B.push(['물체 밀기 구간', '경로 ' + nm]);
        (s.markers || []).forEach(function (m) {
          if (m.action !== 'name' && !m.device) B.push(['마커 (구간 비율)', '경로 ' + nm, '구간 비율 ' + n2(m.f), '이름 "' + m.name + '"']);
          else if (m.action === 'servo') B.push(['마커: 서보 위치', '경로 ' + nm, '구간 비율 ' + n2(m.f), '서보 "' + m.device + '"', '위치 ' + n2(m.value)]);
          else if (m.action === 'motor') B.push(['마커: 모터 출력', '경로 ' + nm, '구간 비율 ' + n2(m.f), '모터 "' + m.device + '"', '출력 ' + n2(m.value)]);
          else if (m.action === 'motorPos') B.push(['마커: 모터 위치로', '경로 ' + nm, '구간 비율 ' + n2(m.f), '모터 "' + m.device + '"', '목표 ' + Math.round(m.value), '출력 ' + n2(m.power == null ? 0.8 : m.power)]);
          else B.push(['마커 (구간 비율)', '경로 ' + nm, '구간 비율 ' + n2(m.f), '이름 "' + m.name + '"']);
        });
      });
      B.push(['경로 끝까지 달리기', '경로 ' + nm]);
      if (p.wait > 0) B.push(['기다리기', '초 ' + n2(p.wait)]);
    });
    B.push(['기리고차 끝내기']);
    return B;
  }

  // ---------------------------------------------------------------- 단위 바꾸기, 기타

  function convertUnits(project, to) {
    var from = project.units;
    if (from === to) return project;
    var k = UNIT_M[from] / UNIT_M[to];
    var sc = function (q) { if (q) { q.x *= k; q.y *= k; } };
    project.paths.forEach(function (p) {
      sc(p.start);
      (p.segments || []).forEach(function (s) { sc(s.c1); sc(s.c2); sc(s.end); if (s.maxSpeed > 0) s.maxSpeed *= k; });
      (p.points || []).forEach(function (q) { sc(q); sc(q.c1); sc(q.c2); if (q.maxSpeed > 0) q.maxSpeed *= k; });
    });
    project.field.size *= k;
    var r = project.robot;
    ['length', 'width', 'wheelDiameter', 'trackWidth', 'wheelBase', 'effectiveRadius'].forEach(function (f) { if (r[f] > 0) r[f] *= k; });
    project.units = to;
    return project;
  }

  function rad(d) { return d * Math.PI / 180; }
  function norm(a) { a = a % (2 * Math.PI); if (a > Math.PI) a -= 2 * Math.PI; if (a <= -Math.PI) a += 2 * Math.PI; return a; }

  /** 경로 하나 요약 (길이 사용자 단위, 예상 시간 s, 경고). */
  function analyze(project, path) {
    if (!segsOf(path).length) return { length: 0, time: 0, warnings: [], geo: null, prof: null };
    var g = buildGeometry(project, path);
    var lim = limits(project);
    var prof = profile(g, lim);
    return { length: fromM(g.length, project.units), time: prof.time, warnings: check(project, path, g), geo: g, prof: prof, limits: lim };
  }

  // ---------------------------------------------------------------- 로봇으로 보내기 (girigocha-routine 1)

  /**
   * 로봇에 보낼 오토 파일 — core Routine.parse가 읽는다. 곡선 제어점·할 일 위치는 여기서 숫자로 정해서 보내므로
   * 에디터 화면, 「코드 받기」, 로봇이 달리는 경로가 모두 같다.
   */
  function routineJson(project, name) {
    var r2 = function (v) { return Math.round(v * 1000) / 1000; };
    var pt = function (q) { return q ? { x: r2(q.x), y: r2(q.y) } : undefined; };
    var paths = project.paths.filter(function (p) { return segsOf(p).length; }).map(function (p) {
      return {
        name: p.name, wait: p.wait > 0 ? p.wait : 0, start: { x: r2(p.start.x), y: r2(p.start.y), h: r2(p.start.h) },
        segments: segsOf(p).map(function (s) {
          var o = { type: s.type, end: pt(s.end) };
          if (s.type === 'curve') { o.c1 = pt(s.c1); o.c2 = pt(s.c2); }
          var h = s.heading || { mode: 'keep' };
          o.heading = { mode: h.mode || 'keep' };
          if (h.mode === 'constant' || h.mode === 'linear') o.heading.deg = r2(h.deg || 0);
          if (s.maxSpeed > 0) o.maxSpeed = s.maxSpeed;
          if (s.pushing) o.pushing = true;
          o.markers = (s.markers || []).map(function (m) {
            var mm = { f: r2(m.f), name: m.name, action: m.device ? (m.action || 'name') : 'name' };
            if (m.device) { mm.device = m.device; mm.value = m.value == null ? 0 : m.value; if (m.action === 'motorPos') mm.power = m.power == null ? 0.8 : m.power; }
            return mm;
          });
          return o;
        })
      };
    });
    if (!paths.length) throw new Error('보낼 경로가 없어요 — 점을 먼저 찍어 주세요');
    var s0 = paths[0].start;
    return { format: 'girigocha-routine', version: 1, name: name || paths[0].name, units: project.units, start: s0, paths: paths };
  }

  // ---------------------------------------------------------------- 4판: 실제 주행 겹쳐 보기 (.grlog)

  /**
   * 로봇 로그(.grlog, JSON 한 줄씩) → 겹쳐 보기 자료. 위치는 m → project 단위.
   * 시각 0 = 오토가 출발한 때 (routine_start, 없으면 첫 path 이벤트, 없으면 첫 샘플).
   * 반환: { name, team, opmode, samples: [{t, x, y, h, v}], events: [{t, type, text}], duration, warnings }
   */
  function parseGrlog(text, project) {
    var u = project.units, header = null, samples = [], events = [], bad = 0;
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var d;
      try { d = JSON.parse(line); } catch (e) { bad++; return; }
      var k = d.k;
      if (typeof k !== 'string' && d.type) k = 'evt';
      if (k === 'header') header = d;
      else if (k === 's' && typeof d.x === 'number') samples.push(d);
      else if (k === 'evt') events.push(d);
    });
    if (!header) throw new Error('기리고차 로그(.grlog)가 아니에요');
    if (!samples.length) throw new Error('이 로그에는 주행 기록이 없어요 (점검·측정 로그일 수 있어요)');
    var t0 = null;
    events.forEach(function (e) { if (t0 === null && (e.type === 'routine_start' || e.type === 'path')) t0 = e.t; });
    if (t0 === null) t0 = samples[0].t;
    // 출발 전 샘플은 버린다 — routine_start 직전은 아직 출발 자세로 맞추기 전(보통 0,0)이라 계획과 크게 달라 보인다
    var S = samples.filter(function (s) { return s.t >= t0; }).map(function (s) {
      return { t: s.t - t0, x: fromM(s.x, u), y: fromM(s.y, u), h: s.h || 0, v: fromM(Math.hypot(s.vx || 0, s.vy || 0), u) };
    });
    var KO = { marker: '할 일', collision: '막힘 감지', pushed: '밀림', blocked: '멈춤', routine_step: '다음 경로', routine_done: '끝', routine_failed: '실패', recovery: '우회 판단', cusp: '되돌아감' };
    var E = events.filter(function (e) { return KO[e.type] && e.t >= t0 - 0.05; }).map(function (e) {
      var txt = KO[e.type];
      if (e.type === 'marker' && e.name) txt += ' · ' + e.name;
      if (e.type === 'routine_step' && e.step) txt += ' · ' + e.step;
      if (e.type === 'blocked' && e.reason) txt += ' · ' + (e.reason === 'collision' ? '막힘' : e.reason === 'timeout' ? '시간 초과' : e.reason);
      return { t: e.t - t0, type: e.type, text: txt };
    });
    var warn = [];
    if (header.units && header.units !== u) warn.push('로그 단위(' + header.units + ')와 에디터 단위(' + u + ')가 달라서 에디터 단위로 바꿔 보여요');
    if (bad) warn.push('읽지 못한 줄 ' + bad + '개 (로봇이 갑자기 꺼졌을 수 있어요)');
    return { team: header.team || '', opmode: header.opmode || '', samples: S, events: E, duration: S.length ? S[S.length - 1].t : 0, warnings: warn };
  }

  /** 실제 기록에서 시각 t의 위치 (사이를 직선으로). */
  function replayAt(rp, t) {
    var S = rp.samples;
    if (!S.length) return null;
    if (t <= S[0].t) return S[0];
    if (t >= S[S.length - 1].t) return S[S.length - 1];
    var lo = 0, hi = S.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (S[mid].t < t) lo = mid; else hi = mid; }
    var a = S[lo], b = S[hi], f = (t - a.t) / Math.max(1e-9, b.t - a.t);
    return { t: t, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: a.h + norm(b.h - a.h) * f, v: a.v + (b.v - a.v) * f };
  }

  /** 계획과 실제의 차이: 같은 시각의 거리. 반환 { max, maxAt, mean } (project 단위). */
  function replayGap(project, tl, rp) {
    var max = 0, maxAt = 0, sum = 0, n = 0, T = Math.min(tl.total, rp.duration);
    for (var t = 0; t <= T; t += 0.05) {
      var a = poseAt(project, tl, t), b = replayAt(rp, t);
      if (!a || !b) continue;
      var d = Math.hypot(a.x - b.x, a.y - b.y);
      sum += d; n++;
      if (d > max) { max = d; maxAt = t; }
    }
    return { max: max, maxAt: maxAt, mean: n ? sum / n : 0 };
  }

  // ---------------------------------------------------------------- 4판: 시간 줄이기 제안

  /**
   * 빨라지는 고침 찾기 — 지금은 "꺾이는 모서리를 곡선으로". 고친 경로의 시간을 실제로 계산해서
   * 0.15초 넘게 줄고, 새 문제(필드 밖 등)가 생기지 않는 것만.
   * opts.game === 'biobuzz'면 BIOBUZZ 규칙(HIVE·상대 진영 등)에 새로 걸리는 것도 뺀다.
   * 반환 [{ path, point, kind, saved, text, apply(project) }] 많이 줄어드는 순.
   */
  function suggestions(project, opts) {
    var out = [], game = opts && opts.game === 'biobuzz';
    // 규칙 문제를 "규칙 코드" 집합으로 — 시각 구간이 갈라져 개수가 바뀌어도 새 종류만 문제로 본다
    var ruleSet = function (pr) { var r = {}; biobuzzRules(pr, timeline(pr)).forEach(function (w) { r[w.rule] = (r[w.rule] || 0) + (w.level === 'error' ? 1 : 0); }); return r; };
    var baseRules = game ? ruleSet(project) : null;
    var newRule = function (pi, trial) {
      if (!game) return false;
      var pr = JSON.parse(JSON.stringify(project)); pr.paths[pi] = trial;
      var r = ruleSet(pr);
      return Object.keys(r).some(function (k) { return !(k in baseRules) || r[k] > baseRules[k]; });
    };
    project.paths.forEach(function (p, pi) {
      if (!p.points || p.points.length < 2) return;
      var base = analyze(project, p);
      if (!base.time) return;
      var baseErr = base.warnings.filter(function (w) { return w.level === 'error'; }).length;
      for (var k = 0; k < p.points.length - 1; k++) {
        var a = p.points[k], b = p.points[k + 1];
        if (a.curve && b.curve) continue;
        if (a.c1 || a.c2 || b.c1 || b.c2) continue; // 직접 조정한 곡선은 건드리지 않는다
        var g = base.geo, j = k + 1;
        if (!g || j >= g.segs.length) continue;
        var deg = junctionAngleDeg(g, j);
        if (deg < 20 || deg >= CUSP_DEG) continue;
        var trial = JSON.parse(JSON.stringify(p));
        trial.points[k].curve = true; trial.points[k + 1].curve = true;
        [k, k + 1].forEach(function (i) { if (trial.points[i].heading.mode === 'keep') trial.points[i].heading = { mode: 'keep' }; });
        var r = analyze(project, trial);
        var err = r.warnings.filter(function (w) { return w.level === 'error'; }).length;
        var saved = base.time - r.time;
        if (saved > 0.15 && err <= baseErr && !newRule(pi, trial)) {
          out.push({ path: pi, point: k, kind: 'curve', saved: saved,
            text: (k + 1) + '번 점 모서리(' + Math.round(deg) + '°)를 곡선으로', apply: (function (pi2, k2) {
              return function (pr) { var q = pr.paths[pi2]; q.points[k2].curve = true; q.points[k2 + 1].curve = true; };
            })(pi, k) });
        }
      }
    });
    return out.sort(function (x, y) { return y.saved - x.saved; });
  }

  // ---------------------------------------------------------------- 4판: 말로 경로 만들기 (오프라인, 정해진 말투)

  /**
   * 정해진 말투를 읽는다. 쉼표·마침표·줄바꿈·「그리고」·「다음」으로 나눈다.
   *   이동: 「앞으로 90」 「뒤로 30」 「왼쪽으로 40」 「오른쪽 40」 (로봇 기준, 단위 생략 = 에디터 단위, cm·in·m 붙여도 됨)
   *   점:   「(60, 30)으로」 「60,30으로 곡선」
   *   돌기: 「왼쪽으로 90도 돌면서」 「오른쪽 45도」 → 다음 이동 동안 돈다 · 「180도 보기」 → 다음 이동 동안 그 방향으로
   *   할 일: 「claw 서보 0」 「intake 모터 1」 「arm 위치 300」 (앞에 「중간에」 「도착 전」을 붙이면 그때)
   *   기다리기: 「1초 기다리기」 「기다리기 1.5초」 → 경로가 나뉜다
   * 반환 { chunks: [{ points: [...], wait }], errors: [{ text, msg }] } — 현재 경로 끝(start)에서 이어서.
   */
  function parseCommands(text, project, from) {
    var u = project.units, conv = { cm: 0.01, in: 0.0254, inch: 0.0254, m: 1, mm: 0.001 };
    var pos = { x: from.x, y: from.y }, head = from.h, pendingTurn = null, curveNext = false;
    var chunks = [{ points: [], wait: 0 }], errors = [];
    var cur = function () { return chunks[chunks.length - 1]; };
    var lastPoint = function () { var c = cur(); return c.points[c.points.length - 1]; };
    var num = '(-?\\d+(?:\\.\\d+)?)';
    var len = function (v, unit) { return unit ? v * conv[unit.toLowerCase()] / UNIT_M[u] : v; };
    var push = function (x, y, curve) {
      var q = { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, curve: !!curve, heading: { mode: curve ? 'tangent' : 'keep' }, actions: [] };
      if (pendingTurn !== null) { q.heading = { mode: 'linear', deg: Math.round(pendingTurn * 100) / 100 }; head = pendingTurn; pendingTurn = null; }
      cur().points.push(q);
      pos = { x: q.x, y: q.y };
    };
    // 나누기: 괄호 밖의 쉼표, 줄바꿈, 세미콜론, 숫자 사이가 아닌 마침표, 「그리고」「그다음」「다음에」
    var parts = [], buf = '', depth = 0, src = String(text);
    for (var ci = 0; ci < src.length; ci++) {
      var ch = src[ci];
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      var dotSplit = ch === '.' && !(/\d/.test(src[ci - 1] || '') && /\d/.test(src[ci + 1] || ''));
      if ((depth === 0 && (ch === ',' || ch === '，')) || ch === '\n' || ch === ';' || dotSplit) { parts.push(buf); buf = ''; } else buf += ch;
    }
    parts.push(buf);
    var clauses = [];
    parts.forEach(function (pp) { pp.split(/\s*(?:그리고|그다음에?|다음에)\s*/).forEach(function (x) { if (x.trim()) clauses.push(x.trim()); }); });
    clauses.forEach(function (s0) {
      var m, s = s0;
      // 앞에 붙은 돌기·보기 (「왼쪽으로 90도 돌면서 앞으로 60」): 떼어서 먼저 처리
      var lead = s.match(new RegExp('^(왼쪽|오른쪽)(?:으로)?\\s*' + num + '\\s*도\\s*(?:돌면서|돌고|돌아서)\\s+(.+)$')) ;
      if (lead) { pendingTurn = (pendingTurn === null ? head : pendingTurn) + (lead[1] === '왼쪽' ? 1 : -1) * Number(lead[2]); s = lead[3]; }
      var leadF = s.match(new RegExp('^' + num + '\\s*도\\s*(?:보면서|바라보며)\\s+(.+)$'));
      if (leadF) { pendingTurn = Number(leadF[1]); s = leadF[2]; }
      if ((m = s.match(new RegExp('^(앞으로|전진|뒤로|후진|왼쪽으로|왼쪽|오른쪽으로|오른쪽)\\s*' + num + '\\s*(cm|in|inch|m|mm)?\\s*(곡선)?\\s*(가기|이동|가)?$', 'i'))) && !/도/.test(s)) {
        var d = len(Number(m[2]), m[3]), w = m[1], h = rad(head);
        var dx = 0, dy = 0;
        if (/^(앞|전)/.test(w)) { dx = Math.cos(h) * d; dy = Math.sin(h) * d; }
        else if (/^(뒤|후)/.test(w)) { dx = -Math.cos(h) * d; dy = -Math.sin(h) * d; }
        else if (/^왼/.test(w)) { dx = -Math.sin(h) * d; dy = Math.cos(h) * d; }
        else { dx = Math.sin(h) * d; dy = -Math.cos(h) * d; }
        push(pos.x + dx, pos.y + dy, !!m[4] || curveNext); curveNext = false;
      } else if ((m = s.match(new RegExp('^\\(?\\s*' + num + '\\s*,\\s*' + num + '\\s*\\)?\\s*(으로|로|까지)?\\s*(곡선으로|곡선)?\\s*(가기|이동|가)?$')))) {
        push(Number(m[1]), Number(m[2]), !!m[4] || curveNext); curveNext = false;
      } else if ((m = s.match(new RegExp('^(왼쪽|오른쪽)(으로)?\\s*' + num + '\\s*도\\s*(돌면서|돌기|회전|돌아|돌고)?$')))) {
        pendingTurn = (pendingTurn === null ? head : pendingTurn) + (m[1] === '왼쪽' ? 1 : -1) * Number(m[3]);
      } else if ((m = s.match(new RegExp('^' + num + '\\s*도\\s*(보기|보면서|방향|바라보기)$')))) {
        pendingTurn = Number(m[1]);
      } else if ((m = s.match(/^곡선(으로)?$/))) {
        curveNext = true;
      } else if ((m = s.match(new RegExp('^(중간에|가는 중에|도착 전에?|도착하기 전에?|도착하면)?\\s*([A-Za-z_][\\w-]*)\\s*(서보|모터|위치|팔)\\s*' + num + '(?:\\s*(?:출력)\\s*' + num + ')?$')))) {
        var lp = lastPoint();
        if (!lp) { errors.push({ text: s0, msg: '할 일은 이동 다음에 써 주세요 (어느 점에서 할지 몰라요)' }); return; }
        var when = !m[1] || m[1] === '도착하면' ? 'arrive' : /전/.test(m[1]) ? 'before' : 'middle';
        var kind = m[3] === '서보' ? 'servo' : m[3] === '모터' ? 'motor' : 'motorPos';
        var act = { when: when, type: kind, device: m[2], value: Number(m[4]) };
        if (kind === 'motorPos') act.power = m[5] ? Number(m[5]) : 0.8;
        lp.actions.push(act);
      } else if ((m = s.match(new RegExp('^(?:기다리기\\s*' + num + '\\s*초|' + num + '\\s*초\\s*(?:기다리기|기다려|쉬기|대기))$')))) {
        var sec = Number(m[1] || m[2]);
        if (!cur().points.length) { errors.push({ text: s0, msg: '기다리기 앞에 이동이 있어야 해요' }); return; }
        cur().wait = (cur().wait || 0) + sec;
        chunks.push({ points: [], wait: 0 });
      } else {
        errors.push({ text: s0, msg: '이해하지 못했어요 — 예: 「앞으로 90」 「(60, 30)으로 곡선」 「왼쪽으로 90도 돌면서」 「claw 서보 0」 「1초 기다리기」' });
      }
    });
    if (pendingTurn !== null) errors.push({ text: '돌기', msg: '돌기 다음에 이동이 없어요 — 「왼쪽으로 90도 돌면서, 앞으로 60」처럼 이동과 같이 써 주세요' });
    if (!chunks[chunks.length - 1].points.length && chunks.length > 1) chunks.pop();
    return { chunks: chunks, errors: errors };
  }

  // ---------------------------------------------------------------- 4판: 북 표시 (데드휠 한 바퀴마다)

  /** 경로 위 데드휠 한 바퀴마다의 거리들 (project 단위). podDiameter: 사용자 단위 지름 (기본 goBILDA 4-Bar 32 mm). */
  function drumTicks(project, a, podDiameter) {
    if (!a || !a.geo) return [];
    var circ = Math.PI * (podDiameter > 0 ? podDiameter : fromM(0.032, project.units)), L = fromM(a.geo.length, project.units), out = [];
    for (var s = circ; s < L; s += circ) out.push(s);
    return out;
  }

  // ---------------------------------------------------------------- 경기 필드: BIOBUZZ (FTC 2026-27, KRC 2027)

  /**
   * BIOBUZZ 필드 요소 (inch, 필드 가운데 원점, +x = 파랑 쪽, +y = 관중 반대쪽).
   * 게임 매뉴얼 그림 9-2·9-4·9-5와 Event Field Setup Guide 8.3–8.4에서 잰 값 (±1 inch, TU06에서 다시 확인).
   * 타일: A–F 열이 관중 쪽에서 왼쪽→오른쪽, 1–6 행이 아래→위. 빨강 LZ = A5, 파랑 LZ = F2, 빨강 GARDEN = A1, 파랑 = F6.
   * FLOWER 4개는 벽 타일 이음매 (왼쪽 벽 y=−24, 위 벽 x=−24, 오른쪽 벽 y=24, 아래 벽 x=24). 파랑은 빨강의 점대칭.
   */
  var BIOBUZZ = {
    title: 'BIOBUZZ (2026-27)', half: 72,
    hive: { xMin: -25, xMax: 25, yMin: -26, yMax: 26 },            // HIVE 구조물 + CELL 둘레 (로봇이 못 지나가는 곳으로 본다)
    red: {
      loadingZone: { xMin: -72, xMax: -61, yMin: 24.8, yMax: 47.2 },  // PARK
      garden: { xMin: -72, xMax: -49, yMin: -72, yMax: -70 },
      flowers: [{ name: '왼쪽 벽 꽃', x: -72, y: -24 }, { name: '위 벽 꽃', x: -24, y: 72 }]
    }
  };
  /** 빨강 요소를 파랑으로 (점대칭). */
  function mirrorBox(b) { return { xMin: -b.xMax, xMax: -b.xMin, yMin: -b.yMax, yMax: -b.yMin }; }
  BIOBUZZ.blue = {
    loadingZone: mirrorBox(BIOBUZZ.red.loadingZone), garden: mirrorBox(BIOBUZZ.red.garden),
    flowers: BIOBUZZ.red.flowers.map(function (f) { return { name: f.name, x: -f.x, y: -f.y }; })
  };

  /**
   * BIOBUZZ 규칙 점검 (매뉴얼 TU06): 경로·마커·로봇 크기만 보고 알 수 있는 반칙 위험.
   * 진영은 첫 경로의 출발점으로 정한다 (x < 0 빨강). 반환: [{rule, level: 'error'|'warn', text, t0?, t1?}]
   * 심판 판정을 대신하지 않는다. 상대 로봇 접촉, 4개 넘게 들기(G407)처럼 경로로 알 수 없는 규칙은 보지 않는다.
   */
  function biobuzzRules(project, tl) {
    var F = BIOBUZZ, out = [], s = project.field.size, k = s / (2 * F.half), c = project.field.origin === 'center' ? 0 : s / 2;
    if (!project.paths.length) return out;
    var inch = function (v) { return (v - c) / k; };                     // 사용자 좌표 → 필드 가운데 원점 inch
    var L = project.robot.length / k, W = project.robot.width / k;
    var corners = function (x, y, h) {
      var cs = Math.cos(h), sn = Math.sin(h);
      return [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(function (q) { var lx = q[0] * L / 2, ly = q[1] * W / 2; return [x + cs * lx - sn * ly, y + sn * lx + cs * ly]; });
    };
    var inBox = function (pts, b) { // 로봇 상자와 직사각형이 겹치는지 (분리축)
      return overlap({ x: avg(pts, 0), y: avg(pts, 1), h: Math.atan2(pts[0][1] - pts[3][1], pts[0][0] - pts[3][0]), L: L, W: W },
        { x: (b.xMin + b.xMax) / 2, y: (b.yMin + b.yMax) / 2, h: 0, L: b.xMax - b.xMin, W: b.yMax - b.yMin });
    };
    var avg = function (pts, i) { return pts.reduce(function (a, q) { return a + q[i]; }, 0) / pts.length; };
    var st = project.paths[0].start, sx = inch(st.x), sy = inch(st.y), red = sx < 0, side = red ? '빨강' : '파랑';
    var own = function (x) { return red ? x <= 1e-6 : x >= -1e-6; };
    var p0 = corners(sx, sy, rad(st.h));
    // G304 출발 위치 · R102 출발 크기
    if (L > 18.01 || W > 18.01) out.push({ rule: 'R102', level: 'error', text: '로봇이 ' + Math.round(L * 10) / 10 + ' × ' + Math.round(W * 10) / 10 + ' in예요. 출발할 때는 18 in 정육면체 안이어야 해요' });
    if (!p0.every(function (q) { return own(q[0]); })) out.push({ rule: 'G304', level: 'error', text: '출발할 때 로봇 전체가 ' + side + ' 진영(' + (red ? 'A–C' : 'D–F') + '열) 안에 있어야 해요' });
    var gap = F.half - Math.max.apply(null, p0.map(function (q) { return Math.max(Math.abs(q[0]), Math.abs(q[1])); }));
    if (gap > 0.6) out.push({ rule: 'G304', level: 'error', text: '출발할 때 로봇이 필드 벽에 닿아 있어야 해요. 지금은 가장 가까운 벽에서 ' + Math.round(gap * 10) / 10 + ' in 떨어져 있어요' });
    [F.red.loadingZone, F.blue.loadingZone].forEach(function (lz) { if (inBox(p0, lz)) out.push({ rule: 'G304', level: 'error', text: '출발할 때 LOADING ZONE 안에 있으면 안 돼요' }); });
    F.red.flowers.concat(F.blue.flowers).forEach(function (f) {
      if (inBox(p0, { xMin: f.x - 4, xMax: f.x + 4, yMin: f.y - 4, yMax: f.y + 4 })) out.push({ rule: 'G304', level: 'error', text: '출발할 때 FLOWER(' + f.name + ')에 닿으면 안 돼요' });
    });
    if (!tl || !tl.items.length) return out;
    var lim = project.limit || 30, end = Math.min(tl.total, lim);
    // G402 오토 중 상대 진영 · G417 HIVE (시각별로 훑기)
    var spans = function (test) {
      var r = [], cur = null;
      for (var t = 0; t <= end + 1e-9; t += 0.05) {
        var q = poseAt(project, tl, t), hit = q && test(corners(inch(q.x), inch(q.y), q.h));
        if (hit && !cur) cur = { t0: t, t1: t }; if (hit) cur.t1 = t; if (!hit && cur) { r.push(cur); cur = null; }
      }
      if (cur) r.push(cur);
      return r;
    };
    var when = function (sp) { return sp.t1 > sp.t0 + 0.05 ? sp.t0.toFixed(1) + '–' + sp.t1.toFixed(1) + '초' : sp.t0.toFixed(1) + '초'; };
    spans(function (pts) { return pts.some(function (q) { return !own(q[0]); }); }).forEach(function (sp) {
      out.push({ rule: 'G402', level: 'warn', t0: sp.t0, t1: sp.t1, text: when(sp) + '에 상대 진영으로 넘어가요. 상대 로봇이나 요소를 건드리면 MAJOR FOUL이에요' });
    });
    spans(function (pts) { return inBox(pts, F.hive); }).forEach(function (sp) {
      out.push({ rule: 'G417', level: 'error', t0: sp.t0, t1: sp.t1, text: when(sp) + '에 HIVE 구조물에 닿아요. HIVE를 건드리면 안 돼요' });
    });
    // G403 오토가 끝나고 전환 8초 동안 움직임
    if (tl.total > lim + 0.05) out.push({ rule: 'G403', level: 'warn', t0: lim, t1: tl.total,
      text: '오토 경로가 ' + tl.total.toFixed(1) + '초예요. ' + lim + '초 뒤 전환 8초 동안 ' + (tl.total - lim).toFixed(1) + '초 움직여요' + (tl.total > lim + 8 ? ' (전환 시간도 넘어요)' : '') });
    // G410 FLOWER 득점은 경기 끝나기 1분 전부터 (오토에서는 안 됨). 마커 이름에 넣기·득점 뜻이 있고 FLOWER 근처일 때
    actionTimes(project, tl).forEach(function (m) {
      if (m.t > lim || !/넣|득점|score|place|nectar|넥타/i.test(m.name || '')) return;
      var q = poseAt(project, tl, m.t), x = inch(q.x), y = inch(q.y);
      var near = F.red.flowers.concat(F.blue.flowers).filter(function (f) { return Math.hypot(f.x - x, f.y - y) < 18; })[0];
      if (near) out.push({ rule: 'G410', level: 'error', t0: m.t, t1: m.t, text: m.t.toFixed(1) + '초 마커 「' + m.name + '」가 FLOWER(' + near.name + ') 옆이에요. FLOWER 득점은 경기 끝나기 1분 전부터예요' });
    });
    return out;
  }

  /**
   * BIOBUZZ 대표 오토 (빨강, 같은 편 2대). 흡입·발사 1.5 s는 가정값. sim의 BiobuzzAutoSimTest가 같은 오토를 시뮬레이터로 확인한다.
   * 반환 [{ id, title, note, r1: project, r2: project }] — r1을 열고 r2는 Ghost로.
   */
  function biobuzzAutos() {
    var DW = { launch: 1.5, intake: 1.5 }, ROBOT = 18;
    var pt = function (x, y, opt) { var q = { x: x, y: y, curve: false, heading: { mode: 'keep' }, actions: [] }; for (var k in opt || {}) q[k] = opt[k]; return q; };
    var face = function (deg) { return { heading: { mode: 'linear', deg: deg } }; };
    var cface = function (deg) { return { curve: true, heading: { mode: 'linear', deg: deg } }; };
    var C = { curve: true };
    function build(name, start, legs) {
      var p = newProject('in');
      p.robot.length = p.robot.width = ROBOT;
      p.field.size = 144;
      p.routineName = name;
      var cur = start;
      p.paths = legs.map(function (l) {
        var q = newPath(l.name, cur.x, cur.y, cur.h);
        q.points = JSON.parse(JSON.stringify(l.points));
        q.wait = l.wait || 0;
        var a = analyze(p, q), last = q.points[q.points.length - 1];
        cur = { x: last.x, y: last.y, h: a.geo ? Math.round(geoHeading(a.geo, a.geo.length) * 180 / Math.PI * 100) / 100 : cur.h };
        return q;
      });
      return p;
    }
    /*
     * 칸 위치 (매뉴얼 TU06 그림 10-2): 빨강 HIVE는 x ≈ −13, 두 칸은 관중 쪽·뒤쪽 끝이고 입구도 그 끝을 본다.
     * 처음 위 칸 = 관중 쪽(NECTAR 3개, POLLEN 3개면 TIP), TIP 하면 뒤쪽 칸이 위로(빈 칸, POLLEN 8개). 그다음은 다시 관중 쪽.
     * 발사 자리 A = 관중 쪽 벽 앞, B = 뒤쪽 벽 앞(위 벽 꽃 x = −24를 피해 x = −9). 로봇은 한 번에 4개까지(G407).
     * 로봇1은 관중 쪽(A·왼쪽 꽃), 로봇2는 뒤쪽(B·위 꽃)을 맡아 서로 길이 거의 안 겹친다.
     */
    var S1 = { x: -63, y: 5, h: 0 }, S2 = { x: -34, y: -63, h: 90 }, A = { x: -13, y: -63, h: 90 }, B = [-9, 63];
    var PARK1 = [-60, 50], PARK2 = [-63, 24];
    // 흡입: 꽃 도착 전(0.8 지점)에 켜고, 다음 경로 가운데서 끈다. 모터 이름 intake는 예시 — 팀 Configure 이름으로 바꾼다
    var INTAKE_ON = { when: 'before', type: 'motor', device: 'intake', value: 1 }, INTAKE_OFF = { when: 'middle', type: 'motor', device: 'intake', value: 0 };
    var leg = {
      r1ParkOnly: { name: 'LEAVE + PARK', points: [pt(-55, 25, C), pt(PARK1[0], PARK1[1], C)] },
      r2ParkOnly: { name: 'LEAVE + PARK', points: [pt(-48, -30, C), pt(-52, 2, C), pt(PARK2[0], PARK2[1], C)] },
      aShoot: { name: '관중 쪽 칸에 예압 발사 (TIP 1)', points: [pt(-13, -62)], wait: DW.launch },
      aPark: { name: 'PARK (LOADING ZONE 아래쪽)', points: [pt(-45, -30, C), pt(-56, 4, C), pt(PARK2[0], PARK2[1], C)] },
      leftFlower: { name: '왼쪽 꽃으로 (도착 전 흡입 켜기)', points: [pt(-59, -24, { curve: true, heading: { mode: 'linear', deg: 180 }, actions: [INTAKE_ON] })], wait: DW.intake },
      aWait: { name: '관중 쪽 칸 앞으로 (가다가 흡입 끄기) — TIP 2로 다시 위가 될 때까지 기다렸다 발사', points: [pt(-13, -62, { curve: true, heading: { mode: 'linear', deg: 90 }, actions: [INTAKE_OFF] })], wait: DW.launch },
      bWait: { name: 'LEAVE 후 뒤쪽에서 TIP 1 기다리기', points: [pt(-40, 40, C), pt(-30, 52, C)], wait: 0 },
      bShoot: { name: '뒤쪽 칸에 예압 발사', points: [pt(B[0], B[1], face(-90))], wait: DW.launch },
      topFlower: { name: '위 꽃으로 (벽에서 떨어져서 돌고, 도착 전 흡입 켜기)', points: [pt(-14, 50), pt(-24, 59, { heading: { mode: 'linear', deg: 90 }, actions: [INTAKE_ON] })], wait: DW.intake },
      bShoot2: { name: '뒤쪽 칸에 발사 (TIP 2) — 가다가 흡입 끄기', points: [pt(-14, 50, { heading: { mode: 'linear', deg: -90 }, actions: [INTAKE_OFF] }), pt(B[0], B[1])], wait: DW.launch },
      bPark: { name: 'PARK (LOADING ZONE 위쪽)', points: [pt(-40, 58, C), pt(PARK1[0], PARK1[1], C)] }
    };
    // 기다림은 앞 경로의 wait에 넣는다 (TIP은 마지막 공 뒤 3~5 s 걸림, Chief Delphi 14343): 로봇2는 TIP 1까지, ③ 로봇1은 TIP 2(약 22 s)까지
    var withWait = function (l, w) { var c = JSON.parse(JSON.stringify(l)); c.wait = w; return c; };
    return [
      { id: '①', title: 'BIOBUZZ ① LEAVE + PARK', note: '둘 다 벽에서 떨어져 LOADING ZONE으로. 3 + 5점',
        r1: build('로봇1 ① LEAVE+PARK', S1, [leg.r1ParkOnly]), r2: build('로봇2 ① LEAVE+PARK', S2, [leg.r2ParkOnly]) },
      { id: '②', title: 'BIOBUZZ ② TIP 2번 (한 대 한 칸씩)', note: '로봇1 관중 쪽 벽에서 예압 → TIP 1 → PARK. 로봇2 예압 + 위 꽃 4개를 뒤쪽 칸에 → TIP 2 → PARK. 오토 56점',
        r1: build('로봇1 ② 관중 쪽 칸 예압(TIP 1) → PARK', A, [leg.aShoot, leg.aPark]),
        r2: build('로봇2 ② 뒤쪽 칸 예압 → 위 꽃 → 뒤쪽 칸(TIP 2) → PARK', S1, [withWait(leg.bWait, 3), leg.bShoot, leg.topFlower, leg.bShoot2, leg.bPark]) },
      { id: '③', title: 'BIOBUZZ ③ TIP 2번 + TIP 3 준비', note: '②에 더해 로봇1이 왼쪽 꽃 4개를 TIP 2 뒤 다시 위가 된 관중 쪽 칸에 넣어 둠 → TELEOP에서 4개만 더 넣으면 TIP 3. 로봇1은 PARK 대신 기다림, 오토 51점',
        r1: build('로봇1 ③ 예압(TIP 1) → 왼쪽 꽃 → 관중 쪽 칸(TIP 2 기다렸다 발사)', A,
          [leg.aShoot, leg.leftFlower, withWait(leg.aWait, 12.1 + DW.launch)]),
        noPark: ['r1'],
        r2: build('로봇2 ③ 뒤쪽 칸 예압 → 위 꽃 → 뒤쪽 칸(TIP 2) → PARK', S1, [withWait(leg.bWait, 3), leg.bShoot, leg.topFlower, leg.bShoot2, leg.bPark]) },
      robits()
    ];
    /**
     * ④ AndyMark Robits StarterBot(메카넘 개조) 기준 — 위 칸(NECTAR 3개)에 예압 4개 → TIP 1, 왼쪽 꽃 4개 + 로봇2 예압 4개 = 8개 → TIP 2.
     * 칸 위치 (매뉴얼 그림 10-2, TU06): 빨강 HIVE는 x ≈ −13, 두 칸은 관중 쪽·뒤쪽 끝. 처음 위 칸 = 관중 쪽(입구도 관중 쪽을 봄),
     * TIP 하면 뒤쪽 칸이 위로 → 뒤쪽 벽에서 쏜다. Robits 예제 오토가 「발사기를 칸 가운데에 맞춰 벽에 붙여 출발, 그 자리에서 발사」라 발사 자리 = 벽 앞.
     * 뒤쪽 발사 자리는 위 벽 꽃(x = −24)을 피해 x = −9 (칸 입구 20 inch 안).
     * 캐터펄트 한 발 = 감기 1.0 s + 쉬기 0.5 s (Robits 예제 코드), 4발 + 공 자리 잡기 0.3 s = 6.3 s. 꽃 빼기 2.5 s는 가정값.
     * 로봇2는 TIP 1 뒤 뒤쪽 발사 자리에서 예압 4개를 쏘고, 우리가 오기 전에 LOADING ZONE 위쪽으로 PARK.
     */
    function robits() {
      var VOLLEY = 6.3, FLOWER = 2.5, A = { x: -13, y: -63, h: 90 }, B = [-9, 63];
      var stickOut = { when: 'before', type: 'servo', device: 'stick', value: 0.65 }, stickIn = { when: 'leave', type: 'servo', device: 'stick', value: 0.46 };
      // 롤러 2개는 연속 회전 서보 — 마커 모터 출력으로 돌린다. Robits 예제는 rollerI를 REVERSE로 두고 1을 주므로 방향 설정 없이 -1
      var rollIn = [{ when: 'before', type: 'motor', device: 'rollerI', value: -1 }, { when: 'before', type: 'motor', device: 'rollerF', value: 1 }];
      var rollOff = [{ when: 'middle', type: 'motor', device: 'rollerI', value: 0 }, { when: 'middle', type: 'motor', device: 'rollerF', value: 0 }];
      var r1 = build('로봇1 ④ Robits: 관중 쪽 칸 발사(TIP 1) → 왼쪽 꽃 → 뒤쪽 칸 발사(TIP 2) → PARK', A, [
        { name: '벽에서 조금 떼고 관중 쪽 칸에 4발', points: [pt(-13, -62)], wait: VOLLEY },
        { name: '왼쪽 꽃으로 (도착 전 막대 내리고 흡입)', points: [pt(-59, -24, { curve: true, heading: { mode: 'linear', deg: 180 },
          actions: [stickOut].concat(rollIn) })], wait: FLOWER },
        { name: '뒤쪽 칸 발사 자리로 (막대 올리고 가다가 흡입 끄기)', points: [pt(-40, 20, { curve: true, actions: [stickIn] }), pt(-34, 40, C),
          pt(B[0], B[1], { curve: true, heading: { mode: 'linear', deg: -90 }, actions: rollOff })], wait: VOLLEY },
        { name: 'PARK (LOADING ZONE 위쪽)', points: [pt(-60, 48)] }
      ]);
      var r2 = build('로봇2 ④ LEAVE → TIP 1 기다리기 → 뒤쪽 칸 발사 → PARK', S1, [
        { name: 'LEAVE 후 TIP 1 기다리기', points: [pt(-50, 5)], wait: 4 },
        { name: '뒤쪽 칸 발사 자리로', points: [pt(-40, 40, C), pt(B[0], B[1], { curve: true, heading: { mode: 'linear', deg: -90 } })], wait: 3 },
        { name: 'PARK (위 벽 → 왼쪽 벽 따라 LOADING ZONE 아래쪽)', points: [pt(-40, 62, C), pt(-63, 46, C), pt(-63, 24, C)] }
      ]);
      return { id: '④', title: 'BIOBUZZ ④ Robits 스타터봇: TIP 2번', note: 'Robits(메카넘) 관중 쪽 벽에서 예압 4개 → TIP 1, 왼쪽 꽃 4개 + 로봇2 예압 4개를 뒤쪽 칸에 → TIP 2, 둘 다 PARK. 오토 56점 (로봇2 없으면 28점)',
        r1: r1, r2: r2 };
    }
  }

  var api = {
    UNIT_M: UNIT_M, newProject: newProject, newPath: newPath, defaultRobot: defaultRobot, limits: limits,
    robotFromJson: robotFromJson, buildGeometry: buildGeometry, profile: profile, progressAt: progressAt,
    geoPoint: geoPoint, geoHeading: geoHeading, segmentAt: segmentAt, junctionAngleDeg: junctionAngleDeg,
    check: check, analyze: analyze, javaSnippet: javaSnippet, javaOpMode: javaOpMode, javaPathExpr: javaPathExpr,
    blocksList: blocksList, convertUnits: convertUnits, segsOf: segsOf, toPoints: toPoints, examples: examples, WHEN_F: WHEN_F,
    routineJson: routineJson, parseGrlog: parseGrlog, replayAt: replayAt, replayGap: replayGap, suggestions: suggestions,
    parseCommands: parseCommands, drumTicks: drumTicks, BIOBUZZ: BIOBUZZ, biobuzzRules: biobuzzRules, biobuzzAutos: biobuzzAutos, timeline: timeline, poseAt: poseAt, actionTimes: actionTimes, mirrorPath: mirrorPath, overlap: overlap, collisions: collisions, toM: toM, fromM: fromM, norm: norm, rad: rad
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GPath = api;
})(this);
