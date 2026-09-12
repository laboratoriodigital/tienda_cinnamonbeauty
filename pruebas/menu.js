/* ============================================================================
   El contrato entre el maestro y el stub de la hoja.
   ----------------------------------------------------------------------------
   Desde que el código salió de la hoja hay dos piezas que se pueden
   desincronizar sin que nadie se entere hasta que un cliente toque el menú:
   el stub que dibuja las opciones y el maestro que las ejecuta. Esta batería
   existe para que esa desincronización se caiga aquí.

   También comprueba lo que justifica todo el cambio: que en la hoja del
   cliente no quede una sola regla de negocio.
   ============================================================================ */
const fs = require('fs');
/* La versión no se escribe a mano aquí: se saca del maestro. Estaba repetida en
   ocho sitios y cada release obligaba a perseguirla. Patrón 2 de la bitácora. */
const LA_VERSION = (require('fs').readFileSync('./as.js', 'utf8')
  .match(/var VERSION = '([^']+)'/) || [])[1];
const { crear, COMERCIO, configurar } = require('./gas.js');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

// configurar(): de fábrica el nombre viene entre corchetes y sin celular, a
// propósito, y una tienda así no se puede publicar.
const nuevo = () => { const g = crear('./as.js'); g.api.instalar(); return configurar(g); };
const pedir = (g, f, token) => JSON.parse(g.api.doGet({ parameter: {
  a: 'menu', f: f, t: token === undefined ? g.token : token } })._texto);

/* La plantilla del stub vive DENTRO del maestro, así que su texto contiene
   getActiveSpreadsheet, getUi y showModalDialog como cadenas. Para comprobar
   qué hace el maestro hay que mirarlo sin esa plantilla. */
const maestroCrudo = fs.readFileSync('./as.js', 'utf8');
/* Dos trozos se sacan antes de mirar el resto:
   - PLANTILLA_STUB, que CONTIENE el stub como texto;
   - menuDePrueba(), el experimento que mide si un disparador instalable puede
     dibujarle el menú al comerciante. Ese sí toca la interfaz, a propósito y
     temporalmente. Más abajo se comprueba que es el ÚNICO sitio donde pasa. */
const maestro = maestroCrudo.replace(
  /var PLANTILLA_STUB = \[[\s\S]*?\]\.join\('\\n'\);/, '');
/* El stub ya no es un archivo aparte: lo escribe el maestro. Se prueba el que
   de verdad se va a pegar, no una copia que puede haber quedado atrás. */
const stub = (() => { const g = crear('./as.js'); g.api.instalar();
                      return g.api.generarStub().codigo; })();

// ═══ 1. El maestro ya no vive dentro de la hoja ═══
{
  const g = nuevo();
  ok('El maestro abre la hoja POR SU ID, no por estar dentro de ella',
     g.idAbierto === g.hojaId, String(g.idAbierto));
  ok('  ...y no queda ni una LLAMADA a getActiveSpreadsheet en el maestro',
     maestro.indexOf('SpreadsheetApp.getActiveSpreadsheet(') === -1,
     maestro.indexOf('SpreadsheetApp.getActiveSpreadsheet(') === -1 ? 'ninguna' : 'todavía hay');
  ok('  ...ni dibuja interfaz: no puede, y no debe',
     maestro.indexOf('getUi()') === -1 && maestro.indexOf('showModalDialog') === -1);
  /* La única excepción es el experimento, y tiene que seguir siendo la única:
     si mañana alguien mete un getUi() en una función de verdad, el maestro
     revienta el día que corra desde un disparador, que es donde no hay
     interfaz. */
  /* Sin excepciones. El experimento del menú sin stub se retiró el 6 de
     septiembre: quedó medido que un disparador instalable dibuja el menú pero
     el comerciante no puede EJECUTAR una función de un proyecto ajeno. Con eso
     el maestro vuelve a no tocar la interfaz nunca, que es lo que le permite
     correr desde un disparador, donde no hay interfaz que tocar. */
  ok('  ...ni un solo getUi() vivo, sin excepciones',
     (maestro.match(/getUi\(\)/g) || []).length === 0,
     (maestro.match(/getUi\(\)/g) || []).length + ' fuera de la plantilla del stub');
  /* Lo único que sobrevive del experimento: poder desmontarlo en una tienda
     donde se llegó a instalar el disparador. */
  ok('  ...y queda cómo deshacer el experimento donde se instaló',
     /function quitarMenuDePrueba\(\)/.test(maestroCrudo) &&
     !/function menuDePrueba\(\)/.test(maestroCrudo));
  ok('Sin HOJA_ID se niega a arrancar, con un mensaje que dice qué hacer', (() => {
       const v = crear('./as.js', { hojaId: '' });
       try { v.api.instalar(); return false; }
       catch (e) { return /HOJA_ID/.test(e.message) && /\/d\/ y \/edit/.test(e.message); }
     })());
  ok('El disparador de edición apunta a la hoja por ID',
     g.triggers.map(t => t.getHandlerFunction()).indexOf('alEditar') !== -1);
}

