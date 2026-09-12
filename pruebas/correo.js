/* ============================================================================
   Correo diario de resumen.
   ----------------------------------------------------------------------------
   La promesa es "escribo mi correo en la hoja y me llega". Eso es lo que se
   prueba aquí: que baste la hoja, que llegue a la hora que diga la hoja, que
   llegue UNA vez al día, que el asunto sirva sin abrirlo, y que si el correo
   falla no se lleve por delante el inventario ni el tablero.
   ============================================================================ */
const { crear, COMERCIO, configurar } = require('./gas.js');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const ahora = new Date();
const hoy = ahora.getFullYear() + '-' +
            String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
            String(ahora.getDate()).padStart(2, '0');
const mesAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);

/* Una tienda nueva con datos sembrados a voluntad. */
function tienda(opciones) {
  const o = opciones || {};
  const g = crear('./as.js');
  g.api.instalar();
  configurar(g);   // de fábrica no tiene ni nombre ni celular, a propósito
  const hp = g.hojas.get('Pedidos');
  const L = (fecha, cod, estado, ciudad, id, nombre, cant, precio, total) =>
    hp.appendRow([fecha, cod, 'V-' + cod, estado, ciudad, '', nombre, id,
                  cant, precio, cant * precio, total, '']);
  if (!o.vacia) {
    /* AYER ES AYER, y el día 1 eso cae en el mes pasado. No se toca: el correo
       diario habla de AYER, y media batería mide justo eso. Lo que estaba mal
       era la expectativa del CSV mensual, no el dato — ver el bloque 9. */
    const ayer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1, 10, 0);
    L(ayer, 'A001', 'Confirmado', 'Medellín', 'chonto', 'Tomate chonto', 3, 8900, 60000);
    L(ayer, 'A002', 'Confirmado', 'Bogotá', 'chonto', 'Tomate chonto', 2, 8900, 40000);
    L(new Date(ahora - 50 * 3600e3), 'A003', 'Por confirmar', 'Cali', 'salsa', 'Salsa', 1, 14900, 30000);
    L(new Date(ahora - 3 * 3600e3), 'A004', 'Por confirmar', 'Pereira', 'salsa', 'Salsa', 1, 14900, 25000);
    L(new Date(ahora - 2 * 3600e3), 'A005', 'Anulado', 'Cali', 'jugo', 'Jugo', 1, 12900, 99000);
    L(mesAnt, 'B001', 'Confirmado', 'Medellín', 'cherry', 'Cherry', 4, 6500, 26000);
    const hv = g.hojas.get('Validaciones');
    ['A001', 'A002', 'A003', 'A004', 'X05', 'X06'].forEach(c =>
      hv.appendRow([ahora, c, '', 0, 0, '', 0, 0, 0, '']));
  }
  const cfg = (clave, valor) => {
    const d = g.filas('Configuración');
    const i = d.findIndex(f => f[0] === clave);
    if (i < 1) throw new Error('no existe la clave ' + clave);
    g.hojas.get('Configuración').getRange(i + 1, 2).setValue(valor);
  };
  if (o.stockSano) {
    const hc = g.hojas.get('Catálogo');
    g.filas('Catálogo').slice(1).forEach((f, i) => hc.getRange(i + 2, 6).setValue(50));
  }
  const leer = clave => {
    const f = g.filas('Configuración').find(f => f[0] === clave);
    return f ? String(f[1]) : null;
  };
  if (o.correo !== undefined) cfg('correo_resumen', o.correo);
  else cfg('correo_resumen', 'dueno@tienda.co');
  if (o.hora !== undefined) cfg('correo_hora', o.hora);
  else cfg('correo_hora', '0');            // 0 = a cualquier hora del día
  if (o.siempre !== undefined) cfg('correo_siempre', o.siempre);
  return { g, cfg, leer, api: g.api };
}

// ═══ 1. La hoja manda: sin correo escrito, no se manda nada ═══
{
  const t = tienda({ correo: '' });
  const r = t.api.revisarCorreo();
  ok('Sin correo en la hoja NO manda nada', t.g.correos.length === 0 && r === 'sin destinatarios', r);
}

