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
