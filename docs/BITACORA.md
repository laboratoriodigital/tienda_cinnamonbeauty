# Bitácora de fallos

Todo lo que se rompió, quién lo rompió, por qué pasó y cómo se arregló. Está
para dos cosas: que un fallo no vuelva por el mismo camino, y que quien llegue
después vea que las decisiones raras del código tienen una cicatriz detrás.

**Severidad** = qué tan caro sale, no qué tan difícil fue arreglarlo.

| | |
|---|---|
| 🔴 **Crítico** | Se pierde una venta, se filtra un secreto, o la tienda queda viva y muda. **Casi todos fueron silenciosos** |
| 🟠 **Grave** | Bloquea el trabajo o el despliegue, pero se ve |
| 🟡 **Medio** | Cuesta tiempo, confunde, o deja una prueba mintiendo |
| ⚪ **Menor** | Cosmético, redacción, números desactualizados |

---

## 🔴 Críticos

**El maestro publicado se quedaba sin su hoja.** `maestro.gs` lleva
`var HOJA_ID = ''` en el repositorio porque es distinto en cada tienda. Subirlo
tal cual **borraba el valor del proyecto publicado**, y entonces la tienda caía
al inventario de respaldo que trae dentro: se veía perfecta y no registraba un
solo pedido. Lo delató el panel con un `NO RESPONDE` sobre una tienda que estaba
arriba. → Se repone antes de subir, se niega a subir sin él, y al terminar
pregunta `?a=bloques` para comprobar que abre su hoja. *(mío)*

**Y el mismo agujero seguía intacto en el flujo de Actions.** `maestro.yml`
tenía su propia copia del procedimiento escrita dentro del YAML —`cp maestro.gs
subida/`— con el fallo que ya se había arreglado en la herramienta. Nadie lo
había disparado todavía. → El flujo **llama** a la herramienta en vez de
reescribirla, y una batería impide que se vuelva a escribir dentro. *(mío)*

**La llave de pago estaba en el repositorio**, en cuatro sitios de
`CONTEXTO.md`. → Marcadores en el documento, el valor real en `secretos.md`
—que no se versiona— y la llave se entrega solo por la respuesta automática de
WhatsApp. *(compartido)*

**Un token de GitHub clásico y el token de una tienda salieron en pantallazos.**
→ Revocado y reemplazado por uno de grano fino con permiso de solo lectura
sobre Actions. El de la tienda es rotable y de alcance acotado. *(tuyo, resuelto
en el momento)*

**Toda tienda le decía a su comprador que el pedido lo confirmaba otro
comercio.** El mensaje de WhatsApp y el **consentimiento de datos** —lo que el
cliente marca antes de comprar— llevaban el nombre escrito a mano en el archivo
en vez de `${NEGOCIO}`. La panadería nombraba a la tienda de tomates. → Los dos
salen ahora del nombre de la tienda, y hay aserciones que lo impiden. *(mío)*

**La configuración de fábrica traía el celular de la primera tienda.** Una
tienda nueva que no lo cambiara le mandaba los pedidos a ese teléfono. **Un
número de fábrica no falla: funciona**, y por eso es el peor valor posible. →
El celular viene vacío y el nombre y el sitio entre corchetes; el montaje se
niega a escribir la página si siguen sin llenar. *(mío)*

**El botón de WhatsApp se apagaba sin decir por qué.** En un teléfono los datos
de entrega quedan más abajo del pliegue: el cliente llena el carrito, ve el
total, toca el botón y no pasa nada. Venta perdida, y silenciosa. → Un aviso en
el pie fijo que nombra qué falta, y tocarlo —o tocar el botón apagado— lleva al
campo vacío. *(mío; lo viste tú con clientes reales)*

**Una batería de pruebas que reventaba contaba 0/0**, así que sumaba lo mismo a
los dos lados del marcador y **la corrida podía salir verde con una batería
entera sin correr**. → `todas.sh` marca como rota cualquiera que no arranque, e
imprime su error. *(mío)*

**Una batería abría un archivo por la ruta de una máquina** (`$HOME/t/…`). Donde
ese archivo existía, probaba una copia congelada de la tienda; donde no,
reventaba entera. Junto con el punto anterior, es lo que tapó durante semanas el
fallo del nombre del comercio. → Se abre el archivo que las pruebas regeneran al
lado, en cada corrida, desde la página de verdad. *(mío)*

**Otra copia congelada, antes:** `pruebas/local.html` llevaba días sin
regenerarse y dos baterías estaban verdes contra una tienda que ya no existía
—con URLs de Netlify y cupones en el archivo—. → Se regenera en cada corrida.
De las cuatro aserciones que fallaron al descongelarla, **se corrigieron las
aserciones, no el código**, con la razón escrita en cada una. *(mío)*

---

## 🔴 Críticos (sigue)

**«¿Cambió algo?» no veía los archivos nuevos, y tiró un despliegue a la basura
en verde.** El montaje horneó `catalogo.json` por primera vez y el paso que
decide si abrir el pull request dijo **«Nada cambió en la hoja ni en el Drive»**,
porque `git diff` **no ve los archivos sin seguimiento**. La corrida terminó en
verde, el archivo se perdió con el runner, y la tienda siguió pidiéndole el
catálogo a Google como si nada. Se descubrió mirando por qué no había rama
`montaje/desde-la-hoja` en el remoto. → `git add -A -- publicar/` primero y la
comparación contra el índice, con aserciones que prohíben volver a la forma
vieja. *(mío)*

> El fallo que funciona, otra vez — y esta vez **en la herramienta que existe
> justamente para no perder trabajo**. Un paso llamado «¿Cambió algo?» que
> contesta que no cuando apareció un archivo nuevo no está roto a medias: está
> contestando otra pregunta.

**El acta se congela antes de que llegue el último sello.** El mensaje de
WhatsApp salió con el envío correcto y `Validaciones` lo guardó en 0. El sello
espera 400 ms; `registrar` sale de inmediato al pulsar el botón, revalida por su
cuenta y marca el pedido como registrado; cuando llega el sello nuevo, el
escritor del acta lo descarta porque «ya está registrado». **Reproducido en el
emulador con los números exactos del pedido `M4467`.** El dinero queda bien
—`Pedidos` cobra el total correcto— pero el acta, que es la prueba de cuánto
valía el pedido cuando se envió y el detector de discrepancias, queda mintiendo.
La protección del congelamiento es correcta; lo que está mal es **cuándo** se
activa. → **S1-13**: que `registrarPedido()` escriba el acta con su propia
revalidación, que es la autorizada, y solo después marque el registro. *(mío)*