// ═══ 2. Escribo mi correo en la hoja y llega ═══
let base;
{
  const t = base = tienda();
  const r = t.api.revisarCorreo();
  ok('ESCRIBO MI CORREO EN LA HOJA Y LLEGA', t.g.correos.length === 1 && r === 'enviado', r);
  const c = t.g.correos[0];
  ok('  ...al destinatario de la hoja', c.to === 'dueno@tienda.co', c.to);
  ok('  ...firmado con el nombre del negocio de la hoja',
     c.name === COMERCIO.negocio, c.name);
  ok('  ...y queda anotada la fecha en correo_ultimo', t.leer('correo_ultimo') === hoy,
     t.leer('correo_ultimo'));
}

// ═══ 3. Varios destinatarios, y la basura se descarta ═══
{
  const t = tienda({ correo: 'uno@tienda.co, dos@tienda.co ; no-es-correo , tres@tienda.co' });
  t.api.revisarCorreo();
  const to = t.g.correos[0].to;
  ok('Acepta VARIOS correos separados por coma', to.split(',').length === 3, to);
  ok('  ...y descarta lo que no es un correo', !/no-es-correo/.test(to), to);
}

// ═══ 4. La hora también sale de la hoja ═══
{
  const t = tienda({ hora: '23' });
  const r = t.api.revisarCorreo();
  const deberiaEsperar = ahora.getHours() < 23;
  ok('Antes de la hora de la hoja NO manda',
     deberiaEsperar ? (r === 'todavía no es la hora' && !t.g.correos.length) : true,
     r + ' (son las ' + ahora.getHours() + ')');
  ok('  ...y no anota nada, para que salga cuando llegue la hora',
     deberiaEsperar ? t.leer('correo_ultimo') === '' : true, t.leer('correo_ultimo'));
}
{
  const t = tienda({ hora: '0' });
  t.api.revisarCorreo();
  ok('A partir de la hora de la hoja SÍ manda', t.g.correos.length === 1);
}
{
  const t = tienda({ hora: 'sandía' });
  const r = t.api.revisarCorreo();
  ok('Una hora escrita como disparate no rompe nada', r === 'enviado' || r === 'todavía no es la hora', r);
}

// ═══ 5. UNA vez al día, aunque el recálculo corra cada hora ═══
{
  const t = tienda();
  t.api.revisarCorreo();
  t.api.revisarCorreo();
  t.api.revisarCorreo();
  ok('Tres revisiones el mismo día = UN correo', t.g.correos.length === 1,
     t.g.correos.length + ' correos');
  t.cfg('correo_ultimo', '2020-01-01');
  t.api.revisarCorreo();
  ok('  ...y al día siguiente vuelve a salir', t.g.correos.length === 2,
     t.g.correos.length + ' correos');
}

// ═══ 6. El asunto sirve SIN abrir el correo ═══
{
  const asunto = base.g.correos[0].subject;
  ok('EL ASUNTO dice primero lo que hay que hacer',
     /esperan? hace más de un día/.test(asunto), asunto);
  ok('  ...y después la plata de ayer', /\$100\.000 ayer/.test(asunto), asunto);
  ok('  ...empezando por el nombre del negocio',
     asunto.indexOf(COMERCIO.negocio + ' · ') === 0, asunto);
}
{
  const t = tienda({ stockSano: true });
  t.g.filas('Pedidos').forEach(f => { if (f[3] === 'Por confirmar') f[3] = 'Confirmado'; });
  t.api.revisarCorreo();
  ok('Sin nada pendiente el asunto lo dice', /· al día ·/.test(t.g.correos[0].subject),
     t.g.correos[0].subject);
}
{
  const t = tienda();
  t.g.filas('Pedidos').forEach(f => { if (f[3] === 'Por confirmar') f[3] = 'Confirmado'; });
  t.api.revisarCorreo();
  ok('Un producto agotado ya es razón para escribir',
     /1 producto agotado/.test(t.g.correos[0].subject), t.g.correos[0].subject);
}
{
  const t = tienda({ vacia: true, siempre: 'Sí' });
  t.api.revisarCorreo();
  ok('Sin ventas ayer también lo dice', /sin ventas ayer/.test(t.g.correos[0].subject),
     t.g.correos[0].subject);
}

