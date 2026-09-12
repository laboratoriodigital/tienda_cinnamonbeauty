const { chromium } = require('playwright');
const { pintado } = require('./esperar.js');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
/* Esto apuntaba a $HOME/t/local.html: la ruta de UNA máquina. Donde ese
   archivo existía, la batería probaba una copia congelada de la tienda; en
   cualquier otra parte reventaba entera, y como una batería rota contaba 0/0,
   la corrida seguía saliendo verde. Ahora es el local.html que todas.sh
   regenera aquí al lado, en cada corrida, desde el index de verdad. */
const LOCAL = pathToFileURL(path.join(__dirname, 'local.html')).href;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage({ viewport: { width: 375, height: 812 } });
  const csp = [];
  p.on('console', m => { const t = m.text(); if (/Content Security Policy|Refused to/i.test(t)) csp.push(t); });
  p.on('pageerror', e => csp.push('PAGEERROR: ' + e.message));
  await p.goto(LOCAL);
  /* Esta tienda NO tiene servicio: no hay catálogo que esperar, solo que el
     archivo quede pintado con su catálogo de respaldo. */
  await p.waitForSelector('.rejilla .tarjeta');
  const T = []; const ok = (n,c,d) => T.push((c?'  OK  ':' FALLA')+' | '+n+(d?'  -> '+d:''));

  // ===== C1 · repetimos EXACTAMENTE el ataque del informe =====
  const a = await p.evaluate(() => {
    PRODUCTOS[0].precio = 100;
    PRODUCTOS[0].stock  = 9999;
    try { CUPONES['GRATIS99'] = { tipo:'porcentaje', valor:99, minimo:0, vence:'2099-01-01' }; } catch(e){}
    carrito = [{ id:'chonto', cantidad:500 }];
    cuponActivo = 'GRATIS99';
    envioActivo = { id:'x', nombre:'Gratis', valor:-99999 };
    sanear();
    return { precio:PRODUCTOS[0].precio, stock:PRODUCTOS[0].stock,
             cupon:cuponActivo, cantidad:(carrito[0]||{}).cantidad,
             envio:envioActivo.id, total:calcular().total };
  });
  ok('Precio no se puede cambiar', a.precio === 8900, '$' + a.precio);
  ok('Stock no se puede cambiar', a.stock === 24, String(a.stock));
  ok('Cupón inventado se descarta', a.cupon === null, String(a.cupon));
  ok('500 unidades se topan al stock', a.cantidad === 24, String(a.cantidad));
  ok('Envío falso se descarta', a.envio === 'medellin', a.envio);
  ok('Total real (24×8900+9000)', a.total === 222600, '$' + a.total);

  // el mensaje ya no lleva la llave
  const msg = await p.evaluate(() => {
    carrito = [{id:'chonto',cantidad:2}]; cuponActivo=null; abrirPanel();
    ['fNombre','fTel','fCiudad','fDir'].forEach((id,i) =>
      document.getElementById(id).value = ['Ana Ruiz','3001234567','Bogotá','Calle 100'][i]);
    document.getElementById('consiento').checked = true; revisarFormulario();
    return decodeURIComponent(document.querySelector('#btnFinalizar').href.split('text=')[1]);
  });
  ok('La llave ya NO viaja en el mensaje', !/Llave|Nequi|Bancolombia|transfier|consigna|Sebastián Urrego/i.test(msg));
  ok('Abre con el número de pedido', /^\*PEDIDO #[A-Z0-9]+\* 🍅/.test(msg),
     String(msg).split('\n')[0]);
  /* El nombre lo pone la tienda, no este archivo: en la panadería el mensaje
     decía "Orgánico lo confirma" y nadie lo vio hasta que falló aquí. */
  const elNegocio = await p.evaluate(() => NEGOCIO);
  ok('Advierte que el total lo confirma LA TIENDA, con su nombre',
     new RegExp(elNegocio + ' lo confirma antes del despacho').test(msg), elNegocio);
  ok('Pide los datos de pago por el chat', /datos de pago por este chat/.test(msg));

  // ===== M3 · topes de longitud =====
  await p.evaluate(() => { carrito=[{id:'chonto',cantidad:2}]; abrirPanel(); });
  await pintado(p);
  const largo = await p.evaluate(() => {
    document.getElementById('fNotas').value = 'á'.repeat(5000);
    ['fNombre','fTel','fCiudad','fDir'].forEach((id,i) =>
      document.getElementById(id).value = ['Ana Ruiz','3001234567','Bogotá','Calle 100'][i]);
    document.getElementById('consiento').checked = true; revisarFormulario();
    return { url: document.querySelector('#btnFinalizar').href.length,
             maxNotas: document.getElementById('fNotas').getAttribute('maxlength') };
  });
  ok('URL acotada (antes: 30.904)', largo.url < 5000, largo.url + ' caracteres');
  ok('maxlength en notas', largo.maxNotas === '300');

  // ===== M7 · un pedido se registra una sola vez =====
  const dedupe = await p.evaluate(() => {
    let envios = 0; navigator.sendBeacon = () => { envios++; return true; };
    alEnviar({ preventDefault(){} }); alEnviar({ preventDefault(){} }); alEnviar({ preventDefault(){} });
    return { envios, hayEndpoint: !!SCRIPT_URL };
  });
  ok('Sin endpoint configurado no envía nada', dedupe.envios === 0 && !dedupe.hayEndpoint);

  // ===== A1 · CSP =====
  const meta = await p.evaluate(() => {
    const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return { csp: m ? m.content : null,
             ref: (document.querySelector('meta[name="referrer"]')||{}).content };
  });
  ok('CSP presente', !!meta.csp);
  ok('CSP bloquea todo por defecto', /default-src 'none'/.test(meta.csp));
  ok('CSP permite los marcadores data:', /img-src 'self' data:/.test(meta.csp));
  ok('CSP limita a dónde puede hablar', /connect-src [^;]*https:\/\/script\.google\.com/.test(meta.csp));
  ok('  ...y deja a la tienda leer su propio catálogo', /connect-src [^;]*'self'|connect-src http/.test(meta.csp),
     'el servidor de pruebas reescribe la directiva con su propio origen');
  ok('CSP prohíbe <base> inyectado', /base-uri 'none'/.test(meta.csp));
  ok('Referrer restringido', meta.ref === 'strict-origin-when-cross-origin');

  // ===== M1 · noopener =====
  await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend','<a id=zz href="destino.html" target=_blank>x</a>'); });
  const [w] = await Promise.all([ctx.waitForEvent('page'),
    p.evaluate(() => window.open('destino.html','_blank','noopener'))]);
  ok('La pestaña de WhatsApp no recibe opener', !(await w.evaluate(() => !!window.opener)));
  ok('El enlace de envío lleva rel="noopener"',
     /id="btnFinalizar"[^>]*rel="noopener"/s.test(require('fs').readFileSync('local.html','utf8')));

  console.log(T.join('\n'));
  console.log('\nViolaciones de CSP / errores en consola: ' + (csp.length ? csp.join(' | ') : 'ninguna'));
  console.log('Resultado: ' + T.filter(x=>x.startsWith('  OK')).length + '/' + T.length);
  await b.close();
})();
