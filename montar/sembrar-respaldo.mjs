/**
 * ORGÁNICO — escribir el catálogo de respaldo dentro de index.html
 * ---------------------------------------------------------------------------
 * Lo que la página pinta ANTES de que conteste nadie, y lo único que le queda
 * si no contesta nadie.
 *
 *   node montar/sembrar-respaldo.mjs
 *   node montar/sembrar-respaldo.mjs --revisar   (no escribe; falla si cambió)
 *
 * POR QUÉ EXISTE.
 * El respaldo venía quemado de la plantilla y nadie lo reescribía: el montaje
 * ya ponía el <head>, las constantes y la paleta, pero no esto. Así que la
 * tienda número dos —cosméticos— abría con ocho tomates y cinco tarifas de
 * envío de Rionegro, y se corregía sola un instante después, cuando llegaba el
 * catálogo. El parpadeo era lo visible. Lo grave era lo otro: sin red, ese
 * instante es permanente y esa tienda vende tomate.
 *
 * DE DÓNDE SALE, Y POR QUÉ DE AHÍ.
 * De `publicar/catalogo.json`, que hornea `catalogo-estatico.mjs` en este mismo
 * flujo, unos segundos antes. No se le vuelve a preguntar al maestro: sería la
 * segunda lectura del mismo dato, y de las dos, una se queda atrás (patrón 2).
 * El respaldo es, literalmente, una copia del catálogo publicado — con lo cual
 * es imposible que digan cosas distintas.
 *
 * LAS DOS REGLAS, LAS MISMAS DE preparar-index.mjs
 * 1. O se escribe entero, o no se escribe nada.
 * 2. Si el catálogo no está o no se puede leer, esto FALLA. No escribe un
 *    respaldo vacío y NO deja el de la plantilla: un respaldo con los productos
 *    de otro comercio es peor que no tener respaldo, porque funciona.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const INDEX = 'publicar/index.html';
const CATALOGO = 'publicar/catalogo.json';
const revisar = process.argv.includes('--revisar');

/* Las marcas son las mismas que emite el menú de la hoja, para que el camino
   automático y el manual dejen el archivo con LA MISMA forma. Dos formas del
   mismo bloque es lo que hace falta para que un día la expresión regular
   encuentre una y no la otra, y el montaje se plante sin motivo. */
const FIN = '/* ═══ FIN DEL CATÁLOGO DE RESPALDO ═══ */';

/* SE BUSCA EL RÓTULO, NO EL COMENTARIO QUE LO ENVUELVE. Antes del 4.20 ese
   bloque venía rotulado con `//` y ahora se escribe con `/* *​/`, y hay tiendas
   montadas con el archivo viejo: una tienda que corra el montaje antes de
   traerse el index.html nuevo de la release tiene la forma antigua. Buscar la
   forma nueva y solo la nueva era plantarse con un mensaje correcto ante un
   archivo que está perfectamente bien. */
function marcaDeApertura(html) {
  let i = -1;
  for (;;) {
    i = html.indexOf('CATÁLOGO DE RESPALDO', i + 1);
    if (i === -1) return -1;
    if (html.slice(Math.max(0, i - 8), i).indexOf('FIN DEL') === -1) return i;
  }
}

/* Un valor cualquiera de la hoja convertido en literal de JavaScript. El paso
   por JSON.stringify no es cosmético: es lo que impide que una comilla, una
   barra invertida o un salto de línea escritos en la hoja partan el archivo en
   dos. El </script> es aparte — dentro de una etiqueta <script> esa secuencia
   cierra el bloque aunque vaya dentro de una cadena. */
export function literal(v) {
  return JSON.stringify(v === undefined || v === null ? '' : String(v))
    .replace(/<\/script/gi, '<\\/script');
}

