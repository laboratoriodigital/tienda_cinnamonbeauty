/* ============================================================================
   Emulador de Google Apps Script + Sheets.
   ----------------------------------------------------------------------------
   Carga apps-script.gs TAL CUAL y le da un Google Sheets simulado. Las pruebas
   dejan de comprobar una imitación escrita a mano y pasan a ejercitar el código
   que de verdad se pega en el editor de Google.
   ============================================================================ */
const fs = require('fs');

/* El maestro trae dos constantes que se llenan a mano al instalarlo. El
   emulador las rellena igual que lo haría el instalador, para que las pruebas
   ejerciten el archivo tal como queda desplegado. */
const HOJA_EMULADA = '1AbC-hoja-de-prueba';
const TOKEN_EMULADO = 'token-de-prueba-largo';

function crear(rutaScript, opciones) {
  opciones = opciones || {};
  const hojas = new Map();
  let cache = {};
  let triggers = [];
  let toasts = [];
  let correos = [];
  let cuotaCorreo = 100;
  let ventanas = [];
  let menu = [];
  let hayInterfaz = true;
  let idAbierto = null;
  let props = {};
  let urlServicio = opciones.url === undefined ? 'https://script.google.com/macros/s/EMULADO/exec' : opciones.url;

  const celda = v => (v === undefined || v === null ? '' : v);

  /* La red, simulada. responder(patron, fn) decide qué contesta cada URL: sin
     eso no hay forma de probar una tienda caída sin apagar una de verdad. */
  let rutas = [];
  let peticionesVistas = [];
  let fetchAllRevienta = false;
  /* Drive, simulado. Solo lo que el maestro usa: listar una carpeta, abrir un
     archivo y preguntarle quién es su padre. */
  const carpetasDrive = new Map();      // idCarpeta -> [archivo]
  const sueltosDrive = new Map();       // archivos del Drive fuera de esa carpeta
  const carpetasNegadas = new Set();    // carpetas sin permiso de escritura
  let seqDrive = 0;
  const archivoDrive = (a, idCarpeta) => ({
    getId: () => a.id,
    getDateCreated: () => new Date(a.creado || a.modificado || '2026-01-01T00:00:00Z'),
    setTrashed(v) { a.papelera = !!v; return this; },
    makeCopy(nombre, carpeta) {
      if (carpeta && carpeta._negada) throw new Error('sin permiso sobre la carpeta');
      const copia = { id: 'copia-' + (++seqDrive), nombre: nombre,
                      bytes: a.bytes, creado: new Date().toISOString() };
      const destino = carpeta ? carpeta.getId() : idCarpeta;
      if (!carpetasDrive.has(destino)) carpetasDrive.set(destino, []);
      carpetasDrive.get(destino).push(copia);
      return archivoDrive(copia, destino);
    },
    getName: () => a.nombre,
    getSize: () => a.bytes === undefined ? String(a.contenido || '').length : a.bytes,
    getMimeType: () => a.tipo || 'image/jpeg',
    getLastUpdated: () => new Date(a.modificado || '2026-01-01T00:00:00Z'),
    getBlob: () => ({ getBytes: () => a.contenido || 'bytes-de-' + a.nombre }),
    getParents: () => {
      let dado = false;
      return { hasNext: () => !dado && idCarpeta !== null,
               next: () => { dado = true; return { getId: () => idCarpeta }; } };
    }
  });

  const respuestaDe = (url) => {
    for (const [patron, fn] of rutas) {
      if (url.indexOf(patron) !== -1) {
        const r = fn(url);
        return { getResponseCode: () => r.codigo === undefined ? 200 : r.codigo,
                 getContentText: () => typeof r.cuerpo === 'string'
                   ? r.cuerpo : JSON.stringify(r.cuerpo) };
      }
    }
    return { getResponseCode: () => 404, getContentText: () => 'no encontrado' };
  };

  function nuevaHoja(nombre) {
    const datos = [];   // matriz [fila][col], 0-based
    const formato = new Map();      // "fila,col" -> {fondo, color, negrita, ...}
    const formulas = new Map();     // "fila,col" -> texto de la fórmula
    const uniones = [];             // [{f, c, nf, nc}]
    const anchos = {}, altos = {};
    let ocultarCuadricula = false;
    const fmt = (f, c) => {
      const k = f + ',' + c;
      if (!formato.has(k)) formato.set(k, {});
      return formato.get(k);
    };
    const asegurar = (f, c) => {
      while (datos.length < f) datos.push([]);
      const fila = datos[f - 1];
      while (fila.length < c) fila.push('');
      return fila;
    };
    const h = {
      _nombre: nombre, _datos: datos,
      getName: () => nombre,
      getLastRow: () => datos.length,
      getLastColumn: () => datos.reduce((m, f) => Math.max(m, f.length), 0),
      setFrozenRows: (n) => { h._filasFijas = n; return h; },
      setFrozenColumns: (n) => { h._columnasFijas = n; return h; },
      setColumnWidth: (c, w) => { anchos[c] = w; return h; },
      setRowHeight: (f, a) => { altos[f] = a; return h; },
      setHiddenGridlines: (b) => { ocultarCuadricula = !!b; return h; },
      getMaxRows: () => Math.max(datos.length, 1),
      getMaxColumns: () => Math.max(1, datos.reduce((m, f) => Math.max(m, f.length), 0)),
      _formato: formato, _formulas: formulas, _uniones: uniones,
      _anchos: anchos, _altos: altos,
      get _sinCuadricula() { return ocultarCuadricula; },
      appendRow(fila) {
        datos.push(fila.map(celda));
        return h;
      },
      deleteRows(desde, cuantas) {
        datos.splice(desde - 1, cuantas);
        return h;
      },
      getRange(f, c, nf, nc) {
        nf = nf || 1; nc = nc || 1;
        if (typeof f !== 'number') throw new Error('getRange: fila inválida ' + f);
        if (f < 1 || c < 1) throw new Error('getRange fuera de rango: ' + f + ',' + c);
        const r = {
          getValues() {
            const out = [];
            for (let i = 0; i < nf; i++) {
              const fila = datos[f - 1 + i] || [];
              const salida = [];
              for (let j = 0; j < nc; j++) salida.push(celda(fila[c - 1 + j]));
              out.push(salida);
            }
            return out;
          },
          setValues(v) {
            if (v.length !== nf) throw new Error('setValues: esperaba ' + nf + ' filas, recibió ' + v.length);
            v.forEach((fila, i) => {
              if (fila.length !== nc) throw new Error('setValues: esperaba ' + nc + ' columnas, recibió ' + fila.length);
              const destino = asegurar(f + i, c + nc - 1);
              fila.forEach((x, j) => destino[c - 1 + j] = celda(x));
            });
            return r;
          },
          setValue(x) { asegurar(f, c)[c - 1] = celda(x); return r; },
          clearContent() {
            for (let i = 0; i < nf; i++) { const fila = datos[f - 1 + i];
              if (fila) for (let j = 0; j < nc; j++) fila[c - 1 + j] = ''; }
            return r;
          },
          setFormula(t) { formulas.set(f + ',' + c, String(t)); asegurar(f, c)[c - 1] = String(t); return r; },
          getFormula() { return formulas.get(f + ',' + c) || ''; },
          setFormulas(m) {
            m.forEach((fila, i) => fila.forEach((x, j) => {
              if (x === '' || x === null || x === undefined) return;
              formulas.set((f + i) + ',' + (c + j), String(x));
              asegurar(f + i, c + j + 0)[c - 1 + j] = String(x);
            }));
            return r;
          },
          merge() { uniones.push({ f, c, nf, nc }); return r; },
          cada(prop, valor) {
            for (let i = 0; i < nf; i++) for (let j = 0; j < nc; j++) fmt(f + i, c + j)[prop] = valor;
            return r;
          },
          setFontWeight(v) { return r.cada('negrita', v); },
          setNumberFormat(v) { return r.cada('formato', v); },
          setWrap(v) { return r.cada('ajustar', v); },
          setBackground(v) { return r.cada('fondo', v); },
          setFontColor(v) { return r.cada('color', v); },
          setFontSize(v) { return r.cada('tam', v); },
          setFontFamily(v) { return r.cada('fuente', v); },
          setFontStyle(v) { return r.cada('estilo', v); },
          setHorizontalAlignment(v) { return r.cada('alineado', v); },
          setVerticalAlignment(v) { return r.cada('vertical', v); },
          setBorder() { return r.cada('borde', true); },
          clear() { return r.clearContent(); },
          setDataValidation(regla) { return r.cada('validacion', regla); },
          clearDataValidations() { return r.cada('validacion', null); },
          getDataValidation() { return (formato.get(f + ',' + c) || {}).validacion || null; },
          getBackground() { return (formato.get(f + ',' + c) || {}).fondo || '#ffffff'; },
          getBackgrounds() {
            const out = [];
            for (let i = 0; i < nf; i++) { const fila = [];
              for (let j = 0; j < nc; j++) fila.push((formato.get((f + i) + ',' + (c + j)) || {}).fondo || '#ffffff');
              out.push(fila); }
            return out;
          },
          setBackgrounds(m) {
            m.forEach((fila, i) => fila.forEach((x, j) => fmt(f + i, c + j).fondo = x));
            return r;
          }
        };
        return r;
      }
    };
    return h;
  }

  const libro = {
    getName: () => 'Orgánico — pedidos',
    getUrl: () => 'https://docs.google.com/spreadsheets/d/EMULADO',
    getSheetByName: n => hojas.get(n) || null,
    getSheets: () => Array.from(hojas.values()),
    insertSheet(n) { const h = nuevaHoja(n); hojas.set(n, h); return h; },
    toast: (m, t) => toasts.push(t + ': ' + m)
  };

  const entorno = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => libro,
      openById: (id) => {
        if (!id) throw new Error('openById sin id');
        idAbierto = id;
        return libro;
      },
      BorderStyle: { SOLID: 'SOLID', SOLID_MEDIUM: 'SOLID_MEDIUM' },
      newDataValidation: () => {
        const regla = { _lista: null, _permiteOtros: true, _ayuda: '', _menu: true };
        const b = {
          requireValueInList(lista, menu) { regla._lista = lista.slice();
                                            regla._menu = menu !== false; return b; },
          setAllowInvalid(v) { regla._permiteOtros = !!v; return b; },
          setHelpText(t) { regla._ayuda = String(t); return b; },
          build: () => regla
        };
        return b;
      },
      getUi: () => {
        // Los disparadores corren sin interfaz: allí getUi() revienta de verdad.
        if (!hayInterfaz) throw new Error('Cannot call SpreadsheetApp.getUi() from this context');
        return ({
        createMenu: () => {
          const m = { addItem: (rotulo, fn) => { menu.push([rotulo, fn]); return m; },
                      addToUi: () => {} };
          return m;
        },
        showModalDialog: (salida, titulo) => ventanas.push({ titulo, html: salida._html }),
        alert: (t) => ventanas.push({ titulo: 'alerta', html: String(t) })
        });
      }
    },
    HtmlService: {
      createHtmlOutput: h => ({ _html: String(h),
        setWidth() { return this; }, setHeight() { return this; },
        getContent() { return this._html; } })
    },
    CacheService: { getScriptCache: () => ({
      get: k => (k in cache ? cache[k] : null),
      put: (k, v) => { cache[k] = String(v); },
      remove: k => { delete cache[k]; }
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    ContentService: {
      createTextOutput: t => ({ _texto: t, setMimeType() { return this; }, getContent() { return this._texto; } }),
      MimeType: { JSON: 'application/json', TEXT: 'text/plain' }
    },
    ScriptApp: {
      getProjectTriggers: () => triggers,
      newTrigger(f) {
        const alta = () => triggers.push({ getHandlerFunction: () => f });
        const diario = { everyDays: () => ({ create: alta }) };
        const semanal = { atHour: () => ({ create: alta }), create: alta };
        return { timeBased: () => ({ everyHours: () => ({ create: alta }),
                                     atHour: () => diario,
                                     onWeekDay: () => semanal,
                                     everyDays: () => ({ create: alta }) }),
                 forSpreadsheet: () => ({ onEdit: () => ({ create: alta }),
                                          onOpen: () => ({ create: alta }) }) };
      },
      deleteTrigger: t => { triggers = triggers.filter(x => x !== t); },
      getScriptId: () => 'ScriptIdEmulado123456',
      getService: () => ({ getUrl: () => urlServicio }),
      WeekDay: { SUNDAY: 'SUNDAY', MONDAY: 'MONDAY' }
    },
    Utilities: {
      base64Encode: b => Buffer.from(String(b)).toString('base64'),
      computeDigest: (alg, txt) => Array.from(Buffer.from(String(txt))),
      DigestAlgorithm: { MD5: 'MD5' },
      getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-' + Math.random().toString(16).slice(2, 14),
      newBlob: (contenido, tipo, nombre) => ({
        _contenido: String(contenido), _tipo: tipo, _nombre: nombre,
        getName: () => nombre, getDataAsString: () => String(contenido)
      })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: k => (k in props ? props[k] : null),
        setProperty: (k, v) => { props[k] = String(v); },
        deleteProperty: k => { delete props[k]; }
      })
    },
    DriveApp: {
      getFolderById(id) {
        if (carpetasNegadas.has(id)) { const e = new Error('sin permiso'); e._negada = true; throw e; }
        if (!carpetasDrive.has(id)) throw new Error('Carpeta inexistente: ' + id);
        return {
          getId: () => id,
          getFiles() {
            const lista = carpetasDrive.get(id).filter(x => !x.papelera);
            let i = 0;
            return { hasNext: () => i < lista.length,
                     next: () => archivoDrive(lista[i++], id) };
          }
        };
      },
      getFileById(id) {
        if (id === hojaId) return archivoDrive({ id: hojaId, nombre: 'Orgánico — pedidos' }, null);
        for (const [carpeta, lista] of carpetasDrive) {
          const a = lista.find(x => x.id === id);
          if (a) return archivoDrive(a, carpeta);
        }
        // Un archivo suelto del Drive, fuera de la carpeta de fotos.
        if (sueltosDrive.has(id)) return archivoDrive(sueltosDrive.get(id), null);
        throw new Error('Archivo inexistente: ' + id);
      }
    },
    UrlFetchApp: {
      fetch(url) { return respuestaDe(url); },
      fetchAll(peticiones) {
        peticionesVistas.push(peticiones.map(p => p.url));
        if (fetchAllRevienta) throw new Error('fetchAll caído');
        return peticiones.map(p => respuestaDe(p.url));
      }
    },
    MailApp: {
      getRemainingDailyQuota: () => cuotaCorreo,
      sendEmail(opciones) {
        if (cuotaCorreo < 1) throw new Error('sin cuota de correo');
        cuotaCorreo--;
        correos.push(opciones);
      }
    },
    console
  };

  /* Ejecutamos el archivo real UNA sola vez, en un solo ámbito, y sacamos de ahí
     todas sus funciones. Evaluarlo varias veces crearía ámbitos distintos y las
     variables del módulo no se compartirían: las pruebas mentirían. */
  let codigo = fs.readFileSync(rutaScript, 'utf8');
  const hojaId = opciones.hojaId === undefined ? HOJA_EMULADA : opciones.hojaId;
  codigo = codigo.replace(/var HOJA_ID = '[^']*';/, "var HOJA_ID = '" + hojaId + "';");
  const nombres = Object.keys(entorno);
  const declaradas = (codigo.match(/^function\s+([A-Za-z0-9_]+)/gm) || [])
    .map(d => d.replace(/^function\s+/, ''));
  const devolver = '\n; return {' + declaradas.map(f => f + ': ' + f).join(', ') + '};';
  const api = new Function(...nombres, codigo + devolver).apply({}, nombres.map(k => entorno[k]));

  return { api, libro, hojas, toasts,
           get triggers() { return triggers; },
           get cache() { return cache; },
           get correos() { return correos; },
           get ventanas() { return ventanas; },
           get menu() { return menu; },
           sinCuota() { cuotaCorreo = 0; },
           sinInterfaz() { hayInterfaz = false; },
           get idAbierto() { return idAbierto; },
           get props() { return props; },
           url: urlServicio,
           /* Para poder simular las dos caras de getUrl(): la /dev cuando se
              corre desde el editor y la /exec cuando atiende la web. */
           servidoEn(u) { urlServicio = u; },
           hojaId: hojaId,
           get token() { return props.TOKEN || null; },
           responder: (patron, fn) => rutas.push([patron, fn]),
           enDrive: (carpeta, archivos) => carpetasDrive.set(carpeta, archivos),
           sueltoEnDrive: (a) => sueltosDrive.set(a.id, a),
           carpetaNegada: (id) => carpetasNegadas.add(id),
           carpetaDrive: (id) => (carpetasDrive.get(id) || []).filter(x => !x.papelera),
           sinRed() { fetchAllRevienta = true; },
           get peticiones() { return peticionesVistas; },
           filas: n => { const h = hojas.get(n); return h ? h._datos : null; },
           /* LAS PROPIEDADES TAMBIÉN. Se quedaban vivas: una tienda con las
              hojas borradas y las propiedades intactas no es una tienda nueva,
              es una tienda a medio borrar. Eso hacía que un contador —los
              rescates, la marca del stub, la petición de publicar— se arrastrara
              de una batería a la siguiente, y una prueba que depende de la que
              corrió antes falla según el orden, que es el peor rojo que hay. */
           reiniciar() { hojas.clear(); cache = {}; triggers = []; toasts = [];
                         correos = []; cuotaCorreo = 100; ventanas = []; menu = [];
                         Object.keys(props).forEach(k => { delete props[k]; }); } };
}

