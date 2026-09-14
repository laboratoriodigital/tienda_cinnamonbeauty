/**
 * EL ARNÉS ES UNA SOLA TIENDA.
 * ---------------------------------------------------------------------------
 * Escribe `pruebas/index.html` a partir de `publicar/index.html` del
 * repositorio, reemplazando su catálogo de respaldo y su CONFIG_SEMILLA por los
 * de LA HOJA EMULADA — la misma que van a conducir las baterías.
 *
 *   node pruebas/arnes.mjs          (lo corre todas.sh, no se llama a mano)
 *
 * POR QUÉ EXISTE.
 * Desde el 4.20 `publicar/index.html` lleva dentro el catálogo y la
 * configuración de SU comercio: es lo que la página pinta antes de que conteste
 * nadie. Y las baterías conducen la hoja emulada de `gas.js`, que es otra
 * tienda. Dejar las dos puestas es probar un comercio que no existe, y los
 * síntomas no se parecen a la causa:
 *
 *   · `val.js` hacía `agregar('chonto')` a propósito ANTES de que llegara el
 *     catálogo —está mirando la pantalla mientras la hoja tarda— y reventaba
 *     con «Cannot read properties of undefined»: en el archivo de una tienda de
 *     cosméticos no hay ningún `chonto`.
 *   · `config.js` leía «Orgánico» sin red en el repositorio de otra tienda.
 *   · `fotos.js` exigía que las fotos salgan del propio sitio mientras la
 *     semilla decía que salen de la dirección de producción de otro comercio.
 *
 * Ninguna de las tres tenía nada que ver con lo que decía su título.
 *
 * LA REGLA: EL ARCHIVO Y LA HOJA QUE SE PRUEBAN SON DEL MISMO COMERCIO.
 * No se borra el respaldo —eso dejaría sin probar el camino que el 4.20 existe
 * para arreglar—: se reemplaza por el de la hoja emulada. El arnés queda siendo
 * una tienda coherente, y da igual de qué comercio sea el repositorio.
 *
 * Quien prueba que ESE camino funciona para un comercio cualquiera es
 * `respaldo.js`, que se escribe su propio archivo con una tienda inventada y lo
 * sirve con la hoja muerta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { aplicar } from '../montar/sembrar-respaldo.mjs';

const require = createRequire(import.meta.url);

/* `instalar()` y `generarStub()` imprimen media pantalla, y esto corre dentro
   de todas.sh: el registro del arnés tiene que ser una línea, no doscientas. */
const gas = require('./gas.js');
const decir = console.log;
console.log = () => {};
const g = gas.crear('./as.js');
g.api.instalar();
gas.configurar(g);

/* Se le pregunta al maestro emulado por la MISMA puerta que usa el montaje de
   verdad. Armar aquí el catálogo a mano sería una segunda implementación del
   mismo criterio, y de las dos, una se queda atrás (patrón 2). */
const r = JSON.parse(g.api.doGet({ parameter: { a: 'catalogo' } })._texto);
console.log = decir;
if (!r || !r.ok || !r.productos || !r.productos.length) {
  console.error('El maestro emulado no entregó catálogo; el arnés quedaría sin respaldo.');
  process.exit(1);
}

const html = readFileSync('./index.html', 'utf8');
const puesto = aplicar(html, {
  productos: r.productos.filter(p => p.activo !== false),
  envios: r.envios,
  config: r.config
}, 'arnés');

writeFileSync('./index.html', puesto.html);
console.log('Arnés: index.html con el catálogo de la hoja emulada — ' +
            puesto.productos + ' productos, ' + puesto.envios + ' envíos, ' +
            (puesto.negocio || '(sin nombre)') + '.');
