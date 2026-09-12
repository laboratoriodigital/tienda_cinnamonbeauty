/**
 * ORGÁNICO — PANEL DE TIENDAS
 * =============================================================================
 * El archivo de gestión del negocio: una fila por tienda vendida, las cifras de
 * todas ellas en un solo tablero, y un correo diario que dice qué atender.
 *
 * POR QUÉ ESTE ARCHIVO EXISTE Y NO SE MIRAN LAS HOJAS UNA POR UNA
 * Cada tienda vive en su propia cuenta de Google, para que gaste sus propios
 * límites gratuitos. Eso significa que desde aquí NO se puede abrir la hoja de
 * un cliente: son cuentas distintas, y compartirlas todas con una cuenta
 * administradora reconstruiría justo el acoplamiento que evitamos.
 *
 * Lo que se hace en cambio: cada maestro publica un resumen de su tienda por su
 * puerta ?a=panel, y este archivo lo pregunta. Lo que cruza son cifras
 * agregadas —ventas del mes, pedidos por confirmar, productos agotados—, nunca
 * un pedido ni el dato de un comprador. Si mañana una tienda se va, se borra su
 * fila y no queda nada suyo aquí.
 *
 * ESTE SÍ VA DENTRO DE LA HOJA
 * A diferencia del maestro, este script se pega en Extensiones > Apps Script de
 * ESTA hoja. No hay a quién esconderle el código: la hoja es tuya y no se
 * comparte con ningún cliente.
 *
 * INSTALACIÓN
 *   1. Crea una hoja nueva de Google llamada "Panel de tiendas".
 *   2. Extensiones > Apps Script, pega este archivo, guarda.
 *   3. Ejecuta instalar() una vez y autoriza.
 *   4. Recarga la hoja: aparece el menú Panel.
 * =============================================================================
 */

var VERSION_PANEL = '2026-09-10-d';

var H_TIENDAS  = 'Tiendas';
var H_METRICAS = 'Métricas';
var H_TABLERO  = 'Tablero';
var H_BITACORA = 'Bitácora';
var H_DESPLIEGUES = 'Despliegues';

/* Las columnas de Tiendas. Este es el ÚNICO sitio que se edita a mano; todo lo
   demás lo escribe el script y se sobrescribe en cada actualización. */
var COL_TIENDAS = ['Estado', 'Comercio', 'Contacto', 'Celular', 'Correo',
                   'Plan', 'Precio mensual', 'Día de cobro', 'Alta',
                   'Sitio', 'Servicio (URL /exec)', 'Token',
                   'Cuenta Google', 'Repositorio', 'Notas'];

/* Las columnas de Métricas, cada una con de dónde sale y cómo se ve. Están
   así y no como dos listas paralelas porque una lista de rótulos y otra de
   valores se desalinean en cuanto alguien agrega una columna en el medio, y
   el síntoma es una tienda mostrando el ticket de otra. */
var METRICAS = [
  { rotulo: 'Comercio',              de: function (d) { return d.tienda.comercio; }, ancho: 190 },
  { rotulo: 'Servicio',              de: function (d) { return 'En línea'; }, ancho: 110 },
  { rotulo: 'Versión',               de: function (d) { return d.version; }, ancho: 110 },
  /* EL CÓDIGO PEGADO EN LA HOJA, que es otra cosa que la versión del maestro y
     se queda atrás sola. El maestro se publica desde un flujo; el stub de la
     hoja se pega a mano, tienda por tienda. Con una tienda eso se recuerda; con
     ocho, no — y una hoja con el stub viejo no se queja: sigue ofreciendo un
     menú que ya no existe hasta que el comerciante toca una opción y le
     contestan que no existe.

     Esta columna es lo que convierte «acordarme de en qué hojas falta repegar»
     en algo que se mira. Y no lo supone: el stub dice de qué versión es en cada
     petición, así que lo que sale aquí es lo que de verdad está pegado. */
  { rotulo: 'Stub en la hoja',       de: stubDe, ancho: 150 },

  // ── Lo que la tienda dice de sí misma. Sirve para cazar desajustes entre
  //    lo que está escrito en el registro y lo que la hoja tiene de verdad.
  { rotulo: 'Se llama',              de: function (d) { return d.negocio; }, ancho: 160 },
  { rotulo: 'Sitio',                 de: function (d) { return d.sitio; }, ancho: 250 },
  { rotulo: 'WhatsApp',              de: function (d) { return d.whatsapp; }, ancho: 120 },
  { rotulo: 'Correo del resumen',    de: function (d) { return d.correo || '— sin configurar'; }, ancho: 210 },

  { rotulo: 'Productos',             de: function (d) { return d.productos; }, centrado: true },
  { rotulo: 'Publicados',            de: function (d) { return d.publicados; }, centrado: true },
  { rotulo: 'Agotados',              de: function (d) { return d.agotados; }, centrado: true, ambar: true },
  { rotulo: 'Por confirmar',         de: function (d) { return d.porConfirmar; }, centrado: true, ambar: true },
  { rotulo: 'Atrasados',             de: function (d) { return d.atrasados; }, centrado: true, rojo: true },

  { rotulo: 'Ventas del mes',        de: function (d) { return d.ventasMes; }, plata: true },
  { rotulo: 'vs. mes pasado',        de: variacionDelMes, ancho: 130, centrado: true },
  { rotulo: 'Pedidos del mes',       de: function (d) { return d.pedidosMes; }, centrado: true },
  { rotulo: 'Ticket promedio',       de: function (d) { return d.ticket; }, plata: true },
  { rotulo: 'Ventas ayer',           de: function (d) { return d.ventasAyer; }, plata: true },

  // ── Carga. El tope de 30 ejecuciones simultáneas no se puede consultar;
  //    estas dos son lo que sí se mide, y avisan antes de llegar.
  { rotulo: 'Lecturas hoy',          de: function (d) { return d.lecturasHoy; }, centrado: true },
  { rotulo: 'Correos que le quedan', de: function (d) { return d.cuotaCorreo < 0 ? '?' : d.cuotaCorreo; }, centrado: true },

  /* QUÉ LE FALTA A ESTA TIENDA PARA ESTAR TERMINADA. Con una tienda esto se
     lleva en la cabeza; con ocho, no — y poder MIRARLO en vez de recordarlo es
     justamente la condición para añadir la siguiente. Va arriba, junto al
     comercio: si una tienda no puede vender, lo demás de su fila da igual. */
  { rotulo: 'Sin terminar',          de: altaDe, ancho: 200, ambar: true },

  /* PEDIDOS QUE ESTUVIERON PERDIDOS. Salieron por WhatsApp y no llegaron a la
     hoja; la tienda los recuperó cuando el comprador volvió a abrirla. En el
     panel importa más que en la hoja: un comercio ve el suyo y no sabe si es
     normal — el operador ve si es UNA tienda o son TODAS, y si son todas el
     problema no es de ninguna. */
  { rotulo: 'Rescatados',            de: rescatadosDe, ancho: 130, ambar: true },
  { rotulo: 'Último respaldo',       de: respaldoDe, ancho: 150 },
  { rotulo: 'Errores',               de: function (d) { return d.errores; }, centrado: true, rojo: true },
  { rotulo: 'Última consulta',       de: function (d) { return new Date(d.consultado); },
    fecha: true, ancho: 140 }
];

var COL_METRICAS = METRICAS.map(function (c) { return c.rotulo; });