// ═══ 7. El cuerpo: lo accionable primero, y con nombres ═══
{
  const html = base.g.correos[0].htmlBody;
  const iHacer = html.indexOf('Para hacer hoy');
  const iAyer  = html.indexOf('>Ayer<');
  const iMes   = html.indexOf('Este mes');
  ok('El cuerpo abre con lo que hay que HACER, no con las ventas',
     iHacer > -1 && iHacer < iAyer && iAyer < iMes,
     'hacer:' + iHacer + ' ayer:' + iAyer + ' mes:' + iMes);
  ok('Lista los pedidos pendientes por su número', /A003/.test(html) && /A004/.test(html));
  ok('  ...con la ciudad, para saber a quién se le escribe', /Cali/.test(html) && /Pereira/.test(html));
  ok('  ...con el valor', /\$30\.000/.test(html), (html.match(/\$[\d.]+/g) || []).slice(0, 6).join(' '));
  ok('  ...y cuánto lleva esperando', /hace 2 días|hace \d+ h/.test(html),
     (html.match(/hace [^<]*/) || [''])[0]);
  ok('NO lista el pedido anulado', !/A005/.test(html));
  ok('Dice lo de ayer en pesos', /\$100\.000/.test(html));
  ok('Trae el embudo del mes en una línea',
     /carritos armados/.test(html) && /llegaron a WhatsApp/.test(html),
     (html.match(/De <strong>[^]{0,90}/) || [''])[0].replace(/<[^>]*>/g, ''));
  ok('Avisa los agotados POR NOMBRE, no solo cuántos',
     /Agotados:<\/strong> Pasta de tomate concentrada/.test(html),
     (html.match(/Agotados:<\/strong>[^<]*/) || [''])[0]);
  ok('  ...y los que quedan pocos, con cuántos quedan',
     /Tomate cherry \(4\)/.test(html) && /Tomates secos en aceite de oliva \(3\)/.test(html),
     (html.match(/pocas:<\/strong>[^<]*/) || [''])[0]);
  ok('Lleva el enlace a la hoja', /docs\.google\.com/.test(html));
  ok('Explica cómo dejar de recibirlo', /borra correo_resumen/.test(html));
  ok('No se le escapa HTML sin escapar', !/<script/i.test(html));
}

// ═══ 8. Si no hay nada, no molesta ═══
{
  const t = tienda({ vacia: true, stockSano: true });
  const r = t.api.revisarCorreo();
  ok('Sin nada que contar NO manda correo', t.g.correos.length === 0 && r === 'nada que contar', r);
  ok('  ...pero anota el día, para no reintentar cada hora',
     t.leer('correo_ultimo') === hoy, t.leer('correo_ultimo'));
}
{
  const t = tienda({ vacia: true, siempre: 'Sí' });
  t.api.revisarCorreo();
  ok('Con correo_siempre = Sí llega igual', t.g.correos.length === 1);
  ok('  ...y no miente: dice que no hay nada pendiente',
     /Nada pendiente/.test(t.g.correos[0].htmlBody));
}
{
  const t = tienda({ vacia: true, stockSano: true });
  const r = t.api.enviarResumenAhora();
  ok('El menú "Enviarme el resumen ahora" manda aunque no haya nada',
     t.g.correos.length === 1 && /Resumen enviado a/.test(r.texto), r.texto);
}
{
  const t = tienda({ correo: '' });
  const r = t.api.enviarResumenAhora();
  ok('El menú sin correo configurado explica qué hacer',
     r.tipo === 'aviso' && /correo_resumen/.test(r.texto), r.texto);
}