> Lo encontró una pregunta del terreno que yo llevaba tres vueltas contestando
> con conjeturas. El código no se resistía: bastó con correrlo.

**`Number(celda) || 0` convierte «no se pudo leer» en «es gratis».** El maestro
lee así el precio, el stock, el valor del envío, el mínimo del cupón y sus usos
máximos. Si el comerciante escribe `$9.000` o `9,000` —lo más natural del mundo
en una hoja de cálculo— `Number()` da `NaN` y `|| 0` lo vuelve cero: producto
gratis, envío gratis, cupón sin mínimo, y cupón sin tope (porque `0` usos
máximos significa **sin tope**). Las cuatro consecuencias empujan contra el
comerciante y **ninguna falla**. Apareció tirando del hilo de un envío en 0 en
el pedido `M4467`. → Sale como **S1-10**: distinguir *vacío* de *ilegible*, y
que lo ilegible grite por los tres canales que ya existen. *(mío, latente desde
el principio)*

**El guardia dejaba pasar el catálogo y el `git add` no lo recogía: seis días
vendiendo un producto dado de baja.** El flujo `fotos` publica dos cosas —las
fotos y el catálogo horneado— y esa lista estaba escrita **dos veces**: el paso
que comprueba que no se cuele nada más permitía `publicar/fotos/` *y*
`publicar/catalogo.json`; el paso que hace el commit hacía `git add
publicar/fotos/` a secas. Mientras el comercio solo subió fotos, las dos listas
decían lo mismo. El día que dio de baja un producto —un cambio que **solo** toca
el catálogo— el guardia dijo «adelante», el índice quedó vacío, `git commit`
salió con código 1 y la corrida murió con `no changes added to commit`.

Un solo defecto, tres síntomas que parecían tres problemas: el producto inactivo
seguía a la venta, la página seguía sirviendo el catálogo de la semana pasada, y
las fotos `pan-1`/`pan-2` —que sí estaban descargadas y commiteadas— no se veían,
porque **lo que nombra a una foto es el catálogo**, y el catálogo no llegaba.
Las ventas seguían bien, y eso fue lo que retrasó el diagnóstico: el pedido pasa
por el maestro en vivo, no por el archivo horneado. → Una sola lista, `PUBLICA`,
en el `env` del job, leída por los dos pasos; `git add -A` para que un borrado en
el Drive también entre; y un índice vacío se explica en vez de salir como un
error de git. *(mío)*

> El error que se veía en Actions era `no changes added to commit`, que manda a
> depurar git — el único de los tres que había hecho exactamente su trabajo.
> Patrón 2, y el más caro hasta ahora: no falló nada que el comerciante pudiera
> ver, salvo lo único que él mira, que es su tienda.

---

## 🟠 Graves

**El repositorio semilla nunca pasó por su propio runbook.** El montaje falló
tres veces seguidas al abrir el pull request, con todo lo demás en verde. La
causa estaba **escrita desde hacía semanas** en `RUNBOOK.md`, bloque B:

> Settings → Actions → General → Workflow permissions → *Allow GitHub Actions to
> create and approve pull requests* ✔
> Sin esa casilla, `montaje` corre entero, funciona, y falla en la última línea
> al abrir el pull request.

Predicción exacta del síntoma. Pero ese bloque es el de **crear una tienda
nueva**, y `organico` es el primero: existía antes que el runbook, así que nunca
se le aplicó. GitHub lo dice en una anotación al pie —*«GitHub Actions is not
permitted to create or approve pull requests»*— que solo ve quien sabe que
existe. → Casilla marcada, y el flujo lo explica ahora en su propio resumen
cuando pasa. *(mío)*

> **Es el patrón 4 al revés.** Una prueba que solo sabe ver la primera tienda no
> prueba el producto; un runbook que solo sabe ver las tiendas nuevas **no cubre
> la primera** — que es justamente donde se prueba todo. La lista de la tienda
> cero hay que correrla contra la tienda cero.


**El maestro se inventaba su propia dirección.** Convertía la URL `/dev` en
`/exec` reemplazando texto, y **los dos identificadores son distintos**: el stub
quedaba apuntando a una URL que no existe y Google devolvía una página de error
en vez de datos. → El maestro aprende su dirección real la primera vez que
alguien abre la URL publicada, y la recuerda.
**Mi primer diagnóstico fue equivocado** —dije que la implementación había
quedado privada— y lo corregiste probando desde el celular con datos. *(mío)*

**Dependencia circular.** La herramienta que arregla el `HOJA_ID` se lo
preguntaba al maestro, pero todas las puertas abrían la hoja para contestar: un
maestro sin hoja no podía decir ni cuál era su hoja. → Una puerta `identidad`
que contesta sin abrirla. *(mío)*

**Publicar el maestro no corría en Windows.** Era un script de bash, y npm los
ejecuta por `cmd.exe`: `"." no se reconoce como un comando`. Era la única
herramienta que no estaba en Node, y fue la que se rompió. → Reescrita en Node.
*(mío)*

**«Falta clasp» con clasp instalado.** En Windows npm instala `clasp.cmd`, y
Node desde la 18.20 no lo lanza sin shell; `clasp` pelado tampoco existe. Los
dos caminos fallan. Y peor: yo trataba **cualquier** fallo como "no está
instalado", así que reinstalarlo no podía ayudar. → Se pasa por el shell, y "no
está instalado" se distingue de "falló". *(mío)*

**Dos herramientas se cargaban, no ejecutaban nada, y salían con código 0.** La
comparación `import.meta.url === \`file://${process.argv[1]}\`` nunca coincide en
Windows, donde la ruta llega como `D:\CoWork\…`. Un fallo silencioso que parece
éxito. Lo delató un pantallazo tuyo sin salida. → `pathToFileURL`, y una prueba
que las ejecuta como subprocesos. *(mío)*

