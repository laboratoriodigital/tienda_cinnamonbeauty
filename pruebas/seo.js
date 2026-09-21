/* SEO horneado: lo que ve el robot sale del mismo catálogo que ve el cliente. */
const fs = require('node:fs');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

(async () => {
  const { hornearSeo, aplicarIndex } = await import('../montar/sembrar-seo.mjs');
  const base = 'https://flores.ejemplo.co/';
  const catalogo = {
    config: {
      negocio:'Flor de Prueba', sitio_url:base, sitio_titulo:'Flores a domicilio',
      sitio_descripcion:'Ramos frescos', empresa_correo:'hola@flores.co',
      empresa_direccion:'[DIRECCIÓN]', empresa_ciudad:'Bogotá', empresa_tel:'[TELÉFONO]',
      fotos_origen:base + 'fotos'
    },
    fotos: { 'rosa.jpg':[160,600,900] },
    productos: [
      { id:'rosa', nombre:'Ramo de rosas', descripcion:'Doce rosas frescas', precio:75000,
        stock:0, imagenes:['rosa.jpg'], referencia:'RAMO-12', ejes:[], variantes:[] },
      { id:'camiseta', nombre:'Camiseta floral', descripcion:'Algodón suave', precio:50000,
        stock:0, imagenes:[], ejes:[{nombre:'Color',valores:['Azul','Verde']},{nombre:'Talla',valores:['S']}],
        variantes:[
          {id:'azul-s',sku:'CAM-AZ-S',opciones:{Color:'Azul',Talla:'S'},precio:51000,stock:2,imagenes:[]},
          {id:'verde-s',sku:'CAM-VE-S',opciones:{Color:'Verde',Talla:'S'},precio:50000,stock:0,imagenes:[]}
        ] },
      { id:'oculta', nombre:'No publicar', activo:false, precio:1, stock:1 }
    ]
  };
  const r = hornearSeo(catalogo);
  const sinEsquema = JSON.parse(JSON.stringify(catalogo));
  sinEsquema.config.sitio_url = 'flores.ejemplo.co';
  ok('Normaliza a HTTPS el dominio histórico sin esquema',
    hornearSeo(sinEsquema).sitemap.includes('https://flores.ejemplo.co/'));
  ok('Genera una ficha por cada producto activo', r.paginas.size === 2 && !r.paginas.has('oculta'));
  const duplicado = JSON.parse(JSON.stringify(catalogo));
  duplicado.productos.splice(1, 0, { ...duplicado.productos[0], nombre:'Otra rosa con el mismo ID' });
  const unico = hornearSeo(duplicado);
  ok('Un ID duplicado conserva la primera ficha y una sola URL en el sitemap',
    unico.paginas.size === 2 &&
    unico.paginas.get('rosa').includes('<title>Ramo de rosas — Flor de Prueba</title>') &&
    (unico.sitemap.match(/<loc>/g) || []).length === 3);
  ok('El sitemap lista exactamente portada y productos activos',
    (r.sitemap.match(/<loc>/g)||[]).length === 3 && r.sitemap.includes('/productos/rosa/') &&
    r.sitemap.includes('/productos/camiseta/') && !r.sitemap.includes('oculta'));
  ok('El sitemap es determinista y no inventa lastmod', !r.sitemap.includes('<lastmod>'));
  ok('robots descubre el sitemap y no bloquea páginas noindex',
    r.robots.includes('Sitemap: ' + base + 'sitemap.xml') && !/Disallow:/i.test(r.robots));

  const portada = aplicarIndex('<html><head><title>X</title></head><body></body></html>', catalogo);
  const jPortada = JSON.parse(portada.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  ok('La portada hornea Organization y WebSite en el HTML',
    jPortada['@graph'].some(x=>x['@type']==='Organization') && jPortada['@graph'].some(x=>x['@type']==='WebSite'));
  ok('No publica datos sembrados entre corchetes',
    !portada.includes('[DIRECCIÓN]') && !portada.includes('[TELÉFONO]'));
  ok('Sí conserva los datos reales del comercio', portada.includes('hola@flores.co') && portada.includes('Bogotá'));
  ok('Hornear dos veces reemplaza el bloque, no lo duplica',
    (aplicarIndex(portada, catalogo).match(/SEO HORNEADO: NO EDITAR/g)||[]).length === 1);
  const incompleto = JSON.parse(JSON.stringify(catalogo));
  incompleto.config.sitio_descripcion = '[DESCRIPCIÓN]';
  const sinMetaFalsa = aplicarIndex('<html><head><meta name="description" content="[DESCRIPCIÓN]"><meta property="og:description" content="[DESCRIPCIÓN]"></head></html>', incompleto);
  ok('Retira del head una descripción que sigue entre corchetes',
    !sinMetaFalsa.includes('name="description"') && !sinMetaFalsa.includes('og:description'));

  const rosa = r.paginas.get('rosa');
  const jRosa = JSON.parse(rosa.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  ok('La ficha simple declara Product y Offer completos', jRosa['@type']==='Product' &&
    jRosa.offers['@type']==='Offer' && jRosa.offers.price==='75000' && jRosa.offers.priceCurrency==='COP');
  ok('Un agotado sigue indexado, declarado como agotado',
    /name="robots" content="index,follow/.test(rosa) && /schema.org\/OutOfStock/.test(jRosa.offers.availability));
  ok('Usa la imagen horneada más grande que existe',
    jRosa.image[0] === base + 'fotos/rosa-900.webp');
  ok('La ficha tiene canonical absoluto y contenido visible',
    rosa.includes('rel="canonical" href="' + base + 'productos/rosa/"') && rosa.includes('Doce rosas frescas'));

  const camiseta = r.paginas.get('camiseta');
  const jCam = JSON.parse(camiseta.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  ok('Las variantes se publican como ProductGroup',
    jCam['@type']==='ProductGroup' && jCam.productGroupID==='camiseta' && jCam.hasVariant.length===2);
  ok('ProductGroup declara los ejes compatibles con Schema.org',
    jCam.variesBy.includes('https://schema.org/color') && jCam.variesBy.includes('https://schema.org/size'));
  ok('Cada SKU conserva su precio, stock y opciones',
    jCam.hasVariant[0].sku==='CAM-AZ-S' && jCam.hasVariant[0].offers.price==='51000' &&
    /InStock$/.test(jCam.hasVariant[0].offers.availability) && jCam.hasVariant[0].additionalProperty.length===2);

  const headers = fs.readFileSync('../publicar/_headers','utf8');
  const error404 = fs.readFileSync('../publicar/404.html','utf8');
  ok('sitemap y robots declaran su Content-Type',
    /\/sitemap\.xml[\s\S]*Content-Type: application\/xml/.test(headers) &&
    /\/robots\.txt[\s\S]*Content-Type: text\/plain/.test(headers));
  ok('404, admin, tablero y pedido quedan noindex',
    /name="robots" content="noindex"/.test(error404) && ['/admin','/tablero','/pedido'].every(x =>
      new RegExp(x + '[\\s\\S]{0,100}X-Robots-Tag: noindex').test(headers)));

  const index = fs.readFileSync('../publicar/index.html','utf8');
  ok('Las tarjetas ofrecen enlaces href rastreables a cada ficha',
    /href="\$\{rutaSeoProducto\(p\.id\)\}"/.test(index) && /\/productos\//.test(index));

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
