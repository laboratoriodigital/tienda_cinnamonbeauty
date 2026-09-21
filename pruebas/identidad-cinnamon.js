/* Vigila lo que no prueba el arnés: los archivos REALES de Cinnamon.
   Las demás baterías usan una hoja emulada y por eso no detectan que una
   réplica haya copiado por error la portada, el dominio o el catálogo ajeno. */
const fs = require('node:fs');
const path = require('node:path');
const T = [];
const ok = (nombre, cumple) => T.push((cumple ? '  OK  ' : ' FALLA') + ' | ' + nombre);
const raiz = path.join(__dirname, '..', 'publicar');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const catalogo = JSON.parse(fs.readFileSync(path.join(raiz, 'catalogo.json'), 'utf8'));
const host = 'cinnamonbeauty.laboratoriodigital-la.workers.dev';
const ids = catalogo.productos.map(p => String(p.id));
const idsUnicos = [...new Set(ids)];
const fichas = fs.readdirSync(path.join(raiz, 'productos'), { withFileTypes:true })
  .filter(x => x.isDirectory()).map(x => x.name).sort();

ok('La portada y el respaldo pertenecen a Cinnamon',
  /<title>Cinnamon Beauty - Professional Makeup<\/title>/.test(html) &&
  /let NEGOCIO\s*=\s*"Cinnamon Beauty"/.test(html) &&
  /"negocio": "Cinnamon Beauty"/.test(html));
ok('Dominio y referencia del catálogo de Cinnamon',
  html.includes('https://' + host + '/') &&
  catalogo.config.sitio_url === 'https://' + host &&
  catalogo.config.repositorio === 'laboratoriodigital/tienda_cinnamonbeauty');
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
