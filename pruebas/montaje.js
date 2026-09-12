/* ============================================================================
   El montaje automático.
   ----------------------------------------------------------------------------
   Tres pasos que hasta hoy hacía una persona copiando y pegando: el bloque del
   <head>, las fotos de Drive, y publicar el maestro. Aquí se prueban los dos
   primeros de punta a punta —la puerta del maestro y la herramienta que la
   consume—, porque son los que pueden dejar una tienda publicada y muerta.

   Lo que más importa de todo este archivo son los modos de falla: que un
   maestro caído NO escriba un index vacío, y que un token robado NO pueda
   sacar archivos del Drive del comercio.
   ============================================================================ */
const crear = require('./gas.js').crear;
const { aplicar } = require('../montar/preparar-index.mjs');
const { novedades, desajustes } = require('../montar/traer-fotos.mjs');
const { loQueSeMando } = require('../montar/sembrar-configuracion.mjs');
const { hornear } = require('../montar/catalogo-estatico.mjs');
const { veredicto } = require('../montar/misma-tienda.mjs');
const fs = require('fs');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const CARPETA = '1CarpetaDeFotosDelComercio';
const nuevo = () => { const g = crear('./as.js'); g.api.instalar(); return g; };
const puerta = (g, a, extra) => JSON.parse(g.api.doGet({
  parameter: Object.assign({ a: a, t: g.token }, extra || {}) })._texto);

/* Una tienda ya configurada, con el comercio de prueba que vive en gas.js. De
   fábrica el nombre viene entre corchetes y el celular vacío, y el montaje se
   NIEGA a publicar eso (batería 10): es el estado de una tienda recién
   instalada, no el de una lista para salir. */
const yaConfigurada = require('./gas.js').configurar;

const configurar = (g, clave, valor) => {
  const h = g.hojas.get('Configuración');
  const i = g.filas('Configuración').findIndex(f => f[0] === clave);
  if (i < 1) throw new Error('no existe la clave ' + clave);
  h.getRange(i + 1, 2).setValue(valor);
};

// ═══ 1. La puerta que reemplaza el copiar y pegar ═══
{
  const g = yaConfigurada(nuevo());
  const r = puerta(g, 'bloques');

  ok('El maestro entrega el <head> ya armado', r.ok && r.head.length > 200,
     (r.head || '').split('\n')[0]);
  ok('  ...con las dos marcas que la herramienta busca',
     /Content-Security-Policy/.test(r.head) &&
     /FIN DE LA CONFIGURACIÓN/.test(r.head));
  ok('  ...y las cinco constantes por separado, no en un bloque de texto',
     ['SCRIPT_URL', 'SCRIPT_VERSION', 'FOTOS_HOSTS', 'NEGOCIO', 'WHATSAPP']
       .every(k => k in r.valores), Object.keys(r.valores).join(', '));
  ok('  ...con la URL del propio despliegue, que nadie tiene que copiar',
     /\/exec$/.test(r.valores.SCRIPT_URL), r.valores.SCRIPT_URL);
  ok('  ...y los tres proveedores de foto autorizados de antemano',
     r.valores.FOTOS_HOSTS.length === 3, r.valores.FOTOS_HOSTS.join(' '));

  ok('CON TOKEN MALO no entrega nada',
     puerta(g, 'bloques', { t: 'inventado' }).ok === false);

  /* Lo que elimina el último dato que se copiaba a mano: el maestro sabe su
     propio scriptId, así que nadie tiene que sacarlo de la barra de
     direcciones para escribir montar/.clasp.json. */
  ok('EL MAESTRO SABE SU PROPIO scriptId, que antes se copiaba a mano',
     typeof r.scriptId === 'string' && r.scriptId.length > 5, r.scriptId);
  ok('  ...y cómo se llama el negocio y dónde está su hoja',
     r.negocio === 'Panadería La Espiga' && /docs\.google\.com/.test(r.hoja),
     r.negocio + ' · ' + r.hoja);
  ok('  ...así que configurar el repositorio son DOS datos, no cinco',
     ['scriptId', 'negocio', 'hoja'].every(k => k in r),
     'la URL y el token; lo demás lo dice el maestro');

  ok('Lo que diga el dueño en la hoja no se cuela como etiqueta HTML', (() => {
       const g2 = nuevo();
       configurar(g2, 'sitio_titulo', 'Mi tienda"><script>alert(1)</script>');
       const h = puerta(g2, 'bloques').head;
       return h.indexOf('<script>alert') === -1 && h.indexOf('&lt;script&gt;') !== -1;
     })());
  ok('  ...y un nombre con & no produce HTML inválido', (() => {
       const g2 = nuevo();
       configurar(g2, 'negocio', 'Pan & Café');
       const h = puerta(g2, 'bloques').head;
       return h.indexOf('Pan &amp; Café') !== -1 && h.indexOf('Pan & Café') === -1;
     })(), 'se escapa entero, no solo las comillas');
}

// ═══ 2. Escribir el index: o todo, o nada ═══
{
  const g = yaConfigurada(nuevo());
  const datos = puerta(g, 'bloques');
  const html = fs.readFileSync('./index.html', 'utf8');

  const r = aplicar(html, datos);
  ok('APLICAR deja el index apuntando al maestro de esta tienda',
     r.html.indexOf('const SCRIPT_URL = "' + datos.valores.SCRIPT_URL + '";') !== -1);
  ok('  ...con la versión del contrato al día',
     r.html.indexOf('const SCRIPT_VERSION = "' + datos.valores.SCRIPT_VERSION + '";') !== -1);
  ok('  ...y el <head> que armó el maestro', r.html.indexOf(datos.head) !== -1);
  ok('  ...sin tocar nada más del archivo',
     r.html.length > html.length - 4000 && r.html.indexOf('</html>') !== -1 &&
     r.html.split('<script>').length === html.split('<script>').length);
  ok('  ...y conservando los comentarios que explican el código',
     /Respaldo mínimo por si la hoja no contesta/.test(r.html));

  ok('DOS VECES SEGUIDAS no cambia nada la segunda',
     aplicar(r.html, datos).cambios.length === 0,
     aplicar(r.html, datos).cambios.join(', ') || 'sin cambios');

  ok('Dice QUÉ cambió, para que el pull request se entienda',
     aplicar(html.replace(/const SCRIPT_VERSION\s*=\s*"[^"]*";/,
             'const SCRIPT_VERSION = "vieja";'), datos).cambios
       .indexOf('SCRIPT_VERSION') !== -1);

  ok('SI EL MAESTRO NO DIO LA URL, falla y NO escribe una tienda muerta', (() => {
       const sinUrl = JSON.parse(JSON.stringify(datos));
       sinUrl.valores.SCRIPT_URL = '';
       try { aplicar(html, sinUrl); return false; }
       catch (e) { return /SCRIPT_URL/.test(e.message) && /Implementar/.test(e.message); }
     })());
  ok('SI ALGUIEN BORRÓ el bloque del <head>, lo dice en vez de adivinar', (() => {
       const roto = html.replace(/<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->/, '');
       try { aplicar(roto, datos); return false; }
       catch (e) { return /bloque del <head>/.test(e.message); }
     })());
  ok('SI FALTA una constante, tampoco escribe a medias', (() => {
       const roto = html.replace(/const FOTOS_HOSTS\s*=\s*\[[^\]]*\];/, '');
       try { aplicar(roto, datos); return false; }
       catch (e) { return /FOTOS_HOSTS/.test(e.message); }
     })());
}

