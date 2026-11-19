/* Alicia Zeng — the two things on this site that need a script.
   Neither is load-bearing: without JavaScript every clip stays on its poster
   and the section list on a paper page is a plain list of links.

   1. The clips: play when on screen, pause when not, never under
      prefers-reduced-motion.
   2. On a paper page, the sticky section list marks the section in view.  */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. videos: play on their own, but only when they are worth it ----- */
  /* The clips carry no autoplay attribute and preload nothing, so the observer
     below is what starts them. That is the difference between a home page that
     fetches 4.9 MB before the reader has scrolled and one that fetches its
     posters and then the clip it is actually showing. Without JavaScript each
     clip stays on its poster, which is a real frame of the thing it shows.
     This still only ever takes play away as well: it stops everything under
     prefers-reduced-motion, and pauses clips that have scrolled off screen. */
  // The inventory's thumbnails carry no autoplay attribute and preload
  // nothing, so for them the observer is what starts playback at all.
  //
  // Only silent loops qualify. The NeurIPS talk sits in a .project-media too
  // and it has sound, so scrolling past it must not start it; being muted is
  // what separates the two, not having controls - the viewer tour has controls
  // because it is a hundred seconds long and worth scrubbing, and it should
  // still start on its own.
  var clips = [].filter.call(
    document.querySelectorAll('.hero-media video, .area-media video, .project-media video, .output-media video, .fig video'),
    function (v) { return v.muted && v.loop; });
  // A clip may ask to run slower than it was recorded (data-rate="0.6"):
  // the hero's turning cortex reads better at a calmer pace. Set as the
  // default rate too, so a reload of the media does not undo it.
  clips.forEach(function (v) {
    var r = parseFloat(v.getAttribute('data-rate'));
    if (r > 0) { v.defaultPlaybackRate = r; v.playbackRate = r; }
  });
  if (clips.length) {
    if (reduceMotion) {
      clips.forEach(function (v) {
        v.autoplay = false;
        v.removeAttribute('autoplay');
        v.setAttribute('controls', '');
        v.pause();
      });
    } else if ('IntersectionObserver' in window) {
      // A clip the reader stopped stays stopped. Without this, pausing the
      // tour and scrolling away would start it again on the way back. The
      // __auto flag marks the pauses and plays this code makes itself, so
      // they are not mistaken for the reader's.
      clips.forEach(function (v) {
        v.addEventListener('pause', function () { if (!v.__auto) v.__stopped = true; });
        v.addEventListener('play', function () { if (!v.__auto) v.__stopped = false; });
      });
      var clipObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) {
            if (v.__stopped) return;
            v.__auto = true;
            var p = v.play();
            if (p) p.catch(function () {});
            setTimeout(function () { v.__auto = false; }, 0);
          } else if (!v.paused) {
            v.__auto = true;
            v.pause();
            // pause() queues its event; clear the flag after it has fired, the
            // same way the play branch above does.
            setTimeout(function () { v.__auto = false; }, 0);
          }
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
    var order = Object.keys(links), visible = {}, current = null;
    // Track the whole visible set rather than latching the last section to
    // cross the band. Latching left the marker on a section the reader had
    // scrolled well past whenever nothing new entered the band - at the top of
    // the page, at the bottom, and across any section taller than the band.
    function mark() {
      var atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      var pick = null;
      if (atEnd) {
        // The last section can never win the band - it sits below it once the
        // page has stopped scrolling - so at the foot of the page mark it
        // outright, which is where the reader has actually arrived.
        pick = order[order.length - 1];
      } else {
        for (var i = 0; i < order.length; i++) if (visible[order[i]]) { pick = order[i]; break; }
      }
      var next = pick ? links[pick] : null;
      if (next === current) return;
      if (current) current.removeAttribute('aria-current');
      current = next;
      if (current) {
        current.setAttribute('aria-current', 'true');
        // On a narrow screen the list is one row that scrolls sideways, so
        // keep the marked section in sight. scrollLeft on the list itself,
        // not scrollIntoView, which can also move the page.
        var row = nav.querySelector('ol');
        if (row && row.scrollWidth > row.clientWidth) {
          var item = current.parentNode;
          row.scrollLeft = item.offsetLeft - (row.clientWidth - item.offsetWidth) / 2;
        }
      }
    }
    window.addEventListener('scroll', mark, { passive: true });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      mark();
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }
})();

