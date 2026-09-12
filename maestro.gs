/**
 * ORGÁNICO — PROYECTO MAESTRO
 * ---------------------------------------------------------------------------
 * Este archivo NO va dentro de la hoja del cliente. Va en un proyecto de Apps
 * Script INDEPENDIENTE (script.google.com > Proyecto nuevo), en tu cuenta.
 *
 * POR QUÉ FUERA
 * Un script pegado dentro de la hoja se lee entero desde Extensiones > Apps
 * Script. Al compartirle la hoja al cliente le estás entregando el sistema.
 * Fuera, el cliente ve sus datos y no ve una línea de código.
 *
 * QUÉ QUEDA DENTRO DE LA HOJA
 * Un stub de 45 líneas sin una sola regla de negocio: dibuja el menú y
 * reenvía cada opción aquí. Existe porque un menú dibujado desde un disparador
 * instalable corre bajo TU cuenta y no le aparece al cliente; lo único que un
 * menú necesita del lado de la hoja es un onOpen simple.
 *
 * Ese stub NO es un archivo que se mantenga aparte: lo escribe generarStub(),
 * ya con la URL y el token dentro. Así no se puede desincronizar del maestro.
 *
 * LAS TRES PUERTAS
 *   ?a=catalogo|validar|registrar|version   la tienda
 *   ?a=menu&f=...&t=...                     el stub de la hoja
 *   disparadores instalables                inventario al confirmar, hora
 *
 * UN MAESTRO POR CLIENTE
 * Cada tienda tiene su copia de este proyecto, con su HOJA_ID y su TOKEN.
 * Así las cuotas de Google (30 ejecuciones simultáneas, 90 min/día de
 * disparadores, 100 correos) son de esa tienda y una tienda muy activa no
 * afecta a las demás.
 *
 * PUESTA EN MARCHA — lo único que se escribe a mano es HOJA_ID
 * 1. Crea la hoja del cliente y copia su ID (lo que va entre /d/ y /edit).
 * 2. script.google.com > Proyecto nuevo. Pega este archivo.
 * 3. Pega ese ID abajo, en HOJA_ID. Es el único hueco.
 * 4. Ejecuta instalar(). Autoriza cuando Google lo pida.
 * 5. Implementar > Nueva implementación > Aplicación web.
 *      Ejecutar como: Yo    ·    Acceso: cualquier persona
 * 6. Ejecuta generarStub() y pega lo que imprima en la hoja
 *    (Extensiones > Apps Script). Ya trae la URL y el token dentro.
 * 7. Menú de la hoja > Generar configuración para index.html: el bloque también
 *    sale con la URL puesta.
 *
 * El token no se escribe: lo inventa instalar() y lo guarda en las propiedades
 * del proyecto. La URL tampoco: el maestro la sabe de sí mismo.
 *
 * Cada cambio de código: Implementar > Gestionar implementaciones > lápiz >
 * Versión: Nueva. Si no, la URL sigue sirviendo la versión vieja.
 * ---------------------------------------------------------------------------
 */

/* ══════════════════════════════════════════════════════════════════════════
   LO ÚNICO QUE CAMBIA DE UN CLIENTE A OTRO
   ══════════════════════════════════════════════════════════════════════════ */

// El ID de la hoja de cálculo del cliente. Va en la URL de la hoja, entre
// /d/ y /edit.  https://docs.google.com/spreadsheets/d/AQUÍ_VA/edit
var HOJA_ID = '';

/* ══════════════════════════════════════════════════════════════════════════
   LAS QUE SE EJECUTAN A MANO, JUNTAS Y EN ORDEN
   --------------------------------------------------------------------------
   Este archivo tiene más de cien funciones y el selector del editor las lista
   todas revueltas. Las cinco que un humano ejecuta de verdad estaban perdidas
   entre `cifraDeTexto` y `pintarColoresDesdeValor`, y encontrarlas era ir
   leyendo hasta dar con la que sonaba bien. Alguien lo dijo con todas las
   letras: «en las funciones del maestro no veo diagnosticoCompleto()».

   El prefijo `A1_`, `A2_`… hace dos cosas a la vez: las junta al principio de
   cualquier lista ordenada, y las numera EN EL ORDEN EN QUE SE NECESITAN, que
   es más útil que el alfabético. Montar una tienda es A0, A1, A2 de arriba
   abajo; lo demás son incidentes.

   Son envoltorios de una línea a propósito. Renombrar las funciones de verdad
   habría obligado a perseguirlas por el runbook, las baterías y tres años de
   comentarios, y a que quien tenga una hoja vieja se encuentre con que lo que
   sabía ya no existe. Los dos nombres funcionan.
   ══════════════════════════════════════════════════════════════════════════ */

/** A0 · Crear las pestañas y los disparadores. Lo primero, y una sola vez. */
function A0_instalar() { return instalar(); }

/** A1 · El código para pegar en la hoja del comercio. Después de publicar. */
function A1_generarStub() { return generarStub(); }

/** A2 · El informe completo: incluye el token de montaje, que el del menú no. */
function A2_diagnosticoCompleto() { return diagnosticoCompleto(); }

/** A3 · Jubilar el token de montaje. Lee lo que imprime: son TRES sitios. */
function A3_rotarToken() { return rotarToken(); }

/** A4 · Guardar una copia de la hoja ahora, sin esperar al domingo. */
function A4_respaldoAhora() { return respaldoSemanal(); }

/* El token NO se escribe: lo inventa instalar() la primera vez y lo guarda en
   las propiedades del proyecto. Un paso manual menos, y uno donde además era
   fácil equivocarse: bastaba un espacio de más al copiarlo para que el menú
   dejara de funcionar sin decir por qué.

   ESTE ES EL TOKEN DE MONTAJE, y abre todas las puertas: `bloques`, `sembrar`,
   `fotos`, `foto`, `panel`, `identidad`. Vive en los secretos del repositorio y
   en el tienda.json del que monta. NO va en el stub. */
function token() {
  var props = PropertiesService.getScriptProperties();
  var t = props.getProperty('TOKEN');
  if (!t) {
    t = 'tk-' + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('TOKEN', t);
  }
  return t;
}

/* ==========================================================================
   Y ESTE ES EL DEL MENÚ, QUE ES OTRO A PROPÓSITO.
   --------------------------------------------------------------------------
   Durante mucho tiempo fue uno solo, con este argumento escrito aquí mismo:
   «no es un secreto fuerte —el cliente puede leerlo en su stub— y no pretende
   serlo». La primera mitad era cierta y la segunda no se sostenía: el mismo
   token que el comerciante lee en el editor de su hoja era el que abría
   `?a=sembrar` —reescribir su configuración desde fuera—, `?a=bloques`,
   `?a=fotos` y `?a=panel`. Y un token que se lee en pantalla se pega en un
   chat, en una captura, en un correo de soporte. No hace falta mala fe: hace
   falta que esté a la vista.

   El del menú abre UNA puerta: `?a=menu`. Es lo único que el stub necesita.

   `tkm-` y no `tk-` para que se distingan de un vistazo cuando aparezcan
   sueltos —en una captura, en un log— y nadie tenga que adivinar cuál es cuál.
   ========================================================================== */
function tokenMenu() {
  var props = PropertiesService.getScriptProperties();
  var t = props.getProperty('TOKEN_MENU');
  if (!t) {
    t = 'tkm-' + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('TOKEN_MENU', t);
  }
  return t;
}

var VERSION = '2026-09-11-1';

/* Antes esto era getActiveSpreadsheet(): el script vivía dentro de la hoja.
   Ahora abre la del cliente por su ID, y esa es toda la diferencia. */
function elLibro() {
  if (!HOJA_ID) {
    throw new Error(
      'Falta HOJA_ID. Ábrela en Google Sheets, copia lo que va entre /d/ y ' +
      '/edit en la URL, y pégalo arriba en la constante HOJA_ID.');
  }
  return SpreadsheetApp.openById(HOJA_ID);
}

var H_TABLERO      = 'Tablero';
var H_CONFIG       = 'Configuración';
var H_CATALOGO     = 'Catálogo';
var H_ENVIOS       = 'Envíos';
var H_CUPONES      = 'Cupones';
var H_VALIDACIONES = 'Validaciones';
var H_PEDIDOS      = 'Pedidos';
var H_RESUMEN      = 'Más vendidos';
var H_ERRORES      = 'Errores';

/* Las columnas del catálogo. Para AGREGAR UN PRODUCTO NUEVO basta con llenar
   una fila aquí: no hay que tocar index.html. Las fotos van todas en la misma
   celda, separadas por una barra vertical:

     https://res.cloudinary.com/tu-cuenta/image/upload/v1/chonto-1.jpg|https://res.cloudinary.com/tu-cuenta/image/upload/v1/chonto-2.jpg

   Pega la URL tal como te la da Cloudinary. La tienda le inyecta sola las
   transformaciones (f_auto,q_auto para que pesen menos, c_fill,ar_1:1 para
   que queden cuadradas y w_ para pedir el tamaño justo de cada lugar). */
/* Las tres últimas se agregaron después, al final y opcionales (R1 y R3 del
   contrato): Referencia es el código interno del comercio —el que usa en su
   inventario o con su proveedor—, Precio antes es el tachado de una promoción,
   y Umbral bajo es a partir de cuántas unidades avisar «quedan pocas». Vacías
   no cambian nada, que es la condición para poder agregarlas sin migrar N
   hojas el mismo día. */
var ENCABEZADO_CATALOGO = ['ID', 'Nombre', 'Formato', 'Categoría', 'Precio', 'Stock',
                           'Descripción', 'Imágenes', 'Destacado', 'Activo',
                           'Referencia', 'Precio antes', 'Umbral bajo'];

/* La última columna, Inventario, la escribe el script solo. Dice si el stock de
   esa línea ya se descontó del catálogo. Existe para que confirmar un pedido dos
   veces, o deshacer el cambio, no descuadre el inventario. No la edites a mano. */
/* Las tres últimas las llena el comerciante a mano, después de la venta: cuándo
   le pagaron, cuándo despachó y con qué guía. Hoy eso vive en su cabeza o en el
   chat. Van al final y vacías no molestan a nadie. */
var ENCABEZADO_PEDIDOS = ['Fecha', 'Pedido', 'Validación', 'Estado', 'Ciudad', 'Cupón',
                          'Producto', 'ID', 'Cantidad', 'Precio unitario',
                          'Subtotal línea', 'Total del pedido', 'Inventario',
                          'Fecha de pago', 'Fecha de despacho', 'Guía'];

/* La columna Pedido de Validaciones es el MISMO número que el de Pedidos. Un
   solo identificador para todo: el que llega en el mensaje de WhatsApp. */
/* La última columna, Avisos, guarda lo que el maestro le dijo al comprador
   —envío no reconocido, stock justo, una celda que no se pudo leer—. Sin ella
   el acta no distingue «eligió recoger en finca» de «la hoja no reconoció el
   envío y avisó»: las dos dejan el envío en 0. Un acta que no guarda las
   advertencias no es un acta, es un recibo. Va al final: R1 del contrato. */
var ENCABEZADO_VALIDACIONES = ['Fecha', 'Pedido', 'Cupón', 'Subtotal según la hoja',
                               'Subtotal según la página', 'Discrepancia', 'Descuento',
                               'Envío', 'Total según la hoja', 'Detalle', 'Avisos'];
var COL_ESTADO     = 4;    // columna D de Pedidos
var COL_INVENTARIO = 13;   // columna M de Pedidos
var COL_STOCK      = 6;    // columna F de Catálogo

var MAX_CUERPO   = 4000;
var MAX_ITEMS    = 30;
var MAX_TEXTO    = 60;
/* Lo que escribe el maestro en el acta —discrepancias y avisos— no cabe en 60. */
var MAX_ACTA     = 400;
var MAX_CANTIDAD = 200;
var MAX_TOTAL    = 5000000;
var MAX_FILAS    = 20000;

/* ==========================================================================
   EMPIEZA POR AQUÍ
   --------------------------------------------------------------------------
   instalar() va de primera A PROPÓSITO. El desplegable de funciones de Apps
   Script elige sola la PRIMERA función del archivo, así que al darle Ejecutar
   corre esa y no otra. Si estuviera más abajo, correrías la que quedó de
   primera, que se completa sin errores y sin hacer nada visible.

   ESTE COMENTARIO DEJÓ DE SER VERDAD Y NADIE SE ENTERÓ. Decía «esta función va
   arriba del todo» y hacía tiempo que la primera del archivo era `token()`.
   Sin daño —ejecutarla no hace nada malo— pero era una propiedad de seguridad
   escrita y no comprobada, que es como se pierden. Ahora la primera es
   `A0_instalar`, que llama aquí, y hay una aserción que lo vigila.

   Ejecútala UNA VEZ después de pegar el archivo.
   Si algo no cuadra después, ejecuta A2_diagnostico().
   ========================================================================== */

function instalar() {
  var libro = elLibro();
  if (!libro) {
    throw new Error(
      'Este script NO está unido a ninguna hoja de cálculo: se creó como ' +
      'proyecto suelto. Abre tu hoja de Google, entra por Extensiones > Apps ' +
      'Script y pega el código ALLÍ. Ese proyecto sí queda unido a la hoja.');
  }
  console.log('Instalando en la hoja: ' + libro.getName());
  var cat = hoja(H_CATALOGO, ENCABEZADO_CATALOGO);
  asegurarColumnas(H_CATALOGO, ENCABEZADO_CATALOGO);   // hojas viejas: agrega lo que falte
  if (cat.getLastRow() < 2) {
    cat.getRange(2, 1, 8, 10).setValues([
      ['chonto','Tomate chonto','Canasta 1 kg','Frescos',8900,24,
       'El tomate de todos los días: pulpa jugosa, piel delgada y acidez media. Cortado la mañana del despacho. Ideal para guisos, sofritos y ensaladas.','','Sí','Sí'],
      ['cherry','Tomate cherry','Bandeja 250 g','Frescos',6500,4,
       'Dulce, firme y de piel brillante. Se cosecha en racimo y se empaca el mismo día. Va directo a la ensalada o al horno con aceite de oliva.','','No','Sí'],
      ['rinon','Tomate riñón','Canasta 1 kg','Frescos',9800,14,
       'Carnoso y de pocas semillas, el mejor para rodajas gruesas. Aguanta bien la nevera hasta cinco días sin perder textura.','','No','Sí'],
      ['salsa','Salsa de tomate natural','Frasco 300 g','Salsas',14900,9,
       'Solo tomate, sal marina, ajo y albahaca. Sin azúcar añadida, sin conservantes, sin almidones. Se cocina a fuego lento durante cuatro horas.','','Sí','Sí'],
      ['sofrito','Sofrito base de tomate','Frasco 400 g','Salsas',18500,16,
       'Tomate, cebolla larga, pimentón y aceite de oliva. La base de arroces, carnes y pastas, lista en un frasco. Rinde para seis platos.','','No','Sí'],
      ['pasta','Pasta de tomate concentrada','Frasco 250 g','Salsas',16500,0,
       'Reducción triple de tomate chonto. Una cucharada levanta cualquier caldo o estofado. Vuelve a estar disponible con la próxima cosecha.','','No','Sí'],
      ['secos','Tomates secos en aceite de oliva','Frasco 200 g','Conservas',22900,3,
       'Deshidratados al sol durante tres días y conservados en aceite de oliva extra virgen con orégano y laurel. Para panes, quesos y pastas.','','No','Sí'],
      ['jugo','Jugo de tomate prensado en frío','Botella 500 ml','Bebidas',12900,7,
       'Prensado sin calor para conservar el licopeno. Ligeramente salado, con un toque de limón y apio. Se conserva refrigerado hasta cinco días.','','No','Sí']
    ]);
    cat.setColumnWidth(7, 380);   // Descripción
    cat.setColumnWidth(8, 380);   // Imágenes
    cat.getRange(2, 7, 8, 2).setWrap(true);
  }

  var cfg = hoja(H_CONFIG, ['Clave', 'Valor', 'Qué es']);
  // La semilla vive FUERA del if: la usan las dos ramas, la instalación nueva
  // para llenar la hoja y la existente para agregarle las claves que le falten.
  var semilla = semillaDeConfiguracion();
  if (cfg.getLastRow() < 2) {
    cfg.getRange(2, 1, semilla.length, 3).setValues(semilla);
    cfg.setColumnWidth(2, 420); cfg.setColumnWidth(3, 380);
    cfg.getRange(2, 2, semilla.length, 2).setWrap(true);
  } else {
    // Hoja que ya existía: le agregamos las claves nuevas SIN tocar sus valores.
    // Sin esto, quien instaló antes nunca vería una opción nueva.
    var nuevas = agregarClavesQueFaltan(cfg, semilla);
    if (nuevas) console.log('Claves de configuración agregadas: ' + nuevas.join(', '));
  }

  var env = hoja(H_ENVIOS, ['ID', 'Nombre', 'Valor']);
  if (env.getLastRow() < 2) {
    env.getRange(2, 1, 5, 3).setValues([
      ['finca',     'Recoger en finca (Rionegro)',      0],
      ['medellin',  'Medellín y Valle de Aburrá',    9000],
      ['oriente',   'Rionegro y Oriente antioqueño', 6000],
      ['principal', 'Bogotá, Cali, Barranquilla',   15000],
      ['resto',     'Resto del país',               19000]
    ]);
  }

  var cup = hoja(H_CUPONES, ['Código', 'Tipo', 'Valor', 'Mínimo', 'Vence',
                             'Usos máximos', 'Usos confirmados', 'Activo', 'Notas']);
  if (cup.getLastRow() < 2) {
    cup.getRange(2, 1, 3, 9).setValues([
      ['ORGANICO10',  'porcentaje', 10,   50000, '2026-12-31', 0, 0, 'Sí', 'General. 0 usos máximos = sin tope.'],
      ['PRIMERA5000', 'fijo',       5000, 40000, '2026-12-31', 0, 0, 'Sí', 'Primera compra.'],
      ['ENVIOGRATIS', 'envio',      0,   120000, '2026-10-31', 0, 0, 'Sí', 'Envío sin costo.']
    ]);
  }

  hoja(H_VALIDACIONES, ENCABEZADO_VALIDACIONES);
  // Si la hoja venía de la versión anterior, corregimos el encabezado.
  elLibro().getSheetByName(H_VALIDACIONES)
    .getRange(1, 1, 1, ENCABEZADO_VALIDACIONES.length)
    .setValues([ENCABEZADO_VALIDACIONES]).setFontWeight('bold');
  hoja(H_PEDIDOS, ENCABEZADO_PEDIDOS);
  asegurarColumnas(H_PEDIDOS, ENCABEZADO_PEDIDOS);   // hojas viejas: agrega lo que falte
  hoja(H_RESUMEN, ['Producto', 'ID', 'Unidades vendidas', 'Ingresos', 'Pedidos en que aparece']);
  hoja(H_TABLERO, ['Indicador', 'Valor', 'Comparación']);
  hoja(H_ERRORES, ['Fecha', 'Error', 'Primeros 200 caracteres recibidos']);

  var cuantas = Object.keys(leerConfiguracion()).length;
  console.log('Configuración: ' + cuantas + ' claves.');

  presentarHojas();
  console.log('Hojas con formato, listas desplegables y colores sincronizados.');

  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'recalcularResumen' || f === 'alEditar') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('recalcularResumen').timeBased().everyHours(1).create();
  // forSpreadsheet(ID) y no forSpreadsheet(objeto): este proyecto no está unido
  // a la hoja, la alcanza por su identificador.
  ScriptApp.newTrigger('alEditar').forSpreadsheet(HOJA_ID).onEdit().create();

  /* El respaldo va de madrugada y un solo día: es una copia entera de la hoja
     y no tiene por qué competir con el tráfico del comercio. */
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'respaldoSemanal') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('respaldoSemanal')
    .timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).create();

  /* LOS DOS TOKENS SE CREAN AQUÍ, aunque nadie los pida todavía.
     Los dos se inventan solos la primera vez que alguien los llama, y eso
     bastaba cuando había uno. Con dos, dejarlo a la casualidad significa que
     el de montaje no existe hasta que llegue la primera petición del flujo —y
     el que monta la tienda necesita leerlo ANTES, para ponerlo en el secreto
     del repositorio. Materializarlos aquí quita esa carrera. */
  token();
  tokenMenu();

  /* LOS ESTADOS VIEJOS SE MIGRAN AQUÍ, y se dice cuántos. Instalar es el único
     momento en que se sabe que alguien está mirando el registro de ejecución.
     Es idempotente: la segunda vez no encuentra nada que cambiar. */
  var migrados = migrarEstados();
  if (migrados) {
    console.log('Estados migrados al vocabulario nuevo: ' + migrados + ' celda(s).');
    console.log('  Por confirmar → Nuevo · Confirmado → Pagado · Anulado → Cancelado');
  }

  // El toast sale en la hoja, no en el editor. Esto sí se ve en el
  // Registro de ejecución, que es donde estás mirando en este momento.
  console.log('LISTO. Pestañas de la hoja: ' +
    libro.getSheets().map(function (h) { return h.getName(); }).join(', '));
  console.log('Productos cargados: ' +
    Math.max(0, libro.getSheetByName(H_CATALOGO).getLastRow() - 1));
  var url = urlLista();
  if (url) {
    console.log('');
    console.log('═══ PEGA ESTO EN LA HOJA (Extensiones > Apps Script) ═══');
    console.log(generarStub().codigo);
  } else {
    console.log('Siguiente paso: Implementar > Nueva implementación > Aplicación web.');
    console.log('Después ejecuta generarStub() y pega lo que imprima en la hoja.');
  }
}

/* ==========================================================================
   GENERADOR DEL BLOQUE DE CONFIGURACIÓN
   --------------------------------------------------------------------------
   Ejecuta esto y copia del Registro de ejecución el bloque que imprime, pegándolo
   en index.html entre las marcas CONFIGURACIÓN DE ESTA TIENDA. Es lo único que
   hay que tocar del archivo para montar una tienda nueva.

   Existe porque el título, la descripción y las etiquetas Open Graph tienen que
   ser HTML estático: WhatsApp y Google leen la página sin ejecutar JavaScript,
   así que esas no se pueden sacar de la hoja en caliente.
   ========================================================================== */
function generarConfiguracion() {
  var c = leerConfiguracion();
  var url = (c.sitio_url || '').replace(/\/+$/, '') + '/';
  /* Todo lo que sale de la hoja va escapado entero, no solo las comillas: un
     nombre con & producía HTML inválido, y un < abría la puerta a que el texto
     del dueño se leyera como etiqueta. El icono NO pasa por aquí: es un SVG
     que tiene que llegar tal cual. */
  var v = function (k, alterna) { return escaparHtml(c[k] || alterna || ''); };
  var icono = iconoDeLaTienda(c);

  var hosts = hostsDeFotos(c, url);
  var csp = "default-src 'none'; script-src 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src https://fonts.gstatic.com; " +
            "img-src 'self' data:" + (hosts.length ? ' https://' + hosts.join(' https://') : '') + '; ' +
            /* 'self' hace falta desde que la vitrina lee su propio catalogo.json. Sin
               él la petición se bloquea sin decir por qué: la CSP no lanza un error de
               red, simplemente no deja salir, y la página cae al respaldo como si la
               hoja no hubiera contestado. */
            "connect-src 'self' https://script.google.com https://script.googleusercontent.com; " +
            "form-action 'none'; base-uri 'none'";

  var bloque = [
    '<meta http-equiv="Content-Security-Policy" content="' + csp + '">',
    '<!-- ═══ CONFIGURACIÓN DE ESTA TIENDA ═══',
    '     Generado por generarConfiguracion() en el Apps Script.',
    '     No lo edites a mano: cambia la pestaña Configuración y vuelve a generarlo. -->',
    '<title>' + v('sitio_titulo', 'Tienda') + '</title>',
    '<meta name="description" content="' + v('sitio_descripcion') + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + v('negocio') + '">',
    '<meta property="og:locale" content="es_CO">',
    '<meta property="og:title" content="' + v('sitio_titulo') + '">',
    '<meta property="og:description" content="' + v('sitio_descripcion') + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + url + 'compartir.jpg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="' + v('sitio_titulo') + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="canonical" href="' + url + '">',
    '<meta name="theme-color" content="' + (c.color_principal || '#D0211C') + '">',
    '<link rel="icon" href="' + icono + '">',
    '<link rel="apple-touch-icon" href="' + icono + '">',
    '<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->'
  ].join('\n');

  var js = [
    'const SCRIPT_URL     = "' + (urlLista() || 'PEGA_AQUÍ_LA_URL_QUE_TERMINA_EN_/exec') + '";',
    'const SCRIPT_VERSION = "' + VERSION + '";',
    'const FOTOS_HOSTS    = [' +
      hosts.map(function (h) { return '"' + h + '"'; }).join(', ') + '];',
    'let   NEGOCIO        = "' + (c.negocio || 'Tienda') + '";      // respaldo, la hoja manda',
    'let   WHATSAPP       = "' + (c.whatsapp || '') + '";  // respaldo, la hoja manda'
  ].join('\n');

  // Para quien lo ejecute desde el editor de Apps Script.
  console.log('═══ PEGA ESTO EN EL <head> DE index.html ═══\n');
  console.log(bloque);
  console.log('\n\n═══ Y ESTO EN EL BLOQUE DE CONFIGURACIÓN DEL <script> ═══\n');
  console.log(js);
  console.log('\n\nLa URL /exec la pegas tú: es lo único que el script no puede saber.');

  return { tipo: 'html', titulo: 'Configuración para index.html',
           html: ventanaConfiguracion(bloque, js), bloque: bloque, js: js,
           /* Sueltos y sin envolver, para que el montaje pueda reemplazar
              constante por constante en vez de tragarse un bloque entero. */
           valores: {
             SCRIPT_URL:     urlLista(),
             SCRIPT_VERSION: VERSION,
             FOTOS_HOSTS:    hosts,
             NEGOCIO:        String(c.negocio || 'Tienda'),
             WHATSAPP:       String(c.whatsapp || '')
           } };
}

/* Apps Script no tiene el constructor URL del navegador, así que el host se
   saca a mano. Es la clase de detalle que solo se descubre en producción. */
