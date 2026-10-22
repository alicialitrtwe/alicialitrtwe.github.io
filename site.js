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
      if (current) current.setAttribute('aria-current', 'true');
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
