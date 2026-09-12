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
   una foto es alto; el de las demás llamadas, corto, porque contestan rápido o
   no contestan. */
const ESPERA = { foto: 180000, otras: 45000 };

/** Una llamada al maestro, con los errores dichos en cristiano. */
export async function alMaestro({ url, token }, accion, extra = {}) {
  const q = new URLSearchParams({ a: accion, t: token, ...extra });
  const tope = accion === 'foto' ? ESPERA.foto : ESPERA.otras;
  let r;
  try {
    r = await fetch(url + '?' + q, { redirect: 'follow',
                                     signal: AbortSignal.timeout(tope) });
  } catch (e) {
    /* Un plantón se nombra como lo que es. «fetch failed» a secas mandaba a
       buscar un problema de red que casi nunca era el problema. */
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      throw new Error(
        'El maestro no contestó en ' + Math.round(tope / 1000) + ' segundos ' +
        'a la petición «' + accion + '»' +
        (extra.id ? ' (id ' + extra.id + ')' : '') + '.\n' +
        'Si es una foto, casi siempre es que pesa demasiado para que Apps ' +
        'Script la entregue: bájala de tamaño en el Drive y vuelve a correr.');
    }
    throw new Error('No pude hablar con el maestro: ' + e.message);
  }
  if (r.status === 404) {
    throw new Error(
      'El maestro respondió 404. Casi siempre es que la implementación quedó ' +
      'con acceso "Solo yo": Implementar > Gestionar implementaciones > lápiz ' +
      '> Quién tiene acceso: Cualquier persona.');
  }
  if (!r.ok) throw new Error('El maestro respondió ' + r.status + '.');

  const texto = await r.text();
  let d;
  try { d = JSON.parse(texto); }
  catch { throw new Error('El maestro no devolvió JSON. Primeros caracteres:\n' +
                          texto.slice(0, 200)); }
  if (!d.ok) throw new Error(d.error || 'El maestro respondió sin ok.');
  return d;
}