/* Lo que bloquea y lo que solo avisa se dicen distinto: una tienda que no puede
   vender no es lo mismo que una a la que le falta la descripción, y una columna
   que las pintara igual obligaría a abrir las dos. */
function altaDe(d) {
  var a = d.alta || {};
  var bloquean = a.bloquean || [], avisan = a.avisan || [];
  if (!bloquean.length && !avisan.length) return '';
  if (bloquean.length) {
    return 'NO PUEDE VENDER: ' + bloquean.join(', ') +
           (avisan.length ? '  (+' + avisan.length + ' más)' : '');
  }
  return 'faltan ' + avisan.length + ': ' + avisan.slice(0, 3).join(', ') +
         (avisan.length > 3 ? '…' : '');
}

/* El número solo no distingue un tropiezo de red de una caída larga, así que
   va con el peor tiempo al lado. Tres minutos es la red; dos días es que la
   tienda estuvo caída y nadie se enteró. */
function rescatadosDe(d) {
  var r = d.rescates || {};
  var n = Number(r.n) || 0;
  if (!n) return '';
  var m = Number(r.peor) || 0;
  var dura = m < 60 ? m + ' min'
           : m < 2880 ? Math.round(m / 60) + ' h'
           : Math.round(m / 1440) + ' días';
  return n + '  ·  peor ' + dura;
}

/* QUÉ DICE LA COLUMNA «STUB EN LA HOJA», y por qué cada caso dice otra cosa.

   · vacío           nadie ha abierto el menú desde que se instaló este maestro.
                     No es que esté mal: es que todavía no se sabe.
   · «antiguo»       el stub que hay pegado ni siquiera declara su versión, así
                     que es anterior a la 2.7.1. Hay que repegarlo.
   · una versión     la que declara. Si no es la del maestro, está atrasado.
   · «+ token viejo» además sigue entrando con el token de montaje: esa tienda
                     no ha terminado la migración del Sprint 5, y rotarToken()
                     se va a negar a correr mientras siga así.

   Se resuelve aquí y no en el maestro a propósito: comparar contra la versión
   del maestro solo tiene sentido teniendo las dos delante, y el panel es el
   único sitio donde se tienen. */
function stubDe(d) {
  var s = String(d.stub || '');
  var cola = d.tokenViejo ? '  + token viejo' : '';
  if (!s) return 'sin abrir todavía';
  if (s === 'antiguo') return 'ANTIGUO — repegar' + cola;
  if (s !== d.version) return s + ' — atrasado' + cola;
  return 'al día' + cola;
}

/* Un respaldo que falló o que lleva más de dos semanas es lo mismo que no
   tener respaldo, y tiene que verse así en la celda, no esconderse en una
   fecha vieja que a simple vista parece una fecha cualquiera. */
function respaldoDe(d) {
  var r = d.respaldo || {};
  if (r.error) return 'FALLÓ';
  if (!r.fecha) return 'nunca';
  var dias = Math.floor((new Date() - new Date(r.fecha)) / 86400000);
  return r.fecha.slice(0, 10) + (dias > 14 ? '  (' + dias + ' días)' : '');
}

function respaldoAtrasado(d) {
  var r = d.respaldo || {};
  if (r.error || !r.fecha) return true;
  return (new Date() - new Date(r.fecha)) / 86400000 > 14;
}

function variacionDelMes(d) {
  if (!d.ventasMesAnterior) return d.ventasMes ? 'primer mes' : '—';
  var v = Math.round((d.ventasMes - d.ventasMesAnterior) / d.ventasMesAnterior * 100);
  return (v >= 0 ? '+' : '') + v + '%';
}

/* Lo que GitHub cobra por minuto y lo que regala. Los repositorios públicos no
   consumen nada; los privados salen del cupo mensual de la cuenta. */
var MINUTOS_GRATIS_AL_MES = 2000;

var COL_DESPLIEGUES = ['Comercio', 'Repositorio', 'Flujo', 'Resultado', 'Cuándo',
                       'Duró (s)', 'Minutos facturables', 'Por qué corrió', 'Enlace'];

var ESTADOS = ['Activa', 'En montaje', 'Pausada', 'Cancelada'];
var PLANES  = ['Básico', 'Estándar', 'Completo', 'Cortesía'];

/* La paleta del panel. Sobria a propósito: esto no es la tienda, es la
   herramienta de trabajo de quien la vende. */
var VERDE  = '#14472B';
var ROJO   = '#B3261E';
var AMBAR  = '#8A6100';
var GRIS   = '#6E6E6E';
var LINEA  = '#E4E4E4';
var FONDO  = '#F7F7F5';

var ANCHO_BARRA = 20;

// =============================================================================
// MENÚ
// =============================================================================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Panel')
    .addItem('Actualizar todas las tiendas', 'actualizar')
    .addItem('Enviarme el resumen ahora',    'enviarResumenAhora')
    .addItem('Cobros de este mes',           'verCobros')
    .addItem('Traer ejecuciones de GitHub',  'actualizarDespliegues')
    .addSeparator()
    .addItem('Diagnóstico',                  'verDiagnostico')
    .addToUi();
}

// =============================================================================
// INSTALACIÓN
// =============================================================================

function instalar() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();

  var t = hoja(H_TIENDAS, COL_TIENDAS);
  if (t.getLastRow() < 2) {
    // Una fila de ejemplo, para que se vea qué va en cada columna. Se borra.
    t.getRange(2, 1, 1, COL_TIENDAS.length).setValues([[
      'En montaje', '[Nombre del comercio]', '[Contacto]', '[Celular]', '',
      'Cortesía', 0, 1, new Date(),
      'https://[la-tienda].[tu-cuenta].workers.dev/',
      '', '', '', 'laboratoriodigital/[repositorio]',
      'Fila de ejemplo. Reemplázala: pega aquí la URL /exec y el token del maestro.'
    ]]);
  }

  hoja(H_METRICAS, COL_METRICAS);
  hoja(H_DESPLIEGUES, COL_DESPLIEGUES);
  hoja(H_TABLERO,  ['Indicador', 'Valor', 'Detalle']);
  hoja(H_BITACORA, ['Fecha', 'Qué pasó']);

  var cfg = PropertiesService.getScriptProperties();
  if (!cfg.getProperty('CORREO')) cfg.setProperty('CORREO', '');

  presentar();

  ScriptApp.getProjectTriggers().forEach(function (d) {
    if (d.getHandlerFunction() === 'tareaDiaria') ScriptApp.deleteTrigger(d);
  });
  ScriptApp.newTrigger('tareaDiaria').timeBased().atHour(7).everyDays(1).create();

  registrar('Instalado. Versión ' + VERSION_PANEL);
  libro.toast('Listo. Recarga la hoja para ver el menú Panel.', 'Panel', 8);
  console.log('LISTO. Pestañas: ' +
    libro.getSheets().map(function (h) { return h.getName(); }).join(', '));
  console.log('Siguiente paso: llena la pestaña Tiendas y corre actualizar().');
}

/* Las ejecuciones PRIMERO: el tablero las lee de su hoja, así que traerlas
   después dejaría el tablero mostrando las de ayer. */
function tareaDiaria() {
  // Si no hay token de GitHub esto no falla: devuelve un aviso y sigue.
  try { traerDespliegues(); } catch (e) { registrar('despliegues: ' + e.message); }
  actualizar();
  enviarResumen();
}

// =============================================================================
// CONSULTAR TODAS LAS TIENDAS
// =============================================================================

