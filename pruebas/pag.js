const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, pintado } = require('./esperar.js');
/* Paginar, filtrar y buscar no salen a la red: `refrescar()` corre en el acto
   y lo único que faltaba era dejar pintar. Ver esperar.js. */
const T = []; const ok = (n,c,d) => T.push((c?'  OK  ':' FALLA')+' | '+n+(d?'  -> '+d:''));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:375,height:812} });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const cards = () => p.locator('.rejilla .tarjeta').count();
  const conteo = () => p.locator('.paginacion .conteo').innerText();
  const donde  = () => p.locator('.paginacion .donde').innerText();

  await p.goto(U); await catalogoListo(p);

  ok('Muestra 25 por defecto', (await cards()) === 25, (await cards()) + ' tarjetas');
  ok('Dice cuántos hay', (await conteo()) === 'Mostrando 1–25 de 137 productos', await conteo());
  ok('Página 1 de 6', (await donde()) === 'Página 1 de 6', await donde());
  ok('"Anterior" deshabilitado en la primera', await p.locator('.paginas .btn').first().isDisabled());

  await p.locator('.paginas .btn').last().click(); await pintado(p);
  ok('Siguiente lleva a la página 2', (await donde()) === 'Página 2 de 6');
  ok('  ...con el rango correcto', (await conteo()) === 'Mostrando 26–50 de 137 productos', await conteo());
  ok('  ...y hace scroll a la rejilla', (await p.evaluate(() => window.scrollY)) > 100);

  for (let i=0;i<4;i++){ await p.locator('.paginas .btn').last().click(); await pintado(p); }
  ok('Última página', (await donde()) === 'Página 6 de 6');
  ok('  ...muestra solo el resto (12)', (await cards()) === 12, (await cards()) + ' tarjetas');
  ok('  ...rango final correcto', (await conteo()) === 'Mostrando 126–137 de 137 productos', await conteo());
  ok('"Siguiente" deshabilitado al final', await p.locator('.paginas .btn').last().isDisabled());

  await p.locator('.por-pagina .chip').nth(1).click(); await pintado(p);
  ok('Cambiar a 50 conserva dónde estabas', (await donde()) === 'Página 3 de 3', await donde());
  ok('  ...y muestra 37 en la última', (await cards()) === 37, (await cards()) + ' tarjetas');
  ok('  ...con el 50 marcado', (await p.locator('.por-pagina .chip').nth(1).getAttribute('aria-pressed')) === 'true');

  await p.locator('.por-pagina .chip').nth(2).click(); await pintado(p);
  ok('Cambiar a 100', (await donde()) === 'Página 2 de 2' && (await cards()) === 37, await donde());

  await p.locator('.por-pagina .chip').nth(0).click(); await pintado(p);
  await p.locator('.paginas .btn').last().click(); await pintado(p);
  await p.locator('#filtros .chip').nth(1).click(); await pintado(p);
  ok('Filtrar vuelve a la página 1', (await donde()).startsWith('Página 1'), await donde());
  ok('  ...y cuenta solo esa categoría', /de 35 productos/.test(await conteo()), await conteo());

  await p.locator('#filtros .chip').nth(0).click(); await pintado(p);
  await p.locator('.paginas .btn').last().click(); await pintado(p);
  await p.fill('#buscar', 'Producto 1'); await pintado(p);
  ok('Buscar vuelve a la página 1', (await donde()).startsWith('Página 1'), await donde());

  await p.fill('#buscar', 'zzzz'); await pintado(p);
  ok('Sin resultados oculta la paginación', await p.locator('#paginacion').isHidden());
  ok('  ...y muestra el mensaje vacío', (await p.locator('.vacio').count()) === 1);

  await p.fill('#buscar', 'Producto 13'); await pintado(p);
  ok('Con pocos resultados no hay paginación', await p.locator('#paginacion').isHidden(),
     (await cards()) + ' resultados');

  await fetch(U + '/__reset');
  /* SE ESPERA AL CATÁLOGO, NO AL PINTADO. `pintado()` vuelve en cuanto la
     página dibuja algo — y lo primero que dibuja es el catálogo de respaldo del
     archivo. Mientras ese respaldo tuvo los mismos ocho productos que la hoja
     emulada, esperar de más o de menos daba igual y esta aserción pasaba sin
     mirar nada. Desde el 4.20 el respaldo es el catálogo de verdad del
     comercio, y entonces se vio: estaba midiendo la paginación del archivo, no
     la de la hoja. */
  await p.goto(U); await catalogoListo(p); await pintado(p);
  ok('Con 4 productos la paginación no existe', await p.locator('#paginacion').isHidden(),
     (await cards()) + ' productos');

  await fetch(U + '/__muchos');
  await p.goto(U); await pintado(p);
  ok('Sin scroll horizontal a 375px', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 375);
  ok('Sin errores de JavaScript', errs.length === 0, errs[0] || '');

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x=>x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
