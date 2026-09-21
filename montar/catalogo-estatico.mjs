/**
 * ORGÁNICO — hornear el catálogo dentro del sitio
 * ---------------------------------------------------------------------------
 * Le pide el catálogo al maestro y lo deja escrito en publicar/catalogo.json.
 *
 *   node montar/catalogo-estatico.mjs
 *   node montar/catalogo-estatico.mjs --revisar   (no escribe; dice si cambió)
 *
 * POR QUÉ EXISTE ESTE ARCHIVO.
 * Lo que aprieta en Apps Script no es una cuota diaria: son 30 ejecuciones
 * SIMULTÁNEAS por cuenta de Google, y ese número es igual en la versión de
 * pago. Es un límite de concurrencia, no de volumen. Mil visitas repartidas en
 * el día no son nada; cien en el mismo minuto son el problema — y una campaña
 * de WhatsApp a mil personas concentra las visitas en diez minutos.
 *
 * Mientras la vitrina le pregunte el catálogo al maestro en cada visita, MIRAR
 * y COMPRAR compiten por las mismas 30 ejecuciones. Y el que pierde esa
 * competencia es el que iba a pagar. Con el catálogo horneado en el sitio, la
 * vitrina se sirve desde el borde de Cloudflare —donde no hay cuota que
 * gastar— y el maestro queda entero para lo único que solo él puede hacer:
 * sellar precios y registrar pedidos.
 *
 * LO QUE NO CAMBIA: los precios los sigue poniendo la hoja. Este archivo es
 * para MIRAR. Al enviar el pedido, el maestro revalida contra el catálogo vivo
 * y si algo cambió, lo dice. Congelar la vitrina no es congelar la venta.
 *
 * EL COSTO QUE SE ACEPTA, dicho sin adornos: entre que el comerciante cambia un
 * precio y ese precio se ve en la tienda, ahora pasa un despliegue. Antes eran
 * diez segundos. Por eso el sello sigue siendo obligatorio y por eso la página
 * avisa cuando el total que calculó no es el que confirmó la hoja.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro } from './tienda.mjs';

const ARCHIVO = 'publicar/catalogo.json';
const CARPETA_FOTOS = join('publicar', 'fotos');
/* Las mismas que genera traer-fotos.mjs. Si un dia cambian alli, aqui sobra o
   falta una medida y el manifiesto deja de cuadrar con el disco - por eso hay
   una asercion que compara las dos listas. */
const ANCHOS = [160, 600, 900];
const revisar = process.argv.includes('--revisar');

/* Lo que se hornea NO es la respuesta cruda del maestro. Se copia campo por
   campo, por dos razones: que un campo nuevo del maestro no se cuele al sitio
   sin que nadie lo mire, y que el archivo publicado tenga una forma estable
   que se pueda comparar entre despliegues. */
function soloLoQueSePublica(d) {
  const productos = (d.productos || [])
    .filter(p => p && p.id && p.nombre && p.activo !== false)
    .map(p => ({
      id: String(p.id),
      nombre: String(p.nombre || ''),
      formato: String(p.formato || ''),
      categoria: String(p.categoria || 'Otros'),
      precio: Number(p.precio) || 0,
      stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
      descripcion: String(p.descripcion || ''),
      imagenes: Array.isArray(p.imagenes) ? p.imagenes.slice(0, 6) : [],
      destacado: p.destacado === true,
      referencia: String(p.referencia || ''),
      precioAntes: (Number(p.precioAntes) || 0) > (Number(p.precio) || 0)
        ? Number(p.precioAntes) : 0,
      umbralBajo: Math.max(0, Math.floor(Number(p.umbralBajo) || 0)),
      ejes: Array.isArray(p.ejes) ? p.ejes.map(e => ({
        nombre:String(e.nombre || ''), valores:Array.isArray(e.valores) ? e.valores.map(String) : []
      })) : [],
      variantes: Array.isArray(p.variantes) ? p.variantes.map(v => ({
        id:String(v.id || ''), sku:String(v.sku || ''),
        opciones:v.opciones && typeof v.opciones === 'object' ? {...v.opciones} : {},
        precio:Math.max(0, Number(v.precio) || Number(p.precio) || 0),
        stock:Math.max(0, Math.floor(Number(v.stock) || 0)),
        imagenes:Array.isArray(v.imagenes) ? v.imagenes.map(String).filter(Boolean).slice(0, 6) : []
      })).filter(v => v.id) : []
    }));

  const envios = (d.envios || [])
    .filter(e => e && e.id)
    .map(e => ({ id: String(e.id), nombre: String(e.nombre || e.id),
                 valor: Math.max(0, Number(e.valor) || 0) }));

  /* La configuración viene ya filtrada por configPublica() en el maestro —las
     claves pago_* no salen por ?a=catalogo—, pero este archivo se queda EN EL
     REPOSITORIO, que es público. Así que se vuelve a filtrar aquí. Dos filtros
     para la misma regla no es redundancia: es que el segundo protege de que
     alguien cambie el primero sin acordarse de este archivo. */
  const config = {};
  Object.keys(d.config || {}).forEach(k => {
    if (k.indexOf('pago_') === 0) return;
    config[k] = String(d.config[k]);
  });

  return {
    esquema: Number(d.esquema) || 1,
    version: String(d.version || ''),
    generado: new Date().toISOString(),
    productos, envios, config
  };
}

