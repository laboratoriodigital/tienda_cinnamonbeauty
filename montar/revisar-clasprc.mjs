/**
 * ORGÁNICO — ¿lo que hay en el secreto CLASPRC son credenciales?
 * ---------------------------------------------------------------------------
 *
 *   node montar/revisar-clasprc.mjs        (lee el secreto de $CLASPRC)
 *
 * POR QUÉ EXISTE
 * Montando la segunda tienda, el flujo `montaje` murió con «No credentials
 * found» después de instalar clasp, y el mensaje de error que imprimía nuestra
 * herramienta listaba «las dos causas de siempre» —cuenta equivocada, API sin
 * habilitar—. **No era ninguna de las dos.**
 *
 * Lo que había pasado es una confusión de dos archivos que se llaman casi
 * igual, y que no tienen nada que ver:
 *
 *   ~/.clasprc.json   LAS CREDENCIALES. Lo escribe `clasp login` en la CARPETA
 *                     PERSONAL —en Windows, C:\Users\<usuario>\— y NUNCA en la
 *                     carpeta del proyecto. Esto es lo que va en el secreto.
 *
 *   .clasp.json       A QUÉ PROYECTO se sube: { scriptId, rootDir }. No es un
 *                     secreto, no lleva credenciales, y en Actions ni se usa
 *                     —el scriptId llega por el secreto SCRIPT_ID—.
 *
 * Como `clasp login` no deja nada visible en la carpeta del proyecto, es
 * natural pensar que falló y buscar «el archivo de clasp» que sí se ve. Ese es
 * el otro. Y pegado en el secreto, clasp dice «No credentials found», que es
 * cierto y no ayuda: la pregunta no es dónde están las credenciales, es qué es
 * lo que hay en su lugar.
 *
 * Un fallo que manda a mirar al sitio equivocado cuesta una tarde. Este archivo
 * mira el contenido y lo dice.
 */
import { pathToFileURL } from 'node:url';

/** Qué es lo que hay ahí. No valida el token: mira la FORMA. */
export function queEs(texto) {
  const crudo = String(texto || '').trim();
  if (!crudo) return { tipo: 'vacio' };

  let d;
  try { d = JSON.parse(crudo); }
  catch (e) { return { tipo: 'no-es-json', detalle: e.message }; }
  if (!d || typeof d !== 'object') return { tipo: 'no-es-json', detalle: 'no es un objeto' };

  // Lo que escribe clasp 3: { tokens: { default: {...} } }
  if (d.tokens && typeof d.tokens === 'object') {
    const usuarios = Object.keys(d.tokens);
    const cual = d.tokens.default || d.tokens[usuarios[0]];
    if (cual && cual.refresh_token) return { tipo: 'credenciales', version: 3, usuarios };
    return { tipo: 'sin-refresh', version: 3, usuarios };
  }
  // Las dos formas viejas que clasp 3 todavía acepta.
  if (d.token && d.oauth2ClientSettings) {
    return d.token.refresh_token ? { tipo: 'credenciales', version: 1 }
                                 : { tipo: 'sin-refresh', version: 1 };
  }
  if (d.access_token || d.refresh_token) {
    return d.refresh_token ? { tipo: 'credenciales', version: 1 } : { tipo: 'sin-refresh', version: 1 };
  }
  // El error que de verdad se cometió.
  if (d.scriptId) return { tipo: 'es-el-clasp-json', scriptId: String(d.scriptId) };

  return { tipo: 'desconocido', claves: Object.keys(d).slice(0, 6) };
}

const AYUDA_LOGIN =
  '\nCÓMO SACARLO BIEN, con la cuenta de Google de ESTA tienda:\n\n' +
  '  1. clasp login          (autoriza en el navegador)\n' +
  '  2. Abre el archivo que acaba de escribir en tu CARPETA PERSONAL:\n' +
  '       Windows   C:\\Users\\<tu usuario>\\.clasprc.json\n' +
  '       Mac/Linux ~/.clasprc.json\n' +
  '  3. Pega su contenido ENTERO en el secreto CLASPRC del repositorio.\n\n' +
  'No busques ese archivo en la carpeta del proyecto: `clasp login` no deja\n' +
  'nada ahí, y por eso parece que no funcionó.\n';

export function veredicto(texto) {
  const r = queEs(texto);
  switch (r.tipo) {
    case 'credenciales':
      return { ok: true, mensaje: 'Credenciales de clasp (formato v' + r.version + ').' };

    case 'es-el-clasp-json':
      return { ok: false, mensaje:
        'EL SECRETO CLASPRC TIENE UN .clasp.json, NO LAS CREDENCIALES.\n\n' +
        'Lo que hay ahí es el archivo que dice a qué proyecto subir:\n' +
        '  { "scriptId": "' + r.scriptId.slice(0, 20) + '…" }\n\n' +
        'Son dos archivos distintos con nombres casi iguales:\n\n' +
        '  .clasp.json      a qué proyecto se sube. NO es un secreto, y en\n' +
        '                   Actions ni se usa: el scriptId va en SCRIPT_ID.\n' +
        '  ~/.clasprc.json  las credenciales. Esto es lo que va en CLASPRC.\n' +
        AYUDA_LOGIN };

    case 'vacio':
      return { ok: false, mensaje: 'El secreto CLASPRC está vacío.\n' + AYUDA_LOGIN };

    case 'no-es-json':
      return { ok: false, mensaje:
        'El secreto CLASPRC no es un JSON válido (' + r.detalle + ').\n\n' +
        'Casi siempre es que se pegó a medias, o con comillas de más.\n' +
        AYUDA_LOGIN };

    case 'sin-refresh':
      return { ok: false, mensaje:
        'El secreto CLASPRC tiene forma de credenciales pero le falta el\n' +
        'refresh_token, que es el único que sobrevive a la hora siguiente.\n\n' +
        'Vuelve a correr `clasp login` y pega el archivo otra vez, entero.\n' +
        AYUDA_LOGIN };

    default:
      return { ok: false, mensaje:
        'El secreto CLASPRC es un JSON, pero no se parece a unas credenciales\n' +
        'de clasp. Claves que trae: ' + (r.claves || []).join(', ') + '\n' +
        AYUDA_LOGIN };
  }
}

function main() {
  const r = veredicto(process.env.CLASPRC);
  if (!r.ok) { console.error('\n' + r.mensaje); process.exit(1); }
  console.log(r.mensaje);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