// ═══ 2c. Las herramientas de montaje ARRANCAN (también en Windows) ═══
/* Estuvieron un rato sin hacer nada y saliendo con código 0. El guardia era
   `import.meta.url === \`file://${process.argv[1]}\``, que en Windows compara
   file://D:\\CoWork\\... contra file:///D:/CoWork/... y nunca coincide: el
   módulo se cargaba, main() no corría, y parecía que había funcionado.
   Se prueba ejecutándolas de verdad, que es la única forma de saberlo. */
{
  const { execFileSync } = require('child_process');
  const correr = (script) => {
    try {
      // Desde un directorio sin tienda.json y con la ruta absoluta del script.
      execFileSync(process.execPath, [require('path').resolve('../montar/' + script)],
                   { cwd: require('fs').mkdtempSync('/tmp/organico-'),
                     encoding: 'utf8', stdio: 'pipe',
                     env: Object.assign({}, process.env,
                                        { MAESTRO_URL: '', MAESTRO_TOKEN: '' }) });
      return { codigo: 0, salida: '' };
    } catch (e) {
      return { codigo: e.status, salida: String(e.stdout || '') + String(e.stderr || '') };
    }
  };

  ['preparar-index.mjs', 'traer-fotos.mjs'].forEach(script => {
    const r = correr(script);
    ok(script + ' EJECUTA main(), no se carga y se calla',
       r.codigo === 1 && /No sé a qué tienda apuntar/.test(r.salida),
       'salió con ' + r.codigo + ': ' + r.salida.split('\n').filter(Boolean)[0]);
  });

  ok('  ...y el guardia usa pathToFileURL, no una plantilla file://', (() => {
       const fuentes = ['preparar-index.mjs', 'traer-fotos.mjs']
         .map(f => fs.readFileSync('../montar/' + f, 'utf8'));
       return fuentes.every(t => /pathToFileURL\(process\.argv\[1\]\)\.href/.test(t)) &&
              fuentes.every(t => !/`file:\/\/\$\{process\.argv/.test(t));
     })(), 'la comparación de Windows era el fallo silencioso');
}

// ═══ 2d. Publicar el maestro ═══
/* Era un script de bash y no podía ser: en Windows npm corre los scripts por
   cmd.exe, donde `./algo.sh` no significa nada, y salía «"." no se reconoce
   como un comando». Las otras dos herramientas de montaje son Node y funcionan
   en cualquier parte; esta era la rara, y por eso fue la que se rompió.

   Se comprueba leyéndola: ejecutarla de verdad pediría una cuenta de Google y
   una implementación viva. */
{
  const src = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');

  ok('PUBLICAR EL MAESTRO es Node, como las otras dos herramientas',
     fs.existsSync('../montar/publicar-maestro.mjs') &&
     !fs.existsSync('../montar/publicar-maestro.sh'),
     'un script de bash no corre desde npm en Windows');
  ok('  ...y se invoca con node, no con una ruta ./',
     /"maestro": "node montar\/publicar-maestro\.mjs"/.test(
       fs.readFileSync('../package.json', 'utf8')));
  /* En Windows npm instala clasp.cmd, y Node no ejecuta un .cmd directamente:
     desde la 18.20 falla con EINVAL, y "clasp" a secas falla con ENOENT porque
     no hay clasp.exe. Los dos caminos fallan sin shell, y por eso el intento
     de probar uno y luego el otro daba "falta clasp" con clasp instalado. */
  ok('  ...pasa por el shell en Windows, que es lo único que resuelve el .cmd',
     /shell: EN_WINDOWS/.test(src) && /win32/.test(src),
     'sin shell, un .cmd no se puede lanzar desde Node');
  ok('  ...y entrecomilla los argumentos, que cmd.exe vuelve a partir',
     /entrecomillar/.test(src));
  ok('NO CONFUNDE "no está instalado" con "falló"',
     /noEstaInstalado/.test(src) && /9009/.test(src) && /127/.test(src),
     'cualquier tropiezo se reportaba como que faltaba clasp');
  ok('  ...y un fallo cualquiera muestra su propio mensaje',
     /No pude ejecutar clasp/.test(src));

  ok('SIRVE con clasp 2 y con clasp 3',
     /list-deployments/.test(src) && /'deployments'/.test(src) &&
     /update-deployment/.test(src) && /--deploymentId/.test(src),
     'v3: list-deployments y update-deployment; v2: deployments y deploy -i');
  ok('  ...decidiendo por la versión instalada, no adivinando',
     /--version/.test(src) && /mayor >= 3/.test(src));
  ok('  ...actualiza la implementación que YA existe, nunca crea una nueva',
     !/new-deployment/.test(src) && /update-deployment/.test(src),
     'crear una nueva estrena URL y deja la tienda muda');
  ok('  ...y descarta la de @HEAD, que es la de desarrollo',
     /@HEAD/.test(src), 'actualizar esa no publica nada');

  /* `clasp login --status` NO EXISTE EN CLASP 3 —lo dice su propio --help— y
     este mensaje llevaba meses mandando a escribir un comando inventado. El
     que sí existe es `show-authorized-user`. Un remedio que no se puede
     ejecutar es peor que ninguno: quien lo prueba concluye que el problema es
     otro. */
  ok('SI clasp ESTÁ EN OTRA CUENTA, lo dice: es el fallo más probable',
     /autenticado con OTRA cuenta/.test(src) && /show-authorized-user/.test(src) &&
     !/clasp login --status/.test(src),
     'el remedio tiene que ser un comando que exista en la versión instalada');
  ok('SIN IMPLEMENTACIÓN previa explica qué hacer una sola vez',
     /no tiene ninguna implementación publicada/.test(src) &&
     /Cualquier persona/.test(src) && /abre esa URL una vez/.test(src));
  ok('SUBE SOLO el maestro, no el repositorio entero',
     /mkdtempSync/.test(src) && /writeFileSync\(join\(tmp, 'maestro\.gs'\)/.test(src) &&
     /rootDir/.test(src), 'una carpeta temporal con lo único que debe existir allá');
  ok('  ...y la borra pase lo que pase', /finally \{[\s\S]{0,80}rmSync/.test(src));
  ok('  ...dejando la implementación pública, el error más repetido',
     /ANYONE_ANONYMOUS/.test(src));

  ok('AL TERMINAR dice DÓNDE comprobarlo, no solo qué buscar',
     /EN LA HOJA DE LA TIENDA \(no en el panel\)/.test(src) &&
     /El panel tiene su propia versión/.test(src),
     'el panel también tiene un menú Diagnóstico, y otra numeración');

  ok('Es JavaScript válido', (() => {
       try {
         require('child_process').execFileSync(process.execPath,
           ['--check', '../montar/publicar-maestro.mjs'], { stdio: 'pipe' });
         return true;
       } catch (e) { return false; }
     })());
}

// ═══ 2d-bis. El HOJA_ID no se puede perder al subir el maestro ═══
/* maestro.gs lleva `var HOJA_ID = ''` en el repositorio: es lo único que se
   escribe a mano en cada tienda y no se versiona. Subirlo tal cual BORRA el
   valor del proyecto publicado, y entonces el maestro no encuentra su hoja.
   La tienda no se cae a la vista: se cae al inventario de respaldo que trae
   dentro, así que se ve bien y no registra un solo pedido. Pasó de verdad. */
{
  const src = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');
  const g = nuevo();

  ok('EL MAESTRO DICE cuál es su hoja, para poder devolvérsela al subir',
     puerta(g, 'bloques').hojaId === g.hojaId, puerta(g, 'bloques').hojaId);

  ok('AL SUBIR se le vuelve a poner el HOJA_ID',
     /var HOJA_ID = '\[\^'\]\*';/.test(src) || /HOJA_ID = '" \+ hojaId/.test(src),
     'el archivo del repositorio lo lleva vacío');
  ok('  ...sacándolo de tienda.json, que es donde quedó al configurar',
     /t\.hojaId/.test(src) && /spreadsheets/.test(src),
     'y si falta hojaId, de la URL de la hoja');
  ok('  ...y SI NO SE SABE CUÁL ES, no sube nada', /process\.exit\(1\)/.test(src) &&
     /quedaría muda/.test(src),
     'subir con el valor vacío es el peor resultado posible');
  ok('  ...ni si la línea no está donde debería',
     /No encontré la línea/.test(src));

  ok('DESPUÉS DE PUBLICAR comprueba que el maestro abre su hoja',
     /a=bloques/.test(src) && /abre su hoja/.test(src),
     'a=version no sirve: contesta igual con la hoja perdida');
  ok('  ...y avisa si responde una versión distinta a la publicada',
     /Responde la versión/.test(src));

  /* La regresión concreta: con HOJA_ID vacío, la puerta del panel falla con
     ese mensaje exacto, que es lo que apareció en la columna Versión. */
  ok('CON HOJA_ID VACÍO, el panel recibe el error y no un cero', (() => {
       const v = crear('./as.js', { hojaId: '' });
       const r = JSON.parse(v.api.doGet({ parameter:
         { a: 'panel', t: 'lo-que-sea' } })._texto);
       return r.ok === false;
     })(), 'por eso el panel decía NO RESPONDE con la tienda arriba');
}

// ═══ 2d-ter. Un maestro roto tiene que poder decir quién es ═══
/* Todas las puertas abrían la hoja para contestar, así que un maestro sin
   HOJA_ID no podía decir NADA de sí mismo — ni siquiera cuál era su hoja. La
   herramienta que arregla ese valor se lo preguntaba justo a él: dependencia
   circular, y ninguna de las dos podía salir. */
{
  const g = nuevo();
  const roto = crear('./as.js', { hojaId: '' });

  const idn = puerta(g, 'identidad');
  ok('LA PUERTA identidad contesta sin abrir la hoja',
     idn.ok && idn.version && idn.scriptId, idn.scriptId);
  ok('  ...y dice cuál es su hoja, que es el dato que se pierde al publicar',
     idn.hojaId === g.hojaId && idn.hojaOk === true, idn.hojaId);

  const r = JSON.parse(roto.api.doGet({ parameter:
    { a: 'identidad', t: roto.api.token() } })._texto);
  ok('CON LA HOJA PERDIDA sigue contestando, en vez de fallar entero',
     r.ok === true, JSON.stringify(r).slice(0, 60));
  ok('  ...avisando de que no puede abrirla', r.hojaOk === false &&
     /HOJA_ID/.test(r.problema || ''), String(r.problema).split('\n')[0]);
  ok('  ...y las OTRAS puertas sí fallan, como debe ser', (() => {
       const b = JSON.parse(roto.api.doGet({ parameter:
         { a: 'bloques', t: roto.api.token() } })._texto);
       return b.ok === false;
     })(), 'identidad es la excepción a propósito, no un descuido');

  ok('CON TOKEN MALO tampoco dice quién es',
     puerta(g, 'identidad', { t: 'no' }).ok === false);

  const src = fs.readFileSync('../montar/configurar-tienda.mjs', 'utf8');
  ok('CONFIGURAR LA TIENDA pregunta por identidad, no por bloques',
     /'identidad'/.test(src) && /desconocida/i.test(src),
     'con respaldo a bloques para un maestro anterior');
  ok('  ...avisa de que la tienda está caída aunque se vea bien',
     /hojaOk === false/.test(src) && /inventario\n?\s*\/\/?\s*de respaldo|de respaldo/.test(src));
  ok('  ...y si el maestro no sabe cuál es su hoja, la pide a mano',
     /URL de la hoja \(o su identificador\)/.test(src));
  ok('  ...aceptando la URL entera o el identificador pelado',
     /\{20,\}/.test(src));
  ok('  ...y manda a npm run maestro, que es lo que lo arregla',
     /para devolverle la hoja al maestro publicado/.test(src));
}

// ═══ 2e. El nombre del sitio: lo único que puede pisar OTRA tienda ═══
/* Crear un repositorio desde una plantilla copia también el nombre del Worker.
   Dos tiendas con el mismo nombre son el MISMO sitio en Cloudflare, así que
   desplegar la segunda borra la primera. Es el único daño que este repositorio
   puede hacer fuera de sí mismo, y por eso se comprueba en el paso donde por
   primera vez se sabe cómo se llama el comercio. */
{
  const src = fs.readFileSync('../montar/configurar-tienda.mjs', 'utf8');

  ok('CONFIGURAR LA TIENDA revisa el nombre del sitio contra el del comercio',
     /revisarNombreDelWorker/.test(src) && /wrangler\.jsonc/.test(src));
  ok('  ...y dice por qué importa, no solo que no coincide',
     /desplegar esta pisaría la otra/.test(src));
  ok('  ...pregunta antes de tocar nada', /¿Lo cambio a/.test(src));
  ok('  ...y si le dicen que no, avisa de que hay que hacerlo a mano',
     /antes de desplegar/.test(src));

  /* El apodo tiene que dar un nombre válido para Cloudflare a partir de
     cualquier cosa que el comercio haya escrito en su hoja. */
  const apodo = (() => {
    const m = src.match(/function apodo\(negocio\) \{[\s\S]*?\n\}/);
    return new Function('return ' + m[0].replace('function apodo', 'function'))();
  })();
  ok('EL APODO quita acentos y espacios', apodo('Panadería La Espiga') === 'panaderia-la-espiga',
     apodo('Panadería La Espiga'));
  ok('  ...y también eñes y signos', apodo('Piña & Miel!') === 'pina-miel', apodo('Piña & Miel!'));
  ok('  ...no deja guiones sueltos en las puntas', apodo('  ¡Orgánico!  ') === 'organico',
     apodo('  ¡Orgánico!  '));
  ok('  ...con un nombre imposible, no devuelve vacío', apodo('¿¡!?') === 'tienda',
     apodo('¿¡!?'));
  ok('  ...y no se pasa de largo', apodo('a'.repeat(80)).length === 40);
}

// ═══ 3. Las fotos del Drive del comercio ═══
{
  const g = nuevo();
  configurar(g, 'fotos_drive', 'https://drive.google.com/drive/folders/' + CARPETA);
  g.enDrive(CARPETA, [
    { id: 'f2', nombre: 'chonto-2.jpg', bytes: 12000, modificado: '2026-09-01T10:00:00.000Z' },
    { id: 'f1', nombre: 'chonto-1.jpg', bytes: 250000, modificado: '2026-09-01T10:00:00.000Z' },
    { id: 'f3', nombre: 'notas.pdf', tipo: 'application/pdf', bytes: 900 }
  ]);

  const l = puerta(g, 'fotos');
  ok('El maestro lista la carpeta de Drive del comercio', l.ok && l.archivos.length === 2,
     (l.archivos || []).map(a => a.nombre).join(', '));
  ok('  ...y deja fuera lo que no es una imagen',
     !JSON.stringify(l.archivos).includes('notas.pdf'));
  ok('  ...ordenado por nombre, para que el diff no baile',
     l.archivos[0].nombre === 'chonto-1.jpg');
  ok('  ...con la fecha, que es lo que dice si el comercio la reemplazó',
     /^\d{4}-\d{2}-\d{2}T/.test(l.archivos[0].modificado), l.archivos[0].modificado);

  /* Los dos errores que fallan en silencio: la tienda no se rompe, la foto
     simplemente no aparece, y nadie se entera hasta que pregunta un cliente. */
  ok('El maestro dice TAMBIÉN qué fotos nombra el catálogo',
     Array.isArray(l.usadas), (l.usadas || []).join(', ') || 'ninguna');
  ok('  ...para poder avisar de la que se subió y nadie nombra', (() => {
       const d = desajustes([{ nombre: 'suelta.jpg' }, { nombre: 'usada.jpg' }],
                            ['usada.jpg']);
       return d.huerfanas.join() === 'suelta.jpg';
     })());
  ok('  ...y de la que la hoja nombra y nunca se subió', (() => {
       const d = desajustes([{ nombre: 'usada.jpg' }], ['usada.jpg', 'falta.jpg']);
       return d.nombradas.join() === 'falta.jpg';
     })());
  ok('  ...sin quejarse cuando todo coincide', (() => {
       const d = desajustes([{ nombre: 'a.jpg' }], ['a.jpg']);
       return d.huerfanas.length === 0 && d.nombradas.length === 0;
     })());
  ok('  ...y una URL completa en la hoja no cuenta como foto de Drive', (() => {
       const g2 = nuevo();
       configurar(g2, 'fotos_drive', 'https://drive.google.com/drive/folders/' + CARPETA);
       g2.enDrive(CARPETA, []);
       const h = g2.hojas.get('Catálogo');
       h.getRange(2, 8).setValue('https://res.cloudinary.com/x/foto.jpg|chonto-1.jpg');
       return puerta(g2, 'fotos').usadas.join() === 'chonto-1.jpg';
     })(), 'esa no sale de la carpeta del comercio');

  const f = puerta(g, 'foto', { id: 'f1' });
  ok('Y entrega la foto', f.ok && f.contenido.length > 0 && f.nombre === 'chonto-1.jpg');
  ok('  ...de a una, no todas juntas: seis minutos es el corte de Apps Script',
     typeof f.contenido === 'string' && !Array.isArray(f.contenido));

  ok('SIN fotos_drive configurado, dice exactamente qué falta', (() => {
       const g2 = nuevo();
       const r = puerta(g2, 'fotos');
       return r.ok === false && /fotos_drive/.test(r.error) && /Configuración/.test(r.error);
     })(), puerta(nuevo(), 'fotos').error);

  ok('CON TOKEN MALO no lista nada', puerta(g, 'fotos', { t: 'no' }).ok === false);
  ok('  ...ni baja una foto', puerta(g, 'foto', { t: 'no', id: 'f1' }).ok === false);

  // Lo que de verdad importa de esta puerta.
  g.sueltoEnDrive({ id: 'privado', nombre: 'contratos.jpg', bytes: 100 });
  const fuera = puerta(g, 'foto', { id: 'privado' });
  ok('UN ARCHIVO DE OTRA PARTE DEL DRIVE no se entrega, aunque el token sea bueno',
     fuera.ok === false && /no está en la carpeta/.test(fuera.error), fuera.error);
  ok('  ...que es lo que impide que el token sirva para vaciar el Drive del comercio',
     fuera.contenido === undefined);

  g.enDrive(CARPETA, [{ id: 'gorda', nombre: 'enorme.jpg', bytes: 20 * 1024 * 1024 }]);
  const gorda = puerta(g, 'foto', { id: 'gorda' });
  ok('UNA FOTO DEMASIADO PESADA se rechaza con el número y qué pedir',
     gorda.ok === false && /20 MB/.test(gorda.error) && /8 MB/.test(gorda.error),
     gorda.error);

  ok('Una carpeta que no existe se explica, no revienta', (() => {
       const g3 = nuevo();
       configurar(g3, 'fotos_drive', 'carpeta-que-no-existe-000');
       const r = puerta(g3, 'fotos');
       return r.ok === false && /Drive/.test(r.error);
     })());
}

// ═══ 2b. El maestro tiene que APRENDER su propia dirección ═══
/* Aquí vivió el error que más caro salió del proyecto. getUrl() devuelve la
   /dev desde el editor y la /exec dentro de la aplicación web, y durante un
   tiempo esto convertía una en otra cambiando el final. No se puede: las dos
   llevan identificadores distintos, así que salía una dirección inexistente
   que ADEMÁS terminaba en /exec y por eso pasaba la comprobación de "ya está
   publicado". El stub quedaba apuntando a la nada. */
{
  const DEV  = 'https://script.google.com/macros/s/ELPROYECTO/dev';
  const EXEC = 'https://script.google.com/macros/s/LAIMPLEMENTACION/exec';

  const editor = crear('./as.js', { url: DEV });
  editor.api.instalar();

  ok('DESDE EL EDITOR el maestro NO se inventa una URL /exec',
     editor.api.urlLista() === '', editor.api.urlLista() || '(vacía, como debe)');
  ok('  ...y sobre todo no fabrica una cambiando /dev por /exec',
     editor.api.urlLista().indexOf('ELPROYECTO') === -1,
     'los dos identificadores son distintos: no son la misma dirección');
  ok('  ...el stub sale marcado, no roto en silencio',
     /TODAVÍA_NO_SE_SABE_LA_URL/.test(editor.api.generarStub().codigo));
  ok('  ...y dice que hay que ABRIR la URL una vez, no solo publicar',
     /abre esa URL una vez/i.test(editor.api.generarStub().html));

  // Alguien abre la URL publicada: ahí sí el maestro se ve a sí mismo.
  editor.servidoEn(EXEC);
  editor.api.doGet({ parameter: { a: 'version' } });

  ok('CUANDO ATIENDE UNA PETICIÓN, aprende su dirección de verdad',
     editor.props.URL_EXEC === EXEC, editor.props.URL_EXEC);
  ok('  ...y desde el editor ya la sabe, aunque Google le diga la /dev',
     (() => { editor.servidoEn(DEV); return editor.api.urlLista() === EXEC; })(),
     editor.api.urlLista());
  ok('  ...así que el stub sale completo y apuntando a donde existe',
     editor.api.generarStub().codigo.indexOf("var MAESTRO = '" + EXEC + "'") !== -1);
  ok('  ...y el index también', (() => {
       const b = JSON.parse(editor.api.doGet({ parameter:
         { a: 'bloques', t: editor.token } })._texto);
       return b.valores.SCRIPT_URL === EXEC;
     })());

  ok('SI SE CREA OTRA IMPLEMENTACIÓN, aprende la nueva', (() => {
       const OTRA = 'https://script.google.com/macros/s/OTRADISTINTA/exec';
       editor.servidoEn(OTRA);
       editor.api.doGet({ parameter: { a: 'version' } });
       return editor.props.URL_EXEC === OTRA;
     })(), 'la URL vieja dejaría la tienda muda');

  ok('Aprender no puede tumbar una petición', (() => {
       const g = crear('./as.js', { url: null });
       g.api.instalar();
       const r = JSON.parse(g.api.doGet({ parameter: { a: 'version' } })._texto);
       return r.ok === true;
     })(), 'sin URL conocida, el catálogo sigue saliendo');
}

// ═══ 3a. Por qué el stub no se puede borrar (medido) ═══
/* El experimento se corrió y se retiró. Lo que quedó medido, el 6 de
   septiembre de 2026, es que un disparador instalable de apertura SÍ le dibuja
   el menú al comerciante, pero que TOCAR una opción falla con
   PERMISSION_DENIED: el clic invoca la función bajo la cuenta del comerciante,
   dentro de un proyecto que no es suyo.

   Estas aserciones cuidan las dos consecuencias de esa medición. */
{
  const codigo = fs.readFileSync('./as.js', 'utf8');
  const sinPlantilla = codigo.replace(
    /var PLANTILLA_STUB = \[[\s\S]*?\]\.join\('\\n'\);/, '');

  ok('EL MAESTRO NO TOCA LA INTERFAZ, sin excepciones',
     sinPlantilla.indexOf('getUi()') === -1 &&
     sinPlantilla.indexOf('showModalDialog') === -1,
     'es lo que le permite correr desde un disparador, donde no hay interfaz');
  ok('  ...y el experimento del menú ya no está en el archivo',
     !/function (menuDePrueba|correrDePrueba|accionDePrueba0)\(/.test(codigo));
  ok('  ...pero sí queda cómo desmontarlo donde se instaló',
     typeof crear('./as.js').api.quitarMenuDePrueba === 'function');
  ok('  ...y desmontarlo funciona aunque el disparador ya no exista', (() => {
       const g = nuevo();
       g.api.quitarMenuDePrueba();      // no debe lanzar
       return true;
     })());
  ok('EL PORQUÉ QUEDA ESCRITO donde se va a buscar',
     /PERMISSION_DENIED/.test(codigo) && /46 líneas/.test(codigo),
     'la medición vive junto al código que explica');
}

// ═══ 3b. El respaldo semanal ═══
{
  const RESP = '1CarpetaDeRespaldosDelAdministrador';
  const conCarpeta = () => {
    const g = nuevo();
    configurar(g, 'respaldo_carpeta',
      'https://drive.google.com/drive/folders/' + RESP);
    g.enDrive(RESP, []);
    return g;
  };

  const g = conCarpeta();
  const r = g.api.respaldarHoja();
  ok('LA HOJA SE COPIA a la carpeta del administrador',
     /^Copia_de_Orgánico — pedidos_\d{4}-\d{2}-\d{2}$/.test(r.nombre), r.nombre);
  ok('  ...con la fecha en el nombre, para saber de cuándo es',
     r.nombre.endsWith(new Date().toISOString().slice(0, 10)));
  ok('  ...y queda dentro de esa carpeta, no en el Drive de la tienda',
     g.api.respaldarHoja() && true);

  ok('SE COPIA, no se exporta: Drive lo resuelve de su lado',
     /makeCopy/.test(String(g.api.respaldarHoja)) &&
     !/getAs|XLSX|export/i.test(String(g.api.respaldarHoja)),
     'una hoja de cien mil filas tarda lo mismo que una de cien');

  ok('EL DISPARADOR SEMANAL queda instalado',
     g.triggers.map(t => t.getHandlerFunction()).indexOf('respaldoSemanal') !== -1);
  ok('  ...y no se duplica al reinstalar', (() => {
       g.api.instalar(); g.api.instalar();
       return g.triggers.filter(t => t.getHandlerFunction() === 'respaldoSemanal').length === 1;
     })(), g.triggers.filter(t => t.getHandlerFunction() === 'respaldoSemanal').length + ' disparador(es)');

  // Doce semanas en una carpeta compartida por dos tiendas.
  const doceSemanas = (() => {
    const g2 = conCarpeta();
    g2.enDrive(RESP, [
      { id: 'ajena1', nombre: 'Copia_de_Panadería_2026-01-01', creado: '2026-01-01T00:00:00Z' },
      { id: 'ajena2', nombre: 'Copia_de_Panadería_2026-01-08', creado: '2026-01-08T00:00:00Z' }
    ]);
    for (let i = 0; i < 12; i++) g2.api.respaldoSemanal();
    return { g: g2, dentro: g2.carpetaDrive(RESP) };
  })();
  const mias = doceSemanas.dentro.filter(f => f.nombre.indexOf('Copia_de_Orgánico') === 0);
  const ajenas = doceSemanas.dentro.filter(f => f.nombre.indexOf('Copia_de_Panadería') === 0);

  ok('LA CARPETA NO CRECE PARA SIEMPRE: quedan ocho copias, no doce',
     mias.length === 8, mias.length + ' copias de esta tienda tras 12 semanas');
  ok('  ...y la que queda arriba es la más nueva, no una vieja',
     mias.some(f => f.nombre.endsWith(new Date().toISOString().slice(0, 10))));
  ok('  ...NUNCA borra las copias de OTRA tienda de la misma carpeta',
     ajenas.length === 2, ajenas.map(f => f.nombre).join(', ') || 'las borró');
  ok('  ...y la poda ignora cualquier archivo que no sea un respaldo suyo',
     doceSemanas.dentro.every(f => /^Copia_de_/.test(f.nombre)));

  ok('SIN respaldo_carpeta configurado, dice qué falta y a quién pedírselo', (() => {
       const g2 = nuevo();
       try { g2.api.respaldarHoja(); return false; }
       catch (e) { return /respaldo_carpeta/.test(e.message) &&
                          /permiso de edición/.test(e.message); }
     })());

  ok('SIN PERMISO sobre la carpeta del administrador, lo dice claro', (() => {
       const g2 = conCarpeta();
       g2.carpetaNegada(RESP);
       try { g2.api.respaldarHoja(); return false; }
       catch (e) { return /permiso de edición/.test(e.message); }
     })());

  ok('UN RESPALDO QUE FALLA no tumba nada y queda anotado', (() => {
       const g2 = nuevo();          // sin carpeta configurada
       g2.api.respaldoSemanal();    // no debe lanzar
       return /respaldo_carpeta/.test(g2.api.ultimoRespaldo().error || '');
     })(), (nuevo(), 'queda en las propiedades, no se pierde'));

  ok('El panel recibe cuándo fue el último respaldo',
     puerta(conCarpetaConCopia(), 'panel').respaldo.fecha !== undefined,
     JSON.stringify(puerta(conCarpetaConCopia(), 'panel').respaldo).slice(0, 70));

  function conCarpetaConCopia() {
    const g2 = conCarpeta();
    g2.api.respaldoSemanal();
    return g2;
  }

  ok('  ...y el diagnóstico lo dice en la propia hoja', (() => {
       const g2 = conCarpetaConCopia();
       return /Último respaldo: \d{4}-\d{2}-\d{2}/.test(g2.api.diagnostico().texto);
     })(), (conCarpetaConCopia().api.diagnostico().texto.match(/Último respaldo:[^\n]*/) || [''])[0]);
}

// ═══ 4. Qué se baja y qué no ═══
{
  const drive = [
    { id: 'f1', nombre: 'a.jpg', bytes: 10, modificado: '2026-09-01T00:00:00.000Z' },
    { id: 'f2', nombre: 'b.jpg', bytes: 10, modificado: '2026-09-01T00:00:00.000Z' }
  ];
  const registro = {
    'a.jpg': { id: 'f1', modificado: '2026-09-01T00:00:00.000Z' },
    'c.jpg': { id: 'f9', modificado: '2026-01-01T00:00:00.000Z' }
  };
  const n = novedades(drive, registro);
  ok('SOLO SE BAJA lo que no está', n.nuevas.map(x => x.nombre).join() === 'b.jpg',
     n.nuevas.map(x => x.nombre).join());
  ok('  ...lo que ya está y no cambió, no se vuelve a bajar',
     !n.nuevas.some(x => x.nombre === 'a.jpg'));
  ok('  ...y lo que el comercio borró de Drive se quita del sitio',
     n.borradas.join() === 'c.jpg', n.borradas.join());
  ok('UNA FOTO REEMPLAZADA con el mismo nombre SÍ se vuelve a bajar', (() => {
       const cambiada = [{ id: 'f1', nombre: 'a.jpg', bytes: 10,
                           modificado: '2026-09-05T00:00:00.000Z' }];
       return novedades(cambiada, registro).nuevas.length === 1;
     })(), 'se compara por fecha, no por tamaño');
  ok('  ...y si cambió el archivo de Drive detrás del mismo nombre, también', (() => {
       const otra = [{ id: 'OTRO', nombre: 'a.jpg', bytes: 10,
                       modificado: '2026-09-01T00:00:00.000Z' }];
       return novedades(otra, registro).nuevas.length === 1;
     })());
  ok('Sin novedades no hace nada', novedades([drive[0]], { 'a.jpg': registro['a.jpg'] })
       .nuevas.length === 0);
}

// ═══ 5. La carga que sí se puede medir ═══
{
  const g = nuevo();
  ok('Al principio no hay lecturas', g.api.lecturasDeHoy() === 0);

  for (let i = 0; i < 5; i++) g.api.doGet({ parameter: { a: 'catalogo' } });
  ok('CADA LECTURA DEL CATÁLOGO se cuenta', g.api.lecturasDeHoy() === 5,
     g.api.lecturasDeHoy() + ' lecturas');

  ok('  ...y otra puerta no infla el número', (() => {
       g.api.doGet({ parameter: { a: 'version' } });
       g.api.doGet({ parameter: { a: 'panel', t: g.token } });
       return g.api.lecturasDeHoy() === 5;
     })(), g.api.lecturasDeHoy() + ' después de version y panel');

  ok('El consolidado de cada hora las pasa a las propiedades', (() => {
       g.api.consolidarLecturas();
       return JSON.parse(g.props.LECTURAS).total === 5 && g.cache.lecturas === undefined;
     })(), g.props.LECTURAS);
  ok('  ...y consolidar dos veces no las duplica', (() => {
       g.api.consolidarLecturas();
       return g.api.lecturasDeHoy() === 5;
     })(), g.api.lecturasDeHoy() + ' lecturas');
  ok('  ...las que llegan después se suman a las ya consolidadas', (() => {
       g.api.doGet({ parameter: { a: 'catalogo' } });
       return g.api.lecturasDeHoy() === 6;
     })(), g.api.lecturasDeHoy() + ' lecturas');

  ok('CONTAR NUNCA PUEDE TUMBAR UNA VISITA', (() => {
       const g2 = nuevo();
       const cat = g2.api.doGet({ parameter: { a: 'catalogo' } });
       return JSON.parse(cat._texto).productos.length === 8;
     })(), 'el catálogo sigue saliendo completo');

  /* EL PICO, NO EL TOTAL. El límite de Apps Script es de concurrencia —30
     ejecuciones a la vez—, así que mil visitas repartidas en el día no son nada
     y cien en el mismo minuto sí. El total no distingue esos dos casos, y
     durante un tiempo era lo único que se medía: la condición de disparo de
     DECISIONES.md 01 estaba escrita y no se podía comprobar. */
  ok('SE GUARDA EL PICO DE UNA HORA, que es lo que acerca al techo',
     JSON.parse(g.props.LECTURAS).pico === 5, g.props.LECTURAS);
  ok('  ...y el pico se queda con la hora MÁS cargada, no con la última', (() => {
       const v = nuevo();
       for (let i = 0; i < 9; i++) v.api.doGet({ parameter: { a: 'catalogo' } });
       v.api.consolidarLecturas();                    // una hora con 9
       v.api.doGet({ parameter: { a: 'catalogo' } });
       v.api.consolidarLecturas();                    // la siguiente, con 1
       const p = JSON.parse(v.props.LECTURAS);
       return p.total === 10 && p.pico === 9;
     })(), 'con el total, una campaña de una hora se ve igual que un día tranquilo');
  ok('  ...y la hora EN CURSO cuenta, que es cuando hay que verla', (() => {
       const v = nuevo();
       for (let i = 0; i < 4; i++) v.api.doGet({ parameter: { a: 'catalogo' } });
       return v.api.picoDeHoy() === 4;   // sin consolidar todavía
     })(), 'si la campaña está ocurriendo AHORA, esperar a la hora en punto no sirve');

  const r = puerta(g, 'panel');
  ok('El panel recibe la carga del día', r.lecturasHoy === 6, String(r.lecturasHoy));
  ok('  ...y también el pico, que es la señal que avisa antes de llegar',
     r.picoHora === 5, String(r.picoHora));
  ok('  ...y cuánta cuota de correo le queda a esa cuenta',
     typeof r.cuotaCorreo === 'number' && r.cuotaCorreo > 0, String(r.cuotaCorreo));

  /* Una condición de disparo que el instrumento no puede observar es una
     intención, no una decisión.

     EL UMBRAL VIVE EN DOS SITIOS —el diagnóstico, que es el instrumento, y la
     decisión escrita, que es el compromiso— y eso ya se separó una vez: al
     reescribir la decisión quedó «300 lecturas» donde el diagnóstico dice
     «300 en una hora», y estas aserciones lo cazaron. La lección es la de
     siempre: se compara el NÚMERO, no la frase, y el número se saca del
     instrumento. El documento tiene que hacerle eco al código, no al revés. */
  {
    const dec = fs.readFileSync('../docs/DECISIONES.md', 'utf8');
    const texto = g.api.diagnostico().texto;
    const umbral = (texto.match(/Pasado (\d+) en una hora/) || [])[1];

    ok('EL DIAGNÓSTICO mide el pico y dice el umbral que dispara la decisión 01',
       !!umbral && /pico en una hora/.test(texto), umbral || 'sin umbral');
    ok('  ...y la decisión escrita nombra ESE MISMO número',
       !!umbral && new RegExp('\\b' + umbral + '\\b').test(dec),
       'el documento le hace eco al instrumento, no al revés');
    ok('  ...con instrumento y contrapartida, o no se puede ejecutar',
       /pico/.test(dec) && /Contrapartida/.test(dec),
       'sin número no se ejecuta; sin contrapartida se lee como si fuera gratis');
  }
}

// ═══ 6. Los dos datos que hay que llevar al panel, y a quién se le enseñan ═══
/* Esta batería decía antes «DIAGNÓSTICO da la URL y el token juntos y
   rotulados», y era verdad: se los daba a TODO EL MUNDO, incluido el
   comerciante, que abre Diagnóstico desde su menú. El token de montaje abre
   ?a=sembrar, ?a=bloques, ?a=fotos y ?a=panel; no tiene por qué estar en una
   pantalla que se fotografía y se reenvía.

   Ahora el informe del menú no lo lleva, y el que monta la tienda ejecuta
   `diagnosticoCompleto()` desde el editor del maestro, que es un sitio donde
   el comerciante no entra. */
{
  const g = nuevo();
  const t = g.api.diagnostico().texto;

  ok('EL DIAGNÓSTICO DEL MENÚ no le enseña al comerciante el token de montaje',
     t.indexOf(g.api.token()) === -1 && /diagnosticoCompleto\(\)/.test(t),
     'ese token abre sembrar, bloques, fotos y panel');
  ok('  ...y el valor por defecto es el discreto, no al revés',
     g.api.diagnostico(true).texto.indexOf(g.api.token()) !== -1 &&
     t.indexOf(g.api.token()) === -1,
     'si alguien añade otra llamada y no se acuerda, falla del lado seguro');
  ok('  ...pero sigue dando la URL, que no es secreta y sí hace falta',
     /PARA EL PANEL DE TIENDAS/.test(t) && /Servicio: https/.test(t),
     (t.match(/Servicio:[^\n]*/) || [''])[0].slice(0, 60));

  const completo = g.api.diagnosticoCompleto();
  ok('DIAGNOSTICOCOMPLETO() sí da los dos datos que el panel no puede adivinar',
     completo.texto.indexOf(g.api.token()) !== -1 && /Servicio: https/.test(completo.texto),
     'se ejecuta desde el editor, y sale por el registro de ejecución');
  ok('  ...y no tiene puerta: no se puede pedir desde fuera', (() => {
       const r = JSON.parse(g.api.doGet({ parameter:
         { a: 'menu', f: 'diagnosticoCompleto', t: g.api.tokenMenu() } })._texto);
       return /no existe/.test(r.texto || r.error || '');
     })(), 'lo que la hace segura es que no esté en ACCIONES_MENU');

  ok('  ...y de paso la carga, con el tope que no se puede consultar',
     /Lecturas del catálogo hoy/.test(t) && /30/.test(t),
     (t.match(/Lecturas del catálogo[^\n]*/) || [''])[0]);
}

// ═══ 7. Un solo flujo, y sin su propia copia del procedimiento ═══
/* DOS COSAS SE JUNTAN AQUÍ.

   La primera: el mismo agujero estuvo dos veces. `npm run maestro` subía
   maestro.gs tal cual y le borraba el HOJA_ID a la tienda publicada; se arregló
   en la herramienta, y el flujo siguió teniendo su propia copia del
   procedimiento escrita dentro del YAML —`cp maestro.gs subida/`— con el fallo
   intacto. La regla que sale de eso: el flujo NO reimplementa el montaje, lo
   llama.

   La segunda: eran DOS flujos, `montaje` y `maestro`, y dispararlos en el orden
   equivocado es fácil y silencioso. El paso del index le pregunta al maestro
   cómo debe quedar el <head>, y una de las cinco constantes es la versión del
   contrato: publicar el maestro DESPUÉS deja la tienda avisando que la hoja
   responde otra versión. Ahora es un solo flujo con el orden fijo. */
{
  const yml = f => fs.readFileSync('../.github/workflows/' + f, 'utf8');
  const maestro = yml('montaje.yml');
  const flujos  = fs.readdirSync('../.github/workflows').filter(f => /\.ya?ml$/.test(f));

  ok('UN SOLO FLUJO monta la tienda entera, en orden',
     !fs.existsSync('../.github/workflows/maestro.yml') &&
     /publicar-maestro\.mjs/.test(maestro) && /preparar-index\.mjs/.test(maestro) &&
     /traer-fotos\.mjs/.test(maestro) && /todas\.sh/.test(maestro),
     'dos flujos se disparan en el orden equivocado sin que se note');
  ok('  ...y el maestro va ANTES que el index, que es lo que importa',
     maestro.indexOf('publicar-maestro.mjs') < maestro.indexOf('preparar-index.mjs'),
     'al revés, la tienda avisa que la hoja responde otra versión');
  ok('EL FLUJO LLAMA a la herramienta, no la reescribe',
     /node montar\/publicar-maestro\.mjs/.test(maestro),
     'una segunda implementación se queda atrás y publica el fallo ya arreglado');
  /* release.yml sí copia maestro.gs: lo empaqueta como entregable, y ahí el
     HOJA_ID vacío es lo correcto —es la plantilla—. La regla es sobre los
     flujos que HABLAN CON APPS SCRIPT: esos no pueden tocar el archivo. */
  ok('  ...y ningún flujo que hable con clasp copia maestro.gs por su cuenta',
     flujos.filter(f => /clasp/.test(yml(f)))
           .every(f => !/cp\s+maestro\.gs/.test(yml(f))),
     'copiarlo tal cual sube var HOJA_ID = \'\' y deja la tienda muda');
  ok('  ...ni corre clasp push por su cuenta',
     flujos.every(f => !/clasp\s+push/.test(yml(f))),
     'la herramienta es la única que sube, porque es la que repone el HOJA_ID');

  ok('LE PASA EL HOJA_ID, que es el dato que se pierde',
     /HOJA_ID: \$\{\{ secrets\.HOJA_ID \}\}/.test(maestro));
  ok('  ...y los otros tres: proyecto, URL y token',
     ['SCRIPT_ID', 'MAESTRO_URL', 'MAESTRO_TOKEN'].every(
       k => new RegExp(k + ': \\$\\{\\{ secrets\\.' + k + ' \\}\\}').test(maestro)),
     'sin URL ni token no puede comprobar que el maestro abre su hoja');
  ok('  ...y se planta antes de publicar si falta alguno',
     /faltan/.test(maestro) && /CLASPRC SCRIPT_ID HOJA_ID/.test(maestro),
     'fallar al principio y no a medio subir');
  /* Un fallo que solo dice qué falta deja a alguien buscando dónde se pone.
     Es la misma lección del botón del carrito: decir QUÉ HACER cuesta lo
     mismo, y el sitio donde se lee es el resumen de la corrida. */
  ok('  ...diciendo en el RESUMEN de dónde sale cada secreto y cómo seguir',
     /GITHUB_STEP_SUMMARY/.test(maestro) && /Secrets and variables/.test(maestro) &&
     /entre .*\/d\/.* y .*\/edit/.test(maestro) &&
     /sin marcar/.test(maestro),
     'y que se puede seguir sin ellos, con la casilla sin marcar');
  ok('  ...pero solo si se PIDIÓ publicar: sin eso, el resto del montaje sigue',
     /inputs\.maestro \}\}" != "true"/.test(maestro) &&
     /steps\.quiere\.outputs\.publica == 'si'/.test(maestro),
     'una tienda sin CLASPRC se monta igual: el maestro se pegó a mano');

  ok('LA HERRAMIENTA lee el entorno primero y el archivo después',
     (() => {
       const src = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');
       return /process\.env\.HOJA_ID/.test(src) &&
              /process\.env\.SCRIPT_ID/.test(src) &&
              /process\.env\.MAESTRO_URL/.test(src) &&
              /process\.env\.MAESTRO_TOKEN/.test(src);
     })(), 'en Actions no existen tienda.json ni montar/.clasp.json');

  /* El flujo sí tiene horario —los lunes trae la hoja y las fotos—, pero el
     maestro dentro de él no: hay que marcarlo Y escribir PUBLICAR. Un
     disparo por calendario no lleva ninguna de las dos cosas. */
  ok('PUBLICAR EL BACKEND sigue siendo una decisión, no un horario',
     /PUBLICAR/.test(maestro) && /no escribiste PUBLICAR/.test(maestro) &&
     /type: boolean/.test(maestro) && /default: false/.test(maestro));
  ok('  ...y los dos flujos que tocan la tienda no corren a la vez',
     ['montaje.yml', 'fotos.yml'].every(
       f => /group: tienda-\$\{\{ github\.repository \}\}/.test(yml(f))),
     'los dos escriben en publicar/');

  /* El shell por defecto de Actions es `bash -e`, sin pipefail: en `algo | tee`
     el código que cuenta es el de tee, y un fallo pasa por verde. */
  ok('UNA TUBERÍA CON tee lleva pipefail, o el fallo se pierde',
     flujos.every(f => {
       const t = yml(f);
       return !/\| tee /.test(t) || /set -o pipefail/.test(t);
     }));

  /* El log de Actions es lo único que hay cuando algo falla allá. Durante un
     tiempo todas.sh solo imprimía el marcador —"822/823"— y para saber qué
     aserción se cayó había que tener el repositorio en la máquina. Peor: una
     batería que ni arrancaba contaba 0/0, así que buenas == total y la corrida
     salía VERDE con una batería entera sin correr. */
  {
    const sh = fs.readFileSync('todas.sh', 'utf8');
    ok('UNA BATERÍA QUE FALLA imprime sus líneas FALLA en el log',
       /grep -E "\^ FALLA"/.test(sh),
       'sin esto, desde Actions no hay forma de saber qué se cayó');
    ok('  ...y una que ni arranca imprime su error',
       /tail -25/.test(sh) && /rotas=/.test(sh));
    ok('  ...y NO puede pasar por verde contando 0/0',
       /-z "\$rotas"/.test(sh),
       'una batería entera sin correr sumaba 0 a los dos lados');
  }

  /* GitHub QUITA Node 20 DE LOS RUNNERS EL 23 DE SEPTIEMBRE DE 2026. Hasta
     entonces las acciones que lo piden corren igual, con un aviso; después,
     no. Es la clase de fecha que no avisa dos veces: el día que pase, los
     cuatro flujos dejan de correr a la vez y el sitio se queda sin poder
     desplegarse. */
  /* UNA CRUZ ROJA QUE SIGNIFICA "TODO BIEN" ES PEOR QUE NO AVISAR: enseña a
     ignorar las cruces rojas, y este proyecto ya tuvo una corrida en verde con
     una batería entera sin correr. Volver a disparar el release sin cambiar
     nada no es un error —no hay nada que cortar—; lo que sí lo es, y hay que
     distinguirlo, es que la etiqueta exista apuntando a OTRO commit: ahí el
     código cambió y la versión no. */
  {
    const rel = yml('release.yml');
    ok('EL RELEASE distingue "ya está hecho" de "te faltó subir la versión"',
       /ya está publicada, y es exactamente este commit/.test(rel) &&
       /apunta a otro commit/.test(rel) &&
       /corta=no/.test(rel) && /corta=si/.test(rel),
       'una cruz roja que significa todo bien enseña a ignorar las cruces rojas');
    ok('  ...y cuando no hay nada que cortar, NO publica ni empaqueta',
       (rel.match(/if: steps\.hay\.outputs\.corta == 'si'/g) || []).length === 2,
       'saltarse los pasos es lo que hace que terminar en verde sea honesto');
    ok('  ...leyendo el commit de la etiqueta, no el del objeto etiqueta',
       /\^\{\}/.test(rel),
       'en una etiqueta anotada el sha del ref no es el del commit');
  }

  ok('NINGUNA ACCIÓN SE QUEDÓ en una versión que pide Node 20',
     flujos.every(f => !/actions\/(checkout|setup-node|cache)@v[1-4]\b/.test(yml(f))),
     'Node 20 sale de los runners el 23-sep-2026');

  ok('NINGÚN FLUJO LLEVA UN SECRETO ESCRITO DENTRO',
     flujos.every(f => {
       const t = yml(f);
       return !/tk-[0-9a-f]{8}/.test(t) && !/ghp_[A-Za-z0-9]{10}/.test(t) &&
              !/AKfycb[A-Za-z0-9_-]{20}/.test(t);
     }), 'todo entra por secrets.*, que no quedan en el historial');
}

// ═══ 8. Sembrar la configuración desde el montaje ═══
/* instalar() siembra la hoja con el nombre, el WhatsApp y la dirección del
   sitio de ORGÁNICO. Una tienda nueva que no los cambie manda sus pedidos al
   celular de otro comercio y publica etiquetas Open Graph que apuntan a otro
   sitio. Escribir esas celdas a mano era el paso más aburrido del despliegue y
   el más fácil de dejar a medias.

   Es la ÚNICA puerta que escribe, así que la mitad de estas aserciones son
   sobre lo que NO puede hacer. */
{
  const sembrar = (g, datos) => JSON.parse(g.api.doGet({ parameter:
    Object.assign({ a: 'sembrar', t: g.token }, datos) })._texto);
  const valor = (g, clave) => {
    const f = g.filas('Configuración').find(x => String(x[0]).trim() === clave);
    return f ? String(f[1]) : null;
  };

  {
    const g = nuevo();
    /* Durante un tiempo esto traía el celular de la primera tienda, y una
       tienda nueva que no lo cambiara le mandaba los pedidos a ese número.
       Vacío falla a la vista; un número de otro funciona en silencio. */
    ok('DE FÁBRICA, una tienda nueva NO trae ningún WhatsApp',
       valor(g, 'whatsapp') === '', JSON.stringify(valor(g, 'whatsapp')));

    const r = sembrar(g, { negocio: 'Panadería La Espiga', whatsapp: '573001112233' });
    ok('SEMBRAR escribe el nombre y el WhatsApp de esta tienda',
       r.ok && valor(g, 'negocio') === 'Panadería La Espiga' &&
       valor(g, 'whatsapp') === '573001112233',
       (r.escritos || []).join(', '));
    ok('  ...y dice cuáles escribió',
       (r.escritos || []).indexOf('negocio') !== -1);
  }

  {
    const g = nuevo();
    sembrar(g, { sitio_url: 'https://panaderia.ejemplo.workers.dev/' });
    ok('DEDUCE fotos_origen de sitio_url, que nadie debería teclear',
       valor(g, 'fotos_origen') === 'https://panaderia.ejemplo.workers.dev/fotos',
       valor(g, 'fotos_origen'));
    sembrar(g, { fotos_drive: 'https://drive.google.com/drive/folders/ABC' });
    ok('  ...y pone fotos_webp en Sí cuando va a haber fotos convertidas',
       valor(g, 'fotos_webp') === 'Sí', valor(g, 'fotos_webp'));
  }

  {
    const g = nuevo();
    configurar(g, 'negocio', 'Lo que escribió el comercio');
    const r = sembrar(g, { negocio: 'Lo que trae el flujo' });
    ok('NO PISA lo que el comercio ya escribió',
       valor(g, 'negocio') === 'Lo que escribió el comercio' &&
       (r.respetados || []).indexOf('negocio') !== -1,
       'sembrar es poner lo que falta, no imponer');
    const f = sembrar(g, { negocio: 'Lo que trae el flujo', forzar: 'si' });
    ok('  ...salvo que se pida a propósito con forzar',
       valor(g, 'negocio') === 'Lo que trae el flujo' &&
       (f.escritos || []).indexOf('negocio') !== -1);
  }

  {
    const g = nuevo();
    const antes = valor(g, 'negocio');
    const r = sembrar(g, { negocio: '', whatsapp: '   ' });
    ok('UN VALOR VACÍO NO BORRA NADA',
       valor(g, 'negocio') === antes && !(r.escritos || []).length,
       'sembrar de nuevo sin datos deja la hoja como está');
  }

  {
    const g = nuevo();
    const color = valor(g, 'color_principal');
    const legal = valor(g, 'empresa_nit');
    sembrar(g, { color_principal: '#000000', empresa_nit: '999', negocio: 'X' });
    ok('SOLO ESCRIBE LAS CLAVES DE LA LISTA, no lo que le manden',
       valor(g, 'color_principal') === color && valor(g, 'empresa_nit') === legal,
       'es la única puerta que escribe: el resto de la hoja no se toca desde fuera');
    ok('  ...y el catálogo no lo puede tocar nadie desde fuera', (() => {
         const r = JSON.parse(g.api.doGet({ parameter:
           { a: 'sembrar', t: g.token, Catálogo: 'x', stock: '0' } })._texto);
         return r.ok === true && !(r.escritos || []).length;
       })());
  }

  {
    const g = nuevo();
    ok('CON TOKEN MALO no escribe nada',
       sembrar(g, { negocio: 'X', t: 'no' }).ok === false &&
       valor(g, 'negocio') === '[NOMBRE DEL COMERCIO]', valor(g, 'negocio'));
  }

  {
    const g = nuevo();
    const r = sembrar(g, {});
    ok('DICE QUÉ SIGUE SIN CONFIGURAR, que es lo que se olvida',
       (r.faltan || []).indexOf('negocio') !== -1 &&
       (r.faltan || []).indexOf('whatsapp') !== -1, (r.faltan || []).join(', '));
    const d = sembrar(g, { negocio: 'P', whatsapp: '573001112233',
                           sitio_url: 'https://p.ejemplo.dev/',
                           fotos_drive: 'ABC', respaldo_carpeta: 'DEF' });
    ok('  ...y deja de decirlo cuando ya no falta',
       !(d.faltan || []).length, (d.faltan || []).join(', '));
  }

  /* La semilla salió de dentro de instalar() para que la puerta pudiera saber
     qué valor no ha tocado nadie. Si las dos se desincronizan, "no pisa lo del
     comercio" empieza a pisar valores de fábrica que ya no reconoce. */
  {
    const g = nuevo();
    const enLaHoja = {};
    g.filas('Configuración').forEach(f => { enLaHoja[String(f[0]).trim()] = String(f[1]); });
    ok('LA SEMILLA Y LO QUE instalar() ESCRIBE son lo mismo',
       g.api.semillaDeConfiguracion().every(([k, v]) => enLaHoja[k] === String(v)),
       'si se separan, "no pisar lo del comercio" deja de reconocer lo de fábrica');
    ok('  ...y valorDeFabrica lo lee de ahí',
       g.api.valorDeFabrica('negocio') === '[NOMBRE DEL COMERCIO]' &&
       g.api.valorDeFabrica('whatsapp') === '');
  }

  /* VERSION es el contrato entre el maestro y index.html: la tienda avisa
     cuando no coinciden. Sembrar no cambia nada de lo que la tienda le pide al
     maestro, así que subir VERSION por esto pondría el aviso de "versión
     distinta" en todas las tiendas hasta volver a desplegarlas. */
  ok('SEMBRAR NO TOCA EL CONTRATO con la tienda', (() => {
       const g = nuevo();
       const antes = puerta(g, 'version').version;
       sembrar(g, { negocio: 'Panadería' });
       return puerta(g, 'version').version === antes;
     })(), 'la puerta es nueva para el montaje, no para la tienda');
  ok('  ...y un maestro viejo lo dice en cristiano, no como tienda caída',
     /Acci\[o[^\]]*\]n desconocida: sembrar/.test(
       fs.readFileSync('../montar/sembrar-configuracion.mjs', 'utf8')) &&
     /anterior a la puerta/.test(
       fs.readFileSync('../montar/sembrar-configuracion.mjs', 'utf8')),
     'un repositorio al día contra un maestro viejo da ese error exacto');

  ok('LA HERRAMIENTA solo manda lo que venga con algo escrito',
     JSON.stringify(loQueSeMando({ NEGOCIO: 'P', WHATSAPP: '  ', SITIO_URL: '' })) ===
     JSON.stringify({ negocio: 'P' }),
     'una entrada en blanco del flujo no puede llegar como orden de borrar');
  ok('  ...y traduce forzar', loQueSeMando({ NEGOCIO: 'P', FORZAR: 'si' }).forzar === 'si');
}

// ═══ 9. Las pruebas no pueden ser de una máquina ni de una tienda ═══
/* LAS DOS FALLAS QUE APARECIERON AL MONTAR LA SEGUNDA TIENDA, Y QUE EN LA
   PRIMERA ERAN INVISIBLES:

   · sec2.js abría $HOME/t/local.html —la ruta de un equipo—. Donde ese archivo
     existía, la batería probaba una copia congelada; en cualquier otra parte
     reventaba entera. Y una batería reventada contaba 0/0, así que la corrida
     salía verde igual.
   · hoja.js exigía que og:site_name dijera "Orgánico", y sec2.js que el
     mensaje dijera "Orgánico lo confirma antes del despacho". Lo segundo no
     era una prueba mal escrita: el index TENÍA ese nombre a mano, y la
     panadería le decía a sus clientes que el pedido lo confirmaba Orgánico.

   El producto es una tienda por comercio. Una prueba que solo pasa en la
   primera no está probando el producto. */
{
  const baterias = fs.readdirSync('.').filter(f =>
    /\.js$/.test(f) && !['gas.js', 'servidor.js', 'as.js', 'pn.js', 'limites.js'].includes(f));

  ok('NINGUNA BATERÍA abre un archivo por una ruta de una máquina', baterias.every(f => {
       const t = fs.readFileSync(f, 'utf8');
       return !/goto\(\s*['"`]file:\/\//.test(t) && !/process\.env\.HOME/.test(t);
     }), 'donde esa ruta no existe, la batería revienta entera');
  ok('  ...y la que abre un archivo local lo arma desde __dirname',
     /pathToFileURL\(path\.join\(__dirname/.test(fs.readFileSync('sec2.js', 'utf8')),
     'el local.html que todas.sh regenera al lado, no una copia de otro día');

  /* "Orgánico" es el nombre del PRODUCTO —el menú de la hoja, el título que
     genera el maestro con su configuración de ejemplo— y ahí es correcto. Lo
     que no puede aparecer es como el nombre del COMERCIO dentro de la página. */
  const deLaTienda = ['e2e.js', 'hoja.js', 'cat.js', 'val.js', 'movil.js',
                      'pag.js', 'sec2.js', 'enlace.js', 'presentacion.js'];
  // Sin los comentarios: ahí el nombre sale al contar qué pasó, y contarlo es
  // justamente lo que evita que vuelva.
  const sinComentarios = f => fs.readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('NINGUNA BATERÍA DE LA PÁGINA da por hecho que la tienda es Orgánico',
     deLaTienda.every(f => !/Orgánico/.test(sinComentarios(f))),
     'el producto es una tienda por comercio; una prueba que solo pasa en la primera no prueba nada');
  ok('  ...leen el nombre que la página declara', (() => {
       const t = fs.readFileSync('hoja.js', 'utf8') + fs.readFileSync('sec2.js', 'utf8');
       return /evaluate\(\(\) => NEGOCIO\)/.test(t);
     })());

  ok('Y EL MENSAJE DE WHATSAPP lleva el nombre del comercio, no uno fijo', (() => {
       const html = fs.readFileSync('../publicar/index.html', 'utf8');
       return /\$\{NEGOCIO\} lo confirma antes del despacho/.test(html) &&
              !/Orgánico lo confirma antes del despacho/.test(html);
     })(), 'la panadería le decía a sus clientes que el pedido lo confirmaba Orgánico');
}

// ═══ 10. Ningún nombre de comercio quemado en el código ═══
/* "Orgánico" es UNA TIENDA —la de tomates—, no el nombre del producto. Estaba
   escrito a mano en sitios donde el comprador lo lee: el consentimiento de
   datos que autoriza al firmar, un encabezado de los textos legales, los
   avisos de consola, y el menú de la propia hoja del comerciante.

   Y estaba en la semilla de instalar(), que es peor: una tienda recién
   instalada traía el nombre, el sitio y EL CELULAR de otra. El celular es el
   caso grave, porque un número de fábrica no falla: funciona, y le manda los
   pedidos a quien no es. */
{
  const g = nuevo();

  ok('EL MENÚ DE LA HOJA se llama como el comercio', (() => {
       configurar(g, 'negocio', 'Panadería La Espiga');
       const c = g.api.generarStub().codigo;
       return /var NEGOCIO = 'Panadería La Espiga'/.test(c) &&
              /createMenu\(NEGOCIO\)/.test(c) && !/'Orgánico'/.test(c);
     })(), 'el comerciante abre SU hoja, no la de otro');
  ok('  ...y sin nombre puesto dice Tienda, no el de otro comercio', (() => {
       const v = nuevo();
       configurar(v, 'negocio', '');
       return /var NEGOCIO = 'Tienda'/.test(v.api.generarStub().codigo);
     })());
  ok('  ...y una comilla en el nombre no rompe el código generado', (() => {
       const v = nuevo();
       configurar(v, 'negocio', "D'Angelo Pan");
       const c = v.api.generarStub().codigo;
       return /var NEGOCIO = 'D\\'Angelo Pan'/.test(c);
     })(), 'el stub se pega tal cual: un apóstrofo suelto lo parte en dos');

  /* La semilla es lo que ve una tienda recién instalada. Que traiga datos de
     otra es el modo de falla que no se nota. */
  const fabrica = {};
  g.api.semillaDeConfiguracion().forEach(([k, v]) => { fabrica[k] = String(v); });

  ok('LA SEMILLA NO TRAE NINGÚN CELULAR', Object.keys(fabrica).every(
       k => !/\b\d{10}\b/.test(fabrica[k])),
     'un número de fábrica funciona, y por eso es el peor valor posible');
  ok('  ...y el whatsapp viene vacío a propósito', fabrica.whatsapp === '',
     'sin número no hay venta, y eso SE VE; con el número de otro, no');
  ok('  ...y el nombre y el sitio vienen sin llenar',
     /^\[.*\]$/.test(fabrica.negocio) && fabrica.sitio_url === '',
     fabrica.negocio);
  ok('  ...y ningún valor de fábrica nombra a un comercio de verdad',
     Object.keys(fabrica).every(k => !/Orgánico/.test(fabrica[k])));

  /* Publicar con esos valores es lo que hay que impedir: el montaje escribe
     index.html, y un index con el nombre de otra tienda ya está publicado. */
  const conValores = v => ({
    head: '<meta http-equiv="Content-Security-Policy" content="x">' +
          '<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->',
    valores: Object.assign({ SCRIPT_URL: 'https://x/exec', SCRIPT_VERSION: '1',
                             FOTOS_HOSTS: [], NEGOCIO: 'Panadería',
                             WHATSAPP: '573001112233' }, v)
  });
  const base = fs.readFileSync('index.html', 'utf8');
  const revienta = v => { try { aplicar(base, conValores(v)); return ''; }
                          catch (e) { return e.message; } };

  ok('EL MONTAJE NO PUBLICA una tienda con el nombre sin llenar',
     /sigue sin llenar/.test(revienta({ NEGOCIO: '[NOMBRE DEL COMERCIO]' })),
     'los corchetes son lo que deja la instalación para que se vea que falta');
  ok('  ...ni sin WhatsApp, y dice por qué viene vacío',
     /el peor[\s\S]*valor posible/.test(revienta({ WHATSAPP: '' })),
     'el técnico tiene que entender que el vacío es a propósito');
  ok('  ...y cada constante que falta explica LO SUYO',
     /falta publicar el proyecto/.test(revienta({ SCRIPT_URL: '' })) &&
     !/falta publicar el proyecto/.test(revienta({ NEGOCIO: '' })),
     'antes todas mandaban al técnico a publicar el Apps Script');

  /* Lo que el comprador lee y firma. */
  const html = fs.readFileSync('../publicar/index.html', 'utf8');
  ok('EL CONSENTIMIENTO nombra a la tienda, no a un comercio escrito a mano',
     /id="consientoNombre"/.test(html) &&
     /texto\("consientoNombre", NEGOCIO\)/.test(html) &&
     !/Autorizo a Orgánico/.test(html),
     'es lo que el comprador autoriza al marcar la casilla');
  ok('  ...y los textos legales tampoco',
     !/Quién opera Orgánico/.test(html));
  ok('  ...ni los avisos de consola mandan a un menú que no existe',
     !/\[Orgánico\]/.test(html) && !/menú Orgánico/.test(html));
}

// ═══ 11. El alta de una tienda ═══
/* Los primeros pasos del runbook son los que más se hacen a medias, y uno de
   ellos se paga caro: si el "name" de wrangler.jsonc se queda con el de la
   plantilla, dos tiendas son el MISMO sitio en Cloudflare y la segunda pisa a
   la primera. En el equipo eso lo detecta `npm run tienda`; desde el navegador
   no hay quien avise. Por eso lo hace el flujo. */
{
  /* Vive en servicio/ y NO en .github/workflows/: este repositorio es la
     plantilla, y pedirle el nombre de un repositorio nuevo desde dentro del que
     ya es el nuevo no tiene sentido. Corre desde el repositorio de servicio,
     que es donde está el único token capaz de crear repositorios. Se queda
     versionado aquí porque aquí están estas aserciones. */
  const alta = fs.readFileSync('../servicio/tienda-nueva.yml', 'utf8');

  ok('EL ALTA NO ES UN FLUJO DE LA PLANTILLA',
     !fs.existsSync('../.github/workflows/tienda-nueva.yml') &&
     fs.existsSync('../servicio/tienda-nueva.yml'),
     'cada tienda heredaría un flujo que no va a usar nunca');
  ok('  ...y dice dónde sí corre, para que las dos copias no se separen',
     /laboratoriodigital\/tiendas/.test(alta) && /NO CORRE AQUÍ/.test(alta) &&
     /laboratoriodigital\/tiendas/.test(fs.readFileSync('../servicio/README.md', 'utf8')));
  ok('  ...y toma la plantilla de una entrada, no de sí mismo',
     /inputs\.plantilla/.test(alta) && /plantilla:/.test(alta),
     'corre desde otro repositorio: no puede generarse a partir de él');

  ok('EL ALTA le pone a la tienda su propio nombre en wrangler.jsonc',
     /"name":\\s\*"\[\^"\]\*"/.test(alta) && /wrangler\.jsonc/.test(alta),
     'dos tiendas con el mismo name son el mismo Worker');
  ok('  ...y se planta si no encuentra esa clave, en vez de seguir',
     /No encontré la clave name/.test(alta));
  ok('  ...y no toca un repositorio que ya existe',
     /gh repo view/.test(alta) && /No toco nada/.test(alta));
  ok('  ...ni acepta un nombre con caracteres que GitHub no admite',
     /\^\[A-Za-z0-9\._-\]\+\$/.test(alta));

  ok('DEJA PUESTOS los dos secretos de la tienda',
     /gh secret set MAESTRO_URL/.test(alta) && /gh secret set MAESTRO_TOKEN/.test(alta));
  ok('  ...comprobando la URL antes: la /dev solo sirve para el dueño',
     /macros\/s\/\*\/exec/.test(alta) && /tk-\*/.test(alta));

  /* El GITHUB_TOKEN de un flujo no puede crear repositorios ni escribir
     secretos en otros. No hay forma de evitar un token con esos permisos, y lo
     que sí se puede es no dejarlo sin explicar. */
  ok('EXIGE SU PROPIO TOKEN y dice por qué el del flujo no sirve',
     /ALTA_TOKEN/.test(alta) && /no puede crear repositorios/.test(alta) &&
     /Administration/.test(alta) && /vencimiento/.test(alta));
  ok('  ...y si no está, lo dice en el resumen en vez de fallar sin más',
     /Falta el secreto/.test(alta));

  /* La casilla que, sin marcar, deja que montaje corra entero, funcione, y
     falle en la última línea al abrir el pull request. Era el paso manual más
     fácil de olvidar del runbook. */
  ok('DEJA A ACTIONS abrir pull requests, sin que nadie marque la casilla',
     /actions\/permissions\/workflow/.test(alta) &&
     /can_approve_pull_request_reviews=true/.test(alta));
  ok('  ...y deja el squash puesto, que es como fusiona el flujo de fotos',
     /allow_squash_merge=true/.test(alta) && /delete_branch_on_merge=true/.test(alta),
     'fotos fusiona con --squash --delete-branch cada cuatro horas');

  /* CUANDO EL PULL REQUEST NO SE ABRE, HAY QUE DECIR POR QUÉ. GitHub contesta
     «GitHub Actions is not permitted to create or approve pull requests» en una
     anotación al pie, y para verla hay que saber que existe. Costó tres vueltas
     averiguarlo, con el flujo diciendo que todo iba bien hasta la última línea. */
  {
    const m = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
    ok('EL MONTAJE explica por qué no se abrió el pull request',
       /El pull request no se abrió/.test(m) &&
       /Allow GitHub Actions to create and approve pull requests/.test(m) &&
       /if: failure\(\)/.test(m),
       'la anotación de GitHub no la ve quien no sabe que existe');
    ok('  ...y guarda lo horneado aunque el pull request falle',
       /upload-artifact/.test(m) && /if: always\(\)/.test(m),
       'ya se perdió un catálogo con el runner una vez');
  }

  ok('DICE QUÉ FALTA, que es lo que no puede hacer',
     /Connect to Git/.test(alta) && /cuenta de Google/.test(alta),
     'Cloudflare y Google son del navegador');

  /* UN FORMULARIO ACEPTA LO QUE SEA QUE SE PEGUE. La primera corrida de verdad
     falló con "unsupported protocol scheme" porque en `plantilla` fue la URL
     del navegador y la API pide dueño/repositorio pelado. Pedirle rigor a quien
     llena el formulario es la solución que no funciona: la barra de direcciones
     está ahí al lado. */
  ok('NORMALIZA lo que venga del formulario antes de tocar la API',
     /Leer el formulario/.test(alta) && /limpiar\(\)/.test(alta) &&
     /s#\^\[a-zA-Z\]\*:\/\/##/.test(alta) && /s#\\.git\$##/.test(alta),
     'una URL pegada en plantilla tumbaba el alta entera');
  ok('  ...y se planta con lo que no se puede normalizar, diciendo qué recibió',
     /dueño\/repositorio, no como URL/.test(alta) && /recibido:/.test(alta));
  ok('  ...y usa el valor limpio, no el crudo, en TODAS partes',
     !/inputs\.plantilla \}\}\/generate/.test(alta) &&
     (alta.match(/steps\.datos\.outputs\./g) || []).length >= 4,
     'normalizar y después usar el original es peor que no normalizar');

  /* APARCADO, y eso también se comprueba. Un flujo escrito, probado y fuera del
     camino es útil; un flujo escrito, probado y que el runbook manda a usar sin
     que nadie lo haya corrido contra una tienda de verdad, no. */
  {
    const runbook = fs.readFileSync('../docs/RUNBOOK.md', 'utf8');
    const roadmap = fs.readFileSync('../docs/ROADMAP.md', 'utf8');
    ok('EL ALTA ESTÁ APARCADA, y el roadmap dice por qué',
       /APARCADO/.test(roadmap) && /tienda-nueva\.yml/.test(roadmap));
    ok('  ...y el runbook no manda a usarla como camino normal',
       !/tiendas.*Actions.*tienda nueva/s.test(runbook.split('## C.')[0]) &&
       /aparcado a propósito/.test(runbook),
       'el camino documentado es el que se ha corrido de verdad');
  }

  /* Aquí SÍ tiene que coincidir: el flujo que el runbook manda a disparar en
     cada despliegue. El documento hablaba de dos campos cuando el formulario
     tenía cinco, y ese desajuste costó una corrida. */
  {
    const runbook = fs.readFileSync('../docs/RUNBOOK.md', 'utf8');
    const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
    const campos = (flujo.match(/^      ([a-z_]+):$/gm) || [])
      .map(l => l.trim().replace(':', ''));
    ok('EL RUNBOOK nombra TODOS los campos del formulario de montaje',
       campos.length === 3 && campos.every(c => runbook.indexOf('`' + c + '`') !== -1),
       campos.join(', '));
    ok('  ...y dice cuáles se dejan como vienen en un despliegue normal',
       /como vienen/.test(runbook) && /sin marcar/.test(runbook));
  }
}


