/* ============================================================================
   LO QUE VE EL COMPRADOR CUANDO NO CONTESTA NADIE.
   ----------------------------------------------------------------------------
   Esta batería existe por un fallo que no se veía mirando el código: el montaje
   escribía en cada index.html el <head>, las cinco constantes y la paleta de SU
   comercio — y dejaba el catálogo de respaldo del comercio de la plantilla. La
   tienda dos, de cosméticos, abría con ocho tomates un instante y se corregía
   sola cuando llegaba el catálogo. El parpadeo era lo visible. Lo caro era lo
   otro: sin red ese instante no se acaba, y esa tienda vende tomate.

   POR QUÉ ES UNA BATERÍA APARTE Y NO UNA REGLA DE ESTILO.
   El primer intento fue una guarda de texto: «ninguna batería de navegador
   puede nombrar un producto de Orgánico», calcada de la que puso la paleta en
   la 2.9.9. Marcó diez baterías, y las diez tenían razón: nombran tomates
   porque conducen la HOJA EMULADA, que es de fábrica y es igual en todas las
   tiendas. Una comprobación que acusa al producto de un acierto es peor que no
   tener ninguna (patrón 5), así que se cambió por esto: en vez de prohibir una
   palabra, se monta una tienda que no es Orgánico y se mira qué pinta.

   CÓMO. Se coge el index.html real, se le escribe el respaldo de un comercio
   inventado con la misma herramienta que usa el flujo —`sembrar-respaldo.mjs`,
   no una copia— y se sirve ese archivo con la hoja MUERTA. Lo que se pinta
   entonces tiene que ser, entero, del comercio inventado.

   La pregunta que contesta distinto con el arreglo puesto y sin él: ¿de quién
   es la tienda que se ve cuando Google no está?
   ============================================================================ */
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('fs');
const respaldo = require('../montar/sembrar-respaldo.mjs');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* Un comercio que no se parece en nada al de la plantilla: ni los productos, ni
   las zonas de envío, ni el nombre, ni los colores. Si algo de Orgánico
   sobrevive a esto, se ve. */
const OTRA = {
  productos: [
    { id: 'labial', nombre: 'Labial mate larga duración', formato: 'Unidad',
      categoria: 'Labios', precio: 38000, stock: 12,
      descripcion: 'Acabado mate, ocho horas.', imagenes: [] },
    { id: 'base', nombre: 'Base líquida tono 3', formato: 'Frasco 30 ml',
      categoria: 'Rostro', precio: 62000, stock: 4,
      descripcion: 'Cobertura media.', imagenes: [] },
    { id: 'brocha', nombre: 'Brocha de polvos', formato: 'Unidad',
      categoria: 'Accesorios', precio: 25000, stock: 0,
      descripcion: 'Pelo sintético.', imagenes: [] }
  ],
  envios: [
    { id: 'tienda', nombre: 'Recoger en el local', valor: 0 },
    { id: 'bogota', nombre: 'Bogotá', valor: 7000 }
  ],
  config: {
    negocio: 'Cinnamon Beauty',
    whatsapp: '573218550807',
    portada_titulo: 'Maquillaje profesional',
    pie_descripcion: 'Cosmética para todos los días',
    color_principal: '#EA9999', color_secundario: '#F1C232', color_alterno: '#7A3E3E',
    empresa_ciudad: 'Bogotá, Cundinamarca', empresa_tel: '321 855 0807'
  }
};

/* LAS PALABRAS DE ORGÁNICO QUE NO PUEDEN APARECER. No es una lista de estilo:
   es lo que estaba saliendo de verdad en la tienda de otro comercio. */
const DE_ORGANICO = /Orgánico|Tomate chonto|Tomate cherry|Sofrito|Rionegro|573008610480/;

