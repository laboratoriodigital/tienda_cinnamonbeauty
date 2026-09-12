# Sprint 2 — Catálogo estático

**Meta: el navegador deja de hablar con Google para mirar.**

Empezado el 9 de septiembre de 2026, con el Sprint 1 escrito y **todavía sin
probar en la tienda**. Eso obliga a una regla para este sprint: **nada de aquí
se despliega hasta que 2.3.0 esté verificada.** El siguiente despliegue va a
llevar las dos cosas, y hay que saberlo antes de dispararlo, no después.

---

## Tablero

| # | Historia | Estado |
|---|---|---|
| S2-1 | El montaje hornea `publicar/catalogo.json` desde la hoja | ✅ `montar/catalogo-estatico.mjs` |
| S2-2 | La vitrina lo lee primero y solo habla con el maestro para vender | ✅ |
| S2-3 | Los dos respaldos siguen ahí: maestro en vivo, y el inventario del archivo | ✅ |
| S2-8 | La CSP de `_headers` y la caché de `catalogo.json` | ✅ y una aserción que compara las tres CSP |
| S2-9 | «¿Cambió algo?» tiene que ver los archivos nuevos | ✅ — costó una corrida en verde |
| S2-4 | Publicar desde el menú de la hoja — «Publicar ahora» | ⬜ Es el Sprint 4 |
| S2-5 | Republicar cada 4 horas y al agotarse un producto | ⬜ Es el Sprint 4 |
| S2-6 | Medir el pico horario antes y después | ⬜ **Tuyo**, con la tienda en el aire |
| **MEDIDO** | **La vitrina ya no llama a Google para mirar** | ✅ 9 de septiembre, en producción |
| S2-7 | Una batería de navegador que corra con el catálogo horneado | ⬜ Hueco conocido |

---

## Por qué, en una frase que no es la que uno espera

No es por velocidad. **Lo que aprieta en Apps Script son 30 ejecuciones
simultáneas por cuenta de Google, y ese número es idéntico en la versión de
pago.** Es un límite de *concurrencia*, no de *volumen*:

| | Cuota diaria | Concurrencia (lo real) |
|---|---|---|
| Mil visitas repartidas en el día | te mata | no es nada |
| Cien visitas en el mismo minuto | no es nada | **es el problema** |

Mientras **mirar** y **comprar** compitan por esas 30 ejecuciones, el que pierde
la competencia es el que iba a pagar. Una campaña de WhatsApp a mil personas
concentra las visitas en diez minutos: esa es la hora en que esto se prueba, no
un martes cualquiera.

Con el catálogo servido desde el borde de Cloudflare —donde no hay cuota que
gastar— el maestro queda entero para lo único que solo él puede hacer: **sellar
precios y registrar pedidos.**

---

## De dónde sale el catálogo, en orden

```
1. catalogo.json          mismo sitio, sin Google        ← lo hornea el montaje
2. ?a=catalogo            el maestro en vivo             ← si el 1 no está
3. el inventario horneado dentro del index.html          ← si el 2 tampoco
```

**El paso 2 no se retira**, y esa es una decisión, no un olvido: una tienda que
todavía no ha corrido un montaje no tiene `catalogo.json` y tiene que funcionar
igual. Es el estado en que llega toda tienda nueva.

El paso 3 **avisa al comprador**, con el cartel que se estrenó en el Sprint 1.

**Un `catalogo.json` válido pero vacío no se usa.** Es peor que no tenerlo:
dejaría la tienda sin nada que vender y sin un error a la vista. Y la
herramienta se niega a escribirlo por el mismo motivo.

---

## El costo que se acepta, dicho sin adornos

Entre que el comerciante cambia un precio y ese precio se ve en la tienda, ahora
pasa **un despliegue**. Antes eran diez segundos.

Lo que compensa ese costo es que **los precios los sigue poniendo la hoja**: al
enviar el pedido, el maestro revalida contra el catálogo vivo, y si algo cambió,
lo dice. Congelar la vitrina no es congelar la venta. Por eso el sello sigue
siendo obligatorio, y por eso la página avisa cuando el total que ella calculó
no es el que confirmó la hoja.

La mitigación de sobreventa es la misma regla de siempre, ahora con el umbral
que pone el comercio (`Umbral bajo`, Sprint 1): stock bajo se marca en la
tarjeta, y el pedido sale con nota de confirmar disponibilidad.

---

## Dos cosas que casi se escapan

**La CSP tenía que crecer, y vive en TRES sitios.** La página lee ahora un
archivo de su propio sitio, y `connect-src` no tenía `'self'`. Se arregló en el
`<meta>` del `index.html` y en la CSP que genera el maestro… y al revisar quedó
a la vista el tercero: **`publicar/_headers`**, que Cloudflare aplica como
cabecera de verdad.

Las dos CSP —la del `<meta>` y la de la cabecera— **se aplican a la vez, y manda
la más restrictiva**. Con `'self'` en una y sin él en la otra, el fetch a
`catalogo.json` se habría bloqueado **en producción y solo ahí**: en las pruebas
locales, donde `_headers` no interviene, todo pasaba.

Y el síntoma habría sido el de siempre: **una petición bloqueada por la CSP no
da error de red**. Simplemente no sale. La tienda habría caído al catálogo de
respaldo, con su cartel amarillo, y el diagnóstico habría sido «la hoja no
contesta» — buscando el problema en Google durante horas.

