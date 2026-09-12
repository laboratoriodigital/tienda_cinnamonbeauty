/**
 * ORGÁNICO — publicar el maestro sin abrir el editor de Apps Script
 * ---------------------------------------------------------------------------
 * Sube maestro.gs al proyecto de la tienda y crea una versión nueva SOBRE LA
 * IMPLEMENTACIÓN QUE YA EXISTE, que es la parte que se hace mal a mano: crear
 * una implementación nueva estrena URL y deja el index apuntando al vacío.
 *
 *   npm run maestro
 *
 * ESTO ERA UN SCRIPT DE BASH Y NO PODÍA SER.
 * En Windows, npm corre los scripts por cmd.exe, donde `./algo.sh` no
 * significa nada. Las otras dos herramientas de montaje son Node y funcionan
 * en cualquier parte; esta era la rara, y por eso fue la que se rompió.
 *
 * FUNCIONA CON CLASP 2 Y CON CLASP 3
 * La versión 3 renombró los comandos: `deployments` pasó a `list-deployments`
 * y `deploy -i <id>` a `update-deployment <id>`. Se detecta cuál está
 * instalada, porque quien monte una tienda dentro de un año va a tener la que
 * haya ese día.
 *
 * LA MISMA HERRAMIENTA EN EL EQUIPO Y EN GITHUB ACTIONS
 * Lo que en tu equipo sale de tienda.json y de montar/.clasp.json —ninguno de
 * los dos se versiona— en Actions llega por variables de entorno, que allá son
 * secretos del repositorio:
 *
 *     HOJA_ID   SCRIPT_ID   MAESTRO_URL   MAESTRO_TOKEN
 *
 * El entorno gana; el archivo es el respaldo. Hubo dos implementaciones de
 * esto —esta y un script metido dentro del flujo— y la del flujo se quedó
 * atrás: subía maestro.gs tal cual, con el HOJA_ID vacío, que es exactamente
 * el fallo que dejó una tienda muda. Una sola implementación, por eso.
 *
 * SIGUE SIN CORRER POR CALENDARIO, A PROPÓSITO
 * Publicar el backend deja el código nuevo atendiendo pedidos sin que nadie lo
 * revise. Es una decisión de una persona. En Actions hay que escribir PUBLICAR
 * a mano; en el equipo se cambia de tienda con `clasp login`.
 *
 * ANTES DE LA PRIMERA VEZ
 *   npm i -g @google/clasp
 *   clasp login          ← con la cuenta DUEÑA DEL PROYECTO de esta tienda
 *   Habilitar la API: https://script.google.com/home/usersettings
 *   npm run tienda       (escribe montar/.clasp.json con el scriptId)
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, copyFileSync,
         existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CLASP  = 'montar/.clasp.json';
const TIENDA = 'tienda.json';
const MANIFIESTO = {
  timeZone: 'America/Bogota',
  dependencies: {},
  exceptionLogging: 'STACKDRIVER',
  runtimeVersion: 'V8',
  // La implementación queda pública. Es el error más repetido del montaje.
  webapp: { executeAs: 'USER_DEPLOYING', access: 'ANYONE_ANONYMOUS' }
};

const EN_WINDOWS = process.platform === 'win32';

/* En Windows, lo que instala npm globalmente es clasp.cmd, y Node NO ejecuta
   un .cmd directamente: desde la 18.20 lanzarlo sin shell falla con EINVAL, y
   lanzar "clasp" a secas falla con ENOENT porque no existe ningún clasp.exe.
   Los dos caminos fallan, y por eso el intento anterior —probar clasp.cmd y
   luego clasp— daba "falta clasp" con clasp instalado.
   La salida es pasar por el shell, que resuelve la extensión solo. */
function clasp(args, opciones = {}) {
  return spawnSync('clasp', args.map(entrecomillar), {
    encoding: 'utf8', shell: EN_WINDOWS, ...opciones });
}