(async () => {
  /* PUERTO 0: que lo elija el sistema. `todas.sh` reparte puertos fijos por
     índice —8100, 8102, …— y una batería que se inventara el suyo sumando uno
     se metería en el de la de al lado. Eso no falla siempre: falla cuando dos
     corren a la vez, que es justo como corren. */
  const html = fs.readFileSync('./index.html', 'utf8');

  /* Se escribe con la MISMA herramienta del flujo. Una copia de la lógica aquí
     probaría la copia, no el producto (patrón 2). */
  const escrito = respaldo.aplicar(html, OTRA, '2026-09-14').html;
  /* Sin servicio: es la única forma de estar seguro de que lo que se ve es el
     respaldo del archivo y no una respuesta que llegó por detrás. Es la trampa
     que tenía cat.js: pedía «caído», que deja el catálogo vivo, y daba el
     respaldo por probado mirando una tienda con la hoja contestando. */
  const suelto = escrito.replace(/const SCRIPT_URL = "[^"]*";/, 'const SCRIPT_URL = "";');

  const servidor = http.createServer((req, res) => {
    if (req.url.indexOf('/catalogo.json') === 0) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(suelto);
  });
  await new Promise(r => servidor.listen(0, r));
  const puerto = servidor.address().port;

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));
  await p.goto('http://localhost:' + puerto + '/');
  await p.waitForSelector('.rejilla .tarjeta');

  const visto = await p.evaluate(() => ({
    marca: document.querySelector('#marcaNombre').textContent.trim(),
    pie: document.querySelector('#pieNombre').textContent.trim(),
    portada: (document.querySelector('#portadaTitulo') || {}).textContent || '',
    flotante: (document.querySelector('#flotante') || {}).href || '',
    productos: VISIBLES.length,
    nombres: VISIBLES.map(x => x.nombre),
    envios: TARIFAS.map(e => e.id),
    rojo: getComputedStyle(document.documentElement).getPropertyValue('--rojo').trim(),
    formas: VISIBLES.map(x => x.forma)
  }));

  ok('SIN RED, la tienda que se ve es la de ESTE comercio',
     visto.marca === 'Cinnamon Beauty' && visto.pie === 'Cinnamon Beauty',
     visto.marca + ' / ' + visto.pie);
  ok('  ...con sus productos, no con los de la plantilla',
     visto.productos === OTRA.productos.length &&
     visto.nombres.join('|') === OTRA.productos.map(x => x.nombre).join('|'),
     visto.nombres.join(' · '));
  ok('  ...sus zonas de envío', visto.envios.join(',') === 'tienda,bogota', visto.envios.join(','));
  ok('  ...su WhatsApp', visto.flotante.indexOf('573218550807') !== -1, visto.flotante.slice(0, 40));
  ok('  ...su titular de portada', visto.portada === 'Maquillaje profesional', visto.portada);
  ok('  ...y su color, desde la primera pintada',
     visto.rojo.toUpperCase() === '#EA9999', visto.rojo);

  /* EL MARCADOR DEL PRODUCTO SIN FOTO. Lo calculaba el Apps Script y lo
     escribía dentro del respaldo; lo vivo lo heredaba POR ID de ahí, con
     «tomate» de reserva. Un producto que no estuviera en el respaldo —o una
     tienda que no vende tomate— se dibujaba con un tomate. Ahora lo decide la
     página a partir del formato y la categoría, en un solo sitio. */
  ok('  ...y el dibujo del producto sin foto no es un tomate por descarte',
     visto.formas[1] === 'frasco' && visto.formas[0] === 'tomate',
     visto.formas.join(' · ') + ' — «tomate» es la forma redonda, no la fruta');

  const texto = await p.locator('body').innerText();
  ok('NO QUEDA NI UNA PALABRA del comercio de la plantilla en la página',
     !DE_ORGANICO.test(texto),
     (texto.match(DE_ORGANICO) || ['ninguna'])[0]);

  /* Y LA PRUEBA DE QUE ESTA BATERÍA DISTINGUE ALGO. Con el respaldo sin
     escribir —el archivo tal como sale de la plantilla— lo de arriba tiene que
     FALLAR. Una comprobación que pasa en los dos casos no comprueba nada, y es
     el error que ya nos costó dos tardes. */
  const sinArreglo = html.replace(/const SCRIPT_URL = "[^"]*";/, 'const SCRIPT_URL = "";');
  const s2 = http.createServer((req, res) => {
    if (req.url.indexOf('/catalogo.json') === 0) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(sinArreglo);
  });
  await new Promise(r => s2.listen(0, r));
  const puerto2 = s2.address().port;
  const p2 = await ctx.newPage();
  await p2.goto('http://localhost:' + puerto2 + '/');
  await p2.waitForSelector('.rejilla .tarjeta');
  const delaPlantilla = await p2.locator('body').innerText();
  ok('ESTA BATERÍA DISTINGUE: con el respaldo sin escribir, esto se cae',
     DE_ORGANICO.test(delaPlantilla),
     'si dejara de caerse, es que ya no está mirando nada');

  ok('Sin errores de JavaScript', errores.length === 0, errores[0] || '');

  await b.close();
  servidor.close(); s2.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
})();