/* Se consultan TODAS a la vez con fetchAll y no una por una en un ciclo.
   No es una optimización cosmética: en serie, veinte tiendas a dos segundos
   cada una son cuarenta segundos de ejecución, y Apps Script corta a los seis
   minutos. En paralelo son dos segundos, y el presupuesto diario de la cuenta
   deja de ser el techo del negocio. */
function consultar(tiendas) {
  if (!tiendas.length) return [];

  var peticiones = tiendas.map(function (t) {
    return { url: t.servicio + '?a=panel&t=' + encodeURIComponent(t.token),
             muteHttpExceptions: true, followRedirects: true };
  });

  var respuestas;
  try { respuestas = UrlFetchApp.fetchAll(peticiones); }
  catch (e) {
    // Si fetchAll revienta entero, ninguna tienda tiene la culpa: se marcan
    // todas como no consultadas y se sigue, en vez de dejar el panel a medias.
    registrar('No se pudo consultar ninguna tienda: ' + e.message);
    return tiendas.map(function (t) {
      return { tienda: t, ok: false, error: 'Sin conexión: ' + e.message };
    });
  }

  return tiendas.map(function (t, i) {
    var r = respuestas[i];
    try {
      if (r.getResponseCode() !== 200) {
        return { tienda: t, ok: false,
                 error: 'El servicio respondió ' + r.getResponseCode() +
                        (r.getResponseCode() === 404
                          ? '. Revisa que la implementación tenga acceso "Cualquier persona".'
                          : '') };
      }
      var d = JSON.parse(r.getContentText());
      if (!d.ok) {
        /* UN TOKEN VIEJO NO ES UNA TIENDA CAÍDA, y la fila se ve igual: la
           marca dice NO RESPONDE y las métricas quedan vacías. Quien lo mira
           sale a buscar por qué se cayó la tienda, y la tienda está perfecta —
           es este archivo el que le está hablando con la llave anterior.

           Pasa después de rotarToken(): se cambia el secreto del repositorio y
           el tienda.json, y esta columna se queda con el token viejo. */
        var porQue = String(d.error || 'Respuesta sin ok');
        if (/oken/.test(porQue)) {
          porQue = 'TOKEN VIEJO en esta hoja, la tienda está bien. ' +
                   'Pega el token nuevo en la pestaña Tiendas, columna Token ' +
                   '(lo imprime diagnosticoCompleto() en el maestro de esa tienda).';
        }
        return { tienda: t, ok: false, error: porQue };
      }
      d.tienda = t;
      return d;
    } catch (e) {
      return { tienda: t, ok: false, error: 'Respuesta ilegible: ' + e.message };
    }
  });
}

function leerTiendas() {
  return filas(H_TIENDAS).map(function (f, i) {
    return {
      linea:     i + 2,
      estado:    String(f[0] || '').trim(),
      comercio:  String(f[1] || '').trim(),
      contacto:  String(f[2] || '').trim(),
      celular:   String(f[3] || '').trim(),
      correo:    String(f[4] || '').trim(),
      plan:      String(f[5] || '').trim(),
      precio:    Number(f[6]) || 0,
      diaCobro:  Number(f[7]) || 0,
      alta:      f[8],
      sitio:     String(f[9] || '').trim(),
      servicio:  String(f[10] || '').trim().replace(/\?.*$/, ''),
      token:     String(f[11] || '').trim(),
      cuenta:    String(f[12] || '').trim(),
      repo:      String(f[13] || '').trim(),
      notas:     String(f[14] || '').trim()
    };
  }).filter(function (t) { return t.comercio; });
}

function actualizar() {
  var todas = leerTiendas();
  // Solo se molesta a las que están corriendo. Una tienda en montaje todavía
  // no tiene servicio, y una cancelada no tiene por qué seguir respondiendo.
  var vivas = todas.filter(function (t) {
    return t.servicio && t.token &&
           (t.estado === 'Activa' || t.estado === 'En montaje');
  });

  var datos = consultar(vivas);
  pintarMetricas(datos);
  pintarTablero(todas, datos);

  var caidas = datos.filter(function (d) { return !d.ok; }).length;
  registrar('Actualizado: ' + datos.length + ' tienda(s) consultada(s)' +
            (caidas ? ', ' + caidas + ' sin responder' : ''));

  return { tipo: 'aviso', texto:
    datos.length
      ? 'Listo. ' + varios(datos.length, 'tienda consultada', 'tiendas consultadas') +
        (caidas ? ', ' + varios(caidas, 'sin responder', 'sin responder') + '.' : '.')
      : 'No hay ninguna tienda con servicio y token en la pestaña Tiendas.' };
}

// =============================================================================
// MÉTRICAS
// =============================================================================

function pintarMetricas(datos) {
  var h = hoja(H_METRICAS, COL_METRICAS);
  var ultima = Math.max(h.getLastRow(), 2);
  h.getRange(2, 1, ultima, COL_METRICAS.length).clearContent();

  if (!datos.length) return;

  var filasSalida = datos.map(function (d) {
    if (!d.ok) {
      /* Una tienda caída llena solo tres celdas: nombre, la marca y el
         motivo. Rellenar el resto con ceros haría creer que vendió cero. */
      var f = METRICAS.map(function () { return ''; });
      f[0] = d.tienda.comercio;
      /* «NO RESPONDE» es lo que pasa cuando la tienda no contesta. Si contestó
         y dijo que el token no vale, la tienda SÍ responde y decir lo contrario
         manda a buscar el problema al sitio equivocado. */
      f[1] = /TOKEN VIEJO/.test(String(d.error)) ? 'TOKEN VIEJO' : 'NO RESPONDE';
      f[2] = d.error;
      f[METRICAS.length - 1] = new Date();
      return f;
    }
    return METRICAS.map(function (c) {
      var v = c.de(d);
      return v === undefined || v === null ? '' : v;
    });
  });

  h.getRange(2, 1, filasSalida.length, COL_METRICAS.length).setValues(filasSalida);
  formatoMetricas(h, filasSalida.length);
}

function formatoMetricas(h, n) {
  METRICAS.forEach(function (c, i) {
    var r = h.getRange(2, i + 1, n, 1);
    if (c.plata)    r.setNumberFormat('$#,##0');
    if (c.fecha)    r.setNumberFormat('d/MM/yy HH:mm');
    if (c.centrado) r.setHorizontalAlignment('center');
  });

  // Lo que exige atención se ve sin leer.
  var valores = h.getRange(2, 1, n, METRICAS.length).getValues();
  for (var i = 0; i < n; i++) {
    var malo = valores[i][1] === 'NO RESPONDE';
    h.getRange(i + 2, 2).setFontColor(malo ? ROJO : VERDE)
                        .setFontWeight(malo ? 'bold' : 'normal');
    if (malo) continue;
    METRICAS.forEach(function (c, j) {
      if (!c.rojo && !c.ambar) return;
      if (Number(valores[i][j]) > 0) {
        h.getRange(i + 2, j + 1).setFontColor(c.rojo ? ROJO : AMBAR).setFontWeight('bold');
      }
    });
  }
}

// =============================================================================
// TABLERO
// =============================================================================