function hostDe(u) {
  var m = String(u || '').replace(/\{[a-z]+\}/g, 'x').match(/^https?:\/\/([^\/?#]+)/i);
  return m ? m[1].toLowerCase() : '';
}

/* Los proveedores de transformación que la política permite SIEMPRE, esté o no
   configurado alguno hoy. Van de antemano para que cambiar de proveedor sea
   cambiar la celda fotos_cdn y nada más: sin volver a generar la configuración,
   sin volver a pegar el <head>, sin republicar. El costo es acotado: son
   orígenes de imagen, no de código, y siguen sin poder ejecutar nada. */
var PROVEEDORES_FOTO = ['res.cloudinary.com', 'ik.imagekit.io', 'imagedelivery.net'];

/* Qué hosts de imagen tiene que permitir la política de seguridad.
   Sale de la hoja: el origen servible y el proveedor de transformación. Si el
   origen es el propio sitio no hace falta listarlo —'self' ya lo cubre—, así
   que la política solo crece cuando de verdad entra un tercero. */
function hostsDeFotos(c, urlSitio) {
  var lista = PROVEEDORES_FOTO.slice(), sitio = hostDe(urlSitio);
  var meter = function (u) {
    var host = hostDe(u);
    if (!host || host === sitio) return;                 // 'self' ya lo permite
    if (lista.indexOf(host) === -1) lista.push(host);
  };
  meter(c.fotos_origen);
  meter(c.fotos_cdn);
  meter(c.logo);
  meter(c.favicon);
  return lista;
}

/* El ícono de la pestaña del navegador.
   Va dibujado dentro del propio HTML (un SVG en la dirección del enlace), no
   como archivo aparte: así no hay que subir ni publicar nada más, pesa 400
   bytes y se ve nítido en cualquier pantalla. Toma los colores de la marca de
   la hoja, así que cada tienda tiene el suyo. Si el dueño prefiere su propio
   ícono, pone la URL en la clave favicon y esa manda. */
function iconoDeLaTienda(c) {
  if (String(c.favicon || '').trim()) return String(c.favicon).trim();
  var rojo  = c.color_principal  || '#D0211C';
  var verde = c.color_secundario || '#1B5E3A';
  var svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>" +
    "<circle cx='32' cy='40' r='23' fill='" + rojo + "'/>" +
    "<path d='M32 17V7' stroke='" + verde + "' stroke-width='5.5' stroke-linecap='round'/>" +
    "<path d='M32 18c-5-6-13-5-16-2 3 4 9 6 14 4 5 3 11 2 15-3-3-3-10-4-13 1z' fill='" + verde + "'/>" +
    "</svg>";
  return 'data:image/svg+xml,' + svg
    .replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, '%22');
}

function ventanaConfiguracion(bloque, js) {
  var caja = 'width:100%;box-sizing:border-box;font:12px/1.5 Menlo,Consolas,monospace;' +
             'border:1px solid #D8D8D8;border-radius:6px;padding:10px;background:#FAFAFA;' +
             'resize:vertical;white-space:pre;overflow-x:auto';
  var titulo = 'margin:22px 0 4px;font:600 13px/1.4 Arial,sans-serif;color:#111';
  var nota = 'margin:0 0 8px;font:400 12px/1.5 Arial,sans-serif;color:#666';
  var boton = 'margin-top:6px;padding:7px 14px;border:1px solid #111;background:#111;color:#FFF;' +
              'border-radius:6px;font:600 12px Arial,sans-serif;cursor:pointer';

  var html =
    '<div style="font-family:Arial,sans-serif;padding:4px 6px 18px">' +
    '<p style="' + nota + ';margin-top:0">Esto se pega en <b>index.html</b>. Son dos bloques.</p>' +

    '<p style="' + titulo + '">1. En el &lt;head&gt;</p>' +
    '<p style="' + nota + '">Reemplaza todo lo que hay entre las marcas ' +
    '<code>CONFIGURACIÓN DE ESTA TIENDA</code> y <code>FIN DE LA CONFIGURACIÓN</code>, marcas incluidas.</p>' +
    '<textarea id="a" rows="12" style="' + caja + '" readonly>' + escaparHtml(bloque) + '</textarea>' +
    '<button style="' + boton + '" onclick="copiar(\'a\', this)">Copiar el bloque del head</button>' +

    '<p style="' + titulo + '">2. En el bloque de configuración del &lt;script&gt;</p>' +
    '<p style="' + nota + '">Reemplaza esas líneas. ' + (urlLista()
      ? 'Ya llevan la URL de tu servicio: no hay nada que rellenar.'
      : '<b style="color:#B3261E">Falta publicar el proyecto</b> (Implementar &gt; Nueva ' +
        'implementación &gt; Aplicación web), y por eso la URL sale en blanco. ' +
        'Publica y vuelve a generar.') + '</p>' +
    '<textarea id="b" rows="5" style="' + caja + '" readonly>' + escaparHtml(js) + '</textarea>' +
    '<button style="' + boton + '" onclick="copiar(\'b\', this)">Copiar el bloque del script</button>' +

    '<p style="' + nota + ';margin-top:22px">Después de pegarlos, vuelve a publicar el sitio. ' +
    'Los precios, el catálogo y los textos NO necesitan esto: esos ya salen de la hoja en caliente. ' +
    'Este bloque es solo para el título y la vista previa al compartir, que tienen que ser HTML fijo ' +
    'porque WhatsApp y Google no ejecutan JavaScript.</p>' +

    '<script>function copiar(id, b){var t=document.getElementById(id);' +
    't.select();t.setSelectionRange(0,999999);' +
    'try{document.execCommand("copy");b.textContent="Copiado";' +
    'setTimeout(function(){b.textContent=b.dataset.o||"Copiar";},1800);}catch(e){}}' +
    'document.querySelectorAll("button").forEach(function(b){b.dataset.o=b.textContent;});<\/script>' +
    '</div>';

  return html;
}

/* ==========================================================================
   Si algo no funciona, ejecuta esto y lee el Registro de ejecución.
   ========================================================================== */
/* MailApp.getRemainingDailyQuota() cobra una llamada y puede fallar si el
   permiso de correo todavía no está dado. Nunca debe tumbar el panel. */
function cuotaDeCorreo() {
  try { return MailApp.getRemainingDailyQuota(); } catch (e) { return -1; }
}

/* ==========================================================================
   EL DIAGNÓSTICO, EN NUEVE PUNTOS.
   --------------------------------------------------------------------------
   Antes era una lista de líneas sueltas: verdadera toda, pero sin decir cuál
   de ellas era el problema. Quien la leía tenía que saber ya qué buscar, y
   quien la leía es justamente el que no lo sabe.

   Ahora son nueve puntos numerados, cada uno con un veredicto —OK, REVISAR o
   PROBLEMA— y, cuando hay algo que arreglar, LA CELDA O EL ARCHIVO EXACTO.
   «Hay datos que no se pudieron leer» no se puede accionar; «Catálogo E7 dice
   $9.000» se arregla en diez segundos.

   Sale por partida doble a propósito:
   · `html` es lo que ve el comerciante: los nueve veredictos arriba, el
     detalle debajo y un cuadro que se copia de un tirón.
   · `texto` es el mismo informe en llano. Lo consume `?a=diagnostico` y las
     baterías, y es lo que se pega en un chat.

   Lo que NO va en el cuadro copiable es el token. El cuadro está hecho para
   mandárselo a quien montó la tienda por WhatsApp, y un token que da de alta
   pedidos no debería viajar por ahí de rebote. Para el panel se lee arriba,
   en pantalla, que es donde hace falta.
   ========================================================================== */
/* SEGURO POR DEFECTO: sin argumento, NO enseña el token de montaje.
   El menú llama a esta función sin argumentos —ejecutarAccion() la invoca como
   `fn()`— así que lo que ve el comerciante es la versión sin secretos. El que
   monta la tienda ejecuta `diagnosticoCompleto()` desde el editor del maestro,
   que es un sitio donde el comerciante no entra.

   El valor por defecto es el discreto y no al revés a propósito: si mañana
   alguien añade otra forma de llamar a esto y no se acuerda de este párrafo,
   el fallo es que el operador tenga que ejecutar una función más, no que el
   token de montaje aparezca en la pantalla de un cliente. */
function diagnostico(mostrarSecretos) {
  var linea = [];
  var decir = function (t) { linea.push(t); console.log(t); };
  var puntos = [];                       // {n, titulo, estado}
  var actual = null;
  var punto = function (titulo) {
    actual = { n: puntos.length + 1, titulo: titulo, estado: 'OK' };
    puntos.push(actual);
    decir('');
    decir('── ' + actual.n + ' · ' + titulo.toUpperCase() + ' ──');
  };
  /* Un punto solo empeora, nunca mejora: si una línea ya dijo PROBLEMA, otra
     que diga REVISAR no lo devuelve a la vida. */
  var marcar = function (estado) {
    if (estado === 'PROBLEMA' || actual.estado === 'OK') actual.estado = estado;
  };

  /* La respuesta de la tienda se cachea POR EJECUCIÓN, y un diagnóstico es
     justo cuando no se quiere una respuesta vieja: se descarta al empezar. */
  CATALOGO_PUBLICADO = null;

  var libro;
  try { libro = elLibro(); } catch (e) {
    decir('PROBLEMA: ' + e.message);
    return { tipo: 'aviso', texto: linea.join('\n') };
  }

  // ── 1 ────────────────────────────────────────────────────────────────────
  punto('Versión de este maestro');
  decir('Versión del MAESTRO de esta tienda: ' + VERSION + '   (esquema ' + ESQUEMA + ')');
  decir('Si la tienda dice que la versión no coincide, es que falta hacer');
  decir('Implementar > Gestionar implementaciones > lápiz > Versión: Nueva.');
  decir('Hoja: ' + libro.getName());
  decir('URL:  ' + libro.getUrl());

  // ── 2 ────────────────────────────────────────────────────────────────────
  /* VA AQUÍ ARRIBA A PROPÓSITO. Si la tienda no está terminada, todo lo demás
     es ruido: da igual que las nueve pestañas estén bien si el comprador no
     tiene cómo pagar. */
  punto('¿Está terminada esta tienda?');
  var alta = revisarTienda();
  if (alta.bloquean.length) {
    marcar('PROBLEMA');
    /* No empieza por «FALTA» a propósito: esa palabra al principio de línea es
       la que usa el informe para las pestañas que no existen, y una batería la
       busca así. Dos cosas distintas no pueden abrir igual. */
    decir('Sin esto la tienda NO PUEDE VENDER:');
    alta.bloquean.forEach(function (x) {
      decir('   ' + x.clave + ' — ' + x.porQue);
    });
  }
  if (alta.avisan.length) {
    marcar('REVISAR');
    decir(alta.bloquean.length ? '' : 'La tienda vende, pero queda a medias:');
    if (alta.bloquean.length) decir('Y además, sin romper la venta:');
    alta.avisan.forEach(function (x) {
      decir('   ' + x.clave + ' — ' + x.porQue);
    });
  }
  if (alta.lista) {
    decir('OK   las ' + LISTA_DE_ALTA.length + ' claves del alta están llenas.');
  } else {
    decir('');
    decir('Todas se llenan en la pestaña Configuración.');
  }

  // ── 3 ────────────────────────────────────────────────────────────────────
  /* Los dos datos que hay que llevar al panel de tiendas. Van juntos y con
     rótulo porque es lo que más se busca y lo que más se copia mal. */
  punto('Para el panel de tiendas');
  decir('── PARA EL PANEL DE TIENDAS ──');
  var servicio = urlLista();
  if (!servicio) marcar('REVISAR');
  decir('Servicio: ' + (servicio ||
    'TODAVÍA NO SE SABE.\n' +
    '          Publica el proyecto (Implementar > Aplicación web) y luego ABRE\n' +
    '          esa URL una vez en el navegador. El maestro solo puede conocer\n' +
    '          su propia dirección atendiendo una petición: desde el editor,\n' +
    '          Google le dice la /dev, que no sirve para nadie más.'));
  decir(mostrarSecretos
    ? 'Token:    ' + token()
    : 'Token:    no se muestra aquí. Ejecuta diagnosticoCompleto() en el\n' +
      '          editor del maestro: este informe se puede copiar y reenviar.');

  /* LA MIGRACIÓN DE LOS DOS TOKENS, MEDIDA Y NO SUPUESTA. No se puede mirar el
     stub de la hoja desde aquí, pero sí se puede saber con qué token entró la
     última vez, porque atenderMenu() lo anota. Es la misma idea del punto 8:
     se mide lo que pasa, no lo que debería pasar. */
  var tv = Date.parse(marcaDelTokenViejo() || '');
  if (tv) {
    marcar('REVISAR');
    decir('');
    decir('El stub de esta hoja todavía usa el TOKEN DE MONTAJE (' + haceCuanto(tv) + ').');
    decir('Ese token abre todas las puertas y no debería estar en la hoja.');
    decir('Ejecuta generarStub() en el editor del maestro y pega el código nuevo:');
    decir('el de ahora lleva un token que solo sirve para el menú.');
  } else {
    decir('OK   el stub usa el token del menú, que solo abre el menú.');
  }

  // ── 3 ────────────────────────────────────────────────────────────────────
  punto('Pestañas de la hoja');
  var faltan = 0;
  [H_CONFIG, H_CATALOGO, H_ENVIOS, H_CUPONES, H_VALIDACIONES, H_PEDIDOS, H_RESUMEN, H_TABLERO, H_ERRORES]
    .forEach(function (nombre) {
      var h = libro.getSheetByName(nombre);
      if (!h) { faltan++; decir('FALTA la pestaña: ' + nombre); }
      else decir('OK   ' + nombre + '   (' + Math.max(0, h.getLastRow() - 1) + ' filas)');
    });
  if (faltan) { marcar('PROBLEMA'); decir('Ejecuta instalar() para crear las que faltan.'); }

  // ── 4 ────────────────────────────────────────────────────────────────────
  punto('Tareas automáticas');
  var funciones = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  if (funciones.indexOf('recalcularResumen') === -1) marcar('PROBLEMA');
  decir(funciones.indexOf('recalcularResumen') !== -1
    ? 'OK   resumen programado cada hora'
    : 'FALTA el disparador del resumen. Ejecuta instalar().');
  if (funciones.indexOf('alEditar') === -1) marcar('PROBLEMA');
  decir(funciones.indexOf('alEditar') !== -1
    ? 'OK   inventario se mueve al cambiar el Estado'
    : 'FALTA el disparador de edición. Ejecuta instalar().');

  // ── 5 ────────────────────────────────────────────────────────────────────
  /* SIN CACHÉ, A PROPÓSITO. Ver revisarDatos(): leer por el caché hacía que
     el informe diera todo por bueno mientras un precio llevaba una hora sin
     poderse leer. */
  punto('Datos que la hoja no pudo leer');
  var datos = revisarDatos();

  /* LAS CELDAS DE ESTADO QUE NO SE ENTIENDEN, por su fila. Un pedido con el
     Estado mal escrito se queda quieto: ni descuenta ni devuelve inventario, y
     sin esto nadie se enteraría hasta cuadrar el stock a fin de mes. */
  aplicarInventario();
  if (ESTADOS_ILEGIBLES.length) {
    marcar('REVISAR');
    decir('Hay ' + ESTADOS_ILEGIBLES.length + ' pedido(s) con un Estado que no reconozco.');
    decir('Esas líneas no mueven inventario, ni para un lado ni para el otro.');
    decir('Elige el estado de la lista desplegable de la columna Estado:');
    ESTADOS_ILEGIBLES.forEach(function (c) { decir('   ' + c); });
    decir('   Los válidos son: ' + ESTADOS_PEDIDO.join(' · '));
    decir('');
  }

  if (datos.ilegibles.length) {
    marcar('PROBLEMA');
    decir('Hay ' + datos.ilegibles.length + ' celda(s) con algo que no es un número.');
    decir('Una cifra que no se puede leer NO vale cero: el producto sale de la');
    decir('tienda en vez de salir gratis. Corrige la celda y publica de nuevo.');
    datos.ilegibles.forEach(function (c) { decir('   ' + c); });
  } else {
    decir('OK   todas las cifras de Catálogo, Envíos, Cupones y Configuración');
    decir('     se leen como números.');
  }

  // ── 6 ────────────────────────────────────────────────────────────────────
  punto('Qué sale en el catálogo');
  var cat = catalogoPublico();
  decir('Lo que ve la tienda: ' + cat.productos.length + ' productos y ' +
              cat.envios.length + ' tarifas de envío.');
  if (!cat.productos.length) {
    marcar('PROBLEMA');
    decir('Vacío. Revisa que la pestaña Catálogo tenga filas con ID, Nombre y Activo = Sí.');
  }
  if (datos.caidos.length) {
    marcar('REVISAR');
    decir('Estas filas no llegan a la tienda, y por qué:');
    datos.caidos.forEach(function (c) { decir('   ' + c); });
  }

  // ── 7 ────────────────────────────────────────────────────────────────────
  punto('Fotos');
  var fotos = revisarFotos();
  if (!fotos.comprobable) {
    marcar('REVISAR');
    decir(fotos.porQue === 'sinUrl'
      ? 'No sé la dirección de la tienda (Configuración > sitio_url), así que'
      : 'No pude leer el catálogo publicado (' + fotos.porQue + '), así que');
    decir('no puedo comprobar qué fotos tiene la tienda de verdad.');
  } else if (fotos.faltan.length) {
    marcar('REVISAR');
    decir('La hoja pide ' + fotos.pedidas + ' foto(s). Estas la tienda NO las tiene:');
    fotos.faltan.forEach(function (f) { decir('   ' + f); });
    decir('Si acabas de subirlas al Drive, usa «Publicar ahora» y vuelve a mirar:');
    decir('la tienda solo cambia cuando se publica.');
  } else {
    decir('OK   las ' + fotos.pedidas + ' fotos que pide la hoja están en la tienda.');
  }
  if (fotos.comprobable && fotos.sobran.length) {
    decir('(Hay ' + fotos.sobran.length + ' foto(s) publicadas que ya nadie usa. No estorban.)');
  }

  // ── 8 ────────────────────────────────────────────────────────────────────
  /* ══ QUÉ ESTÁ MOSTRANDO LA TIENDA, QUE NO ES LO MISMO QUE QUÉ DICE LA HOJA ══
     Desde que el catálogo se hornea dentro del sitio, la hoja y la tienda pueden
     decir cosas distintas durante un rato. El comerciante no tiene acceso a
     GitHub —ni tiene por qué— así que contarle que «quedó avisado en el flujo»
     no le sirve de nada.
     Lo que sí le sirve es el resultado observable: se le pregunta A LA TIENDA
     de cuándo es lo que está sirviendo. Eso no depende de que la tubería
     reporte bien; depende de lo que un comprador ve ahora mismo. */
  punto('Qué está mostrando tu tienda');
  var pub = publicacionDeLaTienda();
  if (/NO SE PUDO COMPROBAR|ATENCIÓN|no sé la dirección/.test(pub)) marcar('REVISAR');
  decir(pub);

  // ── 9 ────────────────────────────────────────────────────────────────────
  punto('Carga, respaldo y últimos errores');
  decir('Lecturas del catálogo hoy: ' + lecturasDeHoy() +
        '   ·   pico en una hora: ' + picoDeHoy());
  decir('   El tope de Google es de CONCURRENCIA —30 ejecuciones a la vez— y no');
  decir('   se puede consultar. Por eso lo que se mira es el pico y no el total.');
  decir('   Pasado 300 en una hora, tres días distintos: ver DECISIONES.md 01.');
  var r = ultimoRespaldo();
  if (r.error) marcar('REVISAR');
  decir('Último respaldo: ' + (r.error ? 'FALLÓ — ' + r.error
        : (r.fecha ? r.fecha.slice(0, 10) + '  ' + r.archivo
                   : 'todavía ninguno (sale los domingos de madrugada)')));

  /* LOS PEDIDOS QUE SE RESCATARON. Cada uno estuvo perdido un rato: el comercio
     veía el chat de WhatsApp y no veía la fila. Que al final llegara no borra
     eso, y si el comprador no hubiera vuelto a abrir la tienda no habría
     llegado nunca. */
  var res = rescates();
  if (res.n) {
    marcar('REVISAR');
    decir('');
    decir('Pedidos que llegaron TARDE: ' + res.n +
          '   ·   el que más tardó: ' + haceCuantoDura(res.peor));
    decir('   Son pedidos que salieron por WhatsApp y no llegaron a la hoja en su');
    decir('   momento: la tienda los recuperó cuando el comprador volvió a abrirla.');
    decir(res.peor > 60
      ? '   Más de una hora quiere decir que esta tienda estuvo caída un buen rato.'
      : '   Minutos sueltos son tropiezos de red, y son normales.');
    decir('   El último, ' + haceCuanto(Date.parse(res.ultimo)) + '.');
  }

  var he = libro.getSheetByName(H_ERRORES);
  if (he && he.getLastRow() > 1) {
    var desde = Math.max(2, he.getLastRow() - 4);
    decir('--- últimos errores ---');
    he.getRange(desde, 1, he.getLastRow() - desde + 1, 3).getValues().forEach(function (f) {
      decir('  ' + f[0] + '  ' + f[1]);
    });
  } else {
    decir('Sin errores registrados.');
  }

  /* ── El veredicto, arriba del todo ────────────────────────────────────────
     Se calcula al final porque hasta el final no se sabe, pero se LEE primero:
     el resumen va al principio del informe. Un informe que obliga a bajar
     hasta el pie para saber si hay que preocuparse no lo lee nadie. */
  var malos = puntos.filter(function (p) { return p.estado !== 'OK'; });
  var cabecera = ['── RESUMEN ──'];
  puntos.forEach(function (p) {
    cabecera.push('  ' + (p.estado === 'OK' ? 'OK      ' : p.estado === 'REVISAR' ? 'REVISAR ' : 'PROBLEMA') +
                  '  ' + p.n + '. ' + p.titulo);
  });
  cabecera.push(malos.length
    ? '  → ' + malos.length + ' punto(s) para revisar. El detalle está abajo.'
    : '  → Todo en orden.');
  cabecera.push('');
  var texto = cabecera.join('\n') + linea.join('\n');

  /* El cuadro copiable lleva TODO menos el token. `texto` sí lo lleva, porque
     lo consume el panel y `?a=diagnostico`, que ya viajan autenticados; el
     cuadro está hecho para reenviarse por WhatsApp, y ahí no. */
  var tk = mostrarSecretos ? token() : '';
  var copiable = tk ? texto.split(tk).join('(el token está en pantalla, punto 2)') : texto;

  return { tipo: 'html', titulo: 'Diagnóstico', texto: texto,
           html: diagnosticoEnHtml(puntos, copiable, servicio, tk) };
}

/* El diagnóstico CON los secretos, para el que monta la tienda. Se ejecuta
   desde el editor del maestro —Ejecutar > diagnosticoCompleto— y lo que
   imprime sale por el registro de ejecución, no por la pantalla del cliente.
   No está en ACCIONES_MENU ni tiene puerta en doGet: no se puede llamar
   desde fuera, que es justamente lo que la hace segura. */
function diagnosticoCompleto() {
  return diagnostico(true);
}

/* ==========================================================================
   JUBILAR EL TOKEN DE MONTAJE QUE ESTUVO A LA VISTA.
   --------------------------------------------------------------------------
   Pegar el stub nuevo hace que la hoja deje de USAR el token de montaje, pero
   no lo invalida: quien lo haya copiado antes lo sigue teniendo. Cerrar el
   agujero de verdad es cambiarlo, y eso obliga a tocar dos sitios fuera de
   aquí —el secreto MAESTRO_TOKEN del repositorio y el tienda.json de quien
   monta—, así que no puede pasar solo ni por sorpresa.

   SE NIEGA MIENTRAS ALGUNA HOJA SIGA ENTRANDO CON EL VIEJO. Rotarlo antes de
   pegar el stub nuevo deja el menú del comerciante muerto sin decirle por qué,
   y «se me apagó el menú» es exactamente el incidente que este sprint quería
   evitar. El margen de una hora es para no confiar en un reloj: si la última
   entrada con el token viejo fue hace un rato largo, la migración se dio.

   No está en el menú ni tiene puerta en doGet. Se ejecuta desde el editor.
   ========================================================================== */
function rotarToken() {
  var props = PropertiesService.getScriptProperties();
  var viejo = '';
  try { viejo = props.getProperty('STUB_CON_TOKEN_VIEJO') || ''; } catch (e) { }
  var tv = Date.parse(viejo || '');
  var margen = 60 * 60 * 1000;

  if (tv && Date.now() - tv < margen) {
    var m = 'TODAVÍA NO.\n\n' +
      'Esta hoja entró al menú con el token de montaje ' + haceCuanto(tv) + ',\n' +
      'así que su stub sigue siendo el viejo. Si rotas ahora, el menú del\n' +
      'comerciante deja de funcionar y él no va a saber por qué.\n\n' +
      'Primero: generarStub() aquí, pegar el código en la hoja, abrir el menú\n' +
      'una vez para comprobar. Después vuelve a ejecutar rotarToken().';
    console.log(m);
    return m;
  }

  var nuevo = 'tk-' + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('TOKEN', nuevo);
  props.deleteProperty('STUB_CON_TOKEN_VIEJO');

  /* TRES SITIOS, Y ESTA LISTA DECÍA DOS. Se me olvidó el panel, y el panel es
     el que más ruido hace al fallar: no da un 401 que alguien lea, marca la
     tienda como «NO RESPONDE» y le vacía la fila de métricas. Quien lo mira
     concluye que la tienda se cayó, no que el token es viejo — y sale a buscar
     un problema que no existe.

     Una lista incompleta de pasos es peor que ninguna: la primera se sigue
     entera y se confía en ella. */
  var salida = 'TOKEN DE MONTAJE NUEVO:\n\n    ' + nuevo + '\n\n' +
    'El anterior ya no vale. Falta cambiarlo en TRES sitios, y hasta que lo\n' +
    'hagas los flujos van a fallar y el panel va a decir que esta tienda no\n' +
    'responde —que no es verdad: es que le estás hablando con el token viejo—:\n\n' +
    '  1. El secreto MAESTRO_TOKEN del repositorio de esta tienda.\n' +
    '  2. LA PESTAÑA Tiendas DEL PANEL, columna Token, la fila de este comercio.\n' +
    '  3. El tienda.json de quien monta, si lo usa en su máquina.\n\n' +
    'El token del menú NO cambió: el stub que está pegado sigue sirviendo.';
  console.log(salida);
  return salida;
}

/* El mismo informe, para leerlo. El cuadro de abajo es un textarea y no un
   <pre> por una razón práctica: dentro de un diálogo de Sheets, seleccionar
   texto de un <pre> con el ratón es un suplicio, y este cuadro existe para
   copiarse entero de un clic. */
function diagnosticoEnHtml(puntos, texto, servicio, tk) {
  var color = { 'OK': '#1B5E3A', 'REVISAR': '#8A6100', 'PROBLEMA': '#B3261E' };
  var fondo = { 'OK': '#E8F3EC', 'REVISAR': '#FFF4DB', 'PROBLEMA': '#FCE8E6' };
  var items = puntos.map(function (p) {
    return '<li style="margin:0 0 5px;font:400 13px/1.45 Arial,sans-serif;color:#111">' +
      '<span style="display:inline-block;min-width:74px;text-align:center;' +
      'border-radius:3px;padding:1px 6px;margin-right:8px;' +
      'font:700 11px Arial,sans-serif;color:' + color[p.estado] + ';' +
      'background:' + fondo[p.estado] + '">' + p.estado + '</span>' +
      escaparHtml(p.n + '. ' + p.titulo) + '</li>';
  }).join('');
  var malos = puntos.filter(function (p) { return p.estado !== 'OK'; }).length;

  return '<div style="font-family:Arial,sans-serif;padding:6px 10px 18px">' +
    '<p style="font:700 14px Arial,sans-serif;color:' +
      (malos ? '#B3261E' : '#1B5E3A') + ';margin:0 0 10px">' +
      (malos ? malos + ' punto(s) para revisar' : 'Todo en orden') + '</p>' +
    '<ol style="list-style:none;padding:0;margin:0 0 14px">' + items + '</ol>' +
    /* Los dos datos del panel, en pantalla y no en el cuadro: aquí se leen y
       se copian a mano, que es lo que hace falta una sola vez al montar. */
    '<div style="border:1px solid #E0E0E0;border-radius:4px;padding:8px 10px;' +
      'margin:0 0 12px;background:#FFF">' +
      '<p style="font:700 11px Arial,sans-serif;color:#666;margin:0 0 4px;' +
        'letter-spacing:.04em">PARA EL PANEL DE TIENDAS</p>' +
      '<p style="font:400 11px/1.5 Consolas,monospace;color:#111;margin:0;' +
        'word-break:break-all">Servicio: ' + escaparHtml(servicio || '(todavía no se sabe)') +
        '<br>Token: ' + (tk ? escaparHtml(tk)
          : '<span style="font-family:Arial,sans-serif;color:#666">se lee con ' +
            '<b>diagnosticoCompleto()</b> en el editor del maestro</span>') +
        '</p></div>' +
    '<p style="font:400 12px/1.5 Arial,sans-serif;color:#666;margin:0 0 4px">' +
      'Si necesitas ayuda, copia este cuadro y mándalo por WhatsApp a quien te ' +
      'montó la tienda. Trae todo lo que hace falta para entender qué pasa.</p>' +
    '<textarea readonly onclick="this.select()" ' +
      'style="width:100%;height:330px;box-sizing:border-box;padding:8px;' +
      'font:400 11px/1.45 Consolas,monospace;color:#111;border:1px solid #CCC;' +
      'border-radius:4px;background:#FAFAFA">' + escaparHtml(texto) + '</textarea>' +
    '</div>';
}

/* ==========================================================================
   Cierra la inyección de fórmulas de Sheets.
   Una celda que empiece por = + - @ (o por un carácter de control) se ejecuta
   al abrir la hoja. El apóstrofe la obliga a quedarse como texto.
   ========================================================================== */
/* El tope por defecto —MAX_TEXTO— es para lo que escribe el comprador: un
   nombre, una nota. Los textos que escribe el maestro —una discrepancia, un
   aviso— son más largos por naturaleza y cortarlos a 60 los deja sin decir
   nada: «El envío que elegiste ya no está disponible; te confirmamos ». Por eso
   el tope se puede subir. Lo que NO cambia es la limpieza: sigue siendo texto
   que puede traer trozos de lo que puso el comprador. */
function celdaSegura(valor, tope) {
  var maximo = tope || MAX_TEXTO;
  var t = String(valor === null || valor === undefined ? '' : valor);
  t = t.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
  if (t.length > maximo) t = t.slice(0, maximo);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

/* ============================================================================
   UNA CIFRA QUE NO SE PUEDE LEER NO VALE CERO.
   ----------------------------------------------------------------------------
   Durante mucho tiempo todas las cifras del comerciante se leyeron así:

       precio: Number(f[4]) || 0

   Y `|| 0` convierte «no se pudo leer» en «es gratis», que no se parecen en
   nada. Escribir `$9.000` o `9,000` en una celda es lo más natural del mundo
   para quien lleva su negocio en una hoja de cálculo, y lo que pasaba después
   no avisaba a nadie: el producto salía gratis, el envío salía gratis, el cupón
   se aplicaba sin mínimo, y un cupón limitado pasaba a ilimitado porque 0 usos
   máximos significa SIN TOPE.

   La prueba no es Number(): `Number('9.000')` no es NaN, es 9. La prueba es el
   TIPO. getValues() devuelve un número cuando la celda es numérica y un texto
   cuando no; si vuelve texto y no está vacía, alguien escribió algo que la hoja
   no reconoció como número, y aquí NO se adivina qué quiso decir.

   Vacío sí es 0: una celda en blanco es una decisión. Ilegible no.
   ============================================================================ */
var CELDAS_ILEGIBLES = [];

function cifra(valor, donde) {
  if (valor === '' || valor === null || valor === undefined) return 0;
  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;
  if (CELDAS_ILEGIBLES.length < 20) {
    CELDAS_ILEGIBLES.push(donde + ' dice "' + String(valor).slice(0, 24) + '"');
  }
  return null;                       // null es «no se sabe», que no es cero
}

/* La pestaña Configuración es un almacén de TEXTO: leerConfiguracion() convierte
   todo a String a propósito, porque casi todo lo que hay ahí son textos. Así que
   para sus pocas cifras la prueba del tipo no sirve y hace falta una lectura
   propia — tolerante con cómo escribe la gente los pesos («$20.000», «20.000»,
   «20,000», «20000») y estricta con lo que no es un número. Sigue sin adivinar:
   lo que no encaja en el patrón es ilegible, no cero. */
function cifraDeTexto(valor, donde) {
  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;
  var t = String(valor === null || valor === undefined ? '' : valor).trim();
  if (!t) return 0;
  var limpio = t.replace(/[$\s]/g, '').replace(/[.,](?=\d{3}(\D|$))/g, '');
  if (!/^\d+$/.test(limpio)) {
    if (CELDAS_ILEGIBLES.length < 20) {
      CELDAS_ILEGIBLES.push(donde + ' dice "' + t.slice(0, 24) + '"');
    }
    return null;
  }
  return Number(limpio);
}

function numeroSeguro(valor, tope) {
  var n = Number(valor);
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), tope);
}

/* Agrega a Configuración las claves de la semilla que todavía no estén, con su
   valor por defecto y su explicación. Las que ya existen no se tocan nunca. */
function agregarClavesQueFaltan(h, semilla) {
  var tiene = {};
  filas(H_CONFIG).forEach(function (f) { tiene[String(f[0]).trim()] = true; });
  var faltan = semilla.filter(function (f) { return !tiene[f[0]]; });
  if (!faltan.length) return null;
  var desde = h.getLastRow() + 1;
  h.getRange(desde, 1, faltan.length, 3).setValues(faltan);
  h.getRange(desde, 2, faltan.length, 2).setWrap(true);
  return faltan.map(function (f) { return f[0]; });
}

function hoja(nombre, encabezados) {
  var libro = elLibro();
  var h = libro.getSheetByName(nombre);
  if (!h) {
    h = libro.insertSheet(nombre);
    h.appendRow(encabezados);
    h.getRange(1, 1, 1, encabezados.length).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}

/* Agrega al final las columnas del encabezado que le falten a una hoja que ya
   existía. Sin esto, quien ya tenía la hoja creada nunca vería la columna nueva. */
function asegurarColumnas(nombre, encabezados) {
  var h = elLibro().getSheetByName(nombre);
  if (!h) return;
  var actuales = h.getRange(1, 1, 1, Math.max(1, h.getLastColumn())).getValues()[0];
  for (var i = actuales.length; i < encabezados.length; i++) {
    h.getRange(1, i + 1).setValue(encabezados[i]).setFontWeight('bold');
  }
}

function filas(nombre) {
  var h = elLibro().getSheetByName(nombre);
  if (!h || h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, h.getLastColumn()).getValues();
}

function esSi(v) {
  var t = String(v).trim().toLowerCase();
  return t === 'sí' || t === 'si' || t === 'true' || t === 'x' || t === '1';
}

/* ESQUEMA es la forma de los datos; VERSION es la del código. Se separan porque
   cambian por razones distintas y a ritmos distintos: se puede publicar un
   maestro nuevo diez veces sin mover una columna, y ese es el caso normal.

   La vitrina compara ESQUEMA con el que ella conoce. Si el que llega es MAYOR,
   no entiende lo que le están dando y se queda con lo último bueno —diciéndolo
   por consola—, en vez de pintar una tienda a medias. Sube solo cuando cambia
   lo que las puertas publican, y siguiendo R1: agregando al final. */
var ESQUEMA = 1;

/* LA PUERTA ?a=catalogo NO PIDE TOKEN, y no puede pedirlo: la abre cualquier
   comprador al entrar a la tienda. Así que todo lo que salga por ahí es
   público, y hay que decidir a propósito qué sale.

   Las claves de pago no salen. La llave Bre-B en un archivo estático es una
   invitación a copiarla en una tienda falsa con el mismo aspecto; el comprador
   la recibe por la respuesta automática de WhatsApp, después de que el comercio
   confirma, que es donde hay una persona detrás. Es la misma razón por la que
   nunca estuvo en el repositorio.

   Se filtra por prefijo y no por lista: una clave `pago_algo` que alguien
   agregue mañana queda protegida sin que nadie se acuerde de venir aquí.

   EL TOPE SÍ TIENE QUE LLEGAR, Y NO POR UNA EXCEPCIÓN. El carrito necesita
   saber el tope por transferencia para bloquear a tiempo: enterarse al abrir
   WhatsApp, con el pedido ya armado, es enterarse tarde. Y el tope no es una
   credencial —son 1.000 UVB, una cifra que publica el Estado—.

   La primera versión de esto abría una excepción al prefijo. Mala idea: el
   filtro `pago_` está DOS VECES a propósito —aquí y al hornear el archivo
   estático— justamente para que un descuido en uno no baste, y una excepción
   hay que acordarse de repetirla en los dos. Un filtro con excepciones deja de
   ser una regla y pasa a ser una lista que alguien mantiene.

   Así que el prefijo sigue siendo absoluto y el tope SALE CON OTRO NOMBRE:
   `tope_pago`, que es como lo llama el plan. La clave de la hoja no se toca
   —se llama `pago_tope` desde la 2.4.0 y renombrarla rompería todas las
   tiendas, R2 del contrato— y lo que se publica es un campo nuevo, que es una
   adición y no un cambio. */
function configPublica(cfg) {
  var limpia = {};
  Object.keys(cfg).forEach(function (k) {
    if (k.indexOf('pago_') === 0) return;
    limpia[k] = cfg[k];
  });
  /* El tope, ya leído como número. La página no tiene por qué saber que en la
     hoja se puede escribir «$12.110.000». */
  var tope = cifraDeTexto(cfg.pago_tope, 'Configuración > pago_tope');
  limpia.tope_pago = tope === null ? 0 : tope;
  return limpia;
}

function conVersion(r) {
  r.version = VERSION;
  r.esquema = ESQUEMA;
  /* Cuándo se generó esto. Sirve para lo que hoy no se puede contestar: si una
     tienda está sirviendo datos de hace un rato o de hace una semana. */
  r.generado = new Date().toISOString();
  return r;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

/* ==========================================================================
   VALIDACIÓN  —  GET ?a=validar&items=chonto:2,salsa:1&cupon=X&envio=medellin
                      &total=<lo que calculó la página>&sellar=1
   ========================================================================== */
function doGet(e) {
  try {
    recordarMiUrl();
    var p = (e && e.parameter) ? e.parameter : {};
    if (p.a === 'version')   return json({ ok: true, version: VERSION });
    if (p.a === 'catalogo')  { contarLectura(); return json(conVersion(catalogoPublico())); }
    if (p.a === 'validar')   return json(conVersion(validarPedido(p)));
    if (p.a === 'registrar') return json(conVersion(registrarPedido(p)));
    if (p.a === 'menu')      return json(atenderMenu(p));
    if (p.a === 'panel')     return json(atenderPanel(p));
    if (p.a === 'identidad') return json(atenderIdentidad(p));
    if (p.a === 'bloques')   return json(atenderBloques(p));
    if (p.a === 'sembrar')   return json(atenderSembrar(p));
    if (p.a === 'fotos')     return json(atenderFotos(p));
    if (p.a === 'foto')      return json(atenderFoto(p));
    if (p.a) return json({ ok: false, error: 'Acción desconocida: ' + p.a, version: VERSION });
    return ContentService.createTextOutput(
      'Servicio activo. Versión ' + VERSION);
  } catch (err) {
    registrarError(err, null);
    return json({ ok: false, error: 'No pudimos validar en este momento.' });
  }
}

/* El stub que va dentro de la hoja del cliente, con dos huecos que el maestro
   rellena solo. Vive aquí y no en un archivo aparte por una razón práctica:
   así el menú del stub y el del maestro no se pueden desincronizar, porque
   salen del mismo sitio. */
var PLANTILLA_STUB = [
"/**",
" * CÓDIGO DE LA HOJA",
" * ---------------------------------------------------------------------------",
" * Lo genera el maestro. No se edita: si hace falta cambiarlo, se vuelve a",
" * generar y se pega encima.",
" *",
" * Aquí no hay reglas del negocio: ni precios, ni cupones, ni inventario. Solo",
" * dibuja el menú y le pregunta al maestro qué mostrar. Existe porque un menú",
" * necesita un onOpen que corra bajo la cuenta de quien abre la hoja, y eso es",
" * lo único que no se puede hacer desde afuera.",
" * ---------------------------------------------------------------------------",
" */",
"var MAESTRO = '{{MAESTRO}}';",
"var TOKEN   = '{{TOKEN}}';",
"/* El menú de la hoja se llama como el comercio. Sale de la pestaña",
"   Configuración cuando se genera este código, no del navegador: onOpen",
"   tiene que ser instantáneo. Si el comercio se cambia el nombre, hay que",
"   volver a generar el stub y pegarlo. */",
"var NEGOCIO = '{{NEGOCIO}}';",
"/* Va en cada petición: así el panel sabe qué hojas tienen el código al día",
"   sin que nadie tenga que abrirlas una por una. */",
"var STUB = '{{VERSION}}';",
"",
"/* Esta lista NO se escribe a mano: la genera el maestro a partir de la suya al",
"   producir este código. Escrita dos veces, una se queda atrás y la hoja acaba",
"   ofreciendo una opción que el maestro rechaza, o escondiendo una que existe. */",
"{{OPCIONES}}",
"",
"/* El menú se escribe aquí y no se le pide al maestro a propósito: onOpen tiene",
"   que ser instantáneo. Una petición de red al abrir la hoja se siente como una",
"   hoja lenta, y si el maestro estuviera caído no habría menú. */",
"function onOpen() {",
"  var menu = SpreadsheetApp.getUi().createMenu(NEGOCIO);",
"  OPCIONES.forEach(function (o, i) { menu.addItem(o.rotulo, 'accion' + i); });",
"  menu.addToUi();",
"}",
"",
"/* Una función por opción, porque addItem() pide el NOMBRE de una función y no",
"   acepta un cierre. También se generan. */",
"{{ACCIONES}}",
"",
"function porQueFalla(codigo) {",
"  return 'El servicio contestó una página web (' + codigo + ') en vez de datos.\\n\\n' +",
"    'Casi siempre es que la implementación quedó con acceso \"Solo yo\".\\n\\n' +",
"    'En el proyecto del maestro:\\n' +",
"    'Implementar > Gestionar implementaciones > lápiz >\\n' +",
"    'Quién tiene acceso: Cualquier persona > Implementar.\\n\\n' +",
"    'Para comprobarlo, abre esto en una ventana de incógnito:\\n' +",
"    MAESTRO + '?a=version';",
"}",
"",
"function pedir(i) {",
"  var ui = SpreadsheetApp.getUi();",
"  var libro = SpreadsheetApp.getActiveSpreadsheet();",
"  libro.toast('Un momento…', NEGOCIO, 30);",
"",
"  var r;",
"  try {",
"    var url = MAESTRO + '?a=menu&f=' + encodeURIComponent(OPCIONES[i].id) +",
"              '&t=' + encodeURIComponent(TOKEN) + '&s=' + encodeURIComponent(STUB);",
"    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });",
"    var cuerpo = res.getContentText().replace(/^\\s+/, '');",
"    /* Google devuelve una PÁGINA WEB, no datos, cuando la implementación no",
"       es pública. Sin esto el dueño ve un error de JavaScript sin sentido. */",
"    if (cuerpo.charAt(0) !== '{') throw new Error(porQueFalla(res.getResponseCode()));",
"    r = JSON.parse(cuerpo);",
"  } catch (e) {",
"    libro.toast('', NEGOCIO, 1);",
"    ui.alert('No se pudo hablar con el servicio.\\n\\n' + e.message);",
"    return;",
"  }",
"",
"  libro.toast('', NEGOCIO, 1);",
"  if (!r || !r.ok) { ui.alert(String((r && r.error) || 'No hubo respuesta.')); return; }",
"",
"  if (r.tipo === 'html') {",
"    ui.showModalDialog(",
"      HtmlService.createHtmlOutput(r.html).setWidth(760).setHeight(600),",
"      r.titulo || NEGOCIO);",
"  } else {",
"    ui.alert(String(r.texto || 'Listo.'));",
"  }",
"}"
].join('\n');

/* La URL de este propio despliegue. Es lo que permite que el maestro escriba
   el stub y el bloque de index.html ya completos, en vez de dejar huecos
   "PEGA_AQUÍ" que alguien tiene que rellenar sin equivocarse.

   AQUÍ HUBO UN ERROR CARO Y VALE LA PENA DEJARLO ESCRITO.
   getUrl() devuelve la /dev cuando se ejecuta desde el editor y la /exec
   cuando se ejecuta dentro de la aplicación web publicada. Durante un tiempo
   esto convertía una en otra cambiando el final: u.replace(/\/dev$/, '/exec').

   No funciona. Las dos URL llevan identificadores DISTINTOS —la /dev va con
   el del proyecto y la /exec con el de la implementación—, así que ese cambio
   fabrica una dirección que no existe. Y como terminaba en /exec, pasaba la
   comprobación de "ya está publicado" y se colaba al stub y al index. El
   síntoma era una página web de error en vez de datos, que es lo último que
   uno relaciona con esto.

   La solución no adivina: el maestro APRENDE su propia dirección. Cuando la
   aplicación web atiende una petición, se está ejecutando como aplicación
   web, y ahí getUrl() sí devuelve la /exec buena. Se guarda y se reutiliza.
   Basta con abrir la URL una vez —cosa que la lista de despliegue ya manda
   hacer para comprobar el acceso— para que quede aprendida. */
function miUrl() {
  try { return ScriptApp.getService().getUrl() || ''; }
  catch (e) { return ''; }
}

function recordarMiUrl() {
  try {
    var u = miUrl();
    if (!/\/exec$/.test(u)) return;                  // desde el editor: es la /dev
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty('URL_EXEC') !== u) props.setProperty('URL_EXEC', u);
  } catch (e) { /* aprender nunca puede tumbar una petición */ }
}

function urlLista() {
  var u = miUrl();
  if (/\/exec$/.test(u)) return u;                   // dentro de la aplicación web
  try {
    return PropertiesService.getScriptProperties().getProperty('URL_EXEC') || '';
  } catch (e) { return ''; }
}

/* El stub, ya completo. Se copia y se pega: no queda nada por llenar. */
function generarStub() {
  var url = urlLista();
  /* EL DEL MENÚ, NO EL DE MONTAJE. Ver tokenMenu(): lo que se pega en la hoja
     lo lee el comerciante en su editor, y de ahí sale a una captura o a un
     chat. Este solo abre ?a=menu. */
  var t = tokenMenu();
  var falta = !url;

  /* El nombre del comercio, para el menú. Si la hoja no se puede abrir o
     todavía no tiene nombre, el menú dice "Tienda": un rótulo neutro es
     preferible a quemar el nombre de otro comercio en la hoja de este. */
  var comoSeLlama = 'Tienda';
  try {
    var puesto = String(leerConfiguracion().negocio || '').trim();
    if (puesto) comoSeLlama = puesto;
  } catch (e) { }

  /* El menú del stub sale de la MISMA lista que valida el maestro. Antes eran
     dos copias escritas a mano —la de aquí y la de ACCIONES_MENU— y bastaba con
     tocar una para que la hoja ofreciera algo que el maestro rechaza. */
  var opciones = menuDeLaHoja();
  var anchoRotulo = 0;
  opciones.forEach(function (o) { anchoRotulo = Math.max(anchoRotulo, o.rotulo.length); });
  var lineasOpciones = ['var OPCIONES = ['].concat(opciones.map(function (o, i) {
    var relleno = new Array(anchoRotulo - o.rotulo.length + 1).join(' ');
    return "  { rotulo: '" + o.rotulo.replace(/'/g, "\\'") + "'," + relleno +
           " id: '" + o.id + "' }" + (i < opciones.length - 1 ? ',' : '');
  })).concat(['];']).join('\n');
  var lineasAcciones = opciones.map(function (o, i) {
    return 'function accion' + i + '() { pedir(' + i + '); }';
  }).join('\n');

  var codigo = PLANTILLA_STUB
    .replace('{{MAESTRO}}', url || 'TODAVÍA_NO_SE_SABE_LA_URL')
    .replace('{{TOKEN}}', t)
    .replace('{{VERSION}}', VERSION)
    .replace('{{NEGOCIO}}', comoSeLlama.replace(/'/g, "\\'"))
    .replace('{{OPCIONES}}', lineasOpciones)
    .replace('{{ACCIONES}}', lineasAcciones);

  var caja = 'width:100%;box-sizing:border-box;font:12px/1.5 Menlo,Consolas,monospace;' +
             'border:1px solid #D8D8D8;border-radius:6px;padding:10px;background:#FAFAFA;' +
             'resize:vertical;white-space:pre;overflow-x:auto';
  var nota = 'margin:0 0 10px;font:400 12px/1.55 Arial,sans-serif;color:#666';
  var boton = 'margin-top:8px;padding:8px 15px;border:1px solid #111;background:#111;color:#FFF;' +
              'border-radius:6px;font:600 12px Arial,sans-serif;cursor:pointer';

  var html =
    '<div style="font-family:Arial,sans-serif;padding:4px 6px 18px">' +
    (falta
      ? '<p style="' + nota + ';color:#B3261E"><b>Todavía no sé mi propia dirección.</b> ' +
        'Publica el proyecto (Implementar &gt; Aplicación web · Ejecutar como: Yo · ' +
        'Acceso: cualquier persona) y luego <b>abre esa URL una vez en el navegador</b>. ' +
        'Desde el editor Google solo me dice la dirección /dev, que no le sirve a nadie ' +
        'más. Después vuelve a generar el stub y saldrá completo.</p>'
      : '<p style="' + nota + ';color:#111;font-size:13px">Ya lleva la URL y el token. ' +
        '<b>No hay nada que llenar.</b></p>') +
    '<p style="' + nota + '">En la hoja del cliente: <b>Extensiones &gt; Apps Script</b>, ' +
    'borra lo que haya, pega esto y guarda. Recarga la hoja y aparece el menú.</p>' +
    '<textarea id="a" rows="20" style="' + caja + '" readonly>' + escaparHtml(codigo) + '</textarea>' +
    '<button style="' + boton + '" onclick="copiar()">Copiar el stub</button>' +
    '<script>function copiar(){var t=document.getElementById("a");t.select();' +
    't.setSelectionRange(0,999999);try{document.execCommand("copy");' +
    'var b=document.querySelector("button");b.textContent="Copiado";' +
    'setTimeout(function(){b.textContent="Copiar el stub";},1800);}catch(e){}}<\/script>' +
    '</div>';

  console.log(codigo);
  return { tipo: 'html', titulo: 'Código para pegar en la hoja', html: html, codigo: codigo };
}

/* La puerta del stub. Sin token no se abre, y solo deja pasar las acciones
   que estén en la lista blanca. */
/* ============================================================================
   LA PUERTA DEL PANEL
   ----------------------------------------------------------------------------
   Un tablero central que vigila muchas tiendas no puede entrar a la hoja de
   cada una: son cuentas de Google distintas, y compartir cada hoja con una
   cuenta administradora sería justo el acoplamiento que evitamos.

   En vez de eso, cada maestro publica un resumen de SU tienda por esta puerta
   y el panel lo pregunta. La tienda sigue siendo dueña de sus datos; lo único
   que sale son cifras agregadas, nunca un pedido ni un dato de un cliente.

   Va detrás del mismo token que el menú, por la misma razón: no es un secreto
   fuerte, es lo que impide que un tercero que adivine la URL se lleve las
   cifras de ventas de un negocio ajeno.
   ============================================================================ */
/* ============================================================================
   POR QUÉ 46 LÍNEAS SIGUEN VIVIENDO DENTRO DE LA HOJA
   ----------------------------------------------------------------------------
   Medido el 6 de septiembre de 2026, no supuesto.

   Todo lo que la hoja necesita lo hace este proyecto desde afuera, con
   disparadores instalables —alEditar, recalcularResumen, respaldoSemanal—, que
   corren con NUESTRA autorización y por eso sí pueden usar UrlFetchApp,
   MailApp y DriveApp. Quedaba una duda razonable: si un disparador instalable
   de apertura podía dibujarle el menú al comerciante, el stub sobraba.

   Se montó el experimento y dio esto:

     1. El menú SÍ le aparece al comerciante. Un disparador instalable de
        apertura le dibuja interfaz a otro usuario. La documentación de Google
        no lo dice en ninguna parte.
     2. Pero TOCAR una opción falla, con PERMISSION_DENIED.

   El mecanismo, que es lo que vale la pena recordar: un disparador instalable
   corre bajo nuestra cuenta, sí, pero eso vale para el manejador de apertura.
   Cuando el comerciante hace clic en una opción, esa función se invoca bajo
   SU cuenta, dentro de ESTE proyecto — que no es suyo y no puede leer. De ahí
   el error de permisos.

   Por eso los disparadores que nadie toca (alEditar, los de tiempo) funcionan
   perfecto desde aquí, y un menú no. La frontera no es la autorización: es de
   quién es el proyecto donde vive la función que se ejecuta.

   Conclusión: el stub se queda. Sus opciones llaman a funciones que viven en
   la hoja del comerciante —que sí es suya—, y esas funciones piden por HTTP.
   El precio son 46 líneas sin una sola regla de negocio y una autorización que
   el comerciante da una vez.

   Se conserva quitarMenuDePrueba() para desmontar el experimento en cualquier
   tienda donde se haya llegado a instalar.
   ============================================================================ */
function quitarMenuDePrueba() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'menuDePrueba') { ScriptApp.deleteTrigger(t); n++; }
  });
  console.log(n ? 'Quitado. Recarga la hoja.' : 'No había ninguno.');
}

/* ============================================================================
   EL RESPALDO SEMANAL
   ----------------------------------------------------------------------------
   La hoja ES la base de datos. El historial de versiones de Google salva de un
   borrado accidental, pero no de perder la cuenta, y como cada tienda vive en
   una cuenta distinta, perder una cuenta es perder una tienda entera.

   Se copia con makeCopy y no exportando el archivo. La diferencia no es de
   estilo: makeCopy lo resuelve Drive de su lado, sin pasar un solo byte por el
   script, así que tarda lo mismo con una hoja de cien filas que con una de cien
   mil y no gasta el presupuesto de ejecución. Exportar a XLSX obligaría a
   descargar y volver a subir el archivo entero cada semana.

   La copia la crea la cuenta de la tienda dentro de una carpeta del
   administrador, así que el administrador tiene que haberle dado permiso de
   edición sobre esa carpeta. Es un permiso sobre UNA carpeta de respaldos: no
   le abre nada más de su Drive.
   ============================================================================ */
var RESPALDOS_QUE_SE_GUARDAN = 8;      // dos meses de copias semanales

function respaldoSemanal() {
  try {
    var r = respaldarHoja();
    registrarRespaldo({ fecha: new Date().toISOString(), archivo: r.nombre,
                        borradas: r.borradas });
  } catch (err) {
    registrarRespaldo({ fecha: new Date().toISOString(), error: err.message });
    registrarError('respaldo: ' + err.message, null);
  }
}

function respaldarHoja() {
  var c = leerConfiguracion();
  var id = idDeCarpeta(c.respaldo_carpeta);
  if (!id) throw new Error(
    'Falta respaldo_carpeta en la pestaña Configuración: pega ahí el enlace de ' +
    'la carpeta de respaldos del administrador, y pídele que le dé permiso de ' +
    'edición a esta cuenta.');

  var destino;
  try { destino = DriveApp.getFolderById(id); }
  catch (e) { throw new Error(
    'No pude abrir la carpeta de respaldos. Casi siempre es que esta cuenta ' +
    'no tiene permiso de edición sobre ella. (' + id + ')'); }

  var libro = elLibro();
  var prefijo = 'Copia_de_' + libro.getName().replace(/[\/\\]/g, '-') + '_';
  var nombre = prefijo + diaDeHoy();

  var copia;
  try { copia = DriveApp.getFileById(HOJA_ID).makeCopy(nombre, destino); }
  catch (e) { throw new Error('No pude crear la copia: ' + e.message); }

  return { nombre: copia.getName(), id: copia.getId(),
           borradas: podarRespaldos(destino, prefijo, copia.getId()) };
}

/* Sin esto la carpeta del administrador crece para siempre. Se borran SOLO las
   copias de esta tienda —las demás llevan otro prefijo— y nunca la recién
   hecha, para que un reloj mal puesto no deje a la tienda sin ninguna. */
function podarRespaldos(destino, prefijo, idNueva) {
  var mias = [];
  var it = destino.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (f.getName().indexOf(prefijo) !== 0) continue;
    if (f.getId() === idNueva) continue;
    mias.push({ f: f, cuando: f.getDateCreated().getTime() });
  }
  mias.sort(function (a, b) { return b.cuando - a.cuando; });

  var borradas = 0;
  mias.slice(RESPALDOS_QUE_SE_GUARDAN - 1).forEach(function (x) {
    try { x.f.setTrashed(true); borradas++; } catch (e) { /* que siga */ }
  });
  return borradas;
}