// ═══ 2. La puerta del stub ═══
{
  const g = nuevo();
  const lista = pedir(g, '');
  /* Cuántas opciones hay se le pregunta al maestro, no se escribe aquí. Con el
     número a mano, agregar «Publicar ahora» y «Ayuda» dejaba esta batería en
     rojo por hacer bien las cosas — y el rojo por la razón equivocada es el que
     enseña a ignorar los rojos. */
  const cuantas = g.api.menuDeLaHoja().length;
  ok('Sin acción, el maestro entrega el menú', lista.ok && lista.menu.length === cuantas,
     lista.menu ? lista.menu.map(m => m.id).join(', ') : JSON.stringify(lista));
  ok('  ...y el orden y las acciones no se separaron', g.api.menuCuadra().ok,
     JSON.stringify(g.api.menuCuadra()));
  ok('  ...con id y rótulo para cada opción',
     lista.menu.every(m => m.id && m.rotulo), JSON.stringify(lista.menu[0]));

  ok('CON TOKEN MALO no ejecuta nada', (() => {
       const r = pedir(g, 'actualizar', 'me-lo-inventé');
       return r.ok === false && /no corresponde a esta tienda/.test(r.error);
     })(), pedir(g, 'actualizar', 'me-lo-inventé').error);
  ok('  ...ni con el token vacío', pedir(g, 'actualizar', '').ok === false);
  ok('Una acción que no está en la lista blanca se rechaza',
     /no existe/.test(pedir(g, 'borrarTodo').texto || ''),
     JSON.stringify(pedir(g, 'borrarTodo')));
  ok('  ...y tampoco se puede llamar a una función interna del maestro',
     /no existe/.test(pedir(g, 'aplicarInventario').texto || ''),
     JSON.stringify(pedir(g, 'aplicarInventario')));
}

// ═══ 3. Cada acción devuelve algo que el stub sabe mostrar ═══
{
  const g = nuevo();
  const formas = { html: r => r.tipo === 'html' && r.titulo && r.html,
                   aviso: r => r.tipo === 'aviso' && r.texto };
  /* «diagnostico» pasó de aviso a html cuando creció a nueve puntos: un
     ui.alert con noventa líneas no se puede leer ni copiar. Sigue trayendo
     `texto` —eso es lo que consume ?a=diagnostico y lo que se pega en un
     chat—, pero el stub lo pinta como diálogo. */
  [['actualizar', 'aviso'], ['resumen', 'aviso'], ['diagnostico', 'html'],
   ['configuracion', 'html'], ['inventario', 'html']].forEach(([id, tipo]) => {
    const r = pedir(g, id);
    ok('«' + id + '» responde ' + tipo + ' y el stub lo puede pintar',
       r.ok && formas[tipo](r), r.tipo + ' · ' + String(r.texto || r.titulo).slice(0, 60));
  });

  ok('Actualizar de verdad recalcula, no solo responde bonito', (() => {
       const g2 = nuevo();
       g2.hojas.get('Tablero')._datos.length = 0;
       pedir(g2, 'actualizar');
       return g2.filas('Tablero').length > 25;
     })(), 'el tablero queda escrito');

  ok('Diagnóstico devuelve el informe completo, no solo "listo"', (() => {
       const r = pedir(g, 'diagnostico');
       // El rótulo dice de QUÉ es la versión: el panel tiene la suya y decir
       // "este código" en los dos hacía comparar peras con manzanas.
       return /Versión del MAESTRO de esta tienda/.test(r.texto) &&
              /Catálogo/.test(r.texto);
     })(), pedir(g, 'diagnostico').texto.split('\n')[0]);

  /* La tienda de prueba ya trae correo configurado —es una tienda completa—,
     así que para probar el caso «sin correo» hay que quitárselo aquí. */
  {
    const sinCorreo = crear('./as.js');
    sinCorreo.api.instalar();
    configurar(sinCorreo, { correo_resumen: '' });
    ok('El resumen sin correo configurado explica qué hacer',
       /correo_resumen/.test(pedir(sinCorreo, 'resumen').texto),
       pedir(sinCorreo, 'resumen').texto);
  }
}

