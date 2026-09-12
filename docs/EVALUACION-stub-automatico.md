# Evaluación · Inyectar el stub desde el maestro, sin pegarlo a mano

_10 de septiembre de 2026. Sobre una propuesta externa de tres archivos:
`arquitecturadespliegue.md`, `ActionActualizacionmenu.yml`,
`funcionactualizarmenu.js`._

**Veredicto: la idea es real y va al roadmap. La implementación propuesta no se
puede usar, y su argumento central es falso.**

Esto no se archiva como «no». Se archiva como «sí, pero no así, no ahora, y no
por la razón que dice el documento».

---

## 1. Qué propone

Que el **maestro** (proyecto suelto) escriba el **stub** (proyecto unido a la
hoja) llamando a la API de Apps Script —`PUT projects/{id}/content`— con el
token que da `ScriptApp.getOAuthToken()`. Un flujo de GitHub hace `clasp push`
y después despierta al maestro con un `curl` a su aplicación web.

Elimina el único paso manual que queda: generar el stub, copiarlo y pegarlo en
el editor de la hoja.

**El mecanismo existe y Google lo documenta.** No es una invención. La guía de
migración masiva a V8 hace exactamente esto.

---

## 2. El argumento central del documento es falso

El documento vende dos cosas: *«sin necesidad de configurar Google Cloud
Platform (GCP)»* y *«a costo cero ($0)»*.

La primera no es cierta. Para llamar a `projects.updateContent` desde Apps
Script, Google exige —en la misma página que enseña a hacerlo— **cinco**
requisitos, y cuatro son de Cloud:

1. Habilitar la API de Apps Script en los ajustes de la cuenta.
2. **Crear un proyecto estándar de Google Cloud.**
3. **Configurar la pantalla de consentimiento de OAuth.**
4. **Habilitar la API de Apps Script en ese proyecto de Cloud.**
5. **Asociar el proyecto de Apps Script a ese proyecto de Cloud.**

Más los dos permisos en el manifiesto: `script.projects` y
`script.external_request`.

**Y esto es POR TIENDA.** Cada tienda es su propia cuenta de Google con su
propio proyecto. Así que el cambio no elimina un paso manual: **cambia un pegado
de dos minutos por un proyecto de Cloud y una pantalla de consentimiento en cada
alta.** Al revés de lo que promete.

Que sea gratis, sí. Que no toque Cloud, no.

---

## 3. El código no se ejecutó nunca

```js
const url = `https://googleapis.com{scriptB_Id}/content`;
```

Dos errores en una línea: falta el `$` —así que `{scriptB_Id}` es texto
literal— y falta la ruta entera. Lo correcto es
`https://script.googleapis.com/v1/projects/${scriptB_Id}/content`.

Esa dirección no existe. **La llamada más importante de toda la propuesta no
puede haber corrido ni una vez.**

Esto no es una errata que se corrige y ya. Es lo que decide cuánto peso tiene el
resto del documento: **todo lo que afirma son afirmaciones, no resultados.** Un
diagrama bonito y una lista de secretos describen algo que nadie vio funcionar.

---

## 4. Lo que rompería si se pegara tal cual

### 4.1 `updateContent` borra lo que no le mandes

Google lo dice con todas las letras: *«si no incluyes un archivo, el archivo se
borra y no se puede recuperar»*. El `payload` propuesto manda dos archivos y
**reescribe el manifiesto** con `America/Bogota`, V8 y **sin `oauthScopes`**.

Aplicado a una hoja de verdad, eso pisa el manifiesto del script de la hoja. Y
el manifiesto es donde viven los permisos que el comerciante ya autorizó.

### 4.2 `clasp push` no publica

El flujo hace `clasp push --force` y acto seguido el `curl`. Pero la aplicación
web **sigue sirviendo la implementación anterior** hasta que alguien cree una
versión nueva. El `curl` ejecutaría el código viejo.