/* LA TIENDA DE PRUEBA TIENE NOMBRE, Y NO ES EL DEL PRODUCTO.
   Durante mucho tiempo las baterías daban por hecho que la tienda se llamaba
   "Orgánico" —que es UN comercio, el de tomates— y comparaban contra ese
   nombre. Una prueba así solo sabe ver la primera tienda: la segunda falla y
   nadie entiende por qué. Ahora hay un comercio de prueba, distinto a
   propósito de cualquiera real, y las aserciones lo nombran desde aquí.

   Y hace falta además porque la semilla de instalar() ya no trae nada
   utilizable: el nombre viene entre corchetes y el celular vacío, para que una
   tienda sin configurar se vea sin configurar. */
/* UNA TIENDA COMPLETA, no una a medio llenar. Antes tenía ocho claves y con
   eso bastaba porque nadie preguntaba por las demás; desde que existe
   revisarTienda() —«¿está terminada esta tienda?»— una tienda de prueba a
   medias haría que las baterías midieran un caso que no queremos publicar.

   Las claves de pago son inventadas y se ven inventadas a propósito: una llave
   con pinta de real en un archivo de pruebas acaba copiada a algún sitio. */
const COMERCIO = {
  negocio:          'Panadería La Espiga',
  whatsapp:         '573001112233',
  sitio_url:        'https://la-espiga.ejemplo.workers.dev/',
  sitio_titulo:     'Panadería La Espiga — pan de masa madre',
  sitio_descripcion:'Pan de masa madre horneado cada mañana. Pide por WhatsApp.',
  portada_titulo:   'Pan que huele a pan.',
  empresa_razon:    'La Espiga de Rionegro S.A.S.',
  empresa_nit:      '900.000.000-0',
  empresa_correo:   'datos@la-espiga.ejemplo',
  empresa_direccion:'Calle Falsa 123',
  empresa_ciudad:   'Rionegro, Antioquia',
  empresa_tel:      '300 111 2233',
  correo_resumen:   'dueno@la-espiga.ejemplo',
  respaldo_carpeta: 'CARPETA-DE-PRUEBA',
  repositorio:      'ejemplo/la-espiga',
  pago_llave:       'LLAVE-DE-PRUEBA',
  pago_titular:     'La Espiga de Rionegro S.A.S.',
  pago_entidad:     'Banco de prueba'
};

/** Una tienda ya configurada, que es contra lo que se prueba casi todo. */
function configurar(g, extra) {
  const valores = Object.assign({}, COMERCIO, extra || {});
  const h = g.hojas.get('Configuración');
  const d = g.filas('Configuración');
  Object.keys(valores).forEach(function (clave) {
    const i = d.findIndex(function (f) { return String(f[0]).trim() === clave; });
    // g.filas() de este emulador SÍ incluye el encabezado (a diferencia de
    // filas() del maestro), así que la fila 1-based es i + 1 y la 0 es el rótulo.
    if (i >= 1) h.getRange(i + 1, 2).setValue(valores[clave]);
  });
  return g;
}

module.exports = { crear, COMERCIO, configurar };