function pintarTablero(todas, datos) {
  var h = hoja(H_TABLERO, ['Indicador', 'Valor', 'Detalle']);
  h.getRange(1, 1, Math.max(h.getMaxRows(), 60), 3).clear();

  var buenas = datos.filter(function (d) { return d.ok; });
  var activas = todas.filter(function (t) { return t.estado === 'Activa'; });
  var montaje = todas.filter(function (t) { return t.estado === 'En montaje'; });
  var pausadas = todas.filter(function (t) { return t.estado === 'Pausada'; });

  var mrr = activas.reduce(function (s, t) { return s + t.precio; }, 0);
  var ventas = buenas.reduce(function (s, d) { return s + d.ventasMes; }, 0);
  var pedidos = buenas.reduce(function (s, d) { return s + d.pedidosMes; }, 0);
  var porConfirmar = buenas.reduce(function (s, d) { return s + d.porConfirmar; }, 0);
  var atrasados = buenas.reduce(function (s, d) { return s + d.atrasados; }, 0);
  var agotados = buenas.reduce(function (s, d) { return s + d.agotados; }, 0);
  var caidas = datos.filter(function (d) { return !d.ok; });
  var lecturas = buenas.reduce(function (s, d) { return s + (d.lecturasHoy || 0); }, 0);
  var sinCorreo = buenas.filter(function (d) { return !d.correo; });
  var sinRespaldo = buenas.filter(respaldoAtrasado);

  var L = [];
  var titulo = function (t) { L.push(['', '', '']); L.push([t, '', '']); };
  var dato = function (a, b, c) { L.push([a, b, c === undefined ? '' : c]); };

  L.push(['PANEL DE TIENDAS', '', '']);
  dato('Actualizado', new Date(), 'Se actualiza solo cada mañana a las 7');

  titulo('EL NEGOCIO');
  dato('Ingreso mensual recurrente', mrr, varios(activas.length, 'tienda activa', 'tiendas activas'));
  dato('Ingreso anualizado', mrr * 12, 'Si nadie se va y nadie entra');
  dato('En montaje', montaje.length, montaje.length ? nombres(montaje) : 'ninguna');
  dato('Pausadas', pausadas.length, pausadas.length ? nombres(pausadas) : 'ninguna');
  dato('Precio promedio', activas.length ? Math.round(mrr / activas.length) : 0,
       'Por tienda activa');

  titulo('LO QUE VENDIERON ELLAS ESTE MES');
  dato('Ventas sumadas', ventas, varios(pedidos, 'pedido confirmado', 'pedidos confirmados'));
  dato('Promedio por tienda', buenas.length ? Math.round(ventas / buenas.length) : 0,
       'Solo las que respondieron');
  dato('Ticket promedio', pedidos ? Math.round(ventas / pedidos) : 0, 'De todas juntas');

  titulo('QUÉ HAY QUE ATENDER HOY');
  dato('Tiendas sin responder', caidas.length,
       caidas.length ? caidas.map(function (d) { return d.tienda.comercio; }).join(', ')
                     : 'todas en línea');
  dato('Pedidos sin confirmar', porConfirmar, 'Sumando todas las tiendas');
  dato('Pedidos atrasados más de un día', atrasados,
       atrasados ? 'Avísale al comercio' : 'ninguno');
  dato('Productos agotados', agotados, 'Sumando todas las tiendas');
  var viejas = buenas.filter(function (d) { return d.errores > 0; });
  dato('Tiendas con errores registrados', viejas.length,
       viejas.length ? viejas.map(function (d) { return d.tienda.comercio; }).join(', ')
                     : 'ninguna');
  dato('Tiendas sin correo de resumen', sinCorreo.length,
       sinCorreo.length ? nombresDe(sinCorreo) + ' — su dueño no recibe nada'
                        : 'todas configuradas');
  dato('Tiendas sin respaldo al día', sinRespaldo.length,
       sinRespaldo.length ? nombresDe(sinRespaldo) + ' — la hoja ES la base de datos'
                          : 'todas respaldadas esta semana');

  titulo('CARGA');
  dato('Lecturas del catálogo hoy', lecturas, 'Sumando todas las tiendas');
  dato('Tope de ejecuciones simultáneas', 30,
       'Por cuenta de Google, fijo. No sube pagando y Google no deja consultar ' +
       'cuántas van: por eso se mira la carga, que sí se mide');
  var cargada = buenas.slice().sort(function (a, b) {
    return (b.lecturasHoy || 0) - (a.lecturasHoy || 0); })[0];
  dato('La más cargada hoy', cargada ? (cargada.lecturasHoy || 0) : 0,
       cargada ? cargada.tienda.comercio : '—');

  // ---- Lo que cuesta mantenerlas andando ----
  var dp = resumenDespliegues();
  titulo('DESPLIEGUE — ÚLTIMOS 30 DÍAS');
  if (!dp.corridas) {
    dato('Ejecuciones', 0,
         'Menú Panel > Traer ejecuciones de GitHub. Con repositorios públicos ' +
         'no hace falta ningún token');
  } else {
    dato('Ejecuciones', dp.corridas,
         varios(dp.fallidas, 'falló', 'fallaron') + ' · ' + reloj(dp.promedio) + ' de promedio');
    dato('Tiempo de máquina', dp.minutos,
         'minutos. En repositorios públicos GitHub no los cobra; en privados ' +
         'salen del cupo de ' + MINUTOS_GRATIS_AL_MES + ' al mes');
    dato('Del cupo mensual', Math.round(dp.minutos / MINUTOS_GRATIS_AL_MES * 100) + '%',
         'Si todos los repositorios fueran privados');
    var flujos = Object.keys(dp.porFlujo).sort(function (a, b) {
      return dp.porFlujo[b].seg - dp.porFlujo[a].seg; });
    var tope = flujos.length ? dp.porFlujo[flujos[0]].seg : 0;
    flujos.forEach(function (f) {
      var x = dp.porFlujo[f];
      L.push([f, barra(x.seg, tope),
              x.veces + ' × ' + reloj(Math.round(x.seg / x.veces)) +
              '  =  ' + reloj(x.seg)]);
    });
  }

  // ---- El gráfico: quién vende más, en barras de bloques ----
  titulo('VENTAS DEL MES POR TIENDA');
  var orden = buenas.slice().sort(function (a, b) { return b.ventasMes - a.ventasMes; });
  var tope = orden.length ? orden[0].ventasMes : 0;
  if (!orden.length) {
    dato('—', '', 'Todavía no hay tiendas que hayan respondido');
  } else {
    orden.forEach(function (d) {
      L.push([d.tienda.comercio, barra(d.ventasMes, tope), pesos(d.ventasMes)]);
    });
  }

  // ---- Versiones: quién quedó atrás ----
  titulo('VERSIÓN DEL SERVICIO');
  var porVersion = {};
  buenas.forEach(function (d) {
    (porVersion[d.version] = porVersion[d.version] || []).push(d.tienda.comercio);
  });
  var versiones = Object.keys(porVersion).sort().reverse();
  if (!versiones.length) dato('—', '', 'Sin datos');
  versiones.forEach(function (v, i) {
    L.push([v, porVersion[v].length, (i === 0 ? 'al día · ' : 'ATRASADA · ') +
            porVersion[v].join(', ')]);
  });

  h.getRange(1, 1, L.length, 3).setValues(L);
  formatoTablero(h, L);
}

