/* La vitrina exige combinación completa y mantiene cada SKU como línea propia. */
const { chromium } = require('playwright');
const { catalogoListo, pintado } = require('./esperar.js');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{ width:375, height:812 } });
  const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
  await p.goto(U); await catalogoListo(p);
  await p.evaluate(() => aplicarCatalogo({ ok:true, esquema:2, productos:[{
    id:'camiseta', nombre:'Camiseta básica', formato:'Unidad', categoria:'Ropa', precio:30000,
    stock:5, descripcion:'Algodón', imagenes:['camiseta-general.jpg'], activo:true, ejes:[
      {nombre:'Color', valores:['Azul','Verde']}, {nombre:'Talla', valores:['S','M']}
    ], variantes:[
      {id:'azul-s', sku:'CAM-AZU-S', opciones:{Color:'Azul',Talla:'S'}, precio:30000, stock:2,
       imagenes:['camiseta-azul.jpg']},
      {id:'verde-m', sku:'CAM-VER-M', opciones:{Color:'Verde',Talla:'M'}, precio:35000, stock:3}
    ]
  }], envios:TARIFAS, config:{} }));
  await p.evaluate(() => { pintarFiltros(); pintarRejilla(); abrirFicha('camiseta'); });
  await pintado(p);
  ok('La tarjeta obliga a elegir opciones', /Elegir opciones/.test(await p.locator('#rejilla').innerText()));
  await p.locator('.variante-opcion', {hasText:'Azul'}).click();
  const mDeshabilitada = await p.locator('.variante-opcion', {hasText:'M'}).isDisabled();
  ok('Deshabilita combinaciones que no existen', mDeshabilitada);
  await p.locator('.variante-opcion', {hasText:'S'}).click();
  ok('La combinación elegida cambia la galería', /camiseta-azul\.jpg/.test(await p.locator('#galeriaPrincipal img').getAttribute('src')));
  ok('El enlace directo conserva la variante', await p.evaluate(() => new URL(location.href).searchParams.get('v')) === 'azul-s');
  await p.evaluate(() => {
    selecciones = {}; fichaActual = null;
    history.replaceState({}, '', '/?p=camiseta&v=azul-s');
    enlacePendiente = idEnLaDireccion(); variantePendiente = varianteEnLaDireccion(); atenderEnlace();
  });
  ok('Abrir el enlace restaura opciones y galería',
     await p.evaluate(() => varianteElegida(fichaActual).id) === 'azul-s' &&
     /camiseta-azul\.jpg/.test(await p.locator('#galeriaPrincipal img').getAttribute('src')));
  await p.locator('.ficha-agregar .btn-solido').click();
  await p.evaluate(() => abrirFicha('camiseta'));
  await p.locator('.variante-opcion', {hasText:'Verde'}).click();
  await p.locator('.variante-opcion', {hasText:'M'}).click();
  ok('Una variante sin fotos hereda la galería general',
     /camiseta-general\.jpg/.test(await p.locator('#galeriaPrincipal img').getAttribute('src')));
  await p.locator('.ficha-agregar .btn-solido').click();
  const estado = await p.evaluate(() => ({ carrito, subtotal:subtotal(), items:JSON.parse(itemsParaServidor()) }));
  ok('Dos combinaciones son dos líneas', estado.carrito.length === 2 && estado.items[0].variante !== estado.items[1].variante);
  ok('El subtotal respeta el precio por variante', estado.subtotal === 65000, String(estado.subtotal));
  await p.evaluate(() => abrirPanel()); await pintado(p);
  const panel = await p.locator('#panelCuerpo').innerText();
  ok('El carrito muestra opciones y SKU', /Color: Azul/.test(panel) && /Talla: M/.test(panel) && /CAM-AZU-S/.test(panel));
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
