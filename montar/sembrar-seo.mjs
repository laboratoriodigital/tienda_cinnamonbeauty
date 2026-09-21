/**
 * Hornea SEO real desde publicar/catalogo.json.
 *
 * No consulta el maestro: el catálogo ya es la copia pública y revisada de la
 * hoja. De él salen el JSON-LD de la portada, una ficha HTML indexable por
 * producto, sitemap.xml y robots.txt. Así el robot y el comprador ven la misma
 * oferta, aun cuando el JavaScript de la vitrina tarde o no se ejecute.
 *
 *   node montar/sembrar-seo.mjs
 *   node montar/sembrar-seo.mjs --revisar
 */
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const CATALOGO = 'publicar/catalogo.json';
const INDEX = 'publicar/index.html';
const SALIDA = 'publicar';
const PRODUCTOS = join(SALIDA, 'productos');
const MARCA_INI = '<!-- ═══ SEO HORNEADO: NO EDITAR A MANO ═══ -->';
const MARCA_FIN = '<!-- ═══ FIN DEL SEO HORNEADO ═══ -->';
const revisar = process.argv.includes('--revisar');

const texto = v => String(v == null ? '' : v).trim();
const sinRellenar = v => !texto(v) || /^\[[^\]]+\]$/.test(texto(v));
const h = v => texto(v).replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));
const jsonSeguro = v => JSON.stringify(v, null, 2).replace(/</g, '\\u003c');
const urlBase = c => {
  let cruda = texto(c.config && c.config.sitio_url);
  /* La hoja históricamente aceptó `tienda.ejemplo.com` y el generador del
     <head> le antepone https. SEO tiene que obedecer el mismo contrato: exigir
     aquí el esquema rompería tiendas válidas solo durante el montaje. */
  if (!sinRellenar(cruda) && !/^[a-z][a-z0-9+.-]*:\/\//i.test(cruda)) {
    cruda = 'https://' + cruda;
  }
  let u;
  try { u = new URL(cruda); } catch { u = null; }
  if (!u || u.protocol !== 'https:' || !u.hostname) {
    throw new Error('Configuración.sitio_url debe ser una URL https pública para hornear SEO.');
  }
  u.hash = ''; u.search = '';
  return u.href.replace(/\/+$/, '') + '/';
};
const urlProducto = (base, id) => new URL('productos/' + encodeURIComponent(texto(id)) + '/', base).href;

