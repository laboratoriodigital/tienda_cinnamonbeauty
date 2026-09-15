/**
 * ORGÁNICO — de dónde salen la URL y el token de la tienda
 * ---------------------------------------------------------------------------
 * Lo comparten las herramientas de montaje. Busca, en este orden:
 *
 *   1. Las variables de entorno MAESTRO_URL y MAESTRO_TOKEN.
 *      Es lo que se usa en un flujo automático, con secretos del repositorio.
 *   2. El archivo tienda.json en la raíz, que NO se versiona.
 *      Es lo que se usa en tu máquina.
 *
 * El token no es un secreto fuerte —el comercio lo puede leer en su propio
 * stub— pero tampoco tiene por qué quedar en el historial de Git, así que el
 * archivo está en .gitignore y nunca se escribe desde aquí.
 */
import { readFile } from 'node:fs/promises';

export async function laTienda() {
  let url = process.env.MAESTRO_URL || '';
  let token = process.env.MAESTRO_TOKEN || '';

  if (!url || !token) {
    try {
      const j = JSON.parse(await readFile('tienda.json', 'utf8'));
      url = url || j.maestro || j.url || '';
      token = token || j.token || '';
    } catch { /* que hable el mensaje de abajo */ }
  }

  if (!url || !token) {
    console.error(
      '\nNo sé a qué tienda apuntar.\n\n' +
      'En tu máquina, crea tienda.json en la raíz (no se versiona):\n\n' +
      '    {\n' +
      '      "maestro": "https://script.google.com/macros/s/AAA.../exec",\n' +
      '      "token":   "tk-..."\n' +
      '    }\n\n' +
      'Los dos datos salen del menú de la hoja > Diagnóstico, bajo\n' +
      '"PARA EL PANEL DE TIENDAS".\n\n' +
      'En un flujo automático, con las variables MAESTRO_URL y MAESTRO_TOKEN.\n');
    process.exit(1);
  }

  if (!/\/exec$/.test(url)) {
    console.error('\nLa URL tiene que terminar en /exec. La /dev solo funciona ' +
                  'para el dueño del proyecto.\n\n    ' + url + '\n');
    process.exit(1);
  }

  return { url: url.replace(/\?.*$/, ''), token };
}

/* CUÁNTO SE ESPERA ANTES DE DARSE POR VENCIDO.
   `fetch` sin señal espera para siempre. El flujo `fotos` se cayó una vez tras
   5 minutos exactos en «Bajarlas y convertirlas» y no dejó ni una línea que
   dijera en qué se había quedado: cinco minutos de silencio y un rojo. Apps
   Script se toma su tiempo entregando una foto en base64, así que el tope de
   una foto es alto; el de las demás, más corto.

   PERO «CORTO» ERAN 45 SEGUNDOS Y NO ALCANZABAN EL DÍA QUE MÁS FALTA HACÍA.
   Montando la segunda tienda, `?a=bloques` contestó bien desde
   publicar-maestro.mjs y, segundos después, se plantó en 45 s desde
   preparar-index.mjs. No era la tienda: era que Apps Script está FRÍO. La
   primera llamada después de actualizar una implementación —y las primeras de
   una cuenta recién creada— tardan lo suyo, y ese es justo el momento del
   montaje en que se hacen.

   Así que el tope sube y, sobre todo, SE REINTENTA: un plantón en frío no es
   un fallo, es la primera vez. Lo que no se hace es esperar en silencio; cada
   intento dice cuánto lleva. */
const ESPERA = { foto: 180000, otras: 90000 };
const REINTENTOS = 2;

/* LO QUE NO SE REINTENTA, Y POR QUÉ.
   Un plantón no dice si la petición no llegó o si llegó y la respuesta se
   perdió. Para una LECTURA da igual: se vuelve a preguntar. Para algo que
   ESCRIBE, no: reintentar puede escribir dos veces.
   `sembrar` es la única que escribe en la hoja desde aquí. Hoy da la
   casualidad de que es idempotente —pone las mismas claves— pero apoyarse en
   esa casualidad es exactamente cómo se cuela un doble registro el día que
   deje de serlo. */
export const SIN_REINTENTO = ['sembrar'];

/* Cuando una llamada tarda de verdad, que se vea. Este número —«contestó en
   38 s»— es el que habría explicado el plantón de la segunda tienda en un
   vistazo, y no estaba en ninguna parte. */
const RUIDOSA_DESDE = 5000;

/* Las tres decisiones del plantón, sueltas y probables de verdad. Estaban
   metidas dentro de `alMaestro`, que necesita un servidor y noventa segundos
   para ejercitarse; así una batería puede preguntar por la política sin
   montar una tienda. La que estuvo mal fue la tercera. */
export const topeDe      = accion => accion === 'foto' ? ESPERA.foto : ESPERA.otras;
export const seReintenta = accion => SIN_REINTENTO.indexOf(accion) === -1;

