/**
 * ORGÁNICO — ¿la hoja que estoy leyendo es la de ESTA tienda?
 * ---------------------------------------------------------------------------
 *
 *   node montar/misma-tienda.mjs
 *
 * POR QUÉ EXISTE
 * Los flujos publican en el repositorio donde corren, y leen la hoja que digan
 * los secretos `MAESTRO_URL` y `MAESTRO_TOKEN`. Nada comprobaba que las dos
 * cosas fueran de la misma tienda. Montando la segunda pasó lo que tenía que
 * pasar: cambios hechos en una hoja aparecieron publicados en el sitio de la
 * otra.
 *
 * Y el síntoma no apunta a ninguna parte, porque **no falla nada**: el flujo
 * corre en verde, el maestro contesta, las fotos bajan, el catálogo se hornea
 * y Cloudflare despliega. Todas las piezas hacen bien su trabajo con la hoja
 * equivocada. Desde el lado del comercio se ve como «subí una foto y no salió»
 * —salió, en el sitio de al lado—, que es de las quejas más caras de seguir.
 *
 * La hoja ya sabía a qué repositorio pertenece: la clave `repositorio` de
 * Configuración, que usa «Publicar ahora» para saber a quién disparar. Lo que
 * faltaba era mirarla desde el otro lado.
 *
 * NO BLOQUEA SI LA HOJA NO LO DICE. Hay tiendas montadas antes de que esa clave
 * existiera; a esas se les avisa y se sigue. Bloquear a quien no puede
 * contestar convierte un guardia en una puerta cerrada.
 */
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro } from './tienda.mjs';

const limpio = s => String(s || '').trim().replace(/^https?:\/\/github\.com\//i, '')
                     .replace(/\.git$/i, '').replace(/\/+$/, '').toLowerCase();

export function veredicto(dice, aqui) {
  const a = limpio(dice), b = limpio(aqui);
  if (!b) return { estado: 'sin-contexto' };   // corriendo fuera de Actions
  if (!a) return { estado: 'sin-declarar' };
  return { estado: a === b ? 'coinciden' : 'otra-tienda', dice: a, aqui: b };
}

async function main() {
  const tienda = await laTienda();
  const id = await alMaestro(tienda, 'identidad');
  const r = veredicto(id.repositorio, process.env.GITHUB_REPOSITORY);

  if (r.estado === 'otra-tienda') {
    console.error(
      '\nESTA HOJA NO ES LA DE ESTE REPOSITORIO.\n\n' +
      '  La hoja dice que su sitio es:  ' + r.dice + '\n' +
      '  Este flujo está corriendo en:  ' + r.aqui + '\n' +
      '  Negocio en la hoja:            ' + (id.negocio || '(sin nombre)') + '\n\n' +
      'No se publica nada. Si se publicara, los cambios de un comercio\n' +
      'saldrían en la tienda de otro, y en verde.\n\n' +
      'Una de estas dos cosas está mal, y hay que decidir CUÁL:\n\n' +
      '  · Los secretos MAESTRO_URL y MAESTRO_TOKEN de ' + r.aqui + '\n' +
      '    apuntan a la hoja equivocada  ->  Settings > Secrets and variables\n' +
      '    > Actions, y se corrigen ahí.\n\n' +
      '  · O la hoja tiene mal su clave «repositorio»  ->  pestaña\n' +
      '    Configuración, fila repositorio: ' + r.aqui + '\n\n' +
      'Mira también a qué repositorio está conectado el proyecto de Cloudflare\n' +
      'que sirve este sitio: es el tercer sitio donde se pueden cruzar.\n');
    process.exit(1);
  }

  if (r.estado === 'sin-declarar') {
    console.log('La hoja de «' + (id.negocio || 'esta tienda') + '» no dice a qué ' +
                'repositorio pertenece.');
    console.log('  Escríbelo en Configuración > repositorio: ' + r.aqui);
    console.log('  Se sigue igual, pero sin ese dato nadie puede comprobar que ' +
                'esta hoja\n  y este repositorio son la misma tienda.');
    return;
  }

  if (r.estado === 'sin-contexto') {
    console.log('Fuera de Actions no hay con qué comparar. Nada que comprobar.');
    return;
  }

  console.log('Misma tienda: «' + (id.negocio || '?') + '» · ' + r.aqui);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
