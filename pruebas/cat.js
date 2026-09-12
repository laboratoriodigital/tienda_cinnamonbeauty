const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, selloListo } = require('./esperar.js');
const T = []; const ok = (n,c,d) => T.push((c?'  OK  ':' FALLA')+' | '+n+(d?'  -> '+d:''));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:375,height:812} });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (/Content Security|Refused/i.test(m.text())) errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  const totales = () => p.locator('#totales').innerText();
  const abrir = async () => { await p.goto(U); await catalogoListo(p); };

  await fetch(U + '/__reset');

  // ===== 1. La hoja gobierna el catálogo =====
  await abrir();
  let vis = await p.evaluate(() => VISIBLES.map(x => x.id + '@' + x.precio));
  ok('La tienda muestra los 8 productos de la hoja', vis.length === 8, vis.join(' '));
  // apagamos el sofrito EN LA HOJA (fila 6, columna Activo) y debe desaparecer
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=6&c=10&v=No');
  await abrir();
  ok('Un producto con Activo=No desaparece de la tienda',
     !(await p.locator('#rejilla').innerText()).includes('Sofrito'),
     (await p.evaluate(() => VISIBLES.length)) + ' productos visibles');
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=6&c=10&v=S%C3%AD');
  ok('Las tarifas también salen de la hoja',
     (await p.evaluate(() => TARIFAS.map(e => e.id).join(','))) === 'finca,medellin,oriente,principal,resto',
     await p.evaluate(() => TARIFAS.map(e => e.id).join(',')));

  // ===== 2. EL CASO A DE ANTES: la hoja sube el precio =====
  await fetch(U + '/__drift');       // chonto -> 9500, cherry desactivado
  await abrir();
  vis = await p.evaluate(() => VISIBLES.map(x => x.id + '@' + x.precio));
  ok('CASO A: el precio nuevo llega a la tarjeta', vis.includes('chonto@9500'), vis.join(' '));
  ok('CASO B: el producto desactivado desaparece de la tienda', !vis.some(v => v.startsWith('cherry')), vis.join(' '));

  await p.evaluate(() => { agregar('chonto', 7); abrirPanel(); });
  await selloListo(p);
  const linea = (await p.locator('.linea-item').innerText()).replace(/\n+/g,' ');
  const tot = await totales();
  ok('La línea del carrito usa el precio de la hoja', /9\.500 c\/u/.test(linea), linea.slice(0,60));
  ok('Y el subtotal cuadra con la línea (7×9.500)', tot.includes('66.500') && linea.includes('66.500'));
  ok('El sello queda vigente', /Total verificado con la tienda/.test(tot), tot.split('\n').pop());

  // ===== 3. Red de seguridad: precios cambian con la página abierta =====
  await fetch(U + '/__reset');       // la hoja vuelve a 8.900 mientras el cliente mira
  await p.evaluate(() => { cambiarCantidad('chonto', 1); });   // fuerza revalidación
  await selloListo(p);
  const tot2 = await totales();
  const sub2 = await p.evaluate(() => ({ pagina: subtotal(), sello: sello && sello.sub, vigente: selloVigente() }));
  ok('Detecta que el sello ya no cuadra', sub2.pagina !== sub2.sello && !sub2.vigente,
     'página=' + sub2.pagina + ' hoja=' + sub2.sello);
  ok('NO muestra "verificado" con números que no cuadran', !/Pedido verificado/.test(tot2));
  ok('Avisa que está confirmando precios', /confirmando los precios/.test(tot2));
  ok('El subtotal mostrado es el del carrito, coherente',
     tot2.includes('76.000'), tot2.split('\n').slice(0,2).join(' '));

  const msg = await p.evaluate(() => {
    document.getElementById('fNombre').value='Ana'; document.getElementById('fTel').value='3001234567';
    document.getElementById('fCiudad').value='Bogotá'; document.getElementById('fDir').value='Calle 100';
    document.getElementById('consiento').checked = true; revisarFormulario();
    let u = document.querySelector('#btnFinalizar').href; 
    return decodeURIComponent(u.split('text=')[1]);
  });
  ok('El mensaje sale marcado sin validar', !/Validación:/.test(msg) && /calculado por la página/.test(msg));

  // ===== 4. Sin red: se queda con el respaldo del archivo =====
  await fetch(U + '/__modo?m=caido');
  await abrir();
  const resp = await p.evaluate(() => ({ n: VISIBLES.length, precio: producto('chonto').precio,
                                          sofrito: !!producto('sofrito') }));
  ok('Sin hoja usa el catálogo de respaldo', resp.n === 8 && resp.precio === 8900 && resp.sofrito,
     resp.n + ' productos');
  ok('La tienda sigue funcionando', (await p.locator('.rejilla .tarjeta').count()) === 8);

  await fetch(U + '/__modo?m=ok');
  console.log(T.join('\n'));
  console.log('\nErrores/CSP: ' + (errs.length ? errs.slice(0,2).join(' | ') : 'ninguno'));
  console.log('Resultado: ' + T.filter(x=>x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