function registrarRespaldo(dato) {
  PropertiesService.getScriptProperties().setProperty('RESPALDO', JSON.stringify(dato));
}

function ultimoRespaldo() {
  try { return JSON.parse(
    PropertiesService.getScriptProperties().getProperty('RESPALDO') || '{}'); }
  catch (e) { return {}; }
}

/* ============================================================================
   CUÁNTO SE USA ESTA TIENDA
   ----------------------------------------------------------------------------
   El límite que de verdad puede doler no se compra: son 30 ejecuciones
   simultáneas por cuenta de Google, y no sube con Workspace. Google tampoco
   lo expone: no hay forma de preguntar "cuántas van". Lo que sí se puede
   medir es la carga que lo empuja, que es cuántas veces se leyó el catálogo.

   Se cuenta en la caché, que es barata, y una vez por hora el disparador que
   ya existe lo pasa a una propiedad del proyecto. Contar directo en las
   propiedades sería una escritura por visitante; contar solo en la caché se
   perdería cada seis horas.

   El conteo se queda corto cuando dos visitantes caen en el mismo instante:
   es una señal de carga, no una auditoría, y así hay que leerla.
   ============================================================================ */
function contarLectura() {
  try {
    var c = CacheService.getScriptCache();
    var n = Number(c.get('lecturas') || 0) + 1;
    c.put('lecturas', String(n), 21600);
  } catch (e) { /* contar nunca puede tumbar una visita */ }
}

function consolidarLecturas() {
  var c = CacheService.getScriptCache();
  var nuevas = Number(c.get('lecturas') || 0);
  if (!nuevas) return;
  c.remove('lecturas');

  var props = PropertiesService.getScriptProperties();
  var hoy = diaDeHoy();
  var guardado = {};
  try { guardado = JSON.parse(props.getProperty('LECTURAS') || '{}'); } catch (e) {}
  if (guardado.dia !== hoy) {
    guardado = { dia: hoy, total: 0, pico: 0, ayer: guardado.total || 0 };
  }
  guardado.total = (guardado.total || 0) + nuevas;
  /* EL PICO, NO EL TOTAL, ES LO QUE ACERCA AL TECHO. El límite de Apps Script
     es de CONCURRENCIA —30 ejecuciones a la vez—, no de volumen: mil visitas
     repartidas en el día no son nada y cien en el mismo minuto sí. Esto corre
     una vez por hora, así que `nuevas` es exactamente lo que entró en la última
     hora, y el mayor de esos números es la señal que hay que mirar.
     Es la condición de disparo de DECISIONES.md 01, que sin esto no se podía
     observar. */
  guardado.pico = Math.max(guardado.pico || 0, nuevas);
  props.setProperty('LECTURAS', JSON.stringify(guardado));
}

function diaDeHoy() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
         '-' + ('0' + d.getDate()).slice(-2);
}

/* El mayor número de lecturas que entró en una sola hora, hoy. La hora en
   curso todavía no está consolidada, así que se cuenta aparte: si la campaña
   está ocurriendo AHORA, es justo cuando hay que verlo. */
function picoDeHoy() {
  var g = {};
  try { g = JSON.parse(PropertiesService.getScriptProperties()
    .getProperty('LECTURAS') || '{}'); } catch (e) {}
  var enCurso = 0;
  try { enCurso = Number(CacheService.getScriptCache().get('lecturas') || 0); } catch (e) {}
  var consolidado = (g.dia === diaDeHoy() ? (g.pico || 0) : 0);
  return Math.max(consolidado, enCurso);
}

function lecturasDeHoy() {
  var props = PropertiesService.getScriptProperties();
  var g = {};
  try { g = JSON.parse(props.getProperty('LECTURAS') || '{}'); } catch (e) {}
  var sinConsolidar = 0;
  try { sinConsolidar = Number(CacheService.getScriptCache().get('lecturas') || 0); } catch (e) {}
  return (g.dia === diaDeHoy() ? (g.total || 0) : 0) + sinConsolidar;
}

/* ============================================================================
   LA PUERTA DEL MONTAJE
   ----------------------------------------------------------------------------
   Lo mismo que muestra "Generar configuración para index.html", pero en JSON y
   sin envolver en HTML, para que el montaje lo aplique sin que nadie copie ni
   pegue. El menú sigue existiendo: es la salida manual cuando algo falla.
   ============================================================================ */
/* ScriptApp.getScriptId() no existe en runtimes viejos, y una tienda que no lo
   tenga no debe quedarse sin poder montar: se devuelve vacío y quien lo use
   pide el dato a mano. */
function idDeEsteProyecto() {
  try { return ScriptApp.getScriptId ? ScriptApp.getScriptId() : ''; }
  catch (e) { return ''; }
}