export function bloque(catalogo, cuando) {
  const productos = Array.isArray(catalogo.productos) ? catalogo.productos : [];
  const envios    = Array.isArray(catalogo.envios)    ? catalogo.envios    : [];
  const config    = catalogo.config && typeof catalogo.config === 'object'
                      ? catalogo.config : {};

  /* Lo que NO puede pasar: publicar un respaldo sin productos y que la tienda
     salga vacía cuando falle la red. Vacío no es ilegible —una tienda puede
     estar recién montada— pero tiene que decirse en voz alta, no descubrirse
     el día que se cae Google. */
  if (!productos.length) {
    throw new Error(
      CATALOGO + ' no tiene ni un producto activo, así que el respaldo de la\n' +
      'tienda quedaría vacío: el día que Google no conteste, la vitrina sale\n' +
      'en blanco.\n\n' +
      'Revisa la pestaña Catálogo: al menos un producto con id, nombre, precio\n' +
      'y Activo = Sí.');
  }

  /* Las claves pago_* ya las quita el maestro y las vuelve a quitar el
     horneado. Aquí se quitan por tercera vez, y no es redundancia: este bloque
     se escribe DENTRO de la página, que es lo más público que hay en todo el
     proyecto. Si alguien afloja uno de los dos filtros de arriba, este sigue. */
  const limpia = {};
  Object.keys(config).sort().forEach(k => {
    if (k.indexOf('pago_') === 0) return;
    limpia[k] = String(config[k]);
  });

  const L = [];
  L.push('/* ═══ CATÁLOGO DE RESPALDO — escrito el ' + cuando + ' ═══');
  L.push('   Lo que la página pinta ANTES de que conteste nadie, y lo único que le');
  L.push('   queda si no contesta nadie. Sale de la hoja de ESTA tienda: lo repone');
  L.push('   `montar/sembrar-respaldo.mjs` desde el catalogo.json que hornea el mismo');
  L.push('   flujo, así que no hay aquí un dato a mano que se pueda quedar atrás.');
  L.push('   A mano, si hiciera falta: menú de la hoja > Generar inventario. */');
  L.push('const CONFIG_SEMILLA = {');
  L.push(Object.keys(limpia)
    .map(k => '  ' + JSON.stringify(k) + ': ' + literal(limpia[k]))
    .join(',\n'));
  L.push('};');
  L.push('');
  L.push('const ENVIOS = [');
  L.push(envios.map(e =>
    '  { id:' + literal(e.id) + ', nombre:' + literal(e.nombre) +
    ', valor:' + (Number(e.valor) || 0) + ' }').join(',\n'));
  L.push('];');
  L.push('');
  L.push('const PRODUCTOS = [');
  L.push(productos.map(p => {
    const fotos = (Array.isArray(p.imagenes) ? p.imagenes : [])
      .map(u => String(u || '').trim()).filter(u => u);
    return '  { id:' + literal(p.id) + ', nombre:' + literal(p.nombre) +
           ', formato:' + literal(p.formato) + ', categoria:' + literal(p.categoria) + ',\n' +
           '    precio:' + (Number(p.precio) || 0) +
           ', stock:' + Math.max(0, Math.floor(Number(p.stock) || 0)) + ',\n' +
           '    imagenes:[' + (fotos.length ? fotos.map(literal).join(', ') : '""') + '],\n' +
           '    descripcion:' + literal(p.descripcion) + ' }';
  }).join(',\n\n'));
  L.push('];');
  L.push(FIN);
  return L.join('\n');
}

