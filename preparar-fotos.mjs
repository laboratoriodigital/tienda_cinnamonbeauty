/**
 * ORGÁNICO — preparar las fotos para publicar
 * ---------------------------------------------------------------------------
 * Capa 1 -> Capa 2.  Toma los originales pesados y escribe, junto al sitio,
 * las versiones que de verdad se sirven: WebP en los tres tamaños que usa la
 * tienda, más el original reducido como respaldo.
 *
 * Existe para recuperar lo que se pierde al no usar un proveedor de
 * transformación: f_auto y q_auto, o sea el formato moderno y la calidad
 * ajustada. Aquí eso se resuelve una vez, en el montaje, en vez de en cada
 * visita.
 *
 * USO
 *   npm i sharp          (una vez, en esta carpeta)
 *   node preparar-fotos.mjs
 *
 *   originales/chonto-1.jpg  ->  publicar/fotos/chonto-1-160.webp
 *                                publicar/fotos/chonto-1-600.webp
 *                                publicar/fotos/chonto-1-900.webp
 *                                publicar/fotos/chonto-1.jpg   (respaldo)
 *
 * En la hoja se sigue escribiendo el nombre lógico: chonto-1.jpg
 * Y en Configuración se pone  fotos_webp = Sí
 * ---------------------------------------------------------------------------
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const ORIGEN  = process.argv[2] || 'originales';
const DESTINO = process.argv[3] || join('publicar', 'fotos');

// Los mismos tres que usa la tienda: miniatura, tarjeta y galería.
const ANCHOS = [160, 600, 900];
const CALIDAD = 82;
const ACEPTADAS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error('Falta sharp. Instálalo en esta carpeta:\n\n    npm i sharp\n');
  process.exit(1);
}

const kb = n => Math.round(n / 1024) + ' KB';

async function main() {
  let archivos;
  try {
    archivos = (await readdir(ORIGEN)).filter(f => ACEPTADAS.has(extname(f).toLowerCase()));
  } catch {
    console.error(`No encuentro la carpeta "${ORIGEN}".\n` +
                  'Pon ahí los originales, o pásame la ruta:\n\n' +
                  '    node preparar-fotos.mjs ruta/a/originales\n');
    process.exit(1);
  }
  if (!archivos.length) {
    console.error(`"${ORIGEN}" no tiene imágenes.`);
    process.exit(1);
  }

  await mkdir(DESTINO, { recursive: true });
  console.log(`${archivos.length} originales  ->  ${DESTINO}\n`);

  let entra = 0, sale = 0, hechos = 0;

  for (const archivo of archivos) {
    const ruta = join(ORIGEN, archivo);
    const raiz = basename(archivo, extname(archivo));
    const original = (await stat(ruta)).size;
    entra += original;

    const img = sharp(ruta).rotate();          // respeta la orientación EXIF
    const meta = await img.metadata();
    const pesos = [];

    for (const ancho of ANCHOS) {
      // No agrandamos: una foto de 400 px no mejora estirada a 900.
      const w = Math.min(ancho, meta.width || ancho);
      const destino = join(DESTINO, `${raiz}-${ancho}.webp`);
      const info = await sharp(ruta).rotate()
        .resize(w, w, { fit: 'cover', position: 'attention' })
        .webp({ quality: CALIDAD })
        .toFile(destino);
      pesos.push(`${ancho}:${kb(info.size)}`);
      sale += info.size;
    }

    // El respaldo con el nombre lógico, que es el que va en la hoja.
    const respaldo = join(DESTINO, `${raiz}.jpg`);
    const info = await sharp(ruta).rotate()
      .resize(Math.min(900, meta.width || 900), null, { withoutEnlargement: true })
      .jpeg({ quality: CALIDAD, mozjpeg: true })
      .toFile(respaldo);
    sale += info.size;

    hechos++;
    console.log(`  ${archivo.padEnd(28)} ${kb(original).padStart(8)}  ->  ${pesos.join('  ')}`);
  }

  const ahorro = entra ? Math.round((1 - sale / entra) * 100) : 0;
  console.log(`\n${hechos} productos · ${kb(entra)} de originales -> ${kb(sale)} publicados` +
              (ahorro > 0 ? `  (${ahorro}% menos)` : ''));
  console.log('\nFalta un paso: en la hoja, Configuración > fotos_webp = Sí');
}

main().catch(e => { console.error('\nFalló: ' + e.message); process.exit(1); });
