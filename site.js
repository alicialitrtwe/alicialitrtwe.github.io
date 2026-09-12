/* Alicia Zeng — the two things on this site that need a script.
   Neither is load-bearing: without JavaScript the hero is an empty band
   and the section list on a paper page is a plain list of links.

   1. The hero: a strange attractor (Lorenz's), drawn as a cloud of a few
      thousand faint points, slowly turning in three dimensions.
      ABSTRACT and decorative — it is not data from any paper. It is here
      because state-space reconstruction is the through-line of the work.
   2. On a paper page, the sticky section list marks the section in view.  */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. the hero ------------------------------------------------------- */
  var canvas = document.querySelector('.hero-viz');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');

    // Integrate Lorenz once. N points, dt small enough that the trace is
    // smooth; the first few hundred steps are discarded so the cloud
    // starts on the attractor rather than flying in toward it.
    var N = 11000, dt = 0.005;
    var pts = new Float32Array(N * 3);
    var x = 0.1, y = 0, z = 0, s = 10, r = 28, b = 8 / 3;
    for (var i = -400; i < N; i++) {
      var dx = s * (y - x), dy = x * (r - z) - y, dz = x * y - b * z;
      x += dx * dt; y += dy * dt; z += dz * dt;
      if (i >= 0) { pts[i * 3] = x; pts[i * 3 + 1] = y; pts[i * 3 + 2] = z - 25; }
    }

    // Colour along the attractor rather than over it: the wing a point sits
    // on decides its hue, so the two lobes carry two of the site's three area
    // colours and the crossing between them carries the third. The stops are
    // read from the stylesheet so the palette lives in one place.
    var css = getComputedStyle(document.documentElement);
    function hex(name, fallback) {
      var v = css.getPropertyValue(name).trim() || fallback;
      return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)];
    }
    var stops = [hex('--c-closed', '#35bcc9'), hex('--c-bayesian', '#e09a6a'), hex('--c-cognition', '#d4698f')];
    var NB = 18, ramp = new Array(NB);
    for (var k = 0; k < NB; k++) {
      var u = (k / (NB - 1)) * (stops.length - 1), lo = Math.floor(u), f = u - lo;
      var a1 = stops[lo], b1 = stops[Math.min(lo + 1, stops.length - 1)];
      ramp[k] = 'rgb(' + Math.round(a1[0] + (b1[0] - a1[0]) * f) + ','
                       + Math.round(a1[1] + (b1[1] - a1[1]) * f) + ','
                       + Math.round(a1[2] + (b1[2] - a1[2]) * f) + ')';
    }
    // Sort the points into colour runs once, so a frame sets fillStyle NB
    // times rather than N times; only globalAlpha varies per point.
    var bucket = new Uint8Array(N), counts = new Int32Array(NB + 1);
    // The two lobes sit at x = +/-sqrt(b(r-1)) = +/-8.5, so a linear map over
    // the full x range lands both of them in the middle of the ramp and the
    // whole cloud comes out one muddy colour. tanh separates them: each lobe
    // takes an end of the ramp and only the crossing between them is the
    // middle stop.
    for (var i = 0; i < N; i++) {
      var u2 = 0.5 + 0.5 * Math.tanh(pts[i * 3] / 6);
      bucket[i] = Math.round(u2 * (NB - 1));
      counts[bucket[i] + 1]++;
    }
    for (var k2 = 0; k2 < NB; k2++) counts[k2 + 1] += counts[k2];
    var order = new Int32Array(N), fill = counts.slice();
    for (var i2 = 0; i2 < N; i2++) order[fill[bucket[i2]]++] = i2;

    // Fit the attractor to whatever box it is given. It turns about z, so the
    // horizontal half-extent is the largest radius in the xy plane and the
    // vertical half-extent is that radius pitched plus |z| - both invariant
    // under the rotation, so this is computed once and never clips.
    var pitch = 0.35, cpFit = Math.cos(pitch), spFit = Math.sin(pitch);
    var maxRX = 0, maxSY = 0;
    for (var q = 0; q < N; q++) {
      var qr = Math.sqrt(pts[q * 3] * pts[q * 3] + pts[q * 3 + 1] * pts[q * 3 + 1]);
      var qy = Math.abs(pts[q * 3 + 2]) * cpFit + qr * spFit;
      if (qr > maxRX) maxRX = qr;
      if (qy > maxSY) maxSY = qy;
    }

    var W, H, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      // The attractor's axis of symmetry is z. Turn it slowly about that
      // axis, keep z (mostly) vertical on screen with a slight pitch, so
      // the two lobes read as the butterfly and rotate through edge-on.
      // Start broadside: at phase 0 the attractor is edge-on and reads as a
      // swept sliver rather than as the two lobes. 2.25 rad opens on the
      // butterfly and the turn carries it through edge-on and back.
      var a = 2.25 + t * 0.00012, ca = Math.cos(a), sa = Math.sin(a);
      var cp = cpFit, sp = spFit;
      var scale = 0.94 * Math.min(W / (2 * maxRX), H / (2 * maxSY));
      var cx = W / 2, cy = H / 2;
      for (var k = 0; k < NB; k++) {
        ctx.fillStyle = ramp[k];
        for (var j = counts[k]; j < counts[k + 1]; j++) {
          var i = order[j];
          var px = pts[i * 3], py = pts[i * 3 + 1], pz = pts[i * 3 + 2];
          var rx = px * ca - py * sa, ry = px * sa + py * ca;   // turn about z
          var sy = pz * cp + ry * sp;                           // screen vertical
          var depth = (ry * cp - pz * sp + 30) / 60;            // 0 far … 1 near
          ctx.globalAlpha = 0.12 + 0.55 * depth;
          var sz = 0.6 + 1.1 * depth;
          ctx.fillRect(cx + rx * scale, cy - sy * scale, sz, sz);
        }
      }
      ctx.globalAlpha = 1;
    }

    var t0 = null;
    function frame(now) {
      if (t0 === null) t0 = now;
      draw(now - t0);
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', function () { resize(); draw(0); });
    if (reduceMotion) draw(0); else requestAnimationFrame(frame);
  }

  /* ---- 2. videos: autoplay, but not against the viewer's wishes ---------- */
  /* The markup carries autoplay, so the page plays on load with no click.
     This only ever takes play away: it stops everything under
     prefers-reduced-motion, and pauses clips that have scrolled off screen so
     they are not decoding in the background. */
  var clips = document.querySelectorAll('.area-media video, .project-media video, .fig video');
  if (clips.length) {
    if (reduceMotion) {
      clips.forEach(function (v) {
        v.autoplay = false;
        v.removeAttribute('autoplay');
        v.setAttribute('controls', '');
        v.pause();
      });
    } else if ('IntersectionObserver' in window) {
      var clipObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) { var p = v.play(); if (p) p.catch(function () {}); }
          else if (!v.paused) { v.pause(); }
        });
      }, { rootMargin: '200px 0px', threshold: 0.01 });
      clips.forEach(function (v) { clipObs.observe(v); });
    }
  }

  /* ---- 2. paper page: which section is in view --------------------------- */
  var nav = document.querySelector('.paper-nav');
  if (nav && 'IntersectionObserver' in window) {
    var links = {};
    nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (current) current.removeAttribute('aria-current');
        current = links[e.target.id];
        if (current) current.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }
})();