Este proyecto ya pagó por aprenderlo: está en el runbook —*«Nunca una
implementación nueva; Gestionar implementaciones > lápiz > Versión: Nueva»*— y
`montar/publicar-maestro.mjs` existe precisamente para resolverlo, incluida la
diferencia entre clasp 2 y clasp 3, y descartando la implementación `@HEAD`, que
es la de desarrollo y actualizarla no publica nada.

Los dos pasos de la propuesta están en el orden correcto y aun así dan el
resultado equivocado.

### 4.3 `clasp push --force` desde la raíz del repositorio

Subiría `pruebas/`, `montar/` y todo lo demás al proyecto de la tienda. Y sin
inyectar `HOJA_ID`, que es **el mismo fallo que ya dejó una tienda muda una vez**
(bitácora, patrón 2). `publicar-maestro.mjs` arma una carpeta temporal con el
maestro y su manifiesto, y sube esa.

### 4.4 El flujo no tiene ninguna puerta

`on: push: branches: [main]` → publicar. Sin baterías, sin confirmación, sin
grupo de concurrencia. El documento lo presenta como la virtud: *«Despliegue
Total Sin Intervención»*.

Nuestro `montaje.yml` exige marcar una casilla **y** escribir `PUBLICAR`, y
antes corre todas las baterías **sobre los archivos ya modificados**. Para un
backend que atiende pedidos y toca inventario, no tener puerta no es una
virtud: es el fallo que funciona.

### 4.5 Un tercer token, escrito en el código

```js
const tokenSeguridad = "UN_TOKEN_SECRETO_QUE_TU_ELIJA_AQUI";
```

El sprint 5 acaba de sacar los tokens de los sitios donde se leen (S5-5). Esto
mete uno de vuelta en el código fuente. Y ya tenemos dos tokens y una puerta
autenticada: un cuarto secreto no hace falta.

### 4.6 `doGet` chocaría con el nuestro

El maestro ya tiene un `doGet` que enruta nueve acciones. La propuesta lo
reemplaza entero.

### 4.7 El paso manual se mueve, no desaparece

`SCRIPT_B_ID` sale de las propiedades del script, puestas a mano. **No hay
forma de preguntarle a una hoja cuál es el id de su script unido.** Así que
«pegar el stub una vez» se cambia por «capturar y guardar un id una vez».

Tiene solución —`projects.create` con `parentId` crea el script unido y
devuelve su id— pero la propuesta no la menciona, que es distinto de haberla
descartado.

### 4.8 No quita la autorización, que es la fricción de verdad

Inyectar el código no lo autoriza. La primera vez que el comerciante toque una
opción del menú, Google le va a pedir permiso, porque los manejadores llaman a
`UrlFetchApp`. Ese diálogo es inevitable y no cambia.

---

## 5. Cuánto ahorra, de verdad

El paso manual es del **operador**, no del comerciante, y ocurre:

- una vez por tienda, al montarla;
- otra vez **solo cuando cambia el menú** — en toda la vida del proyecto ha
  pasado dos veces (2.3.0 y 2.6.0).

Con una tienda, automatizarlo no paga. Con ocho, sí — y no por los minutos: por
lo que un paso caro le hace a las decisiones. **Si cambiar el menú obliga a
entrar a ocho hojas, el menú deja de cambiarse.** Eso es exactamente la promesa
del Sprint 4: que un cambio llegue a todas las tiendas el mismo día.

El argumento bueno de esta propuesta no es el que el documento defiende.

---

## 6. Qué se adopta, y con qué condiciones

Va al **Sprint 4**, como parte de la épica del repositorio maestro, y **no antes
de la tercera tienda**. Con este diseño, que no es el propuesto:

1. **Leer antes de escribir.** `projects.getContent` primero; se reemplaza el
   archivo del stub y **se reenvía todo lo demás intacto**, manifiesto incluido.
   Nunca un `PUT` armado de cero.
2. **La puerta que ya existe.** `?a=` con el token de montaje, no un `doGet`
   nuevo ni un cuarto secreto.
3. **Con el mismo candado que publicar el maestro:** casilla y `PUBLICAR`
   escrito, y las baterías antes. Si no, no entra.
4. **Publicar y después despertar**, con `publicar-maestro.mjs`, que es lo único
   que sabe actualizar la implementación sin estrenar URL.