/* QUÉ MEDIDAS EXISTEN DE VERDAD, mirando el disco.
   ----------------------------------------------------------------------------
   Hasta ahora la página ADIVINABA: si la hoja decía que use WebP, pedía
   `chonto-1-600.webp` y, si no existía, se comía un 404 y volvía al original.
   Funcionaba —el respaldo está bien hecho— pero cada tarjeta sin derivadas
   costaba dos peticiones fallidas, y en la consola del comerciante se veía un
   reguero de rojos que no significaban nada. Un respaldo no debería activarse
   en el caso normal.

   Aquí se lista lo que hay. No se promete nada que no esté en la carpeta. */
async function medidasEnDisco(productos, carpeta = CARPETA_FOTOS) {
  let archivos = [];
  try { archivos = await readdir(carpeta); } catch { return {}; }
  const hay = new Set(archivos);

  const nombres = new Set();
  productos.forEach(p => [...(p.imagenes || []), ...(p.variantes || []).flatMap(v => v.imagenes || [])].forEach(n => {
    const t = String(n || '').trim();
    /* Una URL completa en la hoja se sirve tal cual: no hay derivadas nuestras
       que listar, y meterla aquí sería prometer archivos de otro. */
    if (t && !/^https?:\/\//i.test(t)) nombres.add(t);
  }));

  const mapa = {};
  nombres.forEach(n => {
    const raiz = basename(n, extname(n));
    const anchos = ANCHOS.filter(a => hay.has(`${raiz}-${a}.webp`));
    if (anchos.length) mapa[n] = anchos;
  });
  return mapa;
}

/* Para comparar dos horneadas hay que ignorar `generado`: cambia siempre y
   haría que cada corrida pareciera un cambio. */
function sinFecha(j) {
  const c = JSON.parse(JSON.stringify(j));
  delete c.generado;
  return JSON.stringify(c);
}

/* Se exporta para que las baterías horneen sin red: le dan la respuesta de la
   puerta tal cual y comprueban qué sale. Es síncrona a propósito — no hay nada
   que esperar aquí, y una promesa solo obligaría a las pruebas a ser async. */
export { medidasEnDisco, ANCHOS };

export function hornear(datos) {
  return soloLoQueSePublica(datos);
}

async function principal() {
  const tienda = await laTienda();
  const d = await alMaestro(tienda, 'catalogo');

  /* Un catálogo vacío no se publica NUNCA. Escribirlo dejaría la tienda con
     cero productos y sin un error a la vista: exactamente el modo de fallo que
     este proyecto lleva meses persiguiendo. */
  const nuevo = soloLoQueSePublica(d);
  nuevo.fotos = await medidasEnDisco(nuevo.productos);
  if (!nuevo.productos.length) {
    console.error('\nEl maestro devolvió CERO productos activos. No se escribe nada.\n' +
                  'Revisa la pestaña Catálogo: la columna Activo y los precios.\n');
    process.exit(1);
  }

  let anterior = null;
  try { anterior = JSON.parse(await readFile(ARCHIVO, 'utf8')); } catch { }

  const igual = anterior && sinFecha(anterior) === sinFecha(nuevo);
  const cuantos = nuevo.productos.length;

  if (revisar) {
    console.log(igual
      ? `El catálogo publicado está al día (${cuantos} productos).`
      : `El catálogo publicado NO está al día (${cuantos} productos en la hoja).`);
    process.exitCode = igual ? 0 : 1;
    return;
  }

  if (igual) {
    console.log(`Nada que cambiar: ${cuantos} productos, iguales a los publicados.`);
    return;
  }

  await writeFile(ARCHIVO, JSON.stringify(nuevo, null, 1) + '\n');
  console.log(`Catálogo horneado: ${cuantos} productos, ${nuevo.envios.length} zonas de envío.`);
  const conMedidas = Object.keys(nuevo.fotos || {}).length;
  console.log(`Fotos con medidas generadas: ${conMedidas}.` +
              (conMedidas ? '' : ' Ninguna: la página va a pedir los originales.'));
  console.log(`Esquema ${nuevo.esquema} · maestro ${nuevo.version}`);
  if (anterior) {
    const antes = anterior.productos.length;
    if (antes !== cuantos) console.log(`Productos: ${antes} -> ${cuantos}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  principal().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
