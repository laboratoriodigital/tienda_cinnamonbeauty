/* La vitrina no necesita una cuenta Bold real para probar la experiencia. Se
   intercepta SOLO el POST/GET de pago; catálogo y validación siguen atendidos
   por el Apps Script emulado. */
const { chromium } = require('playwright');
const { catalogoListo, selloListo, pintado } = require('./esperar.js');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
  await p.addInitScript(() => {
    const original = window.fetch.bind(window);
    window.__estadoBoldPrueba = 'PROCESSING';
    window.__postPagos = 0;
    window.__fallarBold = true;
    window.BoldCheckout = class {
      constructor(config){ this.config = config; }
      open(){
        if(window.__fallarBold) throw new Error('falla simulada al abrir Bold');
        window.__boldAbierto = this.config;
      }
    };
    window.fetch = (url, opciones) => {
      const texto = String(url), metodo = String((opciones || {}).method || 'GET').toUpperCase();
      if (/\/exec$/.test(texto) && metodo === 'POST') {
        window.__postPagos++;
        return Promise.resolve(new Response(JSON.stringify({
        ok: true, pedido: 'ORD-UI-PRUEBA', token: 'pg-ui-prueba', total: 26800, moneda: 'COP', estado: 'PENDING',
        checkout: { kind:'BOLD_BUTTON', orderId:'ORD-UI-PRUEBA', currency:'COP', amount:'26800',
          apiKey:'identidad-publica', integritySignature:'firma', description:'Pedido ORD-UI-PRUEBA',
          redirectionUrl:'https://tienda.ejemplo/?pago-token=pg-ui-prueba',
          originUrl:'https://tienda.ejemplo/?pago-token=pg-ui-prueba&pago-abandonado=1',
          customerData:{email:'ana@ejemplo.co'}, billingAddress:{city:'Medellín'} }
        }), { headers: { 'Content-Type': 'application/json' } }));
      }
      if (/\/exec\?a=pago_estado/.test(texto)) return Promise.resolve(new Response(JSON.stringify({
        ok: true, pedido: 'ORD-UI-PRUEBA', estado: window.__estadoBoldPrueba,
        total: 26800, moneda: 'COP', transaccion: 'trx-ui-prueba'
      }), { headers: { 'Content-Type': 'application/json' } }));
      return original(url, opciones);
    };
  });
  await p.goto(U); await catalogoListo(p);
  await p.evaluate(() => { agregar(PRODUCTOS[0].id, 2); abrirPanel(); });
  await selloListo(p);
  await p.fill('#fNombre', 'Ana Ruiz'); await p.fill('#fTel', '3001234567');
  await p.fill('#fCorreo', 'ana@ejemplo.co'); await p.fill('#fDocumento', '12345678');
  await p.fill('#fCiudad', 'Medellín'); await p.fill('#fDir', 'Calle 10');
  await p.check('#consiento'); await selloListo(p);
  await p.click('#btnFinalizar'); await pintado(p);
  await p.waitForFunction(() => /No pudimos abrir el pago/.test(document.querySelector('#panelCuerpo').innerText));
  await p.evaluate(() => { window.__fallarBold = false; });
  await p.click('#panelCuerpo .btn-whatsapp');
  await p.waitForFunction(() => !!window.__boldAbierto);
  const abierto = await p.evaluate(() => window.__boldAbierto);
  ok('Abre el checkout personalizado de Bold', abierto.orderId === 'ORD-UI-PRUEBA' && abierto.amount === '26800');
  ok('Reintentar la apertura reutiliza el pago pendiente', await p.evaluate(() => window.__postPagos) === 1);
  ok('Conserva el retorno antes de salir de la tienda', await p.evaluate(() => sessionStorage.getItem('pago-bold-activo').includes('ORD-UI-PRUEBA')));

  await p.goto(U + '/?pago-token=pg-ui-prueba&bold-order-id=ORD-UI-PRUEBA&bold-tx-status=approved');
  await p.waitForFunction(() => /Estamos confirmando tu pago/.test(document.querySelector('#panelCuerpo').innerText));
  ok('El retorno abre la confirmación y limpia los parámetros de Bold',
     await p.evaluate(() => !location.search) && /ORD-UI-PRUEBA/.test(await p.locator('#panelCuerpo').innerText()));

  await p.evaluate(() => { window.__estadoBoldPrueba = 'PAID'; consultarPago(true); });
  await p.waitForFunction(() => /Pago confirmado/.test(document.querySelector('#panelCuerpo').innerText));
  const panelPago = await p.locator('#panelCuerpo').innerText();
  const enlace = await p.locator('#panelCuerpo .btn-whatsapp').getAttribute('href');
  ok('La aprobación muestra confirmación, no el carrito', /Pago confirmado/.test(panelPago) && !/Datos de entrega/.test(panelPago));
  ok('El aviso manual a comercio queda prellenado', /wa\.me\//.test(enlace || '') && decodeURIComponent(enlace || '').includes('ORD-UI-PRUEBA'));
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
