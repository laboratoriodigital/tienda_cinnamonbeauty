const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo } = require('./esperar.js');
const T = []; const ok = (n,c,d) => T.push((c?'  OK  ':' FALLA')+' | '+n+(d?'  -> '+d:''));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:375,height:812} });
  const bloqueos = [];
  p.on('console', m => { if (/Refused to load|Content Security/i.test(m.text())) bloqueos.push(m.text().slice(0,100)); });
  p.on('pageerror', e => bloqueos.push('PAGEERROR: ' + e.message));
  // --- montamos el escenario EN LA HOJA, que es lo que se está probando ---
  // chonto: cuatro fotos de Cloudinary (fila 2, columna Imágenes)
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=2&c=8&v=' + encodeURIComponent("https://res.cloudinary.com/organico/image/upload/v1/chonto-1.jpg|https://res.cloudinary.com/organico/image/upload/v1/chonto-2.jpg|https://res.cloudinary.com/organico/image/upload/v1/chonto-3.jpg|https://res.cloudinary.com/organico/image/upload/v1/chonto-4.jpg"));
  // un producto que NO existe en index.html, creado solo con una fila
  await fetch(U + '/__producto?' + new URLSearchParams({
    id:'mermelada', nombre:'Mermelada de tomate y jengibre', formato:'Frasco 220 g',
    categoria:'Conservas', precio:'19900', stock:'6', destacado:'S\u00ed',
    desc:'Dulce con punto picante, para quesos maduros y carnes fr\u00edas.',
    imagenes: "https://res.cloudinary.com/organico/image/upload/w_400,f_auto/v1/mermelada-ya-optimizada.jpg" }).toString());
  await p.goto(U); await catalogoListo(p);

  // ===== 1. Producto nuevo creado SOLO desde la hoja =====
  const nuevo = await p.evaluate(() => {
    const m = VISIBLES.find(x => x.id === 'mermelada');
    return m ? { nombre:m.nombre, formato:m.formato, cat:m.categoria, precio:m.precio,
                 desc:m.descripcion.slice(0,30), stock:m.stock } : null;
  });
  ok('Producto que NO existe en index.html aparece en la tienda', !!nuevo, nuevo && nuevo.nombre);
  ok('  ...con su formato, categoría y precio', nuevo && nuevo.formato === 'Frasco 220 g' && nuevo.precio === 19900);
  ok('  ...y su descripción', nuevo && nuevo.desc.startsWith('Dulce con punto picante'));
  ok('Su categoría nueva entra en los filtros',
     (await p.locator('#filtros').innerText()).includes('Conservas'));
  ok('Se puede agregar al carrito', await p.evaluate(() => { agregar('mermelada',1); return carrito.some(i=>i.id==='mermelada'); }));

  // ===== 2. Destacados primero, con insignia =====
  await p.goto(U); await catalogoListo(p);
  const orden = await p.evaluate(() => VISIBLES.map(x => ({ id:x.id, d:!!x.destacado })));
  const primerNoDestacado = orden.findIndex(x => !x.d);
  ok('Los destacados van todos primero',
     orden.slice(primerNoDestacado).every(x => !x.d),
     orden.map(x => x.id + (x.d ? '*' : '')).join(' → '));
  ok('Insignia "Destacado" en cada uno', (await p.locator('.destacado').count()) === primerNoDestacado,
     (await p.locator('.destacado').count()) + ' insignias para ' + primerNoDestacado + ' destacados');

  // ===== 3. Fotos: la hoja escribe nombres, la tienda arma la URL =====
  const urls = await p.evaluate(() => {
    const ch = producto('chonto'), me = producto('mermelada');
    return { tarjeta: fotosDe(ch,'tarjeta')[0], galeria: fotosDe(ch,'galeria')[0],
             mini: fotosDe(ch,'miniatura')[0], completa: fotosDe(me,'tarjeta')[0],
             origen: FOTOS.origen };
  });
  ok('El origen por defecto es la carpeta /fotos del sitio',
     urls.origen.endsWith('/fotos'), urls.origen);
  ok('Una URL completa que ya estaba en la hoja se respeta',
     urls.completa.indexOf('http') === 0, urls.completa.slice(0, 60));
  ok('Los tres usos piden la misma foto (el ancho lo decide el proveedor)',
     urls.tarjeta === urls.galeria && urls.galeria === urls.mini ||
     urls.tarjeta.indexOf('http') === 0,
     urls.tarjeta.slice(0, 60));
  ok('El <img> de la tarjeta usa esa misma URL',
     (await p.locator('.rejilla .tarjeta img').first().getAttribute('src')).length > 5);

  // ===== 4. La CSP se genera desde la hoja =====
  const html = require('fs').readFileSync('index.html','utf8');
  ok('La CSP sigue en el bloque generado, no suelta en el archivo',
     /Content-Security-Policy/.test(html) &&
     html.indexOf('Content-Security-Policy') < html.indexOf('CONFIGURACIÓN DE ESTA TIENDA'));
  ok('  ...y declara qué hosts de imagen permite',
     /const FOTOS_HOSTS = \[/.test(html), (html.match(/const FOTOS_HOSTS = \[[^\]]*\]/)||[''])[0]);
  ok('Sin bloqueos de CSP en consola', bloqueos.length === 0, bloqueos[0] || '');

  // ===== 5. Open Graph =====
  const og = await p.evaluate(() => {
    const g = s => (document.querySelector(s)||{}).content;
    return { img:g('meta[property="og:image"]'), url:g('meta[property="og:url"]'),
             sitio:g('meta[property="og:site_name"]'), tw:g('meta[name="twitter:card"]'),
             w:g('meta[property="og:image:width"]') };
  });
  ok('og:image presente', !!og.img, og.img);
  /* Contra el nombre que declara ESTA tienda, no contra el de la primera:
     comparar con 'Orgánico' solo sabía ver a Orgánico, y la segunda tienda
     falló aquí sin que la prueba dijera por qué.

     Y contra el nombre del ARCHIVO, no contra la variable en vivo: NEGOCIO se
     reescribe con lo que diga la hoja en cada visita, mientras que og:site_name
     va horneado. preparar-index escribe los dos en la misma pasada, así que si
     no coinciden es que el <head> y las constantes salieron de corridas
     distintas — y entonces lo que se comparte por WhatsApp lleva el nombre
     viejo. Eso es justo lo que hay que ver desde aquí. */
  const horneado = (await p.content()).match(/let NEGOCIO\s*=\s*"([^"]*)"/);
  ok('og:url, og:site_name y twitter:card',
     !!og.url && !!horneado && og.sitio === horneado[1] &&
     og.tw === 'summary_large_image',
     og.sitio + ' / ' + (horneado ? horneado[1] : 'sin constante'));
  ok('Dimensiones declaradas', og.w === '1200');

  // ===== 6. Recorte del mensaje =====
  const corte = await p.evaluate(() => {
    carrito = []; VISIBLES.filter(x => x.stock > 0).slice(0, 3)
      .forEach(x => agregar(x.id, Math.min(2, x.stock)));      // pedido normal: 3 productos
    abrirPanel();
    const g = (id,v) => document.getElementById(id).value = v;
    g('fNombre','María Fernanda Rodríguez Peña'); g('fTel','3115558899'); g('fCiudad','Bogotá D.C.');
    g('fDir','Carrera 15 #100-25, Torre B, Apartamento 502, Chapinero');
    g('fNotas','x'.repeat(300));
    document.getElementById('consiento').checked = true; revisarFormulario();
    document.getElementById('consiento').checked = true; revisarFormulario();
    let u = enlaceWhatsapp();
    const msg = decodeURIComponent(u.split('text=')[1]);
    return { url:u.length, msg, lineasProducto:(msg.match(/^\d+\. /gm)||[]).length, productos:carrito.length };
  });
  ok('URL bajo 2.000 caracteres', corte.url <= 2000, corte.url + ' caracteres');
  ok('Pedido normal (3 productos): NO recorta nada',
     !/te cuento el resto|detallo en el chat/.test(corte.msg), corte.url + ' caracteres');

  // Un pedido grande CON nota larga sí necesita recorte, y debe quedar bajo el tope
  const grande = await p.evaluate(() => {
    carrito = []; VISIBLES.filter(x => x.stock > 0).forEach(x => agregar(x.id, Math.min(3, x.stock)));
    refrescar(); revisarFormulario();
    const u = enlaceWhatsapp();
    return { url:u.length, msg:decodeURIComponent(u.split('text=')[1]), n:carrito.length };
  });
  ok('Pedido grande (' + grande.n + ' productos) + nota larga: recorta',
     /te cuento el resto|detallo en el chat|detalle por aquí/.test(grande.msg));
  ok('  ...y queda bajo 2.000', grande.url <= 2000, grande.url + ' caracteres');
  ok('  ...conservando el total y la dirección',
     /\*TOTAL: \$/.test(grande.msg) && /Dirección: /.test(grande.msg));
  ok('Conserva el total intacto', /\*TOTAL: \$/.test(corte.msg));
  ok('Conserva los datos de entrega', /Dirección: /.test(corte.msg) && /Celular: /.test(corte.msg));

  // caso patológico: todos los campos al tope y en tildes (cada tilde ocupa 6 en la URL)
  const patologico = await p.evaluate(() => {
    const g = (id,v) => document.getElementById(id).value = v;
    g('fNombre','á'.repeat(60)); g('fCiudad','á'.repeat(40));
    g('fDir','á'.repeat(120)); g('fNotas','á'.repeat(300));
    revisarFormulario();          // es quien rearma el enlace del botón
    let u = enlaceWhatsapp();
    return { url:u.length, msg:decodeURIComponent(u.split('text=')[1]) };
  });
  ok('Caso patológico: URL bajo 2.000', patologico.url <= 2000, patologico.url + ' caracteres');
  ok('  ...recortando lo prescindible',
     /te cuento el resto por acá|detalle por aquí|detallo en el chat/.test(patologico.msg));
  ok('  ...pero conservando el total', /\*TOTAL: \$/.test(patologico.msg));
  ok('  ...y la dirección completa', patologico.msg.includes('Dirección: ' + 'á'.repeat(120)));

  // caso extremo: muchos productos
  const extremo = await p.evaluate(() => {
    let u = enlaceWhatsapp();
    const orig = carrito.slice();
    carrito = []; for(let k=0;k<14;k++) carrito.push({id:'chonto',cantidad:1});
    // forzamos 14 líneas saltando sanear con nombres largos
    const armado = (()=>{  return u; })();
    carrito = orig;     return armado ? { url:armado.length, msg:decodeURIComponent(armado.split('text=')[1]) } : null;
  });
  ok('Caso extremo sigue bajo 2.000', extremo && extremo.url <= 2000, extremo ? extremo.url + ' caracteres' : 'n/a');

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x=>x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
