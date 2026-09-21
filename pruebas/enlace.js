/* ============================================================================
   Enlace por producto:  .../?p=chonto
   ----------------------------------------------------------------------------
   Lo que tiene que pasar sí o sí:
   - Abrir el enlace muestra ESA ficha, aunque el catálogo de la hoja llegue
     tarde o no llegue.
   - Compartir entrega un enlace que de verdad abre el producto.
   - Atrás en el celular cierra la ficha, no saca de la tienda.
   - Un producto que ya no existe se avisa, no se queda en silencio.
   ============================================================================ */
const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const { catalogoListo, selloListo, hasta } = require('./esperar.js');
/* 27 de sus 36 segundos eran dormir. Ver esperar.js. */
const abierta = p => p.evaluate(() => document.querySelector('#ficha').classList.contains('abierta'));
const titulo  = p => p.evaluate(() => { const h = document.querySelector('#fichaCaja h2'); return h ? h.textContent : ''; });

(async () => {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 375, height: 812 },
                                           permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));

  await fetch(U + '/__reset');

  // ═══ 1. Entrar directo al enlace de un producto ═══
  await p.goto(U + '/?p=chonto'); await catalogoListo(p);
  ok('ENTRAR A ?p=chonto abre la ficha sola', await abierta(p));
  ok('  ...y es la del producto correcto', /chonto/i.test(await titulo(p)), await titulo(p));
  ok('  ...con el precio de la HOJA, no el del archivo',
     /8\.900/.test(await p.locator('#fichaCaja .ficha-precio').innerText()),
     await p.locator('#fichaCaja .ficha-precio').innerText());
  ok('  ...y detrás la tienda quedó pintada igual',
     (await p.locator('.rejilla .tarjeta').count()) === 8,
     (await p.locator('.rejilla .tarjeta').count()) + ' productos');

  // ═══ 2. Cerrarla limpia la dirección ═══
  await p.evaluate(() => cerrarTodo()); await hasta(p, () => !document.querySelector('#ficha').classList.contains('abierta'));
  ok('Cerrar la ficha borra el ?p= de la dirección',
     !(await p.evaluate(() => location.search)), await p.evaluate(() => location.search));
  ok('  ...y no se sale de la tienda', (await p.locator('.rejilla .tarjeta').count()) === 8);

  // ═══ 3. Abrir una ficha desde la tienda pone el enlace en la barra ═══
  await p.goto(U); await catalogoListo(p);
  ok('Sin ?p= la tienda abre normal, sin ficha', !(await abierta(p)));
  await p.evaluate(() => abrirFicha('salsa')); await hasta(p, () => document.querySelector('#ficha').classList.contains('abierta'));
  ok('ABRIR UNA FICHA pone ?p=salsa en la dirección',
     (await p.evaluate(() => location.search)) === '?p=salsa',
     await p.evaluate(() => location.search));
  ok('  ...para que se pueda copiar de la barra del navegador',
     /\?p=salsa$/.test(await p.evaluate(() => location.href)), await p.evaluate(() => location.href));

  // ═══ 4. ATRÁS cierra la ficha, no saca de la tienda ═══
  await p.goBack(); await hasta(p, () => !document.querySelector('#ficha').classList.contains('abierta'));
  ok('ATRÁS cierra la ficha', !(await abierta(p)));
  ok('  ...y sigue en la tienda, no en la página anterior',
     (await p.locator('.rejilla .tarjeta').count()) === 8,
     await p.evaluate(() => location.pathname));
  ok('  ...con la dirección limpia', !(await p.evaluate(() => location.search)));

  // ═══ 5. ADELANTE la vuelve a abrir ═══
  await p.goForward(); await hasta(p, () => document.querySelector('#ficha').classList.contains('abierta'));
  ok('ADELANTE vuelve a abrir la misma ficha',
     (await abierta(p)) && /salsa/i.test(await titulo(p)), await titulo(p));

  // ═══ 6. Compartir ═══
  await p.evaluate(() => { navigator.share = undefined; });   // forzamos la ruta de copiar
  await p.evaluate(() => compartirProducto());
  await hasta(p, () => document.querySelector('#brindis').classList.contains('visible'));
  const copiado = await p.evaluate(() => navigator.clipboard.readText());
  ok('COMPARTIR copia un enlace con el producto', /\?p=salsa$/.test(copiado), copiado);
  ok('  ...y avisa que quedó copiado',
     /copiado/i.test(await p.locator('#brindis').innerText()),
     await p.locator('#brindis').innerText());
  ok('  ...el aviso se ve de verdad',
     await p.evaluate(() => document.querySelector('#brindis').classList.contains('visible')));

  // El enlace copiado tiene que funcionar de verdad, no solo verse bien.
  await p.goto(copiado); await catalogoListo(p);
  ok('EL ENLACE COPIADO abre esa ficha al pegarlo',
     (await abierta(p)) && /salsa/i.test(await titulo(p)), await titulo(p));

  // ═══ 7. El botón está donde el cliente lo va a buscar ═══
  const boton = p.locator('#fichaCaja .ficha-compartir');
  ok('El botón de compartir está visible en la ficha', await boton.isVisible());
  const caja = await boton.boundingBox();
  ok('  ...y es cómodo de tocar en el celular', caja && caja.height >= 40 && caja.width > 200,
     caja ? Math.round(caja.width) + 'x' + Math.round(caja.height) : 'sin caja');
  ok('  ...dice qué hace', /compartir/i.test(await boton.innerText()), await boton.innerText());

  // ═══ 8. Un producto que ya no está ═══
  await p.goto(U + '/?p=noexiste'); await catalogoListo(p);
  ok('Un enlace a un producto que no existe NO abre ficha vacía', !(await abierta(p)));
  ok('  ...avisa por qué',
     /ya no está en la tienda/i.test(await p.locator('#brindis').innerText()),
     await p.locator('#brindis').innerText());
  ok('  ...deja la tienda usable', (await p.locator('.rejilla .tarjeta').count()) === 8);
  ok('  ...y limpia la dirección para que no se siga compartiendo roto',
     !(await p.evaluate(() => location.search)), await p.evaluate(() => location.search));

  // ═══ 9. Un producto apagado en la hoja (Activo = No) ═══
  const H = await (await fetch(U + '/__hojas')).json();
  const fCherry = H['Catálogo'].findIndex(f => f[0] === 'cherry');
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=' + (fCherry + 1) + '&c=10&v=No');
  await p.goto(U + '/?p=cherry'); await catalogoListo(p);
  ok('Un producto apagado en la hoja tampoco abre',
     !(await abierta(p)), await titulo(p));
  ok('  ...y se avisa igual',
     /ya no está en la tienda/i.test(await p.locator('#brindis').innerText()),
     await p.locator('#brindis').innerText());
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=' + (fCherry + 1) + '&c=10&v=S%C3%AD');

  // ═══ 10. La hoja no responde: el enlace debe funcionar con el respaldo ═══
  await fetch(U + '/__modo?m=muerto');
  /* CUÁL PRODUCTO, LO DICE EL ARCHIVO. Sin hoja lo único que queda es el
     catálogo de respaldo, y desde el 4.20 ese es el de la tienda que se esté
     montando: escribir `chonto` aquí ataba esta batería a Orgánico. */
  await p.goto(U); await catalogoListo(p);
  const delRespaldo = await p.evaluate(() => ({ id: PRODUCTOS[0].id,
                                                nombre: PRODUCTOS[0].nombre }));
  await p.goto(U + '/?p=' + encodeURIComponent(delRespaldo.id)); await catalogoListo(p);
  ok('SIN HOJA el enlace igual abre la ficha (catálogo de respaldo)',
     (await abierta(p)) &&
     (await titulo(p)).trim().toLowerCase() === delRespaldo.nombre.trim().toLowerCase(),
     await titulo(p));
  ok('  ...y se puede comprar desde ahí',
     await p.locator('#fichaCaja .ficha-agregar .btn-solido').isEnabled());
  await fetch(U + '/__modo?m=ok');

  // ═══ 11. La hoja tarda: primero abre con el respaldo y luego se corrige sola ═══
  await fetch(U + '/__reset'); await fetch(U + '/__demora?ms=2000');
  /* ESTADO INTERMEDIO A PROPÓSITO: la ficha tiene que estar abierta ANTES de
     que conteste la hoja. Por eso se espera a que se abra, y NO a que el
     catálogo se resuelva: esperar el final se pasaría por encima de lo que se
     quiere ver. */
  await p.goto(U + '/?p=chonto');
  await hasta(p, () => document.querySelector('#ficha').classList.contains('abierta'));
  ok('Mientras la hoja responde, la ficha YA está abierta', await abierta(p));
  await fetch(U + '/__demora?ms=0');
  await catalogoListo(p);
  ok('  ...y sigue abierta cuando llega el catálogo de la hoja',
     (await abierta(p)) && /chonto/i.test(await titulo(p)), await titulo(p));

  // ═══ 12. Agregar al carrito desde un enlace ═══
  await p.goto(U + '/?p=chonto'); await catalogoListo(p);
  await p.click('#fichaCaja .ficha-agregar .btn-solido'); await selloListo(p);
  ok('AGREGAR desde la ficha del enlace mete el producto al carrito',
     (await p.evaluate(() => carrito.length)) === 1,
     JSON.stringify(await p.evaluate(() => carrito)));
  ok('  ...cierra la ficha', !(await abierta(p)));
  ok('  ...y limpia la dirección', !(await p.evaluate(() => location.search)),
     await p.evaluate(() => location.search));

  // ═══ 13. El enlace no rompe nada de lo que ya andaba ═══
  await p.goto(U + '/?p=chonto'); await catalogoListo(p);
  await p.evaluate(() => cerrarTodo());
  await p.evaluate(() => { MODO_PAGO = 'whatsapp'; agregar('chonto', 2); abrirPanel(); });
  await selloListo(p);
  await p.fill('#fNombre', 'Ana Ruiz'); await p.fill('#fTel', '3001234567');
  await p.fill('#fCorreo', 'ana@ejemplo.co'); await p.fill('#fDocumento', '12345678');
  await p.fill('#fCiudad', 'Medellín'); await p.fill('#fDir', 'Calle 1');
  await p.check('#consiento'); await selloListo(p);
  const href = await p.evaluate(() => enlaceWhatsapp());
  ok('El pedido sigue saliendo bien después de entrar por un enlace',
     /wa\.me\//.test(href) && /chonto|Tomate/i.test(decodeURIComponent(href)),
     href.slice(0, 40));
  ok('  ...y va sellado por la hoja (sin el aviso de "sin verificar")',
     !/calculado por la página/.test(decodeURIComponent(href.split('text=')[1] || '')),
     decodeURIComponent(href.split('text=')[1] || '').split('\n').pop());

  // ═══ 14. Escapes y basura en el parámetro ═══
  for (const veneno of ['<img src=x onerror=alert(1)>', '"><script>alert(1)</script>', "' OR 1=1"]) {
    await p.goto(U + '/?p=' + encodeURIComponent(veneno)); await catalogoListo(p);
    const roto = await p.evaluate(() => !!document.querySelector('#rejilla script'));
    ok('Basura en ?p= no rompe ni inyecta: ' + veneno.slice(0, 22),
       !roto && !(await abierta(p)) && (await p.locator('.rejilla .tarjeta').count()) === 8);
  }

  ok('Sin errores de JavaScript en toda la prueba', errores.length === 0, errores[0] || '');

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await navegador.close(); process.exit(0);
})();
