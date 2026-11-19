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


/* ==== agent:reading ==== */
/* Reading aids for the long paper pages. Every one decorates markup that is
   already complete without it, and none runs anywhere but on a page with an
   <article class="paper">:

   1. figure zoom   - figure.fig img opens enlarged in a native <dialog>
   2. BibTeX        - a Copy button on pre.bibtex
   3. wayfinding    - a reading-progress line on the sticky section list and a
                      back-to-top button, on pages more than three screens long
   4. tables        - numeric columns flush right; a wide table can be
                      scrolled from the keyboard
   5. equations     - a display equation wider than the column scrolls in a box
   6. print         - folded legends and the transcript are opened for printing

   Nothing here animates. The one scroll listener is passive, does its work at
   most once a frame, and only reads scrollY and writes a transform. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  var paper = doc.querySelector('article.paper');
  if (!paper || !('querySelector' in doc) || !window.requestAnimationFrame) return;

  var shell = doc.querySelector('.shell');
  var area = shell ? shell.getAttribute('data-area') : null;

  function make(tag, cls, attrs, html) {
    var n = doc.createElement(tag), k;
    if (cls) n.className = cls;
    if (attrs) for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (html) n.innerHTML = html;
    return n;
  }
  // Things appended to <body> sit outside .shell, so they are told the area
  // themselves and take its colour through the same [data-area] rules.
  function wearArea(n) { if (area) n.setAttribute('data-area', area); return n; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function svg(path) {
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + path + '</svg>';
  }
  var ICON = {
    expand: svg('<path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9"/>'),
    close:  svg('<path d="m3.5 3.5 9 9M12.5 3.5l-9 9"/>'),
    plus:   svg('<path d="M8 3v10M3 8h10"/>'),
    minus:  svg('<path d="M3 8h10"/>'),
    out:    svg('<path d="M6.5 3.5h-3v9h9v-3M9.5 2.5h4v4M13.5 2.5 7.5 8.5"/>'),
    up:     svg('<path d="M8 13V3.5M3.5 8 8 3.5 12.5 8"/>'),
    copy:   svg('<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/>'),
    check:  svg('<path d="m3 8.5 3.2 3.2L13 4.8"/>')
  };

  // One polite live region for everything this block has to say.
  var live = null, liveTimer = 0;
  function announce(text) {
    if (!live) {
      live = make('span', 'vh', { role: 'status', 'aria-live': 'polite' });
      doc.body.appendChild(live);
    }
    live.textContent = '';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { live.textContent = text; }, 60);
  }

  /* ---- 1. figure zoom --------------------------------------------------- */
  var IMG_URL = /\.(?:png|jpe?g|webp|avif|gif|svg)(?:[?#].*)?$/i;
  function stem(url) { return String(url).replace(/[?#].*$/, '').replace(/\.[a-z0-9]+$/i, ''); }

  // Where the best copy of a figure lives: the file its link points at, or a
  // "Full size" link in its caption. The copy already on screen is shown at
  // once; a genuinely different file replaces it when it has loaded.
  function sources(img) {
    var shown = img.currentSrc || img.src;
    var link = img.closest('a[href]');
    var full = link && IMG_URL.test(link.href) ? link.href : null;
    if (!full) {
      var fig = img.closest('figure');
      var cap = fig && fig.querySelector('figcaption a[href]');
      if (cap && IMG_URL.test(cap.href)) full = cap.href;
    }
    return { shown: shown, full: full || shown };
  }

  var lb = null, lbImg, lbStage, lbCap, lbCapIn, lbScale, lbIn, lbOut, lbOrig, lbClose, lbTitle, lbHint;
  var lbTrigger = null, lbLock = null;
  var view = { nw: 1, nh: 1, base: 1, whole: 1, max: 2, scale: 1 };
  var PAD = 16;                                   // .rd-lb-stage padding, 1rem

  function buildLightbox() {
    lb = wearArea(make('dialog', 'rd-lightbox', { 'aria-label': 'Enlarged figure' }));
    var bar = make('div', 'rd-lb-bar');
    lbTitle = make('span', 'rd-lb-title', { 'aria-hidden': 'true' });
    lbHint = make('span', 'rd-lb-hint', { 'aria-hidden': 'true' });
    lbOut = make('button', 'rd-lb-btn', { type: 'button', 'aria-label': 'Zoom out', title: 'Zoom out (−)' }, ICON.minus);
    lbScale = make('span', 'rd-lb-scale', { 'aria-hidden': 'true' });
    lbIn = make('button', 'rd-lb-btn', { type: 'button', 'aria-label': 'Zoom in', title: 'Zoom in (+)' }, ICON.plus);
    lbOrig = make('a', 'rd-lb-btn', { target: '_blank', rel: 'noopener', 'aria-label': 'Open the image file in a new tab', title: 'Open the image file' }, ICON.out);
    lbClose = make('button', 'rd-lb-btn rd-lb-close', { type: 'button', 'aria-label': 'Close', title: 'Close (Esc)' }, ICON.close);
    bar.appendChild(lbTitle); bar.appendChild(lbHint); bar.appendChild(lbOut); bar.appendChild(lbScale); bar.appendChild(lbIn);
    bar.appendChild(lbOrig); bar.appendChild(lbClose);
    lbStage = make('div', 'rd-lb-stage', { tabindex: '0', role: 'group', 'aria-label': 'Figure. Scroll or use the arrow keys to pan when zoomed.' });
    lbImg = make('img', 'rd-lb-img', { alt: '', draggable: 'false' });
    lbStage.appendChild(lbImg);
    lbCap = make('div', 'rd-lb-cap', { id: 'rd-lb-cap' });
    lbCapIn = make('div');
    lbCap.appendChild(lbCapIn);
    lb.appendChild(bar); lb.appendChild(lbStage); lb.appendChild(lbCap);
    doc.body.appendChild(lb);

    lbClose.addEventListener('click', function () { lb.close(); });
    lbIn.addEventListener('click', function () { zoomTo(view.scale * 1.5); });
    lbOut.addEventListener('click', function () { zoomTo(view.scale / 1.5); });
    // The stage around the image is the backdrop: a click there closes.
    lbStage.addEventListener('click', function (e) { if (e.target === lbStage) lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', onClose);
    lb.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '+' || e.key === '=') { zoomTo(view.scale * 1.5); e.preventDefault(); }
      else if (e.key === '-' || e.key === '_') { zoomTo(view.scale / 1.5); e.preventDefault(); }
      else if (e.key === '0') { toBase(); e.preventDefault(); }
    });

    // Click or tap: opening size <-> full size, about the point that was clicked.
    // With a mouse, a press that moves is a drag and pans the stage instead.
    var drag = null, dragged = false;
    lbImg.addEventListener('click', function (e) {
      if (dragged) { dragged = false; return; }
      if (lb.hasAttribute('data-zoomed')) { toBase(); return; }
      // Full size, where that is a real step up. On a phone "full size" is
      // four screens of upscaled pixels, so there the step is two and a half
      // times the opening size, or one image pixel per screen pixel if larger.
      var full = Math.min(1, Math.max(view.base * 2.5, 1 / (window.devicePixelRatio || 1)));
      zoomTo(full / view.base >= 1.5 ? full : Math.min(view.max, view.base * 2), e.clientX, e.clientY);
    });
    lbImg.addEventListener('pointerdown', function (e) {
      dragged = false;
      if (e.pointerType !== 'mouse' || e.button !== 0 || !lb.hasAttribute('data-zoomed')) return;
      drag = { x: e.clientX, y: e.clientY, l: lbStage.scrollLeft, t: lbStage.scrollTop, id: e.pointerId };
      e.preventDefault();
    });
    lbImg.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!dragged && Math.abs(dx) + Math.abs(dy) < 5) return;
      if (!dragged) {
        dragged = true;
        lb.setAttribute('data-dragging', '');
        try { lbImg.setPointerCapture(drag.id); } catch (err) {}
      }
      lbStage.scrollLeft = drag.l - dx;
      lbStage.scrollTop = drag.t - dy;
    });
    function endDrag() { drag = null; lb.removeAttribute('data-dragging'); }
    lbImg.addEventListener('pointerup', endDrag);
    lbImg.addEventListener('pointercancel', endDrag);
    // A trackpad pinch arrives as ctrl+wheel; without this it zooms the page.
    lbStage.addEventListener('wheel', function (e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      zoomTo(view.scale * Math.exp(-e.deltaY / 120), e.clientX, e.clientY);
    }, { passive: false });
    window.addEventListener('resize', function () { if (lb.open) toBase(); });
  }

  // Two reference sizes. "whole" shows the entire figure; "base" fills the
  // width of the stage (never past the file's own size), so a tall plate
  // opens larger than it is on the page and scrolls down, like a document.
  // The view opens at base; zooming runs from whole up to twice full size.
  function sizes() {
    var w = lbStage.clientWidth - 2 * PAD, h = lbStage.clientHeight - 2 * PAD;
    view.base = clamp(w / view.nw, 0.01, 1);
    view.whole = Math.min(view.base, clamp(h / view.nh, 0.01, 1));
    view.max = Math.max(2, view.base * 2);
  }
  function paint() {
    lbImg.style.width = Math.round(view.nw * view.scale) + 'px';
    lbImg.style.height = Math.round(view.nh * view.scale) + 'px';
    lbScale.textContent = Math.round(view.scale * 100) + '%';
    lbHint.textContent = lb.hasAttribute('data-zoomed') ? 'Tap to fit' : 'Tap to zoom';
    lbOut.setAttribute('aria-disabled', view.scale <= view.whole + 0.001 ? 'true' : 'false');
    lbIn.setAttribute('aria-disabled', view.scale >= view.max - 0.001 ? 'true' : 'false');
  }
  function toBase() {
    lb.removeAttribute('data-zoomed');          // the caption comes back first: it changes the stage
    sizes();
    view.scale = view.base;
    paint();
    lbStage.scrollLeft = 0; lbStage.scrollTop = 0;
  }
  // Zoom keeping the point (cx, cy) of the picture under the pointer.
  function zoomTo(next, cx, cy) {
    next = clamp(next, view.whole, view.max);
    if (Math.abs(next - view.base) <= view.base * 0.02) { toBase(); return; }
    var st = lbStage.getBoundingClientRect(), r0 = lbImg.getBoundingClientRect();
    if (cx == null) { cx = st.left + st.width / 2; cy = st.top + st.height / 2; }
    var fx = clamp((cx - r0.left) / r0.width, 0, 1), fy = clamp((cy - r0.top) / r0.height, 0, 1);
    view.scale = next;
    // past the opening size the caption steps aside and the stage takes the window
    if (next > view.base) lb.setAttribute('data-zoomed', ''); else lb.removeAttribute('data-zoomed');
    paint();
    var r1 = lbImg.getBoundingClientRect();
    lbStage.scrollLeft += (r1.left + fx * r1.width) - cx;
    lbStage.scrollTop += (r1.top + fy * r1.height) - cy;
  }

  function openLightbox(img, trigger) {
    if (!('HTMLDialogElement' in window)) return false;
    if (!lb) buildLightbox();
    if (lb.open) return true;
    var fig = img.closest('figure'), src = sources(img);
    lbTrigger = trigger || null;

    view.nw = img.naturalWidth || +img.getAttribute('width') || img.width || 1;
    view.nh = img.naturalHeight || +img.getAttribute('height') || img.height || 1;
    lbImg.alt = img.alt || '';
    lbImg.src = src.shown;
    lbOrig.href = src.full;
    if (fig && fig.classList.contains('fig--plate')) lb.setAttribute('data-plate', ''); else lb.removeAttribute('data-plate');

    // The caption comes along, legend and all; ids are dropped so none repeats.
    var cap = fig && fig.querySelector('figcaption');
    var text = cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '';
    lbCapIn.textContent = '';
    if (cap && text.length > 14) {              // not the poster's bare "Full size." link
      [].forEach.call(cap.childNodes, function (n) { lbCapIn.appendChild(n.cloneNode(true)); });
      [].forEach.call(lbCapIn.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
      lbCap.hidden = false;
      lb.setAttribute('aria-describedby', 'rd-lb-cap');
    } else {
      lbCap.hidden = true;
      lb.removeAttribute('aria-describedby');
    }
    var lead = cap && cap.querySelector('b');
    lbTitle.textContent = lead && cap.firstElementChild === lead
      ? lead.textContent.replace(/\s+/g, ' ').replace(/[.:]\s*$/, '') : '';

    // Hold the page still behind the dialog without letting it jump sideways
    // when its scrollbar goes.
    var gutter = window.innerWidth - root.clientWidth;
    lbLock = { overflow: root.style.overflow, pad: root.style.paddingRight };
    root.style.overflow = 'hidden';
    if (gutter > 0) root.style.paddingRight = gutter + 'px';

    lb.showModal();
    toBase();
    lbClose.focus();

    // A larger file than the one on the page, if there is one.
    if (stem(src.full) !== stem(src.shown)) {
      var big = new Image();
      big.onload = function () {
        if (!lb.open || lbOrig.href !== src.full || big.naturalWidth <= view.nw) return;
        view.nw = big.naturalWidth; view.nh = big.naturalHeight;
        lbImg.src = src.full;
        toBase();
      };
      big.src = src.full;
    }
    return true;
  }
  function onClose() {
    if (lbLock) { root.style.overflow = lbLock.overflow; root.style.paddingRight = lbLock.pad; lbLock = null; }
    lb.removeAttribute('data-zoomed');
    lb.removeAttribute('data-dragging');
    var t = lbTrigger; lbTrigger = null;
    if (t && doc.contains(t)) { try { t.focus({ preventScroll: true }); } catch (err) { t.focus(); } }
  }

  if ('HTMLDialogElement' in window && 'closest' in doc.body) {
    [].forEach.call(paper.querySelectorAll('figure.fig'), function (fig) {
      // data-no-zoom on a figure or an image opts it out (a figure that has
      // its own interaction, say)
      if (fig.classList.contains('fig--table') || fig.hasAttribute('data-no-zoom')) return;
      var imgs = [].filter.call(fig.querySelectorAll('img'), function (img) {
        if (img.hasAttribute('data-no-zoom') || img.closest('figcaption, video')) return false;
        var w = +img.getAttribute('width') || img.naturalWidth || 0;
        return w === 0 || w >= 480;               // not an icon or an inline glyph
      });
      if (!imgs.length) return;
      // One visible control, in the corner of the picture, when the figure is
      // one picture that opens the figure (every figure on the site today).
      var first = fig.firstElementChild;
      var solo = imgs.length === 1 && first && first.tagName !== 'FIGCAPTION' &&
        (first === imgs[0] || first.contains(imgs[0]));
      imgs.forEach(function (img) {
        img.classList.add('rd-zoom-img');
        var link = img.closest('a[href]');
        if (link && fig.contains(link)) {
          // The link to the file keeps working as a link: with no script, in a
          // new tab, or with a modifier key. A plain click enlarges in place.
          link.addEventListener('click', function (e) {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (openLightbox(img, link)) e.preventDefault();
          });
        } else {
          img.addEventListener('click', function (e) {
            if (e.button === 0) openLightbox(img, fig.querySelector('.rd-zoom') || img);
          });
          if (!solo) {
            // no link and no corner control: the picture itself takes focus
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            img.setAttribute('aria-label', 'Enlarge figure' + (img.alt ? ': ' + img.alt : ''));
            img.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(img, img); }
            });
          }
        }
      });
      if (solo) {
        var btn = make('button', 'rd-zoom', { type: 'button' }, '<span>Enlarge<span class="vh"> figure</span></span>' + ICON.expand);
        var cap = fig.querySelector('figcaption');
        if (cap) {
          if (!cap.id) cap.id = 'rd-cap-' + Math.random().toString(36).slice(2, 8);
          btn.setAttribute('aria-describedby', cap.id);
        }
        btn.addEventListener('click', function () { openLightbox(imgs[0], btn); });
        fig.classList.add('rd-zoomable');
        // straight after the picture: unpositioned, it lands under the
        // picture's bottom edge, whatever the figure's padding or matte
        fig.insertBefore(btn, first.nextSibling);
      }
    });
  }

  /* ---- 2. BibTeX: a Copy button ----------------------------------------- */
  function legacyCopy(text) {
    var ta = make('textarea', null, { readonly: '', 'aria-hidden': 'true', tabindex: '-1' });
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;';
    doc.body.appendChild(ta);
    var ok = false;
    try { ta.select(); ta.setSelectionRange(0, text.length); ok = doc.execCommand('copy'); } catch (err) { ok = false; }
    doc.body.removeChild(ta);
    return ok;
  }
  function copyText(text, done) {
    function fallback() { done(legacyCopy(text)); }
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else fallback();
  }
  [].forEach.call(paper.querySelectorAll('pre.bibtex'), function (pre) {
    if (pre.parentNode.classList.contains('rd-code')) return;
    var prev = pre.previousElementSibling;
    var wrap = make('div', 'rd-code' + (prev && /^H[1-6]$/.test(prev.tagName) ? '' : ' rd-code--band'));
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var btn = make('button', 'rd-copy', { type: 'button' });
    var timer = 0;
    function face(state) {
      btn.innerHTML = state === 'done' ? ICON.check + '<span>Copied</span>'
        : state === 'failed' ? '<span>Press ' + (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+') + 'C</span>'
        : ICON.copy + '<span>Copy<span class="vh"> BibTeX</span></span>';
      if (state) btn.setAttribute('data-state', state); else btn.removeAttribute('data-state');
    }
    face('');
    btn.addEventListener('click', function () {
      copyText(pre.textContent, function (ok) {
        clearTimeout(timer);
        if (ok) {
          face('done');
          announce('BibTeX copied to the clipboard.');
        } else {
          // Last resort: select the entry so one keystroke copies it.
          var sel = window.getSelection(), range = doc.createRange();
          range.selectNodeContents(pre);
          sel.removeAllRanges(); sel.addRange(range);
          face('failed');
          announce('Could not copy. The BibTeX entry is selected; press Control or Command C.');
        }
        btn.focus();
        timer = setTimeout(function () { face(''); }, 2400);
      });
    });
    wrap.insertBefore(btn, pre);
  });

  /* ---- 3. wayfinding: reading progress and back to top ------------------ */
  var nav = paper.querySelector('.paper-nav') || doc.querySelector('.paper-nav');
  var bar = make('span', 'rd-progress' + (area ? '' : ' rd-progress--all'), { 'aria-hidden': 'true' });
  if (nav) nav.appendChild(bar);
  else { bar.className += ' rd-progress--page'; doc.body.appendChild(wearArea(bar)); }

  var topBtn = wearArea(make('button', 'rd-top', { type: 'button', 'aria-label': 'Back to top', title: 'Back to top', hidden: '' }, ICON.up));
  doc.body.appendChild(topBtn);
  topBtn.addEventListener('click', function () {
    window.scrollTo(0, 0);                       // a jump, not a glide: 36,000px of glide is a blur
    var main = doc.getElementById('main');
    if (main) { try { main.focus({ preventScroll: true }); } catch (err) { main.focus(); } }
  });

  var foot = doc.querySelector('.foot');
  var roomy = window.matchMedia('(min-width: 60em)');
  var maxY = 0, isLong = false, lastY = window.pageYOffset, run = 0, goingUp = false;
  var shown = false, queued = false, lastP = -1;
  function measure() {
    var vh = window.innerHeight;
    maxY = Math.max(0, root.scrollHeight - vh);
    isLong = root.scrollHeight > vh * 3;
    if (foot) topBtn.style.setProperty('--rd-lift', (root.scrollHeight - (foot.offsetTop || 0) + 12) + 'px');
    bar.style.display = isLong ? '' : 'none';
    lastP = -1;
    frame();
  }
  function frame() {
    queued = false;
    var y = window.pageYOffset;
    if (isLong) {
      var p = maxY > 0 ? clamp(y / maxY, 0, 1) : 0;
      p = Math.round(p * 2000) / 2000;
      if (p !== lastP) { lastP = p; bar.style.transform = 'scaleX(' + p + ')'; }
    }
    var d = y - lastY;
    lastY = y;
    if (d) {
      if ((d < 0) !== (run < 0)) run = 0;        // a change of direction starts the count again
      run += d;
      if (Math.abs(run) > 32) goingUp = run < 0;
    }
    var show = isLong && y > window.innerHeight * 1.5 && (roomy.matches || goingUp || y >= maxY - 48);
    if (show !== shown) { shown = show; topBtn.hidden = !show; }
  }
  window.addEventListener('scroll', function () {
    if (!queued) { queued = true; window.requestAnimationFrame(frame); }
  }, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if ('ResizeObserver' in window) {
    // A legend unfolding or an image arriving changes how long the page is.
    new ResizeObserver(function () { measure(); }).observe(doc.body);
  }
  measure();
  // At the foot of the page the button would sit on the footer's contact line.
  if (foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      topBtn.classList.toggle('rd-top--lift', entries[entries.length - 1].isIntersecting);
    }).observe(foot);
  }

  /* ---- 4. tables --------------------------------------------------------- */
  var NUMERIC = /^[\s−–+\-±~≈<>≤≥]*[\d.,]+\s*(?:%|[a-zA-Zµ°]{0,3})?(?:\s*[±–\/]\s*[\d.,]+\s*%?)?$/;
  [].forEach.call(paper.querySelectorAll('.fig--table table'), function (table) {
    var rows = [].slice.call(table.tBodies[0] ? table.tBodies[0].rows : []);
    if (!rows.length) return;
    var cols = rows[0].cells.length;
    // A column of numbers is set flush right. Not the first column: that is
    // the row's name even when the name is a number (an atom's id).
    for (var c = 1; c < cols; c++) {
      var all = rows.every(function (r) {
        var cell = r.cells[c];
        return cell && r.cells.length === cols && cell.colSpan === 1 && NUMERIC.test(cell.textContent.trim());
      });
      if (!all) continue;
      rows.forEach(function (r) { r.cells[c].classList.add('rd-num'); });
      if (table.tHead) [].forEach.call(table.tHead.rows, function (r) {
        if (r.cells.length === cols) r.cells[c].classList.add('rd-num');
      });
    }
  });
  var wraps = [].slice.call(paper.querySelectorAll('.table-wrap'));
  function tableScroll() {
    wraps.forEach(function (w) {
      var over = w.scrollWidth > w.clientWidth + 1;
      if (over && !w.hasAttribute('tabindex')) {
        var cap = w.querySelector('caption');
        w.setAttribute('tabindex', '0');
        w.setAttribute('role', 'region');
        w.setAttribute('aria-label', (cap ? cap.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : 'Table') + ' (scrolls sideways)');
      } else if (!over && w.getAttribute('role') === 'region') {
        w.removeAttribute('tabindex'); w.removeAttribute('role'); w.removeAttribute('aria-label');
      }
    });
  }
  if (wraps.length) { tableScroll(); window.addEventListener('resize', tableScroll); }

  /* ---- 5. display equations ---------------------------------------------- */
  // MathML does not scroll by itself in every engine. Where an equation is
  // wider than its column, it is given a box that does.
  var maths = [].slice.call(paper.querySelectorAll('math[display="block"]'));
  function mathFit() {
    maths.forEach(function (m) {
      if (m.parentNode.classList.contains('rd-math')) return;
      var col = m.parentNode.clientWidth;
      if (!col || m.scrollWidth <= col + 1 && m.getBoundingClientRect().width <= col + 1) return;
      var box = make('div', 'rd-math', { tabindex: '0', role: 'group', 'aria-label': 'Equation (scrolls sideways)' });
      m.parentNode.insertBefore(box, m);
      box.appendChild(m);
    });
  }
  if (maths.length) { mathFit(); window.addEventListener('resize', mathFit); }

  /* ---- 6. print ------------------------------------------------------------ */
  // A folded legend is part of the figure on paper. Open them for the print
  // run and fold the ones that were folded again afterwards.
  var folded = [];
  window.addEventListener('beforeprint', function () {
    [].forEach.call(paper.querySelectorAll('details:not([open])'), function (d) { folded.push(d); d.open = true; });
  });
  window.addEventListener('afterprint', function () {
    folded.forEach(function (d) { d.open = false; });
    folded = [];
  });
})();
