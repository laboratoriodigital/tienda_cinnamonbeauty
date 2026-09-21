/* ============================================================================
   Presentación de las hojas, listas desplegables, colores y catálogo de
   respaldo.
   ----------------------------------------------------------------------------
   Todo esto existe para que el dueño no tenga que saber nada: elige de una
   lista en vez de escribir, pinta una celda en vez de buscar un código
   hexadecimal, y copia un bloque en vez de editar código a mano. Si algo de
   esto se rompe, el cliente vuelve a depender de nosotros.
   ============================================================================ */
const crear = require('./gas.js').crear;
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const nuevo = () => { const g = crear('./as.js'); g.api.instalar(); return g; };
const fmt = (g, hoja, f, c) => (g.hojas.get(hoja)._formato.get(f + ',' + c) || {});
/* Ojo: g.filas() del emulador devuelve la matriz CON encabezado, así que el
   índice ya es el número de fila de la hoja. */
const filaDe = (g, clave) => g.filas('Configuración').findIndex(f => f[0] === clave) + 1;
const valorDe = (g, clave) => g.filas('Configuración')[filaDe(g, clave) - 1][1];

// ═══ 1. Encabezados: la hoja ya no se ve cruda ═══
{
  const g = nuevo();
  const hojas = ['Configuración', 'Catálogo', 'Envíos', 'Cupones',
                 'Pedidos', 'Validaciones', 'Más vendidos', 'Errores'];
  const sinFormato = hojas.filter(n => {
    const e = fmt(g, n, 1, 1);
    return !(e.fondo === '#1B5E3A' && e.color === '#FFFFFF' && e.negrita === 'bold');
  });
  ok('TODAS las hojas tienen encabezado con el color de la marca',
     sinFormato.length === 0, sinFormato.join(', ') || 'las ocho');
  ok('  ...y la primera fila queda fija al desplazar',
     hojas.every(n => g.hojas.get(n)._filasFijas === 1));
  ok('  ...con anchos de columna pensados, no los de fábrica',
     Object.keys(g.hojas.get('Catálogo')._anchos).length >= 8,
     Object.keys(g.hojas.get('Catálogo')._anchos).length + ' columnas');
  ok('En Pedidos también se fijan las dos primeras columnas',
     g.hojas.get('Pedidos')._columnasFijas === 2);
}

// ═══ 2. La plata se ve como plata, las fechas como fechas ═══
{
  const g = nuevo();
  ok('El precio del catálogo lleva formato de pesos',
     fmt(g, 'Catálogo', 2, 5).formato === '"$"#,##0', String(fmt(g, 'Catálogo', 2, 5).formato));
  ok('El valor del envío también', fmt(g, 'Envíos', 2, 3).formato === '"$"#,##0');
  g.hojas.get('Pedidos').appendRow([new Date(), 'A1', 'V', 'Por confirmar', 'Cali', '',
                                    'x', 'chonto', 1, 8900, 8900, 8900, '']);
  g.api.presentarHojas();
  ok('La fecha de un pedido se ve como fecha y hora',
     fmt(g, 'Pedidos', 2, 1).formato === 'dd/mm/yyyy hh:mm',
     String(fmt(g, 'Pedidos', 2, 1).formato));
  ok('  ...y los tres totales, como pesos',
     fmt(g, 'Pedidos', 2, 10).formato === '"$"#,##0' &&
     fmt(g, 'Pedidos', 2, 12).formato === '"$"#,##0');
  ok('Las descripciones largas se ajustan en vez de desbordar',
     fmt(g, 'Catálogo', 2, 7).ajustar === true);
}

