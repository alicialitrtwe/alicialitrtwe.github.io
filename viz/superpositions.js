/* research/superpositions.html: the superposition illustration (#sp-crowd).
   The page carries the figure fully drawn for a voxel tuned to "number", so it
   is complete without this script. The script shows the row of buttons and
   redraws the arrow and the bars for the concept chosen. The geometry is made
   up for the illustration (five concepts squeezed into two dimensions); it is
   not data from the paper, and the caption says so. */
(function () {
  'use strict';

  var CONCEPTS = [
    { id: 'number', deg: 64 },
    { id: 'time',   deg: 40 },
    { id: 'space',  deg: 14 },
    { id: 'family', deg: 148 },
    { id: 'color',  deg: 252 }
  ];
  var O = { x: 150, y: 116 }, RV = 80;

  function rad(d) { return d * Math.PI / 180; }
  function f(n) { return Math.round(n * 10) / 10; }
  function head(x, y, ux, uy, len, half) {
    var bx = x - ux * len, by = y - uy * len;
    return [x, y, bx - uy * half, by + ux * half, bx + uy * half, by - ux * half].map(f).join(',');
  }
  function find(id) { for (var i = 0; i < CONCEPTS.length; i++) if (CONCEPTS[i].id === id) return CONCEPTS[i]; }

  // projections of a voxel tuned to `id` onto every concept direction
  function state(id) {
    var c = find(id), a = rad(c.deg);
    var ux = Math.cos(a), uy = -Math.sin(a);   // SVG y runs down
    var x2 = O.x + ux * RV, y2 = O.y + uy * RV;
    var dense = {}, atoms = {};
    CONCEPTS.forEach(function (k) {
      dense[k.id] = Math.max(0, Math.cos(rad(k.deg - c.deg)));
      atoms[k.id] = k.id === id ? 1 : 0;
    });
    return {
      line: [O.x, O.y, f(O.x + ux * (RV - 8)), f(O.y + uy * (RV - 8))],
      head: head(x2, y2, ux, uy, 13, 6.5),
      dense: dense, atoms: atoms
    };
  }

  function words(id, s) {
    var also = CONCEPTS.filter(function (k) { return k.id !== id && s.dense[k.id] > 0.5; })
      .map(function (k) { return k.id; });
    var t = 'A voxel that responds only to ' + id + '. Read from the embedding, its weights also point toward ' +
      (also.length ? also.join(' and ') : 'nothing else') + '. Read from concept atoms, only ' + id + ' lights up.';
    if (!also.length) t = 'A voxel that responds only to ' + id + '. Here no other concept lies close to it, so both readings agree.';
    return t;
  }

  if (typeof document === 'undefined') {   // node: print the static markup values
    var s = state('number');
    console.log(JSON.stringify({ s: s, words: words('number', s) }, null, 1));
    return;
  }

  var fig = document.getElementById('sp-crowd');
  if (!fig) return;
  var pick = fig.querySelector('.sp-pick');
  var vline = fig.querySelector('.sp-voxel line');
  var vhead = fig.querySelector('.sp-voxel polygon');
  var say = fig.querySelector('.sp-say');
  var buttons = [].slice.call(pick.querySelectorAll('button'));

  function show(id) {
    var s = state(id);
    vline.setAttribute('x2', s.line[2]); vline.setAttribute('y2', s.line[3]);
    vhead.setAttribute('points', s.head);
    CONCEPTS.forEach(function (k) {
      var d = fig.querySelector('[data-bar="dense-' + k.id + '"]');
      var a = fig.querySelector('[data-bar="atoms-' + k.id + '"]');
      if (d) d.style.setProperty('--v', s.dense[k.id].toFixed(3));
      if (a) a.style.setProperty('--v', s.atoms[k.id]);
    });
    [].forEach.call(fig.querySelectorAll('.sp-concept'), function (g) {
      g.classList.toggle('is-on', g.getAttribute('data-c') === id);
    });
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.value === id ? 'true' : 'false'); });
    say.textContent = words(id, s);
  }

  buttons.forEach(function (b) { b.addEventListener('click', function () { show(b.value); }); });
  pick.hidden = false;
  fig.classList.add('sp-live');
})();