// Con shell:true los argumentos los vuelve a partir cmd.exe por los espacios.
function entrecomillar(a) {
  return EN_WINDOWS && /\s/.test(a) ? '"' + a + '"' : a;
}

/* "No está instalado" es una cosa y "falló" es otra. Confundirlas fue el error:
   cualquier tropiezo se reportaba como que faltaba clasp, y quien lo tenía
   instalado se quedaba mirando un mensaje que no aplicaba. cmd.exe devuelve
   9009 cuando no reconoce el comando; los shells de Unix, 127. */
function noEstaInstalado(r) {
  if (r.error && r.error.code === 'ENOENT') return true;
  return r.status === 9009 || r.status === 127;
}

function version() {
  const r = clasp(['--version']);
  const m = String(r.stdout || '').match(/(\d+)\.\d+/);
  return m ? Number(m[1]) : 2;
}

/* EL VALOR QUE SE PIERDE AL SUBIR, Y QUE DEJÓ UNA TIENDA MUDA.
   maestro.gs lleva `var HOJA_ID = ''` en el repositorio: es lo único que se
   escribe a mano en cada tienda, y no se versiona porque es distinto en cada
   una. Subir el archivo tal cual lo BORRA del proyecto publicado, y entonces
   el maestro deja de encontrar su hoja. La tienda no se cae a la vista —se
   cae al inventario de respaldo que trae dentro— así que se ve bien y no
   registra un solo pedido.

   Se devuelve a su sitio desde el entorno (secreto HOJA_ID, en Actions) o
   desde tienda.json (en tu equipo), y si no se sabe cuál es, esto NO sube
   nada: subir con el valor vacío es el peor resultado posible. */
function ficha() {
  try { return JSON.parse(readFileSync(TIENDA, 'utf8')); } catch { return {}; }
}

function idDeLaHoja() {
  const t = ficha();
  const id = (process.env.HOJA_ID || '').trim() || t.hojaId ||
    (String(t.hoja || '').match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/) || [])[1];
  if (!id) {
    console.error(
      '\nNo sé cuál es la hoja de esta tienda.\n\n' +
      'Sin ese dato, subir el maestro lo dejaría sin HOJA_ID y la tienda\n' +
      'quedaría muda: se vería bien y no registraría ningún pedido.\n\n' +
      'En tu equipo:       corre  npm run tienda  y lo escribe en ' + TIENDA + '.\n' +
      'En GitHub Actions:  falta el secreto HOJA_ID del repositorio.\n');
    process.exit(1);
  }
  return id;
}

/* A QUÉ PROYECTO DE APPS SCRIPT SE SUBE.
   En el equipo, montar/.clasp.json, que escribe `npm run tienda`. En Actions
   ese archivo tampoco existe: llega por el secreto SCRIPT_ID. */
function elProyecto() {
  const delEntorno = String(process.env.SCRIPT_ID || '').trim();
  if (delEntorno) return { scriptId: delEntorno };

  if (!existsSync(CLASP)) {
    copyFileSync('montar/clasp.json.ejemplo', CLASP);
    console.error(
      '\nAcabo de crear  ' + CLASP + '  con una plantilla.\n\n' +
      'Lo normal es no llegar aquí: `npm run tienda` lo escribe solo,\n' +
      'preguntándole el scriptId al maestro. Corre eso y vuelve.\n\n' +
      'En GitHub Actions esto se resuelve con el secreto SCRIPT_ID.\n');
    process.exit(1);
  }
  const cfg = JSON.parse(readFileSync(CLASP, 'utf8'));
  if (!cfg.scriptId || /PEGA_AQUÍ/.test(cfg.scriptId)) {
    console.error('\n' + CLASP + ' no tiene el scriptId.\n' +
                  'Corre  npm run tienda  y lo escribe solo.\n' +
                  'En GitHub Actions: falta el secreto SCRIPT_ID.\n');
    process.exit(1);
  }
  return cfg;
}

