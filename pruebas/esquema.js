/* ============================================================================
   EL CONTRATO DE DATOS, CONGELADO.
   ----------------------------------------------------------------------------
   Un producto que es UNA TIENDA POR COMERCIO tiene el problema al revés que un
   sistema con una sola base: aquí no hay una migración que se corra una vez.
   Hay N hojas, de N cuentas de Google distintas, que se actualizan cuando su
   dueño abre el editor. Renombrar una columna no rompe una tienda: rompe todas
   las que todavía no se actualizaron, y las rompe en silencio, porque una hoja
   de cálculo no tiene errores de compilación.

   De ahí la regla del plan: SOLO SE AGREGA, Y SOLO AL FINAL. Esta batería es
   lo que la hace cumplir. No describe el esquema: lo LEE del maestro —corriendo
   instalar() en el emulador, que es lo mismo que corre en la hoja de verdad— y
   lo compara contra la foto congelada en esquema.json.

   Por qué se deriva y no se escribe a mano: es el patrón 2 de la bitácora. Dos
   copias del mismo procedimiento y una se queda atrás. La foto se genera con
   `node esquema.js --congelar`, y ese comando es un ACTO DELIBERADO: aparece en
   el diff del commit, que es exactamente donde alguien tiene que verlo.
   ============================================================================ */
const fs = require('fs');
const path = require('path');
const { crear, configurar } = require('./gas.js');

const FOTO = path.join(__dirname, 'esquema.json');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* ── El esquema vivo, leído del maestro ─────────────────────────────────── */
function esquemaVivo() {
  /* instalar() y las puertas escriben en la consola a propósito: ese registro es
     lo que el técnico lee en el editor. Aquí estorba, y lo que importa es el
     veredicto de abajo. */
  const hablar = console.log;
  console.log = function () { };
  const g = configurar((function () { const x = crear('./as.js'); x.api.instalar(); return x; })());
  const puerta = a => JSON.parse(g.api.doGet({ parameter: { a: a, t: g.token } })._texto);

  const hojas = {};
  for (const [nombre] of g.hojas) hojas[nombre] = g.filas(nombre)[0].map(String);

  const catalogo = puerta('catalogo');
  const res = {
    hojas: hojas,
    configuracion: g.filas('Configuración').slice(1).map(f => String(f[0])),
    puertas: {
      version:   Object.keys(puerta('version')),
      catalogo:  Object.keys(catalogo),
      identidad: Object.keys(puerta('identidad')),
      bloques:   Object.keys(puerta('bloques')),
      panel:     Object.keys(puerta('panel'))
    },
    registros: {
      producto: Object.keys((catalogo.productos || [])[0] || {}),
      envio:    Object.keys((catalogo.envios || [])[0] || {})
    }
  };
  console.log = hablar;
  return res;
}

/* ── Comparar una lista contra su foto ──────────────────────────────────── */
/* Agregar al final: permitido, y se anuncia. Cualquier otra cosa —renombrar,
   mover, quitar— es un fallo, aunque el resultado "se vea bien". */
function comparar(rotulo, antes, ahora) {
  if (!antes) { ok(rotulo + ': NUEVO', true, 'no estaba en la foto: ' + ahora.length + ' campos'); return; }

  const conservados = antes.every((v, i) => ahora[i] === v);
  ok(rotulo,
     conservados && ahora.length >= antes.length,
     conservados
       ? (ahora.length > antes.length
           ? 'agregado al final: ' + ahora.slice(antes.length).join(', ')
           : '')
       : 'CAMBIÓ lo que ya existía\n           antes: ' + antes.join(' | ') +
         '\n           ahora: ' + ahora.join(' | '));
}

const vivo = esquemaVivo();

if (process.argv.indexOf('--congelar') !== -1) {
  fs.writeFileSync(FOTO, JSON.stringify(vivo, null, 2) + '\n');
  console.log('Foto del esquema reescrita: ' + FOTO);
  console.log('Queda en el diff del commit. Que alguien la mire es el punto.');
  process.exit(0);
}