// ═══ 4. El stub y el maestro tienen que decir lo MISMO ═══
{
  const g = nuevo();
  const delMaestro = pedir(g, '').menu;
  const idsStub = (stub.match(/id: '([a-z]+)'/g) || [])
    .map(x => x.replace(/id: '|'/g, ''));
  const rotulosStub = (stub.match(/rotulo: '([^']+)'/g) || [])
    .map(x => x.replace(/rotulo: '|'/g, ''));

  ok('EL STUB PIDE EXACTAMENTE las acciones que el maestro expone',
     idsStub.slice().sort().join(',') === delMaestro.map(m => m.id).sort().join(','),
     'stub: ' + idsStub.join(',') + '  |  maestro: ' + delMaestro.map(m => m.id).join(','));
  ok('  ...y con los mismos rótulos, para que no digan cosas distintas',
     rotulosStub.slice().sort().join('|') ===
     delMaestro.map(m => m.rotulo).sort().join('|'),
     rotulosStub.join(' · '));
}

// ═══ 5. En la hoja del cliente no queda nada que valga la pena leer ═══
{
  const lineas = stub.split('\n').filter(l => l.trim() && !/^\s*(\/\/|\*|\/\*)/.test(l));
  /* El tope subió de 50 a 70 el día que el stub aprendió a explicar por qué
     falla. Ocho de esas líneas son un mensaje de texto, no lógica: cuando la
     implementación no es pública, Google devuelve una página web y el dueño
     veía "Unexpected token '<'". Lo que de verdad protege este bloque son las
     dos aserciones de abajo, no el número. */
  ok('El stub sigue cabiendo en menos de 70 líneas de código', lineas.length < 70,
     lineas.length + ' líneas');
  // "inventario" y "catálogo" aparecen como rótulos del menú: eso es una
  // etiqueta, no una regla. Lo que no puede aparecer es aritmética del negocio.
  const sinRotulos = lineas.filter(l => !/rotulo:/.test(l)).join('\n');
  const prohibidas = ['precio', 'cupon', 'cupón', 'stock', 'descuento', 'subtotal',
                      'MailApp', 'LockService', 'SpreadsheetApp.openById', 'Catálogo'];
  const encontradas = prohibidas.filter(p => new RegExp(p, 'i').test(sinRotulos));
  ok('NO hay una sola regla de negocio en la hoja del cliente',
     encontradas.length === 0, encontradas.join(', ') || 'ninguna palabra delatora');
  ok('  ...ni siquiera lee o escribe celdas', !/getRange|setValue|getValues/.test(stub));
  ok('El stub solo hace tres cosas: menú, petición y mostrar',
     /createMenu/.test(stub) && /UrlFetchApp\.fetch/.test(stub) &&
     /showModalDialog/.test(stub) && /ui\.alert/.test(stub));
  ok('  ...y es JavaScript válido: se pega y funciona',
     (() => { try { new Function('if(0){' + stub + '\n}'); return true; }
              catch (e) { return false; } })());
  ok('  ...y el menú lo escribe él, para que abrir la hoja no espere a la red',
     stub.indexOf('OPCIONES') !== -1 && !/onOpen[\s\S]{0,200}UrlFetchApp/.test(stub));
  ok('Si el maestro no responde, el stub lo dice en vez de quedarse callado',
     /catch \(e\)[\s\S]{0,200}ui\.alert/.test(stub));
  /* El fallo más común del montaje entero, y el que peor se explicaba solo. */
  ok('SI EL SERVICIO DEVUELVE UNA PÁGINA WEB, el stub la reconoce',
     /charAt\(0\) !== '\{'/.test(stub) && /porQueFalla/.test(stub));
  ok('  ...y en vez de un error de JavaScript dice qué revisar',
     /Solo yo/.test(stub) && /Gestionar implementaciones/.test(stub) &&
     /Cualquier persona/.test(stub));
  ok('  ...con la URL exacta para comprobarlo en incógnito',
     /MAESTRO \+ '\?a=version'/.test(stub));
  ok('EL STUB SALE COMPLETO: no queda nada por llenar',
     /var MAESTRO = 'https:\/\/script\.google\.com/.test(stub) &&
     /var TOKEN   = 'tkm-[a-z0-9]+'/.test(stub) &&
     !/PEGA_AQUÍ/.test(stub),
     (stub.match(/var (MAESTRO|TOKEN)[^\n]*/g) || []).join(' · '));

  /* ═══ EL TOKEN QUE VA EN LA HOJA NO ES EL DE MONTAJE ═══
     El comerciante lee su stub en el editor de la hoja, y de ahí sale a una
     captura o a un chat. Mientras fue uno solo, ese mismo token abría
     ?a=sembrar —reescribir su configuración desde fuera—, ?a=bloques, ?a=fotos
     y ?a=panel. El del menú abre el menú y nada más. */
  {
    const g2 = nuevo();
    const suStub = g2.api.generarStub().codigo;
    const enElStub = (suStub.match(/var TOKEN   = '([^']+)'/) || [])[1];
    ok('EL TOKEN DEL STUB no es el de montaje', enElStub !== g2.api.token(),
       enElStub.slice(0, 12) + '…  ≠  ' + g2.api.token().slice(0, 11) + '…');
    ok('  ...y se distinguen de un vistazo cuando aparecen sueltos',
       /^tkm-/.test(enElStub) && /^tk-/.test(g2.api.token()),
       'en una captura o en un log, nadie tiene que adivinar cuál es cuál');
    ok('  ...y el de montaje NO aparece por ninguna parte del stub',
       suStub.indexOf(g2.api.token()) === -1);

    /* Las puertas de montaje siguen cerradas al token del menú. Esta es la
       mitad que de verdad importa: separar los tokens no sirve de nada si el
       nuevo abre lo mismo que el viejo. */
    ['bloques', 'sembrar', 'fotos', 'panel', 'identidad'].forEach(a => {
      const r = JSON.parse(g2.api.doGet({ parameter: { a: a, t: enElStub } })._texto);
      ok('  ...y ?a=' + a + ' NO lo acepta', r.ok === false,
         String(r.error || '').slice(0, 50));
    });
    ok('  ...pero el menú sí, que es lo único que tiene que abrir',
       pedir(g2, '', enElStub).ok === true);
  }

  /* ═══ CONVIVENCIA, Y CÓMO SE TERMINA ═══
     El stub que ya está pegado en cada hoja lleva el token viejo. Si la puerta
     dejara de aceptarlo de golpe, el menú de todas las tiendas montadas se
     apagaría el día del despliegue. */
  {
    const g3 = nuevo();
    ok('EL MENÚ SIGUE ACEPTANDO el token viejo, o se apagan las tiendas montadas',
       pedir(g3, '', g3.api.token()).ok === true,
       'una migración que apaga el menú el día del despliegue no es una migración');
    ok('  ...pero deja constancia, que es lo que permite terminarla',
       !!g3.props.STUB_CON_TOKEN_VIEJO,
       'sin medirlo, «acepta los dos» se queda para siempre');
    ok('  ...y el diagnóstico lo dice y pide pegar el stub nuevo',
       /todavía usa el TOKEN DE MONTAJE/.test(g3.api.diagnostico().texto) &&
       /generarStub/.test(g3.api.diagnostico().texto),
       (g3.api.diagnostico().texto.match(/[^\n]*TOKEN DE MONTAJE[^\n]*/) || [''])[0]);

    /* Y rotarToken() se niega mientras alguna hoja siga entrando con el viejo:
       rotar antes de pegar el stub deja al comerciante sin menú y sin saber
       por qué. */
    ok('ROTAR EL TOKEN se niega mientras el stub viejo siga en uso',
       /TODAVÍA NO/.test(g3.api.rotarToken()) &&
       g3.api.token() === g3.props.TOKEN,
       'rotar antes de migrar apaga el menú sin decir por qué');

    const g4 = nuevo();
    const antes = g4.api.token();
    const rotado = g4.api.rotarToken();
    ok('  ...y con el stub ya migrado, rota y dice qué falta cambiar fuera',
       g4.api.token() !== antes && /MAESTRO_TOKEN/.test(rotado) &&
       /tienda\.json/.test(rotado),
       'pegar el stub nuevo no invalida el viejo: eso lo hace esto');
    ok('  ...sin tocar el del menú, que ya está pegado en la hoja',
       /token del menú NO cambió/i.test(rotado));
  }
}