/* La comprobación que convierte "el comando terminó" en "la tienda responde":
   ?a=bloques obliga al maestro publicado a ABRIR SU HOJA. Si subió sin
   HOJA_ID, se ve aquí y no dentro de tres días. */
async function verificar(version) {
  const t = ficha();
  const url   = (process.env.MAESTRO_URL   || '').trim() || t.maestro || '';
  const token = (process.env.MAESTRO_TOKEN || '').trim() || t.token   || '';
  if (!url || !token) {
    console.log('\nNo puedo comprobar que abre su hoja: falta la URL o el token' +
                '\nde esta tienda (tienda.json, o MAESTRO_URL y MAESTRO_TOKEN).');
    return;
  }

  process.stdout.write('\nComprobando que el maestro publicado abre su hoja… ');
  try {
    const r = await fetch(url + '?a=bloques&t=' + encodeURIComponent(token),
                          { redirect: 'follow' });
    const d = await r.json();
    if (d.ok && d.valores) {
      console.log('sí.');
      if (d.version !== version) {
        console.log('\n⚠ Responde la versión ' + d.version + ' y se publicó la ' +
                    version + '. Google tarda unos segundos: vuelve a mirar el');
        console.log('  Diagnóstico de la hoja en un minuto.');
      }
    } else {
      console.log('NO.\n');
      console.log('⚠ ' + (d.error || 'respondió sin ok'));
      process.exitCode = 1;
    }
  } catch (e) {
    console.log('no pude comprobarlo (' + e.message + ').');
  }
}

