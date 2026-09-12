/* ============================================================================
   Servidor de pruebas.
   ----------------------------------------------------------------------------
   Sirve index.html y atiende /exec ejecutando el apps-script.gs REAL sobre el
   emulador de Sheets. El navegador habla con el mismo código que se pega en
   Google, y al final podemos mirar las hojas para comprobar qué quedó escrito.
   ============================================================================ */
const http = require('http'), fs = require('fs'), url = require('url');
const { crear, configurar } = require('./gas.js');

const PORT = Number(process.env.PUERTO || 8099);
const ORIGEN = 'http://localhost:' + PORT;

let gas = crear('./as.js');
gas.api.instalar();
// Una tienda de fábrica no se puede publicar a propósito (nombre entre
// corchetes, celular vacío). La que sirve este servidor está configurada.
configurar(gas);

let fallasPendientes = 0;   // simula la red móvil que se cae
let tumbarTodo = false;     // 'muerto': falla también el catálogo
let demoraMs = 0;
let peticiones = [];

function responderJson(res, obj) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}

function contenido(salida) {
  // ContentService devuelve un objeto con _texto
  return salida && salida._texto !== undefined ? salida._texto : String(salida);
}

const servidor = http.createServer((req, res) => {
  const u = url.parse(req.url, true);

  // ---- utilidades de la prueba ----
  if (u.pathname === '/__hojas') {
    const salida = {};
    gas.hojas.forEach((h, n) => salida[n] = h._datos);
    return responderJson(res, salida);
  }
  if (u.pathname === '/__peticiones') return responderJson(res, peticiones);
  if (u.pathname === '/__reiniciar') {
    gas.reiniciar(); gas.api.instalar();
    fallasPendientes = 0; demoraMs = 0; tumbarTodo = false; peticiones = [];
    return responderJson(res, { ok: true });
  }
  if (u.pathname === '/__reset') { gas.reiniciar(); gas.api.instalar(); configurar(gas);
    fallasPendientes = 0; demoraMs = 0; tumbarTodo = false; peticiones = []; return responderJson(res, { ok: true }); }
  if (u.pathname === '/__fallar') { fallasPendientes = Number(u.query.n) || 1; peticiones = []; return responderJson(res, { ok: true }); }
  if (u.pathname === '/__modo') {
    peticiones = [];
    tumbarTodo = false;
    if (u.query.m === 'caido') { fallasPendientes = 1e9; demoraMs = 0; }
    else if (u.query.m === 'muerto') { fallasPendientes = 1e9; demoraMs = 0; tumbarTodo = true; }
    else if (u.query.m === 'lento') { fallasPendientes = 0; demoraMs = 9000; }
    else { fallasPendientes = 0; demoraMs = 0; }
    return responderJson(res, { ok: true });
  }
  if (u.pathname === '/__muchos') {          // catálogo grande, para la paginación
    const h = gas.hojas.get('Catálogo');
    h._datos.length = 1;
    const cats = ['Frescos', 'Salsas', 'Conservas', 'Bebidas'];
    const filas = [];
    const cuantos = Number(u.query.n) || 137;
    for (let i = 1; i <= cuantos; i++) {
      filas.push(['p' + i, 'Producto ' + i, 'Unidad', cats[i % 4], 1000 * i, 10,
                  'Descripción del producto ' + i, '', i <= 3 ? 'Sí' : 'No', 'Sí']);
    }
    h.getRange(2, 1, filas.length, 10).setValues(filas);
    gas.api.doGet({ parameter: { a: 'version' } });          // no cachea catálogo
    delete gas.cache['catalogo'];
    return responderJson(res, { ok: true, n: filas.length });
  }
  if (u.pathname === '/__drift') {           // la hoja cambia bajo los pies del cliente
    const h = gas.hojas.get('Catálogo');
    h._datos.slice(1).forEach((f, i) => {
      if (f[0] === 'chonto') h.getRange(i + 2, 5).setValue(9500);
      if (f[0] === 'cherry') h.getRange(i + 2, 10).setValue('No');
    });
    delete gas.cache['catalogo'];
    return responderJson(res, { ok: true });
  }
  if (u.pathname === '/__producto') {        // agregar un producto solo desde la hoja
    const h = gas.hojas.get('Catálogo');
    const f = h.getLastRow() + 1;
    h.getRange(f, 1, 1, 10).setValues([[u.query.id, u.query.nombre, u.query.formato || 'Unidad',
      u.query.categoria || 'Otros', Number(u.query.precio) || 1000, Number(u.query.stock) || 5,
      u.query.desc || '', u.query.imagenes || '', u.query.destacado || 'No', 'Sí']]);
    delete gas.cache['catalogo'];
    return responderJson(res, { ok: true });
  }
  if (u.pathname === '/__usar') {            // agotar un cupón
    const h = gas.hojas.get('Cupones');
    h._datos.slice(1).forEach((f, i) => {
      if (String(f[0]).toUpperCase() === String(u.query.codigo || '').toUpperCase()) {
        h.getRange(i + 2, 6).setValue(1);    // usos máximos
        h.getRange(i + 2, 7).setValue(9);    // usos confirmados
      }
    });
    return responderJson(res, { ok: true });
  }
  if (u.pathname === '/__demora') { demoraMs = Number(u.query.ms) || 0; return responderJson(res, { ok: true }); }
  if (u.pathname === '/__celda') {          // escribir una celda como lo haría el dueño
    const h = gas.hojas.get(u.query.hoja);
    h.getRange(Number(u.query.f), Number(u.query.c)).setValue(u.query.v);
    // En producción el catálogo va en caché 60 s; en la prueba no queremos esperarlos.
    delete gas.cache['catalogo'];
    if (u.query.disparar === '1') {
      gas.api.alEditar({ range: { getSheet: () => h,
        getColumn: () => Number(u.query.c), getNumColumns: () => 1 } });
    }
    return responderJson(res, { ok: true });
  }
  if (u.pathname === '/__llamar') {         // ejecutar una función del script
    const f = gas.api[u.query.f];
    if (!f) return responderJson(res, { ok: false, error: 'no existe ' + u.query.f });
    let r; try { r = f(); } catch (e) { return responderJson(res, { ok: false, error: String(e) }); }
    return responderJson(res, { ok: true, resultado: r === undefined ? null : r });
  }

  // ---- el endpoint del Apps Script ----
  /* EL CATÁLOGO HORNEADO. Por defecto NO existe —404— y eso es a propósito:
     así las baterías de navegador miden el camino de una tienda que todavía no
     ha corrido un montaje, que es como llega toda tienda nueva. Con
     CATALOGO_ESTATICO=1 se sirve el mismo catálogo que da la puerta, y entonces
     miden el camino de una tienda ya montada.

     QUEDA UN HUECO CONOCIDO Y ESCRITO: hoy ninguna batería de navegador corre
     con esa variable puesta. Se anota aquí y en el sprint en vez de dejarlo
     implícito, que es como este proyecto se ganó sus peores errores. */
  if (u.pathname === '/catalogo.json') {
    if (!process.env.CATALOGO_ESTATICO) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end('{"error":"sin hornear"}');
    }
    const d = JSON.parse(gas.api.doGet({ parameter: { a: 'catalogo', t: gas.token } })._texto);
    return responderJson(res, {
      esquema: d.esquema || 1, version: d.version, generado: new Date().toISOString(),
      productos: d.productos, envios: d.envios, config: d.config
    });
  }

  if (u.pathname === '/exec') {
    peticiones.push(u.query);
    const atender = () => {
      if (fallasPendientes > 0 && (tumbarTodo || u.query.a !== 'catalogo')) {
        fallasPendientes--;
        res.writeHead(503, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        return res.end('servicio no disponible');
      }
      let salida;
      if (req.method === 'POST') {
        let cuerpo = ''; req.on('data', d => cuerpo += d);
        return req.on('end', () => {
          salida = gas.api.doPost({ postData: { contents: cuerpo } });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(contenido(salida));
        });
      }
      salida = gas.api.doGet({ parameter: u.query });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(contenido(salida));
    };
    return demoraMs ? setTimeout(atender, demoraMs) : atender();
  }

  // ---- la tienda ----
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace(/const SCRIPT_URL = "[^"]*";/, 'const SCRIPT_URL = "' + ORIGEN + '/exec";')
             /* 'self' se conserva: desde el catálogo estático la página lee su
                propio catalogo.json, y sin 'self' la CSP lo bloquea sin decir
                por qué —no da error de red, simplemente no sale— y la prueba
                mediría el respaldo creyendo que mide lo bueno. */
             .replace(/connect-src [^;]+;/, "connect-src 'self' " + ORIGEN + ';');
  if (process.env.VERSION_VIEJA) {   // para probar la detección de versión
    html = html.replace(/const SCRIPT_VERSION = "[^"]*";/, 'const SCRIPT_VERSION = "otra-version";');
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

if (require.main === module) servidor.listen(PORT, () => console.log('servidor de pruebas en ' + ORIGEN));
module.exports = { servidor, gas: () => gas, PORT, ORIGEN };
