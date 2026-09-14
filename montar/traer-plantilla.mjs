/**
 * ORGÁNICO — traer el index.html de la plantilla al repositorio de la tienda
 * ---------------------------------------------------------------------------
 * Reemplaza `publicar/index.html` por el de la última versión publicada de la
 * semilla, para que el montaje siga escribiendo encima lo de ESTA tienda.
 *
 *   node montar/traer-plantilla.mjs <archivo-descargado>
 *
 * POR QUÉ EXISTE.
 * Actualizar una tienda eran DOS cosas y solo una estaba automatizada. El
 * código lo trae la sincronización; `publicar/index.html` no, porque no es
 * código: es el archivo publicado de ese comercio. Así que la guía decía
 * «traer el archivo nuevo al repositorio de la tienda» — a mano, bajándolo del
 * navegador y pegándolo. Un paso manual en el único sitio donde la premisa del
 * negocio dice que no puede haberlos.
 *
 * Y se veía cuando fallaba: la tienda dos tenía ya los flujos y las baterías de
 * una versión, y el index.html de la anterior. Todo verde, todo al día, y la
 * página seguía pintando el comercio de la plantilla al arrancar.
 *
 * QUÉ SE PIERDE Y POR QUÉ NO IMPORTA.
 * Todo lo que en ese archivo es de esta tienda lo vuelve a escribir el montaje,
 * en los tres pasos que vienen justo después:
 *
 *   preparar-index.mjs    el <head>, las cinco constantes y la paleta
 *   catalogo-estatico.mjs publicar/catalogo.json
 *   sembrar-respaldo.mjs  el catálogo de respaldo y CONFIG_SEMILLA
 *
 * No queda un solo valor de esta tienda que se escriba a mano en ese archivo.
 * Por eso se puede reemplazar entero: lo que se tira se vuelve a poner con lo
 * que diga la hoja, unos segundos después.
 *
 * LA REGLA: O SE REEMPLAZA POR ALGO QUE SIRVE, O NO SE REEMPLAZA.
 * Un `curl` que se trae una página de error de GitHub —o media descarga— y la
 * escribe encima deja la tienda sin sitio. Así que antes de escribir se mira
 * que el archivo sea de verdad la plantilla: que traiga las marcas que el
 * montaje va a buscar después y que sea una página, no un mensaje.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const INDEX = 'publicar/index.html';

/* LO QUE TIENE QUE TRAER PARA SER LA PLANTILLA, y cada cosa está aquí porque un
   paso posterior la busca. Si falta una, ese paso se plantaría más adelante con
   un mensaje sobre otra cosa — y un error que apunta al sitio equivocado cuesta
   más que uno que no dice nada. */
const SEÑAS = [
  { que: '<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->',
    porQue: 'la marca donde termina el <head> que escribe preparar-index.mjs' },
  { que: 'const SCRIPT_URL',
    porQue: 'la primera de las cinco constantes de la tienda' },
  { que: 'FIN DEL CATÁLOGO DE RESPALDO',
    porQue: 'la marca del bloque que escribe sembrar-respaldo.mjs' },
  { que: '--rojo:',
    porQue: 'la paleta del :root, que el montaje repinta con la de esta tienda' },
  /* LA ÚLTIMA ES LA QUE DE VERDAD ATRAPA UNA DESCARGA A MEDIAS, y las otras no.
     Las cuatro de arriba viven en el primer tercio del archivo: media descarga
     las trae todas, pesa sesenta mil bytes y pasaba la revisión entera. Una
     comprobación que contesta lo mismo con el archivo entero y con el archivo
     partido no es una comprobación (patrón 5). El cierre del documento solo
     está si llegó hasta el final. */
  { que: '</html>',
    porQue: 'el cierre del documento: si no está, la descarga se cortó' }
];

export function revisar(html) {
  const faltan = [];
  if (!html || html.length < 20000) {
    faltan.push('el archivo pesa ' + (html ? html.length : 0) + ' bytes, y la ' +
                'plantilla pesa más de veinte mil: esto no es una página, es ' +
                'un mensaje o media descarga');
  }
  if (html && html.indexOf('<html') === -1 && html.indexOf('<!doctype') === -1 &&
      html.indexOf('<!DOCTYPE') === -1) {
    faltan.push('no empieza como un documento HTML');
  }
  SEÑAS.forEach(s => {
    if (html && html.indexOf(s.que) === -1) {
      faltan.push('no trae «' + s.que + '» — ' + s.porQue);
    }
  });
  return faltan;
}

/* De qué versión es lo que hay y lo que llega, para que el pull request lo diga
   en vez de dejar un diff de mil líneas sin explicación. */
export function version(html) {
  const m = String(html || '').match(/CATÁLOGO DE RESPALDO — escrito el ([0-9-]+)/);
  const v = String(html || '').match(/const SCRIPT_VERSION\s*=\s*"([^"]*)"/);
  return { respaldo: m ? m[1] : '(sin fecha)', contrato: v ? v[1] : '(sin versión)' };
}

async function main() {
  const descargado = process.argv[2];
  if (!descargado) {
    throw new Error('Falta el archivo descargado.\n' +
                    '  node montar/traer-plantilla.mjs <archivo>');
  }

  const nuevo = await readFile(descargado, 'utf8');
  const faltan = revisar(nuevo);
  if (faltan.length) {
    throw new Error(
      'Lo que se descargó NO es la plantilla, así que no lo escribo encima de\n' +
      INDEX + '. Dejar la tienda sin sitio es peor que dejarla con la versión\n' +
      'anterior, que funciona.\n\n' +
      faltan.map(x => '  · ' + x).join('\n') + '\n\n' +
      'Suele ser que la release de la semilla no tiene el archivo index.html\n' +
      'entre sus adjuntos, o que este repositorio no puede leerla.');
  }

  let viejo = '';
  try { viejo = await readFile(INDEX, 'utf8'); } catch (e) { /* tienda nueva */ }

  if (viejo === nuevo) {
    console.log('El index.html ya es el de la última versión de la plantilla.');
    console.log('Nada que traer.');
    return;
  }

  await writeFile(INDEX, nuevo);
  const a = version(viejo), b = version(nuevo);
  console.log('index.html traído de la plantilla.\n');
  console.log('  contrato:  ' + a.contrato + '  ->  ' + b.contrato);
  console.log('  respaldo:  ' + a.respaldo + '  ->  ' + b.respaldo +
              '  (se reescribe en este mismo montaje)');
  console.log('');
  console.log('Lo que trae de la semilla es la PÁGINA. Lo de esta tienda —el');
  console.log('<head>, las constantes, la paleta y el catálogo de respaldo— lo');
  console.log('vuelven a escribir los tres pasos que siguen, desde su hoja.');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