/* QUIÉN SOY, SIN TOCAR LA HOJA.
   Todas las demás puertas abren la hoja para contestar, así que un maestro que
   se quedó sin HOJA_ID no puede decir NADA de sí mismo — ni siquiera cuál era
   su hoja. Eso dejaba una dependencia circular: la herramienta que arregla el
   valor se lo preguntaba al maestro que lo perdió.

   Esta puerta contesta con lo que vive en el propio archivo y en las
   propiedades del proyecto, que no necesitan la hoja. Lo que sí la necesita va
   aparte y con su propio aviso, para que se pueda diagnosticar en vez de
   fallar entero. */
function atenderIdentidad(p) {
  if (String(p.t || '') !== token()) {
    return { ok: false, error: 'Token que no corresponde a esta tienda.' };
  }
  var r = { ok: true, version: VERSION, scriptId: idDeEsteProyecto(),
            hojaId: HOJA_ID, url: urlLista(), hojaOk: false };
  try {
    r.hoja = elLibro().getUrl();
    r.negocio = String(leerConfiguracion().negocio || '');
    r.hojaOk = true;

    /* AL FINAL, QUE ES DONDE VAN LOS CAMPOS NUEVOS (R1).
       QUÉ REPOSITORIO DICE ESTA HOJA QUE ES EL SUYO. Hasta ahora esta clave
       solo la miraba «Publicar ahora» para saber a quién disparar; el camino
       de vuelta no existía, y por eso un flujo no tenía forma de saber que
       estaba publicando la hoja de OTRO comercio en este repositorio.
       Pasó: dos tiendas montadas a la vez, y los cambios de una aparecieron
       en el sitio de la otra. El síntoma —«subí una foto y salió allá»— no
       apunta a ninguna parte, porque todas las piezas funcionan: cada una
       está haciendo bien su trabajo con la hoja equivocada.
       Con esto, el flujo compara contra su propio GITHUB_REPOSITORY y se
       planta antes de escribir nada. Vacío no bloquea: hay tiendas montadas
       antes de que esta clave existiera. */
    r.repositorio = String(leerConfiguracion().repositorio || '').trim();
  } catch (e) {
    r.problema = e.message;
  }
  return r;
}

function atenderBloques(p) {
  if (String(p.t || '') !== token()) {
    return { ok: false, error: 'Token que no corresponde a esta tienda.' };
  }
  try {
    var r = generarConfiguracion();
    var c = leerConfiguracion();
    return { ok: true, version: VERSION, head: r.bloque, valores: r.valores,
             /* Para que el montaje escriba solo sus propios archivos de
                configuración. El scriptId es el dato que hasta ahora había que
                sacar a mano de la barra de direcciones; el maestro se lo sabe. */
             scriptId: idDeEsteProyecto(),
             negocio: String(c.negocio || ''),
             hoja: elLibro().getUrl(),
             /* El único valor que se escribe a mano en este archivo, y por eso
                el único que se pierde al volver a subirlo desde el repositorio.
                Sale por aquí para que el montaje pueda devolverlo en su sitio. */
             hojaId: HOJA_ID,

             /* AL FINAL, QUE ES DONDE VAN LOS CAMPOS NUEVOS (R1). Lo he puesto
                en medio tres veces y las tres lo ha cazado la batería de
                esquema; el sitio correcto no se me queda, el guardián sí.

                Lo que le falta a esta tienda para estar terminada. El montaje lo
                usa para negarse a escribir el index de una tienda que no puede
                vender: hasta ahora miraba cinco claves y las otras once no las
                miraba nadie. */
             alta: revisarTienda(c) };
  } catch (err) {
    registrarError('bloques: ' + err.message, null);
    return { ok: false, error: err.message };
  }
}

/* ============================================================================
   SEMBRAR LA CONFIGURACIÓN DESDE EL MONTAJE
   ----------------------------------------------------------------------------
   La única puerta que ESCRIBE. Todas las demás leen, y eso era una propiedad
   del diseño que vale la pena no perder por descuido, así que aquí está lo que
   la acota:

   · Solo estas seis claves. Ni el catálogo, ni los precios, ni los pedidos, ni
     los datos legales, ni nada que no esté en SEMBRABLES.
   · Un valor vacío no borra nada. Sembrar es poner lo que falta, no vaciar.
   · No pisa lo que el comercio escribió. Solo escribe donde la celda está
     vacía o donde sigue el valor de fábrica. Para lo demás hay que pedirlo a
     propósito con forzar=si, y aun así queda dicho en la respuesta qué se
     cambió.

   POR QUÉ HACE FALTA. instalar() deja el nombre y el sitio entre corchetes y
   el WhatsApp vacío, a propósito: una tienda sin configurar tiene que verse sin
   configurar, no funcionar mandándole los pedidos a otro. Llenar esas celdas a
   mano era el paso más aburrido del despliegue y el más fácil de dejar a
   medias. Ahora lo hace el flujo de montaje con lo que el técnico escribió una
   sola vez al dispararlo.
   ========================================================================== */
var SEMBRABLES = ['negocio', 'whatsapp', 'sitio_url', 'fotos_origen',
                  'fotos_drive', 'respaldo_carpeta', 'correo_resumen',
                  'fotos_webp'];

function escribirConfiguracion(cambios) {
  var h = elLibro().getSheetByName(H_CONFIG);
  // filas() ya salta el encabezado, así que la fila i de aquí es la i+2 de la
  // hoja. Una clave que no exista en la pestaña no se crea: instalar() es
  // quien crea claves, y esta puerta solo rellena las que ya están.
  var datos = filas(H_CONFIG);
  var escritas = [];
  for (var i = 0; i < datos.length; i++) {
    var clave = String(datos[i][0]).trim();
    if (!cambios.hasOwnProperty(clave)) continue;
    h.getRange(i + 2, 2).setValue(cambios[clave]);
    escritas.push(clave);
  }
  return escritas;
}

function atenderSembrar(p) {
  if (String(p.t || '') !== token()) {
    return { ok: false, error: 'Token que no corresponde a esta tienda.' };
  }
  try {
    var c = leerConfiguracion();
    var forzar = String(p.forzar || '') === 'si';
    var pedido = {};

    SEMBRABLES.forEach(function (k) {
      var v = String(p[k] === undefined || p[k] === null ? '' : p[k]).trim();
      if (v) pedido[k] = v;
    });

    /* Las dos que se deducen y nadie debería tener que escribir: las fotos
       servibles viven en la carpeta /fotos del propio sitio, y si el montaje
       las va a convertir es porque van a existir en varios tamaños. */
    if (pedido.sitio_url && !pedido.fotos_origen) {
      pedido.fotos_origen = pedido.sitio_url.replace(/\/+$/, '') + '/fotos';
    }
    if (pedido.fotos_drive && !pedido.fotos_webp) pedido.fotos_webp = 'Sí';

    var cambios = {}, escritos = [], iguales = [], respetados = [];
    Object.keys(pedido).forEach(function (k) {
      var actual = String(c[k] === undefined ? '' : c[k]).trim();
      if (actual === pedido[k]) { iguales.push(k); return; }
      var sinTocar = !actual || actual === String(valorDeFabrica(k)).trim();
      if (!sinTocar && !forzar) { respetados.push(k); return; }
      cambios[k] = pedido[k];
    });

    if (Object.keys(cambios).length) escritos = escribirConfiguracion(cambios);

    var faltan = SEMBRABLES.filter(function (k) {
      if (k === 'fotos_webp' || k === 'correo_resumen') return false;
      var v = String(c[k] === undefined ? '' : c[k]).trim();
      if (cambios[k]) return false;
      return !v || v === String(valorDeFabrica(k)).trim();
    });

    return { ok: true, version: VERSION, escritos: escritos, iguales: iguales,
             respetados: respetados, faltan: faltan };
  } catch (err) {
    registrarError('sembrar: ' + err.message, null);
    return { ok: false, error: err.message };
  }
}

/* ============================================================================
   LAS FOTOS CRUDAS DEL COMERCIO
   ----------------------------------------------------------------------------
   Capa 1 -> capa 2. El comercio sube sus fotos a una carpeta de Drive y no
   hace nada más: no instala, no convierte, no sabe qué es un repositorio.

   Se listan por una puerta y se bajan de a una por otra. De a una a propósito:
   Apps Script corta cada ejecución a los seis minutos y una respuesta tiene
   techo de tamaño, así que veinte fotos en una sola respuesta es exactamente
   la forma de que falle el día que el comercio suba fotos grandes.
   ============================================================================ */
var FOTOS_ACEPTADAS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff'];

function carpetaDeFotos() {
  var c = leerConfiguracion();
  var id = idDeCarpeta(c.fotos_drive);
  if (!id) throw new Error(
    'Falta fotos_drive en la pestaña Configuración: pega ahí el enlace de la ' +
    'carpeta de Drive donde el comercio sube sus fotos.');
  try { return DriveApp.getFolderById(id); }
  catch (e) { throw new Error(
    'No pude abrir esa carpeta de Drive. Revisa que el identificador sea el ' +
    'de una carpeta y que esta cuenta tenga acceso. (' + id + ')'); }
}

/* Sirve tanto el identificador pelado como el enlace completo que copia
   cualquiera desde la barra del navegador. */
function idDeCarpeta(v) {
  var t = String(v || '').trim();
  if (!t) return '';
  var m = t.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  m = t.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{10,}$/.test(t) ? t : '';
}

function atenderFotos(p) {
  if (String(p.t || '') !== token()) {
    return { ok: false, error: 'Token que no corresponde a esta tienda.' };
  }
  try {
    var it = carpetaDeFotos().getFiles();
    var lista = [];
    while (it.hasNext()) {
      var f = it.next();
      if (FOTOS_ACEPTADAS.indexOf(f.getMimeType()) === -1) continue;
      lista.push({ id: f.getId(), nombre: f.getName(), bytes: f.getSize(),
                   modificado: f.getLastUpdated().toISOString() });
    }
    lista.sort(function (a, b) { return a.nombre < b.nombre ? -1 : 1; });
    /* Los nombres que el catálogo de verdad usa. Con esto el montaje puede
       avisar de los dos errores que comete siempre el comercio: subir una foto
       que ningún producto nombra, y nombrar en la hoja una foto que nunca
       subió. Los dos fallan en silencio: la tienda no se rompe, la foto
       simplemente no aparece. */
    return { ok: true, version: VERSION, archivos: lista,
             usadas: fotosQueUsaElCatalogo() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function fotosQueUsaElCatalogo() {
  var vistas = {}, salida = [];
  filas(H_CATALOGO).forEach(function (f) {
    if (!String(f[0]).trim()) return;
    String(f[7] || '').split('|').forEach(function (n) {
      var limpio = n.trim();
      // Una URL completa no sale de la carpeta de Drive: no aplica.
      if (!limpio || /^https?:\/\//i.test(limpio) || vistas[limpio]) return;
      vistas[limpio] = true;
      salida.push(limpio);
    });
  });
  return salida.sort();
}

var FOTO_MAXIMA = 8 * 1024 * 1024;

function atenderFoto(p) {
  if (String(p.t || '') !== token()) {
    return { ok: false, error: 'Token que no corresponde a esta tienda.' };
  }
  try {
    var f = DriveApp.getFileById(String(p.id || ''));
    /* Que el archivo esté en LA carpeta configurada, no en cualquier parte del
       Drive. Sin esto, quien tenga el token podría pedir cualquier archivo al
       que esta cuenta tenga acceso, con solo adivinar su identificador. */
    if (!estaEnLaCarpeta(f)) {
      return { ok: false, error: 'Ese archivo no está en la carpeta de fotos.' };
    }
    if (FOTOS_ACEPTADAS.indexOf(f.getMimeType()) === -1) {
      return { ok: false, error: 'Eso no es una imagen: ' + f.getMimeType() };
    }
    if (f.getSize() > FOTO_MAXIMA) {
      return { ok: false, error: 'La foto pesa ' + Math.round(f.getSize() / 1048576) +
        ' MB y el tope son 8 MB. Pídele al comercio una versión más liviana.' };
    }
    return { ok: true, nombre: f.getName(), tipo: f.getMimeType(),
             bytes: f.getSize(),
             contenido: Utilities.base64Encode(f.getBlob().getBytes()) };
  } catch (err) {
    return { ok: false, error: 'No pude leer esa foto: ' + err.message };
  }
}

function estaEnLaCarpeta(archivo) {
  var buscada = carpetaDeFotos().getId();
  var padres = archivo.getParents();
  while (padres.hasNext()) {
    if (padres.next().getId() === buscada) return true;
  }
  return false;
}

function atenderPanel(p) {
  if (String(p.t || '') !== token()) {
    return { ok: false, error: 'Token que no corresponde a esta tienda.' };
  }
  try { return resumenParaPanel(); }
  catch (err) {
    registrarError('panel: ' + err.message, null);
    return { ok: false, error: err.message };
  }
}

function resumenParaPanel() {
  var m = calcularMetricas();
  var c = m.cfg || {};
  var catalogo = filas(H_CATALOGO).filter(function (f) { return String(f[0]).trim(); });
  var publicados = catalogo.filter(function (f) { return esSi(f[9]); }).length;

  return {
    ok: true,
    version: VERSION,
    negocio: String(c.negocio || ''),
    sitio: String(c.sitio_url || ''),
    whatsapp: String(c.whatsapp || ''),
    correo: String(c.correo_resumen || ''),
    hoja: m.url,

    productos: catalogo.length,
    publicados: publicados,
    agotados: m.agotados,
    pocos: m.pocos,

    // Del mes en curso, y el mismo tramo del mes pasado: comparar un mes a
    // medias contra uno completo no dice nada.
    ventasMes: m.A.ventas,
    ventasMesAnterior: m.Bhasta.ventas,
    pedidosMes: m.A.confirmados,
    ticket: m.A.ticket,
    tasaCierre: m.A.tasaCierre,

    // Lo que empuja el techo de 30 ejecuciones simultáneas. El techo no se
    // puede consultar; esto sí, y es la señal que avisa antes de llegar.
    lecturasHoy: lecturasDeHoy(),
    picoHora: picoDeHoy(),
    cuotaCorreo: cuotaDeCorreo(),
    respaldo: ultimoRespaldo(),

    ventasAyer: m.ayer.ventas,
    pedidosAyer: m.ayer.enviados,
    porConfirmar: m.porConfirmar,
    atrasados: m.viejos,
    errores: m.errores,

    // Para el gráfico del panel, sin nombres de producto ni de cliente.
    meses: m.meses.map(function (x) { return [x.etiqueta, x.ventas]; }),
    consultado: new Date().toISOString(),

    /* AL FINAL, Y NO EN MEDIO. Es la regla R1 del contrato, y la escribí mal
       otra vez: puse estos dos campos antes de `meses` y la batería de esquema
       lo cazó, igual que cazó la clave `repositorio` hace unos días. Dos veces
       el mismo error en la misma semana dice que la regla no basta con saberla.

       SI A ESTA HOJA LE FALTA REPEGAR EL STUB, y desde cuándo. Son las dos
       únicas cosas del panel que no se pueden deducir mirando la tienda: viven
       dentro del proyecto de la hoja y solo el maestro las ve.

       `stub` es la versión que declara el código pegado en la hoja; «antiguo»
       quiere decir que ni siquiera la declara, y `''` que nadie ha abierto el
       menú desde que se instaló este maestro. `tokenViejo` es la marca que deja
       una hoja cuando entra con el token de montaje: mientras exista, esa
       tienda no ha terminado la migración y rotarToken() se niega a correr. */
    stub: estadoDelStub(),
    tokenViejo: marcaDelTokenViejo(),

    /* Los pedidos que estuvieron perdidos y se recuperaron. En el panel importa
       más que en la hoja: un comercio ve el suyo, el operador ve si es una
       tienda o son todas —y si son todas, el problema no es de ninguna. */
    rescates: rescates(),

    /* QUÉ LE FALTA A ESTA TIENDA PARA ESTAR TERMINADA. Van las CLAVES, no los
       valores: el panel necesita saber qué falta, no qué dice. Mandar los
       valores sería mandar la llave de pago de cada comercio a una hoja donde
       no pinta nada. */
    alta: (function () {
      var a = revisarTienda();
      return { bloquean: a.bloquean.map(function (x) { return x.clave; }),
               avisan:   a.avisan.map(function (x) { return x.clave; }) };
    })()
  };
}

/* Las dos lecturas de arriba, en funciones propias porque las usa también el
   diagnóstico y tenerlas dos veces es cómo empiezan a decir cosas distintas. */
function estadoDelStub() {
  try { return PropertiesService.getScriptProperties()
                 .getProperty('STUB_VISTO') || ''; } catch (e) { return ''; }
}

function marcaDelTokenViejo() {
  try { return PropertiesService.getScriptProperties()
                 .getProperty('STUB_CON_TOKEN_VIEJO') || ''; } catch (e) { return ''; }
}

/* CONVIVENCIA, Y POR CUÁNTO TIEMPO.
   El stub que ya está pegado en cada hoja lleva el token de montaje: si esta
   puerta dejara de aceptarlo de golpe, el menú de todas las tiendas montadas
   se apagaría el día del despliegue. Así que acepta los dos —el del menú, que
   es el bueno, y el de montaje, que es el que hay que jubilar— y DEJA CONSTANCIA
   cada vez que llega el viejo.

   Esa constancia es lo que hace que la migración se pueda terminar: el
   diagnóstico la lee y dice que a esa hoja le falta pegar el stub nuevo, y
   `rotarToken()` se niega a correr mientras alguna tienda siga usándolo. Sin
   medirlo, «acepta los dos» se queda para siempre, que es como una convivencia
   temporal se vuelve la arquitectura. */
function atenderMenu(p) {
  /* DE QUÉ VERSIÓN ES EL STUB QUE ESTÁ PEGADO EN LA HOJA, medido y no supuesto.
     Desde aquí no se puede leer el código de la hoja, pero el stub dice de qué
     versión es en cada petición. Un stub anterior a la 2.7.1 no manda nada, y
     esa ausencia también es un dato: se anota como «antiguo».

     Esto es lo que permite que el panel conteste «¿en qué tiendas falta
     repegar el stub?» sin abrirlas una por una — que con ocho tiendas es la
     diferencia entre saberlo y acordarse. */
  try {
    PropertiesService.getScriptProperties()
      .setProperty('STUB_VISTO', String(p.s || 'antiguo').slice(0, 20));
  } catch (e) { }

  var t = String(p.t || '');
  if (t && t === token() && t !== tokenMenu()) {
    try {
      PropertiesService.getScriptProperties()
        .setProperty('STUB_CON_TOKEN_VIEJO', new Date().toISOString());
    } catch (e) { }
  } else if (t !== tokenMenu()) {
    return { ok: false, error:
      'Este stub no corresponde a esta tienda. Vuelve a generarlo: ejecuta ' +
      'generarStub() en el maestro y pega el código que imprime.' };
  }
  if (!p.f) return { ok: true, menu: menuDeLaHoja() };
  try {
    var r = ejecutarAccion(p.f);
    r.ok = true;
    return r;
  } catch (err) {
    registrarError('menú ' + p.f + ': ' + err.message, null);
    return { ok: false, error: 'Falló "' + p.f + '": ' + err.message };
  }
}

/* Columnas de la hoja Catálogo:
   0 ID · 1 Nombre · 2 Formato · 3 Categoría · 4 Precio · 5 Stock
   6 Descripción · 7 Imágenes (separadas por |) · 8 Destacado · 9 Activo   */
/* ==========================================================================
   CONFIGURACIÓN DE LA TIENDA
   --------------------------------------------------------------------------
   Todo lo que cambia de un negocio a otro y PUEDE cambiar en caliente vive en
   la pestaña Configuración: nombre, textos de portada, colores, datos legales.
   La tienda lo pide junto con el catálogo, así que no cuesta ni una petición
   más.

   Lo único que NO puede vivir aquí es el <title>, la descripción y las
   etiquetas Open Graph: los rastreadores de WhatsApp, Facebook y Google no
   ejecutan JavaScript, así que esas tienen que ser HTML estático. Para eso
   está generarConfiguracion(), que imprime ese bloque listo para pegar.
   ========================================================================== */
/* ============================================================================
   LOS VALORES DE FÁBRICA DE LA PESTAÑA CONFIGURACIÓN
   ----------------------------------------------------------------------------
   Estaban dentro de instalar(), que era el único que los usaba. Salieron aquí
   porque ahora hay un segundo interesado: la puerta que siembra la
   configuración desde el montaje necesita saber qué valor NO ha tocado nadie.

   Y lo que hay aquí dentro no es inocente. Durante un tiempo esta semilla
   trajo el nombre, el celular y la dirección del sitio de la PRIMERA tienda, y
   cualquier tienda nueva que no los cambiara le mandaba los pedidos a ese
   celular. Ahora lo que va aquí son corchetes y celdas vacías: una tienda sin
   configurar se ve sin configurar. El celular, en particular, se queda vacío;
   un número de fábrica es el peor valor posible porque funciona.
   ========================================================================== */
function semillaDeConfiguracion() {
  return [
      ['negocio',           '[NOMBRE DEL COMERCIO]', 'El nombre que se ve en toda la tienda, y también el del menú de esta hoja'],
      ['whatsapp',          '', '57 + el celular, sin + ni espacios. VACÍO A PROPÓSITO: un número de fábrica manda los pedidos al teléfono de otro'],
      ['logo',              '', 'URL de Cloudinary con el logo. Vacío = se usa el signo por defecto con los colores de la marca'],
      ['portada_titulo',    '[EL TITULAR DE TU PORTADA]', 'El titular grande de la portada'],
      ['portada_texto',     '[Dos líneas contando qué vendes y qué te hace distinto.]', 'El párrafo debajo del titular'],
      ['portada_puntos',    'Producto de la semana|Entregas a todo el país|Pides y confirmas por WhatsApp', 'Las leyendas del banner, separadas por |'],
      ['color_principal',   '#D0211C', 'Portada, precios y acentos fuertes. PINTA la celda de al lado con el color que quieras y el código sale solo'],
      ['color_secundario',  '#1B5E3A', 'WhatsApp, "Disponible" y el tablero. También se puede pintar la celda'],
      ['color_alterno',     '#14472B', 'El tercer color: la etiqueta de "Destacado" y los detalles. También se puede pintar la celda'],
      ['pie_descripcion',   '[Una línea con qué vendes y desde dónde.]', 'El texto del pie'],
      ['como_compras',      'Armas tu carrito aquí|Confirmas por WhatsApp|Pagas como acordemos por el chat|Recibes en 24 a 72 horas', 'Los pasos del pie, separados por |'],
      ['empresa_razon',     '[RAZÓN SOCIAL]', 'Para los textos legales. Entre corchetes = todavía no lo tengo, y no se muestra'],
      ['empresa_nit',       '[NIT O CÉDULA]', 'Igual: entre corchetes se omite'],
      ['empresa_correo',    '[CORREO DE CONTACTO]', 'Correo para temas de datos personales'],
      ['empresa_direccion', '[DIRECCIÓN]', 'Dirección física'],
      ['empresa_ciudad',    '[CIUDAD]', 'Municipio y departamento'],
      ['empresa_tel',       '[TELÉFONO]', 'El celular como se muestra, con espacios'],
      ['legal_actualizado', '[FECHA]', 'Fecha al pie de los textos legales'],
      ['sitio_url',         '', 'La dirección de ESTA tienda en Cloudflare. Vacío a propósito: es distinta en cada una'],
      ['sitio_titulo',      '[TÍTULO PARA GOOGLE Y WHATSAPP]', 'Lo que se ve en el buscador y en el enlace que se comparte'],
      ['sitio_descripcion', '[Dos líneas para el buscador y para el enlace que se comparte.]', 'Lo mismo, en párrafo'],
      ['correo_resumen',    '', 'A QUIÉN le llega el resumen diario. Escribe aquí tu correo. Varios, separados por coma. Vacío = no se manda nada'],
      ['correo_hora',       '7', 'A qué hora sale, de 0 a 23. Sale en la primera revisión de esa hora en adelante'],
      ['correo_siempre',    'No', 'No = solo llega cuando hay algo que atender o hubo ventas. Sí = llega todos los días'],
      ['correo_ultimo',     '', 'Lo escribe el script: la fecha del último resumen que salió. No lo edites'],
      ['fotos_origen',      '', 'DÓNDE están las fotos servibles. Normalmente la carpeta /fotos de tu propio sitio: https://tutienda.workers.dev/fotos . Vacío = se usa la dirección del sitio + /fotos'],
      ['fotos_cdn',         '', 'CÓMO se transforman. Vacío = se sirven tal cual. Cloudflare (mismo dominio, no toca la política de seguridad): https://TUDOMINIO/cdn-cgi/image/format=auto,quality=82,width={ancho},fit=cover/fotos/{ruta} — ImageKit: https://ik.imagekit.io/tucuenta/{ruta}?tr=w-{ancho},q-auto,f-auto'],
      ['respaldo_carpeta',  '', 'La carpeta de Drive del administrador donde cae la copia semanal de esta hoja. Pega el enlace de la carpeta. Vacío = no se respalda nada'],
      ['fotos_drive',       '', 'La carpeta de Drive donde el comercio sube sus fotos CRUDAS. Pega el enlace de la carpeta o solo su identificador. Vacío = el montaje no baja fotos'],
      ['fotos_webp',        'No', 'Sí = las fotos se prepararon con preparar-fotos.mjs y existen en varios tamaños (chonto-1-600.webp). Recupera el formato moderno cuando NO hay proveedor de transformación. Si no se generaron, la tienda vuelve sola al archivo original'],
      ['favicon',           '', 'El iconito de la pestaña del navegador. Vacío = se dibuja un tomate con los colores de la marca. Si quieres el tuyo, pon aquí una URL de Cloudinary (cuadrada, 512x512)'],

      /* EL PAGO. Estas claves NO viajan a la página: el comprador recibe los
         datos de pago por la respuesta automática de WhatsApp, después de que
         el comercio confirma. Poner una llave de cobro en un archivo público es
         invitar a que la copien en una tienda falsa. Viven aquí para que el
         comercio las tenga en un solo sitio y las pegue donde toca. */
      ['pago_llave',        '', 'Tu llave Bre-B o el número de la cuenta. NO se publica en la página: va en la respuesta automática de WhatsApp'],
      ['pago_titular',      '', 'A nombre de quién está la cuenta, como lo verá el comprador al transferir'],
      ['pago_entidad',      '', 'Banco o billetera: Bancolombia, Nequi, Daviplata…'],
      ['pago_texto',        '', 'El mensaje de pago que le mandas al comprador. Vacío = se arma con las tres claves de arriba'],
      /* El tope de Bre-B se reindexa cada diciembre —1.000 UVB, y la UVB la fija
         el Ministerio de Hacienda por resolución—, así que no puede vivir en el
         código: sería una cifra que caduca sola cada año. */
      ['pago_tope',         '12110000', 'Tope por transferencia Bre-B: 1.000 UVB. En 2026 la UVB vale $12.110. SE REINDEXA CADA DICIEMBRE. El banco del comprador puede tener un tope menor'],

      ['envio_gratis_desde','', 'Desde qué monto el envío va sin costo. Vacío = nunca'],
      ['horario',           '', 'Cuándo atiendes, en una línea: «Lunes a sábado, 8am a 6pm». Se muestra al comprador para que sepa cuándo le responden'],

      /* AL FINAL, y no donde quedaba bonito. La puse junto a envio_gratis_desde
         porque agrupaba mejor, y la batería del esquema se plantó: «CAMBIÓ lo
         que ya existía». Tenía razón — escribirConfiguracion() ubica la fila por
         POSICIÓN para no pisar lo que el comerciante puso, así que meter una
         clave en medio le corre todos los valores de ahí para abajo. R1 del
         contrato no es una preferencia de estilo. */
      ['repositorio',       '', 'Dónde vive el sitio, como dueño/repositorio. Ej.: laboratoriodigital/organico. Lo usa «Publicar ahora»']
  ];
}

function valorDeFabrica(clave) {
  var f = semillaDeConfiguracion();
  for (var i = 0; i < f.length; i++) if (f[i][0] === clave) return String(f[i][1]);
  return '';
}

function leerConfiguracion() {
  var mapa = {};
  filas(H_CONFIG).forEach(function (f) {
    var clave = String(f[0]).trim();
    if (clave) mapa[clave] = String(f[1] === undefined || f[1] === null ? '' : f[1]);
  });
  return mapa;
}

function leerCatalogo() {
  var mapa = {};
  filas(H_CATALOGO).forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (!id || !esSi(f[9])) return;
    var fila = i + 2;                                  // filas() ya saltó el encabezado
    var precio = cifra(f[4], 'Catálogo E' + fila + ' (Precio de ' + id + ')');
    var stock  = cifra(f[5], 'Catálogo F' + fila + ' (Stock de ' + id + ')');
    var antes  = cifra(f[11], 'Catálogo L' + fila + ' (Precio antes de ' + id + ')');
    var umbral = cifra(f[12], 'Catálogo M' + fila + ' (Umbral bajo de ' + id + ')');
    /* Un precio ilegible NO es un producto gratis: es un producto que no se
       puede vender hasta que alguien arregle la celda. Se cae del catálogo,
       igual que si estuviera marcado como no activo. */
    if (precio === null) return;
    mapa[id] = { id: id, nombre: String(f[1]), precio: precio,
                 stock: stock === null ? 0 : Math.max(0, stock),
                 referencia: String(f[10] || '').trim(),
                 /* Un precio tachado solo tiene sentido si es MAYOR que el de
                    hoy. Si no, es un error de captura y se ignora: mostrar un
                    «antes» más barato es peor que no mostrar nada. */
                 precioAntes: (antes && antes > precio) ? antes : 0,
                 umbralBajo: (umbral && umbral > 0) ? Math.floor(umbral) : 0 };
  });
  return mapa;
}

function leerEnvios() {
  var mapa = {};
  filas(H_ENVIOS).forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (!id) return;
    var valor = cifra(f[2], 'Envíos C' + (i + 2) + ' (Valor de ' + id + ')');
    mapa[id] = { id: id, nombre: String(f[1]), valor: valor, ilegible: valor === null };
  });
  return mapa;
}