if (!fs.existsSync(FOTO)) {
  console.log(' FALLA | No existe esquema.json. Créalo con: node esquema.js --congelar');
  console.log('\nResultado: 0/1');
  process.exit(1);
}

const foto = JSON.parse(fs.readFileSync(FOTO, 'utf8'));

/* ── 1. Las pestañas ────────────────────────────────────────────────────── */
/* Que no desaparezca ninguna. Una hoja que falta no da error: da una lista
   vacía, y la tienda sigue sirviendo como si el comercio no tuviera nada. */
{
  const faltan = Object.keys(foto.hojas).filter(h => !vivo.hojas[h]);
  ok('LAS PESTAÑAS de la foto siguen todas', faltan.length === 0, faltan.join(', '));
  const nuevas = Object.keys(vivo.hojas).filter(h => !foto.hojas[h]);
  if (nuevas.length) ok('  ...y hay pestañas nuevas', true, nuevas.join(', '));
}

/* ── 2. Las columnas, una por una ───────────────────────────────────────── */
for (const h of Object.keys(foto.hojas)) {
  if (vivo.hojas[h]) comparar('COLUMNAS de «' + h + '»', foto.hojas[h], vivo.hojas[h]);
}

/* ── 3. Las claves de Configuración ─────────────────────────────────────── */
/* Aquí el orden también importa, y no por capricho: escribirConfiguracion()
   ubica la fila por posición para no tocar lo que el comerciante escribió. */
comparar('CLAVES de Configuración', foto.configuracion, vivo.configuracion);

/* ── 4. Lo que sale por las puertas ─────────────────────────────────────── */
/* El index.html de una tienda que todavía no se ha actualizado sigue leyendo
   estos nombres. Quitar uno es romper esa tienda desde el servidor, sin tocarla. */
for (const p of Object.keys(foto.puertas)) {
  comparar('PUERTA ?a=' + p, foto.puertas[p], vivo.puertas[p] || []);
}
for (const r of Object.keys(foto.registros)) {
  comparar('CAMPOS de cada ' + r, foto.registros[r], vivo.registros[r] || []);
}

/* ── 5. Y el documento tiene que decir lo mismo ─────────────────────────── */
/* El contrato escrito y el contrato que corre son dos copias del mismo
   procedimiento: patrón 2. Esto ata la una a la otra. */
{
  const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'CONTRATOS.md'), 'utf8');
  const sinTilde = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const d = sinTilde(doc);

  const hojasFuera = Object.keys(vivo.hojas).filter(h => d.indexOf(sinTilde(h)) === -1);
  ok('EL DOCUMENTO nombra las nueve pestañas', hojasFuera.length === 0, hojasFuera.join(', '));

  const colsFuera = [];
  for (const h of Object.keys(vivo.hojas))
    for (const c of vivo.hojas[h])
      if (d.indexOf(sinTilde(c)) === -1) colsFuera.push(h + '.' + c);
  ok('  ...y todas sus columnas', colsFuera.length === 0, colsFuera.join(', '));

  /* Con acento invertido, no como subcadena suelta. `repositorio` pasó esta
     comprobación sin estar documentada porque la palabra «repositorio» aparece
     en la prosa del documento diez veces. Una comprobación que se satisface
     con una coincidencia casual no comprueba nada. */
  const clavesFuera = vivo.configuracion.filter(c => doc.indexOf('`' + c + '`') === -1);
  ok('  ...y todas las claves de Configuración', clavesFuera.length === 0, clavesFuera.join(', '));

  ok('  ...y escribe la regla que todo esto sostiene',
     /solo al final/i.test(doc) && /nunca.{0,40}renombr|prohibido renombr/i.test(doc),
     'agregar al final, nunca renombrar ni reordenar');
  ok('  ...y dice cómo se regenera la foto',
     /--congelar/.test(doc), 'node esquema.js --congelar');
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
