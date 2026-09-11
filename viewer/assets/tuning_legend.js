/* Tuning tetrahedron — 3-D legend for the Number-Time-Space maps (three.js).
 *
 * Every voxel (or fsaverage vertex) is a point at its channel vector
 *     c = (R2_number, R2_time, R2_space) / vmax
 * along the number (up), time (lower left) and space (lower right) axes.
 * The map renders opacity = c_number + c_time + c_space (clipped at 1) and
 * hue = the proportions, so in these coordinates the iso-opacity surfaces
 * are the planes sum(c) = const, parallel to the triangular face sum(c) = 1
 * (the colour triangle), and every voxel lives in the tetrahedron between
 * the apex (0,0,0) — nothing explained — and that face — the top of the
 * colour scale.  Voxels beyond vmax are projected onto the face along the
 * ray from the apex, exactly like the map's opacity clip.  The reference
 * face shows the hue of each direction; the points use exactly the colour
 * painted on the cortex (hue x opacity over the dark curvature gray), so
 * the legend and the map agree by construction.  Colours reproduce
 * nst_hue_rgb / nst_render (isoluminant OKLab mix) in compose/scripts/
 * 20260830_web_viewers/02_build_viewers.py.
 */
window.TuningLegend = (function () {
  'use strict';
  // Must stay identical to nst_hue_rgb in 02_build_viewers.py, or the legend
  // stops agreeing with the cortex. hue = proportion-weighted hue-vector mix;
  // chroma = iso_cmax(L) * sel^ISO_SEL_EXP; lightness = ISO_L rising smoothly
  // toward white with g^GLOW_EXP, g = (PR - 1) / 2, gated by sqrt(magnitude) so
  // weak voxels cannot glow. A plain power, never a threshold: iso-PR contours
  // are circles about the simplex centroid, so a switch-on point paints a white
  // disc on the triangle and a false boundary on the cortex.
  var ISO_L = 0.68, ISO_L_MAX = 1.0, ISO_SEL_EXP = 0.75, GLOW_EXP = 5.0;
  var HUES = [6, 126, 246].map(function (d) { return d * Math.PI / 180; });
  var COSH = HUES.map(Math.cos), SINH = HUES.map(Math.sin);
  // axis per channel: number up (y), time lower-left (z), space lower-right (x)
  var AXIS = [[0, 1, 0], [0, 0, 1], [1, 0, 0]];
  var GRAY = 0.12;                 // curvature backdrop the maps are composited over
  var MIN_A = 0.04;                // drop points fainter than 4 % opacity
  var LABELS = ['Number', 'Time', 'Space'];
  var LABEL_RGB = ['#fa95ab', '#9acb2f', '#7abef9'];

  function srgb(c) { c = c < 0 ? 0 : c; return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
  function oklabToSrgb(L, a, b, out) {
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    var s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    out[0] = Math.min(1, srgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s));
    out[1] = Math.min(1, srgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s));
    out[2] = Math.min(1, srgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s));
    return out;
  }

  // Largest chroma sRGB allows at lightness L in all three anchor directions
  // (the Python iso_cmax). Bisection is too slow per point, so it is tabulated
  // once over the only range the scheme uses, L in [ISO_L, 1], and lerped.
  var CMAX_N = 256, CMAX_LUT = new Float64Array(CMAX_N + 1);
  (function buildCmaxLut() {
    var lin = new Float64Array(3);
    function inGamut(L, a, b) {
      var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      var s_ = L - 0.0894841775 * a - 1.2914855480 * b;
      var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
      lin[0] = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      lin[1] = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      lin[2] = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
      for (var i = 0; i < 3; i++) if (lin[i] < -1e-9 || lin[i] > 1 + 1e-9) return false;
      return true;
    }
    for (var k = 0; k <= CMAX_N; k++) {
      var L = ISO_L + (ISO_L_MAX - ISO_L) * (k / CMAX_N), best = Infinity;
      for (var h = 0; h < 3; h++) {
        var lo = 0, hi = 0.5;
        for (var it = 0; it < 28; it++) {
          var mid = 0.5 * (lo + hi);
          if (inGamut(L, mid * COSH[h], mid * SINH[h])) lo = mid; else hi = mid;
        }
        if (lo < best) best = lo;
      }
      CMAX_LUT[k] = 0.92 * best;   // OK_C_SAFETY
    }
  }());
  function isoCmax(L) {
    var t = (L - ISO_L) / (ISO_L_MAX - ISO_L);
    if (t <= 0) return CMAX_LUT[0];
    if (t >= 1) return CMAX_LUT[CMAX_N];
    var x = t * CMAX_N, i = x | 0, f = x - i;
    return CMAX_LUT[i] * (1 - f) + CMAX_LUT[i + 1] * f;
  }
  function glow(g) {
    g = g < 0 ? 0 : (g > 1 ? 1 : g);
    return Math.pow(g, GLOW_EXP);
  }
  // colour (sRGB) of a channel mix; v = [n, t, s] >= 0, mask = [1/0, 1/0, 1/0].
  // mag = summed R2 fraction (defaults to 1, i.e. the top of the scale).
  function hue(v, mask, out, mag) {
    var tot = 0, ua = 0, ub = 0, sq = 0;
    for (var i = 0; i < 3; i++) {
      if (!mask[i]) continue;
      var x = v[i] > 0 ? v[i] : 0;
      tot += x; ua += x * COSH[i]; ub += x * SINH[i];
    }
    if (tot <= 0) { out[0] = out[1] = out[2] = 0; return out; }
    ua /= tot; ub /= tot;
    for (var j = 0; j < 3; j++) {
      if (!mask[j]) continue;
      var pj = (v[j] > 0 ? v[j] : 0) / tot;
      sq += pj * pj;
    }
    var m = mag === undefined ? 1 : (mag < 0 ? 0 : (mag > 1 ? 1 : mag));
    var pr = sq > 0 ? 1 / sq : 1;
    var g = (pr - 1) / 2; g = g < 0 ? 0 : (g > 1 ? 1 : g);
    var L = ISO_L + (ISO_L_MAX - ISO_L) * glow(g) * Math.sqrt(m);
    var sel = Math.sqrt(ua * ua + ub * ub);
    if (sel < 1e-9) return oklabToSrgb(L, 0, 0, out);
    var c = isoCmax(L) * Math.pow(Math.min(1, sel), ISO_SEL_EXP);
    return oklabToSrgb(L, c * ua / sel, c * ub / sel, out);
  }
  // rendered colour: hue x opacity a over the gray backdrop
  function shade(v, mask, a, out) {
    hue(v, mask, out, a);
    for (var i = 0; i < 3; i++) out[i] = Math.min(1, (1 - a) * GRAY + out[i] * a);
    return out;
  }
  // position of channel vector c (already / vmax, masked): clip sum to 1
  function place3(c, out) {
    var a = c[0] + c[1] + c[2], s = a > 1 ? 1 / a : 1;
    out[0] = out[1] = out[2] = 0;
    for (var d = 0; d < 3; d++) for (var j = 0; j < 3; j++) out[j] += AXIS[d][j] * c[d] * s;
    return a > 1 ? 1 : a;
  }

  function makeLabel(text, color) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 64;
    var g = c.getContext('2d');
    g.font = '600 40px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(text, 128, 32);
    g.fillStyle = color; g.fillText(text, 128, 32);
    var tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(0.44, 0.11, 1); sp.renderOrder = 20;
    return sp;
  }

  function makeRing() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,0.9)';
    g.beginPath(); g.arc(32, 32, 20, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 4; g.strokeStyle = '#fff';
    g.beginPath(); g.arc(32, 32, 20, 0, Math.PI * 2); g.stroke();
    var tex = new THREE.CanvasTexture(c);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(0.16, 0.16, 1); sp.renderOrder = 30;
    return sp;
  }

  function create(canvas) {
    if (!window.THREE) return null;
    var W = canvas.clientWidth || 184, H = canvas.clientHeight || W;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    } catch (e) { return null; }
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    renderer.setClearColor(new THREE.Color(GRAY, GRAY, GRAY), 1);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 20);
    var root = new THREE.Group(); scene.add(root);
    var CENTER = new THREE.Vector3(0.3, 0.34, 0.3);

    // --- static frame: axis lines (apex -> tips) + labels
    var axisMat = new THREE.LineBasicMaterial({ color: 0x9aa0a8, transparent: true, opacity: 0.55 });
    var labels = [];
    for (var i = 0; i < 3; i++) {
      var a = AXIS[i];
      var geo = new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(0, 0, 0), new THREE.Vector3(a[0], a[1], a[2])]);
      root.add(new THREE.Line(geo, axisMat));
      var lab = makeLabel(LABELS[i], LABEL_RGB[i]);
      lab.position.set(a[0] * 1.16, a[1] * 1.16, a[2] * 1.16);
      root.add(lab); labels.push(lab);
    }

    var surface = null, edges = null, points = null, ring = makeRing(), rayLine = null;
    ring.visible = false; root.add(ring);
    var mask = [1, 1, 1], pointSrc = null;

    // --- reference geometry for the current channel subset: the face sum(c) = 1
    function buildSurface() {
      if (surface) { root.remove(surface); surface.geometry.dispose(); surface = null; }
      if (edges) { root.remove(edges); edges.geometry.dispose(); edges = null; }
      var on = [];
      for (var i = 0; i < 3; i++) if (mask[i]) on.push(i);
      labels.forEach(function (sp, k) { sp.material.opacity = mask[k] ? 1 : 0.3; });
      var pos = [], col = [], idx = [], tmp = [0, 0, 0], v = [0, 0, 0], epos = [], p3 = [0, 0, 0];
      var N = 40;
      function push(c, a) {          // vertex at channel vector c with its colour
        place3(c, p3); pos.push(p3[0], p3[1], p3[2]);
        if (a === undefined) hue(c, mask, tmp); else shade(c, mask, a, tmp);
        col.push(tmp[0], tmp[1], tmp[2]);
      }
      function seg(c0, c1) {         // wireframe edge between channel vectors
        place3(c0, p3); epos.push(p3[0], p3[1], p3[2]);
        place3(c1, p3); epos.push(p3[0], p3[1], p3[2]);
      }
      function unit(k, s) { var c = [0, 0, 0]; c[k] = s; return c; }
      if (on.length === 3) {
        // colour triangle: barycentric grid over the face, hue of each mix
        for (var iu = 0; iu <= N; iu++) for (var iw = 0; iw <= N - iu; iw++) {
          v[0] = 1 - (iu + iw) / N; v[1] = iu / N; v[2] = iw / N;   // number, time, space
          push(v);
        }
        var rowStart = [], acc = 0;
        for (iu = 0; iu <= N; iu++) { rowStart.push(acc); acc += N - iu + 1; }
        for (iu = 0; iu < N; iu++) for (iw = 0; iw < N - iu; iw++) {
          var A = rowStart[iu] + iw, B = rowStart[iu + 1] + iw;
          idx.push(A, A + 1, B);
          if (iw < N - iu - 1) idx.push(A + 1, B + 1, B);
        }
        // tetrahedron wireframe: face edges + edges to the apex
        seg(unit(0, 1), unit(1, 1)); seg(unit(1, 1), unit(2, 1)); seg(unit(2, 1), unit(0, 1));
      } else if (on.length === 2) {
        // two channels: the face is the segment c_p + c_q = 1 (a hue ribbon);
        // the voxels fill the triangle apex-p-q
        var p = on[0], q = on[1], k = 3 - p - q, wd = 0.035;
        for (var it = 0; it <= N; it++) {
          var t = it / N; v[0] = v[1] = v[2] = 0; v[p] = 1 - t; v[q] = t;
          hue(v, mask, tmp);
          place3(v, p3);
          for (var side = -1; side <= 1; side += 2) {
            pos.push(p3[0] + AXIS[k][0] * wd * side, p3[1] + AXIS[k][1] * wd * side, p3[2] + AXIS[k][2] * wd * side);
            col.push(tmp[0], tmp[1], tmp[2]);
          }
        }
        for (it = 0; it < N; it++) { A = it * 2; idx.push(A, A + 2, A + 1, A + 1, A + 2, A + 3); }
        seg(unit(p, 1), unit(q, 1));
      } else {
        // one channel: a ramp along its axis in the rendered colour (a = c)
        var k1 = on[0], w1 = 0.035, sd = AXIS[(k1 + 1) % 3];
        for (var ir = 0; ir <= N; ir++) {
          var r = ir / N; v[0] = v[1] = v[2] = 0; v[k1] = r;
          shade(v, mask, r, tmp); place3(v, p3);
          pos.push(p3[0] - sd[0] * w1, p3[1] - sd[1] * w1, p3[2] - sd[2] * w1); col.push(tmp[0], tmp[1], tmp[2]);
          pos.push(p3[0] + sd[0] * w1, p3[1] + sd[1] * w1, p3[2] + sd[2] * w1); col.push(tmp[0], tmp[1], tmp[2]);
        }
        for (ir = 0; ir < N; ir++) { A = ir * 2; idx.push(A, A + 2, A + 1, A + 1, A + 2, A + 3); }
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      var m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide,
        transparent: true, opacity: on.length === 3 ? 0.42 : 0.8, depthWrite: false });
      surface = new THREE.Mesh(g, m); surface.renderOrder = 10;
      root.add(surface);
      if (epos.length) {
        var eg = new THREE.BufferGeometry();
        eg.setAttribute('position', new THREE.Float32BufferAttribute(epos, 3));
        edges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }));
        edges.renderOrder = 11; root.add(edges);
      }
    }

    // --- one point per voxel with the rendered map colour
    function buildPoints() {
      if (points) { root.remove(points); points.geometry.dispose(); points = null; }
      widget.count = 0;
      if (!pointSrc) return;
      var sc = pointSrc.sc, vmax = pointSrc.vmax, n = sc.n;
      var ch = [sc.num, sc.time, sc.space];
      var pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      var v = [0, 0, 0], tmp = [0, 0, 0], p3 = [0, 0, 0], k = 0;
      for (var i = 0; i < n; i++) {
        var a = 0;
        for (var d = 0; d < 3; d++) {
          v[d] = mask[d] ? Math.max(ch[d][i], 0) / vmax : 0;
          a += v[d];
        }
        if (!(a >= MIN_A)) continue;
        var ac = place3(v, p3);
        pos[k * 3] = p3[0]; pos[k * 3 + 1] = p3[1]; pos[k * 3 + 2] = p3[2];
        shade(v, mask, ac, tmp);
        col[k * 3] = tmp[0]; col[k * 3 + 1] = tmp[1]; col[k * 3 + 2] = tmp[2];
        k++;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, k * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(col.subarray(0, k * 3), 3));
      var m = new THREE.PointsMaterial({ size: 1.4 * dpr, sizeAttenuation: false, vertexColors: true,
                                         depthTest: false });
      points = new THREE.Points(g, m); points.renderOrder = 15;
      root.add(points);
      widget.count = k;
    }

    // --- camera orbit (drag) with idle auto-rotate; home view looks at the face
    var AZ0 = Math.PI / 4, EL0 = Math.atan(1 / Math.SQRT2);
    var az = AZ0, el = EL0, dist = 4.0, auto = true, dirty = true;
    function place() {
      camera.position.set(CENTER.x + dist * Math.cos(el) * Math.cos(az),
                          CENTER.y + dist * Math.sin(el),
                          CENTER.z + dist * Math.cos(el) * Math.sin(az));
      camera.lookAt(CENTER);
    }
    var drag = null;
    canvas.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, az: az, el: el }; auto = false;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      az = drag.az + (e.clientX - drag.x) * 0.012;
      el = Math.max(-1.3, Math.min(1.3, drag.el + (e.clientY - drag.y) * 0.012));
      dirty = true;
    });
    function endDrag() { drag = null; }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('dblclick', function () { az = AZ0; el = EL0; auto = true; dirty = true; });

    var running = false, visible = true;
    function frame() {
      running = false;
      if (!visible) return;
      if (auto) { az += 0.0035; dirty = true; }
      if (dirty) { place(); renderer.render(scene, camera); dirty = false; }
      if (auto) { running = true; requestAnimationFrame(frame); }
    }
    function kick() { dirty = true; if (!running) { running = true; requestAnimationFrame(frame); } }
    canvas.addEventListener('pointermove', kick);

    var widget = {
      count: 0,
      setChannels: function (m) {
        if (m[0] === mask[0] && m[1] === mask[1] && m[2] === mask[2] && surface) return;
        mask = m.slice(); buildSurface(); buildPoints(); kick();
      },
      setPoints: function (sc, vmax) {
        if (pointSrc && pointSrc.sc === sc && pointSrc.vmax === vmax) return;
        pointSrc = { sc: sc, vmax: vmax }; buildPoints(); kick();
      },
      clearPoints: function () { pointSrc = null; buildPoints(); kick(); },
      // highlight a voxel given its raw channel R2 values and the brain's vmax
      highlight: function (nv, tv, sv, vmax) {
        var v = [Math.max(nv, 0) / vmax, Math.max(tv, 0) / vmax, Math.max(sv, 0) / vmax], p = [0, 0, 0];
        for (var d = 0; d < 3; d++) if (!mask[d]) v[d] = 0;
        place3(v, p);
        ring.position.set(p[0], p[1], p[2]); ring.visible = true;
        if (rayLine) { root.remove(rayLine); rayLine.geometry.dispose(); }
        var geo = new THREE.BufferGeometry().setFromPoints(
          [new THREE.Vector3(0, 0, 0), new THREE.Vector3(p[0], p[1], p[2])]);
        rayLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
        rayLine.renderOrder = 25; root.add(rayLine);
        kick();
      },
      clearHighlight: function () {
        ring.visible = false;
        if (rayLine) { root.remove(rayLine); rayLine.geometry.dispose(); rayLine = null; }
        kick();
      },
      setVisible: function (on) { visible = on; if (on) kick(); },
      resetView: function () { az = AZ0; el = EL0; auto = true; kick(); }
    };
    buildSurface(); place(); kick();
    return widget;
  }

  return { create: create, hue: hue, shade: shade };
})();
