/**
 * ORGÁNICO — poner en la hoja los datos que el técnico ya tiene en la mano
 * ---------------------------------------------------------------------------
 * El paso más aburrido del despliegue era escribir seis celdas en la pestaña
 * Configuración, y el más fácil de dejar a medias. Peor: instalar() siembra
 * esa pestaña con el nombre, el WhatsApp y la dirección del sitio de ORGÁNICO,
 * así que una tienda nueva que no los cambie manda sus pedidos al celular de
 * otro comercio.
 *
 * Esto lo escribe desde fuera, con lo que se le pasó al flujo de montaje:
 *
 *   node montar/sembrar-configuracion.mjs
 *
 * Todo entra por variables de entorno, que en Actions son las entradas del
 * flujo. Lo que no se manda, no se toca:
 *
 *   NEGOCIO   WHATSAPP   SITIO_URL   FOTOS_DRIVE   RESPALDO_CARPETA
 *   CORREO_RESUMEN                        y  FORZAR=si  para pisar lo escrito
 *
 * fotos_origen y fotos_webp no se preguntan: el maestro los deduce de
 * sitio_url y de fotos_drive.
 *
 * NO PISA LO QUE EL COMERCIO ESCRIBIÓ. La puerta solo escribe donde la celda
 * está vacía o donde sigue el valor de fábrica. Si el comercio ya puso lo
 * suyo, esto lo dice y sigue de largo.
 */
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro } from './tienda.mjs';

const CAMPOS = {
  negocio:          'NEGOCIO',
  whatsapp:         'WHATSAPP',
  sitio_url:        'SITIO_URL',
  fotos_drive:      'FOTOS_DRIVE',
  respaldo_carpeta: 'RESPALDO_CARPETA',
  correo_resumen:   'CORREO_RESUMEN'
};

export function loQueSeMando(entorno) {
  const d = {};
  for (const [clave, variable] of Object.entries(CAMPOS)) {
    const v = String(entorno[variable] || '').trim();
    if (v) d[clave] = v;
  }
  if (String(entorno.FORZAR || '').trim().toLowerCase() === 'si') d.forzar = 'si';
  return d;
}

async function main() {
  const tienda = await laTienda();
  const datos = loQueSeMando(process.env);

  const pedidas = Object.keys(datos).filter(k => k !== 'forzar');
  if (!pedidas.length) {
    console.log('No se mandó ningún dato de configuración. La hoja queda como está.');
    return;
  }

  let r;
  try {
    r = await alMaestro(tienda, 'sembrar', datos);
  } catch (e) {
    /* La puerta es nueva. Un repositorio al día contra un maestro viejo da
       este error exacto, y sin esto se lee como si la tienda estuviera caída. */
    if (/Acci[oó]n desconocida: sembrar/i.test(e.message)) {
      throw new Error(
        'El maestro de esta tienda es anterior a la puerta que escribe la\n' +
        'configuración. Publícalo —flujo maestro, o npm run maestro— y vuelve.\n\n' +
        'Mientras tanto, esos datos se escriben a mano en la pestaña\n' +
        'Configuración de la hoja.');
    }
    throw e;
  }

  const lista = (t, xs) => xs.length && console.log('  ' + t + xs.join(', '));
  console.log(`${pedidas.length} dato(s) enviados a la pestaña Configuración.`);
  lista('escritos:      ', r.escritos || []);
  lista('ya estaban:    ', r.iguales || []);
  lista('sin tocar:     ', r.respetados || []);

  if ((r.respetados || []).length) {
    console.log('\n"Sin tocar" quiere decir que el comercio ya escribió algo distinto\n' +
                'ahí y no se le pisa. Para pisarlo hay que pedirlo: FORZAR=si.');
  }
  if ((r.faltan || []).length) {
    console.log('\n⚠ Siguen SIN configurar, y hacen falta:\n  ' + r.faltan.join('\n  '));
    console.log('\n  Sin whatsapp no hay venta, y sin negocio la tienda se anuncia\n' +
                '  como "[NOMBRE DEL COMERCIO]". Los dos vienen así de fábrica a\n' +
                '  propósito: una tienda sin configurar tiene que verse sin configurar.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