/** Busca el cupón y decide si aplica. Devuelve siempre un texto para el cliente. */
function revisarCupon(codigo, subtotal) {
  if (!codigo) return { ok: false, codigo: '', texto: '' };

  /* El NÚMERO de fila se guarda junto con la fila. Sin él, una cifra ilegible
     en un cupón se reportaba como «Cupones F», y en la hoja hay una columna F
     por cada cupón: quien la busca tiene que revisarlas todas. Con fila y
     columna, el comerciante abre la celda exacta. */
  var fila = null, filaN = 0;
  filas(H_CUPONES).forEach(function (f, i) {
    if (String(f[0]).trim().toUpperCase() === codigo) { fila = f; filaN = i + 2; }
  });
  // Código | Tipo | Valor | Mínimo | Vence | Usos máximos | Usos confirmados | Activo
  if (!fila || !esSi(fila[7]))
    return { ok: false, codigo: codigo, texto: 'Ese código no existe o ya no está activo.' };

  var vence = fila[4] ? new Date(fila[4]) : null;
  if (vence && !isNaN(vence.getTime())) {
    vence.setHours(23, 59, 59);
    if (vence < new Date())
      return { ok: false, codigo: codigo, texto: 'Este cupón ya venció.' };
  }

  /* Una cifra ilegible en un cupón se resuelve NO aplicándolo. Al revés
     —aplicarlo con 0— el cupón se vuelve más generoso de lo que su dueño quiso:
     sin mínimo, y sin tope de usos, porque 0 usos máximos significa SIN TOPE. */
  var maximos = cifra(fila[5], 'Cupones F' + filaN + ' (Usos máximos de ' + codigo + ')');
  var usados  = cifra(fila[6], 'Cupones G' + filaN + ' (Usos confirmados de ' + codigo + ')');
  var minimo  = cifra(fila[3], 'Cupones D' + filaN + ' (Mínimo de ' + codigo + ')');
  var valor   = cifra(fila[2], 'Cupones C' + filaN + ' (Valor de ' + codigo + ')');
  if (maximos === null || usados === null || minimo === null || valor === null)
    return { ok: false, codigo: codigo,
             texto: 'Este cupón tiene un dato que no pudimos leer. Te confirmamos por WhatsApp.' };

  if (maximos > 0 && usados >= maximos)
    return { ok: false, codigo: codigo, texto: 'Este cupón ya se agotó.' };

  if (subtotal < minimo)
    return { ok: false, codigo: codigo,
             texto: 'Aplica desde ' + pesos(minimo) + '. Te faltan ' + pesos(minimo - subtotal) + '.' };

  var tipo  = String(fila[1]).trim().toLowerCase();
  var texto = tipo === 'envio'
    ? 'Cupón aplicado: envío sin costo.'
    : 'Cupón aplicado: ' + (tipo === 'porcentaje' ? valor + '% de descuento' : pesos(valor) + ' menos') + '.';

  return { ok: true, codigo: codigo, tipo: tipo, valor: valor, texto: texto };
}

function validarPedido(p) {
  CELDAS_ILEGIBLES = [];               // se llena mientras se leen las hojas
  var catalogo = leerCatalogo();
  var envios   = leerEnvios();
  var avisos   = [];

  // --- líneas del pedido, con los precios de la hoja ---
  var crudo = String(p.items || '').slice(0, 600).split(',');
  if (crudo.length > MAX_ITEMS) return { ok: false, error: 'Demasiadas líneas.' };

  var vistos = {}, items = [], sub = 0;
  crudo.forEach(function (par) {
    var t = par.split(':');
    var id = String(t[0] || '').trim();
    var prod = catalogo[id];
    if (!prod || vistos[id]) return;
    vistos[id] = true;
    var cant = numeroSeguro(t[1], MAX_CANTIDAD);
    if (cant < 1) return;
    if (cant > prod.stock) {
      avisos.push('De ' + prod.nombre + ' solo quedan ' + prod.stock + '.');
      cant = prod.stock;
    }
    if (cant < 1) return;
    items.push({ id: id, nombre: prod.nombre, cantidad: cant, precio: prod.precio });
    sub += cant * prod.precio;
  });
  if (!items.length) return { ok: false, error: 'No hay productos válidos en el pedido.' };

  // --- envío ---
  /* El id distingue mayúsculas —'MEDELLIN' no es 'medellin'— y eso es una
     trampa fácil de pisar cuando alguien edita la hoja Envíos a mano. Se busca
     primero exacto y después sin distinguir, y si hace falta el segundo intento
     se avisa: funcionar no es lo mismo que estar bien escrito. */
  var idEnvio = String(p.envio || '').trim();
  var env = envios[idEnvio];
  if (!env && idEnvio) {
    var claves = Object.keys(envios);
    for (var k = 0; k < claves.length; k++) {
      if (claves[k].toLowerCase() === idEnvio.toLowerCase()) {
        env = envios[claves[k]];
        /* Al comprador no le sirve saber esto: para él funcionó. Al comerciante
           sí, porque su hoja tiene el ID escrito distinto que su tienda y el día
           que alguien quite este rescate, deja de funcionar. */
        anotarError('Un ID de envío no coincide en mayúsculas',
                    'La tienda pidió "' + idEnvio + '" y la hoja Envíos dice "' +
                    claves[k] + '". Funciona por ahora, pero conviene igualarlos.');
        break;
      }
    }
  }
  if (!env) {
    /* Pasa si la hoja Envíos cambió y el cliente tiene la página vieja abierta,
       o si no llegó ningún envío. El segundo caso callaba: `if (idEnvio)` solo
       avisaba cuando el id existía pero no se reconocía, así que «no llegó
       ningún envío» —el caso peor— era el único que pasaba en silencio. */
    env = { id: '', nombre: 'Por confirmar', valor: 0 };
    avisos.push(idEnvio
      ? 'El envío que elegiste ya no está disponible; te confirmamos el costo por WhatsApp.'
      : 'No recibimos la zona de envío; te confirmamos el costo por WhatsApp.');
  }
  if (env.ilegible) {
    avisos.push('El costo de envío de ' + env.nombre +
                ' no se pudo leer en la hoja; te lo confirmamos por WhatsApp.');
    env = { id: env.id, nombre: env.nombre, valor: 0 };
  }
  var valorEnvio = env.valor;

  /* Envío gratis por monto. La decide la hoja, no la página: si la página
     pudiera decidirlo, bastaría con abrir la consola para regalarse el envío.
     Va después del envío y antes del cupón porque un cupón de envío gratis
     sobre un envío ya gratis no tiene nada que descontar. */
  var desde = cifraDeTexto(leerConfiguracion().envio_gratis_desde,
                           'Configuración · envio_gratis_desde');
  if (desde !== null && desde > 0 && sub >= desde && valorEnvio > 0) {
    valorEnvio = 0;
    avisos.push('Tu compra pasa de ' + pesos(desde) + ': el envío va sin costo.');
  }

  // --- cupón ---
  var cupon = revisarCupon(String(p.cupon || '').trim().toUpperCase(), sub);
  var descuento = 0;
  if (cupon.ok) {
    if (cupon.tipo === 'porcentaje') descuento = Math.round(sub * cupon.valor / 100);
    if (cupon.tipo === 'fijo')       descuento = Math.min(cupon.valor, sub);
    if (cupon.tipo === 'envio')      valorEnvio = 0;
  }

  var total = Math.max(0, sub - descuento + valorEnvio);

  /* Que una celda no se pueda leer no puede quedarse solo en el registro: el
     comprador ve un total y el comerciante no se entera de nada. Sale por los
     dos lados —un aviso arriba, una fila en Errores— y de ahí al acta. */
  if (CELDAS_ILEGIBLES.length) {
    avisos.push('Hay ' + CELDAS_ILEGIBLES.length +
                (CELDAS_ILEGIBLES.length === 1 ? ' dato' : ' datos') +
                ' de la tienda sin leer; confirmamos el total por WhatsApp.');
    anotarError('Celdas que no se pudieron leer como número',
                CELDAS_ILEGIBLES.join(' · '));
  }

  var respuesta = {
    ok: true, sub: sub, descuento: descuento, envio: valorEnvio, total: total,
    envioNombre: env.nombre, cupon: cupon, avisos: avisos, items: items,
    ilegibles: CELDAS_ILEGIBLES.slice(0)
  };

  if (String(p.sellar) === '1') {
    respuesta.ref = sellar(p, items, respuesta);
  }
  return respuesta;
}

/** Escribe la fila de Validaciones y devuelve la referencia.
 *  Si el mismo pedido ya se selló hace poco, reutiliza la referencia en vez de
 *  llenar la hoja de filas repetidas mientras el cliente juega con el carrito. */
/* UNA fila por pedido, que se va actualizando.
   Antes se agregaba una fila por cada estado del carrito, así que agregar tres
   unidades de a una dejaba tres filas, cada una con su código. Y cuando dos
   peticiones idénticas llegaban a la vez —cosa normal con los reintentos de
   móvil— ambas se creían la primera y escribían dos filas distintas.

   Ahora la referencia ES el número del pedido, que lo fija la tienda y no
   cambia, y buscamos esa fila antes de escribir. El candado serializa el
   buscar-y-escribir, que es lo que las carreras rompían. */
function sellar(p, items, r, autorizada) {
  var codigo = celdaSegura(p.pedido).slice(0, 12) || aleatorio(5);

  /* Comparamos SUBTOTALES, no totales. El subtotal es lo único que calculan los
     dos lados con los mismos insumos (precio por cantidad); el descuento y el
     envío los pone solo la hoja. Si no coinciden, o el cliente tocó los precios
     desde la consola, o la hoja Catálogo se desincronizó de index.html. */
  var subPagina = numeroSeguro(p.sub, MAX_TOTAL);

  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (e) { return codigo; }
  try {
    var h = hoja(H_VALIDACIONES, ENCABEZADO_VALIDACIONES);
    asegurarColumnas(H_VALIDACIONES, ENCABEZADO_VALIDACIONES);
    var ultima = h.getLastRow();
    var encontrada = 0;
    if (ultima >= 2) {
      var desde = Math.max(2, ultima - 300);
      var codigos = h.getRange(desde, 2, ultima - desde + 1, 1).getValues();
      for (var i = codigos.length - 1; i >= 0; i--) {
        if (String(codigos[i][0]).trim() === codigo) { encontrada = desde + i; break; }
      }
    }

    /* El registro no manda `sub` en las páginas anteriores a esta versión, y
       poner 0 borraría el subtotal que la validación sí había guardado. R3 del
       contrato: un campo nuevo es opcional, y lo viejo tiene que seguir
       funcionando. Así que si no viene, se conserva el que ya estaba. */
    if (!subPagina && encontrada) {
      subPagina = numeroSeguro(h.getRange(encontrada, 5, 1, 1).getValues()[0][0], MAX_TOTAL);
    }

    var discrepancia = (subPagina && subPagina !== r.sub)
      ? celdaSegura('La página dijo ' + pesos(subPagina) +
                    ' y la hoja calcula ' + pesos(r.sub), MAX_ACTA)
      : '';

    var fila = [new Date(), codigo, celdaSegura(r.cupon.ok ? r.cupon.codigo : ''),
                r.sub, subPagina, discrepancia, r.descuento, r.envio, r.total,
                celdaSegura(items.map(function (i) { return i.id + ' x' + i.cantidad; }).join(' · '), MAX_ACTA),
                celdaSegura((r.avisos || []).join(' · '), MAX_ACTA)];

    if (encontrada) {
      /* Si el pedido YA se registró, su validación queda congelada: es la prueba
         de cuánto valía cuando se envió y nadie debe poder reescribirla después.
         Como el número lo elige la tienda, sin esto alguien que adivinara un
         número en curso podría pisar la fila de otro cliente. Después de enviado,
         ya no.

         OJO CON EL MOMENTO, QUE AQUÍ HUBO UN ERROR Y VALE LA PENA DEJARLO ESCRITO.
         El sello sale con 400 ms de espera y el registro sale al instante. Si el
         cliente cambiaba la zona de envío y pulsaba enseguida, el registro
         marcaba el pedido y el sello nuevo —el bueno— llegaba después y se
         descartaba aquí: el acta se quedaba con la zona anterior. El mensaje y la
         hoja Pedidos decían $17.900 y el acta decía $8.900.
         La protección era correcta; congelaba antes de tiempo. Ahora el acta la
         escribe registrarPedido() con SU propia revalidación —la autorizada, la
         que produjo el total guardado—, y esa escritura pasa con `autorizada`.
         Lo que sigue cerrado es lo que la protección quería cerrar: cualquier
         ?a=validar de fuera sobre un pedido ya enviado. */
      if (!autorizada && yaRegistrado(codigo)) return codigo;
      h.getRange(encontrada, 1, 1, fila.length).setValues([fila]);
    } else if (ultima <= MAX_FILAS) {
      h.appendRow(fila);
    }
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
  return codigo;
}

/* ==========================================================================
   REGISTRO DEL PEDIDO  —  GET ?a=registrar
   --------------------------------------------------------------------------
   Antes esto iba por POST con navigator.sendBeacon y la hoja Pedidos se
   quedaba vacía. Apps Script responde a los POST con una redirección, y el
   navegador convierte esa redirección en GET: la petición llegaba, pero como
   GET sin parámetros, así que no escribía nada y tampoco daba error.

   Por GET no pasa: es el mismo camino que ya usan el catálogo y la validación,
   que sí funcionan. Los precios los pone la hoja, no lo que mande la tienda.
   ========================================================================== */
function registrarPedido(p) {
  var codigo = celdaSegura(p.pedido).slice(0, 12);
  if (!codigo) return { ok: false, error: 'Pedido sin número' };
  if (yaRegistrado(codigo)) return { ok: true, duplicado: true };

  var r = validarPedido({ items: p.items, cupon: p.cupon, envio: p.envio });
  if (!r.ok || !r.items.length) return { ok: false, error: 'Pedido sin líneas válidas' };

  guardarPedido({
    pedido: codigo,
    ref: codigo,
    estado: 'Nuevo',
    ciudad: celdaSegura(p.ciudad),
    cupon: celdaSegura(r.cupon.ok ? r.cupon.codigo : ''),
    total: r.total,
    items: r.items.map(function (i) {
      return { id: i.id, nombre: celdaSegura(i.nombre), cantidad: i.cantidad, precio: i.precio };
    })
  });

  /* El acta la escribe ESTA validación, que es la misma que acaba de producir
     la fila de Pedidos. Antes la escribía el sello, que podía llegar después de
     este registro y encontrarse la puerta cerrada. Una sola fuente para los dos
     renglones; lo demás se deriva. Y va ANTES de marcar: marcar es lo que cierra
     la puerta. */
  sellar({ pedido: codigo, sub: p.sub }, r.items, r, true);
  marcarRegistrado(codigo);
  anotarRescate(p.tarde);
  return { ok: true, lineas: r.items.length };
}

/* ==========================================================================
   LOS PEDIDOS QUE LLEGARON TARDE, CONTADOS.
   --------------------------------------------------------------------------
   La página guarda en el navegador del comprador el pedido que no pudo
   registrar, y lo reenvía la próxima vez que la tienda abra y este maestro
   conteste. Cada uno de esos reenvíos trae `tarde`: los minutos que pasaron.

   Cada rescate es un pedido que ESTUVO PERDIDO. Que llegue no borra eso: quiere
   decir que hubo un rato en que el comercio veía el chat de WhatsApp y no veía
   la fila, y que si el comprador no hubiera vuelto a abrir la tienda, no
   habría llegado nunca. Por eso se cuenta.

   Y por eso se guarda también EL PEOR: rescatar a los tres minutos es un
   tropiezo de red; rescatar a los dos días es que la tienda estuvo caída y
   nadie se enteró. El número solo no distingue esas dos cosas.

   Va en las propiedades del script y no en una pestaña: es un contador, no un
   dato del comercio, y una pestaña más es una pestaña más que explicarle.
   ========================================================================== */
function anotarRescate(tarde) {
  var minutos = Math.floor(Number(tarde) || 0);
  if (!(minutos > 0)) return;                     // un registro normal no cuenta
  try {
    var props = PropertiesService.getScriptProperties();
    var antes = JSON.parse(props.getProperty('RESCATES') || '{}');
    props.setProperty('RESCATES', JSON.stringify({
      n: (Number(antes.n) || 0) + 1,
      peor: Math.max(Number(antes.peor) || 0, minutos),
      ultimo: new Date().toISOString()
    }));
  } catch (e) { /* que no se lleve por delante el pedido, que es lo que importa */ }
}

function rescates() {
  try {
    var d = JSON.parse(PropertiesService.getScriptProperties()
                         .getProperty('RESCATES') || '{}');
    return { n: Number(d.n) || 0, peor: Number(d.peor) || 0,
             ultimo: String(d.ultimo || '') };
  } catch (e) { return { n: 0, peor: 0, ultimo: '' }; }
}

function aleatorio(n) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < n; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
  return s;
}

/* ==========================================================================
   REGISTRO  —  POST desde navigator.sendBeacon
   ========================================================================== */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('POST vacío');
    if (e.postData.contents.length > MAX_CUERPO) throw new Error('Cuerpo demasiado grande');

    var pedido = validarRegistro(JSON.parse(e.postData.contents));
    if (!pedido) throw new Error('Pedido sin líneas válidas');
    if (yaRegistrado(pedido.pedido)) return json({ ok: true, duplicado: true });
    guardarPedido(pedido);
    marcarRegistrado(pedido.pedido);
    return json({ ok: true });
  } catch (err) {
    registrarError(err, e);
    return json({ ok: false });     // sin detalles para quien esté sondeando
  }
}

/* ==========================================================================
   CATÁLOGO PÚBLICO  —  GET ?a=catalogo
   --------------------------------------------------------------------------
   Lo que la tienda pide al abrir para pintar precios, stock y tarifas reales.
   Así hay UNA sola lista de precios: esta. index.html solo aporta los nombres,
   las descripciones y las fotos, que son contenido y casi nunca cambian.

   Ojo: esto solo actualiza productos que YA existen en index.html. Un producto
   nuevo en la hoja no aparece solo en la tienda, porque le faltan descripción y
   fotos. Para agregar productos hay que tocar index.html.

   Va en caché un minuto para no leer la hoja en cada visita.
   ========================================================================== */
function catalogoPublico() {
  var cache = CacheService.getScriptCache();
  var guardado = cache.get('catalogo');
  if (guardado) return JSON.parse(guardado);

  /* MISMAS REGLAS QUE leerCatalogo(), Y NO ES CASUALIDAD. Esta lista es la que
     ve el comprador y aquella es con la que se valida el pedido. Si una usa
     `Number(...) || 0` y la otra no, un producto con el precio mal escrito se
     muestra a $0 y desaparece al validar: el peor de los dos mundos. Un precio
     ilegible saca el producto de las DOS. */
  CELDAS_ILEGIBLES = [];
  var productos = filas(H_CATALOGO).map(function (f, i) {
    var fila = i + 2;
    var id = String(f[0]).trim();
    var precio = cifra(f[4], 'Catálogo E' + fila + ' (Precio de ' + (id || fila) + ')');
    var stock  = cifra(f[5], 'Catálogo F' + fila + ' (Stock de ' + (id || fila) + ')');
    var antes  = cifra(f[11], 'Catálogo L' + fila + ' (Precio antes de ' + (id || fila) + ')');
    var umbral = cifra(f[12], 'Catálogo M' + fila + ' (Umbral bajo de ' + (id || fila) + ')');
    return {
      id:          id,
      nombre:      String(f[1] || '').trim(),
      formato:     String(f[2] || '').trim(),
      categoria:   String(f[3] || '').trim() || 'Otros',
      precio:      precio,
      stock:       stock === null ? 0 : Math.max(0, stock),
      descripcion: String(f[6] || '').trim(),
      // Todas las fotos del producto van en UNA celda, separadas por |
      imagenes:    String(f[7] || '').split('|')
                     .map(function (u) { return u.trim(); })
                     .filter(function (u) { return u; })
                     .slice(0, 6),
      destacado:   esSi(f[8]),
      activo:      esSi(f[9]),
      referencia:  String(f[10] || '').trim(),
      precioAntes: (antes && precio !== null && antes > precio) ? antes : 0,
      umbralBajo:  (umbral && umbral > 0) ? Math.floor(umbral) : 0
    };
  }).filter(function (p) { return p.id && p.nombre && p.precio !== null; });

  var envios = filas(H_ENVIOS).map(function (f, i) {
    var id = String(f[0]).trim();
    var valor = cifra(f[2], 'Envíos C' + (i + 2) + ' (Valor de ' + (id || (i + 2)) + ')');
    /* Aquí el envío ilegible SÍ se muestra, con 0 y su nombre: quitarlo de la
       lista dejaría al comprador sin poder elegir su zona. El sello lo corrige
       y lo dice; esta lista es solo para escoger. */
    return { id: id, nombre: String(f[1]), valor: valor === null ? 0 : valor };
  }).filter(function (e) { return e.id; });

  if (CELDAS_ILEGIBLES.length) {
    anotarError('Celdas que no se pudieron leer como número',
                CELDAS_ILEGIBLES.join(' · '));
  }

  var r = { ok: true, productos: productos, envios: envios,
            config: configPublica(leerConfiguracion()),
            ilegibles: CELDAS_ILEGIBLES.length };
  // Solo cacheamos si hay algo. Guardar un catálogo vacío haría que, después de
  // ejecutar instalar(), la tienda siguiera viéndose vacía otro minuto entero.
  if (productos.length) cache.put('catalogo', JSON.stringify(r), 60);
  return r;
}

/** Convierte el POST de registro en algo con la forma que esperamos, o null. */
function validarRegistro(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.items)) return null;
  if (!d.items.length || d.items.length > MAX_ITEMS) return null;

  var catalogo = leerCatalogo();
  var vistos = {}, items = [];
  for (var i = 0; i < d.items.length; i++) {
    var it = d.items[i];
    if (!it || typeof it !== 'object') continue;
    var id = String(it.id || '');
    if (!catalogo[id] || vistos[id]) continue;     // el catálogo es la lista blanca
    vistos[id] = true;
    var cant = numeroSeguro(it.cantidad, MAX_CANTIDAD);
    if (cant < 1) continue;
    items.push({ id: id, nombre: celdaSegura(catalogo[id].nombre), cantidad: cant,
                 precio: numeroSeguro(it.precio, MAX_TOTAL) });
  }
  if (!items.length) return null;

  return {
    pedido: celdaSegura(d.pedido).slice(0, 12),
    ref:    celdaSegura(d.ref).slice(0, 12),
    estado: 'Nuevo',                // lo pone el script, no quien envía
    ciudad: celdaSegura(d.ciudad),
    cupon:  celdaSegura(d.cupon).slice(0, 20),
    total:  numeroSeguro(d.total, MAX_TOTAL),
    items:  items
  };
}

/* Segunda línea de defensa contra pedidos repetidos. La primera está en la
   tienda, que ya no genera un código nuevo por cada toque del botón. Esta cubre
   lo que la tienda no puede: que el navegador reenvíe el mismo aviso, o que el
   cliente vuelva atrás y toque otra vez.

   Miramos la caché y, por si acaso, las últimas filas de la hoja: la caché es
   rápida pero se puede vaciar. */
function yaRegistrado(codigo) {
  if (!codigo) return false;
  if (CacheService.getScriptCache().get('pedido:' + codigo)) return true;

  var h = elLibro().getSheetByName(H_PEDIDOS);
  if (!h || h.getLastRow() < 2) return false;
  var desde = Math.max(2, h.getLastRow() - 60);
  var recientes = h.getRange(desde, 2, h.getLastRow() - desde + 1, 1).getValues();
  for (var i = 0; i < recientes.length; i++) {
    if (String(recientes[i][0]).trim() === codigo) return true;
  }
  return false;
}

/* Se marca DESPUÉS de guardar, no antes. Si se marcara antes y el guardado
   fallara, el reintento se descartaría como duplicado y el pedido se perdería
   para siempre sin que nadie se enterara. */
function marcarRegistrado(codigo) {
  CacheService.getScriptCache().put('pedido:' + codigo, '1', 21600);   // seis horas
}

function guardarPedido(d) {
  var h = hoja(H_PEDIDOS, ENCABEZADO_PEDIDOS);
  if (h.getLastRow() > MAX_FILAS)
    throw new Error('La hoja llegó a ' + MAX_FILAS + ' filas. Archívala y vacíala.');

  var ahora = new Date();
  var f = d.items.map(function (i) {
    return [ahora, d.pedido, d.ref, d.estado, d.ciudad, d.cupon, i.nombre, i.id,
            i.cantidad, i.precio, i.cantidad * i.precio, d.total];
  });
  h.getRange(h.getLastRow() + 1, 1, f.length, f[0].length).setValues(f);
}

/* ==========================================================================
   TABLERO
   --------------------------------------------------------------------------
   Las filas de Pedidos y Validaciones son datos; esto son respuestas. Un
   número solo no dice nada, así que cada uno va contra el mes anterior.

   Lo más valioso está en el embudo: sabemos cuántos carritos se armaron
   (Validaciones), cuántos llegaron a WhatsApp (Pedidos) y cuántos cerraste
   (Estado = Confirmado). Casi nadie que vende por WhatsApp conoce esos dos
   porcentajes, y a nosotros nos salen gratis de datos que ya guardamos.

   Se recalcula con el resumen: cada hora, al cambiar un Estado, y desde el
   menú de la hoja.
   ========================================================================== */
function recalcularTablero() {
  var m = calcularMetricas();
  pintarTablero(m);
  return m.filas;
}

/* Las cuentas viven aquí y en un solo sitio. El Tablero las pinta y el correo
   diario las manda: si algún día no cuadran entre sí, es que alguien duplicó
   esta función en vez de llamarla. */