// ═══ 3. Listas desplegables: no se escribe, se elige ═══
{
  const g = nuevo();
  const val = (hoja, f, c) => fmt(g, hoja, f, c).validacion;

  const estado = val('Pedidos', 2, 4);
  /* Los estados NO se escriben aquí: se le preguntan al maestro. Escritos a
     mano, esta batería se ponía roja el día que el ciclo del pedido creciera
     —que es justo el día en que hacía falta que mirara otra cosa— y el rojo por
     la razón equivocada es el que enseña a ignorar los rojos. */
  const esperados = g.api.menuDeLaHoja && require('fs')
    .readFileSync('./as.js', 'utf8').match(/rotulo: '([^']+)',\s+viejo:/g)
    .map(x => x.match(/rotulo: '([^']+)'/)[1]);
  ok('EL ESTADO DEL PEDIDO es una lista, no texto libre',
     !!estado && estado._lista.join('|') === esperados.join('|'),
     estado ? estado._lista.join(', ') : 'sin lista');
  ok('  ...y NO deja escribir otra cosa: un "pagado" mal escrito no mueve el inventario',
     estado && estado._permiteOtros === false);
  /* Y por eso la migración de instalar() no es opcional: con la lista cerrada,
     una hoja que todavía diga «Confirmado» quedaría marcada como inválida en
     todas sus filas históricas. */
  ok('  ...así que los estados viejos hay que migrarlos, no solo tolerarlos',
     /function migrarEstados/.test(require('fs').readFileSync('./as.js', 'utf8')),
     'la lista cerrada convierte la migración en obligatoria');
  ok('  ...con la explicación al pasar el cursor',
     /descuenta el inventario/.test(estado._ayuda), estado._ayuda);
  ok('  ...puesta también en las filas vacías, para los pedidos que aún no llegan',
     !!val('Pedidos', 400, 4), 'fila 400');

  ok('Destacado y Activo del catálogo son Sí/No',
     ['Sí', 'No'].join() === (val('Catálogo', 2, 9) || {})._lista.join() &&
     ['Sí', 'No'].join() === (val('Catálogo', 2, 10) || {})._lista.join());
  ok('El tipo de cupón es una lista de los tres que entiende el código',
     (val('Cupones', 2, 2) || {})._lista.join('|') === 'porcentaje|fijo|envio',
     (val('Cupones', 2, 2) || {})._lista.join(', '));
  ok('  ...y Activo del cupón también', (val('Cupones', 2, 8) || {})._lista.join() === 'Sí,No');

  const cat = val('Catálogo', 2, 4);
  ok('La categoría sugiere las que ya existen', !!cat && cat._lista.indexOf('Frescos') !== -1,
     cat ? cat._lista.join(', ') : 'sin lista');
  ok('  ...pero SÍ deja escribir una nueva: el negocio crece', cat._permiteOtros === true);

  ok('correo_siempre también es Sí/No',
     ((fmt(g, 'Configuración', filaDe(g, 'correo_siempre'), 2) || {}).validacion || {})
       ._lista.join() === 'Sí,No');
  const listaConfig = clave => (((fmt(g, 'Configuración', filaDe(g, clave), 2) || {}).validacion || {})._lista || []).join('|');
  ok('Modo, proveedor, ambiente e integración se eligen de listas',
     listaConfig('pago_modo') === 'pasarela|whatsapp' && listaConfig('pago_proveedor') === 'bold' &&
     listaConfig('pago_ambiente') === 'sandbox|produccion' && listaConfig('pago_integracion') === 'boton|api_qr');
}