// ═══ 9. El adjunto mensual ═══
{
  const t = tienda();
  t.api.revisarCorreo();
  const adj = t.g.correos[0].attachments || [];
  ok('El primer correo del mes adjunta el mes anterior en CSV',
     adj.length === 1 && /^pedidos-\d{4}-\d{2}\.csv$/.test(adj[0].getName()),
     adj.length ? adj[0].getName() : 'sin adjunto');
  if (adj.length) {
    const csv = adj[0].getDataAsString();
    ok('  ...con encabezados', /Fecha,Pedido,Validación/.test(csv), csv.split('\n')[0].slice(0, 40));
    /* LA REGLA ES «TODO LO DEL MES PASADO Y NADA MÁS», y así escrita vale
       cualquier día del año.

       Decía «B001 sí, A001 no». A001 está fechado ayer, y el día 1 ayer ES el
       mes pasado: la aserción se caía acusando al producto de un acierto.

       El primer arreglo fue peor: leer las fechas del propio CSV. Eso prueba
       cómo se SERIALIZA la fecha, no qué filas salen — y la serialización
       cambia («2026-08-01…» en un mes, «Wed Dec 01 2027…» en otro), así que la
       batería se caía en enero por una razón que no tenía nada que ver.

       Lo que decide qué filas van es la FECHA SEMBRADA. Así que se pregunta a
       la siembra qué pedidos son del mes pasado y se exige que el CSV lleve
       esos y solo esos, sea cual sea el día y sea cual sea el formato. */
    const delMesPasado = (f) => {
      const d = new Date(f);
      return d.getFullYear() === mesAnt.getFullYear() &&
             d.getMonth() === mesAnt.getMonth();
    };
    const pedidos = t.g.filas('Pedidos').filter(f => /^[AB]\d/.test(String(f[1])));
    const codigos = (dentro) => [...new Set(pedidos
      .filter(f => delMesPasado(f[0]) === dentro).map(f => String(f[1])))];
    const deben = codigos(true), no = codigos(false);

    ok('  ...con TODOS los pedidos de ese mes',
       deben.length > 0 && deben.every(c => csv.indexOf(c) !== -1),
       deben.join(', ') + ' (día ' + ahora.getDate() + ')');
    ok('  ...y ninguno de otro mes',
       !no.some(c => csv.indexOf(c) !== -1),
       no.filter(c => csv.indexOf(c) !== -1).join(', ') || 'ninguno se coló');
    ok('  ...abrible en Excel con acentos (lleva BOM)', csv.charCodeAt(0) === 0xFEFF);
  }
  /* «UN SEGUNDO CORREO EL MISMO MES» NO EXISTE EL DÍA 1, y por eso esto se
     salta ese día en vez de fingir que lo prueba.

     El guardián diario bloquea un segundo envío el mismo día, así que el
     escenario necesita un día anterior DENTRO del mes; el día 1 no lo tiene.
     Sembrar «ya salió uno el día 1» estando a día 1 es sembrar «ya salió uno
     hoy», y entonces no se manda nada y `correos[1]` no existe: la batería
     reventaba el primero de cada mes.

     No se pierde cobertura: `calendario.js` corre esta batería fingiendo ser
     cada día del año, así que este bloque se comprueba de verdad los otros
     once doceavos. Saltarse un escenario que ese día NO PUEDE existir es otra
     cosa que saltárselo porque estorba. */
  const diaHoy = Number(hoy.slice(8, 10));
  if (diaHoy === 1) {
    ok('(segundo correo del mes omitido: hoy es día 1 y no hay día anterior en el mes)',
       true, 'calendario.js lo comprueba los demás días del año');
  } else {
    t.cfg('correo_ultimo', hoy.slice(0, 8) + '01');   // ya salió uno este mes
    t.api.revisarCorreo();
    ok('El segundo correo del mismo mes NO repite el adjunto',
       t.g.correos[1] && (t.g.correos[1].attachments || []).length === 0,
       t.g.correos[1] ? (t.g.correos[1].attachments || []).length + ' adjuntos'
                      : 'no se mandó un segundo correo');
  }
}

