/* ============================================================================
   Prueba de extremo a extremo.
   Navegador real -> apps-script.gs real -> hojas. Al final se leen las hojas
   para comprobar qué quedó escrito de verdad.
   ============================================================================ */
const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, selloListo, hasta, filasEn, hojaCuando } = require('./esperar.js');
/* SE ESPERA LA CONDICIÓN, NO EL RELOJ. Esta batería dormía 50 de sus 81
   segundos. Ver esperar.js: ninguna aserción se aflojó, se dejó de dormir. */
const quieto = p => p.waitForLoadState('networkidle');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const hojas = async () => (await fetch(U + '/__hojas')).json();
const reiniciar = () => fetch(U + '/__reiniciar');
const filas = (h, n) => (h[n] || []).slice(1).filter(f => f && f.length && String(f[1] || f[0]).trim() !== '');
const celda = (h, n, f, c) => ((h[n] || [])[f] || [])[c];

async function comprar(p, { cupon, envio, notas } = {}) {
  await p.goto(U);
  await catalogoListo(p);
  await p.evaluate(() => { agregar('chonto', 6); agregar('salsa', 1); abrirPanel(); });
  await selloListo(p);
  if (envio) { await p.selectOption('#fEnvio', envio); await selloListo(p); }
  if (cupon) {
    await p.fill('#cupon', cupon);
    await p.click('.cupon-fila .btn-linea');
    await selloListo(p);
  }
  await p.fill('#fNombre', 'María Rodríguez');
  await p.fill('#fTel', '3115558899');
  await p.fill('#fCiudad', 'Bogotá');
  await p.fill('#fDir', 'Calle 100 #15-20');
  if (notas) await p.fill('#fNotas', notas);
  await p.check('#consiento');
  await selloListo(p);
  return p.evaluate(() => ({
    codigo: codigoActual,
    enlace: document.querySelector('#btnFinalizar').href,
    mensaje: decodeURIComponent((document.querySelector('#btnFinalizar').href.split('text=')[1] || '')),
    habilitado: document.querySelector('#btnFinalizar').getAttribute('aria-disabled') === 'false'
  }));
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errores.push('CONSOLA: ' + m.text()); });

  // ══════════ 1. Un pedido completo, de principio a fin ══════════
  await reiniciar();
  let r = await comprar(p, { cupon: 'ORGANICO10' });
  ok('El botón queda habilitado', r.habilitado);
  ok('El mensaje trae el número del pedido', r.mensaje.includes('PEDIDO #' + r.codigo),
     (r.mensaje.match(/PEDIDO #\w+/) || [''])[0]);
  ok('El mensaje NO repite un código de verificación aparte',
     !/Verificaci/i.test(r.mensaje), 'basta el número del pedido');
  ok('  ...y por ir sellado, tampoco lleva el aviso de "sin verificar"',
     !/calculado por la página/.test(r.mensaje));
  ok('El emoji NO abre el mensaje: en la caja de escritura no siempre resuelve',
     /^\*PEDIDO #\w+\* 🍅/.test(r.mensaje.trim()), r.mensaje.split('\n')[0]);

  await p.click('#btnFinalizar');
  let H = await filasEn(U, 'Pedidos', 2);

  ok('LA HOJA PEDIDOS RECIBE EL PEDIDO', filas(H, 'Pedidos').length === 2,
     filas(H, 'Pedidos').length + ' líneas');
  const linea = filas(H, 'Pedidos')[0];
  ok('  ...con el mismo número que el mensaje', linea[1] === r.codigo, String(linea[1]));
  /* Un pedido nace en «Nuevo». El vocabulario cambió en el Sprint 6: entre
     «me llegó» y «lo pagó» hay una espera que el comercio vive todos los días,
     y con tres estados no se veía. Lo que NO cambió es que el estado lo pone el
     maestro y no quien manda el pedido. */
  ok('  ...en estado "Nuevo"', linea[3] === 'Nuevo', String(linea[3]));
  ok('  ...con la ciudad', linea[4] === 'Bogotá', String(linea[4]));
  ok('  ...con el cupón que aplicó', linea[5] === 'ORGANICO10', String(linea[5]));
  ok('  ...con el precio que dice la HOJA, no el navegador', linea[9] === 8900, String(linea[9]));
  ok('  ...y SIN datos personales', !JSON.stringify(H['Pedidos']).includes('María') &&
     !JSON.stringify(H['Pedidos']).includes('3115558899'));

  ok('VALIDACIONES tiene UNA fila', filas(H, 'Validaciones').length === 1,
     filas(H, 'Validaciones').length + ' filas');
  ok('  ...con el mismo número', celda(H, 'Validaciones', 1, 1) === r.codigo,
     String(celda(H, 'Validaciones', 1, 1)));
  ok('  ...sin discrepancia', !celda(H, 'Validaciones', 1, 5), String(celda(H, 'Validaciones', 1, 5)));
  ok('  ...con el subtotal correcto (6×8.900 + 14.900 = 68.300)',
     celda(H, 'Validaciones', 1, 3) === 68300, String(celda(H, 'Validaciones', 1, 3)));
  ok('  ...con el descuento del 10% (6.830)',
     celda(H, 'Validaciones', 1, 6) === 6830, String(celda(H, 'Validaciones', 1, 6)));
  ok('  ...y el total con envío (68.300 − 6.830 + 9.000 = 70.470)',
     celda(H, 'Validaciones', 1, 8) === 70470, String(celda(H, 'Validaciones', 1, 8)));

  ok('Sin errores en la hoja Errores', filas(H, 'Errores').length === 0,
     JSON.stringify(filas(H, 'Errores')[0] || ''));

  // ══════════ 2. Reenviar tres veces no duplica nada ══════════
  /* Después del primer envío el panel ya no muestra "Enviar pedido": muestra
     que el pedido salió, con un botón para volver a mandarlo. Ese es el camino
     real por el que un cliente reintenta —vuelve de WhatsApp, no ve el
     mensaje, lo manda otra vez— y es el que tiene que no duplicar. */
  await p.waitForSelector('#panelCuerpo .btn-whatsapp');
  const reenviar = '#panelCuerpo .btn-whatsapp';
  ok('Tras enviar, el panel ofrece REENVIAR y ya no "Enviar pedido"',
     await p.locator(reenviar).count() === 1 &&
     await p.locator('#panelPie').isHidden());
  /* AQUI SE PRUEBA UNA AUSENCIA —que NO aparezca una tercera línea— y una
     ausencia no se puede esperar con una condición: no hay nada que llegue.
     Lo que sí se puede exigir es que no quede nada en vuelo, que es lo que
     mira `networkidle`. Si los toques hubieran disparado registros de más,
     estarían volando y esto los esperaría. */
  await p.click(reenviar); await quieto(p);
  await p.click(reenviar); await quieto(p);
  H = await hojas();
  ok('Tres toques del botón = las mismas 2 líneas', filas(H, 'Pedidos').length === 2,
     filas(H, 'Pedidos').length + ' líneas');
  ok('  ...y sigue habiendo UNA validación', filas(H, 'Validaciones').length === 1,
     filas(H, 'Validaciones').length + ' filas');

  // ══════════ 3. Cambiar el carrito muchas veces = una sola validación ══════════
  await reiniciar();
  await p.goto(U); await catalogoListo(p);
  await p.evaluate(async () => {
    agregar('chonto', 1); abrirPanel();
    for (let i = 0; i < 6; i++) { cambiarCantidad('chonto', 1); await new Promise(r => setTimeout(r, 250)); }
  });
  await selloListo(p); await quieto(p);
  H = await hojas();
  ok('Siete cambios de carrito = UNA fila en Validaciones', filas(H, 'Validaciones').length === 1,
     filas(H, 'Validaciones').length + ' filas');
  ok('  ...y guarda el último estado (7 unidades)',
     String(celda(H, 'Validaciones', 1, 9)).includes('chonto x7'), String(celda(H, 'Validaciones', 1, 9)));

  // ══════════ 4. Confirmar el pedido mueve el inventario ══════════
  await reiniciar();
  r = await comprar(p);
  await p.click('#btnFinalizar');
  H = await filasEn(U, 'Pedidos', 2);
  const stockAntes = H['Catálogo'].slice(1).find(f => f[0] === 'chonto')[5];
  ok('Stock de chonto antes de confirmar', stockAntes === 24, String(stockAntes));

  // el dueño marca Confirmado en la primera línea
  await fetch(U + '/__celda?hoja=Pedidos&f=2&c=4&v=Confirmado&disparar=1');
  H = await hojaCuando(U, h => h['Pedidos'][1][12] === 'Descontado');
  const stockDespues = H['Catálogo'].slice(1).find(f => f[0] === 'chonto')[5];
  ok('CONFIRMAR DESCUENTA EL STOCK (24 − 6 = 18)', stockDespues === 18, String(stockDespues));
  ok('  ...y marca la línea como Descontado', celda(H, 'Pedidos', 1, 12) === 'Descontado',
     String(celda(H, 'Pedidos', 1, 12)));
  ok('MÁS VENDIDOS se llena al confirmar', filas(H, 'Más vendidos').length >= 1,
     filas(H, 'Más vendidos').length + ' filas');
  ok('  ...con las unidades correctas', celda(H, 'Más vendidos', 1, 2) === 6,
     String(celda(H, 'Más vendidos', 1, 2)));

  // ══════════ 5. La tienda ve el stock nuevo ══════════
  await p.goto(U); await catalogoListo(p);
  const stockTienda = await p.evaluate(() => producto('chonto').stock);
  ok('LA TIENDA MUESTRA EL STOCK NUEVO', stockTienda === 18, String(stockTienda));

  // ══════════ 6. Anular devuelve el stock ══════════
  await fetch(U + '/__celda?hoja=Pedidos&f=2&c=4&v=Anulado&disparar=1');
  H = await hojaCuando(U, h => h['Catálogo'].slice(1).find(f => f[0] === 'chonto')[5] === 24);
  ok('ANULAR DEVUELVE EL STOCK (18 + 6 = 24)',
     H['Catálogo'].slice(1).find(f => f[0] === 'chonto')[5] === 24,
     String(H['Catálogo'].slice(1).find(f => f[0] === 'chonto')[5]));
  ok('  ...y Más vendidos queda vacía', filas(H, 'Más vendidos').length === 0,
     filas(H, 'Más vendidos').length + ' filas');

  // ══════════ 7. Precios manipulados desde la consola ══════════
  await reiniciar();
  await p.goto(U); await catalogoListo(p);
  await p.evaluate(() => {
    agregar('chonto', 3); abrirPanel();
    window.subtotal = () => 100;          // el atacante miente sobre el subtotal
  });
  await p.evaluate(() => { cuponTexto = ''; sello = null; firmaFallida = null; validarEnLaHoja(); });
  H = await filasEn(U, 'Validaciones', 1);
  ok('La hoja MARCA la discrepancia', String(celda(H, 'Validaciones', 1, 5)).includes('La página dijo'),
     String(celda(H, 'Validaciones', 1, 5)));
  ok('  ...guardando el subtotal real de la hoja', celda(H, 'Validaciones', 1, 3) === 26700,
     String(celda(H, 'Validaciones', 1, 3)));

  // ══════════ 7b. El mínimo del cupón se respeta ══════════
  await reiniciar();
  await p.goto(U); await catalogoListo(p);
  await p.evaluate(() => { agregar('chonto', 2); abrirPanel(); });   // 17.800 < 50.000
  await selloListo(p);
  await p.fill('#cupon', 'ORGANICO10'); await p.click('.cupon-fila .btn-linea');
  await selloListo(p);
  ok('Por debajo del mínimo el cupón no aplica',
     /Aplica desde \$50\.000/.test(await p.locator('#avisoCupon').innerText()),
     await p.locator('#avisoCupon').innerText());

  // ══════════ 8. Cupón inválido y cupón agotado ══════════
  await reiniciar();
  await fetch(U + '/__celda?hoja=Cupones&f=2&c=8&v=No');    // apagamos ORGANICO10
  await p.goto(U); await catalogoListo(p);
  await p.evaluate(() => { agregar('chonto', 7); abrirPanel(); });
  await selloListo(p);
  await p.fill('#cupon', 'ORGANICO10'); await p.click('.cupon-fila .btn-linea');
  await selloListo(p);
  ok('Un cupón apagado en la hoja se rechaza',
     /no existe o ya no está activo/.test(await p.locator('#avisoCupon').innerText()),
     await p.locator('#avisoCupon').innerText());
  ok('  ...y no entra ningún descuento', !/Descuento/.test(await p.locator('#totales').innerText()));

  // ══════════ 9. Si la hoja no responde, el pedido sale marcado ══════════
  await reiniciar();
  await fetch(U + '/__fallar?n=99');
  r = await comprar(p, { cupon: 'ORGANICO10' });
  ok('Sin hoja el pedido se puede enviar igual', r.habilitado);
  ok('  ...marcado como no verificado',
     !/Verificación:/.test(r.mensaje) && /calculado por la página/.test(r.mensaje));
  await fetch(U + '/__fallar?n=0');

  /* ══════════ EL TOPE POR TRANSFERENCIA ══════════
     Son 1.000 UVB y se reindexa cada diciembre, así que sale de la hoja. Lo
     que se prueba aquí es DÓNDE se entera el comprador: en el carrito, no al
     abrir WhatsApp con el pedido ya armado. */
  await fetch(U + '/__reset');
  {
    await p.goto(U);
    await catalogoListo(p);
    const tope = await p.evaluate(() => TOPE_PAGO);
    ok('EL TOPE POR TRANSFERENCIA llega desde la hoja', tope === 12110000, String(tope));

    /* PARA PASARSE DEL TOPE SE BAJA EL TOPE, no se infla el carrito. El carrito
       no puede exceder el stock —lo tapa sanear()— así que con el catálogo
       sembrado no hay forma de llegar a los doce millones. Bajar la celda a
       50.000 prueba lo mismo y de paso prueba lo que importa: que el tope sale
       DE LA HOJA y no de una constante del archivo. */
    const filaTope = await (await fetch(U + '/__hojas')).json()
      .then(h => h['Configuración'].findIndex(f => f[0] === 'pago_tope') + 1);
    await fetch(U + '/__celda?hoja=' + encodeURIComponent('Configuración') +
                '&f=' + filaTope + '&c=2&v=50000');
    await p.goto(U);
    await catalogoListo(p);
    ok('  ...y cambia cuando cambia la celda, sin tocar el código',
       (await p.evaluate(() => TOPE_PAGO)) === 50000,
       String(await p.evaluate(() => TOPE_PAGO)));

    // 6 chontos a 8.900 = 53.400, más el envío: por encima de 50.000.
    await p.evaluate(() => { agregar('chonto', 6); abrirPanel(); });
    await selloListo(p);
    await p.fill('#fNombre', 'María Rodríguez');
    await p.fill('#fTel', '3115558899');
    await p.fill('#fCiudad', 'Bogotá');
    await p.fill('#fDir', 'Calle 100 #15-20');
    await p.check('#consiento');
    await selloListo(p);
    const r = await p.evaluate(() => ({
      total: calcular().total, pasa: pasaDelTope(),
      habilitado: document.querySelector('#btnFinalizar')
        .getAttribute('aria-disabled') === 'false',
      avisoOculto: document.getElementById('faltan').hidden,
      aviso: document.getElementById('faltanTexto').textContent
    }));

    ok('  ...y un pedido por encima NO se puede enviar', r.pasa && !r.habilitado,
       'total ' + r.total + ' · botón ' + (r.habilitado ? 'activo' : 'bloqueado'));
    ok('  ...con el aviso EN EL CARRITO, no al abrir WhatsApp', !r.avisoOculto,
       r.aviso.slice(0, 70));
    ok('  ...diciendo la cifra y qué hacer',
       /50\.000/.test(r.aviso) && /dividirlo en dos pagos/.test(r.aviso),
       r.aviso.slice(0, 90));
    /* La entidad del comprador puede tener un tope más bajo que el del sistema.
       Prometerle que por debajo de esta cifra le va a pasar es prometer algo
       que no depende de nosotros. */
    ok('  ...y sin prometer lo que no depende de la tienda',
       /consulta también con tu banco/i.test(r.aviso), 'el banco del comprador manda');

    /* Al cambiar el carrito el panel se vuelve a pintar y los campos quedan en
       blanco, así que se rellenan otra vez: si no, esta comprobación diría
       «bloqueado» por el motivo equivocado y parecería que el tope sigue
       actuando cuando lo que falta es el nombre. */
    await p.evaluate(() => { quitar('chonto'); agregar('chonto', 1); });
    await selloListo(p);
    await p.fill('#fNombre', 'María Rodríguez');
    await p.fill('#fTel', '3115558899');
    await p.fill('#fCiudad', 'Bogotá');
    await p.fill('#fDir', 'Calle 100 #15-20');
    await p.check('#consiento');
    await selloListo(p);
    const bajo = await p.evaluate(() => ({
      pasa: pasaDelTope(), total: calcular().total,
      falta: queFalta(leerFormulario()).join('|'),
      habilitado: document.querySelector('#btnFinalizar')
        .getAttribute('aria-disabled') === 'false'
    }));
    ok('  ...y por debajo del tope el pedido sale como siempre',
       !bajo.pasa && bajo.habilitado,
       'pasa=' + bajo.pasa + ' habilitado=' + bajo.habilitado +
       ' total=' + bajo.total + ' falta=' + bajo.falta);
  }

  /* ══════════ UN PEDIDO PERDIDO NO SE PIERDE ══════════
     El mensaje de WhatsApp sale siempre; el registro en la hoja se intenta
     aparte. Con el maestro caído, el comprador se va con su código y en la hoja
     no hay fila: el comercio ve el chat y no ve el pedido.

     Aquí se prueba el ciclo entero contra un navegador de verdad: se tumba el
     maestro, se envía, se comprueba que quedó en la bandeja, se levanta el
     maestro, se recarga la tienda, y la fila tiene que aparecer. */
  await fetch(U + '/__reset');
  {
    await p.goto(U);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });

    await fetch(U + '/__modo?m=caido');
    const r = await comprar(p);
    await p.evaluate(() => alEnviar({ preventDefault(){} }));
    /* Antes: seis segundos a ojo «porque los reintentos son 1,5 s y 3 s». Lo
       que de verdad marca el final es que el pedido caiga en la bandeja, y eso
       lo escribe la página. Si algún día cambian los reintentos esto sigue
       valiendo; el 6000 habría quedado mintiendo. */
    await hasta(p, () => {
      try { return JSON.parse(localStorage.getItem('pendientes') || '[]').length === 1; }
      catch (e) { return true; }          // sin almacenamiento, lo dirá la aserción
    });

    const h1 = await hojas();
    ok('CON EL MAESTRO CAÍDO el pedido NO llega a la hoja',
       filas(h1, 'Pedidos').filter(f => f[1] === r.codigo).length === 0,
       'ese es el fallo que hay que rescatar, no evitar');

    const bandeja = await p.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('pendientes') || '[]'); }
      catch (e) { return 'sin almacenamiento'; }
    });
    ok('  ...pero queda en la bandeja del navegador del comprador',
       Array.isArray(bandeja) && bandeja.length === 1 && bandeja[0].c === r.codigo,
       JSON.stringify(bandeja).slice(0, 90));
    /* La bandeja lleva lo mismo que ya viajaba en el registro. El nombre, el
       celular y la dirección NUNCA viajaron por ahí: van por WhatsApp. */
    ok('  ...sin el nombre, el celular ni la dirección del comprador',
       !/Mar[íi]a|3115558899|Calle 100/.test(JSON.stringify(bandeja)),
       'guarda lo que ya mandaba el registro, y nada más');

    await fetch(U + '/__modo?m=normal');
    await p.goto(U);                       // el comprador vuelve a abrir la tienda
    /* La bandeja se vacía SOLO cuando el rescate llegó a la hoja: es la misma
       señal que mira la aserción de más abajo, y no hay otra que diga «ya». */
    await hasta(p, () => {
      try { return localStorage.getItem('pendientes') === null; } catch (e) { return true; }
    });

    const h2 = await hojas();
    const rescatado = filas(h2, 'Pedidos').filter(f => f[1] === r.codigo);
    ok('  ...y al volver a abrir la tienda, EL PEDIDO LLEGA',
       rescatado.length > 0, rescatado.length + ' línea(s) para ' + r.codigo);
    ok('  ...con los mismos productos que salieron por WhatsApp',
       rescatado.some(f => String(f[7]) === 'chonto'),
       rescatado.map(f => f[7]).join(', '));
    ok('  ...y la bandeja queda vacía, que es como se sabe que llegó',
       (await p.evaluate(() => localStorage.getItem('pendientes'))) === null,
       'si no se vacía, se reenvía para siempre');

    /* Y queda CONTADO. Que llegara no borra que estuvo perdido: hubo un rato en
       que el comercio veía el chat y no veía la fila. */
    const cont = await (await fetch(U + '/__llamar?f=rescates')).json();
    ok('  ...y queda contado como un pedido que llegó tarde',
       cont.resultado && cont.resultado.n === 1 && cont.resultado.peor >= 1, JSON.stringify(cont.resultado));

    await p.goto(U);
    await catalogoListo(p); await quieto(p);
    const cont2 = await (await fetch(U + '/__llamar?f=rescates')).json();
    ok('  ...y recargar otra vez no lo cuenta dos veces',
       cont2.resultado && cont2.resultado.n === 1, JSON.stringify(cont2.resultado));
  }

  console.log(T.join('\n'));
  console.log('\nErrores de JavaScript: ' + (errores.length ? errores.slice(0, 3).join(' | ') : 'ninguno'));
  console.log('Resultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