5. **Comprobado por el resultado, no por el código de respuesta.** Igual que
   S5-4 y S5-5: después de inyectar, preguntarle a la hoja qué stub tiene. Un
   200 dice que Google aceptó el `PUT`, no que el menú del comerciante funcione.
6. **Reversible.** Guardar el contenido anterior antes de pisarlo. Un `PUT` que
   deja una hoja sin menú y sin copia es un incidente sin salida.
7. **El costo por tienda, escrito en el alta:** el proyecto de Cloud y la
   pantalla de consentimiento pasan a ser parte del montaje, o esto no se puede
   desplegar en ninguna tienda nueva.

## 7. Y el paso previo, que cuesta casi nada

Antes de automatizar un paso conviene **medir cuántas veces hace falta**. El
maestro ya sabe si el stub de su hoja está al día —`menuCuadra()` lo compara, y
desde la 2.7.0 `STUB_CON_TOKEN_VIEJO` delata al que no se repegó—. Lo que falta
es que el **panel** lo muestre para todas las tiendas a la vez.

Eso convierte «acordarme de en qué hojas hay que repegar» en una columna. Es
barato, no toca el código de nadie, y da el dato que decide si el punto 6 vale
la pena.

**Hecho en la 2.7.2.** El stub declara su versión en cada petición y el panel la
muestra en la columna **Stub en la hoja**, con cinco estados que dicen cosas
distintas. No lo supone: mide lo que de verdad está pegado. Cuando haya tres
tiendas, esa columna dirá cuántas veces al mes hace falta repegar — y ese número
es el que decide si automatizarlo paga.

---

## 8. Segunda propuesta: «arquitectura inmutable orquestada por datos»

11 de septiembre de 2026. La idea: **el stub nace y muere con el mismo código**.
No lleva lógica ni lista de opciones; es un renderizador que lee un
`config.json` con los rótulos y el comportamiento de los botones. Ese JSON vive
en el repositorio, se edita a mano y GitHub Actions lo publica en el sitio
estático de la tienda (Cloudflare). Cambiar el menú = editar un JSON y hacer
`git push`. Sin `clasp`, sin la API de Apps Script, sin proyecto de Cloud.

### 8.1 Lo que esta propuesta acierta, y la anterior no

Es **mejor que la de la sección 1**, y por las tres cosas que hundieron aquella:

- **No necesita GCP.** Nada de proyecto estándar, pantalla de consentimiento ni
  scopes nuevos. Era el argumento falso del documento anterior; aquí es cierto.
- **No necesita la API de Apps Script.** No hay `updateContent`, así que no hay
  riesgo de borrar archivos que no mandaste.
- **No consume ejecuciones del maestro.** Un JSON estático en Cloudflare no
  compite por las **30 ejecuciones simultáneas** que tiene la cuenta, y no se
  cae cuando Apps Script se cae. Es exactamente el movimiento que ya hicimos
  con el catálogo horneado, aplicado al menú.

Separar *qué dice el menú* de *el código pegado en la hoja* es la dirección
correcta. El problema está en **cuándo** se puede leer ese JSON.

### 8.2 El obstáculo, que es el mismo que creó el stub

`onOpen` del stub es un **disparador simple**. Los disparadores simples corren
**sin autorización del usuario**, y por eso Google les prohíbe los servicios que
la requieren. `UrlFetchApp` necesita el permiso `script.external_request`: **un
`onOpen` simple no puede pedir el `config.json`.** Encima tiene un techo de
**30 segundos**, otra razón para no salir a la red al abrir la hoja.

La salida obvia —un disparador **instalable**, que sí corre autorizado— está
cerrada, y no por teoría: es el experimento **4.11**, medido el 6 de septiembre.
Un menú dibujado desde un disparador instalable bajo la cuenta del operador **le
aparece** al comerciante, pero al tocar una opción falla con `PERMISSION_DENIED`.
La frontera no es la autorización: es de quién es el proyecto. **Ese hallazgo es
la razón de que el stub exista.**

