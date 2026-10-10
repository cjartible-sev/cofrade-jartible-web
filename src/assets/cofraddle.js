(function () {
  var cont = document.getElementById('cdl');
  if (!cont) return;
  var datos = [];
  try { datos = JSON.parse(document.getElementById('palabras').textContent).palabras || []; } catch (e) {}
  function norm(s) {
    return String(s).toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'Ñ');
  }
  var lista = datos.map(function (d) {
    return { pal: norm(d.palabra || ''), mostrar: String(d.palabra || '').toUpperCase(), pista: d.pista || '' };
  }).filter(function (d) { return /^[A-ZÑ]{5}$/.test(d.pal); });
  if (!lista.length) { cont.textContent = 'Todavía no hay palabras.'; return; }

  // Palabra del día (igual para todos, cambia a medianoche)
  var h = new Date(), p2 = function (n) { return n < 10 ? '0' + n : '' + n; };
  var hoy = h.getFullYear() + '-' + p2(h.getMonth() + 1) + '-' + p2(h.getDate());
  var dias = Math.floor(Date.UTC(h.getFullYear(), h.getMonth(), h.getDate()) / 864e5);
  function mcd(a, b) { return b ? mcd(b, a % b) : a; }
  var n = lista.length, k = 7; while (mcd(k, n) !== 1) k++;
  var meta = lista[(dias * k) % n];
  var numero = dias - Math.floor(Date.UTC(2026, 9, 1) / 864e5) + 1;

  // Estado guardado en el navegador
  var clave = 'cofraddle:' + hoy;
  var est = { g: [], fin: false, gano: false };
  var stats = { jugadas: 0, ganadas: 0, racha: 0, maxRacha: 0 };
  try { var s = localStorage.getItem(clave); if (s) est = JSON.parse(s); } catch (e) {}
  try { var t = localStorage.getItem('cofraddle:stats'); if (t) stats = JSON.parse(t); } catch (e) {}
  function guardar() {
    try { localStorage.setItem(clave, JSON.stringify(est)); localStorage.setItem('cofraddle:stats', JSON.stringify(stats)); } catch (e) {}
  }

  function evaluar(g, m) {
    var res = [], resto = {}, i;
    for (i = 0; i < 5; i++) {
      if (g[i] === m[i]) res[i] = 'ok'; else { res[i] = 'no'; resto[m[i]] = (resto[m[i]] || 0) + 1; }
    }
    for (i = 0; i < 5; i++) {
      if (res[i] === 'no' && resto[g[i]] > 0) { res[i] = 'pre'; resto[g[i]]--; }
    }
    return res;
  }

  // Tablero y teclado
  var grid = document.getElementById('cdl-grid'), filas = [];
  for (var r = 0; r < 6; r++) {
    var fila = document.createElement('div'); fila.className = 'cdl-fila';
    for (var c = 0; c < 5; c++) { var ce = document.createElement('div'); ce.className = 'cdl-celda'; fila.appendChild(ce); }
    grid.appendChild(fila); filas.push(fila);
  }
  var teclas = {}, tec = document.getElementById('cdl-teclado');
  ['QWERTYUIOP', 'ASDFGHJKLÑ', '>ZXCVBNM<'].forEach(function (fl) {
    var d = document.createElement('div'); d.className = 'fila';
    fl.split('').forEach(function (ch) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tecla';
      if (ch === '>') { b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'; b.dataset.k = 'ENTER'; b.setAttribute('aria-label', 'Enter'); }
      else if (ch === '<') { b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-5.5-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/></svg>'; b.dataset.k = 'BORRAR'; b.setAttribute('aria-label', 'Borrar'); }
      else { b.textContent = ch; b.dataset.k = ch; teclas[ch] = b; }
      d.appendChild(b);
    });
    tec.appendChild(d);
  });

  var actual = '', msg = document.getElementById('cdl-msg'), msgT;
  function aviso(t) { msg.textContent = t; clearTimeout(msgT); msgT = setTimeout(function () { msg.textContent = ''; }, 2200); }

  function pintar() {
    var orden = { no: 1, pre: 2, ok: 3 }, mejor = {};
    filas.forEach(function (fila, r) {
      var g = est.g[r], ev = g ? evaluar(g, meta.pal) : null;
      Array.prototype.forEach.call(fila.children, function (ce, i) {
        var letra = g ? g[i] : (r === est.g.length ? actual[i] : '');
        ce.textContent = letra || '';
        var activa = !g && !est.fin && r === est.g.length && i === actual.length;
        ce.className = 'cdl-celda' + (ev ? ' ' + ev[i] : (letra ? ' llena' : '')) + (activa ? ' activa' : '');
        if (ev && (!mejor[g[i]] || orden[ev[i]] > orden[mejor[g[i]]])) mejor[g[i]] = ev[i];
      });
    });
    Object.keys(teclas).forEach(function (ch) { teclas[ch].className = 'tecla' + (mejor[ch] ? ' ' + mejor[ch] : ''); });
  }

  function compartir() {
    var em = { ok: '🟩', pre: '🟨', no: '⬛' };
    var txt = 'Cofraddle #' + numero + ' ' + (est.gano ? est.g.length : 'X') + '/6\n' +
      est.g.map(function (g) { return evaluar(g, meta.pal).map(function (x) { return em[x]; }).join(''); }).join('\n') +
      '\n' + location.href;
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { aviso('Resultado copiado'); }, function () { aviso('No se pudo copiar'); });
  }

  function mostrarFin() {
    var f = document.getElementById('cdl-fin');
    f.hidden = false; f.textContent = '';
    var hh = document.createElement('h3'); hh.textContent = est.gano ? '¡Enhorabuena!' : 'La palabra era ' + meta.mostrar;
    var p1 = document.createElement('p'); p1.textContent = (est.gano ? meta.mostrar + ': ' : '') + meta.pista;
    var p2e = document.createElement('p');
    p2e.textContent = 'Partidas: ' + stats.jugadas + ' · Ganadas: ' + stats.ganadas + ' · Racha: ' + stats.racha + ' · Mejor racha: ' + stats.maxRacha;
    var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Compartir resultado'; b.addEventListener('click', compartir);
    var p3 = document.createElement('p'); p3.textContent = 'Vuelve mañana para una palabra nueva.';
    [hh, p1, p2e, b, p3].forEach(function (x) { f.appendChild(x); });
  }

  function tecla(k) {
    if (est.fin) return;
    if (k === 'BORRAR') { actual = actual.slice(0, -1); pintar(); return; }
    if (k === 'ENTER') {
      if (actual.length < 5) { filas[est.g.length].classList.add('sacude'); setTimeout(function () { filas[est.g.length] && filas[est.g.length].classList.remove('sacude'); }, 400); aviso('Faltan letras'); return; }
      est.g.push(actual);
      var gano = actual === meta.pal; actual = '';
      if (gano || est.g.length === 6) {
        est.fin = true; est.gano = gano;
        stats.jugadas++; if (gano) { stats.ganadas++; stats.racha++; if (stats.racha > stats.maxRacha) stats.maxRacha = stats.racha; } else stats.racha = 0;
      }
      guardar(); pintar(); if (est.fin) mostrarFin();
      return;
    }
    if (/^[A-ZÑ]$/.test(k) && actual.length < 5) { actual += k; pintar(); }
  }

  tec.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) tecla(b.dataset.k); });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') { e.preventDefault(); tecla('ENTER'); }
    else if (e.key === 'Backspace') tecla('BORRAR');
    else if (e.key.length === 1) tecla(norm(e.key));
  });

  pintar(); if (est.fin) mostrarFin();
})();
