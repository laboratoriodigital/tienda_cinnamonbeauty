/* La medición se hornea en el <head>: los IDs viven en la hoja, pero no salen
   por el catálogo público ni pueden abrir una puerta de inyección en HTML. */
const { crear, configurar } = require('./gas.js');

const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const nuevo = () => configurar((() => { const g = crear('./as.js'); g.api.instalar(); return g; })());
const puerta = (g, a) => JSON.parse(g.api.doGet({ parameter: { a, t:g.token } })._texto);

function escribir(g, clave, valor) {
  const datos = g.filas('Configuración');
  const i = datos.findIndex(f => String(f[0]).trim() === clave);
  if (i < 1) throw new Error('No existe la clave ' + clave);
  g.hojas.get('Configuración').getRange(i + 1, 2).setValue(valor);
}

{
  const g = nuevo();
  const r = puerta(g, 'bloques');
  ok('IDs vacías no cargan scripts de medición',
     !/gtag\/js|fbevents\.js/.test(r.head), 'la política autoriza; no hay script que envíe datos');
}

{
  const g = nuevo();
  escribir(g, 'medicion_google_analytics', 'g-a1b2c3d4');
  escribir(g, 'medicion_meta_pixel', '123456789012345');
  const r = puerta(g, 'bloques');
  const cat = puerta(g, 'catalogo');
  ok('GA4 se carga con el ID de medición normalizado',
     /googletagmanager\.com\/gtag\/js\?id=G-A1B2C3D4/.test(r.head) &&
     /gtag\('config','G-A1B2C3D4'\)/.test(r.head));
  ok('Meta Pixel se carga con su ID numérico',
     /connect\.facebook\.net\/en_US\/fbevents\.js/.test(r.head) &&
     /fbq\('init','123456789012345'\)/.test(r.head));
  ok('La CSP del bloque autoriza Google y Meta',
     /script-src [^;]*googletagmanager\.com/.test(r.head) &&
     /script-src [^;]*connect\.facebook\.net/.test(r.head) &&
     /connect-src [^;]*google-analytics\.com/.test(r.head) &&
     /connect-src [^;]*facebook\.com/.test(r.head));
  ok('Las IDs no salen por el catálogo público',
     !Object.prototype.hasOwnProperty.call(cat.config, 'medicion_google_analytics') &&
     !Object.prototype.hasOwnProperty.call(cat.config, 'medicion_meta_pixel'));
}

{
  const g = nuevo();
  escribir(g, 'medicion_google_analytics', 'UA-123');
  escribir(g, 'medicion_meta_pixel', 'https://facebook.com/pixel');
  const r = puerta(g, 'bloques');
  const avisos = (r.alta && r.alta.avisan || []).map(a => a.clave);
  ok('Una ID inválida no entra al HTML', !/gtag\/js|fbevents\.js/.test(r.head));
  ok('  ...y el montaje explica las dos celdas a corregir',
     avisos.indexOf('medicion_google_analytics') >= 0 && avisos.indexOf('medicion_meta_pixel') >= 0,
     avisos.join(', '));
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
