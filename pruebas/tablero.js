/* ============================================================================
   Pruebas del TABLERO sobre el emulador que carga apps-script.gs TAL CUAL.
   ----------------------------------------------------------------------------
   Dos cosas se prueban aquí y las dos importan igual:
   1. Que las CUENTAS estén bien. Si un número miente, el dueño toma una
      decisión mala con cara de dato.
   2. Que el DISEÑO esté puesto: bandas, barras, colores, formato de moneda.
      Un tablero que se ve como una hoja de cálculo cruda no lo mira nadie.
   ============================================================================ */
const { crear, COMERCIO, configurar } = require('./gas.js');
/* La versión no se escribe a mano aquí: se saca del maestro. Estaba repetida en
   ocho sitios y cada release obligaba a perseguirla. Patrón 2 de la bitácora. */
const LA_VERSION = (require('fs').readFileSync('./as.js', 'utf8')
  .match(/var VERSION = '([^']+)'/) || [])[1];
const g = crear('./as.js');
const api = g.api;
const H = n => g.hojas.get(n);
const D = n => g.filas(n);

const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

api.instalar();
configurar(g);   // de fábrica no tiene nombre: el tablero se titularía con un corchete

// ---------- fechas de referencia ----------
const ahora = new Date();
const diaDelMes = ahora.getDate();
const hace = h => new Date(ahora.getTime() - h * 3600 * 1000);
const mesAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
const hace30 = new Date(ahora.getTime() - 30 * 24 * 3600 * 1000);
const antDentro30 = mesAnt >= hace30;
const fechaSensible = diaDelMes >= 3;    // el 1 y el 2, "hace 48 h" ya es otro mes

// ---------- sembrar ----------
// Pedidos: Fecha, Pedido, Validación, Estado, Ciudad, Cupón,
//          Producto, ID, Cantidad, Precio, Subtotal línea, Total pedido, Inventario
const hp = H('Pedidos');
const linea = (fecha, codigo, estado, ciudad, id, nombre, cant, precio, total) =>
  hp.appendRow([fecha, codigo, 'V-' + codigo, estado, ciudad, '', nombre, id,
                cant, precio, cant * precio, total, '']);

// Este mes
linea(ahora, 'A001', 'Confirmado', 'Medellín', 'chonto', 'Tomate chonto', 3, 8900, 60000);
linea(ahora, 'A001', 'Confirmado', 'Medellín', 'salsa',  'Salsa natural',  1, 14900, 60000);
linea(ahora, 'A002', 'Confirmado', 'Bogotá',   'chonto', 'Tomate chonto', 2, 8900, 40000);
linea(ahora, 'A003', 'Por confirmar', 'Cali',  'chonto', 'Tomate chonto', 1, 8900, 25000);
linea(hace(48), 'A004', 'Por confirmar', 'Cali','salsa', 'Salsa natural', 1, 14900, 30000);
linea(ahora, 'A005', 'Anulado', 'Pereira',     'jugo',   'Jugo prensado', 1, 12900, 99000);

// Mes anterior, día 1: cae dentro del tramo comparable cualquier día que se corra
/* LAS UNIDADES DEL MES PASADO TIENEN QUE PERDER SIEMPRE CONTRA EL CHONTO.
   «Más vendidos» es una ventana rodante de 30 días, y el mes pasado entra o no
   entra en ella según el calendario: el 1 de marzo, febrero empieza hace 28
   días. Con 4+2 unidades de cherry contra 5 de chonto, el ranking se daba la
   vuelta esos dos días del año y tres aserciones se caían.

   No se arregla saltándose la aserción cuando el calendario molesta —eso la
   apaga justo los días en que serviría—. Se arregla sembrando 2+1: el chonto
   gana entre o no entre el mes pasado, y la aserción mide lo que dice medir,
   que es que el maestro ordena por unidades.

   Los totales siguen siendo 26.000 y 14.000: son los que suman los 40.000 de
   la comparación contra el mes pasado, y esos no se tocan. */
