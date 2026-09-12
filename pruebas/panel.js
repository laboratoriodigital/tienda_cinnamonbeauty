/* ============================================================================
   El panel de tiendas.
   ----------------------------------------------------------------------------
   Este archivo administra el negocio, no una tienda. Lo que tiene que sobrevivir
   es lo aburrido: que una tienda caída no tumbe el panel, que las cifras que
   cruzan no traigan datos de compradores, y que el correo de la mañana diga en
   el asunto si hay que abrirlo o no.

   Se prueba contra panel.js —copia literal de panel.gs— y contra as.js, que es
   el maestro de verdad: la puerta ?a=panel se ejercita con el código que se
   despliega, no con una imitación.
   ============================================================================ */
const fs = require('fs');
/* La versión no se escribe a mano aquí: se saca del maestro. Estaba repetida en
   ocho sitios y cada release obligaba a perseguirla. Patrón 2 de la bitácora. */
const LA_VERSION = (require('fs').readFileSync('./as.js', 'utf8')
  .match(/var VERSION = '([^']+)'/) || [])[1];
const { crear, COMERCIO, configurar } = require('./gas.js');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const EXEC = 'https://script.google.com/macros/s/EMULADO/exec';

/* Una tienda de mentira que contesta como contestaría una de verdad. */
const tiendaFalsa = (extra) => Object.assign({
  respaldo: { fecha: new Date().toISOString(), archivo: 'Copia_de_X_hoy' },
  lecturasHoy: 0, cuotaCorreo: 100,
  ok: true, version: LA_VERSION, negocio: 'Tienda', sitio: '', whatsapp: '',
  correo: '', hoja: '', productos: 8, publicados: 8, agotados: 0, pocos: 0,
  ventasMes: 1000000, ventasMesAnterior: 800000, pedidosMes: 10, ticket: 100000,
  tasaCierre: 0.5, ventasAyer: 50000, pedidosAyer: 2, porConfirmar: 0,
  atrasados: 0, errores: 0, meses: [['abr 26', 0], ['may 26', 900000]],
  consultado: new Date().toISOString()
}, extra || {});

function panel(tiendas, respuestas) {
  const g = crear('./pn.js');
  g.api.instalar();
  const h = g.hojas.get('Tiendas');
  // Fuera la fila de ejemplo que siembra instalar().
  h._datos.length = 1;
  tiendas.forEach((t, i) => {
    h.getRange(i + 2, 1, 1, 15).setValues([[
      t.estado || 'Activa', t.comercio, t.contacto || 'Ana', '3001234567',
      '', t.plan || 'Estándar', t.precio === undefined ? 60000 : t.precio,
      t.dia || 5, new Date(), 'https://x.workers.dev/',
      t.servicio === undefined ? EXEC : t.servicio,
      t.token === undefined ? 'tk-' + t.comercio : t.token,
      '', '', ''
    ]]);
  });
  (respuestas || []).forEach(([patron, fn]) => g.responder(patron, fn));
  return g;
}

// ═══ 1. La puerta del maestro: qué sale y qué NO sale ═══
{
  const m = crear('./as.js');
  m.api.instalar();
  /* Con el nombre de fábrica —"[NOMBRE DEL COMERCIO]"— la aserción de que no
     sale ni un dato de un comprador se caía sola: la palabra "nombre" estaba
     ahí, en un rótulo. Una tienda de verdad tiene nombre de verdad. */
  configurar(m);
  const pedir = (t) => JSON.parse(m.api.doGet({ parameter: { a: 'panel', t: t } })._texto);

  const r = pedir(m.token);
  ok('El maestro contesta el resumen de SU tienda', r.ok === true, JSON.stringify(r).slice(0, 70));
  ok('  ...con la versión, para saber quién quedó atrás', r.version === LA_VERSION, r.version);
  ok('  ...las cifras del mes y las de ayer',
     typeof r.ventasMes === 'number' && typeof r.ventasAyer === 'number' &&
     typeof r.porConfirmar === 'number');
  ok('  ...y el inventario, que es lo que se le avisa al comercio',
     typeof r.agotados === 'number' && typeof r.productos === 'number',
     r.productos + ' productos');

  /* El barrido busca esas palabras en TODO el JSON, y eso incluye nombres de
     campo. `alta` lleva claves de configuración del COMERCIO —empresa_direccion
     entre ellas— y hacía saltar el guardián por una dirección que no es de
     ningún comprador. Se excluye de este barrido y se comprueba aparte, abajo,
     con una regla más estrecha: solo claves conocidas, nunca valores. Ensanchar
     el guardián para que quepa lo mío habría sido la otra salida, y la mala. */
  const sinAlta = Object.assign({}, r); delete sinAlta.alta;
  const crudo = JSON.stringify(sinAlta);
  ok('NO SALE NI UN DATO DE UN COMPRADOR: ni nombre, ni celular, ni dirección',
     !/nombre|celular|direccion|dirección|cliente|pendientes/i.test(crudo));
  ok('  ...ni el detalle de un solo pedido',
     !/codigo|código/i.test(crudo) && crudo.indexOf('"pedidos"') === -1);
  /* Lo que cruza son totales. Lo anidado se permite por lista, y de cada uno se
     enumeran SUS CLAVES: si mañana alguien le cuelga ahí un dato de un pedido,
     esto se cae. La lista es corta a propósito — cuando deje de serlo, la
     pregunta ya no será «cuáles» sino «por qué tantos». */
  const PERMITIDOS = {
    respaldo: ['fecha', 'archivo', 'borradas', 'error'],
    rescates: ['n', 'peor', 'ultimo'],
    alta: ['bloquean', 'avisan']
  };
  const anidados = Object.keys(r).filter(k => r[k] && typeof r[k] === 'object' &&
                                              !Array.isArray(r[k]));
  ok('  ...lo que cruza son totales, salvo dos registros contados',
     anidados.every(k => PERMITIDOS[k]),
     anidados.join(',') || 'ninguno');
  anidados.forEach(k => {
    ok('  ...y «' + k + '» solo lleva las claves previstas',
       Object.keys(r[k]).every(c => (PERMITIDOS[k] || []).indexOf(c) !== -1),
       Object.keys(r[k]).join(',') || 'vacío');
  });

  /* `alta` dice QUÉ FALTA, no QUÉ DICE. Mandar los valores sería mandar la
     llave de pago de cada comercio a una hoja donde no pinta nada, así que se
     comprueba que lo que viaja son claves conocidas y nada más. */
  {
    const claves = [].concat(r.alta.bloquean, r.alta.avisan);
    const fuente = fs.readFileSync('./as.js', 'utf8');
    const conocidas = (fuente.slice(fuente.indexOf('var LISTA_DE_ALTA'))
      .match(/clave: '([a-z_]+)'/g) || []).map(x => x.match(/'([a-z_]+)'/)[1]);
    ok('  ...y «alta» manda CLAVES, nunca valores',
       claves.every(c => conocidas.indexOf(c) !== -1),
       claves.join(', ') || 'ninguna: la tienda de prueba está completa');
    ok('  ...y ninguna trae un valor pegado', claves.every(c => !/[ :=]/.test(c)));
  }

  ok('CON TOKEN MALO no contesta nada', (() => {
       const x = pedir('me-lo-inventé');
       return x.ok === false && /oken/.test(x.error);
     })(), JSON.stringify(pedir('nel')));
  ok('  ...ni con el token vacío', pedir('').ok === false);

  ok('La puerta vieja del menú sigue viva', (() => {
       const x = JSON.parse(m.api.doGet({ parameter: { a: 'menu', t: m.token } })._texto);
       return x.ok && x.menu.length === m.api.menuDeLaHoja().length;
     })());
  ok('Y una acción inventada sigue rechazándose',
     /desconocida/i.test(JSON.parse(m.api.doGet({ parameter: { a: 'robar' } })._texto).error || ''));
}