**Una URL pegada en un formulario tumbaba el alta entera**
(`unsupported protocol scheme`): la API pide `dueño/repositorio` y la barra de
direcciones da una URL. → Se normaliza antes de tocar la API. **Pedirle rigor a
quien llena el formulario es la solución que no funciona.** *(mío)*

**El panel se comía la primera tienda.** `filas()` ya excluía el encabezado y le
añadí un `.slice(1)` encima. Con una sola tienda registrada, se las comía todas.
→ Quitado, y la prueba usa una sola tienda a propósito. *(mío)*

**clasp 3 renombró sus comandos** (`deployments` → `list-deployments`). → Se
detecta la versión instalada y se usan los de esa. *(del terreno)*

**Falta una casilla y el montaje falla en la última línea.** Sin *Allow GitHub
Actions to create and approve pull requests*, el flujo corre entero, funciona, y
muere al abrir el pull request. → Está en el runbook, y el alta la marca sola.
*(del terreno)*

**El documento mandaba a sacar el stub de donde no sale.** `ACTUALIZAR-UNA-TIENDA.md` y `SPRINT-0.md` decían «Menú de la hoja → *Generar configuración* → copiar el stub». Esa opción produce los dos bloques del `index.html`, que es otra cosa. Seguiste la instrucción, pegaste lo que no era, y Apps Script contestó **«no hay cambios que guardar»**: el menú se quedó viejo sin una sola señal de error. → Los dos documentos mandan ahora a ejecutar `generarStub` en el editor del **maestro**, dicen cómo se reconoce el stub bueno (`var NEGOCIO = '…';`) y qué significa que no haya cambios que guardar. Una aserción recorre `/docs` y falla si algún documento vuelve a juntar «stub» con «Generar configuración». *(mío)*

> El fondo del error: el stub es el código que **dibuja** ese menú. Mandar a arreglarlo desde el menú es pedirle a la tienda que se repare con lo que está roto.

**Y la comprobación que di era la misma trampa de siempre.** Dije «recarga la hoja: el menú se llama como el comercio». En la tienda que **se llama Orgánico** eso es idéntico antes y después: el rótulo pasó de la palabra escrita a mano a una variable que vale esa misma palabra, y las cinco opciones no se tocaron. Buscaste opciones nuevas que son del **Sprint 5** y todavía no existen. → Los dos documentos avisan de que el menú no cambia, y dan la única señal que sirve: `var NEGOCIO` en el editor de la hoja. Es el **segundo** caso de comprobación que da el mismo resultado antes y después —el primero fue la versión del Diagnóstico— y por eso pasa a los patrones. *(mío)*

---

## 🟡 Medios

**Una nota dentro de `devDependencies`.** Puse `"_comentario_sharp": "…"` para
explicar por qué hacía falta sharp en las pruebas, y `npm install` se negó:
*«name cannot start with an underscore»*. Cada clave de ahí es un **nombre de
paquete** para npm, no un sitio donde dejar una nota. El flujo `pruebas` quedó
rojo en el primer paso. → La nota se movió a un campo de primer nivel, que npm
ignora, y hay una aserción que valida el nombre de cada clave. *(mío)*

> **Lo que importa no es el error, es por qué no lo vi.** Corrí la suite entera
> antes de empujar y salió 1049/1049 — con `node_modules` ya instalado. El paso
> que fallaba, **instalar**, nunca se ejecutó. Comprobar con el trabajo ya hecho
> no comprueba el trabajo. Desde entonces, un cambio en `package.json` se prueba
> borrando `node_modules` primero.


**Dos menús «Diagnóstico», los dos diciendo «Versión de este código».**
Comparaste la del panel con la del maestro y parecía que el despliegue había
fallado. → «Versión del MAESTRO de esta tienda» y «Versión del PANEL». *(mío)*

**`todas.sh` solo imprimía el marcador.** Desde Actions el log es lo único que
hay, y `822/823` no dice qué se cayó. → Imprime las líneas `FALLA` debajo.
*(mío)*

**Cinco baterías daban por hecho que la tienda se llamaba «Orgánico».** Una
prueba así solo sabe ver la primera tienda: la segunda falla y nadie entiende
por qué. → Un comercio de prueba con nombre propio, y una aserción que prohíbe
la marca. *(mío)*

**Una tubería `| tee` sin `pipefail` se tragaba el fallo**: el shell por defecto
de Actions es `bash -e`, sin pipefail, así que manda el código de `tee`. Estaba
en dos flujos. *(mío)*

**El runbook hablaba de dos campos y el formulario tenía cinco**, dos de ellos
pidiendo datos que en ese punto del despliegue todavía no existen. → Una tabla
con todos, y una aserción que compara las dos listas. *(mío)*

**Una función `pesos()` duplicada** en el maestro; ganaba la última por
hoisting. Latente, nunca se manifestó. *(mío)*

**Un experimento a medias.** El menú de prueba del stub nombraba funciones que
nunca escribí, así que hacer clic no podía funcionar **nunca**. → Retirado una
vez medido lo que había que medir. *(mío)*

---

## ⚪ Menores

- **«758 aserciones» escrito a mano en seis sitios**, cuando ya iban por 900.
  → Se dijo «las 19 baterías», que tampoco duró: al llegar la 20 hubo que
    corregir seis archivos. Ahora se dice «todas las baterías», y una aserción
    impide volver a escribir el número.
- **`panel.gs` aparecía dos veces** en la tabla del README.
- **Un emoji al principio del mensaje** rompía la caja de escritura de WhatsApp.
  → Al final. *(del terreno)*

---

## Afirmaciones mías que resultaron falsas

Van aparte porque no son fallos de código: son cosas que dije con seguridad y
eran mentira. Todas las rectificaste tú.

1. **«Actions no puede correr las automatizaciones porque haría falta un
   llavero de todas las tiendas».** Falso: con un repositorio por tienda, los
   secretos son por repositorio y no hay llavero común.
2. **«El 403 de GitHub sin token es ocasional».** Falso: el cubo de 60 peticiones
   por hora es **por IP**, y Apps Script comparte IPs, así que está
   esencialmente siempre agotado.
3. **Escribí en la documentación una conclusión «medida» sobre el stub** a
   partir de tu primer reporte, y era incorrecta. Rectificaste —«sí funcionó el
   sin stub desde el maestro, salieron los dos menús»— y corregí el documento.