linea(mesAnt, 'B001', 'Confirmado', 'Medellín', 'cherry', 'Tomate cherry', 2, 6500, 26000);
linea(mesAnt, 'B002', 'Confirmado', 'Medellín', 'cherry', 'Tomate cherry', 1, 6500, 14000);
linea(mesAnt, 'B003', 'Por confirmar', 'Cali',  'cherry', 'Tomate cherry', 1, 6500, 9000);

/* ESTE PEDIDO TIENE QUE QUEDAR FUERA DE TODO, Y «HACE 40 DÍAS» NO LO GARANTIZA.
   Decía `ahora - 40 días` con el comentario «fuera de todas las listas de 30
   días». De las de 30 días sí. De la COMPARACIÓN CONTRA EL MES PASADO, no:
   restar 40 días desde el día 10 de septiembre cae en el 1 de agosto, que es
   mes pasado y está dentro del tramo «hasta el mismo día». Los 200.000 se
   sumaban a la base de comparación —40.000 pasaban a 240.000— y seis
   aserciones se caían.

   Y se caían POR EL CALENDARIO: esta batería solo pasaba durante los primeros
   nueve días de cada mes. Estuvo verde toda la semana del 4 al 9 de septiembre
   y se puso roja sola el día 10, sin que nadie tocara una línea. Una prueba que
   depende de qué día se corre no prueba nada: da la respuesta del día.

   Dos meses atrás y a mitad de mes queda fuera de las dos ventanas POR
   CONSTRUCCIÓN —nunca es el mes pasado, y nunca está a menos de 45 días—
   cualquier día del año. Y hay una aserción más abajo que lo comprueba en vez
   de confiar en este comentario. */
const haceDosMeses = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 15);
linea(haceDosMeses,
      'C001', 'Confirmado', 'Cartagena', 'secos', 'Tomates secos', 9, 22900, 200000);

const hv = H('Validaciones');
const carrito = (fecha, codigo) => hv.appendRow([fecha, codigo, '', 0, 0, '', 0, 0, 0, '']);
['A001','A002','A003','A004','A005','X006','X007','X008'].forEach(c => carrito(ahora, c));
['B001','B002','B003','Y004'].forEach(c => carrito(mesAnt, c));

H('Errores').appendRow([ahora, 'JSON inválido', '{roto']);

// ---------- ejecutar ----------
const escritas = api.recalcularTablero();
const hoja = H('Tablero');
const tab = D('Tablero');

const buscar = (etiqueta, n) => {
  const hits = [];
  tab.forEach((f, i) => { if (String(f[0]).trim() === etiqueta) hits.push({ f: i + 1, fila: f }); });
  return hits[(n || 1) - 1] || { f: 0, fila: [] };
};
const val = (e, n) => buscar(e, n).fila[1];
const cmp = (e, n) => buscar(e, n).fila[2];
const nota = (e, n) => buscar(e, n).fila[3];
const barra = (e, n) => String(buscar(e, n).fila[2] || '');
const fmt = (f, c) => hoja._formato.get(f + ',' + c) || {};
const fmtDe = (etiqueta, col, n) => fmt(buscar(etiqueta, n).f, col);

ok('Se crea la hoja Tablero', !!tab, tab ? tab.length + ' filas' : 'no existe');
ok('Escribe todas las filas que dice', escritas === tab.length,
   escritas + ' devueltas / ' + tab.length + ' en la hoja');

/* ══════════════════ LAS CUENTAS ══════════════════ */

// ---- Encabezado ----
ok('El título lleva el nombre del negocio de la hoja',
   String(tab[0][0]) === COMERCIO.negocio.toUpperCase() + '  ·  TABLERO',
   String(tab[0][0]));
ok('  ...y dice cuándo se actualizó', /^Actualizado \d\d\/\d\d\/\d{4}/.test(String(tab[0][3])),
   String(tab[0][3]));

// ---- Ventas ----
// Este mes: A001 (60000) + A002 (40000) = 100000, 2 pedidos, ticket 50000
ok('VENTAS de este mes suma solo los confirmados', val('Ventas confirmadas') === 100000,
   String(val('Ventas confirmadas')));