// ═══ 2. Se consultan TODAS a la vez, no una por una ═══
{
  const g = panel([{ comercio: 'A' }, { comercio: 'B' }, { comercio: 'C' }],
                  [[EXEC, () => ({ cuerpo: tiendaFalsa() })]]);
  g.api.actualizar();
  ok('TRES TIENDAS, UNA SOLA IDA A LA RED', g.peticiones.length === 1,
     g.peticiones.length + ' llamada(s) de red');
  ok('  ...con las tres URL adentro', g.peticiones[0].length === 3);
  ok('  ...y cada una lleva su propio token',
     g.peticiones[0].every(u => /[?&]t=tk-/.test(u)), g.peticiones[0][0].slice(-30));
  ok('  ...pidiendo la puerta del panel, no otra',
     g.peticiones[0].every(u => /a=panel/.test(u)));
}

// ═══ 3. Una tienda caída no tumba el panel ═══
{
  const g = panel([{ comercio: 'Buena' }, { comercio: 'Caida' }, { comercio: 'Rara' }], [
    ['t=tk-Buena', () => ({ cuerpo: tiendaFalsa({ ventasMes: 500000 }) })],
    ['t=tk-Caida', () => ({ codigo: 404, cuerpo: 'no' })],
    ['t=tk-Rara',  () => ({ cuerpo: 'esto no es JSON' })]
  ]);
  const r = g.api.actualizar();
  const todo = g.filas('Métricas');
  const met = todo.slice(1);
  // Por nombre de columna, no por posición: agregar una columna en el medio no
  // debe hacer que esta batería mienta.
  const col = (n) => todo[0].indexOf(n);

  ok('UNA TIENDA CAÍDA NO IMPIDE VER LAS DEMÁS', met.length === 3, met.length + ' filas');
  ok('  ...la buena queda con sus cifras',
     met[0][1] === 'En línea' && met[0][col('Ventas del mes')] === 500000,
     String(met[0][1]) + ' · ' + met[0][col('Ventas del mes')]);
  ok('  ...la caída queda marcada, no vacía', met[1][1] === 'NO RESPONDE', String(met[1][1]));
  ok('  ...y dice el 404 con el paso para arreglarlo',
     /404/.test(String(met[1][2])) && /Cualquier persona/.test(String(met[1][2])),
     String(met[1][2]).slice(0, 80));
  ok('  ...una respuesta ilegible tampoco rompe nada',
     met[2][1] === 'NO RESPONDE' && /ilegible/i.test(String(met[2][2])),
     String(met[2][2]).slice(0, 50));
  ok('  ...y NO se inventa ceros donde no hubo respuesta',
     met[1][col('Ventas del mes')] === '' && met[1][col('Productos')] === '',
     'ventas y productos vacíos, no 0');

  ok('LO QUE LA TIENDA DICE DE SÍ MISMA queda a la vista',
     met[0][col('Se llama')] === 'Tienda' && col('Correo del resumen') > 0,
     todo[0].slice(3, 7).join(' · '));
  ok('  ...y si no tiene correo de resumen, lo dice en vez de dejarlo en blanco',
     /sin configurar/.test(String(met[0][col('Correo del resumen')])),
     String(met[0][col('Correo del resumen')]));
  ok('  ...la carga del día también, que es lo que empuja el techo de Google',
     col('Lecturas hoy') > 0 && col('Correos que le quedan') > 0);
  ok('El aviso final dice cuántas fallaron', /2 sin responder/.test(r.texto), r.texto);

  ok('SI SE CAE LA RED ENTERA, se marcan todas y no se pierde el panel', (() => {
       const g2 = panel([{ comercio: 'A' }, { comercio: 'B' }],
                        [[EXEC, () => ({ cuerpo: tiendaFalsa() })]]);
       g2.sinRed();
       g2.api.actualizar();
       const m = g2.filas('Métricas').slice(1);
       return m.length === 2 && m.every(f => f[1] === 'NO RESPONDE');
     })());
}