function calcularMetricas() {
  var libro = elLibro();
  var ahora = new Date();
  var mesActual   = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  var hace30 = new Date(ahora.getTime() - 30 * 24 * 3600 * 1000);
  var hace24 = new Date(ahora.getTime() - 24 * 3600 * 1000);
  var inicioHoy  = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  var inicioAyer = new Date(inicioHoy.getTime() - 24 * 3600 * 1000);

  var fechaDe = function (v) {
    if (v instanceof Date) return v;
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };
  var enMes = function (f, ref) {
    return f && f.getFullYear() === ref.getFullYear() && f.getMonth() === ref.getMonth();
  };
  /* «¿Ya se vendió?» se le pregunta a esVenta() y no se vuelve a escribir aquí.
     Esta función era una copia de la que usa el inventario, con la misma frase
     —indexOf('confirmado')— y bastaba tocar una para que el tablero y el stock
     empezaran a contar cosas distintas. Patrón 2 de la bitácora. */
  var confirmado = esVenta;

  // ---- Pedidos agrupados por número: el total se repite en cada línea ----
  var pedidos = {}, lineas = [];
  filas(H_PEDIDOS).forEach(function (f) {
    var codigo = String(f[1]).trim();
    if (!codigo) return;
    var fecha = fechaDe(f[0]);
    if (!pedidos[codigo]) {
      pedidos[codigo] = { fecha: fecha, estado: String(f[3]),
                          total: Number(f[11]) || 0, ciudad: String(f[4]).trim() };
    }
    lineas.push({ codigo: codigo, fecha: fecha, estado: String(f[3]), id: String(f[7]).trim(),
                  nombre: String(f[6]), cantidad: Number(f[8]) || 0, subtotal: Number(f[10]) || 0 });
  });

  var carritos = filas(H_VALIDACIONES).map(function (f) { return fechaDe(f[0]); });

  // ---- Métricas de un mes ----
  // hastaDia recorta el mes a sus primeros N días. Sirve para comparar este
  // mes, que va a la mitad, contra el mismo tramo del mes pasado: comparar
  // 4 días contra 30 no dice nada y siempre pinta mal.
  function delMes(ref, hastaDia) {
    var m = { ventas: 0, confirmados: 0, enviados: 0, carritos: 0 };
    var cabe = function (f) {
      return enMes(f, ref) && (!hastaDia || f.getDate() <= hastaDia);
    };
    Object.keys(pedidos).forEach(function (c) {
      var p = pedidos[c];
      if (!p.fecha || !cabe(p.fecha)) return;
      m.enviados++;
      if (confirmado(p.estado)) { m.confirmados++; m.ventas += p.total; }
    });
    carritos.forEach(function (f) { if (f && cabe(f)) m.carritos++; });
    m.ticket = m.confirmados ? Math.round(m.ventas / m.confirmados) : 0;
    m.tasaEnvio = m.carritos ? m.enviados / m.carritos : 0;
    m.tasaCierre = m.enviados ? m.confirmados / m.enviados : 0;
    return m;
  }
  var A = delMes(mesActual), B = delMes(mesAnterior);
  var Bhasta = delMes(mesAnterior, ahora.getDate());   // el mes pasado a esta misma altura

  // ---- Pendientes: el conteo y TAMBIÉN cuáles, que es lo accionable ----
  var porConfirmar = 0, viejos = 0, pendientes = [];
  Object.keys(pedidos).forEach(function (c) {
    var p = pedidos[c];
    if (confirmado(p.estado) || esCancelado(p.estado)) return;
    porConfirmar++;
    var horas = p.fecha ? Math.floor((ahora - p.fecha) / 3600000) : 0;
    if (p.fecha && p.fecha < hace24) viejos++;
    pendientes.push({ codigo: c, fecha: p.fecha, ciudad: p.ciudad,
                      total: p.total, horas: horas });
  });
  pendientes.sort(function (a, b) { return b.horas - a.horas; });

  // ---- Ayer: lo que llegó y lo que se cerró ----
  var ayer = { enviados: 0, confirmados: 0, ventas: 0 };
  Object.keys(pedidos).forEach(function (c) {
    var p = pedidos[c];
    if (!p.fecha || p.fecha < inicioAyer || p.fecha >= inicioHoy) return;
    ayer.enviados++;
    if (confirmado(p.estado)) { ayer.confirmados++; ayer.ventas += p.total; }
  });
  var he = libro.getSheetByName(H_ERRORES);
  var errores = he ? Math.max(0, he.getLastRow() - 1) : 0;

  // ---- Inventario ----
  var catalogo = filas(H_CATALOGO).filter(function (f) { return String(f[0]).trim() && esSi(f[9]); });
  var agotados = 0, pocos = 0, listaAgotados = [], listaPocos = [];
  catalogo.forEach(function (f) {
    var st = Number(f[5]) || 0;
    if (st === 0) { agotados++; listaAgotados.push(String(f[1])); }
    else if (st <= 5) { pocos++; listaPocos.push(String(f[1]) + ' (' + st + ')'); }
  });

  // ---- Movimiento de los últimos 30 días, solo ventas confirmadas ----
  var unidades = {}, ingresos = {}, ciudades = {}, pedidosCiudad = {};
  lineas.forEach(function (l) {
    if (!confirmado(l.estado) || !l.fecha || l.fecha < hace30) return;
    unidades[l.id] = (unidades[l.id] || 0) + l.cantidad;
    ingresos[l.id] = (ingresos[l.id] || 0) + l.subtotal;
  });
  Object.keys(pedidos).forEach(function (c) {
    var p = pedidos[c];
    if (!confirmado(p.estado) || !p.fecha || p.fecha < hace30) return;
    var ciudad = p.ciudad || 'Sin ciudad';
    if (!pedidosCiudad[ciudad]) pedidosCiudad[ciudad] = {};
    pedidosCiudad[ciudad][c] = true;
  });
  Object.keys(pedidosCiudad).forEach(function (c) {
    ciudades[c] = Object.keys(pedidosCiudad[c]).length;
  });

  var nombreDe = {};
  catalogo.forEach(function (f) { nombreDe[String(f[0]).trim()] = String(f[1]); });

  var masVendidos = Object.keys(unidades).map(function (id) {
    return [nombreDe[id] || id, unidades[id], ingresos[id]];
  }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);

  var sinVender = catalogo.filter(function (f) {
    return !unidades[String(f[0]).trim()];
  }).map(function (f) { return String(f[1]); });

  var porCiudad = Object.keys(ciudades).map(function (c) { return [c, ciudades[c]]; })
    .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);

  // ---- Serie de 6 meses, para el gráfico de barras ----
  var MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var meses = [];
  for (var k = 5; k >= 0; k--) {
    var ref = new Date(ahora.getFullYear(), ahora.getMonth() - k, 1);
    var m = delMes(ref);
    meses.push({ etiqueta: MES_CORTO[ref.getMonth()] + ' ' + String(ref.getFullYear()).slice(2),
                 ventas: m.ventas, pedidos: m.confirmados, actual: k === 0 });
  }

  return {
    ahora: ahora, A: A, B: B, Bhasta: Bhasta, diaDelMes: ahora.getDate(),
    ayer: ayer, meses: meses,
    porConfirmar: porConfirmar, viejos: viejos, pendientes: pendientes,
    errores: errores, agotados: agotados, pocos: pocos,
    listaAgotados: listaAgotados, listaPocos: listaPocos,
    sinVender: sinVender, masVendidos: masVendidos, porCiudad: porCiudad,
    cfg: leerConfiguracion(), url: libro.getUrl(), filas: 0
  };
}

/* ==========================================================================
   El tablero pintado.
   --------------------------------------------------------------------------
   Los gráficos van dibujados con bloques (█) y no con SPARKLINE a propósito:
   las fórmulas de Google cambian de separador según el idioma de la hoja
   (coma en inglés, punto y coma en español), así que una fórmula escrita
   desde el script se rompe en cuanto la hoja está en otro idioma. Un bloque
   de texto se ve igual en todas partes, sobrevive a copiar la hoja y no
   depende de nada.
   ========================================================================== */
var ANCHO_BARRA = 22;

function barra(valor, tope) {
  valor = Number(valor) || 0;
  tope = Number(tope) || 0;
  if (tope <= 0 || valor <= 0) return '';
  var n = Math.round(valor / tope * ANCHO_BARRA);
  if (n < 1) n = 1;
  var t = '';
  for (var i = 0; i < n; i++) t += '█';
  return t;
}

/* La variación, con su flecha y su color.
   Se compara SIEMPRE contra el mismo tramo del mes pasado (los primeros N
   días), no contra el mes pasado completo: si hoy es 4, comparar 4 días
   contra 30 siempre pinta mal y no dice nada. */
function variacion(hoy, antes) {
  hoy = Number(hoy) || 0; antes = Number(antes) || 0;
  if (!antes) {
    return { texto: hoy ? 'a esta altura el mes pasado no había nada' : '',
             color: hoy ? '#1B5E3A' : null };
  }
  var pct = Math.round((hoy - antes) / antes * 100);
  if (pct === 0) return { texto: 'igual', color: null };
  return { texto: (pct > 0 ? '▲ ' : '▼ ') + Math.abs(pct) + '%',
           color: pct > 0 ? '#1B5E3A' : '#B3261E' };
}

function pintarTablero(m) {
  var A = m.A, B = m.B, cfg = m.cfg;
  var VERDE  = cfg.color_secundario || '#1B5E3A';
  var ROJO   = cfg.color_principal  || '#D0211C';
  var TINTA  = '#1A1A1A', TENUE = '#707070', ALERTA = '#B3261E';
  var BANDA  = '#F1F1EF', LINEA = '#E4E4E1';

  var filas = [], estilo = [];
  var poner = function (a, b, c, d, e) {
    filas.push([a === undefined ? '' : a, b === undefined ? '' : b,
                c === undefined ? '' : c, d === undefined ? '' : d]);
    estilo.push(e || {});
    return filas.length + 0;   // número de fila dentro del bloque (1-based)
  };
  var seccion = function (titulo, b, c, d) {
    poner('', '', '', '', { alto: 10 });
    poner(titulo, b, c, d, { banda: true });
  };

  // ───────── Encabezado ─────────
  poner((cfg.negocio || 'Tienda').toUpperCase() + '  ·  TABLERO', '', '',
        'Actualizado ' + fechaCorta(m.ahora), { titulo: true });

  // ───────── Ventas del mes ─────────
  // La columna de comparación muestra el mes pasado HASTA EL MISMO DÍA, que es
  // contra lo que se calcula la variación. Poner ahí el mes completo y al lado
  // un porcentaje calculado contra otra cosa es la forma más fácil de que un
  // tablero mienta sin querer.
  var H = m.Bhasta, dias = m.diaDelMes;
  var tramo = 'Mes pasado a día ' + dias;
  seccion('VENTAS DE ESTE MES', 'Este mes', tramo, 'Variación');
  var vv = variacion(A.ventas, H.ventas);
  poner('Ventas confirmadas', A.ventas, H.ventas, vv.texto,
        { dinero: [2, 3], grande: true, notaColor: vv.color });
  var vp = variacion(A.confirmados, H.confirmados);
  poner('Pedidos confirmados', A.confirmados, H.confirmados, vp.texto, { notaColor: vp.color });
  var vt = variacion(A.ticket, H.ticket);
  poner('Ticket promedio', A.ticket, H.ticket, vt.texto, { dinero: [2, 3], notaColor: vt.color });
  poner('Mes anterior completo', B.ventas, B.confirmados ? B.confirmados + ' ventas' : '', '',
        { dinero: [2], tenue: true });

  // ───────── Gráfico: ventas mes a mes ─────────
  seccion('VENTAS MES A MES', 'Ventas', '', 'Pedidos');
  var topeMes = 0;
  m.meses.forEach(function (x) { if (x.ventas > topeMes) topeMes = x.ventas; });
  m.meses.forEach(function (x) {
    poner(x.etiqueta, x.ventas, barra(x.ventas, topeMes), x.pedidos || '',
          { dinero: [2], barra: 3, color: x.actual ? ROJO : VERDE,
            negrita: x.actual, numero: [4] });
  });
  if (!topeMes) poner('Todavía no hay ventas confirmadas', '', '', '', { tenue: true });

  // ───────── Embudo ─────────
  seccion('EMBUDO DE ESTE MES', 'Cantidad', '', 'De cada paso al siguiente');
  var tope = Math.max(A.carritos, A.enviados, A.confirmados);
  poner('Carritos armados en la tienda', A.carritos, barra(A.carritos, tope), '',
        { barra: 3, color: VERDE });
  poner('Pedidos enviados a WhatsApp', A.enviados, barra(A.enviados, tope),
        A.carritos ? Math.round(A.tasaEnvio * 100) + '% de los carritos' : '',
        { barra: 3, color: VERDE });
  poner('Ventas confirmadas', A.confirmados, barra(A.confirmados, tope),
        A.enviados ? Math.round(A.tasaCierre * 100) + '% de los enviados' : '',
        { barra: 3, color: VERDE });
  poner('', '', '', 'Si cae el primero, revisa precio o envío. Si cae el segundo, WhatsApp.',
        { tenue: true });

  // ───────── Para atender hoy ─────────
  seccion('PARA ATENDER HOY', 'Cantidad', '', '');
  poner('Pedidos por confirmar', m.porConfirmar, '', '',
        { grande: m.porConfirmar > 0, color: m.porConfirmar > 0 ? TINTA : TENUE });
  poner('   de más de 24 horas', m.viejos, '',
        m.viejos ? 'Escríbeles hoy: cada hora que pasa se enfría la venta' : '',
        { color: m.viejos ? ALERTA : TENUE, notaColor: m.viejos ? ALERTA : null,
          negrita: m.viejos > 0 });
  poner('Errores registrados', m.errores, '',
        m.errores ? 'Mira la pestaña Errores' : '',
        { color: m.errores ? ALERTA : TENUE, notaColor: m.errores ? ALERTA : null });

  // ───────── Inventario ─────────
  seccion('INVENTARIO', 'Cantidad', '', 'Cuáles');
  poner('Productos agotados', m.agotados, '',
        m.listaAgotados.slice(0, 4).join(', ') +
        (m.listaAgotados.length > 4 ? ' y ' + (m.listaAgotados.length - 4) + ' más' : ''),
        { color: m.agotados ? ALERTA : TENUE, notaColor: m.agotados ? ALERTA : null });
  poner('Con 5 unidades o menos', m.pocos, '',
        m.listaPocos.slice(0, 4).join(', ') +
        (m.listaPocos.length > 4 ? ' y ' + (m.listaPocos.length - 4) + ' más' : ''),
        { color: m.pocos ? TINTA : TENUE });
  poner('Sin vender en 30 días', m.sinVender.length, '',
        m.sinVender.slice(0, 4).join(', ') +
        (m.sinVender.length > 4 ? ' y ' + (m.sinVender.length - 4) + ' más' : ''),
        { color: TINTA });

  // ───────── Lo que más se vende ─────────
  seccion('LO QUE MÁS SE VENDE', 'Unidades', '', 'Ingresos (30 días)');
  if (m.masVendidos.length) {
    var topeU = m.masVendidos[0][1];
    m.masVendidos.forEach(function (x) {
      poner(x[0], x[1], barra(x[1], topeU), x[2], { barra: 3, color: ROJO, dinero: [4] });
    });
  } else {
    poner('Todavía no hay ventas confirmadas', '', '', '', { tenue: true });
  }

  // ───────── Dónde compran ─────────
  seccion('DÓNDE COMPRAN', 'Pedidos', '', '');
  if (m.porCiudad.length) {
    var topeC = m.porCiudad[0][1];
    m.porCiudad.forEach(function (x) {
      poner(x[0], x[1], barra(x[1], topeC), '', { barra: 3, color: VERDE });
    });
  } else {
    poner('Todavía no hay ventas confirmadas', '', '', '', { tenue: true });
  }

  poner('', '', '', '', { alto: 10 });
  poner('Esta pestaña la escribe el script solo: lo que anotes aquí se pierde en el próximo recálculo.',
        '', '', '', { tenue: true });

  // ───────── Volcado a la hoja ─────────
  var h = hoja(H_TABLERO, ['Tablero', '', '', '']);
  var maxFilas = Math.max(h.getMaxRows(), filas.length + 1);
  h.getRange(1, 1, maxFilas, 4).clearContent();
  h.getRange(1, 1, filas.length, 4).setValues(filas);

  h.setHiddenGridlines(true);
  h.setColumnWidth(1, 260); h.setColumnWidth(2, 120);
  h.setColumnWidth(3, 230); h.setColumnWidth(4, 330);

  var todo = h.getRange(1, 1, filas.length, 4);
  todo.setFontFamily('Inter').setFontSize(10).setFontColor(TINTA)
      .setBackground('#FFFFFF').setVerticalAlignment('middle').setWrap(false);
  h.getRange(1, 2, filas.length, 1).setHorizontalAlignment('right');

  estilo.forEach(function (e, i) {
    var f = i + 1;
    if (e.alto) h.setRowHeight(f, e.alto);
    if (e.titulo) {
      h.getRange(f, 1, 1, 3).merge();
      h.getRange(f, 1, 1, 4).setBackground(VERDE).setFontColor('#FFFFFF');
      h.getRange(f, 1).setFontSize(14).setFontWeight('bold');
      h.getRange(f, 4).setFontSize(9).setHorizontalAlignment('right');
      h.setRowHeight(f, 40);
      return;
    }
    if (e.banda) {
      h.getRange(f, 1, 1, 4).setBackground(BANDA).setFontWeight('bold')
       .setFontSize(9).setFontColor(TENUE);
      h.getRange(f, 1).setFontColor(TINTA).setFontSize(10);
      h.getRange(f, 2, 1, 3).setHorizontalAlignment('right');
      h.getRange(f, 4).setHorizontalAlignment('left');
      h.setRowHeight(f, 26);
      return;
    }
    if (e.tenue) h.getRange(f, 1, 1, 4).setFontColor(TENUE).setFontStyle('italic');
    if (e.grande) h.getRange(f, 2).setFontSize(14).setFontWeight('bold');
    if (e.negrita) h.getRange(f, 1).setFontWeight('bold');
    if (e.color) h.getRange(f, 2).setFontColor(e.color);
    if (e.notaColor) h.getRange(f, 4).setFontColor(e.notaColor);
    if (e.barra) h.getRange(f, e.barra).setFontColor(e.color || VERDE)
                  .setFontFamily('Roboto Mono').setFontSize(9);
    (e.dinero || []).forEach(function (c) { h.getRange(f, c).setNumberFormat('"$"#,##0'); });
    (e.numero || []).forEach(function (c) { h.getRange(f, c).setNumberFormat('#,##0'); });
    h.getRange(f, 1, 1, 4).setBorder(false, false, true, false, false, false,
                                     LINEA, null);
  });

  m.filas = filas.length;
  return filas.length;
}

