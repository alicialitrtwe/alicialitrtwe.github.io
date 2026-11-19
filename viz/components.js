/* Alicia Zeng — research/components.html: the list of the 50 components.
   Loaded by that page only.

   The list is plain HTML and complete without this file: fifty lines, each a
   description and two marks, in the paper's numbering. This adds what a list
   that long needs:

   - two rows of buttons above it: the order (the paper's numbering, most
     stable first, best agreement across people first) and which components to
     show (all, the ten whose maps are on the page, the five that follow speech timing, the
     seven the paper counts as not stable);
   - the list folds to its first ten lines, with a button to show the rest;
   - one line is "open" at a time and prints its two values beside its marks:
     the line under the pointer, the line tapped, or the line the arrow keys
     are on (the list is one tab stop; Up, Down, Home and End move within it).

   It carries no data. Order and filters read the data-* attributes the page's
   rows were generated with (data-stab, data-xr, data-tags), which hold the
   same values as the folded table under the list.

   It also runs the two sets of example components (#examples near the top,
   #more-examples under the list): without script their panels stack; here
   they become tabs (arrow keys move between them), and a "see its maps" link
   in the list opens the right panel. And it folds the <details> marked
   data-fold, which the page sends open so that nothing is hidden without
   script.

   No dependencies, no network, no motion.                                   */

