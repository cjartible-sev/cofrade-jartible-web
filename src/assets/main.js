(function () {
  var c = document.querySelector('.cuenta');
  if (c) {
    var meta = new Date(c.dataset.fecha).getTime();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    var set = function (u, v) { c.querySelector('[data-u="' + u + '"]').textContent = v; };
    var tick = function () {
      var t = Math.max(0, meta - Date.now());
      set('d', Math.floor(t / 864e5));
      set('h', p(Math.floor(t % 864e5 / 36e5)));
      set('m', p(Math.floor(t % 36e5 / 6e4)));
      set('s', p(Math.floor(t % 6e4 / 1e3)));
    };
    tick(); setInterval(tick, 1000);
  }
  var r = document.getElementById('reto');
  if (r) r.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var ok = b.dataset.n === r.dataset.ok;
    b.classList.add(ok ? 'ok' : 'mal');
    document.getElementById('res').textContent = ok ? '¡Correcto!' : 'Casi. Inténtalo otra vez.';
  });
})();

/* Agenda: oculta eventos pasados y limita los de la portada */
(function () {
  var h = new Date(), p = function (n) { return n < 10 ? '0' + n : '' + n; };
  var hoy = h.getFullYear() + '-' + p(h.getMonth() + 1) + '-' + p(h.getDate());
  document.querySelectorAll('.agenda').forEach(function (ul) {
    var max = parseInt(ul.dataset.max || '999', 10), visibles = 0;
    ul.querySelectorAll('li[data-fecha]').forEach(function (li) {
      if (li.dataset.fecha < hoy || visibles >= max) li.hidden = true; else visibles++;
    });
    var vacio = ul.parentNode.querySelector('.vacio');
    if (vacio && !visibles) vacio.hidden = false;
  });
})();
