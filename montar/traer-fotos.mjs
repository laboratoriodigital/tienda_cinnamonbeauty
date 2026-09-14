/**
 * ORGÁNICO — traer las fotos del Drive del comercio y dejarlas publicables
 * ---------------------------------------------------------------------------
 * Cierra el único tramo de las tres capas que hasta hoy hacía una persona:
 * copiar de Drive a originales/ y correr la conversión.
 *
 *   node montar/traer-fotos.mjs
 *   node montar/traer-fotos.mjs --revisar    (no escribe; dice si hay novedades)
 *
 * El comercio sube su foto a su carpeta de Drive con el nombre que va en la
 * hoja —chonto-1.jpg— y no hace nada más.
 *
 * QUÉ SE VERSIONA Y POR QUÉ
 * publicar/fotos/origen.json guarda, por cada foto, de qué archivo de Drive
 * salió y de qué fecha. Ese archivo SÍ va al repositorio: es lo que permite
 * saber qué cambió sin tener que bajar todo otra vez, y es lo que hace que
 * esto funcione igual en tu máquina que en un flujo automático, donde
 * originales/ no existe.
 */
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro } from './tienda.mjs';

const ORIGINALES = 'originales';
const PUBLICADAS = join('publicar', 'fotos');
const REGISTRO   = join(PUBLICADAS, 'origen.json');
const ANCHOS  = [160, 600, 900];
const CALIDAD = 82;
const revisar = process.argv.includes('--revisar');

const kb = n => Math.round(n / 1024) + ' KB';

async function leerRegistro() {
  try { return JSON.parse(await readFile(REGISTRO, 'utf8')); }
  catch { return {}; }
}

/* Qué hay que bajar: lo que no está, y lo que en Drive es más nuevo que la
   última vez que se convirtió. Comparar por fecha y no por tamaño porque el
   comercio puede reemplazar una foto por otra que pese casi igual. */
function novedades(archivos, registro) {
  const nuevas = archivos.filter(a => {
    const r = registro[a.nombre];
    return !r || r.id !== a.id || r.modificado !== a.modificado;
  });
  const enDrive = new Set(archivos.map(a => a.nombre));
  const borradas = Object.keys(registro).filter(n => !enDrive.has(n));
  return { nuevas, borradas };
}

/* `destino` existe para que una batería pueda convertir en una carpeta
   temporal y mirar lo que salió. Sin eso habría que reescribir esta función en
   la prueba, y una copia de la conversión es exactamente lo que NO se puede
   tener: la prueba diría que las fotos salen sin EXIF y estaría comprobando su
   propia copia, no la que se publica. */
async function convertir(sharp, ruta, nombre, destino = PUBLICADAS) {
  const raiz = basename(nombre, extname(nombre));
  const img = sharp(ruta).rotate();              // respeta la orientación EXIF
  const meta = await img.metadata();
  let salida = 0;
  const pesos = [];

  for (const ancho of ANCHOS) {
    // No agrandamos: una foto de 400 px no mejora estirada a 900.
    const w = Math.min(ancho, meta.width || ancho);
    const info = await sharp(ruta).rotate()
      .resize(w, w, { fit: 'cover', position: 'attention' })
      .webp({ quality: CALIDAD })
      .toFile(join(destino, `${raiz}-${ancho}.webp`));
    pesos.push(`${ancho}:${kb(info.size)}`);
    salida += info.size;
  }

  // El respaldo con el nombre lógico, que es el que va en la hoja.
  const info = await sharp(ruta).rotate()
    .resize(Math.min(900, meta.width || 900), null, { withoutEnlargement: true })
    .jpeg({ quality: CALIDAD, mozjpeg: true })
    .toFile(join(destino, `${raiz}.jpg`));
  salida += info.size;

  return { pesos, salida };
}

async function borrarGeneradas(nombre) {
  const raiz = basename(nombre, extname(nombre));
  const todos = await readdir(PUBLICADAS).catch(() => []);
  for (const f of todos) {
    if (f === basename(REGISTRO)) continue;
    if (basename(f, extname(f)).replace(/-\d+$/, '') === raiz) {
      await unlink(join(PUBLICADAS, f)).catch(() => {});
    }
  }
}

/* Los dos errores que comete siempre el comercio, y que fallan en silencio:
   subir una foto que ningún producto nombra, y nombrar en la hoja una que
   nunca subió. La tienda no se rompe en ninguno de los dos casos —la foto
   simplemente no aparece—, y por eso nadie se entera hasta que un cliente
   pregunta. Se avisa aquí, que es donde se puede hacer algo. */
export function desajustes(archivos, usadas) {
  const enDrive = new Set(archivos.map(a => a.nombre));
  return {
    huerfanas: archivos.map(a => a.nombre).filter(n => !usadas.includes(n)),
    nombradas: usadas.filter(n => !enDrive.has(n))
  };
}

