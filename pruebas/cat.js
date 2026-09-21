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
    document.getElementById('fCorreo').value='ana@ejemplo.co'; document.getElementById('fDocumento').value='12345678';
    document.getElementById('fCiudad').value='Bogotá'; document.getElementById('fDir').value='Calle 100';
    document.getElementById('consiento').checked = true; revisarFormulario();
    let u = enlaceWhatsapp();
    return decodeURIComponent(u.split('text=')[1]);
  });
  ok('El mensaje sale marcado sin validar', !/Validación:/.test(msg) && /calculado por la página/.test(msg));

  /* ===== 4. Sin red: se queda con el respaldo del archivo =====
     ESTO PEDÍA `caido`, Y `caido` DEJA EL CATÁLOGO VIVO. Solo tumba el registro
     y la validación. Así que esta sección abría una tienda con el catálogo de
     la hoja llegando con normalidad, leía ocho productos —que son los de la
     hoja emulada— y daba por probado el respaldo. Contestaba lo mismo con el
     respaldo puesto y con el respaldo roto: no era una comprobación.
     No se vio nunca porque el archivo traía justo ocho productos, los mismos
     ocho. El día que el montaje empezó a escribir el catálogo de cada comercio
     —4.20— los dos números dejaron de coincidir y la aserción habló.
     `muerto` es el que tumba también el catálogo. */
  await fetch(U + '/__modo?m=muerto');
  await abrir();
  /* LO QUE SE ESPERA SALE DEL PROPIO ARCHIVO. Decía 8 productos y $8.900 a
     pelo, y eso era dar por hecha la primera tienda: desde el 4.20 el montaje
     escribe en cada index.html el catálogo de SU comercio, así que un número
     quemado aquí es una tienda que no se puede montar (patrón 4). */
  const resp = await p.evaluate(() => {
    const uno = PRODUCTOS[0];
    return { n: VISIBLES.length, delArchivo: PRODUCTOS.length,
             precio: producto(uno.id) ? producto(uno.id).precio : null,
             suyo: uno.precio, id: uno.id,
             ultimo: !!producto(PRODUCTOS[PRODUCTOS.length - 1].id) };
  });
  ok('Sin hoja usa el catálogo de respaldo',
     resp.n === resp.delArchivo && resp.precio === resp.suyo && resp.ultimo,
     resp.n + ' productos · ' + resp.id + ' a $' + resp.precio);
  ok('La tienda sigue funcionando', (await p.locator('.rejilla .tarjeta').count()) > 0);

  await fetch(U + '/__modo?m=ok');
  console.log(T.join('\n'));
  console.log('\nErrores/CSP: ' + (errs.length ? errs.slice(0,2).join(' | ') : 'ninguno'));
  console.log('Resultado: ' + T.filter(x=>x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
