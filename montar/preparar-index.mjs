/**
 * ORGÁNICO — escribir la configuración de la tienda en index.html
 * ---------------------------------------------------------------------------
 * Reemplaza el paso de "menú de la hoja > Generar configuración > copiar > pegar".
 * Le pregunta al maestro cómo debe quedar el <head> y las cinco constantes, y
 * lo deja escrito.
 *
 *   node montar/preparar-index.mjs
 *   node montar/preparar-index.mjs --revisar    (no escribe; falla si hay diferencia)
 *
 * DOS REGLAS QUE NO SE NEGOCIAN
 * 1. O se aplica todo, o no se aplica nada. Si un solo reemplazo no encuentra
 *    su sitio, el archivo se queda como estaba. Un index a medias es peor que
 *    un index viejo: el viejo funciona.
 * 2. Si el maestro no contesta, esto FALLA en vez de escribir algo vacío. Una
 *    tienda publicada con SCRIPT_URL en blanco es una tienda muerta.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro } from './tienda.mjs';

const ARCHIVO = 'publicar/index.html';
const revisar = process.argv.includes('--revisar');

/* Cada constante se reemplaza por su nombre, no por su posición ni dentro de un
   bloque: así el archivo conserva sus comentarios y el orden que tenga. */
const CONSTANTES = [
  { clave: 'SCRIPT_URL',     busca: /const SCRIPT_URL\s*=\s*"[^"]*";/,
    pon: v => `const SCRIPT_URL = "${v}";` },
  { clave: 'SCRIPT_VERSION', busca: /const SCRIPT_VERSION\s*=\s*"[^"]*";/,
    pon: v => `const SCRIPT_VERSION = "${v}";` },
  { clave: 'FOTOS_HOSTS',    busca: /const FOTOS_HOSTS\s*=\s*\[[^\]]*\];/,
    pon: v => `const FOTOS_HOSTS = [${v.map(h => `"${h}"`).join(', ')}];` },
  { clave: 'NEGOCIO',        busca: /let\s+NEGOCIO\s*=\s*"[^"]*";/,
    pon: v => `let NEGOCIO  = "${v}";` },
  { clave: 'WHATSAPP',       busca: /let\s+WHATSAPP\s*=\s*"[^"]*";/,
    pon: v => `let WHATSAPP = "${v}";` }
];

/* El <head> generado empieza en la política de seguridad y termina en su
   propia marca de cierre. Las dos marcas las escribe el maestro, así que el
   contrato está en un solo lado. */
const HEAD = /<meta http-equiv="Content-Security-Policy"[\s\S]*?<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->/;

/* Cada constante que falta, falta por su propia razón, y decir la de
   SCRIPT_URL para todas mandaba al técnico al sitio equivocado. */
function faltaEso(clave) {
  if (clave === 'SCRIPT_URL') {
    return 'El maestro no me dio SCRIPT_URL: falta publicar el proyecto.\n' +
           'Implementar > Aplicación web, y después abrir esa URL una vez.';
  }
  if (clave === 'WHATSAPP') {
    return 'La hoja no tiene whatsapp, y sin eso no hay venta: el botón de la\n' +
           'tienda no lleva a ninguna parte.\n\n' +
           'Viene vacío de fábrica A PROPÓSITO. Un número de fábrica es el peor\n' +
           'valor posible, porque funciona: la tienda queda mandándole los\n' +
           'pedidos al teléfono de otro y nadie se entera.\n\n' +
           'Ponlo en la pestaña Configuración, o pásalo al flujo montaje.';
  }
  if (clave === 'NEGOCIO') {
    return 'La hoja no tiene negocio, y ese nombre va en la portada, en el pie,\n' +
           'en el consentimiento de datos y en el menú de la propia hoja.';
  }
  return 'El maestro no me dio ' + clave + '.';
}