// ═══ 6. La ventana de configuración sigue sirviendo ═══
{
  const g = nuevo();
  const r = pedir(g, 'configuracion');
  const html = r.html;
  ok('Trae los DOS bloques que hay que pegar',
     (html.match(/<textarea/g) || []).length === 2);
  ok('  ...cada uno con su botón de copiar', (html.match(/<button/g) || []).length === 2);
  ok('  ...y dice DÓNDE va cada uno',
     /En el &lt;head&gt;/.test(html) && /bloque de configuración del &lt;script&gt;/.test(html));
  ok('El bloque del head lleva el título de la tienda',
     html.indexOf('&lt;title&gt;' + COMERCIO.sitio_titulo) !== -1,
     (html.match(/&lt;title&gt;[^&]*/) || [''])[0]);
  ok('  ...y el iconito con los colores de la marca',
     /rel=&quot;icon&quot;/.test(html) && /%23D0211C/.test(html));
  ok('El bloque del script lleva la versión del contrato',
     new RegExp('SCRIPT_VERSION = &quot;' + LA_VERSION + '&quot;').test(html));
  ok('  ...y la URL del servicio ya viene puesta, no hay que pegarla',
     /SCRIPT_URL     = &quot;https:\/\/script\.google\.com/.test(html) &&
     !/PEGA_AQUÍ/.test(html),
     (html.replace(/&quot;/g, '"').match(/const SCRIPT_URL[^\n]*/) || [''])[0]);

  const g2 = crear('./as.js'); g2.api.instalar();
  const hc = g2.hojas.get('Configuración');
  const i = g2.filas('Configuración').findIndex(f => f[0] === 'negocio');
  hc.getRange(i + 1, 2).setValue('</textarea><script>alert(1)</script>');
  const sucio = pedir(g2, 'configuracion').html;
  ok('Lo que escriba el dueño en la hoja no se cuela como HTML',
     !/<script>alert/.test(sucio.split('<textarea')[1].split('</textarea>')[0]));
}

// ═══ 7. Y el catálogo de respaldo también ═══
{
  const g = nuevo();
  const r = pedir(g, 'inventario');
  ok('El inventario devuelve la ventana Y el bloque aparte',
     r.tipo === 'html' && /const PRODUCTOS = \[/.test(r.bloque || ''),
     (r.bloque || '').split('\n')[0]);
  ok('  ...y ese bloque sigue siendo JavaScript válido', (() => {
       try { return new Function(r.bloque + '\n; return PRODUCTOS;')().length === 8; }
       catch (e) { return false; }
     })());
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