function fechaCorta(d) {
  var p = function (n) { return (n < 10 ? '0' : '') + n; };
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() +
         '  ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/* ==========================================================================
   CATÁLOGO DE RESPALDO PARA index.html
   --------------------------------------------------------------------------
   La tienda le pregunta el catálogo a la hoja cada vez que carga. Si Google no
   contesta —mantenimiento, cuota, un mal día— sirve el catálogo que trae el
   propio archivo. Ese respaldo hay que refrescarlo de vez en cuando, y a mano
   es un trabajo horrible.

   Esto lo escribe solo, con los precios y el stock de HOY, en el formato exacto
   que espera index.html. Se copia y se pega entre las marcas. Nada más.
   ========================================================================== */
function generarInventario() {
  var productos = filas(H_CATALOGO).filter(function (f) {
    return String(f[0]).trim() && esSi(f[9]);
  });
  var envios = filas(H_ENVIOS).filter(function (f) { return String(f[0]).trim(); });
  var ahora = new Date();

  var txt = function (v) {
    return '"' + String(v === undefined || v === null ? '' : v)
      .replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      .replace(/[\r\n]+/g, ' ').trim() + '"';
  };

  var lineas = [];
  lineas.push('/* ═══ CATÁLOGO DE RESPALDO — generado el ' + fechaCorta(ahora) + ' ═══');
  lineas.push('   Solo se usa si Google no responde. Lo genera el Apps Script:');
  lineas.push('   el menú de la hoja > Generar inventario para index.html. */');
  lineas.push('const ENVIOS = [');
  lineas.push(envios.map(function (f) {
    return '  { id:' + txt(f[0]) + ', nombre:' + txt(f[1]) +
           ', valor:' + (Number(f[2]) || 0) + ' }';
  }).join(',\n'));
  lineas.push('];');
  lineas.push('');
  lineas.push('const PRODUCTOS = [');
  lineas.push(productos.map(function (f) {
    var fotos = String(f[7] || '').split('|')
      .map(function (u) { return u.trim(); })
      .filter(function (u) { return u; });
    if (!fotos.length) fotos = [''];
    return '  { id:' + txt(f[0]) + ', nombre:' + txt(f[1]) +
           ', formato:' + txt(f[2]) + ', categoria:' + txt(f[3]) + ',\n' +
           '    precio:' + (Number(f[4]) || 0) + ', stock:' + (Number(f[5]) || 0) +
           ', forma:' + txt(formaDe(f[2], f[3])) + ',\n' +
           '    imagenes:[' + fotos.map(txt).join(', ') + '],\n' +
           '    descripcion:' + txt(f[6]) + ' }';
  }).join(',\n\n'));
  lineas.push('];');
  lineas.push('/* ═══ FIN DEL CATÁLOGO DE RESPALDO ═══ */');

  var bloque = lineas.join('\n');
  console.log(bloque);
  return { tipo: 'html', titulo: 'Catálogo de respaldo para index.html',
           html: ventanaInventario(bloque, productos.length, envios.length),
           bloque: bloque };
}

/* El dibujo que se usa mientras un producto no tenga fotos. Sale del formato,
   que es donde ya está la pista: "Frasco 300 g", "Botella 500 ml". */
function formaDe(formato, categoria) {
  var t = (String(formato) + ' ' + String(categoria)).toLowerCase();
  if (t.indexOf('frasco') !== -1 || t.indexOf('salsa') !== -1 ||
      t.indexOf('conserva') !== -1) return 'frasco';
  if (t.indexOf('botella') !== -1 || t.indexOf('bebida') !== -1) return 'botella';
  if (t.indexOf('bolsa') !== -1 || t.indexOf('caja') !== -1) return 'bolsa';
  return 'tomate';
}

function ventanaInventario(bloque, cuantos, envios) {
  var caja = 'width:100%;box-sizing:border-box;font:12px/1.5 Menlo,Consolas,monospace;' +
             'border:1px solid #D8D8D8;border-radius:6px;padding:10px;background:#FAFAFA;' +
             'resize:vertical;white-space:pre;overflow-x:auto';
  var nota = 'margin:0 0 10px;font:400 12px/1.55 Arial,sans-serif;color:#666';
  var boton = 'margin-top:8px;padding:8px 15px;border:1px solid #111;background:#111;color:#FFF;' +
              'border-radius:6px;font:600 12px Arial,sans-serif;cursor:pointer';

  var html =
    '<div style="font-family:Arial,sans-serif;padding:4px 6px 18px">' +
    '<p style="' + nota + ';color:#111;font-size:13px"><b>' + cuantos + ' productos</b> y <b>' +
      envios + ' zonas de envío</b>, con los precios y el stock de hoy.</p>' +
    '<p style="' + nota + '">Pega esto en <b>index.html</b> reemplazando todo lo que hay entre ' +
    '<code>CATÁLOGO DE RESPALDO</code> y <code>FIN DEL CATÁLOGO DE RESPALDO</code>, marcas incluidas. ' +
    'Después vuelve a publicar el sitio.</p>' +
    '<textarea id="a" rows="18" style="' + caja + '" readonly>' + escaparHtml(bloque) + '</textarea>' +
    '<button style="' + boton + '" onclick="copiar()">Copiar el catálogo de respaldo</button>' +
    '<p style="' + nota + ';margin-top:20px"><b>Esto no es obligatorio.</b> La tienda funciona sin ' +
    'volver a generarlo: los precios y el stock reales salen de la hoja en caliente. Este bloque es ' +
    'el paracaídas para el día en que Google no responda, y conviene refrescarlo cuando cambien ' +
    'precios o entren productos nuevos.</p>' +
    '<script>function copiar(){var t=document.getElementById("a");t.select();' +
    't.setSelectionRange(0,999999);try{document.execCommand("copy");' +
    'var b=document.querySelector("button");b.textContent="Copiado";' +
    'setTimeout(function(){b.textContent="Copiar el catálogo de respaldo";},1800);}catch(e){}}<\/script>' +
    '</div>';

  return html;
}

/* ==========================================================================
   PRESENTACIÓN DE LAS HOJAS
   --------------------------------------------------------------------------
   La hoja es el panel de control del dueño, no un volcado de datos. Esto le
   pone encabezado de color, anchos, formatos de moneda y fecha, y listas
   desplegables en todo campo donde una errata rompe algo: un "confirmado" con
   minúscula o un "Si" sin tilde y el inventario deja de moverse.

   Es idempotente: se puede ejecutar mil veces. Corre al instalar y desde el
   menú de la hoja > Actualizar tablero e inventario.
   ========================================================================== */
var TINTA_HOJA = '#1A1A1A';
var LINEA_HOJA = '#D9D9D6';

/* ==========================================================================
   ¿ESTÁ ESTA TIENDA TERMINADA?
   --------------------------------------------------------------------------
   El diagnóstico contesta «¿está funcionando?». Esta es otra pregunta —«¿está
   terminada?»— y hasta ahora no la contestaba nadie. Se comprobaban cinco
   claves al escribir el index, y solo esas cinco: una tienda podía salir al
   aire sin llave de pago, sin datos legales y sin correo de resumen, y nada lo
   decía. El que monta se acordaba, o no.

   Con una tienda eso se lleva en la cabeza. Con ocho, no — y esa es justamente
   la condición para poder añadir la siguiente: que lo que falta se pueda MIRAR
   en vez de recordarlo.

   DOS NIVELES, Y LA DIFERENCIA IMPORTA. Lo que BLOQUEA es lo que rompe la venta:
   sin celular el pedido no llega a ninguna parte, sin llave de pago el comprador
   termina el pedido y no tiene cómo pagar —que es el agujero que abre a
   propósito sacar la llave de la página—. Lo que AVISA deja la tienda vendiendo
   pero a medias, y merece salir de la lista antes de cobrarle a nadie.

   Un valor entre corchetes cuenta como vacío: es lo que deja instalar() para
   que se vea que falta, y publicar así anuncia la tienda como
   «[NOMBRE DEL COMERCIO]».
   ========================================================================== */
var LISTA_DE_ALTA = [
  { clave: 'negocio',           bloquea: true,
    porQue: 'sin nombre, la tienda se anuncia con un corchete' },
  { clave: 'whatsapp',          bloquea: true,
    porQue: 'sin celular el pedido no llega a ninguna parte' },
  { clave: 'sitio_url',         bloquea: true,
    porQue: 'sin dirección no funcionan «Ver mi tienda» ni la comprobación de publicación' },
  { clave: 'pago_llave',        bloquea: true,
    porQue: 'el comprador termina el pedido y no tiene cómo pagar' },

  { clave: 'pago_titular',      porQue: 'el comprador no sabe a nombre de quién transfiere' },
  { clave: 'pago_entidad',      porQue: 'ni a qué banco o billetera' },
  { clave: 'repositorio',       porQue: '«Publicar ahora» no puede disparar nada' },
  { clave: 'correo_resumen',    porQue: 'no llega el resumen diario del negocio' },
  { clave: 'sitio_titulo',      porQue: 'el enlace se comparte sin decir qué es' },
  { clave: 'sitio_descripcion', porQue: 'el texto que se ve debajo del enlace compartido queda en blanco' },
  { clave: 'empresa_razon',     porQue: 'el texto de tratamiento de datos queda sin responsable' },
  { clave: 'empresa_nit',       porQue: 'la Ley 1581 pide identificar al responsable del tratamiento' },
  { clave: 'empresa_correo',    porQue: 'no hay dónde ejercer los derechos de datos personales' },
  { clave: 'empresa_direccion', porQue: 'el aviso de privacidad queda incompleto' },
  { clave: 'empresa_ciudad',    porQue: 'el aviso de privacidad no dice dónde se ejercen los derechos' },
  { clave: 'respaldo_carpeta',  porQue: 'no se guarda copia semanal de la hoja' }
];

function sinLlenar(valor) {
  var t = String(valor === null || valor === undefined ? '' : valor).trim();
  return !t || /^\[.*\]$/.test(t);
}

function revisarTienda(cfg) {
  var c = cfg || leerConfiguracion();
  var bloquean = [], avisan = [];
  LISTA_DE_ALTA.forEach(function (x) {
    if (!sinLlenar(c[x.clave])) return;
    (x.bloquea ? bloquean : avisan).push({ clave: x.clave, porQue: x.porQue });
  });
  return { lista: !bloquean.length && !avisan.length,
           puedeVender: !bloquean.length,
           bloquean: bloquean, avisan: avisan };
}

/* ==========================================================================
   EL CICLO DE VIDA DE UN PEDIDO, EN UN SOLO SITIO.
   --------------------------------------------------------------------------
   Eran tres estados —Por confirmar, Confirmado, Anulado— y describían mal lo
   que pasa de verdad: entre «me llegó» y «lo pagó» hay una espera que el
   comercio vive todos los días, y entre «lo pagó» y «lo recibió» hay dos pasos
   más. Un pedido pagado y sin despachar y uno ya entregado no son lo mismo, y
   con tres estados se veían iguales.

   LA REGLA QUE MANDA: el inventario se descuenta al pasar a PAGADO, y solo
   ahí. No al llegar el pedido —un carrito abierto en WhatsApp no es una venta,
   y reservar stock por eso vacía el catálogo con pedidos que nunca se pagan— y
   no antes. Despachado y entregado vienen DESPUÉS de pagado, así que siguen
   contando como vendido: si no, despachar un pedido le devolvería el stock.

   CONVIVENCIA. Cada estado nuevo sabe a qué viejo reemplaza, así que una hoja
   que todavía diga «Confirmado» se sigue leyendo bien. `migrarEstados()` la
   pone al día, y solo entonces se retiran los viejos. El backend acepta los
   dos mientras tanto — que es lo que evita que una tienda se quede muda el día
   del despliegue.

   Y ESTO ES LA ÚNICA FUENTE. Antes la pregunta «¿esto ya se vendió?» estaba
   escrita dos veces —una en las métricas y otra en el inventario— con la misma
   frase copiada, `indexOf('confirmado')`. Dos copias de la misma regla es el
   patrón 2 de la bitácora: basta tocar una para que el tablero y el stock
   empiecen a contar cosas distintas.
   ========================================================================== */
var ESTADOS = [
  { id: 'nuevo',          rotulo: 'Nuevo',             viejo: 'Por confirmar' },
  { id: 'pendiente_pago', rotulo: 'Pendiente de pago', viejo: '' },
  { id: 'pagado',         rotulo: 'Pagado',            viejo: 'Confirmado', vendido: true },
  { id: 'despachado',     rotulo: 'Despachado',        viejo: '', vendido: true },
  { id: 'entregado',      rotulo: 'Entregado',         viejo: '', vendido: true },
  { id: 'cancelado',      rotulo: 'Cancelado',         viejo: 'Anulado' }
];

var ESTADOS_PEDIDO = ESTADOS.map(function (e) { return e.rotulo; });

/* Compara sin tildes, sin mayúsculas y sin espacios de más, porque una celda
   escrita a mano trae de todo. Lo que NO hace es adivinar por trozos: buscar
   «confirmado» dentro del texto es lo que hacía que «Confirmado el pago»
   contara como venta y «pendiente de confirmado» también. */
function llano(t) {
  return String(t === null || t === undefined ? '' : t)
    .toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
    .replace(/\s+/g, ' ').trim();
}

/* El estado que corresponde a lo que diga la celda, o null si no se reconoce.
   NULL NO ES «NO VENDIDO»: es «no se sabe», y quien lo reciba tiene que
   tratarlo como tal. Ver aplicarInventario(). */
function estadoDe(texto) {
  var t = llano(texto);
  if (!t) return null;
  for (var i = 0; i < ESTADOS.length; i++) {
    var e = ESTADOS[i];
    if (t === llano(e.id) || t === llano(e.rotulo) ||
        (e.viejo && t === llano(e.viejo))) return e;
  }
  return null;
}

/** ¿Esta línea ya es una venta? Es la única definición que hay. */
function esVenta(texto) {
  var e = estadoDe(texto);
  return !!(e && e.vendido);
}

/** ¿Y esta se canceló? Un pedido cancelado no espera nada de nadie. */
function esCancelado(texto) {
  var e = estadoDe(texto);
  return !!e && e.id === 'cancelado';
}

/* Las celdas de Estado que no se pudieron leer. Se llena al mover el
   inventario y la vacía el diagnóstico, igual que CELDAS_ILEGIBLES. */
var ESTADOS_ILEGIBLES = [];

/* ==========================================================================
   MIGRAR LOS ESTADOS VIEJOS, UNA VEZ Y SIN PERDER NADA.
   --------------------------------------------------------------------------
   El backend acepta los viejos, así que esto no es urgente ni arriesgado: es
   lo que permite que la lista desplegable pase a ofrecer solo los nuevos sin
   dejar media hoja con un triángulo de advertencia.

   Solo toca las celdas cuyo texto es EXACTAMENTE un estado viejo conocido.
   Una celda con otra cosa se queda como está y la denuncia el diagnóstico: si
   esto «arreglara» lo que no entiende, sería justo lo que no se le puede
   pedir a una migración.
   ========================================================================== */
function migrarEstados() {
  var hp = elLibro().getSheetByName(H_PEDIDOS);
  if (!hp || hp.getLastRow() < 2) return 0;

  var rango = hp.getRange(2, COL_ESTADO, hp.getLastRow() - 1, 1);
  var celdas = rango.getValues();
  var cambios = 0;

  var nuevos = celdas.map(function (f) {
    var t = llano(f[0]);
    if (!t) return f;
    for (var i = 0; i < ESTADOS.length; i++) {
      var e = ESTADOS[i];
      if (e.viejo && t === llano(e.viejo)) { cambios++; return [e.rotulo]; }
    }
    return f;
  });

  if (cambios) rango.setValues(nuevos);
  return cambios;
}
var SI_NO          = ['Sí', 'No'];
var TIPOS_CUPON    = ['porcentaje', 'fijo', 'envio'];

function lista(opciones, permitirOtros, ayuda) {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(opciones, true)
    .setAllowInvalid(!!permitirOtros)
    .setHelpText(ayuda || ('Elige de la lista: ' + opciones.join(', ')))
    .build();
}

function presentarHojas() {
  var libro = elLibro();
  var cfg = leerConfiguracion();
  var VERDE = cfg.color_secundario || '#1B5E3A';

  var encabezar = function (h, anchos) {
    var cols = Math.max(h.getLastColumn(), (anchos || []).length, 1);
    h.getRange(1, 1, 1, cols)
     .setBackground(VERDE).setFontColor('#FFFFFF').setFontWeight('bold')
     .setFontSize(10).setVerticalAlignment('middle').setWrap(true);
    h.setRowHeight(1, 34);
    h.setFrozenRows(1);
    (anchos || []).forEach(function (a, i) { if (a) h.setColumnWidth(i + 1, a); });
    var filas = Math.max(h.getLastRow() - 1, 1);
    h.getRange(2, 1, filas, cols)
     .setFontSize(10).setFontColor(TINTA_HOJA).setVerticalAlignment('middle');
    return { cols: cols, filas: filas };
  };

  // ---- Configuración ----
  var cfgH = libro.getSheetByName(H_CONFIG);
  if (cfgH) {
    encabezar(cfgH, [220, 430, 400]);
    var n = Math.max(cfgH.getLastRow() - 1, 1);
    cfgH.getRange(2, 1, n, 1).setFontWeight('bold').setFontFamily('Roboto Mono').setFontSize(9);
    cfgH.getRange(2, 2, n, 2).setWrap(true);
    cfgH.getRange(2, 3, n, 1).setFontColor('#777777').setFontSize(9);
    validarPorClave(cfgH, 'correo_siempre', lista(SI_NO, false));
    validarPorClave(cfgH, 'fotos_webp', lista(SI_NO, false));
    sincronizarColores();
  }

  // ---- Catálogo ----
  var cat = libro.getSheetByName(H_CATALOGO);
  if (cat) {
    var c = encabezar(cat, [110, 230, 130, 120, 100, 80, 380, 320, 100, 90, 120, 110, 100]);
    cat.getRange(2, 5, c.filas, 1).setNumberFormat('"$"#,##0');
    cat.getRange(2, 6, c.filas, 1).setNumberFormat('#,##0').setHorizontalAlignment('center');
    cat.getRange(2, 1, c.filas, 1).setFontFamily('Roboto Mono').setFontSize(9);
    cat.getRange(2, 7, c.filas, 2).setWrap(true).setFontSize(9);
    cat.getRange(2, 9, c.filas, 2).setHorizontalAlignment('center');
    cat.getRange(2, 4, c.filas, 1).setDataValidation(lista(categoriasDelCatalogo(), true,
      'Elige una categoría o escribe una nueva'));
    cat.getRange(2, 9, c.filas, 2).setDataValidation(lista(SI_NO, false));
  }

  // ---- Envíos ----
  var env = libro.getSheetByName(H_ENVIOS);
  if (env) {
    var e = encabezar(env, [140, 320, 120]);
    env.getRange(2, 1, e.filas, 1).setFontFamily('Roboto Mono').setFontSize(9);
    env.getRange(2, 3, e.filas, 1).setNumberFormat('"$"#,##0');
  }

  // ---- Cupones ----
  var cup = libro.getSheetByName(H_CUPONES);
  if (cup) {
    var u = encabezar(cup, [140, 110, 100, 110, 110, 110, 130, 90, 260]);
    cup.getRange(2, 1, u.filas, 1).setFontFamily('Roboto Mono').setFontWeight('bold');
    cup.getRange(2, 3, u.filas, 2).setNumberFormat('#,##0');
    cup.getRange(2, 5, u.filas, 1).setNumberFormat('yyyy-mm-dd').setHorizontalAlignment('center');
    cup.getRange(2, 6, u.filas, 2).setHorizontalAlignment('center');
    cup.getRange(2, 8, u.filas, 1).setHorizontalAlignment('center');
    cup.getRange(2, 9, u.filas, 1).setWrap(true).setFontSize(9).setFontColor('#777777');
    cup.getRange(2, 2, u.filas, 1).setDataValidation(lista(TIPOS_CUPON, false,
      'porcentaje = % de descuento · fijo = pesos · envio = envío gratis'));
    cup.getRange(2, 8, u.filas, 1).setDataValidation(lista(SI_NO, false));
    cup.getRange(2, 7, u.filas, 1).setFontColor('#777777');   // lo lleva el script
  }

  // ---- Pedidos: la lista del Estado es la más importante de todas ----
  var ped = libro.getSheetByName(H_PEDIDOS);
  if (ped) {
    var p = encabezar(ped, [140, 90, 90, 130, 130, 110, 220, 100, 80, 110, 110, 120, 110, 110, 120, 130]);
    ped.setFrozenColumns(2);
    ped.getRange(2, 1, p.filas, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    ped.getRange(2, 2, p.filas, 2).setFontFamily('Roboto Mono').setHorizontalAlignment('center');
    ped.getRange(2, 9, p.filas, 1).setHorizontalAlignment('center');
    ped.getRange(2, 10, p.filas, 3).setNumberFormat('"$"#,##0');
    ped.getRange(2, 13, p.filas, 1).setHorizontalAlignment('center')
       .setFontSize(9).setFontColor('#777777');
    ped.getRange(2, COL_ESTADO, Math.max(p.filas, 500), 1)
       .setDataValidation(lista(ESTADOS_PEDIDO, false,
         'PAGADO descuenta el inventario, y solo Pagado. Despachado y Entregado ' +
         'vienen después, así que lo mantienen descontado. Cancelado lo devuelve.'))
       .setHorizontalAlignment('center').setFontWeight('bold');
  }

  // ---- Validaciones ----
  var val = libro.getSheetByName(H_VALIDACIONES);
  if (val) {
    var v2 = encabezar(val, [140, 90, 120, 130, 130, 110, 110, 100, 120, 320, 380]);
    val.getRange(2, 1, v2.filas, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    val.getRange(2, 2, v2.filas, 1).setFontFamily('Roboto Mono').setHorizontalAlignment('center');
    val.getRange(2, 4, v2.filas, 6).setNumberFormat('"$"#,##0');
    val.getRange(2, 10, v2.filas, 1).setFontSize(9).setFontColor('#777777');
  }

  // ---- Más vendidos ----
  var res = libro.getSheetByName(H_RESUMEN);
  if (res) {
    var r2 = encabezar(res, [260, 110, 140, 140, 170]);
    res.getRange(2, 3, r2.filas, 1).setNumberFormat('#,##0').setHorizontalAlignment('center');
    res.getRange(2, 4, r2.filas, 1).setNumberFormat('"$"#,##0');
    res.getRange(2, 5, r2.filas, 1).setHorizontalAlignment('center');
    res.getRange(2, 2, r2.filas, 1).setFontFamily('Roboto Mono').setFontSize(9);
  }

  // ---- Errores ----
  var err = libro.getSheetByName(H_ERRORES);
  if (err) {
    var e2 = encabezar(err, [150, 320, 460]);
    err.getRange(2, 1, e2.filas, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    err.getRange(2, 2, e2.filas, 2).setWrap(true).setFontSize(9);
    err.getRange(2, 2, e2.filas, 1).setFontColor('#B3261E');
  }
  return true;
}

function categoriasDelCatalogo() {
  var vistas = {}, salida = [];
  filas(H_CATALOGO).forEach(function (f) {
    var c = String(f[3]).trim();
    if (c && !vistas[c]) { vistas[c] = true; salida.push(c); }
  });
  return salida.length ? salida : ['General'];
}

function validarPorClave(h, clave, regla) {
  var datos = filas(H_CONFIG);
  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === clave) {
      h.getRange(i + 2, 2).setDataValidation(regla);
      return;
    }
  }
}

/* ==========================================================================
   LOS COLORES SE PUEDEN PINTAR
   --------------------------------------------------------------------------
   Pedirle un código hexadecimal a alguien que no programa es pedirle que
   adivine. Aquí el dueño PINTA la celda del valor con el balde de pintura de
   Google, y el código sale solo.

   Funciona en las dos direcciones:
   - Escribió un código -> alEditar() pinta la celda con ese color.
   - Pintó la celda     -> esto lee el relleno y escribe el código.

   Cuál gana: si el relleno no coincide con el valor escrito, es que acaba de
   pintar, y manda el relleno. Como al escribir se pinta en el acto, las dos
   cosas nunca se pelean.
   ========================================================================== */
var CLAVES_COLOR = ['color_principal', 'color_secundario', 'color_alterno'];

function esColor(t) { return /^#[0-9a-fA-F]{6}$/.test(String(t).trim()); }

function normalizarColor(t) { return String(t).trim().toUpperCase(); }

function sincronizarColores() {
  var h = elLibro().getSheetByName(H_CONFIG);
  if (!h) return 0;
  var datos = filas(H_CONFIG);
  var cambios = 0;
  for (var i = 0; i < datos.length; i++) {
    var clave = String(datos[i][0]).trim();
    if (CLAVES_COLOR.indexOf(clave) === -1) continue;
    var celda = h.getRange(i + 2, 2);
    var valor = normalizarColor(datos[i][1]);
    var relleno = normalizarColor(celda.getBackground());
    var blanco = relleno === '#FFFFFF' || relleno === '' || relleno === '#000000';

    if (!blanco && esColor(relleno) && relleno !== valor) {
      celda.setValue(relleno);            // pintó la celda: manda el relleno
      valor = relleno;
      cambios++;
    }
    if (esColor(valor)) {
      celda.setBackground(valor)          // y siempre queda pintada del color que dice
          .setFontColor(contraste(valor))
          .setFontFamily('Roboto Mono').setFontWeight('bold')
          .setHorizontalAlignment('center');
    }
  }
  if (cambios) cacheFuera();
  return cambios;
}

/* Al revés que sincronizarColores: aquí manda lo ESCRITO.
   Se llama desde alEditar, o sea justo después de que el dueño teclea un
   código. Si en vez de esto corriera la sincronización completa, el relleno
   viejo pisaría el valor recién escrito. */
function pintarColoresDesdeValor() {
  var h = elLibro().getSheetByName(H_CONFIG);
  if (!h) return 0;
  var pintadas = 0;
  filas(H_CONFIG).forEach(function (f, i) {
    if (CLAVES_COLOR.indexOf(String(f[0]).trim()) === -1) return;
    var valor = normalizarColor(f[1]);
    if (!esColor(valor)) return;
    h.getRange(i + 2, 2).setBackground(valor).setFontColor(contraste(valor))
     .setFontFamily('Roboto Mono').setFontWeight('bold').setHorizontalAlignment('center');
    pintadas++;
  });
  return pintadas;
}

/* Texto blanco o negro según qué se lea mejor sobre ese fondo. */
function contraste(hex) {
  var r = parseInt(hex.substr(1, 2), 16),
      g = parseInt(hex.substr(3, 2), 16),
      b = parseInt(hex.substr(5, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1A1A1A' : '#FFFFFF';
}

function cacheFuera() {
  try { CacheService.getScriptCache().remove('catalogo'); } catch (e) {}
}

/* ==========================================================================
   CORREO DIARIO
   --------------------------------------------------------------------------
   Todo se maneja desde la pestaña Configuración. Escribes tu correo en
   correo_resumen, y el resumen empieza a llegar. No hay que tocar el código
   ni volver a publicar nada.

       correo_resumen    tu@correo.com, otro@correo.com
       correo_hora       7          (de 0 a 23)
       correo_siempre    No         (No = solo cuando hay algo que atender)
       correo_ultimo     lo escribe el script; no se edita

   Por qué se revisa cada hora en vez de programar un disparador a las 7:
   la hora vive en la hoja. Si fuera un disparador, cambiarla obligaría a
   volver al editor. Así, cambias el número y mañana llega a esa hora. De
   paso se cura solo: si Google se saltó la revisión de las 7, la de las 8
   lo manda igual.

   Gasta 1 de los 100 correos diarios que regala Apps Script.
   ========================================================================== */
function revisarCorreo() {
  try {
    var c = leerConfiguracion();
    if (!listaDeCorreos(c.correo_resumen).length) return 'sin destinatarios';

    var ahora = new Date();
    var hora = Math.floor(Number(c.correo_hora));
    if (!isFinite(hora)) hora = 7;
    hora = Math.min(23, Math.max(0, hora));
    if (ahora.getHours() < hora) return 'todavía no es la hora';

    var hoy = diaClave(ahora);
    if (String(c.correo_ultimo).trim() === hoy) return 'ya salió hoy';

    var salida = enviarResumen(false);
    anotarUltimoCorreo(hoy);      // aunque no hubiera nada: no insistir cada hora
    return salida;
  } catch (e) {
    registrarError('correo diario: ' + e.message, null);
    return 'error';
  }
}

/* Desde el menú. Manda aunque no sea la hora y aunque no haya nada, para que
   puedas comprobar que llega antes de confiarle el negocio. */
function enviarResumenAhora() {
  var c = leerConfiguracion();
  var para = listaDeCorreos(c.correo_resumen);
  if (!para.length) {
    return { tipo: 'aviso', texto:
      'Todavía no hay a quién mandárselo. Escribe tu correo en la fila ' +
      'correo_resumen de la pestaña Configuración.' };
  }
  var salida = enviarResumen(true);
  return { tipo: 'aviso', texto: salida === 'enviado'
    ? 'Resumen enviado a ' + para.join(', ')
    : 'No salió. Motivo: ' + salida };
}

function listaDeCorreos(texto) {
  return String(texto || '').split(/[,;\s]+/)
    .map(function (x) { return x.trim(); })
    .filter(function (x) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x); })
    .slice(0, 10);
}

function diaClave(d) {
  var m = d.getMonth() + 1, dia = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dia < 10 ? '0' : '') + dia;
}

function anotarUltimoCorreo(valor) {
  var h = elLibro().getSheetByName(H_CONFIG);
  if (!h) return;
  var datos = filas(H_CONFIG);
  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === 'correo_ultimo') {
      h.getRange(i + 2, 2).setValue(valor);
      return;
    }
  }
  h.appendRow(['correo_ultimo', valor, 'Lo escribe el script: la fecha del último resumen que salió. No lo edites']);
}

function enviarResumen(forzado) {
  var c = leerConfiguracion();
  var para = listaDeCorreos(c.correo_resumen);
  if (!para.length) return 'sin destinatarios';

  var m = calcularMetricas();
  var hayAlgo = m.porConfirmar > 0 || m.errores > 0 || m.agotados > 0 ||
                m.pocos > 0 || m.ayer.enviados > 0 || m.ayer.ventas > 0;
  if (!hayAlgo && !forzado && !esSi(c.correo_siempre)) return 'nada que contar';

  if (typeof MailApp !== 'undefined' && MailApp.getRemainingDailyQuota &&
      MailApp.getRemainingDailyQuota() < 1) {
    registrarError('correo diario: se acabó la cuota de correos de hoy', null);
    return 'sin cuota';
  }

  var adjuntos = exportarMesAnterior(c, m);
  var negocio = m.cfg.negocio || 'Tienda';

  MailApp.sendEmail({
    to: para.join(','),
    subject: asuntoResumen(negocio, m),
    htmlBody: cuerpoResumen(negocio, m),
    name: negocio,
    attachments: adjuntos
  });
  return 'enviado';
}

/* El asunto tiene que servir SIN abrir el correo. Primero lo que hay que
   hacer, después la plata. */
function asuntoResumen(negocio, m) {
  var accion;
  if (m.viejos > 0)            accion = varios(m.viejos, 'pedido espera', 'pedidos esperan') + ' hace más de un día';
  else if (m.porConfirmar > 0) accion = varios(m.porConfirmar, 'pedido por confirmar', 'pedidos por confirmar');
  else if (m.errores > 0)      accion = varios(m.errores, 'error en la hoja', 'errores en la hoja');
  else if (m.agotados > 0)     accion = varios(m.agotados, 'producto agotado', 'productos agotados');
  else                         accion = 'al día';
  var plata = m.ayer.ventas > 0 ? pesos(m.ayer.ventas) + ' ayer' : 'sin ventas ayer';
  return negocio + ' · ' + accion + ' · ' + plata;
}

function varios(n, uno, muchos) { return n + ' ' + (n === 1 ? uno : muchos); }

function pesos(n) {
  var t = String(Math.round(Number(n) || 0));
  var salida = '';
  for (var i = 0; i < t.length; i++) {
    if (i > 0 && (t.length - i) % 3 === 0) salida += '.';
    salida += t.charAt(i);
  }
  return '$' + salida;
}

function escaparHtml(t) {
  return String(t).replace(/[&<>"]/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
  });
}

function cuerpoResumen(negocio, m) {
  var A = m.A, B = m.B, ayer = m.ayer;
  var gris = '#6B6B6B', linea = '#E6E6E6', rojo = '#B3261E';
  var caja = 'margin:0 0 22px;padding:0';
  var titulo = 'margin:0 0 8px;font:600 11px/1.2 -apple-system,Segoe UI,Roboto,sans-serif;' +
               'letter-spacing:.09em;text-transform:uppercase;color:' + gris;
  var grande = 'margin:0;font:700 26px/1.15 -apple-system,Segoe UI,Roboto,sans-serif;color:#111';
  var normal = 'margin:6px 0 0;font:400 14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#333';
  var chico  = 'margin:4px 0 0;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:' + gris;

  var h = [];
  h.push('<div style="max-width:600px;margin:0 auto;padding:26px 22px;' +
         'font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#FFF">');
  h.push('<p style="' + chico + ';margin:0 0 20px">' + escaparHtml(negocio) + ' · ' +
         escaparHtml(fechaLarga(m.ahora)) + '</p>');

  // ── 1. Lo accionable primero ──
  if (m.pendientes.length) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Para hacer hoy</p>');
    h.push('<p style="' + grande + '">' + m.porConfirmar +
           (m.porConfirmar === 1 ? ' pedido por confirmar' : ' pedidos por confirmar') + '</p>');
    if (m.viejos > 0)
      h.push('<p style="' + normal + ';color:' + rojo + '"><strong>' + m.viejos +
             (m.viejos === 1 ? ' lleva' : ' llevan') + ' más de 24 horas esperando.</strong></p>');
    h.push('<table style="width:100%;border-collapse:collapse;margin-top:12px;' +
           'font:400 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif">');
    m.pendientes.slice(0, 10).forEach(function (p) {
      var viejo = p.horas >= 24;
      h.push('<tr>' +
        '<td style="padding:7px 0;border-top:1px solid ' + linea + ';color:#111"><strong>' +
          escaparHtml(p.codigo) + '</strong></td>' +
        '<td style="padding:7px 0;border-top:1px solid ' + linea + ';color:' + gris + '">' +
          escaparHtml(p.ciudad || '—') + '</td>' +
        '<td style="padding:7px 0;border-top:1px solid ' + linea + ';text-align:right;color:#111">' +
          pesos(p.total) + '</td>' +
        '<td style="padding:7px 0 7px 14px;border-top:1px solid ' + linea + ';text-align:right;' +
          'white-space:nowrap;color:' + (viejo ? rojo : gris) + '">' + hacerRato(p.horas) + '</td>' +
        '</tr>');
    });
    h.push('</table>');
    if (m.pendientes.length > 10)
      h.push('<p style="' + chico + '">y ' + (m.pendientes.length - 10) + ' más en la hoja.</p>');
    h.push('</div>');
  } else {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Para hacer hoy</p>');
    h.push('<p style="' + grande + '">Nada pendiente</p>');
    h.push('<p style="' + chico + '">Todos los pedidos están confirmados o anulados.</p>');
    h.push('</div>');
  }

  // ── 2. Ayer ──
  h.push('<div style="' + caja + '">');
  h.push('<p style="' + titulo + '">Ayer</p>');
  h.push('<p style="' + grande + '">' + pesos(ayer.ventas) + '</p>');
  h.push('<p style="' + normal + '">' + ayer.confirmados +
         (ayer.confirmados === 1 ? ' pedido confirmado' : ' pedidos confirmados') +
         ' · llegaron ' + ayer.enviados + '</p>');
  h.push('</div>');

  // ── 3. El mes ──
  h.push('<div style="' + caja + '">');
  h.push('<p style="' + titulo + '">Este mes</p>');
  h.push('<p style="' + grande + '">' + pesos(A.ventas) + '</p>');
  h.push('<p style="' + normal + '">' + A.confirmados +
         (A.confirmados === 1 ? ' venta' : ' ventas') + ' · ticket promedio ' + pesos(A.ticket) + '</p>');
  h.push('<p style="' + chico + '">' + (B.confirmados
      ? 'Mes anterior completo: ' + pesos(B.ventas) + ' en ' + varios(B.confirmados, 'venta', 'ventas') + '.'
      : 'El mes pasado no hubo ventas confirmadas.') + '</p>');
  h.push('</div>');

  // ── 4. El embudo, en una línea ──
  if (A.carritos > 0) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Embudo del mes</p>');
    h.push('<p style="' + normal + ';margin-top:0">De <strong>' + A.carritos +
           '</strong> carritos armados, <strong>' + A.enviados + '</strong> llegaron a WhatsApp (' +
           Math.round(A.tasaEnvio * 100) + '%) y <strong>' + A.confirmados +
           '</strong> se cerraron (' + Math.round(A.tasaCierre * 100) + '%).</p>');
    h.push('<p style="' + chico + '">Si cae el primero, revisa precios o envío. Si cae el segundo, la conversación de WhatsApp.</p>');
    h.push('</div>');
  }

  // ── 5. Inventario, solo si hay algo ──
  if (m.agotados || m.pocos) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Inventario</p>');
    if (m.agotados)
      h.push('<p style="' + normal + ';color:' + rojo + '"><strong>Agotados:</strong> ' +
             escaparHtml(m.listaAgotados.join(', ')) + '</p>');
    if (m.pocos)
      h.push('<p style="' + normal + '"><strong>Quedan pocas:</strong> ' +
             escaparHtml(m.listaPocos.join(', ')) + '</p>');
    h.push('</div>');
  }

  // ── 6. Errores ──
  if (m.errores) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Errores</p>');
    h.push('<p style="' + normal + ';color:' + rojo + '">' +
           varios(m.errores, 'fila', 'filas') + ' en la pestaña Errores: ' +
           'alguien mandó algo que la hoja no entendió.</p>');
    h.push('</div>');
  }

  h.push('<p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ' + linea + '">' +
         '<a href="' + escaparHtml(m.url) + '" style="font:600 14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;' +
         'color:#111">Abrir la hoja →</a></p>');
  h.push('<p style="' + chico + ';margin-top:14px">Este resumen sale de la pestaña Configuración. ' +
         'Para cambiar la hora o dejar de recibirlo, edita correo_hora o borra correo_resumen.</p>');
  h.push('</div>');
  return h.join('');
}

function hacerRato(horas) {
  if (horas < 1) return 'recién';
  if (horas < 24) return 'hace ' + horas + ' h';
  var d = Math.floor(horas / 24);
  return 'hace ' + d + (d === 1 ? ' día' : ' días');
}

function fechaLarga(d) {
  var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()];
}

/* El primer correo de cada mes lleva adjunto el mes anterior en CSV. Es el
   respaldo que reemplazó al respaldo automático: el historial de versiones de
   Sheets cubre el accidente, esto cubre perder la cuenta de Google. */
function exportarMesAnterior(c, m) {
  try {
    var ahora = m.ahora;
    var mesAhora = ahora.getFullYear() + '-' + (ahora.getMonth() + 1);
    var ultimo = String(c.correo_ultimo || '').trim();
    if (ultimo) {
      var partes = ultimo.split('-');
      if (partes.length === 3 && (partes[0] + '-' + Number(partes[1])) === mesAhora) return [];
    }
    var ref = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    var lineas = [ENCABEZADO_PEDIDOS.join(',')];
    filas(H_PEDIDOS).forEach(function (f) {
      var fecha = f[0] instanceof Date ? f[0] : new Date(f[0]);
      if (isNaN(fecha.getTime())) return;
      if (fecha.getFullYear() !== ref.getFullYear() || fecha.getMonth() !== ref.getMonth()) return;
      lineas.push(f.slice(0, ENCABEZADO_PEDIDOS.length).map(function (x) {
        var t = x instanceof Date ? diaClave(x) : String(x === undefined || x === null ? '' : x);
        return '"' + t.replace(/"/g, '""') + '"';
      }).join(','));
    });
    if (lineas.length < 2) return [];
    var mm = ref.getMonth() + 1;
    var nombre = 'pedidos-' + ref.getFullYear() + '-' + (mm < 10 ? '0' : '') + mm + '.csv';
    // El BOM hace que Excel abra bien los acentos.
    return [Utilities.newBlob('﻿' + lineas.join('\n'), 'text/csv', nombre)];
  } catch (e) {
    registrarError('export mensual: ' + e.message, null);
    return [];
  }
}

/* ==========================================================================
   INVENTARIO  —  se mueve cuando TÚ cambias el Estado del pedido
   --------------------------------------------------------------------------
   Marcas un pedido como "Confirmado" y el stock del catálogo baja. Si te
   arrepientes y lo cambias a "Anulado" o lo devuelves a "Por confirmar", el
   stock vuelve a subir.

   La columna Inventario de cada línea es la que hace esto seguro: dice si esa
   línea ya se descontó. Por eso puedes confirmar, deshacer y volver a
   confirmar sin que el inventario se descuadre, y por eso da igual cuántas
   veces se ejecute esto.

   No es automático desde la tienda a propósito: un pedido que se abrió en
   WhatsApp no es una venta. La venta la confirmas tú.
   ========================================================================== */
function aplicarInventario() {
  var libro = elLibro();
  var hp = libro.getSheetByName(H_PEDIDOS);
  var hc = libro.getSheetByName(H_CATALOGO);
  if (!hp || !hc || hp.getLastRow() < 2 || hc.getLastRow() < 2) return 0;

  var anchoP = Math.max(hp.getLastColumn(), COL_INVENTARIO);
  var pedidos = hp.getRange(2, 1, hp.getLastRow() - 1, anchoP).getValues();
  var cat = hc.getRange(2, 1, hc.getLastRow() - 1, 10).getValues();

  var filaDe = {};
  cat.forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (id) filaDe[id] = i;
  });

  var cambios = 0;
  ESTADOS_ILEGIBLES = [];
  var marcas = pedidos.map(function (f, indice) {
    var estado = estadoDe(f[COL_ESTADO - 1]);
    var descontado = String(f[COL_INVENTARIO - 1]).toLowerCase().indexOf('descontado') !== -1;
    var id   = String(f[7]).trim();
    var cant = Number(f[8]) || 0;
    var i    = filaDe[id];

    if (i === undefined || cant < 1) return [f[COL_INVENTARIO - 1] || ''];

    /* UN ESTADO QUE NO SE RECONOCE NO ES «NO VENDIDO»: ES UNA ERRATA.
       Antes, cualquier cosa que no dijera «confirmado» devolvía el stock al
       catálogo. Así, escribir mal una celda de una venta ya pagada resucitaba
       inventario que estaba vendido, en silencio, y el catálogo pasaba a
       ofrecer unidades que no existen.

       Ahora no se toca nada y se anota. Quedarse quieto es reversible; devolver
       stock que ya se vendió, no. El diagnóstico lo saca por su nombre. */
    if (!estado) {
      /* Una celda VACÍA no es una errata: es una fila a medio escribir, y en
         una hoja de cálculo eso pasa todo el rato. No se denuncia. */
      if (llano(f[COL_ESTADO - 1]) && ESTADOS_ILEGIBLES.length < 20) {
        ESTADOS_ILEGIBLES.push('Pedidos D' + (indice + 2) + ' dice "' +
          String(f[COL_ESTADO - 1]).slice(0, 24) + '"');
      }
      return [f[COL_INVENTARIO - 1] || ''];
    }

    var confirmado = !!estado.vendido;

    if (confirmado && !descontado) {
      cat[i][COL_STOCK - 1] = Math.max(0, (Number(cat[i][COL_STOCK - 1]) || 0) - cant);
      cambios++;
      return ['Descontado'];
    }
    if (!confirmado && descontado) {
      cat[i][COL_STOCK - 1] = (Number(cat[i][COL_STOCK - 1]) || 0) + cant;
      cambios++;
      return ['Devuelto'];
    }
    return [f[COL_INVENTARIO - 1] || ''];
  });

  if (cambios) {
    hp.getRange(2, COL_INVENTARIO, marcas.length, 1).setValues(marcas);
    hc.getRange(2, COL_STOCK, cat.length, 1).setValues(cat.map(function (f) {
      return [f[COL_STOCK - 1]];
    }));
    // Que la tienda vea el stock nuevo de una vez y no dentro de un minuto.
    CacheService.getScriptCache().remove('catalogo');
  }
  return cambios;
}

