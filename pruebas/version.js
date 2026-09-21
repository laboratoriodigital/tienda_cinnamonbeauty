/* Comprueba lo que hoy pasó y nadie detectó: la tienda actualizada hablando con
   un Apps Script desplegado en una versión anterior. */
const { chromium } = require('playwright');
/* El servidor de la versión vieja, en su propio puerto. Ver todas.sh. */
const U = 'http://localhost:' + (process.env.PUERTO_VIEJO || 8098);
const { catalogoListo, selloListo } = require('./esperar.js');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const avisos = [];
  p.on('console', m => { if (m.type() === 'warning') avisos.push(m.text()); });

  await p.goto(U); await catalogoListo(p);

  ok('La tienda detecta que la versión no coincide',
     avisos.some(a => /versión/.test(a) && /Implementar/.test(a)),
     (avisos[0] || '(ningún aviso)').split('\n')[0]);

  ok('El catálogo SÍ carga igual (la tienda no se cae)',
     (await p.locator('.rejilla .tarjeta').count()) === 8,
     (await p.locator('.rejilla .tarjeta').count()) + ' productos');

  await p.evaluate(() => { agregar('chonto', 7); abrirPanel(); });
  await selloListo(p);
  ok('NO muestra el pedido como verificado',
     !/Pedido verificado/.test(await p.locator('#totales').innerText()),
     (await p.locator('#totales').innerText()).split('\n').pop());

  await p.fill('#fNombre', 'Ana Ruiz'); await p.fill('#fTel', '3001234567');
  await p.fill('#fCorreo', 'ana@ejemplo.co'); await p.fill('#fDocumento', '12345678');
  await p.fill('#fCiudad', 'Bogotá'); await p.fill('#fDir', 'Calle 1');
  await p.check('#consiento'); await selloListo(p);
  const msg = await p.evaluate(() =>
    decodeURIComponent(enlaceWhatsapp().split('text=')[1]));
  ok('El pedido sale marcado sin verificar, para que se note',
     !/Verificación:/.test(msg) && /calculado por la página/.test(msg));

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