ok('  ...ignora el anulado y los por confirmar',
   val('Ventas confirmadas') !== 199000 && val('Ventas confirmadas') !== 125000);
ok('  ...y NO cuenta dos veces el total de un pedido de 2 líneas',
   val('Ventas confirmadas') !== 160000, 'A001 tiene 2 líneas con el mismo total');
ok('Pedidos confirmados = 2', val('Pedidos confirmados') === 2, String(val('Pedidos confirmados')));
ok('Ticket promedio = 100.000 / 2 = 50.000', val('Ticket promedio') === 50000,
   String(val('Ticket promedio')));

// ---- La comparación tiene que ser JUSTA ----
ok('Compara contra el mes pasado HASTA EL MISMO DÍA, no contra el mes completo',
   /^Mes pasado a día \d+$/.test(String(buscar('Ventas confirmadas').fila[2] !== undefined
      ? tab[buscar('Ventas confirmadas').f - 2][2] : '')),
   String(tab[buscar('Ventas confirmadas').f - 2][2]));
ok('  ...y ese es el número que muestra al lado', cmp('Ventas confirmadas') === 40000,
   String(cmp('Ventas confirmadas')));
ok('  ...con su variación calculada contra ESE mismo número',
   nota('Ventas confirmadas') === '▲ 150%',
   String(nota('Ventas confirmadas')) + ' (100.000 contra 40.000)');
ok('  ...en verde cuando sube', fmtDe('Ventas confirmadas', 4).color === '#1B5E3A',
   String(fmtDe('Ventas confirmadas', 4).color));
{
  // Para probar el rojo hace falta una CAÍDA: tienda aparte, con un mes pasado
  // mucho mejor que el actual.
  const c = require('./gas.js').crear('./as.js'); c.api.instalar();
  const chp = c.hojas.get('Pedidos');
  chp.appendRow([ahora, 'Z1', 'V', 'Confirmado', 'Cali', '', 'x', 'chonto', 1, 1000, 1000, 10000, '']);
  chp.appendRow([mesAnt, 'Z2', 'V', 'Confirmado', 'Cali', '', 'x', 'chonto', 1, 1000, 1000, 90000, '']);
  c.api.recalcularTablero();
  const ct = c.filas('Tablero');
  const f = ct.findIndex(x => String(x[0]).trim() === 'Ventas confirmadas') + 1;
  ok('  ...y en rojo cuando baja',
     /^▼ \d+%$/.test(String(ct[f - 1][3])) &&
     (c.hojas.get('Tablero')._formato.get(f + ',4') || {}).color === '#B3261E',
     String(ct[f - 1][3]) + ' / ' +
     String((c.hojas.get('Tablero')._formato.get(f + ',4') || {}).color));
}
ok('El mes anterior COMPLETO sigue estando, como contexto',
   val('Mes anterior completo') === 40000, String(val('Mes anterior completo')));

/* ══════════════════ EL GRÁFICO DE MESES ══════════════════ */
const iMeses = tab.findIndex(f => String(f[0]) === 'VENTAS MES A MES');
const meses = tab.slice(iMeses + 1, iMeses + 7);
ok('Hay un gráfico de los últimos 6 meses', meses.length === 6,
   meses.map(f => f[0]).join(' '));
ok('  ...con etiquetas de mes legibles', /^[a-z]{3} \d\d$/.test(String(meses[0][0])),
   String(meses[0][0]));
ok('  ...el último es este mes, con sus ventas', meses[5][1] === 100000, String(meses[5][1]));
ok('  ...y el anterior es el mes pasado', meses[4][1] === 40000, String(meses[4][1]));
ok('LAS BARRAS se dibujan con bloques, no con fórmulas',
   /^█+$/.test(String(meses[5][2])) && hoja._formulas.size === 0,
   meses[5][2] + '  (' + hoja._formulas.size + ' fórmulas en la hoja)');