function formatoTablero(h, L) {
  h.setHiddenGridlines(true);
  h.setColumnWidth(1, 300); h.setColumnWidth(2, 230); h.setColumnWidth(3, 420);
  h.getRange(1, 1, L.length, 3).setFontFamily('Arial').setFontSize(10)
   .setVerticalAlignment('middle');

  // Título
  h.getRange(1, 1, 1, 3).merge().setBackground(VERDE).setFontColor('#FFFFFF')
   .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('left');
  h.setRowHeight(1, 40);

  for (var i = 0; i < L.length; i++) {
    var fila = i + 1;
    var a = String(L[i][0]);
    var esTitulo = a === a.toUpperCase() && a.length > 3 && String(L[i][1]) === '' && fila > 1;

    if (esTitulo) {
      h.getRange(fila, 1, 1, 3).merge().setBackground(FONDO)
       .setFontWeight('bold').setFontColor(VERDE).setFontSize(11);
      h.setRowHeight(fila, 28);
    } else if (a || L[i][1] !== '') {
      h.getRange(fila, 3).setFontColor(GRIS).setFontSize(9);
      h.getRange(fila, 1, 1, 3).setBorder(false, false, true, false, false, false,
                                          LINEA, SpreadsheetApp.BorderStyle.SOLID);
      h.setRowHeight(fila, 24);
      // Las barras del gráfico, en verde y en una fuente que no las separe.
      if (String(L[i][1]).indexOf('█') === 0) {
        h.getRange(fila, 2).setFontColor(VERDE).setFontFamily('Courier New');
      }
    }
  }

  // Los renglones de plata, con formato de plata.
  var valores = h.getRange(1, 1, L.length, 2).getValues();
  for (var k = 0; k < valores.length; k++) {
    var etiqueta = String(valores[k][0]);
    if (/Tiempo de máquina|Ejecuciones|Del cupo/i.test(etiqueta)) {
      // Minutos y porcentajes: números, no pesos.
      h.getRange(k + 1, 2).setFontWeight('bold').setFontSize(12);
    } else if (/Ingreso|Ventas|Ticket|Precio|Promedio/i.test(etiqueta) &&
        typeof valores[k][1] === 'number') {
      h.getRange(k + 1, 2).setNumberFormat('$#,##0').setFontWeight('bold').setFontSize(12);
    } else if (typeof valores[k][1] === 'number') {
      h.getRange(k + 1, 2).setFontWeight('bold').setFontSize(12);
    }
    if (/Actualizado/.test(etiqueta)) h.getRange(k + 1, 2).setNumberFormat('d/MM/yy HH:mm');
    // Lo que está mal, en rojo. Lo que está bien, en verde.
    if (/sin responder|atrasados|con errores/i.test(etiqueta)) {
      h.getRange(k + 1, 2).setFontColor(Number(valores[k][1]) > 0 ? ROJO : VERDE);
    }
    if (/sin confirmar|agotados/i.test(etiqueta)) {
      h.getRange(k + 1, 2).setFontColor(Number(valores[k][1]) > 0 ? AMBAR : VERDE);
    }
  }
  h.setFrozenRows(1);
}

// =============================================================================
// DESPLIEGUES: cuánto tiempo de máquina cuesta mantener las tiendas
// =============================================================================

/* Lo que GitHub Actions hace por nosotros no es gratis en el sentido de que
   sea infinito: en repositorios privados sale de un cupo mensual. Aquí se ve
   cuánto se está gastando y en qué, para que la respuesta a "¿esto escala?" sea
   un número y no una impresión.

   SIN TOKEN, SI LOS REPOSITORIOS SON PÚBLICOS.
   La API de GitHub deja leer las ejecuciones de un repositorio público sin
   autenticarse. Como en estos repositorios no hay nada secreto —esa fue la
   decisión desde el principio—, lo normal es no guardar ninguna credencial
   aquí. Es la mejor forma de proteger un secreto: no tenerlo.

   PERO, EN LA PRÁCTICA, DESDE APPS SCRIPT CASI NUNCA ALCANZA.
   Sin autenticarse GitHub da 60 peticiones por hora POR DIRECCIÓN IP, y Apps
   Script sale por un puñado de direcciones que comparte con todos los scripts
   del mundo. Ese cupo está agotado casi siempre, así que lo normal es recibir
   403 y no datos. La ruta sin token es correcta según la documentación y
   sirve desde tu equipo; desde aquí, no.

   Con un token de grano fino el cupo sube a 5.000 por hora y el problema
   desaparece. Es un token de LECTURA sobre Actions en unos pocos repositorios:
   si se filtra, alguien ve cuánto tardaron unas compilaciones. Ese es todo el
   daño, y por eso vale la pena.

   Si alguna tienda vive en un repositorio privado, entonces sí hace falta un
   token, y tiene que ser uno de grano fino (github_pat_…) limitado A ESOS
   repositorios y con permiso de LECTURA sobre Actions y nada más. Un token
   clásico (ghp_…) con alcance "repo" da lectura Y ESCRITURA sobre todos tus
   repositorios: si se filtra, se filtró el proyecto entero.

   Y hay que saber dónde queda: las propiedades del proyecto NO están cifradas.
   Cualquiera que pueda editar este script las lee en texto plano. Para este
   archivo, que es nuestro y no se comparte con ningún cliente, es aceptable;
   pero es exactamente el motivo por el que el token del stub de cada tienda no
   sirve para nada peligroso. */
var GITHUB = 'https://api.github.com';

function tokenGitHub() {
  return String(PropertiesService.getScriptProperties()
    .getProperty('GITHUB_TOKEN') || '').trim();
}

/* owner/repo, venga como venga: "laboratoriodigital/organico" o la URL entera. */
function repoDe(texto) {
  var t = String(texto || '').trim().replace(/\.git$/, '');
  var m = t.match(/github\.com[\/:]([^\/]+\/[^\/\s]+)/i);
  if (m) return m[1];
  return /^[\w.-]+\/[\w.-]+$/.test(t) ? t : '';
}

function actualizarDespliegues() {
  var r = traerDespliegues();
  // Y se repinta el tablero, que es donde se leen: traerlas sin repintar
  // dejaría el tablero contando las de la corrida anterior.
  try { actualizar(); } catch (e) { /* el aviso de abajo manda */ }
  SpreadsheetApp.getUi().alert(r.texto);
}

