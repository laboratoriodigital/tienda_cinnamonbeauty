# Hoja de ruta

La premisa: la forma más costo-eficiente de poner en línea a un negocio
pequeño que arranca, con control básico de sus ventas, usando servicios
gratuitos y gastando solo donde no haya alternativa.

Todo lo que sigue está ordenado por esa vara: **cuánto le sirve al dueño
del negocio dividido por cuánto cuesta y cuánto complica.**

Hoy el costo total de operación es **$0/mes**. El único gasto es el
dominio, ~$50.000 al año. Eso no debería cambiar en ninguna fase.


## Fase 0 — Antes de vender en serio

Esto no es mejora, es lo que falta para que la tienda sea confiable.

**0.1 Respaldo — CORREGIDO, y ya HECHO dentro del correo diario (1.2)**
El historial de versiones de Sheets cubre el accidente probable: borraste
filas, pegaste encima, un cambio salió mal. Vuelves atrás y listo.
Lo que NO cubre: perder la cuenta de Google, el archivo borrado más allá
de 30 días, y tener los datos fuera de Google. Y Google no promete
guardar revisiones para siempre.
Decisión: no se construye un respaldo aparte. Se le suma un **export
mensual adjunto** al correo de resumen de la fase 1.2. Unas pocas líneas
dentro de algo que ya va a existir.

**0.2 Datos de la empresa en los textos legales**
Los tres textos legales funcionan pero no identifican al vendedor, que la
Ley 1480 exige. Está esperando razón social, NIT o cédula, correo y
dirección.

**0.3 Probar en un celular real**
Nunca se ha hecho. Las pruebas automáticas corren a 375px en un navegador
de escritorio, que no es lo mismo que un pulgar sobre datos móviles.

**0.4 Respuesta automática de WhatsApp Business**
El texto ya está escrito en CONTEXTO.md. Falta pegarlo.

**0.5 Dominio propio**
El único costo real del proyecto.


## Fase 1 — Control del negocio

La premisa dice "control básico de sus ventas". Hoy hay filas crudas en
una hoja. Un dueño de negocio no lee filas, lee respuestas.

**1.1 Hoja "Tablero"**   [HECHO]
Una pestaña que el script calcula solo, con lo que de verdad se pregunta
alguien que vende:
- Ventas del mes y del mes anterior
- Ticket promedio
- **Tasa de cierre**: pedidos que se abrieron en WhatsApp vs. los que
  confirmaste. Este número casi nadie que vende por WhatsApp lo conoce, y
  nosotros ya lo tenemos: es Validaciones contra Pedidos confirmados.
- Productos que no ha vendido nada en 30 días
- Stock por debajo del umbral
Costo: cero. Es aritmética sobre hojas que ya existen.

Quedó hecho, y también el 1.3: el embudo va dentro del mismo tablero,
porque separarlo era inventar una pestaña más para tres números que se
leen juntos. Se recalcula cada hora, al cambiar un Estado y desde el menú.
52 pruebas automáticas lo cubren (batería tablero.js).

**1.2 Correo diario de resumen**   [HECHO]
Apps Script manda hasta 100 correos al día gratis. Uno solo al día basta:
pedidos sin confirmar de más de 24 horas, productos agotados, stock bajo,
y si aparecieron errores en la hoja Errores. Sin esto, la hoja Errores no
la mira nadie nunca.

Hecho, y todo configurable desde la pestaña Configuración: a quién le
llega, a qué hora, y si quiere recibirlo aunque no haya nada. Incluye el
export mensual adjunto que reemplazó al respaldo del punto 0.1, así que
ese queda cerrado también. 56 pruebas automáticas (batería correo.js).

**1.3 Embudo de abandono**   [HECHO — dentro del Tablero 1.1]
Ya se está guardando el dato sin querer: hay filas en Validaciones que
nunca llegaron a Pedidos. Eso es "armó el carrito y no envió". Solo falta
mostrarlo. Dice si el problema es el precio, el envío o el formulario.


## Fase 2 — Vender más, sin gastar

**2.1 Enlace por producto**   [HECHO]
Hoy solo se puede compartir la tienda entera. Con `?p=chonto` en la URL,
la tienda abre directamente en ese producto. Para un negocio que vive de
WhatsApp e Instagram, poder mandar UN producto es la diferencia entre
"mira mi tienda" y "mira esto".
Esfuerzo: bajo. Impacto: alto.

Hecho, con botón de compartir en la ficha (menú del sistema en celular,
copiar al portapapeles en computador) y el botón Atrás cerrando la ficha
en vez de sacar de la tienda. 39 pruebas automáticas (batería enlace.js).
Queda una limitación conocida: la vista previa de WhatsApp sigue siendo
la de la tienda, porque los rastreadores no ejecutan JavaScript.