async function main() {
  const tienda = await laTienda();
  const { archivos, usadas = [] } = await alMaestro(tienda, 'fotos');
  const registro = await leerRegistro();
  const { nuevas, borradas } = novedades(archivos, registro);

  console.log(`${archivos.length} foto(s) en el Drive del comercio.`);

  const { huerfanas, nombradas } = desajustes(archivos, usadas);
  if (nombradas.length) {
    console.log('\n  ⚠ La hoja nombra fotos que NO están en el Drive.');
    console.log('    Esos productos van a salir con su dibujo en vez de su foto:');
    nombradas.forEach(n => console.log('      · ' + n));
  }
  if (huerfanas.length) {
    console.log('\n  ⚠ En el Drive hay fotos que ningún producto nombra.');
    console.log('    Se publican igual, pero no las va a ver nadie. Revisa que el');
    console.log('    nombre coincida con la columna Imágenes:');
    huerfanas.forEach(n => console.log('      · ' + n));
  }
  if (nombradas.length || huerfanas.length) console.log('');

  if (!nuevas.length && !borradas.length) {
    /* «Todo al día» y «no encontré tu carpeta» se veían IGUAL, y son cosas
       distintas: la primera es que no hay nada que hacer y la segunda es que
       el comercio subió dos fotos y no llegaron. Ahora la respuesta trae
       consigo lo que miró. */
    console.log('Todo al día. Nada que bajar.');
    console.log('  · ' + archivos.length + ' foto(s) en la carpeta de Drive del comercio');
    console.log('  · ' + Object.keys(registro).length + ' ya publicadas y sin cambios');
    if (!archivos.length) {
      console.log('');
      console.log('  ⚠ LA CARPETA DE DRIVE ESTÁ VACÍA para el maestro.');
      console.log('    Si acabas de subir fotos ahí, revisa que sea la carpeta que');
      console.log('    dice Configuración > fotos_drive, y que estén compartidas con');
      console.log('    la cuenta de la tienda. Formatos que se aceptan: JPG, PNG y WebP.');
    }
    return;
  }

  if (revisar) {
    console.error('\nHay fotos sin publicar.\n');
    nuevas.forEach(a => console.error('  + ' + a.nombre));
    borradas.forEach(n => console.error('  - ' + n + ' (ya no está en Drive)'));
    console.error('\nCorre  npm run fotos:drive  y vuelve a subir.\n');
    process.exit(1);
  }

  let sharp;
  try { ({ default: sharp } = await import('sharp')); }
  catch {
    console.error('Falta sharp. Instálalo en esta carpeta:\n\n    npm i sharp\n');
    process.exit(1);
  }

  await mkdir(ORIGINALES, { recursive: true });
  await mkdir(PUBLICADAS, { recursive: true });

  for (const nombre of borradas) {
    await borrarGeneradas(nombre);
    delete registro[nombre];
    console.log(`  - ${nombre}  (borrada de Drive, se quita del sitio)`);
  }

  /* UNA FOTO DEMASIADO GRANDE SE RECHAZA ANTES DE PEDIRLA, y por su nombre.
     El maestro la entrega en base64 dentro de un JSON, que la infla un tercio,
     y Apps Script tiene su propio techo. Pedirla igual gasta minutos para
     terminar en un plantón que no dice cuál era. Diez megas es de sobra para
     una foto de producto: las que se publican acaban pesando kilobytes. */
  const TOPE_FOTO = 10 * 1024 * 1024;
  const pesadas = nuevas.filter(a => a.bytes > TOPE_FOTO);
  if (pesadas.length) {
    console.error('\nEstas fotos pesan demasiado para bajarlas por el maestro:');
    pesadas.forEach(a => console.error(`  · ${a.nombre}  ${kb(a.bytes)}`));
    console.error('\nEn el Drive, vuelve a exportarlas por debajo de 10 MB. Una foto ' +
                  'de producto\nno necesita más: las que se publican acaban pesando ' +
                  'kilobytes.\n');
    process.exit(1);
  }

  /* SE ANUNCIA ANTES, NO SOLO DESPUÉS. Mientras la línea se escribía al
     terminar, un fallo a mitad dejaba un log que acababa en la foto ANTERIOR:
     la que reventó no aparecía por ninguna parte. Ahora la última línea del
     log es siempre la que se estaba bajando. */
  let van = 0;
  for (const a of nuevas) {
    van++;
    console.log(`  · [${van}/${nuevas.length}] bajando ${a.nombre}  (${kb(a.bytes)})`);
    const foto = await alMaestro(tienda, 'foto', { id: a.id });
    const ruta = join(ORIGINALES, a.nombre);
    await writeFile(ruta, Buffer.from(foto.contenido, 'base64'));

    const { pesos, salida } = await convertir(sharp, ruta, a.nombre);
    registro[a.nombre] = { id: a.id, modificado: a.modificado, bytes: a.bytes };
    console.log(`  + ${a.nombre.padEnd(26)} ${kb(a.bytes).padStart(8)}  ->  ${pesos.join('  ')}` +
                `   (${kb(salida)})`);
  }

  // Ordenado por nombre para que el diff del repositorio sea legible y no
  // cambie de orden cada vez que Drive devuelve las cosas en otro orden.
  const ordenado = {};
  Object.keys(registro).sort().forEach(k => { ordenado[k] = registro[k]; });
  await writeFile(REGISTRO, JSON.stringify(ordenado, null, 2) + '\n');

  console.log(`\n${nuevas.length} bajada(s), ${borradas.length} quitada(s).`);
  if (nuevas.length) {
    console.log('En la hoja, la columna Imágenes se escribe con el nombre tal cual: ' +
                nuevas[0].nombre);
  }
}

/* pathToFileURL y no una plantilla `file://…`: en Windows argv[1] llega como
   D:\CoWork\… y la comparación NUNCA coincide, así que el script se cargaba,
   no ejecutaba nada y salía con código 0. Un fallo silencioso que parece que
   funcionó. */
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}

export { novedades, convertir, ANCHOS };
