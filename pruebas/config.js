/* Comprueba que la tienda es genérica: cambiando SOLO la pestaña Configuración
   de la hoja, la misma index.html se convierte en otro negocio. */
const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, selloListo, pintado } = require('./esperar.js');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const cfg = async (clave, valor) => {
  const H = await (await fetch(U + '/__hojas')).json();
  const fila = H['Configuración'].findIndex(f => f[0] === clave);
  if (fila < 1) throw new Error('no existe la clave ' + clave);
  await fetch(U + '/__celda?hoja=Configuraci%C3%B3n&f=' + (fila + 1) + '&c=2&v=' + encodeURIComponent(valor));
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));

  await fetch(U + '/__reset');

  // ═══ 1. Con la configuración de fábrica ═══
  await p.goto(U); await catalogoListo(p);
  /* Contra el comercio de prueba, no contra una marca escrita aquí: lo que
     se comprueba es que el valor viene DE LA HOJA, y eso vale para
     cualquier tienda. */
  const { COMERCIO } = require('./gas.js');
  ok('La hoja trae configuración',
     (await p.evaluate(() => NEGOCIO)) === COMERCIO.negocio,
     await p.evaluate(() => NEGOCIO));
  ok('El titular sale de la hoja',
     (await p.locator('#portadaTitulo').innerText()) === COMERCIO.portada_titulo);

  const icono = await p.evaluate(() => {
    const l = document.querySelector('link[rel="icon"]');
    return l ? decodeURIComponent(l.getAttribute('href')) : '';
  });
  ok('La pestaña del navegador muestra un tomate',
     /^data:image\/svg\+xml,<svg/.test(icono) && /circle/.test(icono),
     icono.slice(0, 46));
  ok('  ...dibujado dentro del propio archivo, sin pedir nada al servidor',
     icono.indexOf('http') === -1 || icono.indexOf('http') > 30,
     'no hay petición extra');
  /* LOS COLORES DE LA MARCA, NO LOS DE ORGÁNICO.
     Esta aserción exigía `#D0211C` y `#1B5E3A` a pelo. Pasaba desde siempre
     porque la única tienda montada usaba los colores de fábrica — y se puso
     roja el primer día que un comercio eligió los suyos, que es justo el día
     en que TODO funcionó bien. El flujo `montaje` corre las baterías sobre el
     index.html que acaba de escribir CON LA CONFIGURACIÓN DE ESA TIENDA, así
     que cualquier cosa quemada aquí es una tienda que no se puede montar.
     Es el patrón 4 de la bitácora: una prueba que solo sabe ver la primera
     tienda no prueba el producto.

     Lo que sí vale en cualquier tienda: el icono y el `theme-color` salen los
     dos de `color_principal`, así que TIENEN QUE COINCIDIR. Eso comprueba que
     el color de la hoja llegó al archivo, sea el que sea. */
  const tema = await p.evaluate(() => {
    const m = document.querySelector('meta[name="theme-color"]');
    return m ? m.getAttribute('content') : '';
  });
  const delIcono = (icono.match(/fill='(#[0-9A-Fa-f]{6})'/) || [])[1] || '';
  ok('  ...con los colores de ESTA tienda, no con los de la primera',
     /^#[0-9A-Fa-f]{6}$/.test(tema) && delIcono.toUpperCase() === tema.toUpperCase(),
     'icono ' + (delIcono || '(ninguno)') + ' · theme-color ' + (tema || '(ninguno)'));
  ok('  ...y el segundo color también es un color de verdad',
     /stroke='(#[0-9A-Fa-f]{6})'/.test(icono),
     'si no es un hex de seis dígitos, la página lo tira sin avisar');
  ok('  ...y también para la pantalla de inicio del celular',
     await p.evaluate(() => !!document.querySelector('link[rel="apple-touch-icon"]')));

  // ═══ 2. Cambiamos el negocio ENTERO desde la hoja ═══
  await cfg('negocio', 'Panadería La Espiga');
  await cfg('whatsapp', '573001112233');
  await cfg('portada_titulo', 'Pan de verdad, todos los días.');
  await cfg('portada_texto', 'Masa madre y horno de leña. Amasamos de madrugada.');
  await cfg('portada_puntos', 'Horneado hoy|Domicilio en la ciudad|Pides por WhatsApp');
  await cfg('color_principal', '#7A4A21');
  await cfg('color_secundario', '#2F5D3A');
  await cfg('pie_descripcion', 'Panadería artesanal. Envigado, Antioquia.');
  await cfg('como_compras', 'Escoges tu pan|Confirmas por WhatsApp|Pagas contra entrega');
  await cfg('empresa_ciudad', 'Envigado, Antioquia');
  await cfg('empresa_tel', '300 111 2233');
  await cfg('empresa_razon', 'La Espiga S.A.S.');
  await cfg('empresa_nit', '901.234.567-8');
  await cfg('empresa_correo', 'datos@laespiga.co');

  await p.goto(U); await catalogoListo(p);

  ok('CAMBIA EL NOMBRE en la barra', (await p.locator('#marcaNombre').innerText()) === 'Panadería La Espiga',
     await p.locator('#marcaNombre').innerText());
  ok('  ...y en el pie', (await p.locator('#pieNombre').innerText()) === 'Panadería La Espiga');
  ok('CAMBIA EL TITULAR', (await p.locator('#portadaTitulo').innerText()) === 'Pan de verdad, todos los días.',
     await p.locator('#portadaTitulo').innerText());
  ok('  ...y el párrafo', /masa madre/i.test(await p.locator('#portadaTexto').innerText()));

  const puntos = await p.evaluate(() => [...document.querySelectorAll('#portadaDatos span')].map(s => s.textContent.trim()));
  ok('CAMBIAN las tres leyendas del banner',
     puntos.length === 3 && puntos[0] === 'Horneado hoy' && puntos[2] === 'Pides por WhatsApp',
     puntos.join(' · '));

  const pasos = await p.evaluate(() => [...document.querySelectorAll('#comoCompras li')].map(s => s.textContent.trim()));
  ok('CAMBIA "Cómo compras"', pasos.length === 3 && pasos[2] === 'Pagas contra entrega', pasos.join(' · '));

  const colores = await p.evaluate(() => ({
    rojo: getComputedStyle(document.documentElement).getPropertyValue('--rojo').trim(),
    verde: getComputedStyle(document.documentElement).getPropertyValue('--verde').trim(),
    portada: getComputedStyle(document.querySelector('.portada')).backgroundColor
  }));
  ok('CAMBIAN LOS COLORES de marca', colores.rojo === '#7A4A21' && colores.verde === '#2F5D3A',
     colores.rojo + ' / ' + colores.verde);
  ok('  ...y la portada se repinta de verdad', colores.portada === 'rgb(122, 74, 33)', colores.portada);

  ok('CAMBIA el WhatsApp del botón flotante',
     (await p.locator('#flotante').getAttribute('href')).includes('573001112233'),
     (await p.locator('#flotante').getAttribute('href')).slice(0, 40));

  // ═══ 3. Los datos legales también salen de la hoja ═══
  await p.evaluate(() => abrirLegal('terminos'));
  await pintado(p);
  const legal = await p.locator('#legalCaja').innerText();
  ok('LOS TEXTOS LEGALES usan los datos de la hoja',
     legal.includes('La Espiga S.A.S.') && legal.includes('901.234.567-8'),
     (legal.match(/Quien vende es [^.]*/) || [''])[0]);
  ok('  ...y el correo de contacto', legal.includes('datos@laespiga.co'));
  ok('  ...y la ciudad', legal.includes('Envigado, Antioquia'));
  await p.evaluate(() => cerrarLegal());

  // ═══ 4. El pedido usa el WhatsApp nuevo ═══
  await p.evaluate(() => { agregar('chonto', 2); abrirPanel(); });
  await selloListo(p);
  await p.fill('#fNombre', 'Ana Ruiz'); await p.fill('#fTel', '3001234567');
  await p.fill('#fCiudad', 'Envigado'); await p.fill('#fDir', 'Calle 1');
  await p.check('#consiento'); await selloListo(p);
  const enlace = await p.evaluate(() => document.querySelector('#btnFinalizar').href);
  ok('EL PEDIDO va al WhatsApp nuevo', enlace.includes('wa.me/573001112233'), enlace.slice(0, 45));
  ok('  ...y el mensaje lleva el nombre nuevo',
     decodeURIComponent(enlace.split('text=')[1]).includes('Panadería La Espiga'));

  // ═══ 5. Sin hoja, el respaldo del archivo sostiene la tienda ═══
  await fetch(U + '/__modo?m=muerto');   // ni siquiera responde el catálogo
  await p.goto(U); await catalogoListo(p);
  ok('Sin hoja usa el respaldo y no se rompe',
     (await p.locator('#marcaNombre').innerText()) === 'Orgánico' &&
     (await p.locator('.rejilla .tarjeta').count()) === 8,
     await p.locator('#marcaNombre').innerText());
  ok('  ...y el WhatsApp de respaldo sigue siendo válido',
     (await p.locator('#flotante').getAttribute('href')).includes('573008610480'));
  await fetch(U + '/__modo?m=ok');

  ok('Sin errores de JavaScript', errores.length === 0, errores[0] || '');
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