**2.2 "Avísame cuando llegue"**
En los productos agotados, un botón que abre WhatsApp con el mensaje ya
escrito. Cero almacenamiento, cero datos personales guardados, cero
costo, y convierte un "agotado" en una venta futura.

**2.3 SEO de producto**
Agregar datos estructurados (JSON-LD de tipo Product) y un sitemap.
Google puede empezar a mostrar productos individuales. Es tráfico
gratuito que hoy no existe, y no cuesta nada mantenerlo.

**2.4 Primera pintada más rápida**
Hoy el catálogo llega por red después de pintar, así que en una conexión
lenta se ve un instante el catálogo de respaldo. Se puede mejorar
guardando una copia del último catálogo bueno. Detalle, no urgencia.


## Fase 3 — Convertirlo en plantilla replicable   [HECHO]

Aquí está el verdadero valor de lo construido. Todo lo anterior mejora
UNA tienda; esto permite montar la siguiente en una tarde.

**3.1 Configuración fuera del código**   [HECHO]
La pestaña Configuración de la hoja manda sobre nombre, textos, colores,
logo, datos legales y leyendas. En el archivo quedó solo el bloque
estático (title, description, Open Graph) más cuatro líneas de respaldo,
y ese bloque lo genera el script.
Se descartó un config.js aparte: no aporta nada en seguridad (todo lo que
el navegador descarga es público), agrega un modo de falla silencioso
—si no carga, la tienda se queda sin número de WhatsApp— y no resuelve
lo difícil, porque las etiquetas Open Graph tienen que ser estáticas de
todos modos.

**3.2 Manual del dueño, uno solo**   [HECHO]
Hoy hay CONTEXTO.md, INSTALAR.md y FOTOS.md. Para alguien nuevo eso son
tres puertas. Un solo manual con el orden real de las cosas.

**3.3 Lista de arranque de 45 minutos**
Del cero a la tienda publicada, paso por paso y cronometrado. Si no cabe
en una tarde, la premisa no se cumple.

**3.4 Tema por variables**
La paleta ya está en variables CSS. Falta exponerla en el bloque CONFIG
para cambiar la marca sin tocar estilos.


> **Buena parte de esta fase la absorbe `PLAN.md`**, que es el plan de
> migración a la arquitectura v3. Lo que sigue aquí es lo que queda fuera de
> esa migración o se retomó después.

## Fase 4 — De plantilla a producto vendible

**4.1 Panel de tiendas**   [HECHO]
`panel.gs`: una hoja de gestión con el registro de tiendas, las métricas de
todas consultadas en paralelo, tablero gerencial con MRR y ventas sumadas,
cobros del mes y un correo diario que dice en el asunto si hay que abrirlo.

**4.2 Versiones con nombre**   [HECHO]
Actions > release corta `vX.Y.Z` y publica `index.html`, `maestro.gs` y
`panel.gs`. Las tiendas consumen la etiqueta, no `main`.

**4.3 Repositorio-plantilla por cliente**   [PARCIAL]
El seguro ya está: `npm run tienda` compara el nombre del sitio en
`wrangler.jsonc` con el del comercio y ofrece cambiarlo. Sin eso, un
repositorio creado desde una plantilla despliega SOBRE la tienda anterior —dos
Workers con el mismo nombre son el mismo sitio— y es el único daño que este
repositorio puede hacer fuera de sí mismo.

Falta la otra mitad: que una tienda creada en marzo reciba las mejoras de
junio. Una plantilla resuelve el nacimiento, no el mantenimiento.

Cada tienda con su repositorio, creado desde una plantilla de GitHub, y un
flujo que baja la última versión, le reinyecta su bloque `<head>` y su
`SCRIPT_URL`, y abre un pull request. Es la pieza que convierte "un cambio
llega a todos" de intención en mecanismo.

**4.6 Autoservicio de alta**   [APARCADO, escrito y probado]
`servicio/tienda-nueva.yml`: un flujo que crea el repositorio de la tienda
desde la plantilla, le pone su propio `name` en `wrangler.jsonc`, le habilita
los pull requests de Actions y le carga sus dos secretos. Vive en
`laboratoriodigital/tiendas`, que es el único repositorio con un token capaz
de crear repositorios; `servicio/README.md` dice cómo se monta.

**Está escrito y con aserciones, y no está en el camino del runbook.** Se
aparcó por una razón de método: la primera tienda no se monta con un
autoservicio a medio probar, se monta a mano hasta que la semilla sea estable.
Cada vuelta de este flujo cuesta crear un repositorio de verdad para descubrir
que un campo del formulario se llenó distinto, y ese tiempo hoy vale más
puesto en Orgánico. Se retoma cuando haya una tercera tienda que montar: con
dos, hacerlo a mano cuesta menos que depurarlo.