4. **«Menú de la hoja → Generar configuración → copiar el stub».** Falso, y lo
   dije dos veces: en la conversación y en dos documentos. El stub solo lo
   imprime `generarStub` —y `instalar()` al final— en el editor del maestro.
   Lo descubriste al pegar y no encontrar cambios que guardar.

---

## Cambios de rumbo

No son errores. Son decisiones que se revirtieron con información nueva, y
conviene que quede por qué.

| De | A | Por qué |
|---|---|---|
| La configuración en la hoja | Un formulario de Actions con seis campos | Parecía menos trabajo manual |
| **De vuelta a la hoja** | | Un formulario era más frágil que una hoja de cálculo, que es lo que este producto ya sabe hacer bien |
| Dos flujos: `montaje` y `maestro` | Uno solo, con el orden fijo | Dispararlos en el orden equivocado es fácil y silencioso: publicar el maestro después de escribir la página deja la tienda avisando que la hoja responde otra versión |
| El alta dentro de la plantilla | Un repositorio de servicio | Pedir el nombre de un repositorio nuevo desde dentro del que ya es el nuevo no tiene sentido, y el token que crea repositorios no puede vivir en algo de lo que se sacan copias |
| El alta, aparcada | | Cada vuelta cuesta crear un repositorio de verdad para descubrir que un campo se llenó distinto. Con dos tiendas, a mano cuesta menos |
| «Orgánico» como nombre del producto | Orgánico es **un comercio** | Ningún nombre de comercio puede estar escrito en el código, ni siquiera en el menú de la hoja |
| Montar la tienda dos ya | Estabilizar la semilla primero | Montar contra una semilla que todavía se mueve es probar dos cosas a la vez sin saber cuál falló |
| Reiniciar en 1.0.0 | Saltar a 2.0.0 | Una versión menor que la anterior rompe el orden, y la regla del proyecto pedía mayor: una tienda vieja tiene que tocar la hoja y el maestro |

---

## Lo que el terreno enseñó, y no fue culpa de nadie

- **Los disparadores instalables no salvan al stub.** Desde el motor standalone
  se puede dibujar el menú en la hoja de otro, pero al hacer clic falla con
  `PERMISSION_DENIED`: la frontera es la **propiedad del proyecto**, no la
  autorización. Se midió, y el stub se queda.
- **Las 30 ejecuciones simultáneas de Apps Script no suben pagando.** Es el
  límite que decidió que cada tienda tenga su propia cuenta de Google.
- **Un pull request abierto con el `GITHUB_TOKEN` no dispara otros flujos.** Por
  eso las pruebas corren dentro del flujo que abre el PR y no después.
- **Las dos URLs de un web app, `/dev` y `/exec`, llevan identificadores
  distintos.** No se puede deducir una de la otra.

---

## Los ocho patrones que se repitieron

Si hay algo que llevarse de todo lo anterior, es esto.

**1 · El fallo que funciona es el caro.** Los diez críticos tienen algo en
común: **ninguno falló**. El maestro sin hoja servía un inventario de respaldo;
el celular de fábrica entregaba los pedidos a alguien; la batería rota sumaba
0/0 y daba verde; el archivo congelado pasaba las pruebas. Todo lo que "cae a un
respaldo" tiene que gritar, o el respaldo se convierte en el estado normal.

**2 · Dos implementaciones del mismo procedimiento: una siempre se queda
atrás.** El flujo con su copia del montaje, el número de aserciones escrito a
mano, el runbook contra el formulario, la lista de lo que falta contra la
condición del botón. La regla que salió: **una sola fuente, y lo demás se
deriva de ella.**

**3 · Windows.** Tres de los cuatro fallos de herramientas eran específicos de
Windows, y **ninguna prueba corriendo en Linux podía verlos**. Sigue sin
resolverse: correr las baterías también en Windows está ofrecido y no aceptado.

**4 · Una prueba que solo sabe ver la primera tienda no prueba el producto.**
El producto es una tienda por comercio. Cinco baterías comparaban contra el
nombre de la primera; se descubrió montando la segunda, que es tarde.

**6 · Lo que solo cubre a los que vienen después, deja fuera al primero.** La
prueba que solo conocía la primera tienda no veía la segunda; el runbook que
solo describe tiendas nuevas no cubre la primera. Es el mismo hueco por los dos
lados: **lo que se escribe para "los demás" se olvida de quien ya estaba**, y
quien ya estaba es donde se prueba todo.

**5 · Una comprobación mal elegida es peor que ninguna.** Tres veces, y las
tres las propuse yo.

Las dos primeras **daban lo mismo antes y después**: «mira que el Diagnóstico
diga la versión» —cuando `VERSION` no había cambiado a propósito— y «recarga la
hoja: el menú se llama como el comercio» —en la tienda que se llama como el
comercio—. El técnico quedó buscando una diferencia que no podía existir.

La tercera fue más disimulada, porque **sí produjo una diferencia**: «bloquea
`script.google.com` en DevTools y mira si la tienda sigue vendiendo». La tienda
cargó el inventario en segundos y parecía la prueba superada. No lo era: Apps
Script contesta **302** y redirige a `script.googleusercontent.com`, otro
dominio, que no estaba bloqueado. El catálogo nunca dejó de llegar. La prueba
midió una tienda con el maestro **vivo** y la dio por muerta.

La regla, en dos partes:

1. Antes de dar una comprobación, preguntarse **qué respondería con el cambio
   sin aplicar**. Si es lo mismo, no es una comprobación.
2. Y cuando sí distingue, preguntarse **qué está distinguiendo de verdad**. Una
   diferencia observable no es prueba de la hipótesis: es prueba de que algo
   cambió.

> El dato técnico, que vale por sí solo: **la puerta `/exec` de una aplicación
> web de Apps Script responde 302 hacia `script.googleusercontent.com/macros/echo`,
> y los datos salen de ahí.** Cualquier lista —de bloqueo, de permisos, una CSP—
> que nombre solo `script.google.com` está incompleta. Este proyecto ya lo sabía
> donde importaba: la CSP del `<head>` nombra los dos en `connect-src`. Lo que
> faltaba era saberlo también al escribir una prueba.