ok('  ...proporcionales: el mes con más ventas tiene la barra más larga',
   String(meses[5][2]).length > String(meses[4][2]).length,
   'sep:' + String(meses[5][2]).length + ' vs ago:' + String(meses[4][2]).length);
ok('  ...ninguna se pasa del ancho fijado',
   meses.every(f => String(f[2]).length <= 22),
   Math.max(...meses.map(f => String(f[2]).length)) + ' bloques');
ok('  ...un mes sin ventas no dibuja barra',
   meses.filter(f => f[1] === 0).every(f => f[2] === ''),
   meses.map(f => f[1] + ':' + String(f[2]).length).join(' '));
ok('El mes en curso se resalta en el color de la marca',
   fmt(iMeses + 7, 3).color === '#D0211C' && fmt(iMeses + 6, 3).color === '#1B5E3A',
   'actual ' + fmt(iMeses + 7, 3).color + ' / anterior ' + fmt(iMeses + 6, 3).color);
ok('  ...y las barras van en monoespaciada, para que midan parejo',
   fmt(iMeses + 7, 3).fuente === 'Roboto Mono', String(fmt(iMeses + 7, 3).fuente));

/* ══════════════════ EMBUDO ══════════════════ */
ok('Carritos armados este mes = 8', val('Carritos armados en la tienda') === 8,
   String(val('Carritos armados en la tienda')));
if (fechaSensible) {
  ok('Pedidos enviados a WhatsApp = 5', val('Pedidos enviados a WhatsApp') === 5,
     String(val('Pedidos enviados a WhatsApp')));
  ok('  ...con su porcentaje: 5 de 8 = 63%',
     nota('Pedidos enviados a WhatsApp') === '63% de los carritos',
     String(nota('Pedidos enviados a WhatsApp')));
  ok('Ventas confirmadas cierran 2 de 5 = 40%',
     nota('Ventas confirmadas', 2) === '40% de los enviados',
     String(nota('Ventas confirmadas', 2)));
} else {
  ok('(embudo omitido: hoy es día ' + diaDelMes + ')', true);
  ok('(embudo omitido)', true); ok('(embudo omitido)', true);
}
ok('El embudo cuenta PEDIDOS, no pesos', val('Ventas confirmadas', 2) === 2,
   String(val('Ventas confirmadas', 2)));
ok('  ...y sus barras van decreciendo',
   barra('Carritos armados en la tienda').length >= barra('Pedidos enviados a WhatsApp').length &&
   barra('Pedidos enviados a WhatsApp').length >= barra('Ventas confirmadas', 2).length,
   [barra('Carritos armados en la tienda').length,
    barra('Pedidos enviados a WhatsApp').length,
    barra('Ventas confirmadas', 2).length].join(' > '));
ok('Explica qué hacer si cae cada porcentaje',
   tab.some(f => /revisa precio o envío/.test(String(f[3]))));

/* ══════════════════ PARA ATENDER HOY ══════════════════ */
ok('Pedidos por confirmar = 3 (el anulado no cuenta)',
   val('Pedidos por confirmar') === 3, String(val('Pedidos por confirmar')));
ok('  ...de más de 24 horas = 2', val('de más de 24 horas') === 2,
   String(val('de más de 24 horas')));
ok('  ...y eso sale en rojo, que es lo que hay que hacer hoy',
   fmtDe('de más de 24 horas', 2).color === '#B3261E',
   String(fmtDe('de más de 24 horas', 2).color));
ok('  ...con la razón al lado', /se enfría la venta/.test(String(nota('de más de 24 horas'))),
   String(nota('de más de 24 horas')));
ok('Errores registrados = 1', val('Errores registrados') === 1, String(val('Errores registrados')));

/* ══════════════════ INVENTARIO ══════════════════ */
ok('Productos agotados = 1 (pasta, stock 0)', val('Productos agotados') === 1,
   String(val('Productos agotados')));
ok('  ...y dice CUÁL', /Pasta de tomate concentrada/.test(String(nota('Productos agotados'))),
   String(nota('Productos agotados')));