export function aplicar(html, catalogo, cuando) {
  const desde = marcaDeApertura(html);
  const hasta = html.indexOf('FIN DEL CATÁLOGO DE RESPALDO');
  if (desde === -1 || hasta === -1 || hasta < desde) {
    throw new Error(
      'No encontré el bloque del respaldo en ' + INDEX + '. Tiene que ir desde\n' +
      'la marca "CATÁLOGO DE RESPALDO" hasta "FIN DEL CATÁLOGO DE RESPALDO".\n\n' +
      'Prefiero parar: si esto escribiera igual, la tienda saldría con el\n' +
      'catálogo de la plantilla y nadie se enteraría.');
  }
  /* Hasta el final de la LÍNEA de la marca de cierre, no hasta la marca: así da
     igual que el cierre venga en la forma vieja —un comentario de //— o en la
     nueva. Hay tiendas montadas antes de que esto existiera. */
  let finLinea = html.indexOf('\n', hasta);
  if (finLinea === -1) finLinea = html.length;

  /* Y hacia arriba, las líneas de comentario pegadas a la marca de apertura:
     la forma vieja traía encima una fila de caracteres de dibujo que si no se
     recoge queda ahí, huérfana, en cada montaje. */
  let inicio = html.lastIndexOf('\n', desde) + 1;
  for (;;) {
    const anterior = html.lastIndexOf('\n', inicio - 2) + 1;
    if (anterior >= inicio) break;
    const linea = html.slice(anterior, inicio - 1).trim();
    if (!linea || !(linea.startsWith('//') || linea.startsWith('/*'))) break;
    inicio = anterior;
  }

  const nuevo = bloque(catalogo, cuando);
  const salida = html.slice(0, inicio) + nuevo + html.slice(finLinea);

  /* Que el bloque escrito sea JavaScript válido y declare las tres cosas que la
     página espera. Se comprueba el HECHO —que evalúa y define— y no el texto:
     una comprobación que mira si "dice const PRODUCTOS" pasa igual con el
     archivo roto (patrón 5). */
  let comprobado;
  try {
    comprobado = new Function(nuevo +
      '\n; return { p: PRODUCTOS, e: ENVIOS, c: CONFIG_SEMILLA };')();
  } catch (e) {
    throw new Error('El respaldo que acabo de armar no es JavaScript válido: ' +
                    e.message + '\nNo escribo nada.');
  }
  if (!Array.isArray(comprobado.p) || !comprobado.p.length ||
      !Array.isArray(comprobado.e) || !comprobado.c ||
      typeof comprobado.c !== 'object') {
    throw new Error('El respaldo no declara PRODUCTOS, ENVIOS y CONFIG_SEMILLA. ' +
                    'No escribo nada.');
  }

  return { html: salida, cambio: salida !== html,
           productos: comprobado.p.length, envios: comprobado.e.length,
           negocio: String(comprobado.c.negocio || '') };
}

async function main() {
  let catalogo;
  try {
    catalogo = JSON.parse(await readFile(CATALOGO, 'utf8'));
  } catch (e) {
    throw new Error(
      'No pude leer ' + CATALOGO + ': ' + e.message + '\n\n' +
      'Este paso va DESPUÉS de hornear el catálogo. Sin él, el respaldo de la\n' +
      'tienda se quedaría con el de la plantilla — los productos de otro\n' +
      'comercio— y eso no se ve hasta que Google deja de contestar.');
  }

  const html = await readFile(INDEX, 'utf8');
  const fecha = new Date().toISOString().slice(0, 10);
  const r = aplicar(html, catalogo, fecha);

  if (!r.cambio) {
    console.log('El respaldo de index.html ya es el de esta tienda. Nada que hacer.');
    return;
  }
  if (revisar) {
    console.error('\nEl respaldo de index.html NO es el catálogo de esta tienda.\n');
    console.error('  Corre  node montar/sembrar-respaldo.mjs  y vuelve a subir.\n');
    process.exit(1);
  }

  await writeFile(INDEX, r.html);
  console.log('Respaldo de index.html escrito desde ' + CATALOGO + ':\n');
  console.log('  · ' + r.productos + ' productos y ' + r.envios + ' zonas de envío');
  console.log('  · la tienda se llama ' + (r.negocio || '(sin nombre en la hoja)'));
  console.log('\nEs lo que verá alguien que abra la tienda el día que Google no conteste.');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