async function main() {
  const v = clasp(['--version']);
  if (noEstaInstalado(v)) {
    console.error('\nFalta clasp:\n\n    npm i -g @google/clasp\n');
    process.exit(1);
  }
  if (v.error) {
    console.error('\nNo pude ejecutar clasp: ' + v.error.message + '\n');
    process.exit(1);
  }

  const cfg = elProyecto();
  const mayor = version();
  console.log('clasp ' + String(v.stdout).trim() + '  ·  proyecto ' +
              cfg.scriptId.slice(0, 14) + '…');

  /* Una carpeta temporal con lo único que debe existir en ese proyecto: el
     maestro y su manifiesto. Sin esto clasp le subiría a Google las pruebas,
     los docs y el index. */
  const tmp = mkdtempSync(join(tmpdir(), 'organico-'));
  try {
    const hojaId = idDeLaHoja();
    const fuente = readFileSync('maestro.gs', 'utf8');
    const conHoja = fuente.replace(/var HOJA_ID = '[^']*';/,
                                   "var HOJA_ID = '" + hojaId + "';");
    if (conHoja === fuente) {
      console.error("\nNo encontré la línea  var HOJA_ID = '…';  en maestro.gs.\n");
      process.exit(1);
    }
    writeFileSync(join(tmp, 'maestro.gs'), conHoja);
    console.log('Hoja de esta tienda: ' + hojaId.slice(0, 14) + '…');
    writeFileSync(join(tmp, 'appsscript.json'), JSON.stringify(MANIFIESTO, null, 2));
    writeFileSync(join(tmp, '.clasp.json'),
                  JSON.stringify({ ...cfg, rootDir: tmp }));

    console.log('Subiendo maestro.gs…');
    /* CAPTURADA Y ADEMÁS IMPRESA. Con stdio:'inherit' la salida se veía pero
       `push.stdout` quedaba en null, así que mirarla para decidir qué mensaje
       dar habría sido mirar a la nada: una comprobación que no comprueba. */
    const push = clasp(['push', '--force'], { cwd: tmp });
    if (push.stdout) process.stdout.write(push.stdout);
    if (push.stderr) process.stderr.write(push.stderr);
    if (push.status !== 0) {
      /* «No credentials found» NO es ninguna de las dos causas de siempre, y
         mandarlo a comprobar la cuenta es mandarlo al sitio equivocado: lo que
         falta no es permiso, es el archivo. Se separa a propósito. */
      const sinCredenciales = /no credentials|not logged in|no se encontraron credenciales/i
        .test(String(push.stdout || '') + String(push.stderr || ''));
      console.error(
        '\nNo pude subir el archivo.\n\n' +
        (sinCredenciales
          ? 'Clasp dice que NO ENCUENTRA CREDENCIALES, así que no es un problema\n' +
            'de permisos: es que no hay sesión, o que lo que hay no lo es.\n\n' +
            'En Actions:  el secreto CLASPRC tiene que llevar el contenido de\n' +
            '  ~/.clasprc.json —el que escribe `clasp login` en tu CARPETA\n' +
            '  PERSONAL—, y NO el .clasp.json de la carpeta del proyecto, que\n' +
            '  es otro archivo y solo dice a qué proyecto subir.\n' +
            '  Compruébalo con  node montar/revisar-clasprc.mjs\n\n' +
            'En tu equipo:  corre  clasp login  con la cuenta de esta tienda.\n'
          : 'Las dos causas de siempre:\n' +
            '  · clasp está autenticado con OTRA cuenta. Tiene que ser la dueña\n' +
            '    del proyecto de ESTA tienda. Compruébalo con  clasp login --status\n' +
            '    y cámbiala con  clasp login\n' +
            '  · falta habilitar la API de Apps Script en esa cuenta:\n' +
            '    https://script.google.com/home/usersettings\n'));
      process.exit(1);
    }

    const lista = clasp([mayor >= 3 ? 'list-deployments' : 'deployments'], { cwd: tmp });
    /* Los identificadores de implementación empiezan por AKfycb. Se descarta
       la de @HEAD: esa es la de desarrollo y actualizarla no publica nada. */
    const dep = String(lista.stdout || '').split('\n')
      .filter(l => !/@HEAD/.test(l))
      .map(l => (l.match(/AKfycb[A-Za-z0-9_-]+/) || [])[0])
      .filter(Boolean).pop();

    if (!dep) {
      console.error(
        '\nEste proyecto no tiene ninguna implementación publicada todavía.\n\n' +
        'La primera hay que crearla a mano, UNA sola vez:\n' +
        '  Implementar > Nueva implementación > Aplicación web\n' +
        '  Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona\n\n' +
        'Después abre esa URL una vez en el navegador —el maestro solo puede\n' +
        'conocer su propia dirección atendiendo una petición— y de ahí en\n' +
        'adelante esto ya la actualiza siempre sobre la misma URL.\n');
      process.exit(1);
    }

    const version = (readFileSync('maestro.gs', 'utf8')
      .match(/var VERSION = '([^']+)'/) || [])[1] || 'sin versión';

    console.log('Actualizando la implementación ' + dep + ' a la versión ' + version + '…');
    const desplegar = mayor >= 3
      ? ['update-deployment', dep, '--description', version]
      : ['deploy', '--deploymentId', dep, '--description', version];
    const r = clasp(desplegar, { cwd: tmp, stdio: 'inherit' });
    if (r.status !== 0) {
      console.error('\nSubió el archivo pero no pude publicar la versión.\n' +
                    'Se puede terminar a mano: Implementar > Gestionar\n' +
                    'implementaciones > lápiz > Versión: Nueva.\n');
      process.exit(1);
    }

    await verificar(version);

    console.log('\nListo. La URL /exec no cambió.');
    console.log('');
    console.log('Compruébalo EN LA HOJA DE LA TIENDA (no en el panel):');
    console.log('  el menú de la hoja > Diagnóstico');
    console.log('  "Versión del MAESTRO de esta tienda" debe decir ' + version + '.');
    console.log('');
    console.log('El panel tiene su propia versión, que es otra cosa y no coincide.');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main();