/* ==== agent:motion ==== */
/* The script half of the motion system (the CSS half is the last block of
   styles.css). Two things. A clip starts at the frame its poster shows, so
   the still starts to move instead of cutting to another picture. And
   sections, cards, rows, figures and stat tiles that are below the fold
   settle in, once, the first time they reach the viewport.

   The entrances only ever hide what the reader cannot see yet, and they are
   built so that nothing can stay hidden:
   - nothing is hidden at load. The first sign that the reader is about to
     scroll (a wheel, a touch, a key, a scroll) is what arms it, and only
     elements at least 160px below the screen are taken. A page that is only
     looked at, printed or captured whole is never touched;
   - no script, reduced motion, print, or no IntersectionObserver: nothing is
     hidden at all (the .m-pre rule sits inside a media query, and this code
     returns before adding the class);
   - a jump (a hash in the address, an in-page link, find-in-page, the
     scrollbar, a fast fling, a restored scroll position) shows what it lands
     on at once, with no entrance;
   - a keyboard focus inside a hidden element shows it at once;
   - if the observer never reports, or anything here throws, everything is
     shown.
   It reads layout once, when it arms, and uses IntersectionObserver after
   that; the only scroll listener is the one-shot that arms it. Each element
   is unobserved as it is shown.                                             */