---

**7 · Una caché convierte un chequeo en un recuerdo.** Dos veces en la misma
tarde, y las dos en el diagnóstico.

El informe llamaba a `catalogoPublico()`, que **cachea un minuto**. Con la caché
caliente, la lista de celdas ilegibles llegaba vacía: el informe daba todo por
bueno **mientras un precio llevaba una hora sin poderse leer**. Es el patrón 5
otra vez —una comprobación que contesta lo mismo con el problema puesto— pero
por un camino que no se ve leyendo la función: se ve leyendo lo que la función
llama.

La segunda fue mía y recién escrita: la caché de la respuesta de la tienda
guardaba **también los fallos**, y eso convertía un tropiezo de un segundo en el
veredicto de toda la ejecución. La cazó una aserción vieja, no una relectura.

La regla: **un instrumento no lee por la caché.** Lo que mide el estado actual
—un diagnóstico, una validación, una comprobación— lee la fuente. Y una caché
guarda respuestas, no fracasos: recordar «no se pudo» deja la función mintiendo
aunque el mundo ya conteste.

---

**8 · El reloj es una entrada que nadie declara.** El 10 de septiembre de 2026,
`tablero.js` amaneció en rojo sin que nadie hubiera tocado una línea. Llevaba
una semana en verde.

No era el producto: era la siembra. Un pedido fechado *«hace 40 días»*, con el
comentario *«fuera de todas las listas de 30 días»*. De las de 30 días, sí. De
la comparación contra el **mes pasado**, no: restar 40 días desde el día 10 cae
en el día 1 del mes anterior, que está dentro del tramo comparable. Sus 200.000
se sumaban a la base y seis aserciones se caían.

Esa batería **solo pasaba los primeros nueve días de cada mes**, y llevaba así
desde que se escribió. Nunca lo supimos porque todo el trabajo cayó entre el 4 y
el 9.

Al buscarle las vueltas aparecieron tres más, todas del mismo tipo: el ranking
de más vendidos se daba la vuelta el 1 y el 2 de marzo, porque febrero cabe
entero dentro de los 30 días; el correo del día 1 no encontraba un «día anterior
dentro del mes»; y un pedido fechado «ayer» el día 1 es del mes pasado, así que
la aserción que exigía que NO saliera en el CSV mensual **acusaba al producto de
un acierto**.

Y una trampa mía, recién puesta al arreglarlo: la primera corrección leía las
fechas del propio CSV. Eso no prueba qué filas salen, prueba **cómo se
serializa una fecha** — y la serialización cambiaba de mes a mes. Sustituí un
fallo de calendario por otro.

Tres reglas:

1. **Los meses se restan con `getMonth()`, no con días.** `new Date(a, m - 2, 15)`
   está fuera del mes pasado por construcción; `ahora - 40 días` está fuera
   *casi siempre*, que en una prueba es lo mismo que estar dentro.
2. **Si un escenario no puede existir ese día, se salta diciéndolo** — el día 1
   no hay un día anterior dentro del mes. Eso es distinto de saltárselo porque
   estorba: lo primero se anota, lo segundo se esconde.
3. **Una aserción no mide un formato si lo que quiere medir es una regla.** Se
   pregunta a la siembra qué filas deberían salir, y se comprueban esas.

Y una batería nueva, `calendario.js`, que corre las que miran el calendario
**fingiendo ser cada día de un año bisiesto** y exige el mismo marcador en
todos. Ninguna de las cuatro trampas se veía leyendo el código. Las cuatro se
veían corriéndolo otro día.

---

**9 · Dos cosas que hay que actualizar, y solo una tiene dueño.** El 14 de
septiembre de 2026, montando la tienda dos, todo estaba al día y la tienda
seguía abriendo con tomates.

El código se sincroniza de la semilla al repositorio de cada tienda.
`publicar/index.html` **no**, y con razón: no es código, es el archivo publicado
de ese comercio. Pero eso dejaba una actualización partida en dos, con la mitad
automatizada y la otra mitad en una línea de la guía —«traer el archivo nuevo al
repositorio de la tienda»— que alguien tenía que leer y hacer.

Lo que hace caro este fallo es que **no se ve**: la tienda quedó con los flujos,
la herramienta y las baterías de una versión, y la página de la anterior. Nada
está roto, nada avisa, el marcador sale verde. El síntoma aparece a tres pasos
de la causa, en el navegador de un comprador.

La regla: **si actualizar algo son dos cosas, la segunda se olvida.** No se
arregla escribiéndola mejor en el documento — se arregla haciendo que sea una
sola. Ahora el montaje se trae la página de la última versión de la semilla
antes de escribir encima lo de esa tienda, y el paso manual desapareció.

Y el corolario que conviene tener a mano al diseñar: **se puede reemplazar
entero lo que se genera entero.** Ese archivo se podía tirar y volver a traer
porque no queda en él un solo valor escrito a mano — el `<head>`, las
constantes, la paleta y el respaldo los escribe el montaje desde la hoja. El día
que alguien meta ahí un valor a mano, esta automatización se rompe en silencio.

---

**10 · Una comprobación que solo mira el principio del archivo no ve que el
archivo está cortado.** Recién escrita, y en el sitio donde más dolía.

El paso que trae la página de la semilla comprueba, antes de escribirla encima,
que lo descargado sea de verdad la plantilla: cuatro marcas que los pasos
siguientes van a buscar. Las cuatro viven en el primer tercio del archivo.
**Media descarga las traía todas**, pesaba sesenta mil bytes y pasaba la
revisión entera — justo el caso que esa revisión existe para atrapar.

Se vio porque la aserción que la probaba partía el archivo por la mitad y
esperaba un fallo que no llegó. Es el patrón 5 otra vez, y esta vez lo cazó una
prueba escrita el mismo día.

La regla: **para saber si algo llegó entero, hay que mirar el final.** La seña
que faltaba era `</html>`, que solo está si la descarga terminó. Vale para
cualquier cosa que se transfiera: el principio de un archivo no dice nada sobre
su tamaño.

---

**11 · Dos números que coinciden esconden dos pruebas que no prueban nada.**
Al escribir el catálogo de respaldo por tienda (4.20), dos baterías se pusieron
rojas. Las dos llevaban meses en verde. Ninguna de las dos había medido jamás lo
que decía su título.