export function mensajeDePlanton(accion, extra = {}) {
  return 'El maestro no contestó en ' + Math.round(topeDe(accion) / 1000) +
    ' segundos a la petición «' + accion + '»' +
    (seReintenta(accion) ? ', ni al reintentar.\n'
                         : '. No se reintenta porque escribe en la hoja.\n') +
    /* EL CONSEJO TIENE QUE SER DE LO QUE FALLÓ. Este mensaje hablaba de fotos
       que pesan demasiado SIEMPRE, dijera lo que dijera la acción: en un
       plantón de «bloques» mandaba a buscar una foto grande que no existía. */
    (accion === 'foto'
      ? 'Casi siempre es que la foto' + (extra.id ? ' (id ' + extra.id + ')' : '') +
        ' pesa demasiado para que Apps Script\nla entregue en base64: bájala ' +
        'de tamaño en el Drive y vuelve a correr.'
      : 'Con «' + accion + '» casi nunca es la red. Las dos causas:\n' +
        '  · La implementación quedó con acceso «Solo yo»: entonces la /exec\n' +
        '    devuelve la pantalla de inicio de sesión de Google y se queda ahí.\n' +
        '    Implementar > Gestionar implementaciones > lápiz > Quién tiene\n' +
        '    acceso: Cualquier persona.\n' +
        '  · O el script se quedó colgado: ábrelo y mira Ejecuciones.');
}

/* QUÉ ACCIONES HA CONTESTADO YA CADA MAESTRO EN ESTA CORRIDA. No es una caché
   —no se reutiliza ninguna respuesta— : es lo que le permite a un error decir
   «esto ya está descartado» en vez de mandar a revisar algo que funciona. */
const RESPONDIO = new Map();

/** Una llamada al maestro, con los errores dichos en cristiano. */
export async function alMaestro({ url, token }, accion, extra = {}) {
  const q = new URLSearchParams({ a: accion, t: token, ...extra });
  const tope = topeDe(accion);
  let r;
  for (let intento = 1; ; intento++) {
    const arranque = Date.now();
    try {
      r = await fetch(url + '?' + q, { redirect: 'follow',
                                       signal: AbortSignal.timeout(tope) });
      const tardo = Date.now() - arranque;
      if (tardo >= RUIDOSA_DESDE) {
        console.log('  · «' + accion + '» contestó en ' + Math.round(tardo / 1000) +
                    ' s' + (intento > 1 ? ' (intento ' + intento + ')' : '') + '.');
      }
      break;
    } catch (e) {
      /* Un plantón se nombra como lo que es. «fetch failed» a secas mandaba a
         buscar un problema de red que casi nunca era el problema. */
      const planton = e.name === 'TimeoutError' || e.name === 'AbortError';
      if (planton && intento < REINTENTOS && seReintenta(accion)) {
        console.log('  · «' + accion + '» no contestó en ' + Math.round(tope / 1000) +
                    ' s. Apps Script suele estar frío justo después de publicar; ' +
                    'reintento ' + (intento + 1) + ' de ' + REINTENTOS + '…');
        continue;
      }
      if (planton) throw new Error(mensajeDePlanton(accion, extra));
      throw new Error('No pude hablar con el maestro: ' + e.message);
    }
  }
  if (r.status === 404) {
    /* EL CONSEJO TIENE QUE SER DE LO QUE FALLÓ, Y NO CONTRADECIR LO QUE YA SE
       VIO FUNCIONAR. Este mensaje decía siempre «casi seguro la implementación
       quedó con acceso Solo yo» — y en la tienda tres salió DESPUÉS de que el
       mismo maestro, en la misma corrida, hubiera contestado «identidad»,
       «bloques» y «fotos». Con acceso «Solo yo» no habría contestado ninguna.
       El técnico se fue a mirar una implementación que estaba bien.
       Así que el diagnóstico solo se ofrece cuando no está ya descartado. */
    const yaContesto = RESPONDIO.has(url);
    throw new Error(
      'El maestro respondió 404 a «' + accion + '»' +
      (extra.id ? ' (id ' + extra.id + ')' : '') + '.\n\n' +
      (yaContesto
        ? 'NO es la implementación: este mismo maestro ya contestó bien en esta\n' +
          'corrida (' + [...RESPONDIO.get(url)].join(', ') + '). Un 404 en UNA\n' +
          'acción y no en las otras es casi siempre una de dos:\n' +
          '  · Apps Script sirve los datos desde script.googleusercontent.com,\n' +
          '    por una redirección que CADUCA. Una respuesta grande o lenta\n' +
          '    —una foto, un catálogo largo— llega a pedirla tarde y se\n' +
          '    encuentra un 404. Volver a correr suele bastar.\n' +
          '  · O lo que se pidió ya no está: una foto borrada del Drive que la\n' +
          '    hoja todavía nombra.\n\n' +
          'Mira la pestaña Errores de la hoja y las Ejecuciones del proyecto.'
        : 'Ninguna acción ha contestado todavía en esta corrida, así que lo\n' +
          'primero a descartar es el acceso de la implementación:\n' +
          'Implementar > Gestionar implementaciones > lápiz > Quién tiene\n' +
          'acceso: Cualquier persona.'));
  }
  /* Lo que SÍ contestó, para que el mensaje de arriba pueda descartar. */
  if (!RESPONDIO.has(url)) RESPONDIO.set(url, new Set());
  RESPONDIO.get(url).add(accion);
  if (!r.ok) throw new Error('El maestro respondió ' + r.status + '.');

  const texto = await r.text();
  let d;
  try { d = JSON.parse(texto); }
  catch { throw new Error('El maestro no devolvió JSON. Primeros caracteres:\n' +
                          texto.slice(0, 200)); }
  if (!d.ok) throw new Error(d.error || 'El maestro respondió sin ok.');
  return d;
}
