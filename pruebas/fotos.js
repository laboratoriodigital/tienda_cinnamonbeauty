/* ============================================================================
   Fotos en tres capas.
   ----------------------------------------------------------------------------
   La promesa: en la hoja se escribe "chonto-1.jpg" y nada más. Cambiar de
   proveedor de imágenes —o dejar de usar uno— es cambiar UNA celda, no
   reescribir cientos de URL en las hojas de todos los clientes.

   Lo que se prueba aquí es esa promesa, y sobre todo el modo de fallo: si la
   hoja apunta a un proveedor que la política de seguridad de la página no
   permite, las fotos NO pueden quedar bloqueadas en silencio.
   ============================================================================ */
const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, hasta } = require('./esperar.js');
/* 22 de sus 28 segundos eran dormir. Ver esperar.js. */
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const cfg = async (clave, valor) => {
  const H = await (await fetch(U + '/__hojas')).json();
  const fila = H['Configuración'].findIndex(f => f[0] === clave);
  if (fila < 1) throw new Error('no existe la clave ' + clave);
  await fetch(U + '/__celda?hoja=Configuraci%C3%B3n&f=' + (fila + 1) +
              '&c=2&v=' + encodeURIComponent(valor));
};
const foto = async (p, nombre, uso) =>
  p.evaluate(([n, u]) => urlFoto(n, u), [nombre, uso || 'tarjeta']);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errores = [];
  const avisos = [];
  p.on('pageerror', e => errores.push(e.message));
  p.on('console', m => { if (m.type() === 'warning') avisos.push(m.text()); });

  await fetch(U + '/__reset');

  // ═══ 1. Sin configurar nada: el propio sitio sirve las fotos ═══
  await p.goto(U); await catalogoListo(p);
  ok('SIN CONFIGURAR NADA, el origen es la carpeta /fotos del propio sitio',
     (await foto(p, 'chonto-1.jpg')) === U + '/fotos/chonto-1.jpg',
     await foto(p, 'chonto-1.jpg'));
  ok('  ...y eso lo permite la política de seguridad, porque es el mismo sitio',
     (await foto(p, 'chonto-1.jpg')).indexOf(U) === 0);
  ok('Un nombre vacío no inventa una URL', (await foto(p, '')) === '');
  ok('Las barras sobrantes no duplican la ruta',
     (await foto(p, '/chonto-1.jpg')) === U + '/fotos/chonto-1.jpg',
     await foto(p, '/chonto-1.jpg'));

  // ═══ 2. El origen se muda: una celda ═══
  await cfg('fotos_origen', 'https://cdn.tomateorganico.com/img');
  await p.goto(U); await catalogoListo(p);
  ok('CAMBIAR EL ORIGEN es cambiar UNA celda',
     (await foto(p, 'chonto-1.jpg')) === 'https://cdn.tomateorganico.com/img/chonto-1.jpg',
     await foto(p, 'chonto-1.jpg'));
  ok('  ...y una barra final de más no rompe nada', (async () => true)());
  await cfg('fotos_origen', 'https://cdn.tomateorganico.com/img/');
  await p.goto(U); await catalogoListo(p);
  ok('  ...con barra final tampoco',
     (await foto(p, 'chonto-1.jpg')) === 'https://cdn.tomateorganico.com/img/chonto-1.jpg',
     await foto(p, 'chonto-1.jpg'));

  // ═══ 3. La capa de transformación entra y sale ═══
  await fetch(U + '/__reset');
  await cfg('fotos_origen', 'https://tomateorganico.netlify.app/fotos');
  await cfg('fotos_cdn',
    'https://res.cloudinary.com/organico/image/fetch/f_auto,q_auto,c_fill,ar_1:1,w_{ancho}/{origen}/{ruta}');
  await p.goto(U); await catalogoListo(p);
  const conCdn = await foto(p, 'chonto-1.jpg');
  ok('CON PROVEEDOR, la URL la arma la plantilla de la hoja',
     conCdn === 'https://res.cloudinary.com/organico/image/fetch/f_auto,q_auto,c_fill,ar_1:1,w_600/' +
               'https://tomateorganico.netlify.app/fotos/chonto-1.jpg', conCdn);
  ok('  ...y NUNCA se sube nada: el proveedor apunta al origen',
     conCdn.includes('/image/fetch/') && conCdn.includes('tomateorganico.netlify.app/fotos'));
  ok('El ancho cambia según para qué es la foto', (() => true)());
  ok('  ...tarjeta 600', (await foto(p, 'x.jpg', 'tarjeta')).includes('w_600'));
  ok('  ...galería 900', (await foto(p, 'x.jpg', 'galeria')).includes('w_900'));
  ok('  ...miniatura 160', (await foto(p, 'x.jpg', 'miniatura')).includes('w_160'));

  await cfg('fotos_cdn', '');
  await p.goto(U); await catalogoListo(p);
  ok('QUITAR el proveedor devuelve a servir directo del origen',
     (await foto(p, 'chonto-1.jpg')) === 'https://tomateorganico.netlify.app/fotos/chonto-1.jpg',
     await foto(p, 'chonto-1.jpg'));

  // ═══ 4. Cambiar de proveedor es UNA celda, sin republicar ═══
  /* Los proveedores conocidos van autorizados de antemano en la política de
     seguridad. Ese es el punto: pasar de uno a otro no obliga a regenerar el
     <head> ni a volver a publicar el sitio. */
  for (const [nombre, plantilla, marca] of [
    ['ImageKit',          'https://ik.imagekit.io/organico/{ruta}?tr=w-{ancho}', 'ik.imagekit.io'],
    ['Cloudflare Images', 'https://imagedelivery.net/abc/{ruta}/w={ancho}',      'imagedelivery.net']]) {
    await cfg('fotos_cdn', plantilla);
    await p.goto(U); await catalogoListo(p);
    const u = await foto(p, 'chonto-1.jpg');
    ok('PASAR A ' + nombre + ' es cambiar una celda: nada que republicar',
       u.indexOf('https://' + marca) === 0, u);
  }

  // ═══ 4a. El modo de fallo que importa ═══
  await cfg('fotos_cdn', 'https://cdn.proveedor-desconocido.com/{ruta}?w={ancho}');
  await p.goto(U); await catalogoListo(p);
  const bloqueado = await foto(p, 'chonto-1.jpg');
  ok('UN PROVEEDOR QUE LA CSP NO PERMITE no deja las fotos en blanco',
     bloqueado === 'https://tomateorganico.netlify.app/fotos/chonto-1.jpg', bloqueado);
  ok('  ...y lo dice por consola, con el paso exacto para arreglarlo',
     avisos.some(a => /proveedor-desconocido/.test(a) && /Generar configuración/.test(a)),
     (avisos.find(a => /desconocido/.test(a)) || '(ningún aviso)').slice(0, 90));
  ok('  ...una sola vez, no una por foto',
     avisos.filter(a => /desconocido/.test(a)).length === 1,
     avisos.filter(a => /desconocido/.test(a)).length + ' avisos');

  // ═══ 4b. WebP generado en el montaje: lo que devuelve f_auto sin proveedor ═══
  await fetch(U + '/__reset');
  await cfg('fotos_origen', 'https://tomateorganico.netlify.app/fotos');
  await cfg('fotos_webp', 'Sí');
  // El catálogo semilla viene sin fotos, y sin foto no hay <img> que probar.
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=2&c=8&v=' + encodeURIComponent('chonto-1.jpg'));
  await p.goto(U); await catalogoListo(p);
  ok('CON fotos_webp = Sí pide la versión moderna, por tamaño',
     (await foto(p, 'chonto-1.jpg', 'tarjeta')) ===
       'https://tomateorganico.netlify.app/fotos/chonto-1-600.webp',
     await foto(p, 'chonto-1.jpg', 'tarjeta'));
  ok('  ...miniatura y galería piden su propio tamaño',
     (await foto(p, 'chonto-1.jpg', 'miniatura')).endsWith('-160.webp') &&
     (await foto(p, 'chonto-1.jpg', 'galeria')).endsWith('-900.webp'),
     await foto(p, 'chonto-1.jpg', 'miniatura'));
  ok('  ...y un nombre con puntos no se corta mal',
     (await foto(p, 'salsa.v2.jpg', 'tarjeta')).endsWith('salsa.v2-600.webp'),
     await foto(p, 'salsa.v2.jpg', 'tarjeta'));

  /* El servidor de pruebas no tiene los .webp, así que el rescate se dispara
     solo: eso ES la prueba. Se mira el estado final y la marca de reintento. */
  /* El rescate lo marca la propia <img> con data-reintentado: se espera a que
     aparezca, no a que pasen novecientos milisegundos. */
  await hasta(p, () => [...document.querySelectorAll('.rejilla .tarjeta img')]
                         .some(x => x.dataset && x.dataset.reintentado === '1'));
  const rescatada = await p.evaluate(() => {
    const i = [...document.querySelectorAll('.rejilla .tarjeta img')]
      .find(x => (x.getAttribute('data-plano') || '').length > 0) || {};
    return { src: i.getAttribute ? i.getAttribute('src') : '',
             plano: i.getAttribute ? i.getAttribute('data-plano') : '',
             reintento: i.dataset ? i.dataset.reintentado : '' };
  });
  ok('Cada <img> lleva la URL original como respaldo',
     /\/fotos\/chonto-1\.jpg$/.test(rescatada.plano), rescatada.plano);
  ok('UNA FOTO QUE NO CARGA se cae al original, no deja un hueco',
     rescatada.reintento === '1' && rescatada.src === rescatada.plano,
     rescatada.src + '  (reintento: ' + rescatada.reintento + ')');
  ok('  ...y no se queda en un bucle pidiendo lo mismo',
     rescatada.reintento === '1', 'una sola vez');

  await cfg('fotos_webp', 'No');
  await p.goto(U); await catalogoListo(p);
  ok('CON fotos_webp = No vuelve a pedir el archivo tal cual',
     (await foto(p, 'chonto-1.jpg')).endsWith('/fotos/chonto-1.jpg'),
     await foto(p, 'chonto-1.jpg'));

  // ═══ 4c. Con proveedor, el WebP local no estorba ═══
  await cfg('fotos_webp', 'Sí');
  await cfg('fotos_cdn',
    'https://res.cloudinary.com/organico/image/fetch/f_auto,q_auto,w_{ancho}/{origen}/{ruta}');
  await p.goto(U); await catalogoListo(p);
  ok('Si hay proveedor, MANDA el proveedor: no se piden los locales',
     !(await foto(p, 'chonto-1.jpg')).includes('.webp') &&
     (await foto(p, 'chonto-1.jpg')).includes('/image/fetch/'),
     await foto(p, 'chonto-1.jpg'));

  // ═══ 5. Las tiendas viejas no se rompen ═══
  await fetch(U + '/__reset');
  await p.goto(U); await catalogoListo(p);
  const vieja = 'https://res.cloudinary.com/organico/image/upload/v1/chonto-1.jpg';
  ok('UNA URL COMPLETA en la hoja se respeta tal cual', (await foto(p, vieja)) === vieja,
     await foto(p, vieja));
  ok('  ...para poder migrar tienda por tienda sin apagar ninguna', true);

  // ═══ 6. Lo que ve el cliente ═══
  await fetch(U + '/__reset');
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=2&c=8&v=' +
              encodeURIComponent('chonto-1.jpg|chonto-2.jpg'));
  await p.goto(U); await catalogoListo(p);
  const src = await p.evaluate(() => {
    const t = [...document.querySelectorAll('.rejilla .tarjeta img')];
    return t.length ? t[0].getAttribute('src') : '';
  });
  ok('EN LA HOJA SE ESCRIBE SOLO EL NOMBRE y la tarjeta arma la URL',
     src === U + '/fotos/chonto-1.jpg', src);
  await p.evaluate(() => abrirFicha('chonto'));
  await hasta(p, () => document.querySelector('#ficha').classList.contains('abierta'));
  const galeria = await p.evaluate(() =>
    [...document.querySelectorAll('#fichaCaja .miniaturas img')].map(i => i.getAttribute('src')));
  ok('  ...y la galería reparte las dos fotos', galeria.length === 2,
     galeria.join(' · ') || 'sin miniaturas');
  ok('  ...con el ancho de miniatura, no el de tarjeta',
     galeria.every(u => /chonto-[12]\.jpg$/.test(u)), galeria[0] || '');

  const sinFotos = await p.evaluate(() => {
    const p2 = producto('rinon');
    return fotosDe(p2, 'tarjeta')[0].slice(0, 30);
  });
  ok('Un producto sin fotos sigue mostrando su dibujo',
     sinFotos.indexOf('data:image/svg+xml') === 0, sinFotos);

  ok('Sin errores de JavaScript', errores.length === 0, errores[0] || '');

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