- `cat.js` probaba el catálogo de respaldo poniendo el servidor en modo
  `caido`. `caido` tumba el registro y la validación, y **deja el catálogo
  vivo**: la sección medía una tienda con la hoja contestando con normalidad y
  la daba por muerta. El modo que hacía falta era `muerto`.
- `pag.js` esperaba a `pintado()`, que vuelve en cuanto la página dibuja algo —
  y lo primero que dibuja es el respaldo del archivo, antes de que llegue la
  hoja. Medía la paginación del archivo, no la de la hoja.

**Las dos pasaban por la misma razón: el respaldo del archivo tenía justo los
mismos ocho productos que la hoja emulada.** Esperar de más o de menos daba el
mismo número, y un modo o el otro daban el mismo número. Contestaban lo mismo
con el arreglo puesto y sin él.

El día en que el respaldo dejó de ser el de Orgánico, los dos números se
separaron y las dos hablaron.

La regla, que es una vuelta de tuerca del patrón 5: **cuando dos fuentes de un
dato tienen el mismo valor, ninguna prueba puede decir de cuál vino.** Si la
siembra y el archivo dicen lo mismo, hay que hacer que digan cosas distintas
antes de creerse una sola aserción.

---

**12 · Una guarda que acusa al producto de un acierto.** Al cerrar el 4.20 el
primer impulso fue calcar la guarda de la paleta (2.9.9): «ninguna batería de
navegador puede nombrar un producto de Orgánico». Marcó **diez** baterías.

Las diez tenían razón. Nombran tomates porque conducen la **hoja emulada**, que
es de fábrica y es idéntica en todas las tiendas. Lo que viaja por tienda es el
respaldo del archivo, no la hoja emulada — y esa diferencia una regla de texto
no la puede ver.

Se cambió por una batería, `respaldo.js`, que **monta una tienda que no es
Orgánico**, la sirve con la hoja muerta y mira qué se pinta. Lleva dentro su
propia prueba de que distingue: con el arreglo quitado, se cae.

La regla: **una guarda que produce falsos positivos se desactiva sola** — la
gente aprende a saltársela, y el día que acierta nadie la mira. Antes de poner
una regla de texto, hay que preguntarse si lo que quiere prohibir se puede
nombrar sin tocar lo que está bien. Cuando no se puede, no es una regla: es una
prueba, y hay que escribirla.

---

**13 · Un rojo que pide arreglar algo que no está roto.** El primer push del
4.20 al repositorio de la tienda salió rojo: `respaldo.js` 4/10 y `config.js`
con dos caídas, todas diciendo «Orgánico».

El código estaba bien. Lo que pasaba es que ese repositorio tenía el
`index.html` de antes —ver el 9— y las baterías estaban exigiendo algo que allí
**todavía no podía ser cierto**. El rojo mandaba a buscar un fallo inexistente:
el mismo error que cerró la tanda anterior, ahora del lado de las pruebas.

La regla ya estaba escrita en el patrón 8 y hubo que aplicarla en otro sitio:
**un escenario que hoy no puede existir se salta DICIÉNDOLO.** Las dos baterías
lo detectan y lo dicen, con los pasos que faltan.

Y la media vuelta que hacía falta para que eso no se convierta en lo otro:
`todas.sh` imprime los saltos **aunque el marcador salga verde**. Un salto que
solo existe dentro del archivo de salida que nadie abre es un salto escondido, y
de ahí a una batería que no corre desde hace tres meses hay un paso.

---

**14 · El banco de pruebas era dos comercios a la vez.** El 14 de septiembre de
2026, el primer montaje de la tienda dos con la versión nueva reventó tres
baterías, y ninguna de las tres hablaba de lo que le pasaba.

- `val.js` murió con «Cannot read properties of undefined (reading 'stock')».
  Hacía `agregar('chonto')` **a propósito antes de que llegara el catálogo** —la
  sección mira la pantalla mientras la hoja tarda—, y lo que hay en ese momento
  es el catálogo de respaldo DEL ARCHIVO. En el archivo de una tienda de
  cosméticos no existe ningún `chonto`.
- `config.js` leía «Orgánico» sin red en el repositorio de otro comercio.
- `montaje.js` exigía `#D0211C` en una tienda cuya paleta ya era la suya — el
  patrón 4 dentro de la batería que vigila el patrón 4.

La causa era una sola: desde que el montaje escribe el catálogo de respaldo, el
`index.html` del repositorio es **de un comercio** y la hoja emulada de `gas.js`
es **de otro**. El banco estaba probando una tienda que no existe, y los
síntomas caían a tres pasos de ahí.

La regla: **el archivo y los datos que se prueban juntos tienen que ser del
mismo comercio.** El arreglo no fue borrar el respaldo del arnés —eso dejaría
sin probar justo el camino nuevo— sino reescribirlo con el catálogo de la hoja
emulada, con la misma herramienta que usa el flujo. Una línea en `todas.sh`, y
las tres baterías volvieron a medir lo que dice su título.

Y el corolario para el diseño: **cuando una entrada que era constante se vuelve
variable, hay que buscar quién la daba por constante.** El respaldo llevaba
siendo el mismo en todos los repositorios desde que existía. El día que dejó de
serlo, salieron diez baterías que se apoyaban en eso sin saberlo.

---

**15 · Declarar no es aplicar.** La primera comprobación de «¿esta tienda ya
tiene la página del 4.20?» miraba `typeof CONFIG_SEMILLA`.

Daba verde en los dos casos. Un archivo **anterior** al 4.20 acaba declarando
`CONFIG_SEMILLA` igual —se la escribe el montaje, que sí está al día— y no la
aplica nunca, porque la línea que la aplica no está en él. La constante existía;
la página seguía pintando el comercio de la plantilla.

La regla: **se comprueba el efecto, no la presencia.** La página pone ahora una
bandera después de aplicar la configuración, y esa bandera solo existe si el
trabajo se hizo. Es el patrón 5 en su forma más barata de cometer: mirar si algo
está escrito en vez de mirar si algo pasó.

---