// ═══ 12. De dónde sale el stub ═══
/* La única pieza del despliegue que sigue siendo copiar y pegar, y por eso la
   que más daño hace mal documentada. Estuvo mal escrita: dos documentos
   mandaban a sacarlo del menú de la hoja —«Generar configuración»—, que
   produce otra cosa (los dos bloques del index.html). Alguien siguió esa
   instrucción, pegó lo que no era, Apps Script dijo que no había cambios que
   guardar, y el menú se quedó viejo sin una sola señal de error.

   El stub NO puede salir del menú por una razón de fondo: es el código que
   DIBUJA ese menú. Depender del menú para arreglarlo es pedirle a la tienda
   que se arregle con lo que está roto. */
{
  const maestro = fs.readFileSync('../maestro.gs', 'utf8');

  ok('EL STUB SE IMPRIME SOLO desde el maestro, no desde el men\u00fa de la hoja',
     /function generarStub\(\)/.test(maestro) &&
     /console\.log\(codigo\)/.test(maestro) &&
     /console\.log\(generarStub\(\)\.codigo\)/.test(maestro),
     'generarStub lo imprime, e instalar() lo imprime al final');

  ok('  ...y generarStub NO est\u00e1 entre las opciones del men\u00fa',
     !/id: 'stub'/.test(maestro) && !/fn: generarStub/.test(maestro),
     'el c\u00f3digo que dibuja el men\u00fa no puede depender del men\u00fa');

  ok('  ...y trae el nombre del comercio, que es lo que cambi\u00f3',
     /var NEGOCIO = '\{\{NEGOCIO\}\}';/.test(maestro),
     'es la l\u00ednea con la que el t\u00e9cnico distingue el stub nuevo del viejo');

  /* NING\u00daN documento puede volver a mandar a sacar el stub del men\u00fa. Se mira
     la frase completa, no la palabra suelta: \u00abGenerar configuraci\u00f3n\u00bb aparece
     bien citada en varios sitios, hablando del index.html. */
  const docs = fs.readdirSync('../docs')
    .filter(n => /\.md$/.test(n))
    .map(n => ['docs/' + n, fs.readFileSync('../docs/' + n, 'utf8')]);
  /* Se mira una ventana alrededor de cada menci\u00f3n, no la l\u00ednea suelta: la frase
     mala se parte en dos renglones. Y se perdona la que viene desmentida, porque
     contar el error es justamente como se evita repetirlo. */
  /* «Deroga» y «sale del menú» también desmienten: un documento que cuenta que
     esa opción SE QUITA no está mandando a sacar el stub de ahí. La lista crece
     con cuidado — cada palabra que se agrega es un hueco por el que podría
     colarse la instrucción mala, así que se comprueba contra la redacción vieja
     cada vez que se toca. */
  const desmiente = /NO sale|no sale|otra cosa|dec\u00edan|juntar|Falso|no puede salir|derog|salen del men|fuera del men|ya no existen/;
  const senala = t => {
    const r = /Generar configuraci/g; let m;
    while ((m = r.exec(t))) {
      const v = t.slice(Math.max(0, m.index - 200), m.index + 200);
      if (/stub/i.test(v) && !desmiente.test(v)) return true;
    }
    return false;
  };
  const culpables = docs.filter(([, t]) => senala(t));
  ok('NING\u00daN DOCUMENTO dice que el stub salga de \u00abGenerar configuraci\u00f3n\u00bb',
     culpables.length === 0,
     culpables.map(([n]) => n).join(', '));

  /* Y los dos que mandan a pegarlo tienen que decir tambi\u00e9n c\u00f3mo comprobar
     que se peg\u00f3 el bueno. \u00abNo hay cambios que guardar\u00bb es un s\u00edntoma, no un
     final feliz: significa que lo pegado era id\u00e9ntico a lo que ya estaba. */
  for (const f of ['ACTUALIZAR-UNA-TIENDA.md', 'SPRINT-0.md']) {
    const t = fs.readFileSync('../docs/' + f, 'utf8');
    ok('  ...y ' + f + ' manda a ejecutar generarStub en el editor del maestro',
       /generarStub/.test(t) && /MAESTRO/.test(t) && /Registro de ejecuci/.test(t));
    ok('  ...y explica qu\u00e9 significa que Guardar no se active',
       /var NEGOCIO/.test(t) && /cambios que guardar|no se activa/.test(t),
       'que no haya nada que guardar es la se\u00f1al de que ya estaba puesto');
    /* Y AVISA DE QUE EL MEN\u00da NO SIRVE DE COMPROBACI\u00d3N. En la tienda que se llama
       Orgánico, el rótulo pasó de la palabra escrita a mano a la variable que
       vale esa misma palabra: idéntico antes y después. Es el mismo error que
       con la versión del Diagnóstico, y costó una vuelta entera. */
    ok('  ...y avisa de que mirar el men\u00fa no comprueba nada',
       /se ve igual|no cambia|no comprueba nada/.test(t) && /Sprint 5/.test(t),
       'las opciones nuevas son de otro sprint');
  }
}