// ═══ 10. Si el correo falla, el negocio sigue ═══
{
  const t = tienda();
  t.g.sinCuota();
  const r = t.api.revisarCorreo();
  ok('Sin cuota de correo no revienta, lo anota en Errores',
     r === 'sin cuota' && t.g.filas('Errores').length === 2,
     r + ' / ' + (t.g.filas('Errores').length - 1) + ' errores');
}
{
  const t = tienda();
  t.g.sinCuota();
  let exploto = false;
  try { t.api.recalcularResumen(); } catch (e) { exploto = true; }
  ok('Un correo que falla NO tumba el recálculo del tablero', !exploto);
  ok('  ...y el tablero igual quedó escrito', t.g.filas('Tablero').length > 20,
     (t.g.filas('Tablero').length - 1) + ' filas');
}

// ═══ 11. El recálculo horario es el que lo dispara ═══
{
  const t = tienda();
  t.api.recalcularResumen();
  ok('recalcularResumen() (el disparador de cada hora) manda el resumen',
     t.g.correos.length === 1, t.g.correos.length + ' correos');
  t.api.recalcularResumen(); t.api.recalcularResumen();
  ok('  ...y las horas siguientes ya no', t.g.correos.length === 1,
     t.g.correos.length + ' correos');
}

// ═══ 12. Las claves nuevas aparecen en una hoja que YA existía ═══
{
  const g = crear('./as.js');
  g.api.instalar();
  configurar(g);   // el dueño ya escribió lo suyo
  const h = g.hojas.get('Configuración');
  const d = g.filas('Configuración');
  // Simulamos la hoja de alguien que instaló ANTES de que existiera el correo
  for (let i = d.length - 1; i >= 1; i--) if (/^correo_/.test(String(d[i][0]))) d.splice(i, 1);
  ok('(preparado) la hoja vieja no tiene las claves de correo',
     !g.filas('Configuración').some(f => /^correo_/.test(String(f[0]))));
  g.api.instalar();
  const claves = g.filas('Configuración').map(f => String(f[0]));
  ok('Volver a ejecutar instalar() AGREGA las claves nuevas',
     ['correo_resumen', 'correo_hora', 'correo_siempre', 'correo_ultimo']
       .every(k => claves.indexOf(k) !== -1),
     claves.filter(k => /^correo_/.test(k)).join(', '));
  /* Se le escribe un nombre PRIMERO y se comprueba que instalar() no lo
     pisa. Antes se comparaba contra el valor de fábrica, que no prueba
     nada: si instalar() lo hubiera reescrito, habría dado igual. */
  ok('  ...sin tocar lo que el dueño ya tenía escrito',
     g.filas('Configuración').find(f => f[0] === 'negocio')[1] ===
     COMERCIO.negocio);
  ok('  ...y sin duplicar las que ya estaban',
     claves.filter(k => k === 'negocio').length === 1 &&
     claves.filter(k => k === 'correo_hora').length === 1);
  g.api.instalar();
  ok('  ...ni al ejecutarlo tres veces',
     g.filas('Configuración').map(f => String(f[0])).filter(k => k === 'correo_hora').length === 1);
  ok('Cada clave nueva viene explicada en la columna "Qué es"',
     g.filas('Configuración').filter(f => /^correo_/.test(String(f[0])))
      .every(f => String(f[2]).length > 20));
}

// ═══ 13. El tablero y el correo cuentan LO MISMO ═══
{
  const t = tienda();
  t.api.recalcularTablero();
  const tab = t.g.filas('Tablero');
  const val = e => (tab.find(f => String(f[0]).trim() === e) || [])[1];
  t.cfg('correo_ultimo', '');
  t.api.enviarResumenAhora();
  const html = t.g.correos[0].htmlBody;
  ok('El correo y el tablero dicen el MISMO número de pendientes',
     new RegExp('>' + val('Pedidos por confirmar') + ' pedidos por confirmar<').test(html),
     'tablero: ' + val('Pedidos por confirmar'));
  ok('  ...y las mismas ventas del mes',
     html.includes('$' + Number(val('Ventas confirmadas')).toLocaleString('es-CO')),
     'tablero: ' + val('Ventas confirmadas'));
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