**16 · Resolver el problema de la etapa siguiente cuesta el doble.** El 14 de
septiembre de 2026 se automatizó que cada tienda se trajera la página de la
última versión de la semilla. El código estaba bien y las baterías lo probaban.
Falló en el primer montaje real con un 404, y se retiró al día siguiente.

El 404 —las versiones de la semilla no son públicas— era el síntoma barato. El
caro fue otro: **el problema que eso resolvía no existe todavía.** Hoy una
tienda nueva se crea *a partir de la plantilla* y nace con la página dentro, así
que lo que esté bien en la semilla llega solo. Actualizar una tienda **ya
creada** es un problema real, pero llega cuando haya tiendas viejas — y hasta
entonces, aquel paso solo añadía un camino más que se podía caer, dentro del
flujo del que depende cada despliegue.

Lo que lo hizo fácil de cometer es que la petición sonaba igual: «que no haya
pasos manuales». La había, y era cierta — pero en la **entrega de una tienda
nueva**, no en la actualización de las que ya existen. Dos problemas parecidos,
uno urgente y otro no, y la solución del segundo se coló en el camino del
primero.

La regla: **antes de automatizar algo, preguntar cuántas veces va a pasar este
mes.** Si la respuesta es cero, lo que se está construyendo no es una mejora:
es una superficie de fallo con un plazo de caducidad. Anotarlo en la hoja de
ruta es más barato, y ahí no se cae.

Y la mitad que sí se quedó, porque valía por sí sola: **lo que se genera entero
se puede reemplazar entero**, y para saber si algo llegó completo hay que mirar
el final —las marcas del principio las trae media descarga—. Las dos están
escritas en el 4.18 para el día que toque.

---

**17 · El único botón que el comerciante puede apretar no llevaba lo que él
cambia.** El 15 de septiembre de 2026, recién montada la tienda tres, el
operador cambió el título del sitio en la hoja y apretó **Publicar ahora**. Salió
el mensaje de siempre —«tu tienda se está actualizando… se revisan los datos»—
y no cambió nada. Ningún error, en ninguna parte.

«Publicar ahora» dispara el flujo `fotos`, y lo que ese flujo publica está
acotado a propósito: `publicar/fotos` y `publicar/catalogo.json`. Es la lista
que lo deja fusionar sin una persona en medio. Pero **todo lo que se escribe en
la pestaña Configuración** —el título del sitio, el nombre del comercio, los
colores, los textos de la portada, el WhatsApp— no vive en ninguna de esas dos
rutas: vive en el `<head>` y en las constantes del `index.html`, que solo
escribía `montaje`.

Así que el comerciante tenía un botón que le prometía «se revisan los datos» y
que, para la mitad de los datos, no hacía nada. El patrón 1 otra vez, y en el
peor sitio: en la única palanca de la persona que no puede entrar a GitHub.

La regla: **lo que el producto le ofrece cambiar a alguien, tiene que llegar
por el camino que esa persona puede recorrer.** No basta con que exista un
flujo que lo haga; tiene que estar en el que ella dispara. Ahora `fotos`
escribe el `<head>`, mira la Configuración al decidir si hay novedades, y repone
el respaldo — y la lista de lo publicable sigue siendo una sola.

Y el segundo hallazgo de la misma tarde: el `montaje` abría un pull request y
esperaba a que alguien lo aprobara. Esa exigencia tenía sentido mientras el
montaje traía la PÁGINA de la semilla —subir de versión a una tienda es una
decisión—, y ese paso se había retirado el día anterior. Quedó la ceremonia sin
el motivo. **Una guarda cuyo motivo desapareció no se queda «por si acaso»: se
quita, o se convierte en un trámite que la gente aprende a saltarse.**

---

**18 · La tercera vez que la misma lista estaba escrita dos veces, en el mismo
archivo.** El 15 de septiembre de 2026, montada la tienda tres, el operador
cambió el título del sitio, apretó «Publicar ahora», el flujo dijo que había
novedades, publicó las fotos y el catálogo — y el título no llegó.

El día anterior se había ampliado `PUBLICA` para que este flujo publicara
también `publicar/index.html`, que es donde vive el título. Y publicaba. Lo que
pasaba estaba unas líneas antes: para rehacer la rama sobre el `main` de ese
instante, el flujo guarda los archivos generados, hace `git reset --hard` y los
repone. Esa copia **nombraba dos de las tres rutas a mano**:

```
cp -r publicar/fotos      "$guardado/publicar/"
cp publicar/catalogo.json "$guardado/publicar/"
```

El `reset --hard` se llevaba por delante el `index.html` que el paso anterior
acababa de escribir desde la hoja. Todo lo demás funcionaba: el paso que decide
si hay novedades lo miraba, el `git add` lo incluía, las baterías corrían sobre
él. Solo que para entonces ya era el de antes.

Es el **patrón 2 por tercera vez en este mismo archivo**, y las tres veces con
la misma forma: alguien amplía la lista de arriba y no ve la copia de más abajo.
La cura tampoco cambia: guardar y reponer recorriendo `$PUBLICA`.

La regla, afinada: **cuando un archivo ya tuvo dos veces el mismo fallo, la
tercera no se arregla con cuidado.** Se busca a mano toda ruta escrita en ese
archivo que debería salir de la lista, y se quita. Ahora hay una aserción por
cada uno de los tres sitios.

---

**19 · Una condición de trabajo no puede saltarse una corrida que está
retenida.** El mismo día, en el mismo pull request.

`pruebas.yml` lleva desde el Sprint 5 una condición para no repetirse sobre el
pull request que abre `fotos`, escrita precisamente porque *«esa corrida queda
esperando la aprobación de un mantenedor, caduca, y deja una X roja en un pull
request que ya se fusionó bien»*. La condición está bien escrita y la rama
coincide.

Y no sirve. GitHub **retiene la corrida entera** esperando aprobación, y eso
pasa antes de que se evalúe ninguna condición de ningún trabajo. El `if:` nunca
llega a ejecutarse. Llevábamos semanas creyendo que ese caso estaba cubierto
porque la condición existía, sin haber comprobado nunca que hiciera algo — el
patrón 5 aplicado a una condición en vez de a una aserción.

Lo que sí lo resuelve es no abrir el pull request: cuando el flujo va a publicar
solo, empuja directo a `main`. Las baterías ya corrieron enteras sobre esos
mismos bytes, así que el pull request no añadía una sola comprobación; solo
añadía una corrida retenida y una marca roja que no significaba nada.