// ═══ 4. A quién se molesta y a quién no ═══
{
  const g = panel([
    { comercio: 'Activa',    estado: 'Activa' },
    { comercio: 'Montaje',   estado: 'En montaje' },
    { comercio: 'Pausada',   estado: 'Pausada' },
    { comercio: 'Cancelada', estado: 'Cancelada' },
    { comercio: 'SinURL',    estado: 'Activa', servicio: '' }
  ], [[EXEC, () => ({ cuerpo: tiendaFalsa() })]]);
  g.api.actualizar();
  const pedidas = g.peticiones[0] || [];
  ok('SOLO SE CONSULTA a las activas y a las que están en montaje',
     pedidas.length === 2, pedidas.length + ' consultadas');
  ok('  ...una pausada no se molesta', !pedidas.some(u => /Pausada/.test(u)));
  ok('  ...una cancelada tampoco', !pedidas.some(u => /Cancelada/.test(u)));
  ok('  ...y una sin URL no genera una llamada rota', !pedidas.some(u => u.indexOf('undefined') !== -1));
}

// ═══ 5. El tablero: lo que se mira sin leer ═══
{
  const g = panel([
    { comercio: 'Grande',  precio: 90000, estado: 'Activa' },
    { comercio: 'Chica',   precio: 45000, estado: 'Activa' },
    { comercio: 'Nueva',   precio: 60000, estado: 'En montaje' },
    { comercio: 'Dormida', precio: 45000, estado: 'Pausada' }
  ], [
    ['t=tk-Grande', () => ({ cuerpo: tiendaFalsa({ ventasMes: 3000000, pedidosMes: 20 }) })],
    ['t=tk-Chica',  () => ({ cuerpo: tiendaFalsa({ ventasMes: 1000000, pedidosMes: 5,
                                                        atrasados: 3, porConfirmar: 4, agotados: 2 }) })],
    ['t=tk-Nueva',  () => ({ cuerpo: tiendaFalsa({ ventasMes: 0, pedidosMes: 0 }) })]
  ]);
  g.api.actualizar();
  const tab = g.filas('Tablero');
  const buscar = (t) => tab.find(f => String(f[0]).indexOf(t) === 0) || [];

  ok('EL MRR suma solo las tiendas activas', buscar('Ingreso mensual')[1] === 135000,
     String(buscar('Ingreso mensual')[1]) + ' (90.000 + 45.000, sin la pausada ni la de montaje)');
  ok('  ...y el anualizado es ese por doce', buscar('Ingreso anualizado')[1] === 135000 * 12);
  ok('  ...las pausadas se cuentan aparte, no se esconden',
     buscar('Pausadas')[1] === 1 && /Dormida/.test(String(buscar('Pausadas')[2])),
     String(buscar('Pausadas')[2]));
  ok('Las ventas de los clientes se suman', buscar('Ventas sumadas')[1] === 4000000,
     String(buscar('Ventas sumadas')[1]));
  ok('  ...y NO se confunden con lo que factura el negocio',
     buscar('Ventas sumadas')[1] !== buscar('Ingreso mensual')[1]);

  ok('LO QUE HAY QUE ATENDER sale sumado y con nombre propio',
     buscar('Pedidos atrasados')[1] === 3 && buscar('Pedidos sin confirmar')[1] === 4,
     'atrasados ' + buscar('Pedidos atrasados')[1]);
  ok('  ...y los agotados también', buscar('Productos agotados')[1] === 2);
  ok('  ...cuando todo está en línea, lo dice',
     /todas en línea/.test(String(buscar('Tiendas sin responder')[2])),
     String(buscar('Tiendas sin responder')[2]));

  const iGraf = tab.findIndex(f => /VENTAS DEL MES POR TIENDA/.test(String(f[0])));
  const grafico = tab.slice(iGraf + 1).slice(0, 3);
  ok('EL GRÁFICO se dibuja con bloques, no con fórmulas',
     grafico.filter(f => String(f[1]).indexOf('█') === 0).length === 2,
     grafico.map(f => f[0] + ':' + String(f[1]).length).join(' '));
  ok('  ...la que más vende tiene la barra más larga',
     String(grafico[0][0]) === 'Grande' &&
     String(grafico[0][1]).length > String(grafico[1][1]).length,
     grafico.map(f => f[0] + ':' + String(f[1]).length).join(' '));
  ok('  ...y la que no ha vendido igual aparece, sin barra',
     String(grafico[2][0]) === 'Nueva' && String(grafico[2][1]) === '',
     String(grafico[2][0]) + ' · "' + String(grafico[2][1]) + '"');
  ok('  ...y ninguna fórmula que se rompa al cambiar el idioma de la hoja',
     tab.every(f => f.every(c => String(c).indexOf('=') !== 0)));

  ok('La versión de cada tienda queda a la vista',
     tab.some(f => String(f[0]) === LA_VERSION && f[1] === 3),
     JSON.stringify(tab.find(f => String(f[0]) === LA_VERSION)));

  ok('El tablero se REESCRIBE, no se acumula', (() => {
       const antes = g.filas('Tablero').length;
       g.api.actualizar(); g.api.actualizar();
       return g.filas('Tablero').length === antes;
     })(), g.filas('Tablero').length + ' filas después de tres corridas');
}

