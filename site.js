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

    // Integrate Lorenz once. The trajectory is drawn as a line rather than as
    // a cloud of dots, so it can afford more steps and a smaller one: dots
    // read as grain, and the thing worth looking at is the winding.
    var N = 20000, dt = 0.0027;
    var pts = new Float32Array(N * 3);
    // A long burn-in, discarded: drawn as dots the fly-in from (0.1, 0, 0) was
    // lost in the cloud, but drawn as a line it is a stray straight stroke
    // running into the attractor from outside it.
    var x = 0.1, y = 0, z = 0, s = 10, r = 28, b = 8 / 3;
    for (var i = -3000; i < N; i++) {
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
    // whole thing comes out one muddy colour. tanh separates them: each lobe
    // takes an end of the ramp and only the crossing between them is the
    // middle stop.
    for (var i = 0; i < N; i++)
      bucket[i] = Math.round((0.5 + 0.5 * Math.tanh(pts[i * 3] / 6)) * (NB - 1));

    // Break the trajectory into runs of consecutive points that share a
    // colour. Drawing run by run keeps the line continuous where the path is
    // continuous, and never draws a chord across the gap where it left a
    // colour and came back to it. Runs are grouped by colour so a frame sets
    // strokeStyle NB times rather than once per segment.
    var runsBy = [];
    for (var k3 = 0; k3 < NB; k3++) runsBy.push([]);
    var rs = 0;
    for (var i3 = 1; i3 <= N; i3++) {
      if (i3 === N || bucket[i3] !== bucket[rs]) {
        if (i3 - rs > 1) runsBy[bucket[rs]].push(rs, i3);   // start, end
        rs = i3;
      }
    }

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

    var proj = new Float32Array(N * 3);
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
      // Project once per frame, then stroke. Additive blending is what makes
      // the dense windings glow: where many filaments cross they sum toward
      // white, which is the structure of the attractor rather than a fog laid
      // over it.
      for (var i = 0, o = 0; i < N; i++, o += 3) {
        var px = pts[o], py = pts[o + 1], pz = pts[o + 2];
        var rx = px * ca - py * sa, ry = px * sa + py * ca;     // turn about z
        proj[o] = cx + rx * scale;                              // screen x
        proj[o + 1] = cy - (pz * cp + ry * sp) * scale;          // screen y
        proj[o + 2] = (ry * cp - pz * sp + 30) / 60;             // 0 far … 1 near
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. The attractor itself, dim: the shape the trajectory is confined to.
      //    Two passes, the far half thinner and fainter, which is the depth cue
      //    now that the dots are gone.
      for (var k = 0; k < NB; k++) {
        var runs = runsBy[k];
        if (!runs.length) continue;
        for (var pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = ramp[k];
          ctx.globalAlpha = pass ? 0.26 : 0.11;
          ctx.lineWidth = pass ? 1.1 : 0.7;
          ctx.beginPath();
          for (var q = 0; q < runs.length; q += 2) {
            var a0 = runs[q], a1 = runs[q + 1], started = false;
            for (var m = a0; m < a1; m++) {
              var near = proj[m * 3 + 2] > 0.5;
              if (near !== !!pass) { started = false; continue; }
              if (!started) { ctx.moveTo(proj[m * 3], proj[m * 3 + 1]); started = true; }
              else ctx.lineTo(proj[m * 3], proj[m * 3 + 1]);
            }
          }
          ctx.stroke();
        }
      }

      // 2. The state, moving: a bright comet running along the path, so it is
      //    visible that this is one trajectory being integrated forward rather
      //    than a static tangle. It spirals out on one wing, flips to the other,
      //    and never repeats - which is the only thing the picture has to say.
      var head = Math.floor(t * 0.0007 * 1000) % N;   // ~700 points a second
      var CH = 10, CK = 1500;                          // chunks, comet length
      for (var cch = 0; cch < CH; cch++) {
        var f0 = (cch + 1) / CH;
        ctx.globalAlpha = 0.10 + 0.9 * f0 * f0;
        ctx.lineWidth = 0.8 + 1.9 * f0;
        var i0 = head - CK + Math.floor(cch * CK / CH);
        var i1 = head - CK + Math.floor((cch + 1) * CK / CH);
        var cur = -1, open = false;
        for (var n2 = i0; n2 <= i1; n2++) {
          if (n2 < 1 || n2 >= N) { open = false; continue; }
          if (bucket[n2] !== cur) {
            if (open) ctx.stroke();
            cur = bucket[n2]; ctx.strokeStyle = ramp[cur];
            ctx.beginPath(); ctx.moveTo(proj[(n2 - 1) * 3], proj[(n2 - 1) * 3 + 1]);
            open = true;
          }
          ctx.lineTo(proj[n2 * 3], proj[n2 * 3 + 1]);
        }
        if (open) ctx.stroke();
      }
      // the state itself
      if (head > 0 && head < N) {
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(proj[head * 3], proj[head * 3 + 1], 1.9, 0, 6.2832);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
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
  // The inventory's thumbnails carry no autoplay attribute and preload
  // nothing, so for them the observer is what starts playback at all.
  var clips = document.querySelectorAll('.area-media video, .project-media video, .output-media video, .fig video');
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
