/* research/dbs.html: the loop illustration (#dbs-loop).
   Without this script the figure is static and complete: the loop reads
   "moving, or at rest?" and "higher while moving, lower at rest", and the
   traces show three bursts of movement. With it, a playhead walks along the
   traces and the loop names the current state ("moving" / "higher" or
   "at rest" / "lower"). Two buttons jump to either state; Play/Pause runs
   the walk. Under prefers-reduced-motion the walk never starts on its own
   and the Play button is not offered; the two state buttons still work.
   The walk pauses when the figure is off screen or the tab is hidden. */
(function () {
  'use strict';
  var fig = document.getElementById('dbs-loop');
  if (!fig || !fig.querySelector) return;
  var traces = fig.querySelector('.dbs-loop-traces');
  var head = fig.querySelector('.dbs-playhead');
  var live = fig.querySelectorAll('.dbs-live');
  if (!traces || !head) return;

  var W = 440;                       /* the traces' viewBox width */
  var PERIOD = 12000;                /* ms for one walk across */
  /* the movement bursts, as fractions of the width (match the markup) */
  var BURSTS = [[0.10, 0.30], [0.46, 0.58], [0.72, 0.92]];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function moving(t) {
    for (var i = 0; i < BURSTS.length; i++) {
      if (t >= BURSTS[i][0] && t <= BURSTS[i][1]) return true;
    }
    return false;
  }

  var t = 0.2, playing = false, visible = true, raf = 0, last = 0, state = '';

  function draw() {
    var x = (t * W).toFixed(1);
    head.setAttribute('x1', x);
    head.setAttribute('x2', x);
    var s = moving(t) ? 'moving' : 'rest';
    if (s === state) return;
    state = s;
    fig.setAttribute('data-state', s);
    for (var i = 0; i < live.length; i++) {
      live[i].textContent = live[i].getAttribute('data-' + s);
    }
    btnMove.setAttribute('aria-pressed', String(s === 'moving'));
    btnRest.setAttribute('aria-pressed', String(s === 'rest'));
  }

  function frame(now) {
    raf = 0;
    if (!playing || !visible) return;
    if (last) t = (t + (now - last) / PERIOD) % 1;
    last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function run() {
    if (raf || !playing || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function setPlaying(p) {
    playing = p;
    if (btnPlay) {
      btnPlay.textContent = p ? 'Pause' : 'Play';
      btnPlay.setAttribute('aria-pressed', String(p));
    }
    if (p) run(); else stop();
  }

  /* controls */
  var bar = document.createElement('div');
  bar.className = 'dbs-loop-controls';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Loop illustration');
  function button(label, cls) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dbs-btn ' + cls;
    b.textContent = label;
    bar.appendChild(b);
    return b;
  }
  var btnMove = button('Moving', 'dbs-btn--move');
  var btnRest = button('At rest', 'dbs-btn--rest');
  var btnPlay = (reduce && reduce.matches) ? null : button('Pause', 'dbs-btn--play');
  fig.insertBefore(bar, fig.querySelector('figcaption'));

  btnMove.addEventListener('click', function () { setPlaying(false); t = 0.2; draw(); });
  btnRest.addEventListener('click', function () { setPlaying(false); t = 0.38; draw(); });
  if (btnPlay) btnPlay.addEventListener('click', function () { setPlaying(!playing); });

  fig.classList.add('is-live');
  draw();

  if (reduce && reduce.addEventListener) {
    reduce.addEventListener('change', function () {
      if (reduce.matches) {
        setPlaying(false);
        if (btnPlay) { btnPlay.remove(); btnPlay = null; }
      }
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) run(); else stop();
    }).observe(fig);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else run();
  });

  setPlaying(!!btnPlay);
})();