function traerDespliegues() {
  var token = tokenGitHub();
  var repos = {};
  leerTiendas().forEach(function (t) {
    var r = repoDe(t.repo);
    if (r && !repos[r]) repos[r] = t.comercio;
  });
  var lista = Object.keys(repos);
  if (!lista.length) return { tipo: 'aviso', texto:
    'Ninguna tienda tiene repositorio en la columna Repositorio.' };

  var cabeceras = { Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28' };
  // Sin token se lee igual, siempre que el repositorio sea público.
  if (token) cabeceras.Authorization = 'Bearer ' + token;

  var respuestas;
  try {
    respuestas = UrlFetchApp.fetchAll(lista.map(function (r) {
      return { url: GITHUB + '/repos/' + r + '/actions/runs?per_page=100',
               headers: cabeceras, muteHttpExceptions: true };
    }));
  } catch (e) {
    registrar('No se pudo hablar con GitHub: ' + e.message);
    return { tipo: 'aviso', texto: 'No se pudo hablar con GitHub: ' + e.message };
  }

  var filasSalida = [], problemas = [];
  lista.forEach(function (repo, i) {
    var res = respuestas[i];
    if (res.getResponseCode() !== 200) {
      problemas.push(repo + ': ' + explicarGitHub(res.getResponseCode(), token, res));
      return;
    }
    var d;
    try { d = JSON.parse(res.getContentText()); }
    catch (e) { problemas.push(repo + ': respuesta ilegible'); return; }

    (d.workflow_runs || []).forEach(function (c) {
      var inicio = new Date(c.run_started_at || c.created_at);
      var fin = new Date(c.updated_at);
      var seg = Math.max(0, Math.round((fin - inicio) / 1000));
      filasSalida.push([
        repos[repo], repo, c.name || '',
        c.status === 'completed' ? (c.conclusion || '') : c.status,
        inicio, seg, '', c.event || '', c.html_url || ''
      ]);
    });
  });

  filasSalida.sort(function (a, b) { return b[4] - a[4]; });
  filasSalida = filasSalida.slice(0, 300);      // la hoja no es un archivo histórico

  pintarDespliegues(filasSalida);

  var texto = filasSalida.length
    ? filasSalida.length + ' ejecución(es) traída(s) de ' +
      varios(lista.length, 'repositorio', 'repositorios') + '.'
    : 'Sin ejecuciones todavía.';
  if (problemas.length) texto += '\n\nNo pude leer:\n  ' + problemas.join('\n  ');
  registrar(texto.split('\n')[0]);
  return { tipo: 'aviso', texto: texto };
}

/* El código de error solo no dice nada. Con token y sin token, un 404 quiere
   decir cosas distintas, y esa es justo la confusión que hace perder la tarde. */
function explicarGitHub(codigo, token, res) {
  if (codigo === 404) {
    return token
      ? '404 (no existe, o el token no alcanza ese repositorio)'
      : '404 (o no existe, o es PRIVADO: sin token solo se leen los públicos)';
  }
  if (codigo === 401) return '401 (el token está malo o venció)';
  if (codigo === 403) {
    var cuerpo = '';
    try { cuerpo = res.getContentText(); } catch (e) {}
    if (!/rate limit/i.test(cuerpo)) return '403 (sin permiso para leer las ejecuciones)';
    return token
      ? '403 (se agotaron las 5.000 peticiones por hora del token; espera un rato)'
      : '403 — se agotaron las 60 peticiones por hora que GitHub da sin token.\n' +
        '      Y no es mala suerte: ese cupo va POR DIRECCIÓN IP, y Apps Script\n' +
        '      comparte las suyas con todo el mundo, así que casi siempre está\n' +
        '      agotado. Con un token de grano fino sube a 5.000 y se acaba el\n' +
        '      problema. Necesita solo "Actions: read-only" sobre estos\n' +
        '      repositorios: si se filtra, alguien ve cuánto tardó una\n' +
        '      compilación y nada más.';
  }
  return String(codigo);
}

function pintarDespliegues(filasSalida) {
  var h = hoja(H_DESPLIEGUES, COL_DESPLIEGUES);
  rotulos(h, COL_DESPLIEGUES);
  var ultima = Math.max(h.getLastRow(), 2);
  h.getRange(2, 1, ultima, COL_DESPLIEGUES.length).clearContent();
  if (!filasSalida.length) return;

  h.getRange(2, 1, filasSalida.length, COL_DESPLIEGUES.length).setValues(filasSalida);
  h.getRange(2, 5, filasSalida.length, 1).setNumberFormat('d/MM/yy HH:mm');
  h.getRange(2, 6, filasSalida.length, 2).setHorizontalAlignment('center');

  for (var i = 0; i < filasSalida.length; i++) {
    var r = String(filasSalida[i][3]);
    h.getRange(i + 2, 4).setFontColor(
      r === 'success' ? VERDE : (r === 'failure' ? ROJO : AMBAR))
      .setFontWeight(r === 'success' ? 'normal' : 'bold');
  }
}

/* Lo que se mira sin abrir la hoja: cuánto tiempo de máquina costó el último
   mes, en qué se fue, y cuánto tarda un despliegue de punta a punta. */
function resumenDespliegues() {
  var hace30 = new Date(Date.now() - 30 * 86400000);
  var filasSalida = filas(H_DESPLIEGUES).filter(function (f) {
    var d = f[4] instanceof Date ? f[4] : new Date(f[4]);
    return d && !isNaN(d.getTime()) && d >= hace30;
  });

  var porFlujo = {}, segundos = 0, fallidas = 0;
  filasSalida.forEach(function (f) {
    var flujo = String(f[2] || '(sin nombre)');
    var seg = Number(f[5]) || 0;
    if (!porFlujo[flujo]) porFlujo[flujo] = { veces: 0, seg: 0 };
    porFlujo[flujo].veces++;
    porFlujo[flujo].seg += seg;
    segundos += seg;
    if (String(f[3]) === 'failure') fallidas++;
  });

  return { corridas: filasSalida.length, segundos: segundos, fallidas: fallidas,
           porFlujo: porFlujo,
           minutos: Math.round(segundos / 60),
           promedio: filasSalida.length ? Math.round(segundos / filasSalida.length) : 0 };
}

function reloj(seg) {
  seg = Math.round(Number(seg) || 0);
  var m = Math.floor(seg / 60);
  return m ? m + ' min ' + ('0' + (seg % 60)).slice(-2) + ' s' : seg + ' s';
}

// =============================================================================
// COBROS
// =============================================================================

/* Qué se factura este mes y a quién. Es una lectura, no un cobro: no toca
   plata, no manda nada. Cobrar de verdad —recibo, comprobante, mora— está en
   el roadmap y necesita decisiones que todavía no están tomadas. */
function cobrosDelMes() {
  var hoy = new Date();
  var activas = leerTiendas().filter(function (t) { return t.estado === 'Activa'; });
  var lista = activas.map(function (t) {
    var dia = t.diaCobro || 1;
    return { comercio: t.comercio, contacto: t.contacto, celular: t.celular,
             plan: t.plan, precio: t.precio, dia: dia,
             vencido: dia < hoy.getDate() };
  }).sort(function (a, b) { return a.dia - b.dia; });

  return { lista: lista,
           total: lista.reduce(function (s, x) { return s + x.precio; }, 0),
           porCobrar: lista.filter(function (x) { return !x.vencido; })
                           .reduce(function (s, x) { return s + x.precio; }, 0) };
}

function verCobros() {
  var c = cobrosDelMes();
  var ui = SpreadsheetApp.getUi();
  if (!c.lista.length) { ui.alert('No hay tiendas activas todavía.'); return; }

  var t = 'COBROS DEL MES — ' + pesos(c.total) + '\n\n';
  c.lista.forEach(function (x) {
    t += 'Día ' + (x.dia < 10 ? ' ' : '') + x.dia + '  ·  ' + x.comercio +
         '  ·  ' + pesos(x.precio) + '  ·  ' + x.plan +
         (x.vencido ? '   (ya pasó)' : '') + '\n';
  });
  t += '\nPendiente por cobrar en lo que queda del mes: ' + pesos(c.porCobrar);
  ui.alert(t);
}

// =============================================================================
// EL CORREO DE LA MAÑANA
// =============================================================================

/* Un solo correo para todo el portafolio. La idea es no tener que abrir el
   panel: si no hay nada que hacer, el correo lo dice en el asunto y no hay que
   entrar. Si hay algo, el asunto ya dice qué y de quién. */
function enviarResumen() {
  var correo = String(PropertiesService.getScriptProperties().getProperty('CORREO') || '').trim();
  if (!correo) return { tipo: 'aviso', texto:
    'Falta a quién mandarlo. Archivo > Configuración del proyecto > Propiedades ' +
    'del script, y agrega CORREO con tu dirección.' };

  var todas = leerTiendas();
  var vivas = todas.filter(function (t) {
    return t.servicio && t.token && (t.estado === 'Activa' || t.estado === 'En montaje');
  });
  var datos = consultar(vivas);
  var buenas = datos.filter(function (d) { return d.ok; });
  var caidas = datos.filter(function (d) { return !d.ok; });

  var atrasados = buenas.reduce(function (s, d) { return s + d.atrasados; }, 0);
  var porConfirmar = buenas.reduce(function (s, d) { return s + d.porConfirmar; }, 0);
  var ventasAyer = buenas.reduce(function (s, d) { return s + d.ventasAyer; }, 0);
  var agotados = buenas.reduce(function (s, d) { return s + d.agotados; }, 0);

  var sinCopia = buenas.filter(respaldoAtrasado);

  var asunto;
  if (caidas.length)        asunto = caidas.length + ' tienda(s) sin responder';
  else if (atrasados)       asunto = atrasados + ' pedido(s) atrasado(s)';
  else if (agotados)        asunto = agotados + ' producto(s) agotado(s)';
  else                      asunto = 'todo al día';
  asunto = 'Panel · ' + asunto + ' · ' + pesos(ventasAyer) + ' ayer';

  var cuerpo = 'PANEL DE TIENDAS\n' +
    new Date().toLocaleString('es-CO') + '\n\n';

  if (caidas.length) {
    cuerpo += 'SIN RESPONDER\n';
    caidas.forEach(function (d) {
      cuerpo += '  · ' + d.tienda.comercio + ': ' + d.error + '\n';
    });
    cuerpo += '\n';
  }

  var conAtraso = buenas.filter(function (d) { return d.atrasados > 0; });
  if (conAtraso.length) {
    cuerpo += 'PEDIDOS DE MÁS DE UN DÍA SIN CONFIRMAR\n';
    conAtraso.forEach(function (d) {
      cuerpo += '  · ' + d.tienda.comercio + ': ' + d.atrasados +
                ' (de ' + d.porConfirmar + ' pendientes)\n';
    });
    cuerpo += '\n';
  }

  var sinStock = buenas.filter(function (d) { return d.agotados > 0; });
  if (sinStock.length) {
    cuerpo += 'PRODUCTOS AGOTADOS\n';
    sinStock.forEach(function (d) {
      cuerpo += '  · ' + d.tienda.comercio + ': ' + d.agotados + '\n';
    });
    cuerpo += '\n';
  }

  if (sinCopia.length) {
    cuerpo += 'SIN RESPALDO AL DÍA\n';
    sinCopia.forEach(function (d) {
      cuerpo += '  · ' + d.tienda.comercio + ': ' + respaldoDe(d) + '\n';
    });
    cuerpo += '\n';
  }

  cuerpo += 'AYER\n';
  cuerpo += '  Ventas sumadas: ' + pesos(ventasAyer) + '\n';
  cuerpo += '  Pedidos sin confirmar en total: ' + porConfirmar + '\n\n';

  cuerpo += 'ESTE MES\n';
  buenas.slice().sort(function (a, b) { return b.ventasMes - a.ventasMes; })
    .forEach(function (d) {
      cuerpo += '  ' + rellenar(d.tienda.comercio, 24) + pesos(d.ventasMes) +
                '  (' + d.pedidosMes + ' pedidos)\n';
    });

  var c = cobrosDelMes();
  cuerpo += '\nCOBROS\n  ' + pesos(c.total) + ' este mes · ' +
            pesos(c.porCobrar) + ' todavía por cobrar\n';
  cuerpo += '\n' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '\n';

  MailApp.sendEmail({ to: correo, subject: asunto, body: cuerpo });
  registrar('Resumen enviado a ' + correo);
  return { tipo: 'aviso', texto: 'Resumen enviado a ' + correo + '.' };
}

function enviarResumenAhora() {
  var r = enviarResumen();
  SpreadsheetApp.getUi().alert(r.texto);
}

// =============================================================================
// DIAGNÓSTICO
// =============================================================================

function diagnostico() {
  var todas = leerTiendas();
  var t = 'PANEL — DIAGNÓSTICO\n\n';
  /* "Versión de este código" decía lo mismo aquí y en el maestro, y son dos
     códigos distintos con dos numeraciones distintas. Alguien comparó la del
     panel con la que imprime `npm run maestro` y creyó que algo había fallado.
     El rótulo tiene que decir de QUÉ es la versión. */
  t += 'Versión del PANEL (este archivo): ' + VERSION_PANEL + '\n';
  t += 'Tiendas registradas: ' + todas.length + '\n\n';

  /* Y de paso, la pregunta que de verdad se quería hacer: qué versión del
     maestro está corriendo cada tienda. Sale de la última actualización, sin
     volver a molestar a nadie por la red. */
  // filas() ya devuelve SIN el encabezado. Ponerle un slice(1) encima se comía
  // la primera tienda, y con una sola tienda se comía todo.
  var iNombre = 0, iVersion = 2;
  var versiones = filas(H_METRICAS).filter(function (f) {
    return String(f[iVersion] || '').trim(); });
  if (versiones.length) {
    t += 'VERSIÓN DEL MAESTRO EN CADA TIENDA\n';
    t += '(esta es la que tiene que coincidir con lo que imprime npm run maestro)\n';
    versiones.forEach(function (f) {
      t += '  · ' + f[iNombre] + ': ' + f[iVersion] + '\n';
    });
    t += '\n';
  } else {
    t += 'Todavía no sé qué versión corre cada tienda.\n' +
         'Menú Panel > Actualizar todas las tiendas.\n\n';
  }

  var sinServicio = todas.filter(function (x) {
    return (x.estado === 'Activa' || x.estado === 'En montaje') && (!x.servicio || !x.token);
  });
  if (sinServicio.length) {
    t += 'LES FALTA URL O TOKEN (no se pueden consultar)\n';
    sinServicio.forEach(function (x) {
      t += '  · ' + x.comercio + ': falta ' +
           (!x.servicio && !x.token ? 'la URL y el token'
                                    : (!x.servicio ? 'la URL /exec' : 'el token')) + '\n';
    });
    t += '\n';
  }

  var malaUrl = todas.filter(function (x) {
    return x.servicio && !/^https:\/\/script\.google\.com\/macros\/s\/[^\/]+\/exec$/.test(x.servicio);
  });
  if (malaUrl.length) {
    t += 'URL QUE NO TERMINA EN /exec (la /dev solo funciona para ti)\n';
    malaUrl.forEach(function (x) { t += '  · ' + x.comercio + ': ' + x.servicio + '\n'; });
    t += '\n';
  }

  var repetidas = {};
  todas.forEach(function (x) { if (x.servicio) repetidas[x.servicio] = (repetidas[x.servicio] || 0) + 1; });
  var choques = Object.keys(repetidas).filter(function (u) { return repetidas[u] > 1; });
  if (choques.length) {
    t += 'DOS TIENDAS APUNTAN AL MISMO SERVICIO\n';
    choques.forEach(function (u) { t += '  · ' + u + '\n'; });
    t += '\n';
  }

  var correo = String(PropertiesService.getScriptProperties().getProperty('CORREO') || '').trim();
  var tg = tokenGitHub();
  t += 'Token de GitHub: ' + (!tg
    ? 'ninguno. Desde Apps Script eso da 403 casi siempre (60 peticiones\n' +
      '                 por hora por IP, compartida). Pon uno de grano fino con\n' +
      '                 Actions: solo lectura y sube a 5.000.'
    : (/^ghp_/.test(tg)
       ? 'CLÁSICO (ghp_). Da lectura y ESCRITURA sobre todos tus repositorios.\n' +
         '                 Cámbialo por uno de grano fino (github_pat_) limitado\n' +
         '                 a las tiendas y con permiso de Actions: solo lectura.'
       : 'de grano fino, correcto')) + '\n';
  var sinRepo = todas.filter(function (x) {
    return x.estado === 'Activa' && !repoDe(x.repo); });
  if (sinRepo.length) {
    t += 'Sin repositorio en la columna Repositorio: ' +
         sinRepo.map(function (x) { return x.comercio; }).join(', ') + '\n';
  }
  t += 'Correo del resumen: ' + (correo || 'SIN CONFIGURAR (propiedad CORREO)') + '\n';
  t += 'Cuota de correo que queda hoy: ' + MailApp.getRemainingDailyQuota() + '\n';
  var d = ScriptApp.getProjectTriggers().filter(function (x) {
    return x.getHandlerFunction() === 'tareaDiaria'; });
  t += 'Tarea diaria: ' + (d.length ? 'activa' : 'NO INSTALADA — corre instalar()') + '\n';

  if (!sinServicio.length && !malaUrl.length && !choques.length && correo && d.length) {
    t += '\nTodo en orden.';
  }
  return { tipo: 'aviso', texto: t };
}

function verDiagnostico() {
  SpreadsheetApp.getUi().alert(diagnostico().texto);
}

// =============================================================================
// PRESENTACIÓN
// =============================================================================

function presentar() {
  var t = hoja(H_TIENDAS, COL_TIENDAS);
  rotulos(t, COL_TIENDAS);
  encabezado(t, COL_TIENDAS.length);
  t.setColumnWidth(1, 110); t.setColumnWidth(2, 200); t.setColumnWidth(3, 140);
  t.setColumnWidth(4, 110); t.setColumnWidth(5, 190); t.setColumnWidth(6, 100);
  t.setColumnWidth(7, 120); t.setColumnWidth(8, 100); t.setColumnWidth(9, 100);
  t.setColumnWidth(10, 260); t.setColumnWidth(11, 320); t.setColumnWidth(12, 230);
  t.setColumnWidth(13, 220); t.setColumnWidth(14, 200); t.setColumnWidth(15, 320);

  var n = Math.max(t.getLastRow() - 1, 50);
  lista(t, 1, n, ESTADOS, 'Activa, En montaje, Pausada o Cancelada');
  lista(t, 6, n, PLANES,  'El plan contratado');
  t.getRange(2, 7, n, 1).setNumberFormat('$#,##0');
  t.getRange(2, 8, n, 1).setNumberFormat('0').setHorizontalAlignment('center');
  t.getRange(2, 9, n, 1).setNumberFormat('d/MM/yyyy');
  t.getRange(2, 12, n, 1).setFontFamily('Courier New').setFontSize(9);
  t.getRange(2, 15, n, 1).setWrap(true);
  t.setFrozenColumns(2);

  var m = hoja(H_METRICAS, COL_METRICAS);
  rotulos(m, COL_METRICAS);
  encabezado(m, COL_METRICAS.length);
  METRICAS.forEach(function (c, i) { m.setColumnWidth(i + 1, c.ancho || 105); });
  m.setFrozenColumns(1);

  var dp = hoja(H_DESPLIEGUES, COL_DESPLIEGUES);
  rotulos(dp, COL_DESPLIEGUES);
  encabezado(dp, COL_DESPLIEGUES.length);
  [190, 220, 130, 110, 140, 90, 130, 130, 260].forEach(function (w, i) {
    dp.setColumnWidth(i + 1, w); });
  dp.setFrozenColumns(1);

  var b = hoja(H_BITACORA, ['Fecha', 'Qué pasó']);
  encabezado(b, 2);
  b.setColumnWidth(1, 150); b.setColumnWidth(2, 620);
  b.getRange(1, 1, Math.max(b.getLastRow(), 1), 1).setNumberFormat('d/MM/yy HH:mm');
}

/* Reescribe la fila de encabezados. Sin esto, una hoja creada con una versión
   anterior se queda con los rótulos viejos para siempre —hoja() solo escribe
   los encabezados cuando CREA la pestaña— y las columnas nuevas salen sin
   nombre. Los encabezados de estas dos pestañas los manda el código, no el
   usuario, así que sobrescribirlos no pisa nada de nadie. */
function rotulos(h, lista) {
  var actuales = h.getRange(1, 1, 1, Math.max(h.getLastColumn(), lista.length)).getValues()[0];
  var igual = lista.every(function (r, i) { return actuales[i] === r; }) &&
              actuales.length === lista.length;
  if (igual) return;
  h.getRange(1, 1, 1, actuales.length).clearContent();
  h.getRange(1, 1, 1, lista.length).setValues([lista]);
}

function encabezado(h, ancho) {
  h.getRange(1, 1, 1, ancho).setBackground(VERDE).setFontColor('#FFFFFF')
   .setFontWeight('bold').setFontSize(10).setVerticalAlignment('middle')
   .setWrap(true);
  h.setRowHeight(1, 34);
  h.setFrozenRows(1);
}

function lista(h, col, n, opciones, ayuda) {
  var regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(opciones, true).setAllowInvalid(false)
    .setHelpText(ayuda).build();
  h.getRange(2, col, n, 1).setDataValidation(regla);
}

// =============================================================================
// AYUDANTES
// =============================================================================

function hoja(nombre, encabezados) {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var h = libro.getSheetByName(nombre);
  if (!h) {
    h = libro.insertSheet(nombre);
    h.appendRow(encabezados);
    h.getRange(1, 1, 1, encabezados.length).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}

function filas(nombre) {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!h || h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, h.getLastColumn()).getValues();
}

function registrar(texto) {
  var b = hoja(H_BITACORA, ['Fecha', 'Qué pasó']);
  b.appendRow([new Date(), String(texto)]);
  // La bitácora no puede crecer sin fin: se queda con lo último.
  if (b.getLastRow() > 501) b.deleteRows(2, b.getLastRow() - 501);
}

function barra(valor, tope) {
  valor = Number(valor) || 0; tope = Number(tope) || 0;
  if (tope <= 0 || valor <= 0) return '';
  var n = Math.round(valor / tope * ANCHO_BARRA);
  if (n < 1) n = 1;
  var t = '';
  for (var i = 0; i < n; i++) t += '█';
  return t;
}

/* Sin toLocaleString: en Apps Script depende de la zona del proyecto y una
   hoja copiada a otra cuenta empieza a mostrar los precios distintos. */
function pesos(n) {
  var t = String(Math.round(Number(n) || 0));
  var salida = '';
  for (var i = 0; i < t.length; i++) {
    if (i > 0 && (t.length - i) % 3 === 0) salida += '.';
    salida += t.charAt(i);
  }
  return '$' + salida;
}

function varios(n, uno, muchos) { return n + ' ' + (n === 1 ? uno : muchos); }

function nombres(lista) {
  return lista.map(function (t) { return t.comercio; }).join(', ');
}

function nombresDe(datos) {
  return datos.map(function (d) { return d.tienda.comercio; }).join(', ');
}

function rellenar(t, n) {
  t = String(t);
  while (t.length < n) t += ' ';
  return t.slice(0, n);
}
