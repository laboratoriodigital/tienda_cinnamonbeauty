const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const T = []; const ok = (n,c,d) => T.push((c?'  OK  ':' FALLA')+' | '+n+(d?'  -> '+d:''));
const { catalogoListo, selloListo, hasta, ventana } = require('./esperar.js');
/* 23 de sus 33 segundos eran dormir. Ver esperar.js. */
const esperar = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:375,height:812} });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (/Content Security|Refused|error/i.test(m.text())) errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));

  const abrir = async () => { await p.goto(U); await catalogoListo(p); await p.evaluate(() => { MODO_PAGO = 'whatsapp'; }); };
  const totales = () => p.locator('#totales').innerText();
  const avisoCup = () => p.locator('#avisoCupon').innerText();

  await abrir();
  ok('La CSP de producción apunta a Google, y a la propia tienda',
     /connect-src 'self' https:\/\/script\.google\.com/.test(require('fs').readFileSync('index.html','utf8')),
     "'self' es lo que deja leer catalogo.json; sin él el fetch se bloquea callado");

  // ---- 1. Cupón válido: el descuento lo pone la hoja ----
  await p.evaluate(() => { agregar('chonto', 7); abrirPanel(); });
  await selloListo(p);
  await p.fill('#cupon', 'ORGANICO10');
  await p.click('.cupon-fila .btn-linea');
  await selloListo(p);
  let t = await totales();
  ok('Descuento aplicado por la hoja', /Descuento \(ORGANICO10\)/.test(t) && t.includes('6.230'));
  ok('Total de la hoja ($65.070)', t.includes('65.070'));
  ok('Avisa que el total lo verificó la hoja', /Total verificado con la tienda/.test(t),
     t.split('\n').pop());
  ok('Aviso verde del servidor', /10% de descuento/.test(await avisoCup()));

  // ---- 2. La referencia viaja en el mensaje ----
  await p.fill('#fNombre','Ana Ramírez'); await p.fill('#fTel','3001234567');
  await p.fill('#fCorreo','ana@ejemplo.co'); await p.fill('#fDocumento','12345678');
  await p.fill('#fCiudad','Bogotá'); await p.fill('#fDir','Calle 100 #10-20');
  await p.check('#consiento'); await selloListo(p);
  const msg = await p.evaluate(() => { let u = enlaceWhatsapp();
     return decodeURIComponent(u.split('text=')[1]); });
  ok('El mensaje NO lleva un código aparte: el número del pedido ya lo identifica',
     !/Verificaci/i.test(msg) && /PEDIDO #[A-Z0-9]+/.test(msg),
     (msg.match(/PEDIDO #\w+/)||['(sin número)'])[0]);
  ok('Ya no dice "calculado por la página"', !/calculado por la página/.test(msg));

  // ---- 3. Precios manipulados: la hoja manda ----
  await abrir();
  const tramp = await p.evaluate(async () => {
    agregar('chonto', 7); abrirPanel();
    await new Promise(r => setTimeout(r, 1400));
    // el atacante intenta rebajar el subtotal que la página reporta
    const orig = window.subtotal; window.subtotal = () => 100;
    document.getElementById('cupon').value = 'ORGANICO10';
    aplicarCupon();
    await new Promise(r => setTimeout(r, 900));
    const t = calcular();
    let u = enlaceWhatsapp();
    document.getElementById('fNombre').value='Ana'; document.getElementById('fTel').value='3001234567';
    document.getElementById('fCorreo').value='ana@ejemplo.co'; document.getElementById('fDocumento').value='12345678';
    document.getElementById('fCiudad').value='Bogotá'; document.getElementById('fDir').value='Calle 100';
    document.getElementById('consiento').checked=true; revisarFormulario();
    u = enlaceWhatsapp();
    const vigente = selloVigente();          // se mide con el subtotal falseado
    window.subtotal = orig;
    return { total:t.total, descuento:t.descuento, vigente,
             msg: decodeURIComponent(u.split('text=')[1]) };
  });
  ok('Falsear el subtotal invalida el sello', tramp.vigente === false);
  ok('Y no consigue ningún descuento', tramp.descuento === 0, '$' + tramp.descuento);
  ok('El mensaje sale SIN marca de verificado', !/Pedido verificado/.test(tramp.msg));
  ok('Marcado para que lo revises a mano', /calculado por la página/.test(tramp.msg));
  const pets = await (await fetch(U + '/__peticiones')).json();
  const conSub = pets.filter(q => q.sub === '100');
  ok('La hoja recibe el subtotal falso y puede marcarlo', conSub.length > 0, 'sub reportado=100 vs real=62300');

  // ---- 4. Cupón inactivo y cupón agotado ----
  await abrir();
  await p.evaluate(() => { agregar('chonto', 7); abrirPanel(); });
  await selloListo(p);
  await fetch(U + '/__celda?hoja=Cupones&f=3&c=8&v=No');          // PRIMERA5000 apagado
  await fetch(U + '/__usar?codigo=ENVIOGRATIS');                   // ENVIOGRATIS agotado
  for (const [cod, esperado] of [['PRIMERA5000','no existe o ya no está activo'], ['ENVIOGRATIS','ya se agotó']]) {
    await p.fill('#cupon', cod); await p.click('.cupon-fila .btn-linea'); await selloListo(p);
    ok('Cupón ' + cod + ' rechazado por la hoja', new RegExp(esperado).test(await avisoCup()), await avisoCup());
    ok('  ...y sin descuento', !/Descuento/.test(await totales()));
  }

  // ---- 5. Fallo cerrado: la hoja no responde ----
  await fetch(U + '/__modo?m=caido');
  await abrir();
  await p.evaluate(() => { agregar('chonto', 7); abrirPanel(); });
  await selloListo(p);
  await p.fill('#cupon','ORGANICO10'); await p.click('.cupon-fila .btn-linea');
  await selloListo(p);                 // reintenta dos veces y se rinde: eso es asentarse
  ok('Sin red NO se aplica descuento', !/Descuento/.test(await totales()));
  ok('Invita a pedirlo por WhatsApp', /te lo aplicamos por WhatsApp/.test(await avisoCup()));
  ok('Sin sello no muestra referencia', !/Pedido verificado/.test(await totales()));

  // reintenta un número acotado de veces y despues se queda quieto
  await fetch(U + '/__modo?m=caido');
  /* UNA AUSENCIA NECESITA UNA VENTANA. Aquí se exige que NO salga ninguna
     petición más, y eso no tiene condición que esperar: hay que mirar un rato.
     Lo que sí se puede acortar es el rato, porque la página ya declaró que se
     rindió —firmaFallida— y a partir de ahí no programa ningún reintento. */
  await selloListo(p);
  await ventana(p, 1500, 'hay que comprobar que NO sale ninguna petición más');
  const reintentos = (await (await fetch(U + '/__peticiones')).json()).length;
  ok('No reintenta en bucle', reintentos === 0, reintentos + ' peticiones tras rendirse');

  // el pedido sigue siendo enviable, marcado como no validado
  await p.fill('#fNombre','Ana'); await p.fill('#fTel','3001234567');
  await p.fill('#fCorreo','ana@ejemplo.co'); await p.fill('#fDocumento','12345678');
  await p.fill('#fCiudad','Bogotá'); await p.fill('#fDir','Calle 100');
  await p.check('#consiento'); await selloListo(p);
  ok('Se puede enviar igual (no perdemos la venta)', await p.locator('#btnFinalizar').isEnabled());
  const msg2 = await p.evaluate(() => { let u = enlaceWhatsapp();
     return decodeURIComponent(u.split('text=')[1]); });
  ok('Mensaje marcado como no validado', /calculado por la página/.test(msg2) && !/Validación:/.test(msg2));

  // ---- 6. Botón bloqueado mientras valida ----
  await fetch(U + '/__modo?m=lento');
  /* NO se espera al catálogo aquí: en modo lento tarda nueve segundos a
     propósito, y lo que esta sección mira es la pantalla MIENTRAS la hoja
     tarda. Basta con que la tienda esté pintada, que es lo que ve el cliente
     desde el primer instante —el catálogo de respaldo—. */
  await p.goto(U);
  await hasta(p, () => document.querySelectorAll('.rejilla .tarjeta').length > 0);
  await p.evaluate(() => { agregar('chonto', 2); abrirPanel(); });
  /* MODO LENTO A PROPÓSITO: lo que se mira es la pantalla MIENTRAS valida, así
     que se espera a que esté validando, no a que termine. */
  await hasta(p, () => validando === true);
  await p.fill('#fNombre','Ana'); await p.fill('#fTel','3001234567');
  await p.fill('#fCorreo','ana@ejemplo.co'); await p.fill('#fDocumento','12345678');
  await p.fill('#fCiudad','Bogotá'); await p.fill('#fDir','Calle 100');
  await p.check('#consiento');
  await hasta(p, () => document.getElementById('btnFinalizar')
                         .getAttribute('aria-disabled') === 'false');
  ok('Deja enviar aunque esté validando', await p.locator('#btnFinalizar').isEnabled());
  ok('Y lo dice en pantalla', /Validando tu pedido/.test(await totales()));

  // ---- 7. Debounce ----
  await fetch(U + '/__modo?m=ok');
  await abrir();
  await p.evaluate(async () => {
    agregar('chonto',1); abrirPanel();
    for (let i=0;i<8;i++){ cambiarCantidad('chonto',1); await new Promise(r=>setTimeout(r,60)); }
  });
  await selloListo(p); await p.waitForLoadState('networkidle');
  const nPets = (await (await fetch(U + '/__peticiones')).json()).length;
  ok('9 cambios rápidos -> pocas peticiones', nPets <= 2, nPets + ' peticiones');

  // ---- 8. El foco no se pierde al llegar la respuesta ----
  await abrir();
  await p.evaluate(() => { agregar('chonto',2); abrirPanel(); });
  await selloListo(p);
  await p.click('#fDir'); await p.type('#fDir', 'Calle 100 #');
  await p.evaluate(() => { cambiarCantidad('chonto',1); });   // dispara validación
  await selloListo(p);
  const foco = await p.evaluate(() => ({ id: document.activeElement.id, val: document.getElementById('fDir').value }));
  ok('El cursor sigue en la dirección', foco.id === 'fDir', 'foco=' + foco.id);
  ok('Y no se perdió lo escrito', foco.val === 'Calle 100 #', foco.val);

  console.log(T.join('\n'));
  console.log('\nErrores/CSP: ' + (errs.length ? errs.slice(0,3).join(' | ') : 'ninguno'));
  console.log('Resultado: ' + T.filter(x=>x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