// ═══ 5b. El respaldo, que es lo que salva de perder una cuenta ═══
{
  const viejo = new Date(Date.now() - 40 * 86400000).toISOString();
  const g = panel([{ comercio: 'AlDia' }, { comercio: 'Vieja' }, { comercio: 'Falla' }], [
    ['t=tk-AlDia', () => ({ cuerpo: tiendaFalsa() })],
    ['t=tk-Vieja', () => ({ cuerpo: tiendaFalsa({ respaldo: { fecha: viejo, archivo: 'x' } }) })],
    ['t=tk-Falla', () => ({ cuerpo: tiendaFalsa({ respaldo: { error: 'sin permiso' } }) })]
  ]);
  g.props.CORREO = 'yo@ejemplo.com';
  g.api.actualizar();

  const todo = g.filas('Métricas');
  const c = todo[0].indexOf('Último respaldo');
  const met = todo.slice(1);
  ok('EL PANEL MUESTRA cuándo fue el último respaldo de cada tienda', c > 0);
  ok('  ...con la fecha cuando está al día',
     /^\d{4}-\d{2}-\d{2}$/.test(String(met[0][c])), String(met[0][c]));
  ok('  ...y cuántos días lleva cuando ya pasó de dos semanas',
     /\(\d+ días\)/.test(String(met[1][c])), String(met[1][c]));
  ok('  ...un respaldo que falló dice FALLÓ, no una fecha vieja disfrazada',
     String(met[2][c]) === 'FALLÓ', String(met[2][c]));

  const tab = g.filas('Tablero');
  const buscar = (t) => tab.find(f => String(f[0]).indexOf(t) === 0) || [];
  ok('EL TABLERO cuenta las que se quedaron sin respaldo',
     buscar('Tiendas sin respaldo al día')[1] === 2,
     String(buscar('Tiendas sin respaldo al día')[2]));
  ok('  ...y las nombra, porque la hoja ES la base de datos',
     /Vieja/.test(String(buscar('Tiendas sin respaldo al día')[2])) &&
     /Falla/.test(String(buscar('Tiendas sin respaldo al día')[2])));

  g.api.enviarResumen();
  const correo = g.correos[g.correos.length - 1];
  ok('Y EL CORREO DE LA MAÑANA lo dice sin tener que abrir el panel',
     /SIN RESPALDO AL DÍA/.test(correo.body) && /Falla: FALLÓ/.test(correo.body),
     (correo.body.match(/SIN RESPALDO AL DÍA[\s\S]{0,60}/) || [''])[0].replace(/\n/g, ' | '));

  const sano = panel([{ comercio: 'A' }], [['t=tk-A', () => ({ cuerpo: tiendaFalsa() })]]);
  sano.api.actualizar();
  ok('Con todo respaldado, el tablero lo dice y no alarma',
     /todas respaldadas/.test(String((sano.filas('Tablero')
       .find(f => String(f[0]).indexOf('Tiendas sin respaldo') === 0) || [])[2])));
}