// ═══ 4. Los colores se pintan, no se escriben ═══
{
  const g = nuevo();
  const h = g.hojas.get('Configuración');
  const claves = ['color_principal', 'color_secundario', 'color_alterno'];

  ok('Hay TRES colores de marca, no dos',
     claves.every(k => filaDe(g, k) > 0), claves.join(', '));
  ok('Cada celda de color se ve DEL color que dice', claves.every(k =>
       fmt(g, 'Configuración', filaDe(g, k), 2).fondo === valorDe(g, k)),
     claves.map(k => valorDe(g, k)).join(' '));
  ok('  ...con el texto en blanco o negro según se lea mejor',
     fmt(g, 'Configuración', filaDe(g, 'color_principal'), 2).color === '#FFFFFF',
     'sobre #D0211C');

  // Pintar la celda con el balde de Google
  h.getRange(filaDe(g, 'color_principal'), 2).setBackground('#F2C744');
  const cambios = g.api.sincronizarColores();
  ok('PINTAR LA CELDA escribe el código hexadecimal solo',
     valorDe(g, 'color_principal') === '#F2C744',
     String(valorDe(g, 'color_principal')));
  ok('  ...y avisa cuántos cambió', cambios === 1, String(cambios));
  ok('  ...con el texto oscuro, porque el amarillo es claro',
     fmt(g, 'Configuración', filaDe(g, 'color_principal'), 2).color === '#1A1A1A');
  ok('  ...y bota la caché, para que la tienda lo vea ya', !g.cache['catalogo']);

  // Escribir el código a mano
  h.getRange(filaDe(g, 'color_alterno'), 2).setValue('#123456');
  g.api.alEditar({ range: { getSheet: () => h, getColumn: () => 2, getNumColumns: () => 1 } });
  ok('ESCRIBIR el código pinta la celda, que es el camino contrario',
     fmt(g, 'Configuración', filaDe(g, 'color_alterno'), 2).fondo === '#123456',
     String(fmt(g, 'Configuración', filaDe(g, 'color_alterno'), 2).fondo));
  ok('  ...y lo escrito NO se pierde en el siguiente recálculo', (() => {
       g.api.sincronizarColores();
       return valorDe(g, 'color_alterno') === '#123456';
     })(), String(valorDe(g, 'color_alterno')));

  h.getRange(filaDe(g, 'color_secundario'), 2).setValue('no es un color');
  g.api.sincronizarColores();
  ok('Un valor que no es color no rompe nada', true);
}

// ═══ 5. El tercer color llega a la tienda ═══
{
  const g = nuevo();
  const c = JSON.parse(g.api.doGet({ parameter: { a: 'catalogo' } })._texto);
  ok('El catálogo le entrega los tres colores a la tienda',
     c.config.color_principal && c.config.color_secundario && c.config.color_alterno,
     [c.config.color_principal, c.config.color_secundario, c.config.color_alterno].join(' '));
}