**4.7 Sembrar la configuración desde fuera**   [APARCADO, escrito y probado]
La puerta `?a=sembrar` del maestro y `npm run sembrar` escriben las claves de
la pestaña Configuración desde fuera de la hoja, sin pisar lo que el comercio
haya escrito. Se aparcó junto con 4.6: **la configuración se llena en la
pestaña, que es donde se ve entera, se corrige sin disparar nada y el comercio
la entiende.** Un formulario de Actions con seis campos era más frágil que una
hoja de cálculo, que es lo que este producto ya sabe hacer bien.

**4.4 El cable de Drive a las fotos**   [HECHO]
Puertas `?a=fotos` y `?a=foto` en el maestro, y `npm run fotos:drive` que baja
solo lo que cambió, lo convierte y actualiza `publicar/fotos/origen.json`. Una
foto que esté en otra parte del Drive no se entrega aunque el token sea bueno.

**4.5 Publicar el maestro con clasp**   [HECHO]
`npm run maestro` sube el archivo y actualiza **la implementación que ya
existe**, que es lo que hace que la URL no cambie. Corre en el equipo y no en
un flujo automático: cada tienda tiene su cuenta, y automatizarlo pediría un
llavero de todas en un mismo sitio.

**4.9 El bloque del `<head>`, escrito y no pegado**   [HECHO]
Puerta `?a=bloques` y `npm run index`. O aplica todo o no toca el archivo, y si
el maestro no contesta falla en vez de publicar una tienda muda.

**4.6 Archivado de hojas llenas**
`Pedidos` y `Validaciones` solo crecen. Falta mover lo viejo a una hoja de
archivo. No bloquea la tienda uno; sí la diez.

**4.7 Respaldo semanal de la hoja**   [HECHO]
`respaldoSemanal()`, los domingos a las 2 de la mañana. Copia la hoja con
`makeCopy` a la carpeta del administrador —Drive lo resuelve de su lado, así
que tarda lo mismo con cien filas que con cien mil— y guarda ocho copias. El
panel muestra la fecha del último respaldo por tienda y el correo de la mañana
avisa si alguna se quedó atrás.

**4.11 ¿Se puede borrar el stub?**   [MEDIDO: no. Cerrado]
6 de septiembre de 2026. El menú sí le aparece al comerciante, pero tocar una
opción falla con PERMISSION_DENIED: el clic invoca la función bajo la cuenta
del comerciante dentro de un proyecto que no es suyo. La frontera no es la
autorización, es la propiedad del proyecto. El stub se queda. Detalle en
`ARQUITECTURA.md`; el experimento se retiró del maestro.

**4.10 Las automatizaciones también en GitHub Actions**   [HECHO]
`montaje.yml` corre los lunes de madrugada, trae de la hoja y del Drive lo que
haya cambiado y abre un pull request. El mismo flujo publica el Apps Script, a
mano y con confirmación escrita. Los secretos son por repositorio, así que cada
uno guarda los de su propia tienda.

**4.8 Cobros de verdad**
Hoy el panel dice a quién cobrar y cuánto. Recibo, comprobante y mora son otra
cosa y necesitan decisiones de modelo de negocio que todavía no están tomadas.

**4.12 El tiempo de publicación**   [HECHO · 292 s → 85 s]

11 de septiembre de 2026. Publicar una foto o un precio tarda entre seis y ocho
minutos, y la queja es legítima. Antes de quitar baterías conviene mirar dónde
se va el tiempo, porque **quitar baterías no lo recupera**:

| | |
|---|---|
| La suite entera | **292 s** |
| De eso, las 12 que abren navegador | **290 s (99 %)** |
| Las otras 10 —contrato, panel, montaje, esquema— | **3,5 s en total** |
| De los 292 s, **durmiendo** en `waitForTimeout` | **182 s (62 %)** |

Las diez baterías «no fundamentales» que se podrían quitar cuestan **tres
segundos y medio**. Quitarlas no ahorra nada y deja sin guardia justo lo que
permite que este flujo fusione sin una persona en medio.

Los 182 segundos de sueño sí se pueden recuperar **sin perder una sola
aserción**: son `page.waitForTimeout(400)` esperando a que algo pase. Lo que
hay que esperar no es el reloj, es la condición —`waitForFunction`,
`waitForSelector`— y además una espera fija es la fuente clásica de falsos
rojos: el día que el runner va lento, 400 ms no alcanzan y la batería falla sin
que nada esté mal. Es el patrón 8 otra vez: **el reloj como entrada que nadie
declaró.** Las peores: `e2e.js` (50 s durmiendo de 81 s), `movil.js` (32 de 51),
`enlace.js` (27 de 36), `val.js` (23 de 33), `fotos.js` (22 de 28).

### Lo que se hizo, antes de montar la segunda tienda   [HECHO, 2.9.3]

Tres cambios, **ninguno toca una aserción**:

1. **Las baterías corren a la vez.** Los doce navegadores se esperaban uno a
   otro por una razón de implementación, no de fondo: **todos hablaban con el
   mismo servidor del 8099** y se pisaban el `/__reset`. Ahora cada batería
   levanta el suyo en su puerto, con su propio emulador de la hoja, y el
   corredor mantiene tantas en vuelo como núcleos haya, hasta cuatro. El
   aislamiento no es un candado: es que no comparten nada. Medido en una
   máquina de **dos** núcleos: **292 s → 164 s**, marcador idéntico. En un
   runner de cuatro el suelo lo pone `e2e.js`, que dura 81 s ella sola.
   `TRABAJADORES=1` vuelve a serial, para depurar.
2. **El navegador y las dependencias, en caché.** `pruebas.yml` ya cacheaba
   Chromium; `fotos.yml` —el que de verdad corre cada cuatro horas— se había
   quedado fuera. Es el patrón 6: lo que se arregla para uno deja fuera al que
   más lo necesitaba. Ahora los tres flujos cachean el navegador y los dos
   `package-lock.json`. ~60-90 s por corrida.
3. **`pruebas` ya no se repite sobre el pull request que abre `fotos`.** Prueba
   los mismos bytes que el propio flujo acaba de probar, y esa corrida **queda
   esperando la aprobación de un mantenedor**: si nadie la aprueba caduca y
   deja una X roja en un pull request ya fusionado (corrida #78). Una marca roja
   que no significa nada enseña a no mirar las marcas. El de `montaje` se sigue
   comprobando: ese espera a una persona y puede reescribir el `<head>`.

Y se comprobó lo que importaba de verdad: **que el corredor nuevo siga
fallando**. Con una aserción rota a propósito y una batería que ni compila, la
corrida sale en rojo, nombra las dos y las imprime. Reescribir el corredor y
perder el guardia habría sido el peor cambio posible de todos.

### Y los 182 segundos de sueño   [HECHO, 2.9.4]

Eran `page.waitForTimeout(1600)` esperando a que algo pasara. Y dormir a ojo
falla por los dos lados: sobra cuando la máquina va suelta, y **no alcanza**
cuando va cargada —y entonces la batería se cae por algo que no tiene nada que
ver con lo que probaba—. Patrón 8: el reloj como entrada que nadie declaró,
aplicado a las propias pruebas.

La página ya decía cuándo terminaba cada cosa; lo único que faltaba era
mirarlo. `pruebas/esperar.js` reúne las condiciones:

| | Qué espera de verdad |
|---|---|
| `catalogoListo` | `catalogoResuelto`, que pone `terminarCarga()` — el final de los dos caminos, el del maestro y el del respaldo |
| `selloListo` | que el sello corresponda al pedido **o** que esa firma quede marcada como fallida. Son las dos respuestas posibles; el rebote de 400 ms y los reintentos quedan dentro |
| `filasEn` · `hojaCuando` | que **la hoja** tenga la fila o el estado. Lo que se esperaba tras «Finalizar» no se veía en la página |
| `pintado` | dos cuadros, para lo que no sale a la red: paginar, filtrar, abrir un diálogo |
| `ventana` | la única espera fija que se admite, y obliga a escribir por qué |

Esa última existe porque hay un caso sin condición: comprobar una **ausencia**
—«no sale ninguna petición más»— no tiene nada a lo que asomarse. Queda una en
todo el banco. Una aserción prohíbe que vuelva a aparecer un `waitForTimeout`
suelto en cualquier batería.

Por batería, medido: `e2e` 81→27 s · `movil` 51→19 · `enlace` 36→11 ·
`val` 33→18 · `fotos` 28→5 · `pag` 17→8 · `test` 10,5→7 · `config` 10,5→6 ·
`cat` 9,6→2,7 · `version` 5,5→1,4 · `hoja` 4,6→1,4 · `sec2` 2,2→1,1.

**Y hubo que tocar seis aserciones para que siguieran probando lo mismo**, que
es lo interesante del ejercicio: media docena de esperas no marcaban el final
de algo sino un **estado intermedio** —«mientras reintenta dice Validando», «la
ficha ya está abierta antes de que conteste la hoja»—. Ahí esperar a que todo
se asiente se pasa de largo y la aserción diría que no vio lo que sí estuvo.
Cada una lleva escrito que mira a propósito el medio y no el final.

### El resultado

| | |
|---|---|
| Al empezar, en serie | **292 s** |
| Solo corriendo a la vez (2 núcleos) | 164 s |
| Y sin las esperas fijas | **85 s** |

Con la caché del navegador, una publicación pasa de 6-8 minutos a poco más de
uno. Y lo que se ganó no es solo tiempo: las esperas fijas eran la fuente de
los rojos que no significaban nada.

**4.13 Columnas del catálogo configurables (3 a 5)**   [PENSADO, no implementado]

Hoy la rejilla es fija: 1 columna en móvil, 2 desde 600 px, **3 desde 1000 px**.
Poder elegir de 3 a 5 desde `Configuración` es razonable —un catálogo de 40
productos se ve pobre a 3 columnas en una pantalla ancha— pero arrastra cinco
cosas que no se ven a primera vista:

1. **Solo cambia el último salto.** Móvil y tableta se quedan en 1 y 2 pase lo
   que pase: cinco columnas en un teléfono no es una tienda, es una lista de
   sellos. La clave no es «columnas», es **columnas como máximo en pantalla
   ancha**, y conviene que se llame así en la hoja.
2. **Las medidas que ya existen sirven, y de sobra.** El escalón es
   160 / 600 / 900. A 5 columnas sobre 1400 px, cada tarjeta mide ~275 px: 600
   la cubre al doble de densidad. El caso justo es el contrario —**a 3 columnas
   la tarjeta mide ~460 px y la página sigue pidiendo 600**, así que en pantalla
   retina ya hoy se ve algo blanda—. Más columnas *mejora* el ajuste. No hacen
   falta tamaños nuevos.
3. **Pero el ancho que se pide está clavado.** `ANCHOS.tarjeta = 600` no sabe
   cuántas columnas hay. Si las columnas se vuelven configurables y esto no, la
   clave cambia en silencio la nitidez de las fotos sin que nadie lo haya
   decidido. O el ancho sigue a las columnas (3 → 900, 4-5 → 600), o se pone
   `srcset`/`sizes` y decide el navegador — y `sizes` **depende del número de
   columnas**, que es justo el acoplamiento que hace que esto no sea una línea
   de CSS.
4. **El valor llega de dos formas.** Por `?a=catalogo` llega número; por el
   `catalogo.json` horneado llega texto, porque el horneado pasa todo por
   `String()`. Es exactamente lo que pasó con `tope_pago` y solo se vio en
   producción. Hay que leerlo con `Number()` en los dos caminos y probarlo
   contra los dos. Y nada de `|| 3`: si el comerciante escribe «4 columnas»,
   eso es **ilegible**, no «tres», y tiene que avisar (S1-10). Acotado a 3..5.
5. **La paginación se descuadra.** El tamaño de página es un número de
   productos, no de filas: 12 productos quedan bien a 3 y a 4, y dejan una fila
   coja a 5. Es cosmético, pero se ve.

Y las baterías de presentación tendrían que correr sobre los tres valores, no
solo sobre el de por defecto: una rejilla configurable que solo se prueba en 3
es una rejilla fija con una clave al lado.


**4.14 `clasp login` sin depender de una máquina con Node**   [PENSADO]

`CLASPRC` es el único de los cinco secretos que **no sale de una pantalla de
Google** y el único que **caduca**. Hoy renovarlo pide un equipo con Node.

Lo que **no** se puede automatizar, y conviene decirlo antes de intentarlo:
`clasp login` es un consentimiento de OAuth, y consentir es justamente lo que
tiene que hacer una persona en un navegador. Un flujo desatendido que se
autoriza solo sería un agujero, no una mejora.

Lo que **sí** se puede quitar es la máquina. `clasp login --no-localhost` no
levanta ningún servidor: imprime una dirección y espera un código. Eso parte en
dos, y las dos mitades caben en `workflow_dispatch`:

1. Un flujo imprime la dirección en el resumen. El operador la abre en el móvil
   o donde sea y autoriza con la cuenta de esa tienda.
2. Otro flujo recibe el código como **input** y escribe el `clasprc.json`
   resultante… y aquí está la parte fea: **un flujo no puede escribir un
   secreto del repositorio sin un token que pueda escribir secretos**, que es
   exactamente el tipo de llave que este producto decidió no tener en las
   tiendas. O el segundo paso imprime el JSON para que el operador lo pegue —y
   entonces un secreto pasa por el log, que es justo lo que no se hace— o hace
   falta un token con permiso de secretos **solo sobre ese repositorio**.

Conclusión provisional: **la mitad barata es la primera.** Imprimir la
dirección de autorización desde un flujo ya quita el «necesito mi portátil».
El pegado del resultado se queda a mano hasta que haya una respuesta buena a
quién escribe el secreto. Y antes que nada conviene medir cuánto dura de verdad
un `CLASPRC`: si aguanta meses, esto es una molestia anual.

**4.15 Abrir la `/exec` una vez, desde un flujo**   [PENSADO, barato]

El paso 6 del mapa —abrir la URL de la implementación una vez en el navegador
para que el maestro conozca su propia dirección— es un `curl` disfrazado de
gesto humano: lo único que hace falta es que **alguien le haga una petición**.
Un `workflow_dispatch` que reciba la URL como input, la llame y diga qué
contestó, quita el paso y **de paso caza el otro fallo de esa pantalla**: si la
implementación quedó con acceso «Solo yo», la respuesta es un 404 y hoy eso se
descubre mucho más tarde.

No puede ser un secreto todavía —en ese momento del montaje `MAESTRO_URL` aún
no existe, es lo que se está averiguando—, así que va como input del formulario.
Es de los cambios más baratos del roadmap.

**4.16 Los campos obligatorios, marcados en la hoja**   [PENSADO]

El sistema ya sabe cuáles son: `LISTA_DE_ALTA` tiene las 16 claves, cuáles
bloquean y **por qué** bloquea cada una, `revisarTienda()` lo dice y el montaje
se niega a publicar si falta una de las cuatro. Lo que falta es que **se vea en
la pestaña donde se llena**: hoy hay que ejecutar una función para enterarse.

Lo que hace falta: una columna escrita por `A0_instalar()` —*obligatorio* /
*recomendado*— y formato condicional que pinte en rojo la celda vacía de una
clave que bloquea, con el `porQue` como nota de la celda. Derivado de
`LISTA_DE_ALTA`, **nunca escrito a mano**: dos listas de lo obligatorio es el
patrón 2, y ya sabemos cómo acaba.

Las dos cautelas: que `instalar()` sea idempotente también en esto —no puede
duplicar la columna cada vez que se corre— y que no pise lo que el comerciante
haya escrito en su hoja.

**4.17 El stub inmutable, orquestado por datos**   [EVALUADO]

Segunda propuesta para dejar de pegar el stub a mano: que el stub no cambie
nunca y lea sus rótulos de un `config.json` estático. **Es mejor que la
primera** —no pide GCP, ni la API de Apps Script, ni gasta ejecuciones del
maestro— pero choca con el hallazgo 4.11: un `onOpen` **simple** corre sin
autorización y por eso **no puede usar `UrlFetchApp`**, y la alternativa del
disparador instalable ya está medida como imposible.

Se salva cambiando dónde se renderiza: **ranuras fijas** con los rótulos
cacheados, o **un solo ítem de menú que abre un panel lateral**, que sí corre
autorizado. Evaluación completa, con las dos formas y las dos condiciones
nuevas, en `EVALUACION-stub-automatico.md`, sección 8.


**4.18 Sincronizar la semilla con las tiendas, sin manos**   [LA PÁGINA, HECHA · 2.12.0 · el código, pendiente]

Hoy, poner una tienda al día contra la semilla es copiar archivos a mano.
Costó su primer accidente el 14 de septiembre de 2026, montando la tienda 2:
un `git rebase` quedó a medias con un conflicto en `publicar/catalogo.json`
—**un archivo generado**, el mismo patrón que la 2.10.0 arregló para el bot— y
se quedó ahí días. Consecuencia visible: `origin/main` de la tienda seguía en
`2.9.9` mientras la copia local decía `2.10.0`, y `release` falló contra una
etiqueta que apuntaba a otro commit. El error salió lejos de la causa.

Lo que hay que resolver, y es lo que hace difícil el problema:

1. **Qué se copia y qué no.** El código de la plantilla se copia entero. Lo
   que nace de la hoja de cada comercio —`catalogo.json`, `publicar/fotos/`,
   el `<head>`, la paleta, `tienda.json`— **no se copia nunca**. Traerlo es
   publicar la tienda de otro, que es justo el fallo de la 2.9.2.
2. **Una sola lista**, derivada, no escrita dos veces (patrón 2). La lista de
   lo que NO se copia y la de lo que el montaje regenera son la misma lista.
3. **Nadie se mueve sola.** La tienda se actualiza por un pull request que
   alguien aprueba. Eso no cambia: lo que se automatiza es *preparar* el PR,
   no fusionarlo.
4. **Sin conflictos posibles.** Los archivos generados no se fusionan: se
   reponen encima, como ya hace el flujo `fotos` desde la 2.10.0.

Forma probable: un flujo `sincronizar` en el repositorio de la tienda que baja
los activos de la última `release` de la semilla, repone lo generado y abre un
PR con el diff. Mide bien el valor: es el trabajo que se repite por cada tienda
y por cada versión, así que se paga con la tercera tienda.

**Lo que ya está hecho (2.12.0): la página.** El flujo `montaje` de cada tienda
trae `publicar/index.html` de la última versión publicada de la semilla y le
escribe encima lo de esa hoja —el `<head>`, las constantes, la paleta y el
catálogo de respaldo—. Se puede reemplazar entero porque no queda ahí ni un
valor escrito a mano. En la semilla no corre: Orgánico es de donde sale la
plantilla. Si no se puede traer, el montaje **no se para**: avisa y sigue con la
página que la tienda ya tenía.

**Lo que falta: el código.** `montar/`, `pruebas/`, `.github/workflows/`,
`maestro.gs`, `panel.gs`, `docs/` siguen copiándose a mano de la semilla al
repositorio de cada tienda. Es lo que queda de este punto, y es lo que se paga
con la tercera tienda.

Relacionado: **`release` no es un flujo de tienda** y hoy nada lo impide. Ver
4.19.


**4.19 `release` se niega a correr fuera de la semilla**   [PENDIENTE, barato]

`release` corta la versión de la plantilla. Una tienda no corta versiones: las
consume. Pero el flujo viaja en la plantilla, así que aparece en la pestaña
Actions de cada tienda, invitando a correrlo — y correrlo es razonable si
estás comprobando el ciclo completo de una tienda nueva.

Cuando falla, además, el mensaje manda al sitio equivocado: «sube `version` en
`package.json`». En una tienda ese consejo es falso, y es exactamente el
patrón que cerró la tanda pasada: **un error que apunta al sitio equivocado
cuesta más que uno que no dice nada.**

El arreglo es una guarda al principio del trabajo: si el repositorio no es la
semilla, parar con un resumen que diga qué correr en su lugar (`montaje`, o
`sincronizar` cuando exista 4.18). El dato ya está a mano —`?a=identidad`
devuelve `repositorio` desde la 2.9.2, y `github.repository` está en el propio
flujo.


**4.20 El montaje escribe el catálogo de respaldo**   [HECHO · 2.11.0]

Dentro de `publicar/index.html` vive lo que la página pinta ANTES de que
conteste nadie, y lo único que le queda si no contesta nadie. Venía quemado de
la plantilla y el montaje no lo tocaba: ponía el `<head>`, las constantes y la
paleta de cada comercio, y dejaba los ocho tomates de Orgánico.

Cinnamon Beauty abría con ocho tomates un instante. Eso era lo visible. Lo caro
era lo otro: sin red ese instante no se acaba y esa tienda vende tomate.

**Cómo quedó.** `montar/sembrar-respaldo.mjs` escribe el bloque desde
`publicar/catalogo.json` —el que hornea el mismo flujo unos segundos antes—, así
que el respaldo es literalmente una copia del catálogo publicado y es imposible
que digan cosas distintas. Y en vez de reescribir el marcado etiqueta por
etiqueta, el montaje escribe la configuración de la hoja dentro del archivo
(`CONFIG_SEMILLA`) y la página la aplica de una vez, sin red, con la misma
función que ya aplica la que llega: una sola implementación (patrón 2).

El flujo `fotos` NO lo hace, a propósito: ese fusiona sin una persona en medio
y lo que puede publicar está acotado a `publicar/fotos` y `publicar/catalogo.json`.
El `index.html` solo lo escribe un flujo que termina en un pull request.

**Lo que se llevó por delante.** El dibujo del producto sin foto lo calculaba el
Apps Script y lo metía dentro del respaldo; lo vivo lo heredaba POR ID de ahí,
con «tomate» de reserva. Ahora lo decide la página, en un solo sitio, desde el
formato y la categoría.

**Y tres comprobaciones que no comprobaban nada, destapadas al mover esto:**

1. `cat.js` probaba el respaldo pidiendo el modo `caido` — que deja el catálogo
   VIVO y solo tumba el registro. Medía una tienda con la hoja contestando y la
   daba por muerta. Es la trampa del 302 otra vez, en otro sitio.
2. `pag.js` esperaba a `pintado()`, que vuelve en cuanto se dibuja el respaldo
   del archivo. Medía la paginación del archivo, no la de la hoja.
3. Las dos pasaban **porque el respaldo traía los mismos ocho productos que la
   hoja emulada**. Contestaban lo mismo con el arreglo y sin él. Se vieron el
   día en que los dos números dejaron de coincidir.

**Y una guarda que no se puso.** El primer intento fue calcar la de la paleta
(2.9.9): «ninguna batería de navegador puede nombrar un producto de Orgánico».
Marcó diez baterías y las diez tenían razón — nombran tomates porque conducen la
hoja EMULADA, que es de fábrica y es igual en todas las tiendas. Acusar al
producto de un acierto es peor que no comprobar (patrón 5). En su lugar hay una
batería, `pruebas/respaldo.js`, que monta una tienda que no es Orgánico, la
sirve con la hoja muerta y mira qué se pinta — y lleva dentro la prueba de que
distingue: con el arreglo quitado, se cae.

**Y lo que costó el primer push (2.11.1).** El repositorio de la tienda se
actualizó con el código del 4.20 y las baterías salieron rojas: `respaldo.js`
4/10 y `config.js` con dos caídas, todas diciendo «Orgánico». El código estaba
bien. Lo que pasa es que **`publicar/index.html` no se sincroniza desde la
semilla** —nace de la hoja de cada comercio y llega por la release—, así que
una tienda puede tener ya los flujos, la herramienta y las baterías del 4.20 y
todavía el archivo de antes, que no declara `CONFIG_SEMILLA` ni lo aplica.

Las baterías estaban exigiendo algo que en ese repositorio todavía no podía ser
cierto, y el rojo mandaba a buscar un fallo que no existía — otra vez el error
que cerró la tanda pasada. Ahora las dos **se saltan ese escenario diciéndolo**
(patrón 8, regla 2) y `todas.sh` saca los saltos a la luz aunque el marcador
salga verde, porque un salto que no se ve es un salto escondido.

La consecuencia para el despliegue, que vale por sí sola: **actualizar una
tienda son dos cosas, no una** — el código, y el `index.html` de la release. Lo
segundo no lo trae ningún `git pull`.

Queda anotado, porque es de la misma familia y sigue abierto: el emoji 🍅 del
encabezado del mensaje de WhatsApp, y `fotos_origen` apuntando a la dirección de
producción, que en una vista previa de rama carga las fotos del sitio de verdad.


**4.21 `wrangler.jsonc` dice `organico` en todas las tiendas**   [PENDIENTE, menor]

La clave `name` del `wrangler.jsonc` de Cinnamon Beauty dice `"organico"`, y
los comentarios del archivo también. El montaje no lo reescribe.

Hoy no rompe nada: Cloudflare publica estas tiendas por la integración de git
del panel, no por ese nombre. Pero es un campo de un comercio dentro del
repositorio de otro, y el día que alguien despliegue con `wrangler deploy`
desde una máquina —o que se quiera automatizar el paso 2 del despliegue— va a
apuntar al Worker equivocado.

Barato: sale del mismo `?a=bloques` que ya trae lo demás. Va detrás de 4.20.


## El techo: hasta dónde aguanta este diseño

Números oficiales de Google para cuentas gratuitas (gmail.com):

    Ejecución de un script          6 minutos
    Disparadores, total al día      90 minutos
    Ejecuciones simultáneas         30 por usuario
    Correos al día                  100
    Llamadas URL Fetch al día       20.000

Qué significa para esta tienda:

- **Las visitas no son el problema.** El catálogo se guarda en caché 60
  segundos, así que cien visitantes en un minuto son UNA lectura de la
  hoja.
- **El límite que se toca primero son las 30 ejecuciones simultáneas.**
  Pasa si mucha gente arma el carrito al mismo tiempo, no si mucha gente
  mira.
- **Los 90 minutos de disparadores** los consumen el resumen horario y el
  movimiento de inventario. Con decenas de pedidos al mes sobra. Con
  miles, las relecturas completas de la hoja empiezan a pesar, porque hoy
  recorren todas las filas cada vez.

Traducción práctica: este diseño aguanta cómodo hasta unos **300-500
pedidos al mes**. Antes de eso no hay nada que pagar.

Cuándo dejar de estirarlo:
- Más de ~40 pedidos al mes con confirmación manual: duele el tiempo, no
  la plataforma.
- Más de 100 productos: la hoja se vuelve incómoda de editar.
- Cuando se necesite cobrar en línea de verdad.


## Lo que NO haría todavía, y por qué

**Pasarela de pagos (Wompi, Bold, Mercado Pago).** No cobran mensualidad
pero sí comisión por transacción. Mientras el cobro por Nequi o Bre-B
funcione, es pagar por un motor de checkout que no se usa. El día que
perder ventas por "no puedo transferir ahora" cueste más que la comisión,
ahí sí.

**Base de datos o framework.** Cambiarían el costo de $0 a algo, y el
mantenimiento de "editar una hoja" a "desplegar código".

**Google Analytics 4.** Ya se descartó y sigo de acuerdo: la hoja da el
ranking, el ticket y la tasa de cierre. GA4 agregaría el embudo de
navegación a cambio de meter un tercero que rastrea a los visitantes y de
tener que declararlo en la política de datos.

**App móvil.** La tienda ya es una página que abre en un segundo. Una app
sería costo de desarrollo, de publicación y de que alguien la instale.

**Guardar historial de clientes.** Sería útil para recompra, pero hoy la
tienda a propósito NO guarda nombre, celular ni dirección: viven solo en
la conversación de WhatsApp. Guardarlos cambia el perfil de riesgo y las
obligaciones de la Ley 1581. Si algún día se hace, que sea una decisión
consciente y con su política actualizada, no un efecto secundario.


## Mis tres primeros

Si solo se pudieran hacer tres cosas:

1. ~~Respaldo automático~~ → descartado, el historial de Sheets alcanza.
   Queda como export mensual dentro del correo de resumen.
2. ~~Configuración parametrizable~~ → **HECHO**.
3. ~~Hoja Tablero~~ (1.1) → **HECHO**. Con el embudo (1.3) adentro.
4. ~~Enlace por producto~~ (2.1) → **HECHO**.

5. ~~Correo diario de resumen~~ (1.2) → **HECHO**, con el export mensual
   adjunto que cierra también el 0.1.

6. ~~Manual del dueño y manual técnico~~ (3.2) → **HECHO**. En
   `manuales/`, HTML y PDF, listos para enviar al vender el servicio.

Los seis están. Lo que queda por valor: **"Avísame cuando llegue"** (2.2),
para no perder la venta de lo agotado, y **SEO con JSON-LD** (2.3).
