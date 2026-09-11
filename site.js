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
    var N = 7000, dt = 0.005;
    var pts = new Float32Array(N * 3);
    var x = 0.1, y = 0, z = 0, s = 10, r = 28, b = 8 / 3;
    for (var i = -400; i < N; i++) {
      var dx = s * (y - x), dy = x * (r - z) - y, dz = x * y - b * z;
      x += dx * dt; y += dy * dt; z += dz * dt;
      if (i >= 0) { pts[i * 3] = x; pts[i * 3 + 1] = y; pts[i * 3 + 2] = z - 25; }
    }

    var ink = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#e8e8e8';
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
      var a = t * 0.00012, ca = Math.cos(a), sa = Math.sin(a);
      var pitch = 0.35, cp = Math.cos(pitch), sp = Math.sin(pitch);
      var scale = Math.min(W / 48, H / 52), cx = W / 2, cy = H / 2;
      ctx.fillStyle = ink;
      for (var i = 0; i < N; i++) {
        var px = pts[i * 3], py = pts[i * 3 + 1], pz = pts[i * 3 + 2];
        var rx = px * ca - py * sa, ry = px * sa + py * ca;     // turn about z
        var sy = pz * cp + ry * sp;                             // screen vertical
        var depth = (ry * cp - pz * sp + 30) / 60;              // 0 far … 1 near
        ctx.globalAlpha = 0.1 + 0.55 * depth;
        var sz = 0.6 + 1.1 * depth;
        ctx.fillRect(cx + rx * scale, cy - sy * scale, sz, sz);
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