Así que el stub no puede ser «puramente un renderizador de datos externos»: en
el momento de abrir la hoja solo puede dibujar con lo que ya tiene dentro.

### 8.3 Y «inmutable» tiene una grieta: el token

El stub lleva dentro `MAESTRO` y `TOKEN`. `A3_rotarToken()` existe y cambia el
token del menú, y el stub es **uno de los sitios** donde vive. El token no puede
mudarse al `config.json`, porque ese JSON es público. Así que «nace y muere con
el mismo código» se sostiene **mientras no se rote el token ni cambie la URL del
maestro**. Hoy una rotación no rompe la hoja de inmediato —`?a=menu` sigue
aceptando el viejo y lo marca—, pero el código sí queda desactualizado.

Y se añade una promesa que habría que mantener para siempre: la forma de la
llamada stub → maestro (`?a=menu` y `pedir(i)`) **no podría cambiar nunca más**.
Un stub inmutable congela ese contrato.

### 8.4 Las dos formas en que sí funciona

La idea se salva cambiando *dónde* se renderiza:

**(a) Ranuras fijas.** El stub declara N opciones genéricas —`accion0..accion11`—
y los **rótulos** salen de lo último que se leyó, guardado dentro de la hoja. Al
abrir se dibuja con lo guardado; al tocar cualquier opción —que ya corre
autorizada— se refresca. Una hoja recién pegada muestra los rótulos por defecto
y al primer clic queda al día. **Mientras las opciones no pasen de N, no se
repega nunca.** Hay que medir una cosa antes: si `PropertiesService` o
`CacheService` funcionan dentro de un `onOpen` simple. La documentación no los
prohíbe explícitamente, y «no lo prohíbe» no es «funciona»: es una prueba de
diez minutos en una hoja de verdad.

**(b) El menú es una sola entrada, y el resto es un panel lateral.** El stub
dibuja **un** ítem fijo —«Abrir el menú de la tienda»—; al tocarlo se abre un
panel de `HtmlService`, que corre **autorizado** y puede leer el JSON sin
ninguna restricción. Ahí el menú es de verdad dirigido por datos: opciones
ilimitadas, se cambian editando un archivo, y el stub no se repega jamás.
Cuesta un clic más, y a cambio deja de ser un menú: puede tener explicaciones,
estado de la tienda y botones con contexto, que un menú de Google no permite.

### 8.5 Veredicto

**Se adopta la dirección, no el mecanismo.** Va al **Sprint 4**, junto al punto
6, y bajo las mismas condiciones —no antes de la tercera tienda— más dos suyas:

8. **Medir primero si un `onOpen` simple puede leer Properties/Cache.** De eso
   depende que (a) exista. Es una prueba de diez minutos y decide el diseño.
9. **Si se elige (b), el panel lateral reemplaza al menú, no se suma.** Dos
   caminos para lo mismo es el patrón 2, y ya sabemos cómo termina.

Y una comparación honesta: **(b) resuelve el problema entero y no necesita el
JSON externo para nada** —el panel puede preguntarle al maestro, que es quien
sabe—. El `config.json` estático solo paga si el menú tiene que verse **sin el
maestro vivo**. Esa es la pregunta que decide, y todavía no está contestada.

---

## Fuentes

- [Migración masiva de scripts idénticos a V8](https://developers.google.com/apps-script/guides/v8-runtime/bulk-migrate)
  — el ejemplo oficial de llamar a la API de Apps Script desde Apps Script, con
  sus requisitos y la advertencia del borrado.
- [`projects.updateContent`](https://developers.google.com/apps-script/api/reference/rest/v1/projects/updateContent)
- [Proyectos de Google Cloud en Apps Script](https://developers.google.com/apps-script/guides/cloud-platform-projects)
- [Disparadores simples](https://developers.google.com/apps-script/guides/triggers)
  — corren **sin autorización del usuario**, no pueden usar servicios que la
  requieran, y tienen un techo de 30 segundos.
- [Autorización para los servicios de Google](https://developers.google.com/apps-script/guides/services/authorization)
  — `UrlFetchApp` necesita `script.external_request`.
