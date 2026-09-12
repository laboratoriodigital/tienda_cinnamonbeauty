/* ============================================================================
   ESPERAR UNA CONDICIÓN, NO UN NÚMERO DE MILISEGUNDOS.
   ----------------------------------------------------------------------------
   Las baterías de navegador estaban llenas de `page.waitForTimeout(1600)`.
   Medido: de los 292 s que tardaba la suite entera, 182 —el 62 %— eran esto:
   dormir. No probar, dormir.

   Y dormir un número fijo es peor que lento, es INESTABLE en los dos sentidos:

   · Si el runner va cargado, 400 ms no alcanzan y la batería falla con algo
     que no tiene nada que ver con lo que probaba. Un rojo que no significa
     nada enseña a no mirar los rojos.
   · Si va suelto, la espera sobra entera y se paga igual.

   Es el patrón 8 de la bitácora —el reloj como entrada que nadie declaró—
   aplicado a las propias pruebas.

   La cura no es bajar los números: es preguntar por la condición. La página ya
   dice cuándo terminó cada cosa; lo único que faltaba era mirarlo.

   NINGUNA DE ESTAS FUNCIONES AFLOJA UNA ASERCIÓN. Esperan lo mismo que se
   esperaba antes —a veces MÁS, porque el tope es alto— y devuelven en cuanto
   la página está en el estado que la aserción va a mirar.
   ============================================================================ */

/* El tope no es «cuánto esperar»: es cuánto se aguanta antes de decir que algo
   se quedó colgado. Alto a propósito. Lo normal es salir en décimas. */
const TOPE = 20000;

/** El catálogo ya se resolvió: llegó el del maestro, o se cayó al del archivo.
 *  `catalogoResuelto` lo pone `terminarCarga()`, que es el final de los dos
 *  caminos. Sin hoja conectada nace en `true`. */
async function catalogoListo(p, tope = TOPE) {
  await p.waitForFunction(() => catalogoResuelto === true, null, { timeout: tope });
}

/** El sello dejó de estar en camino.
 *
 *  Hay que contar TRES estados, no uno, y por eso `!validando` a secas no
 *  sirve: entre que el carrito cambia y que sale la petición hay un rebote de
 *  400 ms en el que `validando` todavía es false y el sello ya viene.
 *
 *  Se considera asentado cuando el sello que hay corresponde al pedido que hay
 *  (éxito), o cuando esa misma firma quedó marcada como fallida (se agotaron
 *  los reintentos). Las dos son respuestas; lo que no es respuesta es el
 *  intervalo entre medias. */
async function selloListo(p, tope = TOPE) {
  await p.waitForFunction(() => {
    if (typeof SCRIPT_URL === 'undefined' || !SCRIPT_URL) return true;  // tienda sin hoja
    if (!carrito.length) return true;                                   // no hay qué sellar
    if (validando) return false;
    const firma = firmaPedido();
    return (sello && sello.firma === firma) || firmaFallida === firma;
  }, null, { timeout: tope });
}

/** Las dos cosas, que es lo que hace falta después de un `goto` con carrito. */
async function todoListo(p, tope = TOPE) {
  await catalogoListo(p, tope);
  await selloListo(p, tope);
}

/** Una condición cualquiera dentro de la página, con el mismo tope y el mismo
 *  mensaje cuando se cuelga. Para lo que no es ni catálogo ni sello. */
async function hasta(p, fn, tope = TOPE) {
  await p.waitForFunction(fn, null, { timeout: tope });
}

/** Y del lado del servidor: esperar a que la hoja tenga lo que se escribió.
 *
 *  Esto reemplaza a los `waitForTimeout` de después de «Finalizar». Lo que se
 *  esperaba era que el registro llegara a la hoja, y eso no se ve en la
 *  página: se ve en la hoja. Ahora se le pregunta a ella. */
async function filasEn(U, hoja, cuantas, tope = TOPE) {
  const hasta_ = Date.now() + tope;
  const cuenta = h => (h[hoja] || []).slice(1)
    .filter(f => f && f.length && String(f[1] || f[0]).trim() !== '').length;
  let ultimo = -1;
  while (Date.now() < hasta_) {
    const h = await (await fetch(U + '/__hojas')).json();
    ultimo = cuenta(h);
    if (ultimo >= cuantas) return h;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error('La hoja ' + hoja + ' se quedó en ' + ultimo + ' líneas y se ' +
                  'esperaban ' + cuantas + ' tras ' + (tope / 1000) + ' s.');
}

/** La página ya repintó.
 *
 *  Para lo que NO sale de la red: paginar, filtrar, buscar, abrir un diálogo.
 *  Ahí `refrescar()` corre en el acto y lo único que faltaba era dejar al
 *  navegador dibujar. Dos cuadros es el modo estándar de saber que pintó, y
 *  cuestan ~30 ms en vez de los 300-500 que había puestos a ojo. */
async function pintado(p) {
  await p.evaluate(() => new Promise(r =>
    requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** Y lo mismo para cualquier otra cosa que tenga que aparecer EN LA HOJA:
 *  un stock descontado, una celda marcada, una fila que cambia de estado.
 *  Se le pregunta a la hoja hasta que lo diga, en vez de dar por hecho que a
 *  los 300 ms el disparador ya corrió. */
async function hojaCuando(U, fn, tope = TOPE) {
  const limite = Date.now() + tope;
  let ultima = null;
  while (Date.now() < limite) {
    ultima = await (await fetch(U + '/__hojas')).json();
    if (fn(ultima)) return ultima;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error('La hoja no llegó al estado esperado tras ' + (tope / 1000) + ' s.');
}

/** LA ÚNICA ESPERA FIJA QUE SE ADMITE, Y CON NOMBRE.
 *
 *  Hay un caso en el que no existe condición que esperar: cuando lo que se
 *  exige es una AUSENCIA —«no sale ninguna petición más», «no aparece una
 *  tercera línea»—. Nada va a llegar, así que no hay nada a lo que asomarse:
 *  hay que mirar durante un rato y comprobar que sigue sin pasar.
 *
 *  Eso es legítimo, pero tiene que decir que lo es. Por eso pasa por aquí y no
 *  por un `waitForTimeout` suelto: un número a secas en medio de una batería es
 *  indistinguible de los 182 segundos que acabamos de quitar.
 *
 *  Antes de usar esto: si hay algo que pueda llegar, espera A ESO. */
async function ventana(p, ms, porQue) {
  if (!porQue) throw new Error('ventana() necesita decir por qué hace falta.');
  await p.waitForTimeout(ms);
}

module.exports = { catalogoListo, selloListo, todoListo, hasta, filasEn,
                   hojaCuando, pintado, ventana, TOPE };
