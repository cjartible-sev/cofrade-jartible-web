/* Adivina la hermandad: lógica pura (se puede probar con Node) */
var HDD = (function () {
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function limpia(s) {
    var t = norm(s);
    t = t.replace(/^(hermandad|cofradia|archicofradia|agrupacion parroquial)( del| de la| de los| de las| de)? /, '');
    return t.replace(/^(el|la|los|las) /, '');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function palabrasClave(e) { return limpia(String(e.nombre).replace(/\(.*?\)/g, ' ')); }

  function pistas(e) {
    var p = [], op = [];
    if (e.categoria === 'penitencia') {
      var en = /madrug/i.test(e.dia) ? 'en la ' : 'el ';
      p.push({ ic: '📅', t: 'DÍA DE SALIDA', h: 'Hace su estación de penitencia ' + en + '<strong>' + esc(e.dia) + '</strong>.', n: 'Es una hermandad de penitencia.' });
    } else if (e.categoria === 'visperas') {
      p.push({ ic: '📅', t: 'DÍA DE SALIDA', h: 'Procesiona por su barrio el <strong>' + esc(e.dia) + '</strong>.', n: 'Es una hermandad de vísperas: no pasa por la carrera oficial.' });
    } else {
      p.push({ ic: '⛪', t: 'TIPO', h: 'Es una <strong>hermandad de gloria</strong>.', n: '' });
    }
    if (e.lugar) op.push(e.categoria === 'gloria'
      ? { ic: '📍', t: 'RELACIÓN O LUGAR', h: 'Se la relaciona con <strong>' + esc(e.lugar) + '</strong>.' }
      : { ic: '📍', t: 'BARRIO O SEDE', h: 'Su barrio o sede: <strong>' + esc(e.lugar) + '</strong>.' });
    if (e.fundacion) op.push({ ic: '🏛️', t: 'FUNDACIÓN', h: 'Fundación: <strong>' + esc(e.fundacion) + '</strong>.' });
    if (e.habito) op.push({ ic: '🧵', t: 'TÚNICA', h: esc(e.habito) });
    if (e.titulares) op.push({ ic: '✝️', t: 'TITULARES', h: 'Sus titulares: ' + esc(e.titulares) });
    if (e.dato) op.push({ ic: '💡', t: 'CURIOSIDAD', h: esc(e.dato) });
    if (op.length > 3) op = [op[0], op[1], op[op.length - 1]];
    p = p.concat(op);
    var reales = p.length;
    var pk = palabrasClave(e), nw = pk.split(' ').length;
    if (p.length < 4) p.push({ ic: '🔤', t: 'NOMBRE', h: 'Su nombre tiene <strong>' + nw + (nw === 1 ? ' palabra' : ' palabras') + '</strong> (sin contar artículos ni «Hermandad de»).', u: true });
    if (p.length < 4) p.push({ ic: '🔠', t: 'INICIAL', h: 'Empieza por la letra <strong>«' + esc(pk.charAt(0).toUpperCase()) + '»</strong> (sin contar artículos).', u: true });
    p.reales = reales;
    return p;
  }

  function preparar(datos) {
    var lista = [], indice = {};
    datos.forEach(function (d, i) {
      if (!d || !d.nombre || !d.categoria) return;
      var e = {}; for (var k in d) e[k] = d[k];
      e.id = i; e.alias = (d.alias || []).filter(Boolean);
      e.pistas = pistas(e);
      lista.push(e);
    });
    lista.forEach(function (e) {
      [e.nombre].concat(e.alias).forEach(function (n) {
        var c = limpia(n); if (c && !(c in indice)) indice[c] = e.id;
      });
      e.busqueda = [e.nombre].concat(e.alias).map(norm).join('|');
    });
    return { lista: lista, indice: indice, porId: lista.reduce(function (m, e) { m[e.id] = e; return m; }, {}) };
  }
  function mcd(a, b) { return b ? mcd(b, a % b) : a; }
  function delDia(pool, dias) {
    var n = pool.length, k = 7; while (mcd(k, n) !== 1) k++;
    return pool[(dias * k) % n];
  }
  function sugerir(lista, texto, max) {
    var q = norm(texto); if (!q) return [];
    var ini = [], dentro = [];
    lista.forEach(function (e) {
      var nn = norm(e.nombre);
      if (nn.indexOf(q) === 0 || limpia(e.nombre).indexOf(q) === 0) ini.push(e);
      else if (e.busqueda.indexOf(q) !== -1) dentro.push(e);
    });
    return ini.concat(dentro).slice(0, max || 6);
  }
  var PUNTOS = [200, 100, 50, 20];
  function puntos(n) { return PUNTOS[n - 1] || 0; }
  function insertarRanking(lista, e, max) {
    max = max || 10;
    var l = lista.concat([e]).sort(function (a, b) { return b.p - a.p || b.a - a.a || a.f - b.f; });
    var pos = l.indexOf(e) + 1;
    return { lista: l.slice(0, max), pos: pos <= max ? pos : 0 };
  }
  return { puntos: puntos, insertarRanking: insertarRanking, norm: norm, limpia: limpia, esc: esc, pistas: pistas, preparar: preparar, delDia: delDia, sugerir: sugerir };
})();
if (typeof module !== 'undefined') module.exports = HDD;

/* Interfaz */
(function () {
  if (typeof document === 'undefined') return;
  var raiz = document.getElementById('hdd');
  if (!raiz) return;
  var datos = [];
  try { datos = JSON.parse(document.getElementById('hdd-datos').textContent).hermandades || []; } catch (e) {}
  var B = HDD.preparar(datos);
  if (!B.lista.length) { raiz.textContent = 'Todavía no hay hermandades.'; return; }

  var h = new Date(), p2 = function (n) { return n < 10 ? '0' + n : '' + n; };
  var hoy = h.getFullYear() + '-' + p2(h.getMonth() + 1) + '-' + p2(h.getDate());
  var dias = Math.floor(Date.UTC(h.getFullYear(), h.getMonth(), h.getDate()) / 864e5);
  var numero = dias - Math.floor(Date.UTC(2026, 9, 1) / 864e5) + 1;
  var fechaTxt = h.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  fechaTxt = fechaTxt.charAt(0).toUpperCase() + fechaTxt.slice(1);
  var pool = B.lista.filter(function (e) { return e.pistas.reales >= 3; });
  if (!pool.length) pool = B.lista;

  var $ = function (id) { return document.getElementById(id); };
  var modo = 'dia', meta, est, partida = 0, run = { p: 0, a: 0 };
  function leer(k, def) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : def; } catch (e) { return def; } }
  function escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function nombre() { return ($('hdd-nom').value || '').replace(/[<>]/g, '').trim().slice(0, 16) || 'Anónimo'; }

  function guardar() { if (modo === 'dia') escribir('hdd:' + hoy, est); }
  function nueva() {
    est = { g: [], fin: false, gano: false };
    if (modo === 'dia') {
      meta = HDD.delDia(pool, dias);
      var s = leer('hdd:' + hoy, null); if (s) est = s;
    } else {
      var otra; do { otra = B.lista[Math.floor(Math.random() * B.lista.length)]; } while (B.lista.length > 1 && meta && otra.id === meta.id);
      meta = otra; partida++;
    }
    $('hdd-in').value = ''; cerrarSug(); pintar();
  }
  function cerrarRun() {
    est.guardado = run.p; est.pos = 0;
    if (run.p > 0) {
      var x = HDD.insertarRanking(leer('hdd:rank', []), { n: nombre(), p: run.p, a: run.a, f: Date.now() }, 10);
      escribir('hdd:rank', x.lista); est.pos = x.pos;
    }
    run = { p: 0, a: 0 }; escribir('hdd:run', run);
  }

  function pintaRank() {
    var l = leer('hdd:rank', []);
    $('hdd-rl').innerHTML = l.length ? l.map(function (e, i) {
      var f = new Date(e.f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      return '<li><span class="pos">' + (i + 1) + '</span><span class="nom">' + HDD.esc(e.n) + '<small>' + e.a + (e.a === 1 ? ' acierto' : ' aciertos') + ' · ' + HDD.esc(f) + '</small></span><span class="pun">' + e.p + ' pts</span></li>';
    }).join('') : '<li class="vacio">Todavía no hay partidas guardadas.</li>';
  }

  function pintar() {
    var inf = modo === 'inf';
    var tot = meta.pistas.length;
    var reveladas = est.fin ? tot : Math.min(tot, est.g.length + 1);
    $('hdd-ey').textContent = inf ? 'MODO INFINITO · Nº ' + partida : 'HERMANDAD DEL DÍA · Nº ' + numero;
    $('hdd-fecha').textContent = inf ? 'Encadena aciertos. Si fallas, termina la partida.' : fechaTxt;
    $('hdd-t1').className = 'hdd-tab' + (inf ? '' : ' on');
    $('hdd-t2').className = 'hdd-tab' + (inf ? ' on' : '');
    $('hdd-run').hidden = !inf; $('hdd-rank').hidden = !inf;
    if (inf) { $('hdd-pts').textContent = run.p; $('hdd-ac').textContent = run.a; pintaRank(); }
    var ci = '';
    for (var i = 0; i < tot; i++) {
      var cl = 'hdd-ci', tx = String(i + 1);
      if (i < est.g.length) { var ok = est.gano && i === est.g.length - 1; cl += ok ? ' ok' : ' mal'; tx = ok ? '✓' : '✕'; }
      else if (!est.fin && i === est.g.length) cl += ' cur';
      ci += '<span class="' + cl + '">' + tx + '</span>';
    }
    $('hdd-ci').innerHTML = ci;
    $('hdd-int').textContent = est.fin ? (est.gano ? 'Acertaste en ' + est.g.length + ' de ' + tot : 'Sin intentos') : 'Intento ' + (est.g.length + 1) + ' de ' + tot;
    $('hdd-des').innerHTML = inf
      ? 'Tienes <strong>' + tot + ' intentos</strong>. Acertar a la 1.ª vale <strong>200</strong> pts, a la 2.ª <strong>100</strong>, a la 3.ª <strong>50</strong> y a la 4.ª <strong>20</strong>.'
      : 'Tienes <strong>' + tot + ' intentos</strong>. Empiezas con una pista y cada fallo desvela otra.';
    var ph = '';
    meta.pistas.forEach(function (p, i) {
      if (i < reveladas) {
        ph += '<div class="hdd-p on"><span class="hdd-ico">' + p.ic + '</span><div><small>PISTA ' + (i + 1) + ' · ' + p.t + '</small><div class="hdd-tx">' + p.h + '</div>' + (p.n ? '<em>' + HDD.esc(p.n) + '</em>' : '') + '</div></div>';
      } else {
        ph += '<div class="hdd-p off"><span class="hdd-ico">🔒</span><div><small>PISTA ' + (i + 1) + '</small><div class="hdd-tx">Se desbloquea al fallar.</div></div></div>';
      }
    });
    $('hdd-ps').innerHTML = ph;
    $('hdd-fa').innerHTML = est.g.map(function (id, i) {
      var bien = est.gano && i === est.g.length - 1;
      return '<span class="hdd-chip' + (bien ? ' ok' : '') + '">' + (bien ? '✓ ' : '✕ ') + HDD.esc(B.porId[id].nombre) + '</span>';
    }).join('');
    $('hdd-form').hidden = est.fin;
    var f = $('hdd-fin');
    if (!est.fin) { f.hidden = true; return; }
    f.hidden = false; f.textContent = '';
    var t = document.createElement('h3'), pp = document.createElement('p');
    function boton(txt, fn, sec) { var b = document.createElement('button'); b.type = 'button'; b.textContent = txt; if (sec) b.className = 'sec'; b.addEventListener('click', fn); f.appendChild(b); }
    if (!inf) {
      t.textContent = est.gano ? '¡Lo has adivinado!' : 'Era: ' + meta.nombre;
      pp.textContent = est.gano ? meta.nombre : 'Mañana habrá otra hermandad.';
      f.appendChild(t); f.appendChild(pp); boton('Compartir resultado', compartir);
    } else if (est.gano) {
      t.textContent = '¡Lo has adivinado! +' + (est.pts || 0) + ' puntos';
      pp.textContent = meta.nombre + ' · Llevas ' + run.p + ' puntos';
      f.appendChild(t); f.appendChild(pp);
      boton('Siguiente hermandad', nueva);
      boton('Terminar y guardar', function () { cerrarRun(); aviso(est.pos ? 'Partida guardada: puesto ' + est.pos + ' del ranking' : 'Partida guardada', 4000); nueva(); }, true);
    } else {
      t.textContent = 'Era: ' + meta.nombre;
      pp.textContent = est.guardado > 0
        ? 'Fin de la partida: ' + est.guardado + ' puntos. ' + (est.pos ? 'Puesto ' + est.pos + ' del ranking.' : 'No entra en el top 10.')
        : 'Fin de la partida sin puntos.';
      f.appendChild(t); f.appendChild(pp); boton('Nueva partida', nueva);
    }
  }

  function compartir() {
    var cu = est.g.map(function (id, i) { return est.gano && i === est.g.length - 1 ? '🟩' : '🟥'; }).join('');
    var txt = 'Adivina la hermandad #' + numero + ' ' + (est.gano ? est.g.length : 'X') + '/' + meta.pistas.length + '\n' + cu + '\n' + location.href;
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { aviso('Resultado copiado'); }, function () { aviso('No se pudo copiar'); });
  }

  var msgT;
  function aviso(t, ms) { var m = $('hdd-msg'); m.textContent = t; clearTimeout(msgT); msgT = setTimeout(function () { m.textContent = ''; }, ms || 2400); }

  function probar() {
    if (est.fin) return;
    var txt = $('hdd-in').value, c = HDD.limpia(txt), id = c in B.indice ? B.indice[c] : -1;
    if (!txt.trim()) return;
    if (id < 0) { aviso('Elige una hermandad de la lista'); return; }
    if (est.g.indexOf(id) !== -1) { aviso('Ya la has probado'); return; }
    est.g.push(id);
    if (id === meta.id) {
      est.gano = true; est.fin = true;
      if (modo === 'inf') { est.pts = HDD.puntos(est.g.length); run.p += est.pts; run.a++; escribir('hdd:run', run); }
    } else if (est.g.length >= meta.pistas.length) {
      est.fin = true;
      if (modo === 'inf') cerrarRun();
    }
    guardar(); $('hdd-in').value = ''; cerrarSug(); pintar();
  }

  var sug = $('hdd-sug'), act = -1, items = [];
  function cerrarSug() { sug.hidden = true; sug.innerHTML = ''; act = -1; items = []; }
  function pintaSug() {
    items = HDD.sugerir(B.lista, $('hdd-in').value, 6);
    if (!items.length) { cerrarSug(); return; }
    sug.innerHTML = items.map(function (e, i) { return '<li role="option" data-i="' + i + '"' + (i === act ? ' class="on"' : '') + '>' + HDD.esc(e.nombre) + '</li>'; }).join('');
    sug.hidden = false;
  }
  function elegir(i) { $('hdd-in').value = items[i].nombre; cerrarSug(); $('hdd-in').focus(); }
  $('hdd-in').addEventListener('input', function () { act = -1; pintaSug(); });
  $('hdd-in').addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); act = (act + 1) % items.length; pintaSug(); }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); act = (act - 1 + items.length) % items.length; pintaSug(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (act >= 0 && items[act]) elegir(act); else probar(); }
    else if (e.key === 'Escape') cerrarSug();
  });
  sug.addEventListener('mousedown', function (e) { var li = e.target.closest('li'); if (li) { e.preventDefault(); elegir(+li.dataset.i); } });
  document.addEventListener('click', function (e) { if (!e.target.closest('.hdd-campo')) cerrarSug(); });
  $('hdd-go').addEventListener('click', probar);
  $('hdd-nom').value = leer('hdd:nombre', '');
  $('hdd-nom').addEventListener('change', function () { escribir('hdd:nombre', nombre() === 'Anónimo' ? '' : nombre()); });
  $('hdd-t1').addEventListener('click', function () { if (modo !== 'dia') { modo = 'dia'; nueva(); } });
  $('hdd-t2').addEventListener('click', function () { if (modo !== 'inf') { modo = 'inf'; meta = null; run = leer('hdd:run', { p: 0, a: 0 }); nueva(); } });

  nueva();
})();