export function aplicar(html, datos) {
  const cambios = [];
  let salida = html;

  if (!HEAD.test(salida)) {
    throw new Error(
      'No encontré el bloque del <head> en ' + ARCHIVO + '. Tiene que ir desde ' +
      'la etiqueta Content-Security-Policy hasta el comentario ' +
      '"FIN DE LA CONFIGURACIÓN". Si lo borraste, pégalo una vez a mano desde ' +
      'el menú de la hoja y esto vuelve a funcionar solo.');
  }
  /* ══ UNA TIENDA A MEDIO CONFIGURAR NO SE PUBLICA ══
     Hasta ahora se miraban cinco claves —las cinco constantes— y las demás no
     las miraba nadie. Una tienda podía salir al aire sin llave de pago: el
     comprador terminaba el pedido y no tenía cómo pagar, que es justo el
     agujero que abre a propósito sacar la llave de la página.

     Quién decide qué falta es el maestro, no este archivo: la lista vive en un
     solo sitio y aquí solo se obedece. Y lo que AVISA no bloquea — publicar una
     tienda sin descripción es feo, no roto, y confundir las dos cosas es como
     un flujo empieza a fallar por lo que no importa. */
  if (datos.alta && datos.alta.bloquean && datos.alta.bloquean.length) {
    throw new Error(
      'Esta tienda todavía no puede vender. Falta en la pestaña Configuración:\n\n' +
      datos.alta.bloquean.map(x => '  · ' + x.clave + ' — ' + x.porQue).join('\n') +
      '\n\nLlénalas y vuelve a correr el montaje.');
  }
  if (datos.alta && datos.alta.avisan && datos.alta.avisan.length) {
    console.log('\n  ⚠ La tienda vende, pero queda a medias. Sin llenar:');
    datos.alta.avisan.forEach(x => console.log('      · ' + x.clave + ' — ' + x.porQue));
    console.log('    No bloquea el montaje. Conviene cerrarlo antes de cobrarle a nadie.\n');
  }

  /* CON QUÉ COLORES SALE LA TIENDA, DICHO EN VOZ ALTA.
     La paleta no se hornea en el archivo: la aplica la página al recibir la
     configuración. Eso está bien —cambiar un color no necesita un despliegue—
     pero tiene un efecto feo: si los colores de la hoja no llegan, la tienda
     sale con los de la plantilla y el montaje termina en verde. Se descubre
     abriendo la tienda y mirándola, que es tarde.

     Y los que no se pueden leer son peores que los que faltan: alguien eligió
     un color y la página lo tira a la basura en silencio porque no son seis
     dígitos con almohadilla. */
  if (datos.colores) {
    const cl = datos.colores;
    const puestos = ['principal', 'secundario', 'alterno'].filter(k => cl[k]);
    if (puestos.length) {
      console.log('  Colores de la hoja: ' +
                  puestos.map(k => k + ' ' + cl[k]).join(' · '));
    } else {
      console.log('\n  ⚠ LA HOJA NO TRAE NINGÚN COLOR, así que la tienda sale con');
      console.log('    los de la plantilla. Si los pusiste PINTANDO las celdas de');
      console.log('    Configuración, corre A0_instalar() en el editor del maestro');
      console.log('    para que el relleno se convierta en código, y vuelve.\n');
    }
    if (cl.ilegibles && cl.ilegibles.length) {
      console.log('\n  ⚠ HAY COLORES QUE NO SE PUEDEN LEER, y la página los ignora');
      console.log('    en silencio: se queda con el suyo. Tienen que ser seis');
      console.log('    dígitos con almohadilla, así: #D0211C');
      cl.ilegibles.forEach(x => console.log('      · ' + x));
      console.log('');
    }
  }

  /* ── Y LA PALETA, EN EL ARCHIVO, PARA QUE LA PRIMERA PINTADA YA SEA SUYA ──
     La página aplica los colores de la hoja al recibir la configuración, y eso
     es correcto: cambiar un color no tiene por qué esperar a un despliegue.
     Pero antes de que llegue esa configuración el navegador YA PINTÓ, y pintó
     con lo que dice el `:root` del archivo — que era el rojo tomate de la
     plantilla. Una tienda de cosméticos parpadeaba en rojo cada vez que alguien
     recargaba.

     Así que el `:root` deja de ser «la paleta de Orgánico» y pasa a ser LA
     PALETA DE ESTA TIENDA: la escribe el montaje con lo que diga su hoja. El
     ajuste en vivo sigue mandando —un estilo en línea gana a una hoja de
     estilos—, así que esto no le quita nada; solo hace que el instante previo
     tenga el color correcto en vez del de otro comercio. */
  if (datos.colores) {
    const paleta = { '--rojo': datos.colores.principal,
                     '--verde': datos.colores.secundario,
                     '--acento': datos.colores.alterno };
    let repintadas = 0;
    for (const [variable, color] of Object.entries(paleta)) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(String(color || ''))) continue;
      const busca = new RegExp('(\\n\\s*' + variable + ':)#[0-9A-Fa-f]{6}(;)');
      if (!busca.test(salida)) {
        throw new Error(
          'No encontré ' + variable + ' en el :root de ' + ARCHIVO + '.\n' +
          'La paleta de la tienda se escribe ahí, y si la declaración cambió de\n' +
          'forma esto dejaría la tienda con los colores de la plantilla sin que\n' +
          'nadie se entere. Prefiero parar.');
      }
      const antes = salida;
      salida = salida.replace(busca, '$1' + color.toUpperCase() + '$2');
      if (salida !== antes) repintadas++;
    }
    if (repintadas) cambios.push('la paleta del :root');
  }

  const headViejo = salida.match(HEAD)[0];
  if (headViejo !== datos.head) cambios.push('el bloque del <head>');
  salida = salida.replace(HEAD, () => datos.head);

  for (const c of CONSTANTES) {
    const valor = datos.valores[c.clave];
    if (valor === undefined || valor === null || valor === '') {
      throw new Error(faltaEso(c.clave));
    }
    /* Lo que instalar() deja entre corchetes es lo que nadie ha llenado
       todavía. Publicar así deja una tienda anunciándose como
       "[NOMBRE DEL COMERCIO]", que al menos se ve; lo que NO puede pasar es
       que se publique con los datos de la tienda anterior, y por eso la
       semilla trae corchetes y no un valor que funcione. */
    if (typeof valor === 'string' && /^\[.*\]$/.test(valor.trim())) {
      throw new Error(
        c.clave + ' sigue sin llenar: la hoja dice ' + valor + '.\n\n' +
        'Ese es el valor que deja la instalación para que se vea que falta.\n' +
        'Llénalo en la pestaña Configuración, o pásalo al flujo montaje.');
    }
    if (!c.busca.test(salida)) {
      throw new Error('No encontré la constante ' + c.clave + ' en ' + ARCHIVO + '.');
    }
    const antes = salida.match(c.busca)[0];
    const ahora = c.pon(valor);
    if (antes !== ahora) cambios.push(c.clave);
    salida = salida.replace(c.busca, () => ahora);
  }

  return { html: salida, cambios };
}

async function main() {
  const tienda = await laTienda();
  const datos = await alMaestro(tienda, 'bloques');
  const html = await readFile(ARCHIVO, 'utf8');
  const { html: nuevo, cambios } = aplicar(html, datos);

  if (!cambios.length) {
    console.log('index.html ya está al día con la hoja. Nada que hacer.');
    return;
  }

  if (revisar) {
    console.error('\nindex.html NO está al día con la hoja.\n');
    cambios.forEach(c => console.error('  · ' + c));
    console.error('\nCorre  npm run index  y vuelve a subir.\n');
    process.exit(1);
  }

  await writeFile(ARCHIVO, nuevo);
  console.log('index.html actualizado desde la hoja:\n');
  cambios.forEach(c => console.log('  · ' + c));
  console.log('\nVersión del contrato: ' + datos.valores.SCRIPT_VERSION);
}

/* pathToFileURL y no una plantilla `file://…`: en Windows argv[1] llega como
   D:\CoWork\… y la comparación NUNCA coincide, así que el script se cargaba,
   no ejecutaba nada y salía con código 0. Un fallo silencioso que parece que
   funcionó. */
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