/* Disparador de edición. Solo reacciona a la columna Estado de la hoja Pedidos:
   cualquier otra edición se ignora para no gastar cuota en balde. */
/* Un menú en la hoja, para no tener que entrar al editor de Apps Script cada vez
   que quieras rehacer las cuentas a mano. */
/* ══════════════════════════════════════════════════════════════════════════
   EL MENÚ DE LA HOJA
   --------------------------------------------------------------------------
   Aquí no hay interfaz: este proyecto no vive dentro de la hoja y no puede
   dibujar nada. Lo que hay es un catálogo de acciones que devuelven QUÉ
   mostrar, y stub.gs —treinta líneas dentro de la hoja— las pide por HTTPS y
   las muestra.

   La lista blanca no es decorativa: es lo único que separa "el menú puede
   pedir cinco cosas" de "cualquiera con la URL ejecuta cualquier función de
   este proyecto".
   ══════════════════════════════════════════════════════════════════════════ */
var ACCIONES_MENU = {
  publicar:      { rotulo: 'Publicar ahora',                        fn: publicarAhora },
  ver:           { rotulo: 'Ver mi tienda',                         fn: verMiTienda },
  actualizar:    { rotulo: 'Actualizar tablero e inventario',       fn: actualizarTodo },
  resumen:       { rotulo: 'Enviarme el resumen ahora',             fn: enviarResumenAhora },
  diagnostico:   { rotulo: 'Diagnóstico',                           fn: diagnostico },
  ayuda:         { rotulo: 'Ayuda',                                 fn: ayuda },
  /* FUERA DEL MENÚ, PERO VIVAS. `generarConfiguracion` la sigue usando la
     puerta ?a=bloques, que es como el montaje escribe el index.html. Se
     quitaron del menú porque existían cuando montar la tienda era copiar y
     pegar a mano: hoy eso lo hace un flujo, y ofrecerle al comerciante que
     genere bloques de HTML es ofrecerle un trabajo que ya no es suyo. */
  configuracion: { rotulo: 'Generar configuración para index.html', fn: generarConfiguracion,
                   fuera: true },
  inventario:    { rotulo: 'Generar inventario para index.html',    fn: generarInventario,
                   fuera: true }
};

/* PUBLICAR AHORA VA PRIMERO Y NO ES CASUALIDAD. Desde que el catálogo se hornea
   dentro del sitio, un cambio de precio espera un despliegue: el flujo de cada
   cuatro horas es el techo y este botón es el suelo. Es lo primero que un
   comerciante quiere después de tocar un precio. */
var ORDEN_MENU = ['publicar', 'ver', 'actualizar', 'resumen', 'diagnostico', 'ayuda'];
/* generarStub NO está en el menú de la hoja: se ejecuta desde el maestro, que
   es donde estás cuando montas la tienda. Ponerlo en la hoja sería ofrecerle al
   cliente que se regenere a sí mismo. */

function menuDeLaHoja() {
  return ORDEN_MENU.map(function (k) {
    return { id: k, rotulo: ACCIONES_MENU[k].rotulo };
  });
}

/* Que `ORDEN_MENU` y las acciones no se separen. Una opción en el orden que no
   existe deja la hoja pidiendo algo que no está; una acción viva fuera del
   orden es una función a la que solo se llega adivinando su id. Las dos son
   silenciosas, así que se comprueban aquí y en las baterías. */
function menuCuadra() {
  var faltan = ORDEN_MENU.filter(function (k) { return !ACCIONES_MENU[k]; });
  var sueltas = Object.keys(ACCIONES_MENU).filter(function (k) {
    return !ACCIONES_MENU[k].fuera && ORDEN_MENU.indexOf(k) === -1;
  });
  return { faltan: faltan, sueltas: sueltas, ok: !faltan.length && !sueltas.length };
}

function ejecutarAccion(id) {
  var accion = ACCIONES_MENU[id];
  if (!accion) return { tipo: 'aviso', texto: 'Esa opción del menú no existe.' };
  var salida = accion.fn();
  if (salida && salida.tipo) return salida;
  return { tipo: 'aviso', texto: String(salida === undefined ? 'Listo.' : salida) };
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLICAR AHORA
   --------------------------------------------------------------------------
   Desde que el catálogo se hornea dentro del sitio, tocar un precio en la hoja
   ya no lo pone en la calle: hay que publicar. El flujo de cada cuatro horas es
   el techo; esto es el suelo, y es lo primero que quiere quien acaba de
   corregir un precio.

   NO PUBLICA ESTE CÓDIGO. Dispara el flujo `fotos` del repositorio de la
   tienda, que es el único que ya sabe fusionar solo: hornea el catálogo, baja
   lo que haya nuevo en el Drive, corre TODAS las baterías, y solo fusiona si lo
   único que cambió son las fotos y el catálogo. Si cambió cualquier otra cosa,
   deja un pull request para una persona. Todo eso ya estaba probado: aquí solo
   se aprieta el botón.

   EL TOKEN, Y POR QUÉ ESTE Y NO OTRO. Va en las propiedades del script —
   Configuración del proyecto > Propiedades del script — con el nombre
   GITHUB_TOKEN, y tiene que ser fine-grained, de ESTE repositorio y con un solo
   permiso: Actions: Read and write. Con eso alcanza para disparar un flujo y
   para nada más: no puede escribir código, ni leer otros repositorios, ni tocar
   secretos. Las propiedades del script NO están cifradas, así que el permiso
   más pequeño posible no es una formalidad: es lo único que hay.
   ══════════════════════════════════════════════════════════════════════════ */
/* De cuándo es el catálogo que la tienda está sirviendo. Se le pregunta al
   sitio, no a la hoja: la hoja siempre está al día por definición y por eso no
   contesta nada útil. */
/* Lo que la tienda PUBLICADA está sirviendo ahora mismo. Se pide una sola vez
   por ejecución: el diagnóstico lo mira dos veces —la fecha y las fotos— y dos
   peticiones a la misma URL con un segundo de diferencia no dicen nada nuevo,
   pero sí gastan el cupo de UrlFetch. */
var CATALOGO_PUBLICADO = null;

function catalogoPublicado() {
  if (CATALOGO_PUBLICADO) return CATALOGO_PUBLICADO;
  var url = String(leerConfiguracion().sitio_url || '').trim().replace(/\/+$/, '');
  if (!url) return { ok: false, sinUrl: true, error: 'no sé la dirección' };
  try {
    var res = UrlFetchApp.fetch(url + '/catalogo.json',
                                { muteHttpExceptions: true, followRedirects: true });
    if (res.getResponseCode() !== 200) throw new Error('contestó ' + res.getResponseCode());
    return (CATALOGO_PUBLICADO = { ok: true, datos: JSON.parse(res.getContentText()) });
  } catch (e) {
    /* UN FALLO NO SE GUARDA. La caché existe para no pedir dos veces lo mismo
       cuando ya se sabe la respuesta; recordar «no se pudo» convierte un
       tropiezo de un segundo en el veredicto de toda la ejecución, y deja a la
       función mintiendo aunque la tienda ya conteste. Costo de no guardarlo:
       una segunda petición, y solo cuando ya algo iba mal. */
    return { ok: false, error: e.message };
  }
}

function publicacionDeLaTienda() {
  var pub = catalogoPublicado();
  if (pub.sinUrl) return 'Tu tienda: no sé la dirección (Configuración > sitio_url).';

  var pedida = '';
  try { pedida = PropertiesService.getScriptProperties()
                   .getProperty('PEDIDA_PUBLICACION') || ''; } catch (e) { }

  if (!pub.ok) {
    return 'Tu tienda está mostrando: NO SE PUDO COMPROBAR (' + pub.error + ').\n' +
           '   Si la tienda abre bien en el navegador, es que todavía no ha\n' +
           '   corrido una publicación. Usa «Publicar ahora».';
  }
  var d = pub.datos;

  var t = Date.parse(d.generado || '');
  if (!t) return 'Tu tienda está mostrando un catálogo sin fecha. Publica de nuevo.';

  var linea = 'Tu tienda está mostrando el catálogo del ' + haceCuanto(t) + '.';

  /* La comparación que de verdad contesta «¿ya llegó?»: se pidió publicar
     DESPUÉS de lo que se está sirviendo, y ya pasó tiempo de sobra. */
  var p = Date.parse(pedida || '');
  if (p && p > t) {
    var minutos = Math.round((Date.now() - p) / 60000);
    linea += minutos > 20
      ? '\n   ATENCIÓN: pediste publicar hace ' + minutos + ' minutos y todavía no' +
        '\n   ha llegado. Vuelve a intentarlo; si sigue igual, avisa a quien te' +
        '\n   montó la tienda.'
      : '\n   Pediste publicar hace ' + minutos + ' minuto(s): todavía va en camino.';
  }
  return linea;
}

/* ==========================================================================
   LOS DATOS QUE LA HOJA NO PUDO LEER, CON FILA Y COLUMNA EXACTAS.
   --------------------------------------------------------------------------
   `cifra()` ya venía anotando la celda —«Catálogo E7 (Precio de chonto)»—
   pero solo la anotaba quien estuviera leyendo en ese momento, y el
   diagnóstico leía el catálogo POR EL CACHÉ: con el caché caliente
   CELDAS_ILEGIBLES quedaba vacío y el informe decía que todo estaba bien
   mientras un producto llevaba una hora sin salir en la tienda.

   Esto lee las tres hojas a mano, sin caché, y devuelve la lista completa.
   También devuelve los productos que se CAEN del catálogo y por qué, que es
   la pregunta que el comerciante hace de verdad: «¿por qué no aparece?».
   ========================================================================== */
function revisarDatos() {
  var antes = CELDAS_ILEGIBLES;
  CELDAS_ILEGIBLES = [];
  var caidos = [];

  filas(H_CATALOGO).forEach(function (f, i) {
    var n = i + 2;
    var id = String(f[0]).trim();
    var nombre = String(f[1] || '').trim();
    var precio = cifra(f[4], 'Catálogo E' + n + ' (Precio de ' + (id || 'fila ' + n) + ')');
    cifra(f[5],  'Catálogo F' + n + ' (Stock de ' + (id || 'fila ' + n) + ')');
    cifra(f[11], 'Catálogo L' + n + ' (Precio antes de ' + (id || 'fila ' + n) + ')');
    cifra(f[12], 'Catálogo M' + n + ' (Umbral bajo de ' + (id || 'fila ' + n) + ')');
    /* Una fila del todo vacía no es un error: es el final de la hoja. */
    if (!id && !nombre && f[4] === '' ) return;
    if (!id)          caidos.push('Catálogo A' + n + ': sin ID');
    else if (!nombre) caidos.push('Catálogo B' + n + ': ' + id + ' no tiene Nombre');
    else if (precio === null) caidos.push('Catálogo E' + n + ': el precio de ' + id + ' no es un número');
  });

  filas(H_ENVIOS).forEach(function (f, i) {
    cifra(f[2], 'Envíos C' + (i + 2) + ' (Valor de ' + (String(f[0]).trim() || 'fila ' + (i + 2)) + ')');
  });

  filas(H_CUPONES).forEach(function (f, i) {
    var n = i + 2;
    var c = String(f[0]).trim().toUpperCase() || 'fila ' + n;
    cifra(f[2], 'Cupones C' + n + ' (Valor de ' + c + ')');
    cifra(f[3], 'Cupones D' + n + ' (Mínimo de ' + c + ')');
    cifra(f[5], 'Cupones F' + n + ' (Usos máximos de ' + c + ')');
    cifra(f[6], 'Cupones G' + n + ' (Usos confirmados de ' + c + ')');
  });

  var cfg = leerConfiguracion();
  /* `pago_tope`, no `tope_pago`: la clave se llama así en la hoja desde la
     2.4.0 y renombrarla rompería todas las tiendas (R2 del contrato). Estuvo
     escrita mal aquí, y como la comprobación se salta las claves que no
     existen, el tope de pago llevaba tiempo sin revisarse — en silencio, que
     es como no revisar nada. */
  ['envio_gratis_desde', 'pago_tope'].forEach(function (clave) {
    if (cfg[clave] !== undefined) cifraDeTexto(cfg[clave], 'Configuración > ' + clave);
  });

  var ilegibles = CELDAS_ILEGIBLES;
  CELDAS_ILEGIBLES = antes;
  return { ilegibles: ilegibles, caidos: caidos };
}

/* ==========================================================================
   LAS FOTOS QUE NO CUADRAN, POR NOMBRE EXACTO.
   --------------------------------------------------------------------------
   «Subí la foto y no aparece» es de las tres cosas que más se preguntan, y
   hasta ahora la única respuesta era «revisa el Drive». La tienda publicada
   dice en catalogo.json QUÉ FOTOS TIENE de verdad (`fotos`: nombre → anchos
   disponibles). Comparar eso con lo que la hoja pide da el nombre exacto del
   archivo que falta, que es con lo que el comerciante puede ir a buscar.

   Una URL completa en la celda no se cuenta: esa foto la sirve otro sitio y
   nosotros no tenemos nada que verificar.
   ========================================================================== */
function revisarFotos() {
  var pide = {};
  filas(H_CATALOGO).forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (!id || !esSi(f[9])) return;                    // solo lo que está Activo
    String(f[7] || '').split('|').forEach(function (u) {
      var t = u.trim();
      if (t && !/^https?:\/\//i.test(t)) pide[t] = (pide[t] || id);
    });
  });

  var pub = catalogoPublicado();
  if (!pub.ok) return { comprobable: false, porQue: pub.sinUrl ? 'sinUrl' : pub.error };

  var tiene = pub.datos.fotos || {};
  var faltan = [], sobran = [];
  Object.keys(pide).forEach(function (n) {
    if (!tiene[n]) faltan.push(n + '  (' + pide[n] + ')');
  });
  Object.keys(tiene).forEach(function (n) { if (!pide[n]) sobran.push(n); });
  return { comprobable: true, pedidas: Object.keys(pide).length,
           faltan: faltan, sobran: sobran };
}

/* «hace 20 minutos» se entiende; una marca ISO no.

   La fecha se arma a mano y no con Utilities.formatDate: eso pide una zona
   horaria, y el proyecto no declara ninguna. Los métodos de Date corren en la
   zona del script, que es la del comerciante, así que dan la hora que él ve en
   su reloj — que es la única que le sirve. */
var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* «hace 5 minutos» habla de un instante; esto habla de una DURACIÓN, que es
   otra cosa. Decir «el que más tardó: hace 2 días» sería mentira. */
function haceCuantoDura(minutos) {
  var m = Math.max(0, Math.floor(Number(minutos) || 0));
  if (m < 60) return m + ' minuto' + (m === 1 ? '' : 's');
  var h = Math.round(m / 60);
  if (h < 48) return h + ' hora' + (h === 1 ? '' : 's');
  return Math.round(h / 24) + ' días';
}

function haceCuanto(t) {
  var f = new Date(t);
  var h = f.getHours();
  var ampm = h < 12 ? 'a.m.' : 'p.m.';
  var h12 = h % 12 || 12;
  var mm = ('0' + f.getMinutes()).slice(-2);
  var cuando = f.getDate() + ' ' + MESES_CORTOS[f.getMonth()] + ', ' +
               h12 + ':' + mm + ' ' + ampm;

  var min = Math.round((Date.now() - t) / 60000);
  if (min < 2)     return cuando + ' (hace un momento)';
  if (min < 60)    return cuando + ' (hace ' + min + ' minutos)';
  if (min < 60 * 24) return cuando + ' (hace ' + Math.round(min / 60) + ' horas)';
  return cuando + ' (hace ' + Math.round(min / (60 * 24)) + ' días)';
}

function publicarAhora() {
  var repo = String(leerConfiguracion().repositorio || '').trim()
               .replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '')
               .replace(/\/+$/, '');
  var tk = '';
  try { tk = String(PropertiesService.getScriptProperties()
                      .getProperty('GITHUB_TOKEN') || '').trim(); } catch (e) { }

  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return { tipo: 'aviso', texto:
      'Todavía no sé dónde vive tu tienda.\n\n' +
      'En la pestaña Configuración, en la fila «repositorio», escribe:\n' +
      '    dueño/repositorio\n\n' +
      'Por ejemplo: laboratoriodigital/organico\n\n' +
      (repo ? 'Ahora dice: ' + repo : '') };
  }
  if (!tk) {
    return { tipo: 'aviso', texto:
      'Falta el permiso para publicar.\n\n' +
      'Es una sola vez, y lo hace quien montó la tienda:\n\n' +
      '1. En GitHub: Settings > Developer settings >\n' +
      '   Personal access tokens > Fine-grained tokens\n' +
      '2. Solo el repositorio ' + repo + '\n' +
      '3. Un solo permiso: Actions -> Read and write\n' +
      '4. En este proyecto: Configuración del proyecto >\n' +
      '   Propiedades del script > GITHUB_TOKEN' };
  }

  var res;
  try {
    res = UrlFetchApp.fetch(
      'https://api.github.com/repos/' + repo + '/actions/workflows/fotos.yml/dispatches',
      { method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + tk,
                   Accept: 'application/vnd.github+json',
                   'X-GitHub-Api-Version': '2022-11-28' },
        payload: JSON.stringify({ ref: 'main' }),
        muteHttpExceptions: true });
  } catch (e) {
    anotarError('Publicar ahora no pudo hablar con GitHub', e.message);
    return { tipo: 'aviso', texto: 'No pude hablar con GitHub.\n\n' + e.message };
  }

  var codigo = res.getResponseCode();
  /* 204 es el sí de GitHub a un disparo: acepta y no devuelve cuerpo. */
  if (codigo === 204) {
    /* Se anota CUÁNDO se pidió, no que se logró: lo segundo no se sabe todavía.
       El Diagnóstico compara esta hora con la del catálogo que la tienda está
       sirviendo de verdad, y esa comparación es la que contesta «¿ya llegó?». */
    try { PropertiesService.getScriptProperties()
            .setProperty('PEDIDA_PUBLICACION', new Date().toISOString()); } catch (e) { }
    return { tipo: 'aviso', texto:
      'Listo. Tu tienda se está actualizando.\n\n' +
      'Tarda unos minutos: se revisan los datos, se preparan las fotos y se\n' +
      'publica. No hace falta que esperes aquí.\n\n' +
      'Para saber si ya llegó, abre el menú > Diagnóstico dentro de un rato:\n' +
      'ahí dice de cuándo es lo que tu tienda está mostrando.\n\n' +
      'Si algo no cuadra, no se publica nada y tu tienda se queda como está.' };
  }

  /* Cada número dice algo distinto y el comerciante no tiene por qué saber
     cuál. Se traduce, y el detalle técnico queda en la hoja Errores. */
  var porQue =
    codigo === 401 ? 'El permiso no sirve o se venció. Hay que hacer uno nuevo.' :
    codigo === 403 ? 'El permiso existe pero no alcanza. Le falta Actions: Read and write.' :
    codigo === 404 ? 'No encuentro el repositorio ' + repo + ', o el permiso no lo incluye.' :
    codigo === 422 ? 'GitHub aceptó la petición pero no encontró la rama main.' :
                     'GitHub contestó ' + codigo + '.';
  anotarError('Publicar ahora falló con ' + codigo,
              String(res.getContentText()).slice(0, 200));
  return { tipo: 'aviso', texto: 'No se pudo publicar.\n\n' + porQue +
    '\n\nQueda anotado en la pestaña Errores.' };
}

function verMiTienda() {
  var url = String(leerConfiguracion().sitio_url || '').trim();
  if (!url) {
    return { tipo: 'aviso', texto:
      'Todavía no sé la dirección de tu tienda.\n\n' +
      'Está en la pestaña Configuración, fila «sitio_url».' };
  }
  /* Un enlace, no una redirección: desde un diálogo de Sheets no se puede
     abrir una pestaña sin que el navegador lo bloquee. Que se pueda copiar y
     que se pueda clicar es lo que hay, y alcanza. */
  return { tipo: 'html', titulo: 'Tu tienda', html:
    '<div style="font-family:Arial,sans-serif;padding:6px 8px">' +
    '<p style="font:400 13px/1.6 Arial,sans-serif;color:#111">Esta es tu tienda, ' +
    'tal como la ve un comprador:</p>' +
    '<p><a href="' + escaparHtml(url) + '" target="_blank" rel="noopener" ' +
    'style="font:600 15px Arial,sans-serif;color:#1B5E3A">' + escaparHtml(url) + '</a></p>' +
    '<p style="font:400 12px/1.55 Arial,sans-serif;color:#666">Si acabas de cambiar ' +
    'algo y no lo ves, usa <b>Publicar ahora</b> y espera unos minutos.</p></div>' };
}

/* La ayuda contesta las tres cosas que se preguntan de verdad, en el orden en
   que se preguntan. No es un manual: un manual dentro de un diálogo no lo lee
   nadie. Lo largo vive en la guía de una página. */
function ayuda() {
  var c = leerConfiguracion();
  var url = String(c.sitio_url || '').trim();
  var linea = function (t) { return '<p style="font:400 13px/1.6 Arial,sans-serif;color:#111;margin:0 0 6px">' + t + '</p>'; };
  var titulo = function (t) { return '<h3 style="font:700 13px Arial,sans-serif;color:#111;margin:16px 0 4px">' + t + '</h3>'; };
  return { tipo: 'html', titulo: 'Ayuda', html:
    '<div style="font-family:Arial,sans-serif;padding:4px 8px 18px">' +
    titulo('Cambié un precio y la tienda no lo muestra') +
    linea('Usa <b>Publicar ahora</b>. La tienda guarda una copia de tu catálogo para ' +
          'cargar rápido, y esa copia se rehace al publicar. Sola se rehace cada cuatro horas.') +
    titulo('Subí una foto al Drive y no aparece') +
    linea('Lo mismo: <b>Publicar ahora</b>. Y comprueba que el nombre del archivo sea ' +
          'idéntico al de la columna <b>Imágenes</b> del catálogo, con mayúsculas y todo.') +
    titulo('Llegó un pedido y quiero confirmarlo') +
    linea('En la pestaña <b>Pedidos</b>, cambia <b>Estado</b> a <b>Confirmado</b>. Eso ' +
          'descuenta el inventario. No hay que hacer nada más.') +
    titulo('Algo no funciona y no sé qué es') +
    linea('Abre <b>Diagnóstico</b>: revisa la tienda entera y dice qué está mal y dónde, ' +
          'con la fila y la columna exactas.') +
    (url ? linea('Tu tienda: <a href="' + escaparHtml(url) + '" target="_blank" rel="noopener">' +
                 escaparHtml(url) + '</a>') : '') +
    '</div>' };
}

function actualizarTodo() {
  var movidos = aplicarInventario();
  recalcularResumen();
  presentarHojas();
  return { tipo: 'aviso', texto: movidos
    ? movidos + ' línea(s) de inventario ajustadas.'
    : 'Todo al día: inventario, tablero y formato.' };
}

function alEditar(e) {
  try {
    if (!e || !e.range) return;
    var h = e.range.getSheet();

    // Escribió un color a mano: se pinta la celda en el acto, para que el
    // relleno y el valor nunca queden diciendo cosas distintas.
    if (h.getName() === H_CONFIG) { pintarColoresDesdeValor(); cacheFuera(); return; }

    if (h.getName() !== H_PEDIDOS) return;

    var desde = e.range.getColumn();
    var hasta = desde + e.range.getNumColumns() - 1;
    if (COL_ESTADO < desde || COL_ESTADO > hasta) return;   // no tocaron Estado

    aplicarInventario();
    recalcularResumen();
  } catch (err) {
    registrarError(err, null);
  }
}

/* ==========================================================================
   RESUMEN Y CONTEO DE CUPONES  —  disparador horario, no en cada pedido
   ========================================================================== */
function recalcularResumen() {
  var datos = filas(H_PEDIDOS);
  var acum = {}, usosCupon = {}, pedidosCupon = {};

  datos.forEach(function (f) {
    if (String(f[3]).toLowerCase().indexOf('confirmado') === -1) return;   // Estado
    var id = f[7];
    if (!id) return;
    if (!acum[id]) acum[id] = { nombre: f[6], unidades: 0, ingresos: 0, pedidos: {} };
    acum[id].unidades += Number(f[8]) || 0;
    acum[id].ingresos += Number(f[10]) || 0;
    acum[id].pedidos[f[1]] = true;

    var cup = String(f[5]).trim().toUpperCase();
    if (cup) {
      if (!pedidosCupon[cup]) pedidosCupon[cup] = {};
      pedidosCupon[cup][f[1]] = true;                 // un pedido cuenta una vez
    }
  });

  Object.keys(pedidosCupon).forEach(function (c) {
    usosCupon[c] = Object.keys(pedidosCupon[c]).length;
  });

  var lista = Object.keys(acum).map(function (id) {
    var a = acum[id];
    return [a.nombre, id, a.unidades, a.ingresos, Object.keys(a.pedidos).length];
  }).sort(function (a, b) { return b[2] - a[2]; });

  var h = hoja(H_RESUMEN, ['Producto', 'ID', 'Unidades vendidas', 'Ingresos',
                           'Pedidos en que aparece']);
  if (h.getLastRow() > 1) h.getRange(2, 1, h.getLastRow() - 1, 5).clearContent();
  if (lista.length) h.getRange(2, 1, lista.length, 5).setValues(lista);
  h.getRange(2, 4, Math.max(lista.length, 1), 1).setNumberFormat('"$"#,##0');

  recalcularTablero();

  // El correo se revisa aquí para no gastar un disparador aparte. Va en try
  // propio: si el correo falla, el inventario y el tablero no se caen con él.
  try { revisarCorreo(); } catch (e) { registrarError('correo: ' + e.message, null); }
  try { consolidarLecturas(); } catch (e) { registrarError('lecturas: ' + e.message, null); }

  // "Usos confirmados" de cada cupón: solo ventas que TÚ marcaste Confirmado.
  var hc = elLibro().getSheetByName(H_CUPONES);
  if (hc && hc.getLastRow() > 1) {
    var cup = hc.getRange(2, 1, hc.getLastRow() - 1, 8).getValues();
    var conteo = cup.map(function (f) {
      return [usosCupon[String(f[0]).trim().toUpperCase()] || 0];
    });
    hc.getRange(2, 7, conteo.length, 1).setValues(conteo);
  }
}

/* Lo mismo que registrarError, pero para lo que no es una excepción: algo que
   salió mal en los datos y que el comerciante tiene que ver. Se anota una vez
   por hora y por motivo — si una celda está mal, lo estará en cada pedido, y
   una hoja Errores con doscientas filas iguales no la lee nadie. */
function anotarError(motivo, detalle) {
  try {
    var llave = 'err:' + String(motivo).slice(0, 40);
    var c = CacheService.getScriptCache();
    if (c.get(llave)) return;
    c.put(llave, '1', 3600);
    var h = hoja(H_ERRORES, ['Fecha', 'Error', 'Primeros 200 caracteres recibidos']);
    if (h.getLastRow() > 500) return;
    h.appendRow([new Date(), celdaSegura(motivo, MAX_ACTA), celdaSegura(detalle, 200)]);
  } catch (x) { /* avisar nunca puede tumbar un pedido */ }
}

function registrarError(err, e) {
  try {
    var h = hoja(H_ERRORES, ['Fecha', 'Error', 'Primeros 200 caracteres recibidos']);
    if (h.getLastRow() > 500) return;
    var crudo = (e && e.postData && e.postData.contents) ? e.postData.contents : '(sin cuerpo)';
    h.appendRow([new Date(), celdaSegura(String(err)), celdaSegura(crudo.slice(0, 200))]);
  } catch (x) {
    // Si ni siquiera podemos escribir el error (por ejemplo, porque el script
    // no está unido a una hoja), no tumbamos la respuesta por eso.
    console.log('No se pudo registrar el error: ' + err);
  }
}