(function () {
  'use strict';

  var w = window, d = document;

  /* ---- clips: the poster and the first moving frame are the same frame ---- */
  /* Each clip's poster is a frame from inside the clip, not its first, so a
     clip that started from the top cut from one picture to another the moment
     it began to play. A silent loop has no beginning that matters: start it at
     the frame its poster shows and the still simply starts to move. Setting
     currentTime before anything has loaded only records where playback should
     begin; it fetches nothing and does not touch how the clips are started
     and paused further up this file. Each time is the presentation time of the
     frame the poster was cut from, plus half a frame (found by comparing the
     poster with every frame of its clip); a re-rendered clip can carry its
     own in data-poster-at, and a clip not listed here starts at its first
     frame as before. The browser has to be able to seek, so the server must
     answer Range requests: GitHub Pages does, python's http.server does not,
     and there a clip starts from the top exactly as it used to. */
  var POSTER_AT = {
    'viewer-thumb': 8.18, 'area-bayesian': 9.017, 'area-cognition': 3.383,
    'project-birdsong': 7.683, 'number-viewer-tour': 0.817
  };
  [].forEach.call(d.querySelectorAll('video[poster][muted][loop]'), function (v) {
    if (v.readyState !== 0 || v.currentTime) return;
    var src = (v.querySelector('source') || v).getAttribute('src') || '';
    var name = src.split(/[?#]/)[0].split('/').pop().replace(/\.[a-z0-9]+$/i, '');
    var t = parseFloat(v.getAttribute('data-poster-at'));
    if (!(t >= 0)) t = POSTER_AT[name];
    if (t > 0) { try { v.currentTime = t; } catch (e) {} }
  });

  /* ---- entrances -------------------------------------------------------- */
  var main = d.querySelector('main');
  if (!main || !('IntersectionObserver' in w) || !w.matchMedia || !main.matches || !main.closest) return;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;
  // Coming back to a page with the back button is not arriving at it.
  var entry = w.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (entry && entry.type === 'back_forward') return;

  // What settles in. Containers are opened and their children taken one by
  // one; anything else directly inside them is a unit as it stands. The head
  // of a paper page, the sticky section list and the homepage opening (which
  // has its own entrance in CSS) are never touched.
  var OPEN = '.hero, .block, .paper, .areas, .projects, .outputs, .stream, .beats';
  var SKIP = '.paper-head, .paper-nav, script, style, template';
  var STAGED = '.hero-eyebrow, .hero-statement, .hero-proof, .hero-media';
  var INNER = '.paper-section .fig, .paper-section .stats > li, .paper-section .box';
  var ARM = ['wheel', 'touchstart', 'keydown', 'scroll'];
  var LEAD = 160;      // px below the screen left alone: a first wheel notch can cover it before this runs
  var TRAVEL = 0.6;    // an element first seen above this share of the viewport got there by a jump
  var FLING = 2.4;     // px per ms; faster than this nobody is reading
  var MAX_STEPS = 4;   // the stagger stops growing after this many neighbours

  var armed = false, pending = [], io = null, endIo = null, alive = false, lastT = 0, lastY = 0;
  var wanted = hashTarget(w.location.hash);   // where a hash or an in-page link is taking the reader

  function hashTarget(hash) {
    if (!hash || hash.length < 2) return null;
    try { return d.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return null; }
  }

  function clear(el) {
    el.classList.remove('m-pre');
    if (!el.getAttribute('class')) el.removeAttribute('class');
  }

  // Show one element. With `step` undefined it is simply there; with a number
  // it settles in, that many stagger steps after the first of its group.
  function show(el, step) {
    var k = pending.indexOf(el);
    if (k > -1) pending.splice(k, 1);
    if (io) io.unobserve(el);
    if (step !== undefined) {
      var timer;
      var done = function (ev) {
        if (ev && (ev.target !== el || ev.animationName !== 'm-rise')) return;
        clearTimeout(timer);
        el.removeEventListener('animationend', done);
        el.removeEventListener('animationcancel', done);
        el.classList.remove('m-in');
        el.style.removeProperty('--m-i');
        if (!el.getAttribute('style')) el.removeAttribute('style');
        if (!el.getAttribute('class')) el.removeAttribute('class');
      };
      if (step) el.style.setProperty('--m-i', String(step));
      el.classList.add('m-in');
      el.addEventListener('animationend', done);
      el.addEventListener('animationcancel', done);
      timer = setTimeout(done, 1500);
    }
    clear(el);
    if (!pending.length) finish();
  }

  function showAll() { pending.slice().forEach(function (el) { show(el); }); }

  // Everything from the top of the page down to one screen past `target`.
  function showThrough(target) {
    if (!target || !pending.length) return;
    var limit = target.getBoundingClientRect().top + w.innerHeight;
    pending.slice().forEach(function (el) {
      if (el.getBoundingClientRect().top < limit || el.contains(target) || target.contains(el)) show(el);
    });
  }

  function settle(batch) {
    batch.sort(function (a, b) { return (a.top - b.top) || (a.left - b.left); });
    batch.forEach(function (o, i) { show(o.el, Math.min(i, MAX_STEPS)); });
  }

  function onCross(entries) {
    alive = true;
    var now = performance.now(), y = w.pageYOffset, vh = w.innerHeight;
    var dt = now - lastT;
    var jumped = dt > 0 && dt < 250 && Math.abs(y - lastY) / dt > FLING;
    lastT = now; lastY = y;
    var batch = [];
    entries.forEach(function (e) {
      if (!e.isIntersecting || pending.indexOf(e.target) < 0) return;
      var r = e.boundingClientRect;
      if (r.top < vh * TRAVEL) jumped = true;
      batch.push({ el: e.target, top: r.top, left: r.left });
    });
    if (!batch.length) return;
    if (jumped) batch.forEach(function (o) { show(o.el); });
    else settle(batch);
  }

  // The observer's line sits a little inside the viewport, so the last
  // elements of a page might never cross it. When the footer shows, whatever
  // is on screen and still waiting settles in.
  function onEnd(entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    var vh = w.innerHeight, batch = [];
    pending.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh) batch.push({ el: el, top: r.top, left: r.left });
    });
    settle(batch);
  }

  function onHash() { wanted = hashTarget(w.location.hash); showThrough(wanted); }
  function onClick(ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="#"]') : null;
    if (!a || a.hostname !== w.location.hostname || a.pathname !== w.location.pathname) return;
    var t = hashTarget(a.hash);
    if (t) { wanted = t; showThrough(t); }
  }
  function onFocus(ev) {
    var t = ev.target, u;
    if (!t || !t.closest) return;
    while ((u = t.closest('.m-pre'))) show(u);
  }
  function onReduce() { if (reduce.matches) showAll(); }

  function disarm() { ARM.forEach(function (type) { w.removeEventListener(type, arm); }); }

  function finish() {
    disarm();
    if (io) { io.disconnect(); io = null; }
    if (endIo) { endIo.disconnect(); endIo = null; }
    w.removeEventListener('hashchange', onHash);
    w.removeEventListener('beforeprint', showAll);
    d.removeEventListener('click', onClick, true);
    d.removeEventListener('focusin', onFocus);
    if (reduce.removeEventListener) reduce.removeEventListener('change', onReduce);
  }

  // If the observer has not reported at all a second and a half after the
  // page became visible, it is not going to: show everything.
  function watchdog() {
    setTimeout(function () {
      if (alive || !pending.length) return;
      if (d.hidden) { d.addEventListener('visibilitychange', watchdog, { once: true }); return; }
      showAll();
    }, 1500);
  }

  function arm() {
    if (armed) return;
    armed = true;
    disarm();
    if (reduce.matches) return finish();
    try {
      var units = [];
      (function collect(parent, depth) {
        [].forEach.call(parent.children, function (el) {
          var open = depth < 5 && el.matches(OPEN);
          if (el.matches(SKIP) || el.matches(STAGED)) return;
          if (open) collect(el, depth + 1);
          else if (!el.querySelector(STAGED)) units.push(el);
        });
      })(main, 0);
      [].forEach.call(main.querySelectorAll(INNER), function (el) {
        if (units.indexOf(el) < 0) units.push(el);
      });

      // One read of the layout. The fold is the bottom of the screen the
      // reader is looking at or being taken to, plus the lead.
      var vh = w.innerHeight;
      var fold = vh + Math.max(LEAD, wanted ? wanted.getBoundingClientRect().top : 0);
      units.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < fold || !(r.width || r.height)) return;
        if (wanted && (el.contains(wanted) || wanted.contains(el))) return;
        pending.push(el);
      });
      if (!pending.length) return finish();
      pending.forEach(function (el) { el.classList.add('m-pre'); });

      // The top margin reaches far above the viewport, so an element the
      // reader jumped past counts as arrived too, and nothing is left hidden
      // above the screen.
      io = new IntersectionObserver(onCross, { rootMargin: '100000px 0px -4% 0px', threshold: 0 });
      pending.forEach(function (el) { io.observe(el); });
      var end = d.querySelector('.foot') || main.lastElementChild;
      if (end) { endIo = new IntersectionObserver(onEnd); endIo.observe(end); }
      watchdog();
    } catch (err) {
      [].forEach.call(d.querySelectorAll('.m-pre'), clear);
      pending = [];
      finish();
    }
  }

  ARM.forEach(function (type) { w.addEventListener(type, arm, { passive: true }); });
  w.addEventListener('hashchange', onHash);
  w.addEventListener('beforeprint', showAll);
  d.addEventListener('click', onClick, true);
  d.addEventListener('focusin', onFocus);
  if (reduce.addEventListener) reduce.addEventListener('change', onReduce);
})();