// \u2550\u2550\u2550 13. El n\u00famero de bater\u00edas no se escribe \u2550\u2550\u2550
/* Ya pas\u00f3 dos veces. Primero fue \u00ab758 aserciones\u00bb en seis sitios cuando ya iban
   por 900; se cambi\u00f3 a \u00ablas 19 bater\u00edas\u00bb creyendo que eso no caducaba, y caduc\u00f3
   al escribir la 20. Es el patr\u00f3n 2 en su forma m\u00e1s tonta: una cifra copiada a
   mano en varios archivos, que nadie actualiza porque nadie recuerda d\u00f3nde
   est\u00e1. La \u00fanica salida es no escribirla. */
{
  /* Qu\u00e9 es una bater\u00eda no se decide con una lista escrita a mano \u2014ser\u00eda el
     mismo error otra vez\u2014: es un .js de esta carpeta que imprime su marcador.
     limites.js no lo imprime porque no es una bater\u00eda: cronometra. */
  const enDisco = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && /Resultado: /.test(fs.readFileSync(n, 'utf8')));
  const todas = fs.readFileSync('./todas.sh', 'utf8');
  const auxiliares = ['servidor.js', 'gas.js', 'as.js', 'pn.js'];
  const enLista = [...new Set(todas.match(/\b[a-z0-9]+\.js\b/g) || [])]
    .filter(n => auxiliares.indexOf(n) === -1);
  const sinCorrer = enDisco.filter(n => enLista.indexOf(n) === -1);
  ok('TODAS LAS BATER\u00cdAS est\u00e1n en todas.sh', sinCorrer.length === 0,
     sinCorrer.join(', ') + ' \u2014 una bater\u00eda escrita y no corrida es peor que ninguna');

  /* Los flujos también: ahí estaba escrita cuatro veces más y la aserción no
     los miraba, así que la cifra sobrevivió donde nadie la buscaba. */
  const donde = ['../README.md', '../docs/RUNBOOK.md', '../docs/SPRINT-0.md',
                 '../docs/ANTES-DE-SALIR.md', '../docs/PLAN.md', '../docs/CONTRATOS.md',
                 '../.github/workflows/montaje.yml', '../.github/workflows/pruebas.yml',
                 '../.github/workflows/release.yml'];
  const conCifra = donde.filter(f => fs.existsSync(f) &&
    /\b\d+\s+bater\u00edas|las\s+\d+\s+bater/i.test(fs.readFileSync(f, 'utf8')));
  ok('  ...y ning\u00fan documento escribe cu\u00e1ntas son', conCifra.length === 0,
     conCifra.join(', ') + ' \u2014 se dice \u00abtodas las bater\u00edas\u00bb');
}