La regla: **una guarda que nunca ha visto el caso que dice cubrir no está
comprobada, está redactada.** Vale para un `if:` de un flujo igual que para una
aserción. Si no se puede provocar el caso, al menos hay que dejar escrito que
no se ha visto nunca.

---

**20 · Un paso que hace cuatro cosas falla entero por la que menos importa.**
El 15 de septiembre de 2026, la tienda tres. El comercio cambió el título de su
tienda y apretó «Publicar ahora». El flujo hizo su trabajo: escribió el `<head>`
con el título nuevo, comprobó que el catálogo estaba al día, repuso el catálogo
de respaldo. Y murió con código 1, sin publicar nada, porque **una foto del
Drive contestó 404**.

El paso agrupaba cuatro herramientas bajo un mismo `estado=$?`, así que
cualquiera de las cuatro tumbaba las otras tres. Visto desde el comerciante:
cambió su título, apretó el botón, y lo que llegó fue una cruz roja.

La regla: **no todo lo que falla en un paso vale lo mismo.** Un `<head>` a
medias es una tienda publicada y muda — eso sí para. Una foto que no baja no
invalida lo que el comercio escribió en su hoja: se publica lo demás y **se dice
en grande**, en el resumen y en el commit. Un fallo que se traga en silencio es
peor que uno que para; uno que para por lo que no importa, también.

---

**21 · Un diagnóstico que contradice lo que acaba de pasar delante.** El mismo
404, mismo día.

El mensaje decía, siempre: *«El maestro respondió 404. Casi siempre es que la
implementación quedó con acceso Solo yo»*. Y salió **después** de que ese mismo
maestro, en esa misma corrida, hubiera contestado `identidad`, `bloques` y
`fotos`. Con acceso «Solo yo» no habría contestado ninguna de las tres.

El operador se fue a revisar una implementación que estaba perfectamente bien.
Es la tercera vez en dos días que un error apunta al sitio equivocado, y esta
tiene un agravante: **el propio registro, dos líneas más arriba, desmentía el
consejo.**

La regla: **un mensaje de error puede mirar lo que ya pasó en esta corrida, y
debe.** Ahora se recuerda qué acciones contestó cada maestro, y el 404 dice a
cuál le contestó, descarta explícitamente lo que ya está descartado, y ofrece la
causa que sí explica un 404 en una sola acción: Apps Script sirve los datos
desde `script.googleusercontent.com` por una redirección que caduca. Cuando no
ha contestado nada todavía, el consejo de siempre vuelve a ser el bueno.

Dicho corto: **si el programa tiene delante la prueba de que su consejo es
falso, no tiene excusa para darlo.**

---

**22 · Lo que ninguna batería podía probar.** El 15 de septiembre de 2026 se
hizo, por primera vez, un pedido completo con un teléfono que no era el del
comercio: pedido → WhatsApp → respuesta automática → transferencia → *Pagado* en
la hoja → el stock baja. Salió bien.

No hay nada que arreglar aquí, y por eso mismo vale anotarlo. **1372 aserciones
prueban las piezas; esta prueba probó la costura.** Y la costura es donde vive
todo lo que este proyecto ha aprendido a temer: el paso que funciona pero llega
al sitio equivocado, el que se salta en silencio, el que contesta lo mismo con
el fallo puesto y sin él.

La regla, que cierra la lista y no contradice ninguna de las anteriores: **una
suite verde es una hipótesis, no un hecho.** Dice que cada pieza hace lo que
alguien escribió que hiciera. No dice que el comprador pueda pagar. Eso solo lo
dice un comprador pagando, y hay que ir a buscarlo — una vez, a propósito, antes
de que lo haga uno de verdad.

---

**23 · Un documento no lanza una excepción cuando miente.** El 16 de septiembre
de 2026, al revisar toda la documentación para el cierre de la 3.0.0, aparecieron
cinco guías de despliegue distintas — `RUNBOOK.md`, `DESPLIEGUE-CLIENTE.md`,
`MONTAJE.md`, `INSTALAR.md`, `FOTOS.md` — y dos manuales largos para el
comerciante, cada uno contando una versión distinta de la misma tienda. Tres
enseñaban a subir fotos a Cloudinary cuando llevan meses yendo a Drive. Tres
decían que el catálogo «se lee en vivo, cambias la celda y en un minuto está en
línea» cuando se hornea desde el Sprint 2 y necesita **Publicar ahora**. Uno
llamaba «Confirmado» a un estado que se renombró a «Pagado» hace varias
versiones. Un ADR de `DECISIONES.md` describía el catálogo en vivo como el
presente y lo estático como una condición futura, cuando la migración ya había
pasado. Ninguno de estos siete documentos daba un error al abrirlo. Todos se
veían terminados, con capturas, con tablas, con el mismo tono seguro que un
documento correcto.

Ya se había visto esta forma exacta de fallo — RUNBOOK.md enseñando un menú
derogado (patrón 2, primera vez), el manual del dueño con el mismo error
(patrón 2, tercera). Lo que este día enseñó es la escala: no era un documento
atrasado, era **la mayoría de los documentos que explican cómo se usa el
producto**, acumulados sin que nadie los borrara cuando quedaron cubiertos por
uno mejor. Cada aviso de "esto está atrasado, ver DESPLIEGUE.md" que se le fue
agregando encima era honesto y no arreglaba nada: el documento seguía ahí,
segundos de una búsqueda, dispuesto a que alguien lo leyera primero.

La regla: **un documento redundante no se marca como atrasado, se borra.** Un
aviso en la cabecera es una curita sobre una fuente que sigue mintiendo debajo;
borrar es la única corrección que no se puede volver a saltar por accidente.
Antes de borrar, se rescata lo que seguía siendo cierto y no vivía en ningún
otro lado —una advertencia sobre `wrangler.jsonc`, una tabla de fallos comunes,
una decisión de diseño deliberada— y se le da una sola casa nueva. El objetivo
declarado no es "mantener las guías al día": es que **cada procedimiento tenga
un solo documento que lo cuente**, porque un documento que no puede fallar en
rojo solo se corrige si deja de tener con quién competir.