> Hay ahora una aserción que compara las tres copias entre sí y falla si
> divergen. No que cada una contenga `'self'`: que **digan lo mismo**. Es la
> diferencia entre comprobar tres cosas y comprobar que son una.

**Las claves de pago se filtran dos veces.** El maestro ya las quita de
`?a=catalogo`; la herramienta las vuelve a quitar al escribir el archivo. No es
redundancia: **este JSON se queda en el repositorio, que es público**, y el
segundo filtro protege de que alguien cambie el primero sin acordarse de este
archivo.

---

## Lo que pasó en la primera corrida de verdad

**El montaje corrió, dijo que todo salió bien, y no publicó nada.** El maestro
sí se publicó y `instalar()` sí agregó las columnas; pero `catalogo.json` se
horneó dentro del runner y se perdió con él.

La causa: el paso «¿Cambió algo?» usaba `git diff --quiet -- publicar/`, y **`git
diff` no ve los archivos sin seguimiento**. Un archivo recién creado no aparece
ahí. El paso contestó «Nada cambió en la hoja ni en el Drive», no abrió el pull
request, y la corrida terminó en verde.

Se descubrió por descarte: no había rama `montaje/desde-la-hoja` en el remoto
para un montaje que decía haber ido bien.

> Un paso llamado **«¿Cambió algo?»** que contesta que no cuando acaba de
> aparecer un archivo nuevo no está roto a medias: está contestando otra
> pregunta. Y estaba en la herramienta que existe justamente para no perder
> trabajo.

Arreglado con `git add -A -- publicar/` y la comparación contra el índice —el
resumen también, porque si el resumen mira otra cosa que la decisión, mienten
por turnos—. **Hay que volver a correr el montaje** para que el catálogo llegue
al repositorio.

---

## El hueco conocido, escrito en vez de implícito

Las baterías de navegador miden hoy el camino **sin** `catalogo.json` —el
servidor de pruebas devuelve 404 a propósito—, que es el de una tienda recién
montada. El camino nuevo, el que va a usar la tienda ya montada, **no lo mide
todavía ninguna prueba de navegador**.

El servidor ya sabe servirlo: con `CATALOGO_ESTATICO=1` entrega el mismo
catálogo que da la puerta. Falta la batería que corra con esa variable puesta.

> Se anota aquí, y no en la cabeza de nadie, porque así es como este proyecto se
> ganó sus peores errores: `sec2.js` leyendo un archivo congelado durante
> semanas, una batería que sumaba 0/0 y daba verde. Un hueco escrito se cierra;
> uno implícito se olvida.

---

## El despliegue lleva las dos cosas

**Versión 2.4.0**, no 2.3.0. La 2.3.0 se escribió y nunca se publicó: este
sprint entró encima, así que el paquete que sale lleva **Sprint 1 y Sprint 2
juntos**. Es lo que se decidió al agrupar, y conviene tenerlo delante al
dispararlo: si algo sale mal, hay dos sprints de cambios que mirar, no uno.

`VERSION` del maestro **no vuelve a subir**: sigue en `2026-09-08-1`. Lo que
cambió del maestro en este sprint es la CSP que genera, no lo que publican sus
puertas, y `VERSION` es el contrato con la página, no la marca del último
commit. Subirla otra vez solo haría que las tiendas avisaran de una diferencia
que no existe.

Los pasos son los mismos cinco de `SPRINT-1.md`. Lo único que se agrega:
**el pull request del montaje va a traer un archivo nuevo, `publicar/catalogo.json`**.
Vale la pena abrirlo y mirarlo antes de fusionar: es la primera vez que el
catálogo del comercio queda escrito en el repositorio.

---

## Cómo se comprueba cuando se despliegue

| Señal | Dónde |
|---|---|
| Existe `publicar/catalogo.json` en el pull request del montaje | GitHub |
| La tienda carga y **no hay ninguna petición a `script.google.com` al abrir** | Network, al cargar |
| La primera petición a Google aparece **solo al tocar el carrito** | Network, al agregar |
| El pico horario de lecturas del diagnóstico **baja a casi cero** | menú → Diagnóstico |

La última es la que de verdad importa: es la comprobación de que la vitrina
dejó de competir con el checkout. Y es medible porque el pico ya se venía
midiendo desde antes de que hiciera falta.

---

## ✅ Medido en producción, 9 de septiembre

**Al cargar la tienda**, la pestaña Network entera:

```
organico.laboratoriodigital-la.workers.dev   304   document
css2?family=Archivo…                         200   stylesheet
data:image/svg+xml ×3                        200
catalogo.json                                200   fetch   3.2 kB   191 ms
k3kPo8UDI-…woff2                             200   font
chonto-1 · pasta-1.jpg · Cherry-2-600.webp   200/304  webp
```

**Ni una sola petición a `script.google.com`.** Antes había tres: la que fallaba
al buscar `catalogo.json`, la redirección `exec?a=catalogo` y el `echo` con los
datos.

**Al agregar un producto al carrito**, aparece la primera y única:

```
exec?a=validar&sellar=1&pedido=HRXWJ&items=cherry…   302
echo?user_content_key=…                             (pendiente)
```

**Eso es exactamente la decisión, funcionando:** mirar no gasta ejecuciones de
Apps Script; comprar sí, y solo comprar. El maestro queda entero para lo único
que solo él puede hacer.

> Y la comprobación distingue de verdad: la misma pantalla, tomada dos horas
> antes, mostraba `catalogo.json` en **404** y las tres llamadas a Google. No es
> una que dé lo mismo antes y después.