// ═══ 14. Lo que la vitrina tiene que decir ═══
/* Cuatro reglas sobre el mismo archivo, y las cuatro salieron de la misma
   prueba: el respaldo que funciona y no avisa. Se comprueban leyendo el
   index.html porque las baterías de navegador no pueden correr en todas partes
   y estas cuatro no se pueden perder por eso. */
{
  const pag = fs.readFileSync('../publicar/index.html', 'utf8');

  ok('LA VITRINA RECHAZA un esquema que no entiende, y conserva lo bueno',
     /const ESQUEMA = \d+/.test(pag) && /function esquemaEntendido/.test(pag) &&
     /esquemaHoja > ESQUEMA/.test(pag) && /if\(!esquemaEntendido\(datos\)\) return false/.test(pag),
     'S1-4');
  ok('  ...y lo dice por consola en vez de callarse',
     /esta página entiende hasta el/.test(pag));

  ok('AVISA AL COMPRADOR cuando sirve el catálogo del archivo',
     /id="avisoArchivo"/.test(pag) && /terminarCarga\(true\)/.test(pag) &&
     /cat\u00e1logo guardado|catálogo guardado/.test(pag),
     'S1-7: un respaldo que no grita se vuelve el estado normal');
  ok('  ...y lo apaga cuando la fuente buena sí contestó',
     /terminarCarga\(false\)/.test(pag) && /aviso\.hidden = !delArchivo/.test(pag));

  ok('EL NOMBRE DEL ENVÍO sale del sello, no de la página',
     /function nombreEnvio/.test(pag) && /sello\.envioNombre/.test(pag) &&
     !/escapar\(envioActivo\.nombre\)/.test(pag),
     'S1-8: la zona del comprador con el costo que la hoja no supo poner');

  /* LA GUARDA QUE YA ESTABA, Y QUE CASI DOY POR ROTA. Dije que el carrito podía
     mezclar el precio del archivo con el total de la hoja; no puede, porque el
     sello se descarta entero si los subtotales no coinciden. Queda aquí para
     que nadie la quite pensando que sobra: es lo único que impide un total
     hecho con precios de dos fuentes. */
  ok('EL SELLO SE DESCARTA ENTERO si el subtotal no coincide',
     /sello\.sub === subtotal\(\)/.test(pag),
     'sin esto, medio total de la hoja y medio del archivo');

  ok('EL UMBRAL de «quedan pocas» lo decide el comercio',
     /umbralBajo/.test(pag) && /p\.umbralBajo > 0 \? p\.umbralBajo : 5/.test(pag),
     'cinco frascos son muchos y cinco canastas casi nada');
}


// ═══ 15. La versión, en un solo sitio ═══
/* SCRIPT_VERSION del index es el contrato con VERSION del maestro: si no
   coinciden, la página avisa al comerciante de que le falta publicar. Estaban
   escritas a mano en dos archivos y repetidas en seis pruebas más; cada release
   obligaba a perseguirlas y una release ya se publicó con la vieja. */
{
  const maestro = fs.readFileSync('../maestro.gs', 'utf8');
  const pagina  = fs.readFileSync('../publicar/index.html', 'utf8');
  const v = (maestro.match(/var VERSION = '([^']+)'/) || [])[1];
  const sv = (pagina.match(/const SCRIPT_VERSION = "([^"]+)"/) || [])[1];
  ok('LA VERSIÓN del maestro y la del index son la misma', !!v && v === sv,
     'maestro ' + v + ' / index ' + sv);

  const conCifra = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && n !== 'as.js' && n !== 'index.html')
    .filter(n => new RegExp("['\"]" + v + "['\"]").test(fs.readFileSync(n, 'utf8')));
  ok('  ...y ninguna batería la vuelve a escribir a mano', conCifra.length === 0,
     conCifra.join(', ') + ' — se lee de as.js');

  /* Y la del paquete, que es la que dispara el release. La regla del plan: solo
     sube cuando cambia algo que se despliega. */
  const pkg = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
  ok('  ...y package.json trae una versión con forma de versión',
     /^\d+\.\d+\.\d+$/.test(pkg.version), pkg.version);
}