function urlImagen(catalogo, nombre) {
  nombre = texto(nombre);
  if (!nombre) return '';
  if (/^https?:\/\//i.test(nombre)) return nombre;
  const disponibles = (catalogo.fotos && catalogo.fotos[nombre]) || [];
  if (disponibles.length) {
    const ancho = Math.max(...disponibles.map(Number).filter(Number.isFinite));
    nombre = basename(nombre, extname(nombre)) + '-' + ancho + '.webp';
  }
  const origen = texto(catalogo.config && catalogo.config.fotos_origen) ||
                 new URL('fotos/', urlBase(catalogo)).href;
  return origen.replace(/\/+$/, '') + '/' + nombre.split('/').map(encodeURIComponent).join('/');
}

function oferta(base, producto, variante) {
  const stock = variante ? Number(variante.stock) : Number(producto.stock);
  const precio = variante ? Number(variante.precio || producto.precio) : Number(producto.precio);
  return {
    '@type': 'Offer',
    url: urlProducto(base, producto.id) + (variante ? '?v=' + encodeURIComponent(variante.id) : ''),
    priceCurrency: 'COP',
    price: String(Math.max(0, precio || 0)),
    availability: 'https://schema.org/' + (stock > 0 ? 'InStock' : 'OutOfStock'),
    itemCondition: 'https://schema.org/NewCondition'
  };
}

const propiedadEje = nombre => {
  const n = texto(nombre).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return ({ color:'https://schema.org/color', talla:'https://schema.org/size',
    tamano:'https://schema.org/size', tamaño:'https://schema.org/size',
    material:'https://schema.org/material', patron:'https://schema.org/pattern' })[n] || '';
};

function datosProducto(catalogo, producto) {
  const base = urlBase(catalogo);
  const imagenes = (producto.imagenes || []).map(n => urlImagen(catalogo, n)).filter(Boolean);
  const comun = {
    '@context': 'https://schema.org',
    name: texto(producto.nombre),
    description: texto(producto.descripcion || producto.formato),
    url: urlProducto(base, producto.id),
    image: imagenes
  };
  if (!imagenes.length) delete comun.image;

  if (Array.isArray(producto.variantes) && producto.variantes.length) {
    const ejes = (producto.ejes || []).map(e => propiedadEje(e.nombre)).filter(Boolean);
    const grupo = { ...comun, '@type':'ProductGroup', productGroupID:texto(producto.id) };
    if (ejes.length) grupo.variesBy = [...new Set(ejes)];
    grupo.hasVariant = producto.variantes.map(v => {
      const opciones = v.opciones && typeof v.opciones === 'object' ? v.opciones : {};
      const sufijo = Object.values(opciones).map(texto).filter(Boolean).join(' / ');
      const fotos = (v.imagenes && v.imagenes.length ? v.imagenes : producto.imagenes || [])
        .map(n => urlImagen(catalogo, n)).filter(Boolean);
      const item = {
        '@type':'Product', name: texto(producto.nombre) + (sufijo ? ' – ' + sufijo : ''),
        url: urlProducto(base, producto.id) + '?v=' + encodeURIComponent(v.id),
        isVariantOf: { '@type':'ProductGroup', productGroupID:texto(producto.id) },
        offers: oferta(base, producto, v)
      };
      if (!sinRellenar(v.sku)) item.sku = texto(v.sku);
      if (fotos.length) item.image = fotos;
      const extras = Object.entries(opciones).map(([nombre, valor]) => ({
        '@type':'PropertyValue', name:texto(nombre), value:texto(valor)
      })).filter(x => x.name && x.value);
      if (extras.length) item.additionalProperty = extras;
      return item;
    });
    return grupo;
  }

  const item = { ...comun, '@type':'Product', offers:oferta(base, producto) };
  if (!sinRellenar(producto.referencia)) item.sku = texto(producto.referencia);
  return item;
}

function datosPortada(catalogo) {
  const c = catalogo.config || {};
  const base = urlBase(catalogo);
  const nombre = texto(c.negocio || c.empresa_razon);
  const org = { '@type':'Organization', '@id':base + '#organizacion', name:nombre, url:base };
  const logo = texto(c.logo);
  if (!sinRellenar(logo)) org.logo = /^https?:\/\//i.test(logo) ? logo : new URL(logo.replace(/^\/+/, ''), base).href;
  if (!sinRellenar(c.empresa_correo)) org.email = texto(c.empresa_correo);
  if (!sinRellenar(c.empresa_tel)) org.telephone = texto(c.empresa_tel);
  const direccion = {};
  if (!sinRellenar(c.empresa_direccion)) direccion.streetAddress = texto(c.empresa_direccion);
  if (!sinRellenar(c.empresa_ciudad)) direccion.addressLocality = texto(c.empresa_ciudad);
  if (Object.keys(direccion).length) org.address = { '@type':'PostalAddress', ...direccion, addressCountry:'CO' };
  const sitio = { '@type':'WebSite', '@id':base + '#sitio', url:base,
    name:texto(c.sitio_titulo || nombre), publisher:{ '@id':org['@id'] } };
  if (!sinRellenar(c.sitio_descripcion)) sitio.description = texto(c.sitio_descripcion);
  return { '@context':'https://schema.org', '@graph':[org, sitio] };
}

function bloquePortada(catalogo) {
  return MARCA_INI + '\n<script type="application/ld+json">\n' +
    jsonSeguro(datosPortada(catalogo)) + '\n</script>\n' + MARCA_FIN;
}

export function aplicarIndex(html, catalogo) {
  const bloque = bloquePortada(catalogo);
  const re = new RegExp(MARCA_INI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' +
    MARCA_FIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  let salida;
  if (re.test(html)) salida = html.replace(re, bloque);
  else {
    if (!/<\/head>/i.test(html)) throw new Error('publicar/index.html no tiene </head>.');
    salida = html.replace(/<\/head>/i, bloque + '\n</head>');
  }
  /* preparar-index conserva los textos entre corchetes para que el dueño vea
     qué falta. En metadatos públicos esos textos parecen información real y
     degradan el resultado compartido; SEO los retira hasta que se llenen. */
  if (sinRellenar(catalogo.config && catalogo.config.sitio_descripcion)) {
    salida = salida
      .replace(/\s*<meta name="description" content="[^"]*">/i, '')
      .replace(/\s*<meta property="og:description" content="[^"]*">/i, '');
  }
  return salida;
}

function paginaProducto(catalogo, producto) {
  const c = catalogo.config || {};
  const base = urlBase(catalogo);
  const url = urlProducto(base, producto.id);
  const nombreTienda = texto(c.negocio || c.empresa_razon);
  const descripcion = texto(producto.descripcion || producto.formato || producto.nombre);
  const schema = datosProducto(catalogo, producto);
  const imagen = (producto.imagenes || []).map(n => urlImagen(catalogo, n)).find(Boolean);
  const variantes = Array.isArray(producto.variantes) && producto.variantes.length;
  const stock = variantes ? producto.variantes.reduce((n,v) => n + Math.max(0, Number(v.stock)||0), 0) : Number(producto.stock)||0;
  const precios = variantes ? producto.variantes.map(v => Number(v.precio || producto.precio)||0) : [Number(producto.precio)||0];
  const desde = Math.min(...precios.filter(n => n >= 0));
  const moneda = new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(desde);
  const compra = new URL(base); compra.searchParams.set('p', producto.id);
  return `<!DOCTYPE html>
<html lang="es-CO"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(producto.nombre)} — ${h(nombreTienda)}</title>
<meta name="description" content="${h(descripcion)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${h(url)}">
<meta property="og:type" content="product"><meta property="og:locale" content="es_CO">
<meta property="og:site_name" content="${h(nombreTienda)}"><meta property="og:title" content="${h(producto.nombre)}">
<meta property="og:description" content="${h(descripcion)}"><meta property="og:url" content="${h(url)}">
${imagen ? `<meta property="og:image" content="${h(imagen)}">` : ''}
<script type="application/ld+json">${jsonSeguro(schema)}</script>
<style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font:400 16px/1.55 system-ui,sans-serif}main{max-width:960px;margin:auto;padding:32px 20px 64px}nav a{color:#444}.ficha{display:grid;grid-template-columns:minmax(260px,1fr) 1fr;gap:40px;margin-top:32px;align-items:start}.foto{width:100%;aspect-ratio:1;object-fit:cover;background:#f3f3f3;border-radius:12px}h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.05;margin:.25em 0}.precio{font-size:1.65rem;font-weight:800}.estado{color:${stock > 0 ? '#17643a' : '#8b1e1e'};font-weight:700}.boton{display:inline-block;margin-top:18px;padding:14px 22px;background:#111;color:#fff;text-decoration:none;font-weight:700;border-radius:4px}.opciones{padding-left:20px}@media(max-width:680px){.ficha{grid-template-columns:1fr}}</style>
</head><body><main>
<nav><a href="${h(base)}">← Volver a ${h(nombreTienda)}</a></nav>
<article class="ficha">${imagen ? `<img class="foto" src="${h(imagen)}" alt="${h(producto.nombre)}" width="900" height="900">` : '<div class="foto" aria-hidden="true"></div>'}
<div><p>${h(producto.categoria || '')}</p><h1>${h(producto.nombre)}</h1><p>${h(descripcion)}</p>
<p class="precio">${variantes ? 'Desde ' : ''}${h(moneda)}</p><p class="estado">${stock > 0 ? 'Disponible' : 'Agotado'}</p>
${variantes ? `<h2>Opciones</h2><ul class="opciones">${producto.variantes.map(v => `<li>${h(Object.values(v.opciones || {}).join(' · '))} — ${Number(v.stock)>0?'disponible':'agotado'}</li>`).join('')}</ul>` : ''}
<a class="boton" href="${h(compra.href)}">Ver y comprar en la tienda</a></div></article>
</main></body></html>\n`;
}

export function hornearSeo(catalogo) {
  const base = urlBase(catalogo);
  /* Un ID repetido ya es ambiguo para la tienda: producto(id) toma la primera
     coincidencia. El SEO debe usar esa misma ficha y no anunciar cinco veces
     una URL que solo puede mostrar un producto. El dueño aún debe corregir
     los IDs en la hoja; este resguardo no los convierte en productos distintos. */
  const vistos = new Set();
  const productos = (catalogo.productos || []).filter(p => {
    if (!p || !p.id || !p.nombre || p.activo === false) return false;
    const id = encodeURIComponent(texto(p.id));
    if (vistos.has(id)) return false;
    vistos.add(id);
    return true;
  });
  const paginas = new Map(productos.map(p => [encodeURIComponent(texto(p.id)), paginaProducto(catalogo, p)]));
  const urls = [base, ...productos.map(p => urlProducto(base, p.id))];
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + h(u) + '</loc></url>').join('\n') + '\n</urlset>\n';
  const robots = 'User-agent: *\nAllow: /\n\nSitemap: ' + new URL('sitemap.xml', base).href + '\n';
  return { paginas, sitemap, robots, portada:datosPortada(catalogo) };
}

async function iguales(catalogo, html) {
  const seo = hornearSeo(catalogo);
  if (aplicarIndex(html, catalogo) !== html) return false;
  if ((await readFile(join(SALIDA, 'sitemap.xml'), 'utf8').catch(()=>'')) !== seo.sitemap) return false;
  if ((await readFile(join(SALIDA, 'robots.txt'), 'utf8').catch(()=>'')) !== seo.robots) return false;
  const dirs = (await readdir(PRODUCTOS, { withFileTypes:true }).catch(()=>[])).filter(x=>x.isDirectory()).map(x=>x.name).sort();
  if (JSON.stringify(dirs) !== JSON.stringify([...seo.paginas.keys()].sort())) return false;
  for (const [dir, contenido] of seo.paginas) {
    if ((await readFile(join(PRODUCTOS, dir, 'index.html'), 'utf8').catch(()=>'')) !== contenido) return false;
  }
  return true;
}

async function main() {
  const catalogo = JSON.parse(await readFile(CATALOGO, 'utf8'));
  const html = await readFile(INDEX, 'utf8');
  const seo = hornearSeo(catalogo);
  const alDia = await iguales(catalogo, html);
  if (revisar) {
    console.log(alDia ? 'El SEO horneado está al día.' : 'El SEO horneado NO está al día.');
    process.exitCode = alDia ? 0 : 1;
    return;
  }
  await writeFile(INDEX, aplicarIndex(html, catalogo));
  await writeFile(join(SALIDA, 'sitemap.xml'), seo.sitemap);
  await writeFile(join(SALIDA, 'robots.txt'), seo.robots);
  await rm(PRODUCTOS, { recursive:true, force:true });
  await mkdir(PRODUCTOS, { recursive:true });
  for (const [dir, contenido] of seo.paginas) {
    await mkdir(join(PRODUCTOS, dir), { recursive:true });
    await writeFile(join(PRODUCTOS, dir, 'index.html'), contenido);
  }
  console.log('SEO horneado: portada, sitemap, robots y ' + seo.paginas.size + ' fichas de producto.');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