// ═══ 6. El catálogo de respaldo se genera solo ═══
{
  const g = nuevo();
  const b = g.api.generarInventario().bloque;

  ok('Genera el bloque con sus dos marcas',
     /CATÁLOGO DE RESPALDO/.test(b) && /FIN DEL CATÁLOGO DE RESPALDO/.test(b));
  ok('  ...y dice de qué día es', /escrito el \d\d\/\d\d\/\d{4}/.test(b),
     (b.match(/escrito el [^ ]+ /) || [''])[0]);
  /* LA MISMA FORMA QUE ESCRIBE EL FLUJO. Este es el camino de a mano y aquel el
     automático: si dejan el archivo distinto, un día la expresión regular del
     montaje encuentra una marca y no la otra. */
  ok('  ...y la configuración de la hoja, que es lo que se pinta antes de la red',
     /^const CONFIG_SEMILLA = \{$/m.test(b) && /"negocio":/.test(b),
     (b.match(/"negocio": "[^"]*"/) || [''])[0]);
  ok('  ...sin la llave de pago, que no va en la página',
     !/pago_llave|pago_titular|pago_entidad/.test(b));
  ok('Trae las dos listas que espera index.html',
     /^const ENVIOS = \[$/m.test(b) && /^const PRODUCTOS = \[$/m.test(b));

  // Lo importante: que sea JavaScript válido y con los datos de la hoja
  let ENVIOS = null, PRODUCTOS = null;
  try { const f = new Function(b + '\n; return {ENVIOS, PRODUCTOS};'); const r = f();
        ENVIOS = r.ENVIOS; PRODUCTOS = r.PRODUCTOS; } catch (e) { /* queda en null */ }
  ok('EL BLOQUE ES JAVASCRIPT VÁLIDO: se pega y funciona', !!PRODUCTOS && !!ENVIOS,
     PRODUCTOS ? PRODUCTOS.length + ' productos' : 'no compila');
  ok('  ...con los 8 productos activos de la hoja', PRODUCTOS && PRODUCTOS.length === 8,
     String(PRODUCTOS && PRODUCTOS.length));
  ok('  ...y las 5 zonas de envío', ENVIOS && ENVIOS.length === 5, String(ENVIOS && ENVIOS.length));
  ok('  ...con los precios y el stock de HOY',
     PRODUCTOS && PRODUCTOS[0].precio === 8900 && PRODUCTOS[0].stock === 24,
     PRODUCTOS ? PRODUCTOS[0].precio + ' / ' + PRODUCTOS[0].stock : '');
  /* EL DIBUJO DEL PRODUCTO SIN FOTO YA NO LO ESCRIBE EL MAESTRO.
     Lo calculaba aquí y lo metía dentro del respaldo; la página, para lo que
     llegaba en vivo, lo heredaba POR ID de ese respaldo con «tomate» de
     reserva. Dos sitios decidiendo lo mismo y uno mandando sobre el otro: un
     producto que no estuviera en el respaldo —o una tienda que no vende
     tomate— salía dibujado como un tomate. Ahora lo decide la página, en un
     solo sitio, desde el formato y la categoría. Se prueba allí:
     `pruebas/respaldo.js`. */
  ok('  ...y NO trae el dibujo: eso lo decide la página, en un solo sitio',
     PRODUCTOS && PRODUCTOS.every(p => p.forma === undefined),
     PRODUCTOS ? PRODUCTOS.map(p => p.forma).join(' ') || '(ninguno)' : '');

  ok('Un producto apagado NO entra al respaldo', (() => {
       const g2 = nuevo();
       g2.hojas.get('Catálogo').getRange(3, 10).setValue('No');   // cherry
       const r = new Function(g2.api.generarInventario().bloque + '\n; return PRODUCTOS;')();
       return r.length === 7 && !r.some(p => p.id === 'cherry');
     })());

  ok('Las comillas de una descripción no rompen el bloque', (() => {
       const g2 = nuevo();
       g2.hojas.get('Catálogo').getRange(2, 7)
         .setValue('Dice "el mejor" y usa \\ barra y\nsalto de línea');
       try {
         const r = new Function(g2.api.generarInventario().bloque + '\n; return PRODUCTOS;')();
         return /el mejor/.test(r[0].descripcion) && !/\n/.test(r[0].descripcion);
       } catch (e) { return false; }
     })());

  ok('Las fotos salen separadas, no en un solo texto con barras', (() => {
       const g2 = nuevo();
       g2.hojas.get('Catálogo').getRange(2, 8)
         .setValue('https://res.cloudinary.com/a.jpg|https://res.cloudinary.com/b.jpg');
       const r = new Function(g2.api.generarInventario().bloque + '\n; return PRODUCTOS;')();
       return r[0].imagenes.length === 2 && r[0].imagenes[1] === 'https://res.cloudinary.com/b.jpg';
     })());

  const paquete = g.api.generarInventario();
  ok('Devuelve la ventana lista para que el stub la muestre',
     paquete.tipo === 'html' && /Catálogo de respaldo/.test(paquete.titulo), paquete.titulo);
  ok('  ...con su botón y el conteo de lo que trae',
     /<button/.test(paquete.html) && /<b>8 productos<\/b>/.test(paquete.html));
  ok('  ...y dice claramente que NO es obligatorio',
     /no es obligatorio/i.test(paquete.html));
}

// ═══ 7. Nada de esto puede romper lo que ya andaba ═══
{
  const g = nuevo();
  ok('presentarHojas() se puede ejecutar mil veces', (() => {
       try { g.api.presentarHojas(); g.api.presentarHojas(); g.api.presentarHojas(); }
       catch (e) { return false; }
       return g.filas('Catálogo').length === 9;    // encabezado + 8
     })(), (g.filas('Catálogo').length - 1) + ' productos');
  ok('  ...y no toca ni un dato',
     g.filas('Catálogo')[1][1] === 'Tomate chonto' && g.filas('Catálogo')[1][4] === 8900);
  ok('El menú la llama al actualizar', (() => {
       const g2 = nuevo();
       g2.hojas.get('Catálogo')._formato.clear();
       g2.api.actualizarTodo();
       return fmt(g2, 'Catálogo', 1, 1).fondo === '#1B5E3A';
     })());
  ok('Una hoja que no existe no la hace reventar', (() => {
       const g2 = nuevo();
       g2.hojas.delete('Errores');
       try { g2.api.presentarHojas(); return true; } catch (e) { return false; }
     })());
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