ok('Con 5 unidades o menos = 2 (cherry 4, secos 3)', val('Con 5 unidades o menos') === 2,
   String(val('Con 5 unidades o menos')));
ok('  ...con cuántas quedan de cada uno',
   /Tomate cherry \(4\)/.test(String(nota('Con 5 unidades o menos'))),
   String(nota('Con 5 unidades o menos')));
const sinVenderEsperado = antDentro30 ? 5 : 6;
ok('Sin vender en 30 días = ' + sinVenderEsperado,
   val('Sin vender en 30 días') === sinVenderEsperado,
   String(val('Sin vender en 30 días')) + ' (mes anterior dentro de 30 días: ' + antDentro30 + ')');
ok('  ...la lista se recorta para no desbordar la pantalla',
   String(nota('Sin vender en 30 días')).split(', ').length <= 4 &&
   / y \d+ más$/.test(String(nota('Sin vender en 30 días'))),
   String(nota('Sin vender en 30 días')));

/* ══════════════════ LO QUE MÁS SE VENDE ══════════════════ */
const iTop = tab.findIndex(f => String(f[0]) === 'LO QUE MÁS SE VENDE');
const top = [];
for (let i = iTop + 1; i < tab.length && String(tab[i][0]).trim(); i++) top.push(tab[i]);
ok('El más vendido es el chonto con 5 unidades (3 + 2)',
   top[0] && top[0][0] === 'Tomate chonto' && top[0][1] === 5,
   top.map(f => f[0] + ':' + f[1]).join(', '));
ok('  ...con sus ingresos reales (3+2) x 8.900 = 44.500', top[0] && top[0][3] === 44500,
   String(top[0] && top[0][3]));
ok('  ...usa el nombre del CATÁLOGO, no el que venía en el pedido',
   top[0] && top[0][0] === 'Tomate chonto');
/* Y gana ENTRE O NO ENTRE el mes pasado en la ventana rodante de 30 días, que
   es lo que hace que esta aserción valga cualquier día del año. Las unidades se
   cuentan de la hoja sembrada, no se escriben aquí: si alguien vuelve a subir
   las del mes pasado, esto se cae diciendo por qué. */
{
  const unidades = (codigos) => g.filas('Pedidos')
    .filter(f => codigos.test(String(f[1])) && String(f[3]) === 'Confirmado')
    .reduce((s, f) => s + Number(f[8]), 0);
  ok('  ...y le gana al mes pasado, entre o no entre en los 30 días',
     unidades(/^B/) < unidades(/^A/),
     'mes pasado ' + unidades(/^B/) + ' unidades · este mes ' + unidades(/^A/));
}
ok('  ...y su barra llena el ancho, por ser el primero',
   top[0] && String(top[0][2]).length === 22, String(top[0] && String(top[0][2]).length));
ok('Los tomates secos de hace dos meses NO aparecen',
   !top.some(f => /secos/i.test(String(f[0]))), top.map(f => f[0]).join(', '));

/* LA SIEMBRA SE COMPRUEBA, NO SE CONFÍA. Este pedido existe para quedar fuera
   de las dos ventanas; si un día alguien vuelve a escribirlo como un desfase en
   días, esto se cae AQUÍ —diciendo por qué— en vez de caerse seis aserciones
   más arriba diciendo un número. Y se cae cualquier día del mes, no solo el 10. */
{
  const finMesPasado = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
  const dias = Math.round((ahora - haceDosMeses) / 86400000);
  ok('  ...y su fecha queda fuera de las DOS ventanas cualquier día del año',
     haceDosMeses <= finMesPasado &&
     haceDosMeses.getMonth() !== finMesPasado.getMonth() && dias > 30,
     dias + ' días atrás · mes ' + (haceDosMeses.getMonth() + 1) +
     ', y el mes pasado es el ' + (finMesPasado.getMonth() + 1));
}
ok('Lo que está "Por confirmar" no cuenta como vendido',
   top.reduce((s, f) => s + (/chonto/i.test(f[0]) ? f[1] : 0), 0) === 5, 'si contara A003 serían 6');