(function () {
  'use strict';

  if (!document.querySelector || !window.addEventListener) return;

  var FOLD = 10;

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== null && text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function explorer() {
    var fig = document.getElementById('cx');
    var list = fig && fig.querySelector('.cx-list');
    var head = fig && fig.querySelector('.cx-head');
    if (!list || !head || list.children.length < 2) return;

    var items = [].map.call(list.children, function (li) {
      return {
        li: li,
        n: +li.getAttribute('data-n'),
        stab: parseFloat(li.getAttribute('data-stab')),
        xr: parseFloat(li.getAttribute('data-xr')),
        tags: (li.getAttribute('data-tags') || '').split(' ')
      };
    });
    var N = items.length;
    function tagged(t) { return function (d) { return d.tags.indexOf(t) >= 0; }; }
    function count(test) { var k = 0; items.forEach(function (d) { if (test(d)) k++; }); return k; }

    var SORTS = [
      { label: 'The paper’s numbering', say: 'in the paper’s numbering',
        cmp: function (a, b) { return a.n - b.n; } },
      { label: 'Most stable first', say: 'most stable first',
        cmp: function (a, b) { return b.stab - a.stab || a.n - b.n; } },
      { label: 'Best agreement first', say: 'best agreement across people first',
        cmp: function (a, b) { return b.xr - a.xr || a.n - b.n; } }
    ];
    var FILTERS = [
      { label: 'All', test: function () { return true; } },
      { label: 'With maps', test: tagged('maps'),
        say: function (k) { return 'The ' + k + ' components whose brain maps are on this page. “See its maps” opens one.'; } },
      { label: 'Speech timing', test: tagged('speech'),
        say: function (k) { return 'These ' + k + ' follow the timing of speech, its pauses and rapid stretches, rather than its meaning. They are the most often active.'; } },
      { label: 'Not stable', test: tagged('unstable'),
        say: function (k) { return 'Not every component comes back when the model is retrained. These ' + k + ' do not do so reliably; they are narrow or tied to one story.'; } }
    ];
    FILTERS = FILTERS.filter(function (f, i) {
      if (i) f.count = count(f.test);
      return !i || f.count > 0;
    });

    var state = { sort: SORTS[0], filter: FILTERS[0], open: false, on: null };

    /* -- the buttons, above the legend -- */
    var controls = el('div', 'cx-controls');
    function buttonRow(label, options, isOn, pick) {
      var row = el('div', 'cx-ctl', null, controls);
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', label);
      el('span', 'cx-ctl-label', label, row);
      var btns = options.map(function (o) {
        var b = el('button', 'cx-chip', null, row);
        b.type = 'button';
        el('span', null, o.label, b);
        if (o.count !== undefined) {
          el('span', 'cx-chip-n', String(o.count), b);
          b.setAttribute('aria-label', o.label + ', ' + o.count + ' components');
        }
        b.addEventListener('click', function () { pick(o); sync(); });
        return b;
      });
      function sync() {
        btns.forEach(function (b, j) { b.setAttribute('aria-pressed', isOn(options[j]) ? 'true' : 'false'); });
      }
      sync();
    }
    buttonRow('Order', SORTS,
      function (s) { return s === state.sort; },
      function (s) { state.sort = s; apply(); });
    buttonRow('Show', FILTERS,
      function (f) { return f === state.filter; },
      function (f) { state.filter = f; apply(); });
    var summary = el('p', 'cx-summary', null, controls);
    summary.setAttribute('aria-live', 'polite');
    fig.insertBefore(controls, head);

    var more = el('button', 'cx-more');
    more.type = 'button';
    more.addEventListener('click', function () {
      state.open = !state.open;
      apply();
      if (!state.open) more.scrollIntoView({ block: 'center' });
    });
    list.parentNode.insertBefore(more, list.nextSibling);

    var shown = [];           // the lines on screen, in order

    function setOn(d) {
      if (state.on === d) return;
      if (state.on) state.on.li.classList.remove('is-on');
      state.on = d;
      if (d) d.li.classList.add('is-on');
    }

    function apply() {
      var hadFocus = list.contains(document.activeElement) ? document.activeElement : null;
      var order = items.slice().sort(state.sort.cmp);
      var all = state.filter === FILTERS[0];
      shown = [];
      order.forEach(function (d) {
        list.appendChild(d.li);                       // DOM order is the order shown
        var show = state.filter.test(d) && !(all && !state.open && shown.length >= FOLD);
        d.li.hidden = !show;
        if (show) shown.push(d);
      });
      if (state.on && shown.indexOf(state.on) < 0) setOn(null);

      // one tab stop: the open line if there is one, or the first line
      var stop = state.on || shown[0];
      items.forEach(function (d) { d.li.setAttribute('tabindex', d === stop ? '0' : '-1'); });
      if (hadFocus && stop && document.activeElement !== stop.li) stop.li.focus({ preventScroll: true });

      more.hidden = !all;
      more.textContent = state.open ? 'Show the first ' + FOLD + ' only' : 'Show all ' + N + ' components';
      more.setAttribute('aria-expanded', state.open ? 'true' : 'false');

      var say = all
        ? (state.open ? 'All ' + N + ' components, ' : 'The first ' + FOLD + ' of ' + N + ' components, ') + state.sort.say + '.'
        : state.filter.say(shown.length);
      if (summary.textContent !== say) summary.textContent = say;
    }

    function itemOf(target) {
      var li = target && target.closest ? target.closest('.cx-row') : null;
      if (!li) return null;
      for (var i = 0; i < items.length; i++) if (items[i].li === li) return items[i];
      return null;
    }

    /* -- which line is open -- */
    list.addEventListener('pointerover', function (e) {
      if (e.pointerType === 'mouse') { var d = itemOf(e.target); if (d) setOn(d); }
    });
    list.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse' && !list.contains(document.activeElement)) setOn(null);
    });
    list.addEventListener('click', function (e) {
      var d = itemOf(e.target);
      if (!d) return;
      setOn(d);
      items.forEach(function (x) { x.li.setAttribute('tabindex', x === d ? '0' : '-1'); });
    });
    list.addEventListener('focusin', function (e) {
      var d = itemOf(e.target);
      if (d) setOn(d);
    });
    list.addEventListener('keydown', function (e) {
      var d = itemOf(e.target);
      if (!d) return;
      var k = shown.indexOf(d), to = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = k + 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = k - 1;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = shown.length - 1;
      if (to === null) return;
      e.preventDefault();
      to = Math.max(0, Math.min(shown.length - 1, to));
      var next = shown[to];
      d.li.setAttribute('tabindex', '-1');
      next.li.setAttribute('tabindex', '0');
      next.li.focus();
    });

    fig.classList.add('viz-on');
    apply();
  }

  /* -- the example components: tabs over panels that stack without script -- */
  var switchers = [];
  function switcher(fig) {
    var panels = [].slice.call(fig.querySelectorAll('.cs-panel'));
    if (panels.length < 2) return;
    var bar = el('div', 'cs-tabs');
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', fig.id === 'examples' ? 'Example components' : 'More example components');
    var tabs = panels.map(function (p, i) {
      var t = el('button', 'cs-tab', null, bar);
      t.type = 'button';
      t.id = 'cs-tab-' + p.id;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', p.id);
      el('span', 'cs-tab-id', p.id.replace('comp-', ''), t);
      el('span', null, p.getAttribute('data-label'), t);
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', t.id);
      p.setAttribute('tabindex', '0');
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var to = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % panels.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i - 1 + panels.length) % panels.length;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = panels.length - 1;
        if (to === null) return;
        e.preventDefault();
        show(to);
        tabs[to].focus();
      });
      return t;
    });
    function show(k) {
      panels.forEach(function (p, i) {
        var on = i === k;
        p.hidden = !on;
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[i].setAttribute('tabindex', on ? '0' : '-1');
      });
    }
    fig.insertBefore(bar, panels[0]);
    fig.classList.add('cs-on');
    show(0);
    switchers.push({ fig: fig, panels: panels, show: show, tabs: tabs });
  }

  // A link to a panel ("see its maps", or an address ending #comp-c24)
  // selects its tab and brings the figure into view.
  function reveal(id) {
    for (var s = 0; s < switchers.length; s++) {
      var w = switchers[s];
      for (var i = 0; i < w.panels.length; i++) {
        if (w.panels[i].id !== id) continue;
        w.show(i);
        w.fig.scrollIntoView({ block: 'start' });
        try { w.tabs[i].focus({ preventScroll: true }); } catch (e) { w.tabs[i].focus(); }
        return true;
      }
    }
    return false;
  }
  function isPanel(h) { return /^comp-c\d+$/.test(h); }

  // <details data-fold> come open in the page as sent, so nothing is hidden
  // without script; they are folded here.
  function fold() {
    [].forEach.call(document.querySelectorAll('details[data-fold]'), function (d) { d.open = false; });
  }

  function examples() {
    [].forEach.call(document.querySelectorAll('[data-switch]'), switcher);
    var h = location.hash.slice(1);
    if (isPanel(h)) reveal(h);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#comp-"]');
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var id = a.getAttribute('href').slice(1);
      if (reveal(id)) {
        e.preventDefault();
        if (history.replaceState) history.replaceState(null, '', '#' + id);
      }
    });
    window.addEventListener('hashchange', function () {
      var h = location.hash.slice(1);
      if (isPanel(h)) reveal(h);
    });
  }

  function start() {
    try { fold(); } catch (e) { if (window.console) console.error(e); }
    try { examples(); } catch (e) {
      // leave the examples as the page sent them: every panel, stacked
      [].forEach.call(document.querySelectorAll('.cs-panel[hidden]'), function (p) { p.hidden = false; });
      [].forEach.call(document.querySelectorAll('.cs-tabs'), function (b) { b.parentNode.removeChild(b); });
      [].forEach.call(document.querySelectorAll('.cs-on'), function (f) { f.classList.remove('cs-on'); });
      if (window.console) console.error(e);
    }
    try { explorer(); } catch (e) {
      // leave the list as the page sent it: every line, nothing hidden
      var fig = document.getElementById('cx');
      if (fig) {
        fig.classList.remove('viz-on');
        [].forEach.call(fig.querySelectorAll('.cx-row[hidden]'), function (li) { li.hidden = false; });
      }
      if (window.console) console.error(e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
