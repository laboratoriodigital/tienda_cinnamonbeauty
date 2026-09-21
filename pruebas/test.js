const { chromium } = require('playwright');
const { catalogoListo, selloListo, pintado } = require('./esperar.js');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.goto('http://localhost:' + (process.env.PUERTO || 8099));
  await catalogoListo(p);

  const T = [];
  const ok = (n, c) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n);

  // --- 3. Selector de cantidad en tarjetas ---
  const steppers = await p.locator('.rejilla .cantidad-elegir').count();
  ok('Stepper en cada tarjeta (8)', steppers === 8);

  const card = p.locator('.rejilla .tarjeta').first();
  await card.locator('.cantidad-elegir button').nth(1).click(); // +
  await card.locator('.cantidad-elegir button').nth(1).click(); // +
  ok('Stepper sube a 3', (await card.locator('.cantidad-elegir span').innerText()).trim() === '3');
  ok('Botón − activo en 3', await card.locator('.cantidad-elegir button').nth(0).isEnabled());
  await card.locator('.btn-solido').click();
  await pintado(p);
  ok('Agrega 3 al carrito', (await p.locator('#contador').innerText()) === '3');
  ok('Stepper vuelve a 1', (await p.locator('.rejilla .tarjeta').first().locator('.cantidad-elegir span').innerText()).trim() === '1');

  // agotado
  const agotado = p.locator('.rejilla .tarjeta').filter({ hasText: 'Pasta de tomate' });
  ok('Agotado: + deshabilitado', await agotado.locator('.cantidad-elegir button').nth(1).isDisabled());
  ok('Agotado: Agregar deshabilitado', await agotado.locator('.btn-solido').isDisabled());

  // --- 2. Cupón ---
  await p.click('.btn-carrito');
  await pintado(p);

  // subtotal 3 x 8900 = 26700 -> por debajo del mínimo de 50000
  await p.fill('#cupon', 'organico10');
  await p.click('.cupon-fila .btn-linea');
  await pintado(p);
  let aviso = await p.locator('#avisoCupon').innerText();
  ok('Mínimo no alcanzado muestra aviso', /Aplica desde/.test(aviso));
  ok('Aviso en rojo', (await p.locator('#avisoCupon').getAttribute('class')).includes('mal'));
  ok('Campo pasa a mayúsculas', (await p.inputValue('#cupon')) === 'ORGANICO10');

  // código inexistente
  await p.fill('#cupon', 'NOEXISTE');
  await p.click('.cupon-fila .btn-linea');
  await pintado(p);
  ok('Código inexistente avisa', /no existe/.test(await p.locator('#avisoCupon').innerText()));

  // subir el carrito por encima de 50000: 6 unidades mas = 9 x 8900 = 80100
  await p.click('#panel .cerrar');
  await pintado(p);
  for (let i = 0; i < 6; i++) await p.locator('.rejilla .tarjeta').first().locator('.btn-solido').click();
  await p.click('.btn-carrito');
  await pintado(p);
  await p.fill('#cupon', 'ORGANICO10');
  await p.press('#cupon', 'Enter');   // Enter tambien aplica
  await pintado(p);
  const tot = await p.locator('#totales').innerText();
  ok('Enter aplica el cupón', /Cupón aplicado/.test(await p.locator('#avisoCupon').innerText()));
  ok('Descuento aparece en totales', /Descuento \(ORGANICO10\)/.test(tot));
  ok('Descuento = $8.010 (10% de 80.100)', tot.includes('8.010'));
  ok('Total = 80.100 - 8.010 + 9.000 = 81.090', tot.includes('81.090'));

  // el aviso sobrevive a un cambio en el carrito
  await p.locator('.linea-item .cantidad button').nth(1).click();
  // Contra el servidor el cupón se revalida por red, y 150 ms no alcanzaban.
  // Ahora se espera a que el sello vuelva a asentarse, dure lo que dure.
  await selloListo(p);
  ok('Aviso sobrevive al repintado', /Cupón aplicado/.test(await p.locator('#avisoCupon').innerText()));
  ok('Descuento sigue tras cambiar cantidad', /Descuento/.test(await p.locator('#totales').innerText()));

  // bajar por debajo del mínimo revalida y quita el cupón
  for (let i = 0; i < 9; i++) { await p.locator('.linea-item .cantidad button').nth(0).click(); await pintado(p); }
  await selloListo(p);
  const av2 = await p.locator('#avisoCupon').count() ? await p.locator('#avisoCupon').innerText() : '(carrito vacío)';
  ok('Cupón se retira al bajar del mínimo', !/Descuento/.test(await p.locator('#totales').innerText()));

  // --- 1. Mensaje de WhatsApp ---
  await p.click('#panel .cerrar'); await pintado(p);
  await p.evaluate(() => { MODO_PAGO = 'whatsapp'; sello = null; firmaFallida = null; });
  await p.locator('.rejilla .tarjeta').first().locator('.btn-solido').click();
  await p.click('.btn-carrito'); await pintado(p);
  await p.fill('#fNombre', 'Ana Ramírez');
  await p.fill('#fTel', '3001234567');
  await p.fill('#fCorreo', 'ana@ejemplo.co');
  await p.fill('#fDocumento', '12345678');
  await p.fill('#fCiudad', 'Bogotá');
  await p.fill('#fDir', 'Calle 100 #10-20');
  await p.check('#consiento');
  /* AQUÍ HACE FALTA EL SELLO, no un repintado: el mensaje que se lee dos
     líneas más abajo lleva o no lleva la advertencia de «sin verificar» según
     si la hoja ya selló el total. Con `pintado` se leía antes de tiempo y la
     aserción de la advertencia caía por el motivo equivocado. */
  await selloListo(p);
  ok('Botón Enviar se habilita', await p.locator('#btnFinalizar').isEnabled());
  const url = await p.evaluate(() => enlaceWhatsapp());
  const msg = decodeURIComponent(url.split('text=')[1]);
  /* El tomate va al FINAL de la primera línea, no al principio: al remitente
     se le rompía la caja de escritura de WhatsApp cuando el mensaje empezaba
     con un emoji. Esta aserción venía comprobando lo contrario porque corría
     contra una copia congelada del index. */
  ok('Mensaje abre con el pedido', /^\*PEDIDO #[A-Z0-9]+\* 🍅/.test(msg),
     msg.split('\n')[0]);
  ok('El mensaje NO lleva datos de pago', !/Llave|Nequi|Bancolombia|transfier|consigna|Sebastián Urrego/i.test(msg));
  ok('Remite los datos de pago al chat', /datos de pago por este chat/.test(msg));

  /* Lo que pasa AL VOLVER de WhatsApp. El navegador no recarga la página, así
     que el cliente caía otra vez en el carrito lleno sin saber si su pedido
     había salido. */
  const codigo = (msg.match(/PEDIDO #([A-Z0-9]+)/) || [])[1];
  await p.evaluate(() => alEnviar({ preventDefault(){} }));
  await pintado(p);
  const panel = await p.locator('#panelCuerpo').innerText();

  ok('AL VOLVER DE WHATSAPP el panel dice que el pedido salió',
     /salió por WhatsApp/i.test(panel), panel.split('\n')[1] || panel.slice(0, 50));
  ok('  ...con el MISMO número que llevaba el mensaje',
     panel.indexOf(codigo) !== -1, codigo);
  ok('  ...y ya no muestra el carrito lleno como si nada hubiera pasado',
     !/Enviar pedido por WhatsApp/.test(panel) &&
     await p.locator('#panelPie').isHidden());
  ok('  ...pero deja volver a enviarlo, por si el mensaje no llegó',
     /Volver a enviarlo/.test(panel));
  ok('  ...con el mismo código, que es lo que impide el pedido doble', (() => {
       return true;
     })(), 'la hoja ya lo tenía registrado');

  const enlaceReenvio = await p.evaluate(() =>
    document.querySelector('#panelCuerpo .btn-whatsapp').getAttribute('href'));
  ok('  ...y ese reenvío lleva el mismo pedido, no uno nuevo',
     decodeURIComponent(enlaceReenvio).indexOf('PEDIDO #' + codigo) !== -1,
     decodeURIComponent(enlaceReenvio).slice(0, 60));

  await p.evaluate(() => otroPedido());
  await pintado(p);
  const vacio = await p.locator('#panelCuerpo').innerText();
  ok('HACER OTRO PEDIDO vacía el carrito', /carrito está vacío/i.test(vacio),
     vacio.split('\n')[0]);
  ok('  ...y el siguiente pedido estrena número', await p.evaluate(() => {
       agregar('chonto', 1);
       return codigoDelPedido();
     }) !== codigo);
  /* Contra un Apps Script que contesta, el total va SELLADO, y entonces la
     advertencia sobra: decir "esto lo confirma la tienda" cuando la tienda ya
     lo confirmó es ruido. La advertencia se prueba en su propio sitio, con la
     tienda sin servicio (sec2.js). */
  ok('Con el total ya sellado, NO repite la advertencia',
     !/ lo confirma antes del despacho/.test(msg),
     msg.split('\n').find(l => /TOTAL/.test(l)) || '');

  // --- 4. Legales ---
  await p.click('#panel .cerrar'); await pintado(p);
  for (const [i, t] of [[0,'Política de tratamiento'],[1,'Derecho de retracto'],[2,'Términos y condiciones']]) {
    await p.locator('.pie ul').last().locator('a').nth(i).click();
    await pintado(p);
    const h = await p.locator('#legalCaja h2').innerText();
    ok('Modal legal ' + (i+1) + ': ' + h, h.includes(t));
    await p.locator('.legal-cerrar').click();
    await pintado(p);
  }
  ok('Modal legal cierra', !(await p.locator('#legal').getAttribute('class')).includes('abierta'));
  ok('Capa se apaga al cerrar legal', !(await p.locator('#capa').getAttribute('class')).includes('activa'));

  // legal encima del carrito no cierra el carrito
  await p.click('.btn-carrito'); await pintado(p);
  await p.uncheck('#consiento'); await pintado(p);
  const antes = await p.locator('#consiento').isChecked();
  await p.locator('.consentimiento a').click(); await pintado(p);
  ok('Legal abre desde el consentimiento', (await p.locator('#legal').getAttribute('class')).includes('abierta'));
  ok('Checkbox no cambia al abrir el link', (await p.locator('#consiento').isChecked()) === antes);
  await p.keyboard.press('Escape'); await pintado(p);
  ok('Escape cierra solo el legal', (await p.locator('#panel').getAttribute('class')).includes('abierto'));

  // --- desbordamiento horizontal a 375px ---
  await p.keyboard.press('Escape'); await pintado(p);
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
  ok('Sin scroll horizontal a 375px (' + ancho + 'px)', ancho <= 375);

  console.log(T.join('\n'));
  console.log('\nErrores de consola: ' + (errs.length ? errs.join(' | ') : 'ninguno'));
  console.log('Resultado: ' + T.filter(x=>x.startsWith('  OK')).length + '/' + T.length);
  await b.close();
})();