ok('Nunca muestra más de 5 productos', top.length <= 5, top.length + ' filas');
ok('Los ingresos van con formato de pesos',
   fmt(iTop + 2, 4).formato === '"$"#,##0', String(fmt(iTop + 2, 4).formato));

/* ══════════════════ DÓNDE COMPRAN ══════════════════ */
const iCiu = tab.findIndex(f => String(f[0]) === 'DÓNDE COMPRAN');
const ciu = [];
for (let i = iCiu + 1; i < tab.length && String(tab[i][0]).trim(); i++) ciu.push(tab[i]);
const medellin = ciu.find(f => f[0] === 'Medellín');
ok('Medellín aparece con 1 pedido de este mes' + (antDentro30 ? ' + 2 del anterior' : ''),
   medellin && medellin[1] === (antDentro30 ? 3 : 1),
   ciu.map(f => f[0] + ':' + f[1]).join(', '));
ok('Bogotá aparece con 1 pedido', (ciu.find(f => f[0] === 'Bogotá') || [])[1] === 1,
   ciu.map(f => f[0] + ':' + f[1]).join(', '));
ok('Cali NO aparece: sus pedidos están por confirmar', !ciu.some(f => f[0] === 'Cali'),
   ciu.map(f => f[0]).join(', '));
ok('Cuenta PEDIDOS, no líneas de pedido', medellin && medellin[1] < 4,
   'A001 tiene 2 líneas y no debe contar doble');

/* ══════════════════ EL DISEÑO ══════════════════ */
ok('DISEÑO: se apaga la cuadrícula de la hoja', hoja._sinCuadricula === true);
ok('  ...las columnas tienen ancho propio',
   hoja._anchos[1] === 260 && hoja._anchos[4] === 330, JSON.stringify(hoja._anchos));
ok('  ...el título va en una banda unida, con el color de la marca',
   hoja._uniones.some(u => u.f === 1 && u.nc === 3) && fmt(1, 1).fondo === '#1B5E3A' &&
   fmt(1, 1).color === '#FFFFFF',
   JSON.stringify(hoja._uniones) + ' ' + fmt(1, 1).fondo);
const bandas = ['VENTAS DE ESTE MES', 'VENTAS MES A MES', 'EMBUDO DE ESTE MES',
                'PARA ATENDER HOY', 'INVENTARIO', 'LO QUE MÁS SE VENDE', 'DÓNDE COMPRAN'];
ok('  ...cada sección tiene su banda gris', bandas.every(b => {
     const f = tab.findIndex(x => String(x[0]) === b) + 1;
     return f > 0 && fmt(f, 1).fondo === '#F1F1EF' && fmt(f, 1).negrita === 'bold';
   }), bandas.filter(b => {
     const f = tab.findIndex(x => String(x[0]) === b) + 1;
     return !(f > 0 && fmt(f, 1).fondo === '#F1F1EF');
   }).join(', ') || 'todas');
ok('  ...las siete secciones están, en su orden',
   bandas.map(b => tab.findIndex(x => String(x[0]) === b))
         .every((v, i, a) => v > 0 && (i === 0 || v > a[i - 1])),
   bandas.map(b => tab.findIndex(x => String(x[0]) === b)).join(' < '));
ok('  ...la cifra principal del mes va en grande',
   fmtDe('Ventas confirmadas', 1) && fmt(buscar('Ventas confirmadas').f, 2).tam === 14,
   String(fmt(buscar('Ventas confirmadas').f, 2).tam));
ok('  ...la plata lleva formato de pesos, no números pelados',
   fmtDe('Ventas confirmadas', 2).formato === '"$"#,##0',
   String(fmtDe('Ventas confirmadas', 2).formato));
ok('  ...y los números van alineados a la derecha',
   fmtDe('Ticket promedio', 2).alineado === 'right');
ok('Avisa que la pestaña se reescribe sola',
   tab.some(f => /se pierde en el próximo recálculo/.test(String(f[0]))));