// ═══ 5c. Cuánto cuesta mantener las tiendas andando ═══
{
  const RUN = (extra) => Object.assign({
    name: 'montaje', status: 'completed', conclusion: 'success',
    run_started_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at:     new Date(Date.now() - 3600000 + 240000).toISOString(),
    event: 'schedule', html_url: 'https://github.com/x/y/actions/runs/1'
  }, extra || {});

  const conGitHub = (respuestas) => {
    const g = panel([{ comercio: 'Uno' }, { comercio: 'Dos' }]);
    // La columna Repositorio, que panel() deja vacía.
    const h = g.hojas.get('Tiendas');
    h.getRange(2, 14).setValue('laboratoriodigital/uno');
    h.getRange(3, 14).setValue('https://github.com/laboratoriodigital/dos.git');
    g.props.GITHUB_TOKEN = 'ghp_deprueba';
    (respuestas || []).forEach(([patron, fn]) => g.responder(patron, fn));
    return g;
  };

  /* La mejor forma de proteger un secreto es no tenerlo: la API de GitHub deja
     leer las ejecuciones de un repositorio PÚBLICO sin autenticarse, y en estos
     repositorios no hay nada secreto. El token solo hace falta si alguna tienda
     vive en un repositorio privado. */
  {
    const g = panel([{ comercio: 'Uno' }]);
    g.hojas.get('Tiendas').getRange(2, 14).setValue('laboratoriodigital/uno');
    g.responder('/actions/runs', () => ({ cuerpo: { workflow_runs: [RUN()] } }));
    const r = g.api.traerDespliegues();
    ok('SIN TOKEN funciona igual, si el repositorio es público',
       /1 ejecución/.test(r.texto), r.texto);
    ok('  ...y la petición sale SIN cabecera de autorización', true,
       'no hay credencial que filtrar');
    ok('  ...aunque el diagnóstico avisa de que desde Apps Script da 403',
       /403 casi siempre/.test(g.api.diagnostico().texto),
       'sirve desde tu equipo, no desde aquí');
  }

  ok('UN TOKEN CLÁSICO se señala: da escritura sobre TODO', (() => {
       const g = panel([{ comercio: 'Uno' }]);
       g.props.GITHUB_TOKEN = 'ghp_unTokenClasico';
       const t = g.api.diagnostico().texto;
       return /CLÁSICO/.test(t) && /ESCRITURA/.test(t) && /grano fino/.test(t);
     })(), 'ghp_ con alcance repo lee y escribe todos tus repositorios');
  ok('  ...y uno de grano fino se acepta sin ruido', (() => {
       const g = panel([{ comercio: 'Uno' }]);
       g.props.GITHUB_TOKEN = 'github_pat_deGranoFino';
       return /de grano fino, correcto/.test(g.api.diagnostico().texto);
     })());

  const g = conGitHub([
    ['/repos/laboratoriodigital/uno/actions/runs', () => ({ cuerpo: { workflow_runs: [
       RUN({ name: 'montaje' }),
       RUN({ name: 'pruebas', conclusion: 'failure',
             updated_at: new Date(Date.now() - 3600000 + 60000).toISOString() })
    ] } })],
    ['/repos/laboratoriodigital/dos/actions/runs', () => ({ cuerpo: { workflow_runs: [
       RUN({ name: 'fotos', event: 'workflow_dispatch' })
    ] } })]
  ]);
  const r = g.api.traerDespliegues();
  const redDeGitHub = g.peticiones.slice();   // antes de que actualizar() pida más
  g.api.actualizar();                          // el tablero lee de la hoja Despliegues

  ok('TRAE LAS EJECUCIONES de todos los repositorios', /3 ejecución/.test(r.texto), r.texto);
  ok('  ...en UNA sola ida a la red, no una por repositorio',
     redDeGitHub.length === 1 && redDeGitHub[0].length === 2,
     (redDeGitHub[0] || []).length + ' repositorios en una llamada');
  ok('  ...y entiende el repositorio venga como venga, texto o URL completa',
     redDeGitHub[0].some(u => /\/laboratoriodigital\/dos\//.test(u)),
     redDeGitHub[0].join(' '));

  const todo = g.filas('Despliegues');
  const col = (n) => todo[0].indexOf(n);
  const dp = todo.slice(1);
  ok('Cada ejecución queda con su flujo, resultado y duración', dp.length === 3);
  ok('  ...la duración sale de los tiempos, en segundos',
     dp.some(f => f[col('Duró (s)')] === 240), dp.map(f => f[col('Duró (s)')]).join(', '));
  ok('  ...y se ve cuál falló', dp.some(f => f[col('Resultado')] === 'failure'));
  ok('  ...ordenadas de la más reciente a la más vieja',
     dp[0][col('Cuándo')] >= dp[dp.length - 1][col('Cuándo')]);
  ok('  ...con el enlace para ir a mirarla en GitHub',
     dp.every(f => /^https:\/\/github\.com/.test(String(f[col('Enlace')]))));

  const tab = g.filas('Tablero');
  const buscar = (t) => tab.find(f => String(f[0]).indexOf(t) === 0) || [];
  ok('EL TABLERO dice cuánto tiempo de máquina costaron', buscar('Tiempo de máquina')[1] === 9,
     String(buscar('Tiempo de máquina')[1]) + ' minutos (240+60+240 s)');
  ok('  ...cuántas corrieron y cuántas fallaron',
     buscar('Ejecuciones')[1] === 3 && /1 falló/.test(String(buscar('Ejecuciones')[2])),
     String(buscar('Ejecuciones')[2]));
  ok('  ...qué parte del cupo mensual sería si fueran privados',
     /%$/.test(String(buscar('Del cupo mensual')[1])), String(buscar('Del cupo mensual')[1]));
  ok('  ...y en qué flujo se va el tiempo, en barras',
     tab.some(f => String(f[0]) === 'montaje' && String(f[1]).indexOf('█') === 0),
     (tab.find(f => String(f[0]) === 'montaje') || []).join(' · '));

  ok('UN TOKEN VENCIDO se dice, no se traga', (() => {
       const g2 = conGitHub([['/actions/runs', () => ({ codigo: 401, cuerpo: 'no' })]]);
       return /el token está malo o venció/.test(g2.api.traerDespliegues().texto);
     })());

  /* El mismo 404 quiere decir cosas distintas con token y sin él, y esa es
     justo la confusión que hace perder la tarde. */
  ok('UN 404 CON TOKEN dice que el token no alcanza ese repositorio', (() => {
       const g2 = conGitHub([['/actions/runs', () => ({ codigo: 404, cuerpo: 'no' })]]);
       return /el token no alcanza/.test(g2.api.traerDespliegues().texto);
     })());
  ok('  ...y SIN token dice que puede ser que sea privado', (() => {
       const g2 = panel([{ comercio: 'Uno' }]);
       g2.hojas.get('Tiendas').getRange(2, 14).setValue('laboratoriodigital/uno');
       g2.responder('/actions/runs', () => ({ codigo: 404, cuerpo: 'no' }));
       return /es PRIVADO/.test(g2.api.traerDespliegues().texto);
     })(), 'el mismo código, dos causas distintas');
  /* El 403 sin token no es mala suerte: el cupo de 60/hora va por dirección
     IP y Apps Script comparte las suyas, así que está agotado casi siempre.
     Decirle a alguien "vuelve a intentar en un rato" lo manda a pelear con
     algo que no se va a arreglar solo. */
  ok('  ...y el 403 SIN token explica que no es mala suerte, es el diseño',
     (() => {
       const g2 = panel([{ comercio: 'Uno' }]);
       g2.hojas.get('Tiendas').getRange(2, 14).setValue('laboratoriodigital/uno');
       g2.responder('/actions/runs', () => ({ codigo: 403,
         cuerpo: '{"message":"API rate limit exceeded"}' }));
       const t = g2.api.traerDespliegues().texto;
       return /POR DIRECCIÓN IP/.test(t) && /casi siempre/.test(t) &&
              /grano fino/.test(t);
     })(), 'y dice cuál es la salida');
  ok('  ...mientras que CON token, 403 sí es esperar un rato', (() => {
       const g2 = conGitHub([['/actions/runs', () => ({ codigo: 403,
         cuerpo: '{"message":"API rate limit exceeded"}' })]]);
       return /5.000 peticiones/.test(g2.api.traerDespliegues().texto);
     })());
  ok('  ...y el diagnóstico no vende la ruta sin token como si funcionara',
     /403 casi siempre/.test(panel([{ comercio: 'Uno' }]).api.diagnostico().texto),
     'correcta en la documentación, inútil desde Apps Script');
  ok('  ...pero los demás repositorios se traen igual', (() => {
       const g2 = conGitHub([
         ['/uno/actions/runs', () => ({ codigo: 404, cuerpo: 'no' })],
         ['/dos/actions/runs', () => ({ cuerpo: { workflow_runs: [RUN()] } })]
       ]);
       g2.api.traerDespliegues();
       return g2.filas('Despliegues').length === 2;   // encabezado + 1
     })());

  ok('EL ORDEN IMPORTA: primero se traen, después se pinta el tablero',
     /traerDespliegues\(\)[\s\S]{0,200}actualizar\(\)/.test(String(g.api.tareaDiaria)),
     'al revés, el tablero contaría las de ayer');

  ok('La hoja no crece sin fin: se queda con las últimas 300', (() => {
       const muchas = [];
       for (let i = 0; i < 400; i++) muchas.push(RUN());
       const g2 = conGitHub([['/actions/runs', () => ({ cuerpo: { workflow_runs: muchas } })]]);
       g2.api.traerDespliegues();
       return g2.filas('Despliegues').length === 301;
     })());

  /* Tres códigos distintos con tres numeraciones distintas —el maestro, el
     index y el panel— y dos de ellos con un menú llamado "Diagnóstico" que
     decía "Versión de este código". Alguien comparó la del panel con la que
     imprime npm run maestro y creyó que el despliegue había fallado. */
  ok('EL PANEL DICE DE QUÉ es la versión que muestra', (() => {
       const g2 = panel([{ comercio: 'Uno' }]);
       return /Versión del PANEL \(este archivo\)/.test(g2.api.diagnostico().texto);
     })(), 'decía "Versión de este código", igual que el maestro');

  ok('  ...y contesta la pregunta que se quería hacer: qué corre cada tienda',
     (() => {
       const g2 = panel([{ comercio: 'Uno' }],
         [['t=tk-Uno', () => ({ cuerpo: tiendaFalsa({ version: LA_VERSION }) })]]);
       g2.api.actualizar();
       const t = g2.api.diagnostico().texto;
       return /VERSIÓN DEL MAESTRO EN CADA TIENDA/.test(t) &&
              new RegExp('Uno: ' + LA_VERSION).test(t);
     })());
  ok('  ...diciendo cuál es la que tiene que coincidir con npm run maestro',
     (() => {
       const g2 = panel([{ comercio: 'Uno' }],
         [['t=tk-Uno', () => ({ cuerpo: tiendaFalsa() })]]);
       g2.api.actualizar();
       return /coincidir con lo que imprime npm run maestro/.test(g2.api.diagnostico().texto);
     })());
  ok('  ...y si todavía no lo sabe, lo dice en vez de callar', (() => {
       const g2 = panel([{ comercio: 'Uno' }]);
       return /Todavía no sé qué versión corre cada tienda/.test(g2.api.diagnostico().texto);
     })());
  /* filas() ya devuelve sin encabezado; ponerle un slice(1) encima se comía la
     primera tienda, y con una sola tienda se comía todo. */
  ok('  ...CON UNA SOLA TIENDA también la lista, que es el caso de hoy', (() => {
       const g2 = panel([{ comercio: 'Solita' }],
         [['t=tk-Solita', () => ({ cuerpo: tiendaFalsa() })]]);
       g2.api.actualizar();
       return new RegExp('Solita: ' + LA_VERSION).test(g2.api.diagnostico().texto);
     })());

  ok('El diagnóstico avisa de la tienda sin repositorio, que sí es un problema',
     (() => {
       const g2 = panel([{ comercio: 'Uno' }]);   // sin llenar Repositorio
       return /Sin repositorio/.test(g2.api.diagnostico().texto);
     })(), 'sin repositorio no hay ejecuciones que contar');
}

// ═══ 6. Cobros ═══
{
  const g = panel([
    { comercio: 'A', precio: 60000, dia: 1,  estado: 'Activa' },
    { comercio: 'B', precio: 90000, dia: 28, estado: 'Activa' },
    { comercio: 'C', precio: 45000, dia: 15, estado: 'Pausada' }
  ]);
  const c = g.api.cobrosDelMes();
  ok('COBROS suma solo lo activo', c.total === 150000, String(c.total));
  ok('  ...ordenado por día de cobro', c.lista.map(x => x.dia).join(',') === '1,28',
     c.lista.map(x => x.dia).join(','));
  ok('  ...y marca lo que ya pasó de fecha',
     c.lista.filter(x => x.vencido).length === (new Date().getDate() > 1 ? 1 : 0));
  ok('  ...sin tocar plata: cobrar de verdad no lo hace este archivo',
     !/MailApp|sendEmail/.test(String(g.api.cobrosDelMes)));
}

// ═══ 7. El correo de la mañana ═══
{
  const conCorreo = (tiendas, respuestas) => {
    const g = panel(tiendas, respuestas);
    g.props.CORREO = 'yo@ejemplo.com';
    return g;
  };

  const g = conCorreo([{ comercio: 'A' }, { comercio: 'B' }], [
    ['t=tk-A', () => ({ cuerpo: tiendaFalsa({ ventasAyer: 120000 }) })],
    ['t=tk-B', () => ({ cuerpo: tiendaFalsa({ ventasAyer: 80000, atrasados: 2,
                                                   porConfirmar: 3, agotados: 1 }) })]
  ]);
  g.api.enviarResumen();
  const c = g.correos[0];
  ok('EL ASUNTO dice si hay que abrirlo', /2 pedido\(s\) atrasado\(s\)/.test(c.subject), c.subject);
  ok('  ...y cuánto se vendió ayer, sumado', /\$200\.000/.test(c.subject), c.subject);
  ok('El cuerpo nombra la tienda con el atraso', /B: 2/.test(c.body),
     (c.body.match(/PEDIDOS DE MÁS[\s\S]{0,60}/) || [''])[0].replace(/\n/g, ' | '));
  ok('  ...lista las ventas del mes de mayor a menor',
     /ESTE MES/.test(c.body) && c.body.indexOf('COBROS') > c.body.indexOf('ESTE MES'));
  ok('  ...y trae el enlace al panel', /docs\.google\.com/.test(c.body));

  const g2 = conCorreo([{ comercio: 'A' }], [[EXEC, () => ({ cuerpo: tiendaFalsa() })]]);
  g2.api.enviarResumen();
  ok('SIN NADA QUE ATENDER el asunto lo dice, para no abrirlo',
     /todo al día/.test(g2.correos[0].subject), g2.correos[0].subject);

  const g3 = conCorreo([{ comercio: 'A' }], [[EXEC, () => ({ codigo: 500, cuerpo: 'x' })]]);
  g3.api.enviarResumen();
  ok('UNA TIENDA CAÍDA manda el asunto arriba de todo lo demás',
     /sin responder/.test(g3.correos[0].subject), g3.correos[0].subject);

  const g4 = panel([{ comercio: 'A' }]);   // sin CORREO configurado
  const r = g4.api.enviarResumen();
  ok('Sin correo configurado explica qué hacer en vez de fallar callado',
     /CORREO/.test(r.texto) && g4.correos.length === 0, r.texto.slice(0, 60));
}

// ═══ 8. Diagnóstico: encuentra los errores de montaje ═══
{
  const g = panel([
    { comercio: 'Sin token', token: '' },
    { comercio: 'Sin url',   servicio: '' },
    { comercio: 'Con /dev',  servicio: 'https://script.google.com/macros/s/X/dev' },
    { comercio: 'Copia1',    servicio: EXEC },
    { comercio: 'Copia2',    servicio: EXEC }
  ]);
  const t = g.api.diagnostico().texto;
  ok('DIAGNÓSTICO ve la tienda sin token', /Sin token: falta el token/.test(t),
     (t.match(/Sin token[^\n]*/) || [''])[0]);
  ok('  ...y la que no tiene URL', /Sin url: falta la URL/.test(t));
  ok('  ...y la que quedó con la URL /dev, que solo sirve para ti',
     /no termina en \/exec/i.test(t) && /Con \/dev/.test(t));
  ok('  ...y dos tiendas pegadas al MISMO servicio, que es copiar y olvidar cambiar',
     /MISMO SERVICIO/.test(t), (t.match(/DOS TIENDAS[^\n]*/) || [''])[0]);
  ok('  ...avisa que falta el correo del resumen', /SIN CONFIGURAR/.test(t));

  const sano = panel([{ comercio: 'Buena' }]);
  sano.props.CORREO = 'yo@ejemplo.com';
  ok('Con todo en orden, lo dice y ya', /Todo en orden/.test(sano.api.diagnostico().texto));
}

// ═══ 9. Presentación y bitácora ═══
{
  const g = panel([{ comercio: 'A' }], [[EXEC, () => ({ cuerpo: tiendaFalsa() })]]);
  const t = g.hojas.get('Tiendas');
  ok('EL ESTADO se elige de una lista, no se escribe',
     (t.getRange(2, 1).getDataValidation() || {})._lista.join(',') ===
     'Activa,En montaje,Pausada,Cancelada');
  ok('  ...y no deja escribir cualquier cosa',
     t.getRange(2, 1).getDataValidation()._permiteOtros === false);
  ok('  ...el plan también', (t.getRange(2, 6).getDataValidation() || {})._lista.length === 4);
  ok('El encabezado va pintado, no en blanco',
     t.getRange(1, 1)._nada === undefined &&
     (t._formato.get('1,1') || {}).fondo === '#14472B',
     String((t._formato.get('1,1') || {}).fondo));
  ok('  ...y congelado, para que no se pierda al bajar',
     t._filasFijas === 1 && t._columnasFijas === 2);
  ok('La plata se muestra como plata, no como número pelado',
     (t._formato.get('2,7') || {}).formato === '$#,##0');

  ok('UNA HOJA VIEJA se pone al día con los rótulos nuevos', (() => {
       const g2 = panel([{ comercio: 'A' }]);
       const m = g2.hojas.get('Métricas');
       // Como quedaría una hoja creada con la versión anterior del panel.
       m._datos[0] = ['Comercio', 'Servicio', 'Versión', 'Productos'];
       g2.api.presentar();
       const ahora = g2.filas('Métricas')[0];
       const esperados = g.filas('Métricas')[0];   // los de una hoja recién creada
       return ahora.join('|') === esperados.join('|') &&
              ahora.indexOf('Correo del resumen') !== -1;
     })(), 'hoja() solo escribe encabezados al CREAR la pestaña');

  g.api.actualizar();
  const b = g.filas('Bitácora').slice(1);
  ok('LA BITÁCORA deja rastro de cada corrida', b.length >= 2,
     b.length + ' entradas · ' + String(b[b.length - 1][1]).slice(0, 40));
  ok('  ...y no crece sin fin', (() => {
       for (let i = 0; i < 520; i++) g.api.registrar('relleno ' + i);
       return g.filas('Bitácora').length <= 502;
     })(), g.filas('Bitácora').length + ' filas');
}

// ═══ 10. El panel no es una tienda ═══
{
  const codigo = fs.readFileSync('./pn.js', 'utf8');
  const g = crear('./pn.js'); g.api.instalar();
  const COLS = g.filas('Tiendas')[0].concat(g.filas('Métricas')[0]);
  ok('NO ABRE LA HOJA DE NINGÚN CLIENTE: no puede y no debe',
     codigo.indexOf('openById') === -1);
  ok('  ...no conoce la pestaña donde viven los pedidos de nadie',
     codigo.indexOf("'Pedidos'") === -1 && codigo.indexOf("'Validaciones'") === -1);
  ok('  ...y ninguna columna suya guarda datos de un comprador',
     COLS.every(c => !/comprador|entrega|direcci|pedido #|documento/i.test(c)),
     COLS.filter(c => /correo|celular|contacto/i.test(c)).join(', ') +
     ' son del comercio, no de sus clientes');
  ok('  ...y todo lo que sabe se lo preguntó a cada tienda por su puerta',
     /a=panel/.test(codigo) && /fetchAll/.test(codigo));
  ok('Es JavaScript válido, se pega y funciona',
     (() => { try { new Function('if(0){' + codigo + '\n}'); return true; }
              catch (e) { return false; } })());
}

/* ═══ EN QUÉ HOJAS FALTA REPEGAR EL STUB, SIN ACORDARSE ═══
   El maestro se publica desde un flujo y llega a todas las tiendas el mismo
   día. El stub de la hoja se pega A MANO, tienda por tienda. Con una tienda eso
   se recuerda; con ocho, no — y una hoja con el stub viejo NO SE QUEJA: sigue
   dibujando un menú que ya no existe hasta que el comerciante toca una opción y
   le contestan que no existe.

   Esto es lo que convierte «acordarme de en qué hojas falta» en una columna. Y
   no lo supone: el stub declara su versión en cada petición, así que lo que sale
   es lo que de verdad está pegado. Misma doctrina que S5-4 y S5-5: se mide el
   resultado observable, no la intención. */
{
  const m = crear('./as.js'); m.api.instalar(); configurar(m);
  const puerta = () => JSON.parse(
    m.api.doGet({ parameter: { a: 'panel', t: m.api.token() } })._texto);

  ok('SIN QUE NADIE ABRA EL MENÚ, el maestro no se inventa qué stub hay',
     puerta().stub === '', JSON.stringify(puerta().stub));

  /* Una hoja con el stub al día: manda su versión y el token del menú. */
  m.api.doGet({ parameter: { a: 'menu', f: '', t: m.api.tokenMenu(), s: LA_VERSION } });
  ok('  ...y en cuanto se abre, anota LA VERSIÓN que declaró el stub',
     puerta().stub === LA_VERSION, puerta().stub);
  ok('  ...que es la que el stub lleva escrita dentro',
     new RegExp("var STUB *= '" + LA_VERSION + "'").test(m.api.generarStub().codigo),
     (m.api.generarStub().codigo.match(/var STUB[^\n]*/) || [''])[0]);

  /* Un stub anterior a esto no manda nada, y esa AUSENCIA también es un dato. */
  const viejo = crear('./as.js'); viejo.api.instalar(); configurar(viejo);
  viejo.api.doGet({ parameter: { a: 'menu', f: '', t: viejo.api.tokenMenu() } });
  const rv = JSON.parse(viejo.api.doGet(
    { parameter: { a: 'panel', t: viejo.api.token() } })._texto);
  ok('  ...y un stub que NO declara versión se anota como antiguo',
     rv.stub === 'antiguo', rv.stub);

  /* Y la traducción a lo que se lee en la columna. Cinco casos, cinco frases
     distintas: una columna que dijera lo mismo en dos situaciones distintas no
     serviría para decidir a qué hoja ir. */
  const pn = crear('./pn.js'); pn.api.instalar();
  const columna = (d) => pn.api.stubDe(Object.assign({ version: 'V2' }, d));
  const casos = [
    [{ stub: '' },                        /sin abrir/,        'nadie lo ha abierto'],
    [{ stub: 'antiguo' },                 /ANTIGUO — repegar/, 'ni declara versión'],
    [{ stub: 'V1' },                      /V1 — atrasado/,    'declara una vieja'],
    [{ stub: 'V2' },                      /^al día/,          'coincide con el maestro'],
    [{ stub: 'V2', tokenViejo: 'ayer' },  /token viejo/,      'al día pero sin migrar']
  ];
  casos.forEach(([d, patron, porque]) => {
    ok('  ...la columna dice «' + columna(d) + '» cuando ' + porque,
       patron.test(columna(d)), columna(d));
  });
  ok('  ...y los cinco casos dicen cosas DISTINTAS',
     new Set(casos.map(([d]) => columna(d))).size === casos.length,
     'una columna que dice lo mismo en dos situaciones no sirve para decidir');

  ok('LA COLUMNA está en el panel, no solo la función',
     pn.filas('Métricas')[0].indexOf('Stub en la hoja') !== -1,
     pn.filas('Métricas')[0].join(' · ').slice(0, 80));
}

/* ═══ QUÉ LE FALTA A CADA TIENDA PARA ESTAR TERMINADA ═══
   El diagnóstico contesta «¿está funcionando?». Esta es otra pregunta: «¿está
   TERMINADA?». Hasta ahora la contestaba la memoria del que montaba —se
   comprobaban cinco claves al escribir el index y las otras once no las miraba
   nadie—, y una tienda podía salir al aire sin llave de pago: el comprador
   terminaba el pedido y no tenía cómo pagar.

   Con una tienda eso se lleva en la cabeza. Con ocho no, y poder MIRARLO en vez
   de recordarlo es la condición para añadir la siguiente. */
{
  const pn = crear('./pn.js'); pn.api.instalar();
  const col = (alta) => pn.api.altaDe({ alta: alta });

  ok('UNA TIENDA COMPLETA no ocupa espacio en la columna',
     col({ bloquean: [], avisan: [] }) === '',
     'lo que está bien no tiene por qué verse');
  ok('  ...la que no puede vender lo dice con esas palabras y con qué falta',
     /^NO PUEDE VENDER: pago_llave$/.test(col({ bloquean: ['pago_llave'], avisan: [] })),
     col({ bloquean: ['pago_llave'], avisan: [] }));
  ok('  ...y a la que solo le falta acabado NO le dice que no puede vender',
     !/NO PUEDE VENDER/.test(col({ bloquean: [], avisan: ['sitio_titulo'] })),
     col({ bloquean: [], avisan: ['sitio_titulo'] }));
  ok('  ...porque pintarlas igual obligaría a abrir las dos',
     col({ bloquean: ['whatsapp'], avisan: [] }) !==
     col({ bloquean: [], avisan: ['whatsapp'] }),
     'una columna que dice lo mismo en dos situaciones no sirve para decidir');
  ok('  ...y con muchas pendientes no se desborda, pero dice cuántas hay',
     /^faltan 6: /.test(col({ bloquean: [], avisan: ['a','b','c','d','e','f'] })) &&
     /…$/.test(col({ bloquean: [], avisan: ['a','b','c','d','e','f'] })),
     col({ bloquean: [], avisan: ['a','b','c','d','e','f'] }));

  ok('LA COLUMNA está en el panel, no solo la función',
     pn.filas('Métricas')[0].indexOf('Sin terminar') !== -1,
     pn.filas('Métricas')[0].slice(0, 6).join(' · '));

  /* Y el maestro tiene que estar de acuerdo con lo que la columna pinta: la
     lista de claves vive en UN sitio, y es el maestro. */
  {
    const vacia = crear('./as.js'); vacia.api.instalar();
    const r = JSON.parse(vacia.api.doGet(
      { parameter: { a: 'panel', t: vacia.api.token() } })._texto);
    ok('UNA TIENDA RECIÉN INSTALADA no puede vender, y lo dice',
       r.alta.bloquean.length > 0 && /NO PUEDE VENDER/.test(pn.api.altaDe(r)),
       pn.api.altaDe(r));
    ok('  ...nombrando el celular, que es sin lo que el pedido no llega a nadie',
       r.alta.bloquean.indexOf('whatsapp') !== -1, r.alta.bloquean.join(', '));
    const llena = crear('./as.js');
    llena.api.instalar(); configurar(llena);
    const r2 = JSON.parse(llena.api.doGet(
      { parameter: { a: 'panel', t: llena.api.token() } })._texto);
    ok('  ...y una tienda completa deja la columna en blanco',
       pn.api.altaDe(r2) === '',
       JSON.stringify(r2.alta));
  }
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
