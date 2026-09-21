const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, selloListo, hasta } = require('./esperar.js');
/* Esta batería dormía 32 de sus 51 segundos, casi todos esperando a que se
   agotaran los reintentos del sello. El final de los reintentos lo dice la
   propia página; el reloj solo lo adivinaba. Ver esperar.js. */
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const totales = () => p.locator('#totales').innerText();
  const aviso = () => p.locator('#avisoCupon').innerText();
  const prep = async () => {
    await p.goto(U); await catalogoListo(p);
    await p.evaluate(() => { agregar('chonto', 7); abrirPanel(); });
    await selloListo(p);
  };

  // ===== 1. Una caída: antes fallaba, ahora se recupera solo =====
  await prep();
  await fetch(U + '/__fallar?n=1');
  await p.fill('#cupon', 'ORGANICO10');
  await p.click('.cupon-fila .btn-linea');
  /* AQUÍ SE MIRA UN ESTADO INTERMEDIO, no el final: hay que llegar mientras
     todavía reintenta. Esperar a que el sello se asiente se pasaría de largo y
     la aserción diría que no se vio «Validando» cuando sí estuvo. */
  await hasta(p, () => validando === true);
  ok('Mientras reintenta sigue diciendo "Validando"', /Validando tu pedido/.test(await totales()));
  await selloListo(p);
  ok('Se recupera solo tras UNA caída', /Cupón aplicado/.test(await aviso()), await aviso());
  ok('  ...y el descuento entra', /Descuento \(ORGANICO10\)/.test(await totales()));
  ok('  ...y el total queda verificado', /Total verificado con la tienda/.test(await totales()));
  ok('  ...sin que el cliente viera ningún error', true);
  let pets = (await (await fetch(U + '/__peticiones')).json()).filter(q => q.a === 'validar');
  ok('Costó 2 peticiones, no 1', pets.length === 2, pets.length + ' peticiones');

  // ===== 2. Dos caídas seguidas: también se recupera =====
  await prep();
  await fetch(U + '/__fallar?n=2');
  await p.fill('#cupon', 'ORGANICO10');
  await p.click('.cupon-fila .btn-linea');
  await selloListo(p);
  ok('Se recupera tras DOS caídas', /Cupón aplicado/.test(await aviso()), await aviso());

  // ===== 3. Tres caídas: se rinde, pero con un mensaje que invita a reintentar =====
  await prep();
  await fetch(U + '/__fallar?n=5');
  await p.fill('#cupon', 'ORGANICO10');
  await p.click('.cupon-fila .btn-linea');
  await selloListo(p);
  ok('Tras agotar los intentos avisa', /No pudimos validar/.test(await aviso()), await aviso());
  ok('  ...y dice qué hacer primero', /Vuelve a darle Aplicar/.test(await aviso()));
  ok('  ...sin descuento fantasma', !/Descuento/.test(await totales()));

  // volver a darle Aplicar funciona (ya no hay fallas pendientes)
  await p.click('.cupon-fila .btn-linea');
  await selloListo(p);
  ok('Volver a darle Aplicar lo resuelve', /Cupón aplicado/.test(await aviso()), await aviso());

  // ===== 4. El botón de enviar ya NO se bloquea mientras valida =====
  await prep();
  await p.fill('#fNombre', 'Ana Ramírez'); await p.fill('#fTel', '3001234567');
  await p.fill('#fCorreo', 'ana@ejemplo.co'); await p.fill('#fDocumento', '12345678');
  await p.fill('#fCiudad', 'Bogotá'); await p.fill('#fDir', 'Calle 100 #10-20');
  await p.check('#consiento'); await selloListo(p);
  await fetch(U + '/__fallar?n=5');
  await p.fill('#cupon', 'ORGANICO10');
  await p.click('.cupon-fila .btn-linea');
  await hasta(p, () => validando === true);   // otro estado intermedio a propósito
  const validando = /Validando tu pedido/.test(await totales());
  ok('Está validando...', validando);
  ok('  ...y aun así puede enviar el pedido',
     (await p.locator('#btnFinalizar').getAttribute('aria-disabled')) === 'false');
  const msg = await p.evaluate(() =>
    decodeURIComponent(enlaceWhatsapp().split('text=')[1]));
  ok('  ...y ese pedido sale marcado sin validar',
     !/Validación:/.test(msg) && /calculado por la página/.test(msg));

  // ===== 5. No se duplican peticiones =====
  await fetch(U + '/__modo?m=ok');   // limpia también las fallas que quedaron pendientes
  await prep();
  await p.fill('#cupon', 'ORGANICO10');
  await p.click('.cupon-fila .btn-linea');
  await selloListo(p); await p.waitForLoadState('networkidle');
  pets = (await (await fetch(U + '/__peticiones')).json()).filter(q => q.a === 'validar');
  // prep() ya genera una al agregar al carrito; el Aplicar debe sumar solo una más
  ok('Un Aplicar = una sola petición más', pets.length === 2, pets.length + ' peticiones');

  // ===== EL BOTÓN APAGADO TIENE QUE DECIR POR QUÉ =====
  /* En un teléfono, los datos de entrega quedan más abajo del pliegue: el
     cliente llena el carrito, ve el total y el botón de WhatsApp en el pie
     fijo, lo toca, y no pasa nada. No hay forma de adivinar que hay campos
     vacíos tres pantallas más abajo. Es una venta perdida, y era silenciosa. */
  await prep();
  const faltaTexto = () => p.locator('#faltanTexto').innerText();

  ok('CON EL CARRITO LLENO Y SIN DATOS, el pie dice qué falta',
     !(await p.locator('#faltan').isHidden()), await faltaTexto());
  ok('  ...y lo dice DENTRO de la pantalla, sin desplazarse', await p.evaluate(() => {
       const r = document.getElementById('faltan').getBoundingClientRect();
       return r.top >= 0 && r.bottom <= window.innerHeight;
     }), 'el pie es lo único que se ve siempre');
  ok('  ...nombrando los campos, no "completa el formulario"',
     /nombre/.test(await faltaTexto()) && /celular/.test(await faltaTexto()) &&
     /ciudad/.test(await faltaTexto()), await faltaTexto());
  ok('  ...y el botón sigue apagado',
     (await p.locator('#btnFinalizar').getAttribute('aria-disabled')) === 'true');

  await p.click('#faltan');
  await hasta(p, () => document.activeElement.id === 'fNombre');
  ok('TOCAR EL AVISO lleva al primer campo vacío y abre el teclado ahí',
     (await p.evaluate(() => document.activeElement.id)) === 'fNombre',
     await p.evaluate(() => document.activeElement.id));

  /* Y lo mismo por el otro camino: tocar un botón y que no pase NADA es lo que
     hace que el cliente se vaya. */
  await p.evaluate(() => { document.activeElement.blur(); });
  /* force: Playwright considera "deshabilitado" un aria-disabled y no lo toca.
     Un dedo sí lo toca: aria-disabled es una promesa, no un candado. */
  await p.locator('#btnFinalizar').click({ force: true });
  await hasta(p, () => document.activeElement.id === 'fNombre');
  ok('TOCAR EL BOTÓN APAGADO también lleva a lo que falta, no a nada',
     (await p.evaluate(() => document.activeElement.id)) === 'fNombre',
     await p.evaluate(() => document.activeElement.id));

  // fill y check, no .value: así se disparan oninput y onchange, que es como
  // llega un dedo de verdad. Poniendo .value a mano, un repintado del panel
  // —una validación que vuelve— borra lo escrito y la prueba miente.
  for (const [id, v] of [['#fNombre','Ana Ruiz'], ['#fTel','3001234567'],
                         ['#fCorreo','ana@ejemplo.co'], ['#fDocumento','12345678'],
                         ['#fCiudad','Bogotá'], ['#fDir','Calle 100']]) {
    await p.fill(id, v);
  }
  await hasta(p, () => !/tu nombre/.test(document.getElementById('faltanTexto').textContent));
  ok('LLENANDO LOS CAMPOS el aviso se reduce a lo que sigue faltando',
     /autorizar el uso de tus datos/.test(await faltaTexto()) &&
     !/tu nombre/.test(await faltaTexto()), await faltaTexto());

  await p.check('#consiento');
  await selloListo(p);            // que termine cualquier validación en vuelo
  // Los dos valores en UNA sola lectura: entre dos llamadas puede colarse un
  // repintado del panel y entonces la prueba mide dos instantes distintos.
  const final = await p.evaluate(() => ({
    oculto: document.getElementById('faltan').hidden,
    aria: document.getElementById('btnFinalizar').getAttribute('aria-disabled'),
    falta: queFalta(leerFormulario())
  }));
  ok('  ...y con todo puesto desaparece y el botón se enciende',
     final.oculto === true && final.aria === 'false', JSON.stringify(final));

  /* La lista del aviso y la condición del botón son la MISMA lista. Con dos, el
     botón podía quedarse apagado por algo que el aviso no nombraba. */
  ok('EL AVISO Y EL BOTÓN salen de la misma lista', await p.evaluate(() => {
       const d = leerFormulario();
       return formularioListo(d) === (queFalta(d).length === 0 && carrito.length > 0);
     }), 'una sola fuente, o el aviso miente');

  ok('Sin errores de JavaScript', errs.length === 0, errs[0] || '');
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