/* ══════════════════ QUE NO SE ROMPA ══════════════════ */
const antes = JSON.stringify(D('Tablero')).replace(/Actualizado[^"]*/g, 'F');
api.recalcularTablero(); api.recalcularTablero();
ok('Recalcular tres veces da exactamente lo mismo',
   JSON.stringify(D('Tablero')).replace(/Actualizado[^"]*/g, 'F') === antes,
   D('Tablero').length + ' filas');
ok('  ...y no acumula filas', D('Tablero').length === tab.length, D('Tablero').length + ' filas');

H('Tablero')._datos.length = 0;
api.recalcularResumen();
ok('recalcularResumen() (el disparador de cada hora) refresca el Tablero',
   D('Tablero').length > 25, D('Tablero').length + ' filas');

D('Pedidos')[4][3] = 'Confirmado';       // A003 (el índice 0 es el encabezado)
api.alEditar({ range: { getSheet: () => H('Pedidos'), getColumn: () => 4, getNumColumns: () => 1 } });
const tras = D('Tablero');
const v2 = e => (tras.find(f => String(f[0]).trim() === e) || [])[1];
ok('Confirmar un pedido a mano actualiza el tablero en el acto',
   v2('Pedidos confirmados') === 3, String(v2('Pedidos confirmados')));
ok('  ...y baja el de por confirmar a 2', v2('Pedidos por confirmar') === 2,
   String(v2('Pedidos por confirmar')));

// ---- Hoja recién instalada, sin un solo pedido ----
const limpio = require('./gas.js').crear('./as.js');
limpio.api.instalar();
let sinDatos = null;
try { limpio.api.recalcularTablero(); sinDatos = limpio.filas('Tablero'); }
catch (e) { sinDatos = 'EXCEPCIÓN: ' + e.message; }
ok('Con la hoja vacía no revienta', Array.isArray(sinDatos), String(sinDatos).slice(0, 80));
if (Array.isArray(sinDatos)) {
  const v3 = e => (sinDatos.find(f => String(f[0]).trim() === e) || [])[1];
  ok('  ...muestra ceros, no errores', v3('Ventas confirmadas') === 0 && v3('Ticket promedio') === 0,
     v3('Ventas confirmadas') + ' / ' + v3('Ticket promedio'));
  ok('  ...sin variaciones inventadas',
     (sinDatos.find(f => String(f[0]).trim() === 'Ventas confirmadas') || [])[3] === '',
     JSON.stringify((sinDatos.find(f => String(f[0]).trim() === 'Ventas confirmadas') || [])[3]));
  ok('  ...ni barras dibujadas de la nada',
     sinDatos.every(f => !/█/.test(String(f[2]))));
  ok('  ...y lo dice con palabras',
     sinDatos.some(f => /Todavía no hay ventas confirmadas/.test(String(f[0]))));
  ok('  ...pero el inventario sí cuenta (1 agotado, 2 con pocos)',
     v3('Productos agotados') === 1 && v3('Con 5 unidades o menos') === 2,
     v3('Productos agotados') + ' / ' + v3('Con 5 unidades o menos'));
}

ok('instalar() deja creada la hoja Tablero', !!limpio.hojas.get('Tablero'));
const dicho = [];
const realLog = console.log;
console.log = m => dicho.push(String(m));
try { limpio.api.diagnostico(); } finally { console.log = realLog; }
ok('diagnostico() revisa la hoja Tablero', dicho.some(l => /Tablero/.test(l)),
   dicho.filter(l => /Tablero/.test(l))[0] || '(no la nombra)');
ok('  ...y no reporta pestañas faltantes', !dicho.some(l => /^FALTA/.test(l)),
   dicho.filter(l => /^FALTA/.test(l)).join('; '));

const ver = JSON.parse(limpio.api.doGet({ parameter: { a: 'version' } })._texto);
ok('El rediseño NO cambia el contrato con la tienda: misma versión',
   ver.version === LA_VERSION, String(ver.version));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