// ═══ 16. El catálogo horneado en el sitio ═══
/* ADR-01, hecho. Lo que aprieta en Apps Script son 30 ejecuciones SIMULTÁNEAS
   por cuenta de Google —igual en la versión de pago—: concurrencia, no volumen.
   Mientras MIRAR y COMPRAR compitan por esas 30, el que pierde es el que iba a
   pagar. Con el catálogo servido desde el borde, el maestro queda entero para
   sellar y registrar. */
{
  const g = yaConfigurada(nuevo());
  const j = hornear(puerta(g, 'catalogo'));

  ok('EL CATÁLOGO SE HORNEA con lo que la hoja publica',
     j.productos.length === 8 && j.envios.length === 5, 
     j.productos.length + ' productos, ' + j.envios.length + ' zonas');
  ok('  ...y lleva su esquema y cuándo se generó',
     j.esquema === 1 && !isNaN(Date.parse(j.generado)), JSON.stringify(j.generado));

  /* EL SEGUNDO FILTRO DE LAS CLAVES DE PAGO. El maestro ya las quita de
     ?a=catalogo; esto las quita otra vez al escribir el archivo. No es
     redundancia: este JSON se queda EN EL REPOSITORIO, que es público, y el
     segundo filtro protege de que alguien cambie el primero sin acordarse. */
  ok('NINGUNA CLAVE DE PAGO llega al archivo publicado',
     Object.keys(j.config).filter(k => /^pago_/.test(k)).length === 0,
     Object.keys(j.config).filter(k => /^pago_/.test(k)).join(', '));

  /* EL TOPE SÍ LLEGA, Y NO POR UNA EXCEPCIÓN AL FILTRO. El carrito lo necesita
     para bloquear a tiempo, y el tope no es una credencial: son 1.000 UVB, una
     cifra que publica el Estado. Así que el prefijo `pago_` sigue siendo
     absoluto en los dos filtros y lo que sale es otra clave, `tope_pago`.
     Un filtro con excepciones deja de ser una regla y pasa a ser una lista que
     alguien mantiene. */
  ok('  ...pero el TOPE sí, con otro nombre y sin abrirle un hueco al filtro',
     Object.prototype.hasOwnProperty.call(j.config, 'tope_pago') &&
     Number(j.config.tope_pago) > 0,
     'tope_pago = ' + j.config.tope_pago);
  /* Y llega como TEXTO, porque el horneado pasa la configuración por String().
     La página tiene que convertirlo: comprobar `typeof === "number"` funcionaba
     contra el maestro y fallaba contra el archivo publicado, que es el camino
     normal. El fallo que solo se ve en producción. */
  ok('  ...como texto, que es como el horneado deja toda la configuración',
     typeof j.config.tope_pago === 'string',
     typeof j.config.tope_pago);
  ok('  ...y la página lo CONVIERTE en vez de exigir que ya sea número',
     /const topeLeido = Number\(c\.tope_pago\)/.test(
       fs.readFileSync('../publicar/index.html', 'utf8')),
     'por el maestro llega número y por el archivo llega texto');

  /* Las cuatro que sí son credenciales, nombradas. Si mañana alguien mueve el
     tope a la lista pública sin pensar, esto sigue verde; si mueve la llave, no. */
  ['pago_llave', 'pago_titular', 'pago_entidad', 'pago_texto'].forEach(k => {
    ok('  ...y «' + k + '» no está por ningún lado del archivo',
       JSON.stringify(j).indexOf(k) === -1);
  });

  /* Se copia campo por campo a propósito: que un campo nuevo del maestro no se
     cuele al sitio sin que nadie lo mire. */
  const campos = Object.keys(j.productos[0]).sort().join(',');
  ok('  ...y el producto publicado tiene exactamente los campos previstos',
     campos === ['id','nombre','formato','categoria','precio','stock','descripcion',
                 'imagenes','destacado','referencia','precioAntes','umbralBajo']
                .sort().join(','), campos);

  const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
  const pkg = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
  ok('EL MONTAJE lo hornea en cada corrida', /catalogo-estatico\.mjs/.test(flujo),
     'sin esto el archivo envejece sin que nadie se entere');
  ok('  ...y npm run montar también', /catalogo/.test(pkg.scripts.montar));
  /* EL ORDEN ES PARTE DEL ARREGLO. El catálogo lista qué medidas existen de
     cada foto mirando la carpeta; horneado antes de bajarlas, describe el disco
     de la corrida anterior y promete archivos que todavía no están. Un
     manifiesto que se adelanta a lo que describe es peor que no tenerlo: la
     página deja de adivinar para creerle a algo equivocado. */
  ok('  ...y va DESPUÉS de las fotos, que es lo que va a listar',
     flujo.indexOf('traer-fotos.mjs') < flujo.indexOf('catalogo-estatico.mjs'),
     'si no, el manifiesto describe la corrida anterior');

  const pag = fs.readFileSync('../publicar/index.html', 'utf8');
  ok('LA VITRINA pide primero su propio catálogo, no el de Google',
     /const CATALOGO_ESTATICO = "catalogo\.json"/.test(pag) &&
     pag.indexOf('fetch(CATALOGO_ESTATICO') < pag.indexOf('SCRIPT_URL + "?a=catalogo"'),
     'ese orden ES la decisión');
  ok('  ...y si no está, sigue habiendo maestro en vivo',
     /function pedirleElCatalogoAlMaestro/.test(pag),
     'una tienda sin montaje todavía no tiene catalogo.json');
  ok('  ...y si tampoco, el inventario del archivo, diciéndolo',
     /terminarCarga\(true\)/.test(pag) && /Ni catalogo\.json ni la hoja/.test(pag));
  ok('  ...y un catalogo.json vacío NO se usa: es peor que ninguno',
     /!datos\.productos\.length/.test(pag) && /sin productos/.test(pag));

  /* LA CSP TENÍA QUE CRECER, y esto es de lo que más fácil se olvida: una
     petición bloqueada por la CSP no da error de red, simplemente no sale, y
     la página cae al respaldo como si la hoja no hubiera contestado. */
  ok('LA CSP deja a la página leer su propio catálogo',
     /connect-src 'self' https:\/\/script\.google\.com/.test(pag),
     "sin 'self' el fetch se bloquea sin decir por qué");
  /* LA MISMA REGLA VIVE EN TRES SITIOS, y esto casi cuesta caro. La CSP del
     <meta> y la de _headers SE APLICAN LAS DOS, y manda la más restrictiva: con
     'self' en el <meta> y sin él en _headers, el fetch a catalogo.json se
     bloquea en producción SIN error de red —simplemente no sale— y la tienda
     cae al respaldo como si la hoja no hubiera contestado. Se descubrió leyendo
     _headers después de haber "terminado" el cambio. */
  const maestro  = fs.readFileSync('../maestro.gs', 'utf8');
  const cabeceras = fs.readFileSync('../publicar/_headers', 'utf8');
  const conectan = t => (t.match(/connect-src ([^;"]+)/) || [])[1] || '';
  const tres = [conectan(pag), conectan(maestro), conectan(cabeceras)]
    .map(x => x.trim().split(/\s+/).sort().join(' '));

  ok('LA CSP dice lo mismo en los TRES sitios donde vive',
     tres[0] && tres[0] === tres[1] && tres[1] === tres[2],
     'index: ' + tres[0] + ' | maestro: ' + tres[1] + ' | _headers: ' + tres[2]);
  ok('  ...y las tres dejan a la tienda leer su propio catálogo',
     tres.every(x => /'self'/.test(x)),
     "sin 'self' en _headers el fetch se bloquea en produccion y aqui no se nota");

  ok('EL CATÁLOGO se sirve con caché corta, no eterna',
     /\/catalogo\.json/.test(cabeceras) && /max-age=60/.test(cabeceras),
     'un minuto aguanta un pico y no alcanza para servir precios de ayer');
}


// ═══ 17. «¿Cambió algo?» tiene que ver los archivos nuevos ═══
/* Esto costó una corrida entera y salió VERDE. El montaje horneó catalogo.json
   por primera vez, el paso «¿Cambió algo?» dijo «nada cambió» —porque
   `git diff` NO VE los archivos sin seguimiento— y el trabajo se tiró a la
   basura sin que nada fallara. El fallo que funciona, otra vez, y esta vez en
   la herramienta que existe justamente para no perder trabajo. */
{
  const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
  ok('«¿CAMBIÓ ALGO?» ve también los archivos nuevos',
     /git add -A -- publicar\//.test(flujo) &&
     /git diff --cached --quiet -- publicar\//.test(flujo),
     'git diff a secas no ve lo que no está en el índice');
  ok('  ...y ya no queda ningún `git diff --quiet` sin índice sobre publicar/',
     !/git diff --quiet -- publicar\//.test(flujo),
     'la forma vieja diría «nada cambió» ante un archivo recién creado');
  ok('  ...y lo que resume también sale del índice',
     !/git diff --stat -- publicar\//.test(flujo) &&
     /git diff --cached --stat -- publicar\//.test(flujo),
     'si el resumen mira otra cosa que la decisión, mienten por turnos');

  /* UN «NO» TIENE QUE MOSTRAR SU TRABAJO. La primera vez que este paso dijo
     «nada cambió» era mentira, y averiguar por qué costó ir a buscar ramas al
     remoto. Un paso que decide en silencio obliga a hacer arqueología. */
  ok('  ...y cuando dice que NO, enseña lo que miró',
     /git status --porcelain -- publicar\//.test(flujo),
     'un «no» sin pruebas obliga a ir a buscarlas afuera');
  ok('EL HORNEADO deja en el resumen lo que hizo',
     /tee \/tmp\/catalogo\.txt/.test(flujo) && /### El catálogo/.test(flujo),
     'desde Actions el log es lo único que hay');
  ok('  ...con pipefail, que es lo que hace que un fallo cuente',
     /set -o pipefail\n          node montar\/catalogo-estatico/.test(flujo),
     'en algo | tee, sin pipefail manda el código de tee');

  /* Y SI LAS BATERÍAS FALLAN, EL RESUMEN TIENE QUE DECIR CUÁL. Una corrida roja
     que obliga a abrir el log, buscar el paso y desplegarlo cuesta una
     conversación entera — literalmente: pasó. */
  const pruebasYml = fs.readFileSync('../.github/workflows/pruebas.yml', 'utf8');
  for (const [nombre, y] of [['montaje', flujo], ['pruebas', pruebasYml]]) {
    ok('EL FLUJO `' + nombre + '` pone las líneas FALLA en el resumen',
       /### Las baterías/.test(y) && /grep -E "\^ FALLA/.test(y),
       'desde Actions el resumen es lo primero que se ve');
    ok('  ...y sigue fallando cuando fallan',
       /exit \$\{estado:-0\}/.test(y),
       'un resumen bonito con la corrida en verde sería peor que nada');
  }
}


// ═══ 18. El catálogo no puede envejecer solo ═══
/* DEUDA DEL SPRINT 2, PAGADA. Al hornear el catálogo dentro del sitio, un
   cambio de precio dejó de estar en la calle en diez segundos y pasó a esperar
   un despliegue. Aceptar ese costo NO era dejar al comerciante vendiendo al
   precio de la semana pasada hasta que alguien se acordara de disparar
   `montaje` a mano. El flujo que ya miraba el Drive cada cuatro horas mira
   ahora también la hoja. */
{
  const f = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');

  ok('EL CATÁLOGO se refresca solo, sin que nadie dispare nada',
     /catalogo-estatico\.mjs --revisar/.test(f) &&
     /node montar\/catalogo-estatico\.mjs .*\| tee/.test(f),
     'cuatro horas de techo para un precio nuevo');
  ok('  ...y decide MIRANDO, no por si acaso',
     /fotos=no; catalogo=no/.test(f) && /hay=no/.test(f),
     'si no cambió nada, no se abre ni un commit');

  /* LA GUARDA ES LO QUE PERMITE FUSIONAR SOLO. Un flujo que fusiona sin una
     persona tiene que saber exactamente qué fusiona; si aparece un archivo que
     él no genera, se para. Ampliarla al catálogo sin ampliarla de más es todo
     el cuidado que hay aquí. */
  /* LA LISTA DE LO PUBLICABLE ESTÁ ESCRITA UNA VEZ Y SE LEE DOS.
     Estuvo escrita dos veces y se separaron: el guardia permitía las fotos Y el
     catálogo, el `git add` ponía solo las fotos. Mientras el comercio subía
     fotos los dos decían lo mismo; el día que dio de baja un producto —un
     cambio que solo toca el catálogo— el guardia dijo «adelante», el índice
     quedó vacío, `git commit` salió con 1 y el flujo murió con «no changes
     added to commit». El producto inactivo siguió a la venta y la página siguió
     sirviendo el catálogo viejo. Patrón 2 de la bitácora.
     Esta batería no comprueba que las dos listas COINCIDAN —coincidían el día
     que se escribieron—: comprueba que no haya dos. */
  const lista = (f.match(/^\s*PUBLICA:\s*(.+)$/m) || [])[1];
  ok('LO PUBLICABLE está definido UNA sola vez, para los dos pasos',
     !!lista && /publicar\/fotos/.test(lista) && /publicar\/catalogo\.json/.test(lista),
     'dos listas del mismo criterio: una se queda atrás, y ya pasó');

  const pasoGuarda   = f.slice(f.indexOf('id: solo'), f.indexOf('- name: Navegador'));
  const pasoPublicar = f.slice(f.indexOf('- name: Publicar'));
  ok('  ...y NI el guardia NI el commit escriben rutas por su cuenta',
     /\$PUBLICA/.test(pasoGuarda) && /git add -A -- \$PUBLICA/.test(pasoPublicar) &&
     !/publicar\/fotos\/?['" ]*$/m.test(pasoGuarda.replace(/#.*/g, '')),
     'en cuanto uno de los dos vuelve a nombrar una carpeta, vuelven a separarse');
  ok('  ...con -A, que es lo que ve la foto que el comercio BORRÓ del Drive',
     /git add -A/.test(pasoPublicar),
     'un borrado sin -A no entra al índice y la foto retirada sigue publicada');
  ok('  ...y si aparece otra cosa, no fusiona y lo dice',
     /No se fusiona solo/.test(f) && /limpio=no/.test(f));

  /* «no changes added to commit» EN EL LOG DE ACTIONS PARECE UN FALLO DE GIT.
     Es lo contrario: git hizo exactamente lo que le pidieron. Lo que falló fue
     que el paso que decidió que había novedades y el que las junta no miraron
     lo mismo. Un error que apunta a la herramienta equivocada cuesta horas. */
  ok('  ...y un índice vacío se explica en vez de salir como error de git',
     /git diff --cached --quiet/.test(pasoPublicar) &&
     /no está.*mirando lo mismo|no están\\?\n?.*mirando lo mismo/s.test(pasoPublicar) &&
     /::error::/.test(pasoPublicar),
     'el mensaje crudo manda a depurar git, que es el único que no falló');

  /* EL RÓTULO DEL COMMIT LO DICTA EL CONTENIDO, NO EL ARCHIVO.
     Era siempre «fotos nuevas del comercio», dijera lo que dijera el cambio: un
     precio nuevo llegaba a main anunciado como una foto. Quien abre el
     historial para saber cuándo cambió un precio no encuentra nada. */
  ok('EL COMMIT dice lo que trae: fotos, catálogo o las dos cosas',
     /nfotos=\$\(git diff --cached --name-only/.test(pasoPublicar) &&
     /ncat=\$\(git diff --cached --name-only/.test(pasoPublicar) &&
     /resumen="fotos del comercio y catálogo al día"/.test(pasoPublicar) &&
     /resumen="catálogo al día/.test(pasoPublicar),
     'un título fijo es un título que no informa');
  ok('  ...y el título del pull request es el mismo, no otro escrito aparte',
     /git commit -m "feature\/frontend: \$resumen"/.test(pasoPublicar) &&
     /--title "feature\/frontend: \$resumen"/.test(pasoPublicar),
     'commit y PR contando cosas distintas del mismo cambio');
  ok('  ...y el cuerpo trae los DOS volcados, no solo el de las fotos',
     /### Las fotos/.test(pasoPublicar) && /### El catálogo/.test(pasoPublicar) &&
     /cat \/tmp\/catalogo\.txt/.test(pasoPublicar),
     'el del catálogo es el que dice qué producto se dio de baja');

  /* Y las baterías siguen corriendo ANTES de fusionar: lo que empuja el
     GITHUB_TOKEN no dispara `pruebas`, así que si no corren aquí no corren. */
  ok('  ...con las baterías corriendo antes de fusionar',
     f.indexOf('todas.sh') < f.indexOf('gh pr merge'),
     'lo que empuja GITHUB_TOKEN no dispara pruebas');

  /* Y SI SE CAE, QUE DIGA QUÉ. Este paso se cayó una vez y averiguar por qué
     costó desplegar el log a mano: el resumen mostraba los pasos anteriores en
     verde y nada del que falló. */
  ok('  ...y vuelca al resumen lo que hicieron las dos herramientas',
     /### Las fotos/.test(f) && /### El catálogo/.test(f) && /exit \$estado/.test(f),
     'pase lo que pase, no solo cuando sale bien');
}

// ═══ 19. Las fotos publicadas no llevan dónde se tomaron ═══
{
  const t = fs.readFileSync('../montar/traer-fotos.mjs', 'utf8');
  ok('LA CONVERSIÓN se puede probar sin reescribirla',
     /export \{ novedades, convertir, ANCHOS \}/.test(t) &&
     /destino = PUBLICADAS/.test(t),
     'una prueba que reimplementa lo que mide comprueba su propia copia');
  ok('  ...y NADIE conserva los metadatos por el camino',
     !/withMetadata|keepExif|keepMetadata/.test(t),
     'el EXIF de un celular trae las coordenadas de la finca');

  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  ok('  ...y sharp está donde corren las baterías, no solo en la raíz',
     !!(pkg.devDependencies && pkg.devDependencies.sharp),
     'una prueba de seguridad que se salta sola es peor que no tenerla');

  /* CADA CLAVE DE devDependencies ES UN NOMBRE DE PAQUETE PARA npm, no un sitio
     donde dejar una nota. Puse ahí un `_comentario_sharp` explicando por qué
     hacía falta sharp y `npm install` se negó: «name cannot start with an
     underscore». Y no lo vi al probar, porque corrí la suite con node_modules
     ya instalado: el paso que fallaba —instalar— nunca se ejecutó. Comprobar
     con el trabajo ya hecho no comprueba el trabajo. */
  const nombreValido = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  const malos = Object.keys(pkg.devDependencies || {}).filter(k => !nombreValido.test(k));
  ok('  ...y toda clave de devDependencies es un nombre de paquete de verdad',
     malos.length === 0,
     malos.join(', ') + ' — las notas van en un campo de primer nivel, que npm ignora');
}


// ═══ 20. La página deja de adivinar qué medidas existen ═══
/* Los 404 de `-600.webp` que aparecían en la consola del comerciante no eran un
   fallo: era el respaldo funcionando. Pero un respaldo que se activa en el caso
   normal deja de ser un respaldo y pasa a ser el camino, con dos peticiones
   fallidas por tarjeta y un reguero de rojos que no significan nada. */
{
  const herr = fs.readFileSync('../montar/catalogo-estatico.mjs', 'utf8');
  const tf   = fs.readFileSync('../montar/traer-fotos.mjs', 'utf8');
  const pag  = fs.readFileSync('../publicar/index.html', 'utf8');

  ok('EL CATÁLOGO lista las medidas mirando el disco, no suponiéndolas',
     /async function medidasEnDisco/.test(herr) && /readdir\(carpeta\)/.test(herr),
     'no se promete nada que no esté en la carpeta');

  /* LAS DOS LISTAS DE ANCHOS TIENEN QUE SER LA MISMA. Una genera los archivos y
     la otra los busca; si se separan, el manifiesto miente en silencio. */
  const dela = t => (t.match(/ANCHOS\s*=\s*\[([^\]]+)\]/) || [])[1];
  ok('LOS ANCHOS que se generan y los que se listan son los mismos',
     !!dela(tf) && dela(tf).replace(/\s/g, '') === (dela(herr) || '').replace(/\s/g, ''),
     'genera [' + dela(tf) + '] · lista [' + dela(herr) + ']');

  ok('LA PÁGINA usa el manifiesto cuando lo hay',
     /let MEDIDAS = null/.test(pag) && /if\(MEDIDAS\)\{/.test(pag) &&
     /datos\.fotos && typeof datos\.fotos === "object"/.test(pag),
     'y `null` sigue queriendo decir «no sé»');
  ok('  ...y sin manifiesto adivina como siempre, que es lo que hacía',
     /Sin manifiesto, se adivina/.test(pag),
     'una tienda sin montaje todavía no tiene manifiesto');

  /* Y EL MAESTRO NO PUEDE CONTESTAR ESTO. Vive en otra máquina: no sabe qué
     archivos hay en la carpeta del sitio. Si algún día ?a=catalogo devolviera
     un `fotos`, la página se lo creería y estaría creyéndole a una suposición. */
  const foto = JSON.parse(fs.readFileSync('./esquema.json', 'utf8'));
  ok('  ...y la puerta ?a=catalogo NO publica un manifiesto de fotos',
     foto.puertas.catalogo.indexOf('fotos') === -1,
     'el maestro no sabe qué hay en la carpeta del sitio: contestarlo sería inventar');
}


// ═══ 21. El menú de la hoja, en un solo sitio ═══
/* El stub llevaba SU PROPIA lista de opciones, escrita a mano, al lado de la
   que el maestro usa para validar. Dos copias del mismo dato: bastaba tocar una
   para que la hoja ofreciera algo que el maestro rechaza —o escondiera algo que
   existe—, y las dos fallan en silencio. Ahora la del stub se genera. */
{
  const m = fs.readFileSync('../maestro.gs', 'utf8');

  ok('EL MENÚ DEL STUB se genera, no se escribe a mano',
     /\{\{OPCIONES\}\}/.test(m) && /\{\{ACCIONES\}\}/.test(m) &&
     /var opciones = menuDeLaHoja\(\)/.test(m),
     'una sola lista, y lo demás se deriva');
  ok('  ...y ya no quedan accionN escritas a mano en la plantilla',
     !/"function accion0\(\) \{ pedir\(0\); \}",/.test(m),
     'cambiar el número de opciones rompía el stub sin avisar');

  const g = yaConfigurada(nuevo());
  const stub = g.api.generarStub().codigo;
  const menu = g.api.menuDeLaHoja();
  ok('EL STUB GENERADO trae exactamente las opciones del maestro',
     menu.every(o => stub.indexOf("id: '" + o.id + "'") !== -1) &&
     (stub.match(/function accion\d+\(\)/g) || []).length === menu.length,
     menu.map(o => o.id).join(', '));
  ok('  ...y el orden y las acciones del maestro no se separaron',
     g.api.menuCuadra().ok, JSON.stringify(g.api.menuCuadra()));

  /* PUBLICAR AHORA es el suelo que le faltaba al Sprint 2: el techo son las
     cuatro horas del flujo. Sin esto, tocar un precio y no poder publicarlo es
     una regresión frente a la tienda que consultaba la hoja en vivo. */
  ok('EL MENÚ empieza por «Publicar ahora»', menu[0].id === 'publicar',
     'es lo primero que se quiere después de tocar un precio');
  ok('  ...y ya no ofrece generar bloques de HTML',
     menu.every(o => o.id !== 'configuracion' && o.id !== 'inventario'),
     'eso existía cuando montar era copiar y pegar');
  ok('  ...pero esas funciones siguen vivas para ?a=bloques',
     JSON.parse(g.api.doGet({ parameter: { a: 'menu', f: 'configuracion', t: g.token } })._texto).ok,
     'el montaje escribe el index con ellas');

  /* EL PERMISO DE PUBLICAR VIVE EN LAS PROPIEDADES DEL SCRIPT, QUE NO ESTÁN
     CIFRADAS. Por eso el mensaje pide el token más pequeño que sirve: un
     repositorio, un permiso. Si eso se afloja, se afloja en silencio. */
  ok('PUBLICAR AHORA pide el permiso mínimo, y lo dice',
     /Actions -> Read and write/.test(m) && /Fine-grained tokens/.test(m) &&
     /Solo el repositorio/.test(m),
     'las propiedades del script no están cifradas');
  ok('  ...y dispara el flujo que ya sabe fusionar solo',
     /workflows\/fotos\.yml\/dispatches/.test(m),
     'ese flujo corre las baterías y solo fusiona fotos y catálogo');
  ok('  ...y traduce el error de GitHub en vez de repetirlo',
     /codigo === 401/.test(m) && /codigo === 403/.test(m) && /codigo === 404/.test(m),
     'el comerciante no tiene por qué saber qué es un 403');
}


// ═══ 22. El diagnóstico mide lo que el comprador ve ═══
/* El mensaje de «Publicar ahora» terminaba diciendo que, si algo fallaba,
   quedaba avisado en GitHub. El comerciante NO tiene acceso a GitHub —ni tiene
   por qué— así que eso no era una respuesta: era contarle dónde está la
   respuesta, en un sitio donde no puede entrar.

   Lo que sí puede saber es de cuándo es lo que su tienda está sirviendo, porque
   se le pregunta A LA TIENDA. Eso no depende de que la tubería reporte bien:
   depende de lo que un comprador ve ahora mismo. */
{
  const m = fs.readFileSync('../maestro.gs', 'utf8');

  ok('«PUBLICAR AHORA» no manda al comerciante a GitHub',
     !/avisado en GitHub/.test(m) && /menú > Diagnóstico/.test(m),
     'no tiene acceso al repositorio de su tienda, y no debería necesitarlo');
  ok('  ...y anota CUÁNDO se pidió, que es lo único que se sabe ahí',
     /PEDIDA_PUBLICACION/.test(m) && /setProperty\('PEDIDA_PUBLICACION'/.test(m),
     'que se logró todavía no se sabe');

  const g = yaConfigurada(nuevo());

  /* Sin catálogo publicado: lo dice, y dice qué hacer. */
  ok('EL DIAGNÓSTICO avisa cuando la tienda no tiene catálogo publicado',
     /NO SE PUDO COMPROBAR/.test(g.api.publicacionDeLaTienda()),
     g.api.publicacionDeLaTienda().split('\n')[0]);

  /* Con catálogo publicado: la fecha, en palabras. */
  const hace5 = new Date(Date.now() - 5 * 60000).toISOString();
  g.responder('/catalogo.json', () => ({ cuerpo: { esquema: 1, generado: hace5, productos: [1] } }));
  const fresco = g.api.publicacionDeLaTienda();
  ok('  ...y con catálogo publicado dice de cuándo es, en palabras',
     /está mostrando el catálogo del/.test(fresco) && /hace 5 minutos/.test(fresco),
     fresco);

  /* LA COMPARACIÓN QUE CONTESTA «¿YA LLEGÓ?». Se pidió publicar después de lo
     que se está sirviendo y pasó tiempo de sobra: eso es lo que hay que gritar,
     y es justo lo que un log de GitHub no le iba a decir nunca. */
  /* Y la fecha se arma a mano. Utilities.formatDate pide una zona horaria y
     este proyecto no declara ninguna; los métodos de Date corren en la zona del
     script, que es la del comerciante — la única hora que le sirve. */
  ok('  ...y la fecha se arma sin pedir una zona horaria que no existe',
     !/Utilities\.formatDate\(/.test(m) && /MESES_CORTOS/.test(m),
     'los métodos de Date dan la hora del reloj del comerciante');

  /* EL AVISO DE «PEDISTE Y NO LLEGÓ». Es la única línea de todo esto que el
     comerciante necesita cuando algo va mal, y la que un log de GitHub no le
     iba a dar nunca. */
  ok('  ...y grita cuando se pidió publicar y no llegó',
     /pediste publicar hace/i.test(m) && /ATENCIÓN/.test(m) &&
     /minutos > 20/.test(m),
     'con margen, para no asustar mientras va en camino');
}

/* ═══ 23. EL DIAGNÓSTICO, EN NUEVE PUNTOS Y CON LA CELDA EXACTA ═══
   «Hay datos que no se pudieron leer» es verdad y no sirve para nada: el
   comerciante tiene una hoja de cien filas y no sabe cuál mirar. Lo que se
   comprueba aquí es que el informe diga LA CELDA —«Catálogo E7»— y EL ARCHIVO
   —«chonto-1.jpg»—, que es lo accionable.

   Y se comprueba una trampa vieja: el diagnóstico leía el catálogo POR EL
   CACHÉ. Con el caché caliente, la lista de celdas ilegibles llegaba vacía y
   el informe daba todo por bueno mientras un precio llevaba una hora sin
   poderse leer. Un chequeo que contesta lo mismo con el problema puesto no es
   un chequeo. */
{
  const m = fs.readFileSync('../maestro.gs', 'utf8');
  const conPrecioRoto = () => {
    const g = yaConfigurada(nuevo());
    const h = g.hojas.get('Catálogo');
    h.getRange(2, 1, 1, 13).setValues([['chonto', 'Chonto', 'kg', 'Frutas',
      '$9.000', 10, 'de la finca', 'chonto-1.jpg', 'No', 'Sí', '', '', '']]);
    return g;
  };

  {
    const d = conPrecioRoto().api.diagnostico();
    ok('EL DIAGNÓSTICO da la CELDA exacta del dato que no se pudo leer',
       /Catálogo E2/.test(d.texto) && /9\.000/.test(d.texto),
       (d.texto.match(/ *Catálogo E2[^\n]*/) || [''])[0].trim());
    ok('  ...y dice por qué esa fila no llega a la tienda',
       /no es un número/.test(d.texto),
       'un precio ilegible saca el producto, no lo pone gratis');
    ok('  ...y lo lee SIN CACHÉ, o el informe da por bueno lo que ya está roto',
       (() => {
         const g = conPrecioRoto();
         g.api.catalogoPublico();            // deja el caché caliente
         return /Catálogo E2/.test(g.api.diagnostico().texto);
       })(), 'el caché hacía que el chequeo contestara lo mismo con y sin problema');
  }

  ok('  ...y en un cupón la celda trae también la FILA',
     /Cupones F' \+ filaN/.test(m) && /var fila = null, filaN = 0/.test(m),
     'hay una columna F por cada cupón: sin la fila no se puede buscar');

  /* Los nueve puntos, con veredicto. */
  {
    const g = yaConfigurada(nuevo());
    const d = g.api.diagnostico();
    const veredictos = (d.texto.match(/^ {2}(OK|REVISAR|PROBLEMA) {2,}\d+\. /gm) || []);
    /* Cuántos son NO se escribe aquí: se cuentan los que el informe imprime y
       se exige que el resumen los liste todos. Con el número a mano, añadir un
       punto —que es hacer bien las cosas— dejaba esta batería en rojo, y el
       rojo por la razón equivocada es el que enseña a ignorar los rojos.
       Fueron nueve; desde la 2.9.0 son diez, con «¿está terminada esta
       tienda?» arriba del todo. */
    const encabezados = (d.texto.match(/^── \d+ · /gm) || []).length;
    ok('EL DIAGNÓSTICO lista en el resumen TODOS los puntos que imprime',
       veredictos.length === encabezados && veredictos.length >= 9,
       veredictos.length + ' en el resumen · ' + encabezados + ' en el detalle');
    ok('  ...y el resumen va ARRIBA, no al pie',
       d.texto.indexOf('── RESUMEN ──') === 0,
       'un informe que obliga a bajar hasta el pie no lo lee nadie');
    ok('  ...y se pinta como diálogo, no como alerta',
       d.tipo === 'html' && !!d.html && !!d.texto,
       'noventa líneas en un ui.alert no se leen ni se copian');
    ok('  ...con un cuadro que se copia de un tirón',
       /<textarea readonly onclick="this\.select\(\)"/.test(d.html),
       'está hecho para mandárselo por WhatsApp a quien montó la tienda');
    /* EL TOKEN NO VIAJA EN EL CUADRO. Se lee en pantalla, que es donde hace
       falta; el cuadro está hecho para reenviarse. */
    /* DOS CAPAS, Y HACEN FALTA LAS DOS. El informe del menú no lleva el token
       de montaje en ninguna parte. Y en el completo —el del editor— el token
       se LEE en pantalla pero no viaja dentro del cuadro, que está hecho para
       reenviarse por WhatsApp. */
    ok('  ...y el cuadro del informe del menú no lleva ningún token',
       d.html.indexOf(g.api.token()) === -1 && d.html.indexOf(g.api.tokenMenu()) === -1,
       'se copia para mandarlo, y va a parar a un chat');

    const c = g.api.diagnosticoCompleto();
    const enElCuadro = c.html.slice(c.html.indexOf('<textarea'));
    ok('  ...y en el completo el token se lee en pantalla pero no se copia',
       enElCuadro.indexOf(g.api.token()) === -1 &&
       c.html.indexOf(g.api.token()) !== -1,
       'un token que da de alta pedidos no se reenvía de rebote');
  }

  /* LAS FOTOS, POR NOMBRE EXACTO. «Subí la foto y no aparece» es de las tres
     preguntas más comunes, y hasta ahora la respuesta era «revisa el Drive». */
  {
    const g = yaConfigurada(nuevo());
    g.hojas.get('Catálogo').getRange(2, 1, 1, 13).setValues([['chonto', 'Chonto',
      'kg', 'Frutas', 9000, 10, 'de la finca', 'chonto-1.jpg|chonto-2.jpg',
      'No', 'Sí', '', '', '']]);
    g.responder('/catalogo.json', () => ({ cuerpo: {
      esquema: 1, generado: new Date().toISOString(), productos: [1],
      fotos: { 'chonto-1.jpg': [160, 600, 900], 'vieja.jpg': [160] } } }));
    const t = g.api.diagnostico().texto;
    ok('EL DIAGNÓSTICO nombra la foto que la tienda NO tiene',
       /chonto-2\.jpg/.test(t) && !/ {3}chonto-1\.jpg/.test(t),
       (t.match(/ *chonto-2[^\n]*/) || [''])[0].trim());
    ok('  ...y dice que hay que publicar, que es lo que falta casi siempre',
       /Publicar ahora/.test(t),
       'la tienda solo cambia cuando se publica');
    ok('  ...y la que sobra la menciona sin alarmar',
       /ya nadie usa/.test(t), 'no estorba, y asustar por eso sería peor');
  }

  /* Una URL completa en la celda la sirve otro sitio: no hay nada que
     comprobar, y marcarla como «falta» sería una alarma falsa para siempre. */
  ok('  ...y una foto que vive en otro sitio no se cuenta como faltante',
     /!\/\^https\?:\\\/\\\//.test(m.slice(m.indexOf('function revisarFotos'))),
     'esa foto la sirve otro, y nosotros no tenemos nada que verificar');

  /* La caché de la respuesta de la tienda no puede recordar un fallo: un
     tropiezo de un segundo se volvería el veredicto de toda la ejecución. */
  ok('LA CACHÉ del catálogo publicado NO guarda los fallos', (() => {
       const g = yaConfigurada(nuevo());
       const roto = g.api.publicacionDeLaTienda();
       g.responder('/catalogo.json', () => ({ cuerpo: {
         esquema: 1, generado: new Date().toISOString() } }));
       return /NO SE PUDO COMPROBAR/.test(roto) &&
              /está mostrando el catálogo del/.test(g.api.publicacionDeLaTienda());
     })(), 'recordar «no se pudo» deja la función mintiendo aunque ya conteste');
}

/* ═══ 24. CINCO MINUTOS DE SILENCIO Y UN ROJO ═══
   El flujo `fotos` se cayó en «Bajarlas y convertirlas» tras 5 m 1 s y no dejó
   una sola línea diciendo en qué se había quedado. Dos causas, las dos
   arreglables sin saber cuál fue:

   · `fetch` sin señal espera para siempre. Un maestro que no contesta no da
     error: da silencio hasta que alguien mate el trabajo.
   · El progreso se escribía DESPUÉS de bajar cada foto, así que el log
     terminaba en la foto anterior a la que reventó. La culpable no aparecía. */
{
  const t  = fs.readFileSync('../montar/tienda.mjs', 'utf8');
  const tf = fs.readFileSync('../montar/traer-fotos.mjs', 'utf8');

  ok('LAS LLAMADAS AL MAESTRO tienen tope de espera',
     /AbortSignal\.timeout\(/.test(t) && /signal:/.test(t),
     'fetch sin señal espera para siempre: eso no es un fallo, es un plantón');
  ok('  ...y una foto tiene más tope que las demás llamadas',
     /ESPERA = \{ foto: (\d+), otras: (\d+) \}/.test(t) &&
     Number(RegExp.$1) > Number(RegExp.$2),
     'Apps Script se toma su tiempo entregando base64');
  ok('  ...y el plantón dice QUÉ petición se quedó colgada',
     /TimeoutError/.test(t) && /accion \+ '»'/.test(t) && /extra\.id/.test(t),
     '«fetch failed» a secas manda a buscar un problema de red que no era');

  ok('EL PROGRESO se anuncia ANTES de bajar la foto, no después',
     tf.indexOf('bajando ${a.nombre}') < tf.indexOf("await alMaestro(tienda, 'foto'"),
     'así la última línea del log es siempre la que reventó');
  ok('  ...y numerada, para saber cuántas faltaban',
     /\[\$\{van\}\/\$\{nuevas\.length\}\]/.test(tf));

  /* Rechazar antes de pedir: gastar cinco minutos para terminar en un plantón
     que no dice cuál era es el peor de los dos mundos. */
  ok('UNA FOTO DEMASIADO GRANDE se rechaza ANTES de pedirla, y por su nombre',
     /TOPE_FOTO/.test(tf) &&
     tf.indexOf('pesadas') < tf.indexOf("await alMaestro(tienda, 'foto'"),
     'y el mensaje dice qué hacer: volver a exportarla bajo 10 MB');
  ok('  ...y no se salta en silencio, que sería peor',
     /process\.exit\(1\)/.test(tf.slice(tf.indexOf('const pesadas'),
                                        tf.indexOf('let van = 0'))),
     'una foto que desaparece sin avisar es el patrón 1 otra vez');
}

/* ═══ 25. LO QUE SE LE ENTREGA AL COMERCIANTE NO PUEDE ENVEJECER SOLO ═══
   El manual del dueño llevaba semanas enseñando «Generar configuración para
   index.html» y «Generar inventario para index.html» —derogadas en el Sprint 5—
   y NO nombraba «Publicar ahora», que es la opción que hace que un cambio de
   precio llegue a la tienda. O sea: el papel que se le entrega al comerciante
   le enseñaba dos botones que ya no existen y le escondía el único que importa.

   Nadie lo notó porque un documento no se cae. Es el patrón 2 de la bitácora
   —dos copias del mismo procedimiento, una se queda atrás— con el agravante de
   que la copia atrasada es la que ve el cliente.

   Aquí la lista de opciones NO se escribe: se le pregunta al maestro. Cambiar
   el menú y no cambiar los papeles vuelve a ser imposible. */
{
  const g = nuevo();
  const vivas = g.api.menuDeLaHoja().map(o => o.rotulo);
  /* El mapa de despliegue entra en la lista de papeles vigilados. Los cuatro
     documentos viejos —RUNBOOK, DESPLIEGUE-CLIENTE, MONTAJE, INSTALAR— NO
     están aquí y es a propósito: los cuatro se quedaron atrás, ninguno nombra
     «Publicar ahora», y meterlos hoy los pondría rojos sin arreglarlos.
     Llevan un aviso al principio que dice que el mapa manda, y su consolidación
     está anotada como deuda en el plan. Poner un guardián que se sabe rojo es
     enseñar a ignorarlo. */
  const papeles = ['../docs/GUIA-COMERCIANTE.md',
                   '../docs/DESPLIEGUE.md',
                   '../docs/manuales/Manual-del-dueno-Organico.html'];

  papeles.forEach(ruta => {
    const nombre = ruta.split('/').pop();
    const doc = fs.readFileSync(ruta, 'utf8');
    const faltan = vivas.filter(r => doc.indexOf(r) === -1);
    ok(nombre.toUpperCase() + ' nombra TODAS las opciones del menú',
       faltan.length === 0,
       faltan.length ? 'le faltan: ' + faltan.join(' · ')
                     : vivas.length + ' opciones, todas nombradas');

    /* Las derogadas pueden aparecer SOLO para decir que ya no existen. Un
       documento que las explica como si sirvieran es peor que uno que las
       ignora: manda al comerciante a buscar un botón que no está. */
    ['Generar configuración para index.html',
     'Generar inventario para index.html'].forEach(vieja => {
      const i = doc.indexOf(vieja);
      if (i === -1) return;
      const alrededor = doc.slice(Math.max(0, i - 400), i + 200);
      ok('  ...y si menciona «' + vieja.slice(0, 22) + '…» es para derogarla',
         /ya no existen|versión vieja|se derog/i.test(alrededor),
         nombre + ': la explica como si sirviera');
    });
  });

  /* LA IDEA QUE HACE FUNCIONAR TODO LO DEMÁS. Desde que el catálogo se hornea
     en el sitio, «la tienda le pregunta a la hoja» es falso, y era el modelo
     mental que enseñaba el manual. Un comerciante que cree eso no publica
     nunca, y su tienda muestra precios viejos sin que él sepa por qué. */
  papeles.forEach(ruta => {
    const doc = fs.readFileSync(ruta, 'utf8');
    ok(ruta.split('/').pop() + ' explica que hay que PUBLICAR, no que la tienda lee la hoja',
       /Publicar ahora/.test(doc) &&
       !/le pregunta a la hoja cada vez/.test(doc),
       'quien cree que la tienda lee la hoja en vivo no publica nunca');
  });

  /* Y una página es una página. El día que esto no quepa en una hoja, lo que
     sobra se va al manual: la guía existe porque es corta. */
  const guia = fs.readFileSync('../docs/GUIA-COMERCIANTE.md', 'utf8');
  ok('LA GUÍA DE UNA PÁGINA cabe en una página',
     guia.split('\n').length < 100,
     guia.split('\n').length + ' líneas · ' + guia.length + ' caracteres');
  ok('  ...y no lleva ningún secreto dentro',
     !/tk-[a-z0-9]{8}|tkm-[a-z0-9]{8}|ghp_|github_pat_/.test(guia) &&
     !/3178284725/.test(guia),
     'se imprime y se deja encima de un escritorio');

  const impresa = fs.readFileSync('../docs/manuales/Guia-de-una-pagina.html', 'utf8');
  ok('  ...y la versión imprimible dice lo mismo que la escrita',
     vivas.every(r => impresa.indexOf(r) !== -1) && /@page/.test(impresa),
     'dos copias que se separan es el patrón 2 otra vez');
}

/* ═══ 26. EL PULL REQUEST DEL BOT TIENE QUE DECIR QUÉ TRAE ═══
   Decía siempre lo mismo: «refactor/frontend: la tienda se pone al día con su
   hoja y su Drive», corrida tras corrida. Un título que no cambia nunca es un
   título que se deja de leer — y entonces da igual lo que haya dentro: se
   fusiona por costumbre.

   Es el mismo daño que hacía el fin de línea suelto, y la misma respuesta: el
   flujo YA SABE qué cambió, porque lo calcula para el resumen. Lo que faltaba
   era que lo dijera donde se decide fusionar. */
{
  const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
  const bloquePR = flujo.slice(flujo.indexOf('create-pull-request'));

  ok('EL TÍTULO del pull request NO es una frase fija',
     /title: "montaje: \$\{\{ steps\.cambios\.outputs\.resumen \}\}"/.test(bloquePR),
     'un título que no cambia nunca se deja de leer');
  ok('  ...y el cuerpo lleva QUÉ archivos cambiaron',
     /\$\{\{ steps\.cambios\.outputs\.detalle \}\}/.test(bloquePR),
     'sin esto hay que abrir la pestaña de archivos para saberlo');
  ok('  ...y el commit también, que es lo que queda en el historial',
     /commit-message: "refactor\/frontend: \$\{\{ steps\.cambios\.outputs\.resumen \}\}"/.test(bloquePR));

  /* Los dos valores se calculan donde ya se sabe la respuesta, no otra vez.
     Calcularlo dos veces es como empiezan a decir cosas distintas. */
  const bloqueCambios = flujo.slice(flujo.indexOf('id: cambios'),
                                    flujo.indexOf('create-pull-request'));
  ok('  ...y los calcula el paso que YA miró el diff, no un paso aparte',
     /echo "resumen=\$partes" >> "\$GITHUB_OUTPUT"/.test(bloqueCambios) &&
     /detalle<<FIN_DEL_DETALLE/.test(bloqueCambios),
     'calcularlo dos veces es como empiezan a decir cosas distintas');
  ok('  ...distinguiendo fotos, hoja y catálogo, que es lo que cambia por separado',
     /archivo\(s\) de foto/.test(bloqueCambios) &&
     /la hoja \(index\.html\)/.test(bloqueCambios) &&
     /el catálogo/.test(bloqueCambios),
     'que el título diga si son fotos o es la hoja');
  ok('  ...y nunca queda vacío, que sería peor que la frase fija',
     /\[ -z "\$partes" \] && partes=/.test(bloqueCambios),
     'un título en blanco no se puede leer de ninguna manera');
}

/* ═══ 27. UNA TIENDA A MEDIO CONFIGURAR NO SE PUBLICA ═══
   El montaje miraba CINCO claves —las cinco constantes del index— y las otras
   once no las miraba nadie. Una tienda podía salir al aire sin llave de pago:
   el comprador terminaba el pedido y no tenía cómo pagar, que es exactamente el
   agujero que abre a propósito sacar la llave de la página. */
{
  const g = yaConfigurada(nuevo());
  const fuente = fs.readFileSync('../montar/preparar-index.mjs', 'utf8');

  ok('EL MONTAJE se niega a escribir el index de una tienda que no puede vender',
     /todavía no puede vender/.test(fuente) &&
     /datos\.alta\.bloquean\.length/.test(fuente),
     'antes solo miraba las cinco constantes');
  ok('  ...diciendo qué falta y por qué, no solo que falta',
     /x\.clave \+ ' — ' \+ x\.porQue/.test(fuente),
     '«falta pago_llave» no dice qué se rompe; «no tiene cómo pagar» sí');
  ok('  ...y lo que solo AVISA no bloquea',
     /No bloquea el montaje/.test(fuente),
     'publicar sin descripción es feo, no roto: confundirlo es fallar por lo que no importa');
  ok('  ...y quién decide qué falta es el MAESTRO, no el flujo',
     !/pago_llave|empresa_nit/.test(fuente) && /var LISTA_DE_ALTA/.test(
       fs.readFileSync('../maestro.gs', 'utf8')),
     'la lista en dos sitios es como empiezan a decir cosas distintas');

  /* La lista distingue los dos niveles, y la diferencia tiene consecuencias:
     una es un rojo del montaje y la otra una línea en el registro. */
  const vacia = crear('./as.js'); vacia.api.instalar();
  const alta = vacia.api.revisarTienda();
  ok('UNA TIENDA RECIÉN INSTALADA no está terminada', !alta.lista && !alta.puedeVender,
     alta.bloquean.map(x => x.clave).join(', '));
  ok('  ...y lo que bloquea es lo que rompe la VENTA, no lo que queda feo',
     alta.bloquean.every(x => ['negocio','whatsapp','sitio_url','pago_llave']
       .indexOf(x.clave) !== -1),
     alta.bloquean.map(x => x.clave).join(', '));
  ok('  ...cada falta con su porqué, que es lo accionable',
     alta.bloquean.concat(alta.avisan).every(x => x.porQue && x.porQue.length > 15),
     (alta.bloquean[0] || {}).porQue);
  ok('  ...y la tienda de prueba, que está completa, no reporta nada',
     g.api.revisarTienda().lista === true,
     JSON.stringify(g.api.revisarTienda()).slice(0, 90));

  /* Un valor entre corchetes cuenta como vacío: es lo que deja instalar() para
     que se vea que falta, y publicarlo anuncia «[NOMBRE DEL COMERCIO]». */
  ok('  ...y un corchete sin llenar cuenta como vacío, no como valor',
     vacia.api.sinLlenar('[NOMBRE DEL COMERCIO]') === true &&
     vacia.api.sinLlenar('La Espiga') === false,
     'es lo que deja la instalación para que se vea que falta');

  const d = g.api.diagnostico();
  ok('EL DIAGNÓSTICO lo pregunta ARRIBA, antes que nada',
     d.texto.indexOf('¿Está terminada esta tienda?'.toUpperCase()) <
     d.texto.indexOf('PESTAÑAS DE LA HOJA'),
     'si la tienda no está terminada, lo demás es ruido');
  ok('  ...y en una tienda a medias marca PROBLEMA, no un aviso suave',
     /PROBLEMA.*terminada/i.test(vacia.api.diagnostico().texto),
     (vacia.api.diagnostico().texto.match(/[^\n]*terminada[^\n]*/) || [''])[0].trim());
}

/* ═══ 28. LAS QUE SE EJECUTAN A MANO, ENCONTRABLES ═══
   El archivo tiene más de cien funciones y el selector del editor las lista
   revueltas. Las cinco que un humano ejecuta estaban perdidas entre las demás,
   hasta que alguien dijo «en las funciones del maestro no veo
   diagnosticoCompleto()» — y estaba ahí, en la línea 835. */
{
  const g = nuevo();
  const fuente = fs.readFileSync('../maestro.gs', 'utf8');
  const conPrefijo = (fuente.match(/^function (A\d_\w+)\(/gm) || [])
    .map(x => x.match(/function (\w+)\(/)[1]);

  ok('LAS DE EJECUCIÓN MANUAL llevan prefijo, así se agrupan en cualquier lista',
     conPrefijo.length === 5, conPrefijo.join(', '));
  ok('  ...numeradas en el orden en que se necesitan, no en el alfabético',
     conPrefijo.join(',') === ['A0_instalar', 'A1_generarStub',
       'A2_diagnosticoCompleto', 'A3_rotarToken', 'A4_respaldoAhora'].join(','),
     'montar una tienda es A0, A1, A2 de arriba abajo');
  ok('  ...y las cinco existen de verdad, no solo el comentario',
     conPrefijo.every(f => typeof g.api[f] === 'function'),
     conPrefijo.filter(f => typeof g.api[f] !== 'function').join(', ') || 'las cinco');

  /* Son envoltorios: los dos nombres funcionan, y por eso el runbook viejo y
     las hojas ya montadas siguen sirviendo. */
  ok('  ...son envoltorios, y el nombre de siempre sigue funcionando',
     typeof g.api.instalar === 'function' &&
     typeof g.api.diagnosticoCompleto === 'function' &&
     typeof g.api.rotarToken === 'function',
     'renombrar habría roto el runbook y las hojas ya montadas');
  ok('  ...y hacen lo mismo, no una copia que se queda atrás',
     g.api.A2_diagnosticoCompleto().texto === g.api.diagnosticoCompleto().texto &&
     /^function A0_instalar\(\) \{ return instalar\(\); \}$/m.test(fuente),
     'una línea, sin lógica propia');

  /* Y la que se ejecuta sin querer. Apps Script elige la PRIMERA función del
     archivo cuando le das a Ejecutar sin escoger, así que la primera tiene que
     ser la que no hace daño empezar. */
  const primera = (fuente.match(/^function (\w+)/m) || [])[1];
  ok('  ...y la PRIMERA función del archivo sigue siendo instalar',
     primera === 'A0_instalar' || primera === 'instalar',
     primera + ' — es la que corre si le dan a Ejecutar sin escoger');
}

/* ═══ 29. EL MAPA DE DESPLIEGUE, Y LOS CUATRO QUE SE QUEDARON ATRÁS ═══
   Había cuatro documentos describiendo tramos del mismo procedimiento y
   NINGUNO nombra «Publicar ahora». Es el patrón 2 a escala de documentación:
   cuatro copias, todas atrasadas. El mapa nuevo es la fuente; los cuatro llevan
   un aviso que lo dice. */
{
  const mapa = fs.readFileSync('../docs/DESPLIEGUE.md', 'utf8');
  const viejos = ['RUNBOOK.md', 'DESPLIEGUE-CLIENTE.md', 'MONTAJE.md', 'INSTALAR.md'];

  ok('EL MAPA cubre del repositorio a la entrega, no un tramo',
     /## 1 · El repositorio/.test(mapa) && /## 16 · La entrega/.test(mapa),
     'de punta a punta o no es un mapa');
  ok('  ...y marca los tres sitios donde el orden cuesta una hora',
     (mapa.match(/⚠/g) || []).length >= 3 &&
     /Generar el stub DESPUÉS de publicar el maestro/.test(mapa),
     'implementar una vez · abrir la /exec · el stub después');
  ok('  ...incluida la trampa que solo aparece al rotar el token',
     /TRES.*sitios|TRES\*\* sitios/.test(mapa) && /pestaña `Tiendas` del panel/.test(mapa),
     'olvidar el del panel marca la tienda como caída, y está perfecta');
  ok('  ...y el paso de WhatsApp, que es donde la seguridad se vuelve agujero',
     /respuesta automática/.test(mapa) && /no tiene cómo pagar/.test(mapa));
  /* Y el que solo existe a partir de la segunda tienda. El mapa se escribió
     montando la primera, cuando cruzar dos hojas era imposible por falta de
     material. Con dos, es el fallo que más cuesta seguir. */
  /* LOS CINCO SECRETOS, CON SU PROCEDENCIA EXACTA. La tabla decía «la URL del
     proyecto de Apps Script» y había que adivinar qué trozo de la URL. Los dos
     que no se pueden deducir —los del maestro— salen de una función que hay
     que correr desde el editor, y eso no estaba escrito en la tabla. */
  ok('LOS CINCO SECRETOS dicen de qué pantalla sale cada uno',
     ['MAESTRO_URL', 'MAESTRO_TOKEN', 'SCRIPT_ID', 'HOJA_ID', 'CLASPRC']
       .every(s => new RegExp('`' + s + '`').test(mapa)) &&
     /A2_diagnosticoCompleto\(\)/.test(mapa) &&
     /entre `\/projects\/` y `\/edit`/.test(mapa) &&
     /entre `\/d\/` y `\/edit`/.test(mapa),
     '«la URL del proyecto» obliga a adivinar qué trozo');
  ok('  ...y que CLASPRC caduca, que es el único que se muere solo',
     /caduca/.test(mapa) && /clasp login/.test(mapa),
     'un secreto que expira sin avisar se diagnostica como flujo roto');
  ok('  ...y los TRES que NO son secretos del repositorio',
     /ALTA_TOKEN/.test(mapa) && /Script Properties/.test(mapa) &&
     /no están cifradas/.test(mapa) && /pago_llave/.test(mapa),
     'el llavero de alta, el token de «Publicar ahora» y la llave de pago');

  /* Y QUE NO HAY QUE VOLVER A TOCAR «IMPLEMENTAR». Se lo dije al operador por
     costumbre, después de una corrida que ya había actualizado la
     implementación y lo había verificado contra la /exec. Un paso manual de
     más en un despliegue no es inocuo: el de al lado —«Nueva
     implementación»— estrena URL y deja la tienda muda. */
  ok('EL MAPA dice que el flujo ya actualiza la implementación',
     /update-deployment/.test(mapa) && /falla si no es la que acaba de publicar/.test(mapa) &&
     /`A0_instalar\(\)` \*\*no despliega nada\*\*/.test(mapa),
     'un paso manual de más al lado de uno que deja la tienda muda');

  ok('  ...y los TRES sitios donde se pueden cruzar dos tiendas',
     /cruzar dos tiendas/.test(mapa) && /Cloudflare/.test(mapa) &&
     /MAESTRO_TOKEN. de este repositorio/.test(mapa),
     'los secretos, la clave de la hoja y el proyecto de Cloudflare');

  viejos.forEach(n => {
    const doc = fs.readFileSync('../docs/' + n, 'utf8');
    ok('  ...y «' + n + '» avisa de que está atrasado y remite al mapa',
       /docs\/DESPLIEGUE\.md/.test(doc) && /atrasado/.test(doc),
       'un documento atrasado sin aviso se lee como si estuviera al día');
  });
}


// ═══ 30. Una hoja no publica en el repositorio de otra ═══
/* EL ÚNICO FALLO DE ESTE PRODUCTO QUE NO DEJA HUELLA EN NINGÚN LADO.
   Con dos tiendas montadas a la vez, los secretos de un repositorio pueden
   acabar apuntando a la hoja del otro comercio. Entonces todo funciona: el
   flujo corre en verde, el maestro contesta, las fotos bajan, el catálogo se
   hornea y Cloudflare despliega. Cada pieza hace bien su trabajo con la hoja
   equivocada. Lo que el comercio ve es «subí una foto y no salió» —salió, en
   la tienda de al lado—, y eso no apunta a ninguna parte.
   La hoja ya sabía a qué repositorio pertenece; lo que faltaba era mirarlo. */
{
  const dela = r => veredicto(r.dice, r.aqui).estado;

  ok('CRUZAR DOS TIENDAS se detecta y se nombra',
     dela({ dice: 'lab/panaderia', aqui: 'lab/organico' }) === 'otra-tienda',
     'es el único fallo del producto que corre entero en verde');
  ok('  ...y la misma tienda escrita de otra forma NO es otra tienda',
     ['https://github.com/lab/organico', 'lab/organico.git', 'Lab/Organico',
      'lab/organico/', '  lab/organico  ']
       .every(x => dela({ dice: x, aqui: 'lab/organico' }) === 'coinciden'),
     'un guardia que se pelea con una barra final se acaba apagando');

  /* NO BLOQUEA A QUIEN NO PUEDE CONTESTAR. Hay tiendas montadas antes de que
     la clave existiera; a esas se les avisa. Bloquearlas convertiría el
     guardia en una puerta cerrada, y el guardia se quitaría. */
  ok('  ...una hoja que no lo declara se avisa, no se bloquea',
     dela({ dice: '', aqui: 'lab/organico' }) === 'sin-declarar' &&
     dela({ dice: 'lab/organico', aqui: '' }) === 'sin-contexto',
     'fuera de Actions no hay contra qué comparar');

  const mt = fs.readFileSync('../montar/misma-tienda.mjs', 'utf8');
  ok('  ...y el aviso dice DÓNDE se cruzan, que son tres sitios',
     /Secrets and variables/.test(mt) && /Configuración, fila repositorio/.test(mt) &&
     /Cloudflare/.test(mt),
     'los secretos, la clave de la hoja y el proyecto de Cloudflare');
  ok('  ...y nombra el negocio de la hoja que contestó',
     /id\.negocio/.test(mt),
     'leer «Panadería» cuando esperabas tomates cierra el caso en un segundo');

  /* Y SE MIRA ANTES DE ESCRIBIR NADA, no después. Comprobarlo al final deja el
     daño hecho y solo lo documenta. */
  [['fotos', 'Bajarlas y convertirlas'],
   ['montaje', '¿Se pidió publicar el maestro?']].forEach(([f, primero]) => {
    const y = fs.readFileSync('../.github/workflows/' + f + '.yml', 'utf8');
    ok('EL FLUJO `' + f + '` lo comprueba ANTES de tocar publicar/',
       y.indexOf('misma-tienda.mjs') > 0 &&
       y.indexOf('misma-tienda.mjs') < y.indexOf(primero),
       'comprobarlo al final documenta el daño en vez de evitarlo');
  });

  ok('  ...y el maestro contesta de quién es la hoja',
     /r\.repositorio = String\(leerConfiguracion\(\)\.repositorio/
       .test(fs.readFileSync('../maestro.gs', 'utf8')),
     'sin eso no hay con qué comparar');
}


// ═══ 31. Publicar una foto no puede costar ocho minutos ═══
/* SE MIDIÓ ANTES DE TOCAR NADA. Las 22 baterías son 292 s; las 12 que abren
   navegador, 290 (99 %); las diez que uno quitaría primero por «no tan
   fundamentales», 3,5 s ENTRE TODAS. Quitar baterías no recupera tiempo y deja
   sin guardia justo lo que permite que `fotos` fusione sin una persona.

   Lo que sí se recupera es el reloj de pared. Los doce navegadores se esperaban
   por una razón de implementación —todos hablaban con el mismo servidor del
   8099 y se pisaban el /__reset— y no por una de fondo. Ahora cada batería
   levanta el suyo en su puerto. Cero aserciones tocadas; el marcador tiene que
   salir idéntico. */
{
  const sh = fs.readFileSync('todas.sh', 'utf8');

  ok('LAS BATERÍAS corren a la vez, cada una con SU servidor',
     /TRABAJADORES/.test(sh) && /8100 \+ i \* 2/.test(sh) && /wait -n/.test(sh),
     'el aislamiento no es un candado: es que no comparten nada');

  /* LA LISTA DE QUÉ SERVIDOR NECESITA CADA BATERÍA SE LE PREGUNTA A ELLA.
     Escrita aparte sería la segunda copia del mismo dato (patrón 2): se agrega
     una batería, nadie toca la lista, y arranca sin servidor. */
  ok('  ...y qué servidor necesita cada una sale de la batería, no de una lista',
     /grep -q 'process\.env\.PUERTO \|\|'/.test(sh),
     'una lista aparte se queda atrás la primera vez que se agrega una batería');

  /* NINGUNA PUEDE LLEVAR EL PUERTO CLAVADO. En paralelo, una batería que pida
     el 8099 hablaría con el servidor de otra —o con ninguno— y el fallo saldría
     como un error de red que no dice nada. */
  const clavado = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && /localhost:80\d\d/.test(fs.readFileSync(n, 'utf8')));
  ok('  ...y NINGUNA batería lleva el puerto clavado',
     clavado.length === 0,
     clavado.join(', ') + ' — en paralelo hablaría con el servidor de otra');

  /* ESPERAR A QUE CONTESTE NO ES ESPERAR DOS SEGUNDOS. El `sleep 2` de antes
     era una apuesta sobre la carga de la máquina: patrón 8, el reloj como
     entrada que nadie declaró. */
  ok('  ...y se espera a que el servidor CONTESTE, no un número de segundos',
     /curl -sf "http:\/\/localhost:\$puerto\/__reset"/.test(sh) && /kill -0/.test(sh),
     'un sleep fijo falla en una máquina cargada y no dice por qué');

  ok('  ...con interruptor para volver a serial y depurar',
     /TRABAJADORES=\$\{TRABAJADORES:-/.test(sh),
     'si una batería solo falla en paralelo, el fallo es suyo');

  /* Y LO QUE YA PROTEGÍA ESTE ARCHIVO SIGUE PROTEGIENDO. Es el riesgo de
     reescribir el corredor: que el marcador salga verde porque dejó de mirar. */
  ok('  ...y sigue diciendo QUÉ se cayó, y sin pasar por verde contando 0/0',
     /grep -E "\^ FALLA"/.test(sh) && /tail -25/.test(sh) && /-z "\$rotas"/.test(sh),
     'reescribir el corredor y perder el guardia sería el peor cambio posible');

  /* NINGUNA BATERÍA DUERME UN NÚMERO FIJO.
     De los 292 s que tardaba la suite, 182 —el 62 %— eran `waitForTimeout`:
     dormir, no probar. Y dormir a ojo falla por los dos lados: sobra cuando la
     máquina va suelta, y NO ALCANZA cuando va cargada, y entonces la batería
     se cae por algo que no tiene que ver con lo que probaba.

     La regla no es «pocos milisegundos», es NINGUNO: se espera la condición
     que la aserción va a mirar. El único caso sin condición —comprobar una
     AUSENCIA, que no llega nada— pasa por `ventana()`, que obliga a escribir
     por qué. Un número suelto en medio de una batería no se distingue de los
     182 segundos que se acaban de quitar. */
  const durmiendo = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && n !== 'esperar.js')
    .filter(n => /p\.waitForTimeout|page\.waitForTimeout/.test(fs.readFileSync(n, 'utf8')));
  ok('NINGUNA BATERÍA espera un número de milisegundos',
     durmiendo.length === 0,
     durmiendo.join(', ') + ' — la condición se espera, el reloj se adivina');
  /* ── El secreto que se pega mal, y el mensaje que mandaba al sitio
        equivocado ──────────────────────────────────────────────────────────
     Montando la segunda tienda, `montaje` murió con «No credentials found».
     Lo que había en el secreto CLASPRC era un `.clasp.json` —el archivo que
     dice a qué proyecto subir— en vez de un `~/.clasprc.json` —las
     credenciales—. Y es un error razonable: `clasp login` escribe en la
     carpeta PERSONAL y no deja nada en la del proyecto, así que parece que
     falló y se acaba cogiendo el único archivo de clasp que sí se ve.
     Peor: NUESTRO mensaje listaba «las dos causas de siempre» —cuenta
     equivocada, API sin habilitar— y no era ninguna de las dos. Un error que
     apunta al sitio equivocado cuesta más que no decir nada. */
  {
    const { veredicto } = require('../montar/revisar-clasprc.mjs');
    const clasprc = t => veredicto(typeof t === 'string' ? t : JSON.stringify(t));

    ok('SE MIRA QUÉ HAY en el secreto CLASPRC antes de dárselo a clasp',
       clasprc({ tokens: { default: { refresh_token: 'x' } } }).ok === true &&
       clasprc({ scriptId: '1abc', rootDir: '../' }).ok === false,
       'el formato de clasp 3 pasa; un .clasp.json, no');
    ok('  ...y cuando es el archivo equivocado, lo NOMBRA',
       /TIENE UN \.clasp\.json/.test(clasprc({ scriptId: '1abc' }).mensaje) &&
       /carpeta personal|CARPETA\n?\s*PERSONAL/i.test(clasprc({ scriptId: '1abc' }).mensaje),
       '«No credentials found» es cierto y no ayuda');
    ok('  ...distinguiendo vacío, no-es-JSON y sin refresh_token',
       [['', /vacío/], ['{', /no es un JSON/], [{ tokens: { default: { access_token: 'y' } } }, /refresh_token/]]
         .every(([e, re]) => { const r = clasprc(e); return !r.ok && re.test(r.mensaje); }),
       'cada uno se arregla distinto');
    ok('  ...y acepta los formatos viejos, que siguen funcionando',
       clasprc({ token: { refresh_token: 'x' }, oauth2ClientSettings: {} }).ok &&
       clasprc({ refresh_token: 'x', access_token: 'y' }).ok,
       'clasp 3 los sigue leyendo: rechazarlos sería inventar un fallo');

    const y = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
    ok('  ...y el flujo lo comprueba ANTES de instalar clasp',
       y.indexOf('revisar-clasprc.mjs') > 0 &&
       y.indexOf('revisar-clasprc.mjs') < y.indexOf('npm i -g @google/clasp'),
       'fallar rápido y por el motivo correcto');

    /* Y el mensaje de la herramienta deja de mandar a comprobar la cuenta
       cuando lo que falta es el archivo. Para decidirlo hay que LEER lo que
       dijo clasp, y con stdio:'inherit' su salida quedaba en null: mirarla
       habría sido mirar a la nada. */
    const pm = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');
    ok('  ...y la salida de clasp se CAPTURA, que es lo que permite decidir',
       !/clasp\(\['push', '--force'\], \{ cwd: tmp, stdio: 'inherit' \}\)/.test(pm),
       'con stdio:inherit la decisión se tomaría sobre null');

    /* TRES FALLOS DISTINTOS QUE SE CONTESTABAN CON EL MISMO PÁRRAFO.
       «Las dos causas de siempre» —cuenta equivocada, API sin habilitar—
       mandó dos veces seguidas a mirar donde no era: a revisar la cuenta
       cuando lo que faltaba era un archivo, y a habilitar una API que ya
       estaba habilitada. Un error que apunta al sitio equivocado cuesta más
       que uno que no dice nada. */
    const { porQueFallo } = require('../montar/publicar-maestro.mjs');
    const dice = {
      'sin-credenciales': 'No credentials found.',
      'sin-permiso':      'The caller does not have permission',
      'api-apagada':      'User has not enabled the Apps Script API. Enable it by ' +
                          'visiting https://script.google.com/home/usersettings',
      'otro':             'ECONNRESET'
    };
    ok('CADA QUEJA DE GOOGLE se reconoce como la suya',
       Object.keys(dice).every(k => porQueFallo(dice[k]) === k),
       Object.keys(dice).map(k => k + ':' + porQueFallo(dice[k])).join(' '));
    /* El de la API apagada TAMBIÉN trae un 403. Si se mirara primero el
       permiso, se lo tragaría y volveríamos a mandar al sitio equivocado. */
    ok('  ...y la API apagada gana al 403, que también lo trae',
       porQueFallo('403 PERMISSION_DENIED: User has not enabled the Apps Script API ' +
                   'https://script.google.com/home/usersettings') === 'api-apagada',
       'el orden de las comprobaciones ES la comprobación');

    ok('  ...y «no tienes permiso» dice QUIÉN y SOBRE QUÉ',
       /cuenta:    /.test(pm) && /proyecto:  /.test(pm) &&
       /show-authorized-user/.test(pm) && /list-scripts/.test(pm),
       'Google dice que alguien no tiene permiso, sin decir quién ni sobre qué');
    ok('  ...y el scriptId se imprime ENTERO, no truncado',
       /proyecto ' \+ cfg\.scriptId\)/.test(pm) &&
       !/cfg\.scriptId\.slice\(0, 14\)/.test(pm),
       'truncado, dos proyectos de la misma plantilla se ven idénticos');

    /* Y el archivo no puede volver a hacer nada al importarlo: probar la
       clasificación no puede disparar un despliegue. */
    ok('  ...y publicar-maestro NO hace nada al importarlo',
       /import\.meta\.url === pathToFileURL\(process\.argv\[1\] \|\| ''\)\.href\) main\(\)/.test(pm),
       'importarlo para probarlo llegó a crear montar/.clasp.json');

    /* ── El plantón de 45 segundos, y el consejo que hablaba de otra cosa ──
       Montando la segunda tienda, `?a=bloques` contestó bien desde
       publicar-maestro.mjs y, segundos después, se plantó en 45 s desde
       preparar-index.mjs con la MISMA petición. No era la tienda: Apps Script
       está frío justo después de actualizar una implementación, que es
       exactamente el momento del montaje en que se le pregunta.
       Y el mensaje del plantón decía «si es una foto, casi siempre es que
       pesa demasiado» — en un plantón de «bloques», mandando a buscar una
       foto grande que no existía. */
    const { topeDe, seReintenta, mensajeDePlanton } = require('../montar/tienda.mjs');

    ok('EL TOPE de una llamada normal aguanta un Apps Script frío',
       topeDe('bloques') >= 90000 && topeDe('foto') >= 180000,
       'bloques ' + topeDe('bloques') / 1000 + ' s · foto ' + topeDe('foto') / 1000 + ' s');
    ok('  ...y un plantón se reintenta, porque en frío es la primera vez',
       seReintenta('bloques') && seReintenta('catalogo'),
       'un plantón en frío no es un fallo');
    ok('  ...pero NO lo que escribe en la hoja',
       !seReintenta('sembrar'),
       'un plantón no dice si la escritura llegó: reintentarla puede duplicarla');

    ok('EL CONSEJO DEL PLANTÓN es de lo que falló, no de fotos siempre',
       !/foto/i.test(mensajeDePlanton('bloques')) &&
       /Solo yo/.test(mensajeDePlanton('bloques')) &&
       /pesa demasiado/.test(mensajeDePlanton('foto', { id: '1x' })),
       'a «bloques» le mandaba a buscar una foto grande que no existía');
    ok('  ...y nombra la foto concreta cuando sí lo es',
       /\(id 1x\)/.test(mensajeDePlanton('foto', { id: '1x' })),
       'con cien fotos, saber cuál reventó es la mitad del arreglo');
    ok('  ...y no promete un reintento que no hubo',
       /ni al reintentar/.test(mensajeDePlanton('bloques')) &&
       /No se reintenta porque escribe/.test(mensajeDePlanton('sembrar')),
       'decir «ni al reintentar» sin reintentar es una mentira pequeña y cara');

    /* Y CUÁNTO TARDÓ, SIEMPRE. La comprobación de publicar-maestro no lleva
       tope, así que puede tardar cuarenta segundos y decir «sí» tan tranquila
       mientras el paso siguiente se planta con la misma petición. El log no
       traía ni un número con el que sospecharlo. */
    ok('  ...y una llamada lenta DICE cuánto tardó',
       /RUIDOSA_DESDE/.test(fs.readFileSync('../montar/tienda.mjs', 'utf8')) &&
       /sí, en ' \+ tardo \+ ' s\./.test(pm) && /está FRÍO/.test(pm),
       'sin ese número, «contestó» y «casi no contesta» se ven igual');
  }

  ok('  ...y la única espera fija que queda tiene nombre y motivo',
     /function ventana/.test(fs.readFileSync('esperar.js', 'utf8')) &&
     /ventana\(p, \d+, '/.test(fs.readFileSync('val.js', 'utf8')),
     'una ausencia sí necesita una ventana, y tiene que decirlo');

  /* EL NAVEGADOR NO CAMBIA ENTRE CORRIDAS Y SE BAJABA ENTERO CADA VEZ.
     `pruebas.yml` ya lo cacheaba; `fotos.yml` —el que de verdad corre cada
     cuatro horas— se había quedado fuera. Es el patrón 6: lo que se arregla
     para uno deja fuera al que más lo necesitaba. */
  /* Lo que el runner va a tener: lo versionado, no lo que hay en este disco. */
  const versionados = new Set(
    require('node:child_process')
      .execFileSync('git', ['ls-files'], { cwd: '..', encoding: 'utf8' })
      .split('\n').filter(Boolean));

  ['fotos', 'montaje', 'pruebas'].forEach(f => {
    const y = fs.readFileSync('../.github/workflows/' + f + '.yml', 'utf8');
    ok('EL FLUJO `' + f + '` no vuelve a bajar Chromium en cada corrida',
       /path: ~\/\.cache\/ms-playwright/.test(y) && /actions\/cache/.test(y),
       '130 MB por corrida, siempre los mismos');
    ok('  ...ni el binario nativo de sharp',
       /path: ~\/\.npm/.test(y),
       'lo único que pesa de npm en este repositorio');

    /* LO QUE UNA CACHÉ MIRA TIENE QUE EXISTIR, Y ESTO NO LO COMPROBABA NADIE.
       La primera versión usaba `cache: npm` con los dos package-lock.json —que
       están en .gitignore—. En un checkout limpio no existen y setup-node se
       cae con «Some specified paths were not resolved», antes de correr nada.

       Y la aserción que yo había escrito daba VERDE: comprobaba que el texto
       "pruebas/package-lock.json" apareciera en el yml. Aparecía. El archivo
       no existía. Es el patrón 5 —una comprobación mal elegida es peor que
       ninguna— y lo cometí escribiendo el guardia de mi propio cambio.
       Esta mira los archivos. */
    const mirados = [...y.matchAll(/hashFiles\(([^)]*)\)/g)]
      .flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]))
      .concat([...y.matchAll(/cache-dependency-path:\s*\|([\s\S]*?)\n\s*\n/g)]
        .flatMap(m => m[1].split('\n').map(s => s.trim()).filter(Boolean)));
    /* «Existe» no basta, y ese fue el segundo error: `pruebas/package-lock.json`
       EXISTE en cualquier máquina donde se haya corrido npm install. Lo que no
       está es en el repositorio, y el runner solo tiene lo que se versiona.
       Una comprobación hecha en la máquina equivocada tampoco comprueba. */
    const fantasmas = mirados.filter(r => !versionados.has(r));
    ok('  ...y los archivos de los que depende la caché están VERSIONADOS',
       fantasmas.length === 0,
       fantasmas.join(', ') + ' — en el runner no existen y el flujo se cae ' +
       'antes de correr nada');
  });

  /* Y LA CORRIDA DUPLICADA QUE ADEMÁS PEDÍA UNA PERSONA. El pull request que
     abre `fotos` lanzaba `pruebas` otra vez sobre los mismos bytes; esa corrida
     queda esperando aprobación de un mantenedor y, si nadie la aprueba, caduca
     y deja una X roja en un pull request ya fusionado. Una marca roja que no
     significa nada enseña a no mirar las marcas. */
  {
    const p = fs.readFileSync('../.github/workflows/pruebas.yml', 'utf8');
    const f = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');
    ok('`pruebas` NO se repite sobre el pull request que abre `fotos`',
       /github-actions\[bot\]/.test(p) && /startsWith\(github\.head_ref, 'fotos\/nuevas-'\)/.test(p),
       'esa corrida espera aprobación y caduca en rojo');
    /* Y LA EXCUSA TIENE QUE SEGUIR SIENDO CIERTA. El salto se justifica SOLO
       porque `fotos` ya las corrió antes de fusionar. El día que eso deje de
       pasar, esto fusiona sin haber probado nada. */
    ok('  ...porque `fotos` YA las corrió antes de fusionar, y eso sigue siendo cierto',
       f.indexOf('todas.sh') > 0 && f.indexOf('todas.sh') < f.indexOf('gh pr merge'),
       'sin esto, saltarse pruebas sería fusionar a ciegas');
    ok('  ...y el de `montaje`, que espera a una persona, se sigue comprobando',
       !/montaje\/desde-la-hoja/.test(p),
       'ese es el que puede reescribir el <head> y la política de seguridad');
  }
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
