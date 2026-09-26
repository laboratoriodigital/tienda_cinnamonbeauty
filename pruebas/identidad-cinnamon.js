/* Vigila lo que no prueba el arnés: los archivos REALES de Cinnamon.
   Las demás baterías usan una hoja emulada y por eso no detectan que una
   réplica haya copiado por error la portada, el dominio o el catálogo ajeno. */
const fs = require('node:fs');
const path = require('node:path');
const T = [];
const ok = (nombre, cumple, detalle) => T.push((cumple ? '  OK  ' : ' FALLA') + ' | ' + nombre +
  (!cumple && detalle ? '  -> ' + detalle : ''));
const raiz = path.join(__dirname, '..', 'publicar');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const catalogo = JSON.parse(fs.readFileSync(path.join(raiz, 'catalogo.json'), 'utf8'));
const ids = catalogo.productos.map(p => String(p.id));
const idsUnicos = [...new Set(ids)];
const fichas = fs.readdirSync(path.join(raiz, 'productos'), { withFileTypes:true })
  .filter(x => x.isDirectory()).map(x => x.name).sort();

/* El dominio puede cambiar cuando el comercio pasa del workers.dev temporal a
   su dominio definitivo. La identidad no es «qué dominio usaba Cinnamon el
   día que escribimos esta prueba», sino que Configuración, canonical, OG y
   sitemap hablen todos del MISMO sitio y que el repositorio siga siendo el de
   Cinnamon. La hoja acepta históricamente el dominio sin esquema; el horneado
   le antepone https. */
const urlBase = valor => {
  let s = String(valor || '').trim();
  if (s && !/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' || !u.hostname) return '';
    u.hash = ''; u.search = ''; u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    return u.href.replace(/\/+$/, '');
  } catch { return ''; }
};
const valorMeta = (atributo, valor) => {
  const patron = new RegExp('<(?:meta|link)[^>]*' + atributo + '="' + valor +
    '"[^>]*(?:content|href)="([^"]+)"', 'i');
  const inverso = new RegExp('<(?:meta|link)[^>]*(?:content|href)="([^"]+)"[^>]*' +
    atributo + '="' + valor + '"', 'i');
  return (html.match(patron) || html.match(inverso) || [,''])[1];
};
const declarada = urlBase(catalogo.config.sitio_url);
const canonical = urlBase(valorMeta('rel', 'canonical'));
const og = urlBase(valorMeta('property', 'og:url'));
const sitemap = fs.readFileSync(path.join(raiz, 'sitemap.xml'), 'utf8');
const portadaSitemap = urlBase((sitemap.match(/<loc>([^<]+)<\/loc>/) || [,''])[1]);

ok('La portada y el respaldo pertenecen a Cinnamon',
  /<title>Cinnamon Beauty - Professional Makeup<\/title>/.test(html) &&
  /let NEGOCIO\s*=\s*"Cinnamon Beauty"/.test(html) &&
  /"negocio": "Cinnamon Beauty"/.test(html));
ok('Un dominio configurado sin esquema se entiende como https',
  urlBase('cinnamonbeauty.laboratorio-digital.com') ===
    'https://cinnamonbeauty.laboratorio-digital.com');
ok('Dominio y referencia del catálogo de Cinnamon',
  !!declarada && declarada === canonical && declarada === og && declarada === portadaSitemap &&
  catalogo.config.repositorio === 'laboratoriodigital/tienda_cinnamonbeauty',
  'Configuración=' + (catalogo.config.sitio_url || '(vacío)') +
  ' · canonical=' + (valorMeta('rel', 'canonical') || '(vacío)') +
  ' · og:url=' + (valorMeta('property', 'og:url') || '(vacío)') +
  ' · sitemap=' + ((sitemap.match(/<loc>([^<]+)<\/loc>/) || [,''])[1] || '(vacío)') +
  ' · repositorio=' + (catalogo.config.repositorio || '(vacío)'));
ok('La vitrina habla con el Apps Script propio',
  /const SCRIPT_URL = "https:\/\/script\.google\.com\/macros\/s\/AKfycbzNcOgnYTNnkKAO5qCDc9DISNVL6RzORCNnJbWqpTDI_oxjf1Dlx1N0h1PIrf4Sc_MJ\/exec"/.test(html));
ok('El respaldo conserva los productos publicados de Cinnamon',
  ids.length > 0 && ids.every(id => html.includes('id:' + JSON.stringify(id))));
ok('La ficha y el sitemap coinciden con el catálogo actual',
  fichas.length === idsUnicos.length && idsUnicos.every(id => fichas.includes(encodeURIComponent(id))) &&
  (fs.readFileSync(path.join(raiz, 'sitemap.xml'), 'utf8').match(/<loc>/g) || []).length === idsUnicos.length + 1 &&
  idsUnicos.every(id => fs.readFileSync(path.join(raiz, 'sitemap.xml'), 'utf8')
    .includes('/productos/' + encodeURIComponent(id) + '/')));
ok('Ningún enlace visible manda a Orgánico',
  !html.includes('organico.laboratoriodigital-la.workers.dev') &&
  !html.includes('wa.me/573008610480'));
ok('Las condiciones no anuncian tomates ni recogida en finca',
  !/procesados de tomate|tomate fresco|cosecha propia|recoger sin costo en la finca/i.test(html));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
if (T.some(x => x.startsWith(' FALLA'))) process.exitCode = 1;
