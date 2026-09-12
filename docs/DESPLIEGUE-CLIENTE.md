# Despliegue de una tienda nueva — lista de chequeo

> **⚠ Este documento cubre un tramo, y está atrasado.** El mapa de punta a punta
> es **`docs/DESPLIEGUE.md`** y es el que manda. Lo de aquí sigue sirviendo para
> el detalle de su tramo, pero se escribió antes de la 2.6.0 y **no menciona
> «Publicar ahora»**, que es el botón que hace que un cambio de precio llegue a
> la tienda. Donde hable de «Confirmado», hoy se llama **Pagado**.


Para el técnico que monta. De arriba abajo, sin saltarse pasos: varios dependen
del anterior. Marca cada casilla.

> **¿Portátil sin nada instalado?** `RUNBOOK.md` hace lo mismo sin Node, sin
> git y sin clasp: las órdenes de terminal de aquí las corre GitHub Actions.
> Este documento sigue siendo el que explica el porqué y lista los fallos.

Al lado de cada paso: **[manual]** si hay que hacerlo con el ratón, **[orden]**
si es una línea en el terminal. Lo que hoy es manual y por qué, en
`ARQUITECTURA.md`.

Tiempo esperado la primera vez: entre 40 y 60 minutos. **Cronométralo** y anota
el resultado al final de este archivo: es el dato con el que se le pone precio
al servicio.

---

## Lo primero: qué es en vivo y qué se hornea

Esta distinción decide el orden de todo lo demás, y es la que más confunde.

| Lo que cambia el comercio | Cuándo lo ve su cliente |
|---|---|
| Precios, stock, productos, categorías | **En vivo.** La tienda lo lee cada vez que alguien la abre |
| Cupones, tarifas de envío | **En vivo** |
| Nombre, colores, textos, datos legales | **Al desplegar.** Va horneado en el `<head>` |
| Fotos | **Al desplegar.** Se convierten y se publican como archivos |

De ahí sale la respuesta a la pregunta que siempre aparece:

> ¿Hay que tener el catálogo completo y las fotos cargadas antes de montar?

**Las fotos, sí.** Tienen que estar en el Drive del comercio, con el nombre
exacto que va en la columna Imágenes, **antes** de montar. Si llegan después,
hay que volver a montar y a desplegar.

**El catálogo, no.** Basta con una fila válida —ID, Nombre y Activo = Sí— para
poder probar. Todo lo demás el comercio lo puede ir llenando después, incluso
con la tienda ya publicada, y aparece solo. **La configuración sí:** esa se
hornea, así que llénala antes del paso 10.

En corto: **fotos y Configuración antes de montar; el catálogo, cuando quieras.**

---

## Antes de empezar (una sola vez en tu equipo)

- [ ] `npm i -g @google/clasp`
- [ ] Tener a mano: nombre del comercio, su WhatsApp, sus datos legales
      (razón social o cédula, NIT, dirección, correo, ciudad) y sus fotos

---

## 0. El repositorio de esta tienda  **[manual]**

- [ ] En GitHub, `laboratoriodigital/organico` → **Use this template** →
      **Create a new repository**
- [ ] Nombre: `organico-<comercio>` · visibilidad **pública**
- [ ] Clonarlo y entrar:

```bash
git clone https://github.com/laboratoriodigital/organico-<comercio>.git
cd organico-<comercio>
npm install
```

> Una plantilla copia los archivos, no el historial ni los secretos. Trae el
> `index.html` y las fotos de la tienda anterior: los reemplaza `npm run montar`
> en el paso 10. **No hagas push antes de ese paso**, o el comercio queda
> publicado con los datos de otro.

> El nombre del sitio en `wrangler.jsonc` también viaja en la copia. Dos
> tiendas con el mismo nombre son el mismo sitio en Cloudflare y la segunda
> pisa a la primera. `npm run tienda` (paso 9) lo detecta y ofrece cambiarlo.

---

## 1. La cuenta de Google de la tienda  **[manual]**

- [ ] Crear una cuenta de Google **nueva**, solo para esta tienda
      → `gmail.com` · sugerencia de nombre: `tienda.<comercio>@gmail.com`
- [ ] Guardar usuario y contraseña en el gestor de contraseñas
- [ ] Poner **tu** celular como número de recuperación, no el del comercio
- [ ] Activar la verificación en dos pasos

> Por qué una cuenta por tienda y no una sola para todas: los límites gratuitos
> de Apps Script son por cuenta, y el que importa —30 ejecuciones simultáneas—
> no sube pagando. Está explicado en `ARQUITECTURA.md`.

---

## 2. La hoja  **[manual]**

Desde esa cuenta nueva:

- [ ] Crear una hoja de cálculo. Nombre: `<Comercio> — pedidos`
- [ ] Copiar el **HOJA_ID** de la URL: lo que va entre `/d/` y `/edit`

```
https://docs.google.com/spreadsheets/d/1AbC...XyZ/edit#gid=0
                                       ^^^^^^^^^^^ esto
```

---

## 3. El maestro  **[manual]**

Sigue en la misma cuenta.

- [ ] Ir a `script.google.com` → **Proyecto nuevo**
- [ ] Nombrarlo `<Comercio> — maestro`
- [ ] Borrar el `myFunction` que trae y pegar **todo** `maestro.gs`
- [ ] Arriba del archivo, llenar la única línea que se escribe a mano:

```javascript
var HOJA_ID = '1AbC...XyZ';
```

- [ ] Guardar (Ctrl+S)

> El **scriptId** ya no hay que copiarlo: `npm run tienda` se lo pregunta al
> propio maestro (paso 9).

---

## 4. Publicar el maestro  **[manual — una sola vez en la vida de la tienda]**

- [ ] **Implementar** → **Nueva implementación**
- [ ] Engranaje ⚙ → tipo **Aplicación web**
- [ ] Descripción: `v1`
- [ ] **Ejecutar como: Yo**
- [ ] **Quién tiene acceso: Cualquier persona** ← el error más común es dejarlo
      en "Solo yo"; la tienda responde 404 y no carga el catálogo
- [ ] **Implementar** → autorizar cuando lo pida (Configuración avanzada → Ir a…)
- [ ] Copiar la **URL de la aplicación web**. Tiene que terminar en `/exec`

📷 `docs/capturas/04-implementar.png` — el diálogo con "Ejecutar como" y "Quién
tiene acceso" señalados.

> **Nunca vuelvas a crear una implementación nueva.** Cada una estrena URL y
> deja la tienda muda. Para publicar cambios, el paso 12.

**Comprobación — no te la saltes, es el paso que más se pasa por alto.**
Abre en una **ventana de incógnito** `<la URL>?a=version`. Tiene que devolver
algo como `{"ok":true,"version":"2026-09-06"}`.

Si devuelve un 404 o una página de Google, el acceso **no** quedó en
"Cualquier persona". Y esto no falla de forma visible: la tienda igual carga,
porque se cae al inventario de respaldo que trae dentro. Se ve bien y está
muerta — no lee precios ni stock de la hoja, y no registra ningún pedido.

En incógnito y no en tu sesión normal: con tu cuenta abierta, una
implementación privada te responde igual a ti y parece que funciona.

- [ ] `?a=version` responde JSON **en incógnito**

> **Y ábrela también en tu navegador normal, aunque ya la hayas visto.** No es
> redundante: el maestro solo puede conocer su propia dirección `/exec`
> atendiendo una petición. Desde el editor, Google le dice la `/dev`, que lleva
> otro identificador y no le sirve a nadie más. Hasta que alguien abre la URL
> publicada, el stub y el `<head>` salen marcados como incompletos — a
> propósito, para que no se cuele una dirección que no existe.

---

## 5. `instalar()`  **[manual]**

- [ ] En el editor, seleccionar la función `instalar` y **Ejecutar**
- [ ] Autorizar los permisos que pida (hoja, Drive, correo)
- [ ] En el **registro de ejecución**, comprobar que dice `LISTO` y lista las
      pestañas

Crea las nueve pestañas, la configuración, los formatos, las listas
desplegables y los cuatro disparadores. Se puede volver a correr cuando
quieras: agrega lo que falte sin tocar ningún valor.

---

## 6. El stub en la hoja  **[manual]**

- [ ] En el mismo registro de ejecución, copiar todo lo que sale bajo
      `═══ PEGA ESTO EN LA HOJA ═══`
- [ ] Abrir la hoja → **Extensiones → Apps Script**
- [ ] **Borrar todo** lo que haya y pegar el stub
- [ ] Guardar
- [ ] Recargar la hoja

📷 `docs/capturas/06-menu.png` — cómo se ve el menú de la hoja con sus cinco
opciones.

**Comprobación:** aparece el menú de la hoja —así se llama en todas las
tiendas, es el nombre del producto— con exactamente estas cinco opciones:

```
Actualizar tablero e inventario
Enviarme el resumen ahora
Generar configuración para index.html
Generar inventario para index.html
Diagnóstico
```

- [ ] El menú de la hoja aparece con las cinco opciones

**Ponle nombre al proyecto antes de entregarlo.** En ese mismo editor, arriba a
la izquierda, renombra el proyecto con el **nombre del comercio**. Importa más
de lo que parece: la primera vez que el comerciante use el menú, Google le va a
pedir autorización y **le va a mostrar ese nombre**. Si lo dejas como
"Proyecto sin título", el comerciante ve una pantalla de permisos pidiendo
acceso a su cuenta a nombre de nada.

- [ ] El proyecto de la hoja se llama como el comercio

**La primera vez que el comerciante toque el menú, le va a salir esto.**
Avísale antes, o se asusta y no sigue:

```
Google no ha verificado esta aplicación
   → Configuración avanzada
   → Ir a <Comercio> (no seguro)
   → Permitir
```

Es normal y es una sola vez. El stub necesita permiso para hablar con el
servicio, y esa autorización tiene que darla **él** con su cuenta: no se puede
dar por adelantado desde la nuestra.

- [ ] El comerciante autorizó el menú y `Diagnóstico` le funciona

> Este paso no se puede automatizar: un `onOpen` tiene que correr bajo la cuenta
> de quien abre la hoja, y eso solo se logra desde dentro de la hoja.

---

## 7. Las carpetas de Drive  **[manual]**

**Fotos del comercio** (en el Drive de la cuenta de la tienda):

- [ ] Crear la carpeta `Fotos <Comercio>`
- [ ] Compartirla con el correo personal del comerciante, con permiso de editor
- [ ] Copiar su enlace

**Respaldos** (en el Drive del administrador, `laboratoriodigital.la@gmail.com`):

- [ ] Que exista `administracion_tiendas / backup_tiendas`
- [ ] Compartir `backup_tiendas` con la **cuenta de esta tienda**, permiso de
      **editor** ← sin esto el respaldo semanal falla
- [ ] Copiar su enlace

---

## 8. Llenar la hoja  **[manual]**

> Seis de estas claves —`negocio`, `whatsapp`, `sitio_url`, `fotos_drive`,
> `respaldo_carpeta` y `correo_resumen`— también se pueden llenar desde el
> formulario del flujo `montaje`, sin abrir la hoja. Ver `RUNBOOK.md`, bloque F.
>
> **`whatsapp` viene VACÍO de fábrica y `negocio` entre corchetes, a
> propósito.** Un número de fábrica no falla: funciona, y le manda los pedidos
> al teléfono de otro. Sin ellos el montaje se niega a escribir el index.

Pestaña **Configuración**:

- [ ] `negocio`, `whatsapp` (57 + celular, sin `+` ni espacios)
- [ ] `portada_titulo`, `portada_texto`, `portada_puntos`
- [ ] Los tres colores — se puede **pintar la celda** y el código sale solo
- [ ] `empresa_razon`, `empresa_nit`, `empresa_correo`, `empresa_direccion`,
      `empresa_ciudad`, `empresa_tel` ← **bloquean lo legal**, no los dejes
      entre corchetes
- [ ] `sitio_url` — la URL de Cloudflare de esta tienda
- [ ] `correo_resumen` — a quién le llega el resumen diario del comercio
- [ ] `fotos_origen` — `<sitio_url>/fotos`
- [ ] `fotos_webp` — **Sí**
- [ ] `fotos_drive` — el enlace de la carpeta de fotos (paso 7)
- [ ] `respaldo_carpeta` — el enlace de `backup_tiendas` (paso 7)

Pestañas **Catálogo**, **Envíos** y **Cupones**:

- [ ] Reemplazar los datos de ejemplo por los del comercio
- [ ] En **Imágenes** va solo el nombre del archivo: `chonto-1.jpg|chonto-2.jpg`

---

## 9. Apuntar el repositorio a esta tienda  **[orden]**

- [ ] Menú de la hoja → Diagnóstico**. Bajo `── PARA EL PANEL DE TIENDAS ──`
      están los dos datos que hacen falta

```bash
npm run tienda
```

Los pide por teclado, o se los pasas de una:

```bash
npm run tienda -- "https://script.google.com/macros/s/AAA.../exec" "tk-..."
```

- [ ] `npm run tienda` termina diciendo el nombre del negocio y su versión

Escribe **los dos archivos**, `tienda.json` y `montar/.clasp.json`. El
scriptId, el nombre del negocio y el enlace de la hoja no se copian: se los
pregunta al maestro, que ya se los sabe. Y antes de escribir nada comprueba que
ese maestro contesta, para no dejar dos archivos apuntando a una URL muerta.

> Ninguno de los dos se versiona: son distintos por tienda.

---

## 10. Montar  **[orden]**

```bash
npm run montar
```

- [ ] `npm run montar` termina sin errores

Escribe el `<head>` y las cinco constantes desde la hoja, y baja las fotos del
Drive del comercio ya convertidas a WebP en tres tamaños. Si algo falla, no
toca el archivo: un index a medias es peor que uno viejo.

---

## 11. Publicar el sitio  **[manual + orden]**

- [ ] Rama, commit con la convención de `CONTRIBUIR.md`, push
- [ ] Pull request → esperar el verde de las pruebas
- [ ] Revisar la **vista previa** de Cloudflare
- [ ] *Squash and merge*

En Cloudflare, si la tienda es nueva:

- [ ] Workers & Pages → Create → Connect to Git → su repositorio
- [ ] Production branch `main` · Build command vacío · Deploy command
      `npx wrangler deploy` · **Path `/`**
- [ ] En `wrangler.jsonc`, el `name` tiene que ser el de esta tienda
      (lo puso `npm run tienda` en el paso 9; compruébalo)

---

## 11b. Actualizar el maestro más adelante  **[orden]**

Cuando el maestro cambie, no se vuelve a pegar a mano:

```bash
clasp login          # con la cuenta DUEÑA DEL PROYECTO de esta tienda
npm run maestro
```

Sube el archivo y publica **versión nueva sobre la implementación que ya
existe**, así que la URL no cambia. La comprobación es el menú de la hoja →
Diagnóstico** de la hoja: "Versión del MAESTRO de esta tienda" tiene que decir
lo que imprimió el comando.

- [ ] `clasp show-authorized-user` muestra la cuenta correcta antes de correrlo

---

## 12. WhatsApp Business  **[manual — bloquea la venta]**

- [ ] Instalar WhatsApp Business en el celular del comercio
- [ ] Herramientas para la empresa → **Mensaje de ausencia** → activar
- [ ] Pegar el texto de la sección "Pagos" de `CONTEXTO.md`, con la llave real
- [ ] Dejar 5 o 6 respuestas rápidas

> Sin esto el comprador termina el pedido y **no tiene cómo pagar**: la llave
> sale de la página a propósito y solo se entrega por el chat.

---

## 13. Registrar la tienda en el panel  **[manual]**

En la hoja del panel, pestaña **Tiendas**, una fila:

- [ ] Estado `En montaje` · Comercio · Contacto · Celular · Correo
- [ ] Plan y Precio mensual · Día de cobro · Alta
- [ ] Sitio · **Servicio (URL /exec)** y **Token** — las dos líneas del paso 9
- [ ] Cuenta de Google · Repositorio
- [ ] Menú **Panel → Actualizar todas las tiendas**
- [ ] La fila aparece en Métricas como **En línea**

---

## 14. La prueba de punta a punta  **[manual — con un celular de verdad]**

No con el navegador en 375px: con un teléfono.

- [ ] Abrir la tienda, agregar al carrito, llenar los datos, enviar
- [ ] Llega el WhatsApp completo, con el emoji y el número de pedido
- [ ] Llega la respuesta automática con la llave
- [ ] El pedido aparece en la pestaña **Pedidos** como *Por confirmar*
- [ ] Cambiarlo a **Confirmado** → el stock baja solo
- [ ] Menú de la hoja → **Enviarme el resumen ahora** → llega el correo
- [ ] Probar un enlace por producto: `<sitio>/?p=<id>`

**Y la prueba que casi nadie hace:**

- [ ] Desactivar un minuto la implementación del maestro y hacer un pedido.
      El botón de WhatsApp **tiene que seguir funcionando**. Que el pedido no
      quede registrado es recuperable; que el botón no haga nada es una venta
      perdida.

---

## 15. Cerrar

- [ ] Estado de la tienda en el panel → **Activa**
- [ ] Entregarle al comerciante: el enlace de su tienda, el de su hoja, el de su
      carpeta de fotos, y el manual del dueño (`docs/manuales/`)
- [ ] Comprobar el domingo siguiente que el respaldo salió: menú de la hoja →
      Diagnóstico → `Último respaldo`

---

## 16. Dejarla andando sola  **[manual, una vez por tienda]**

Todo lo anterior se hizo desde tu equipo. Esto es para que la tienda se
mantenga al día sin que nadie corra nada.

**Los dos secretos del repositorio.** Settings → Secrets and variables →
Actions → New repository secret:

- [ ] `MAESTRO_URL` — la misma URL `/exec` del paso 9
- [ ] `MAESTRO_TOKEN` — el mismo token

> Son los de **esta** tienda y de ninguna otra: cada tienda tiene su
> repositorio, así que no hay un llavero común. Y lo que ese token permite está
> acotado: leer la configuración, listar la carpeta de fotos y bajar archivos
> de esa carpeta. No borra, no escribe en la hoja, no alcanza el resto del
> Drive.

Sin esos dos secretos el flujo no falla: se salta y lo dice en el resumen.

- [ ] Actions → **montaje** → Run workflow → `todo`
- [ ] Termina en verde y, si algo cambió, abre un pull request

---

## Los flujos automáticos

### `pruebas` — solo
Corre en cada pull request y en cada push a `main`. Nadie lo dispara.
Si toca `maestro.gs`, `panel.gs` o `publicar/index.html` sin subir `version` en
`package.json`, **falla a propósito**.

### `fotos` — cada 4 horas, y a demanda
**Es la vía rápida, y la única que se fusiona sola.**

Subir una foto es una acción del comercio, y el comercio no entiende de pull
requests ni tiene por qué esperar al lunes. Mira el Drive cada cuatro horas y,
si hay algo nuevo, lo publica.

```
1. una sola llamada     →  ¿hay fotos nuevas? casi siempre no, y termina en 20 s
2. baja y convierte     →  WebP en tres tamaños + JPG de respaldo
3. comprueba            →  ¿SOLO cambiaron archivos de publicar/fotos/?
4. corre las baterías
5. fusiona              →  y Cloudflare despliega
```

El paso 3 es el que hace segura la fusión automática: si el cambio toca **un
solo archivo** fuera de `publicar/fotos/`, no fusiona nada y deja el pull
request esperando a una persona. No es confianza, es una lista.

A demanda se puede pedir `con-pull-request` para revisarlas antes.

### `montaje` — lunes 6:00, y a demanda
Lo que hace, en este orden, y cada paso depende del anterior:

```
1. lee la hoja        →  escribe el <head> y las 5 constantes
2. lee el Drive       →  baja y convierte las fotos nuevas
3. ¿cambió algo?      →  si no, termina y no abre nada
4. corre las baterías →  SOBRE LOS ARCHIVOS YA MODIFICADOS
5. abre el pull request
```

El paso 4 es el que justifica todo el orden: las dos herramientas escriben
dentro de `index.html` a partir de lo que el comercio puso en su hoja. Si esa
configuración produce algo que rompe la tienda, es mejor enterarse ahí que en
la vista previa.

**Nunca empuja a `main`.** Abre un pull request y espera a una persona.

A demanda: Actions → montaje → Run workflow, y se elige qué traer —
`todo`, `solo-la-hoja` o `solo-las-fotos`. `solo-las-fotos` sirve cuando el
comercio subió fotos y no quieres arrastrar cambios de configuración a medio
hacer.

> `fotos` y `montaje` nunca corren a la vez: comparten grupo de concurrencia
> porque los dos escriben en `publicar/`.

> **Lo que corres en tu equipo NO commitea.** `npm run montar` escribe los
> archivos y ahí se queda: el commit, el pull request y la fusión los hace el
> flujo cuando corre **en GitHub**. Después de montar en local, el ciclo normal
> es tuyo: `git add`, `git commit`, `git push`.

### `maestro` — solo a mano, escribiendo `PUBLICAR`
Publica `maestro.gs` en el Apps Script de la tienda. Requiere dos secretos más,
`CLASPRC` y `SCRIPT_ID`, y **no está programado**: ver más abajo por qué.

### `release` — solo a mano
Corta una versión de la plantilla. Se usa en el repositorio de la plantilla,
no en el de una tienda.

---

## Por qué las fotos se fusionan solas y la configuración no

`montaje` puede reescribir el `<head>`, la política de seguridad y
`SCRIPT_URL`. Si la configuración de la hoja quedó mal, la tienda se cae. Por
eso ahí hay una persona en el medio.

Una foto no puede hacer eso. Lo peor que pasa si el comercio sube una foto fea
o equivocada es que se vea una foto fea: no toca precios, no toca la política
de seguridad, no toca el código, y se corrige subiendo otra. El costo de la
aprobación —hasta seis días de espera por algo que el comercio hizo hoy— es
mayor que el daño que evita.

La diferencia no se deja a la confianza: el flujo **comprueba** que el cambio
no salga de `publicar/fotos/` antes de fusionar.

## Por qué `maestro` no está programado

Los otros flujos, cuando terminan, dejan un pull request que alguien tiene que
mirar. Nada llega al cliente sin que una persona diga que sí.

`maestro` no: cuando termina, **el backend nuevo ya está atendiendo pedidos**.
No hay pull request en el medio, no hay vista previa, no hay vuelta atrás de un
clic. Si esa versión trae un error en el cálculo del total, el siguiente pedido
sale mal y nadie lo detuvo.

Por eso lo dejamos donde una persona decide y sabe qué cambió — normalmente
`npm run maestro` desde tu equipo, después de ver el pull request fusionado.
El flujo de Actions está para cuando no tengas el equipo a mano, y por eso pide
escribir `PUBLICAR` a mano.

Hay un segundo motivo. `MAESTRO_TOKEN` solo sirve para leer la configuración y
bajar fotos de una carpeta. `CLASPRC` es distinto: es una credencial de Google
con permiso sobre el Apps Script y el Drive de esa cuenta. Cuanto menos viva en
un servidor, mejor.

---

## Cuándo hay que reimplementar y cuándo no

Todo sale de una sola regla:

> **Los disparadores corren el código GUARDADO. La aplicación web sirve el
> código IMPLEMENTADO.**

| Lo que cambiaste | Pegar y guardar | `instalar()` | Nueva **versión** de la implementación |
|---|---|---|---|
| Cualquier cosa del maestro | ✅ siempre | | |
| Pestañas, claves de Configuración, formatos, disparadores | ✅ | ✅ | |
| Algo que la tienda pide por `/exec` (catálogo, validar, registrar) | ✅ | | ✅ |
| Algo que use el **menú** de la hoja | ✅ | | ✅ |
| Algo que use el **panel** (`?a=panel`) | ✅ | | ✅ |
| Algo que usen `npm run index` o `npm run fotos:drive` | ✅ | | ✅ |
| Solo el tablero, el correo o el respaldo | ✅ | | |

**En la práctica, casi siempre toca reimplementar**, porque hasta el menú de la
hoja pasa por `/exec`. La regla corta: *si algo fuera del editor lo va a usar,
reimplementa*.

Y `npm run maestro` hace las dos cosas de una: sube el archivo **y** publica la
versión nueva sobre la misma implementación.

### Versión NUEVA, nunca implementación nueva

```
Implementar → Gestionar implementaciones → lápiz ✏️ → Versión: Nueva
```

**Nunca** `Implementar → Nueva implementación`. Cada implementación nueva
estrena URL, y el `SCRIPT_URL` del index, el stub de la hoja y la fila del
panel siguen apuntando a la vieja. La tienda se queda muda y no lo dice.

La única vez que se crea una implementación es la primera de la vida de esa
tienda.

### `instalar()` es seguro de repetir

No pisa ningún valor: crea lo que falte, agrega las claves nuevas de
Configuración sin tocar las existentes, y vuelve a poner los formatos y los
disparadores. Ante la duda, córrelo.

## Fallos comunes

| Qué ves | Qué es | Cómo se arregla |
|---|---|---|
| La tienda carga pero sin productos | El maestro responde 404 | La implementación quedó en "Solo yo". Implementar → Gestionar → lápiz → Acceso: **Cualquier persona** |
| El menú de la hoja dice *contestó una página web* | Lo mismo, y es el fallo más común de todos | Igual que arriba. Compruébalo con `<URL>?a=version` en incógnito |
| El menú dice *Unexpected token '<'* | Un maestro viejo, de antes de que el stub supiera explicarlo | Publica el maestro nuevo y vuelve a pegar el stub |
| El menú falla pero **la tienda funciona bien** | El stub quedó con una URL fabricada a partir de la `/dev`. Es el error de la versión ≤1.4.1 | Publica el maestro ≥1.4.2, abre la URL `/exec` una vez en el navegador, ejecuta `generarStub()` y pega el stub nuevo |
| `generarStub()` imprime `TODAVÍA_NO_SE_SABE_LA_URL` | El maestro aún no ha atendido ninguna petición | Abre la URL `/exec` una vez en el navegador y vuelve a generarlo |
| `montaje` falla en "El `<head>`" con 404 | Lo mismo | Igual que arriba |
| `montaje` dice "no tiene la tienda configurada" | Faltan los secretos | Paso 16 |
| `montaje` falla en "Las fotos nuevas" con *Falta fotos_drive* | La clave está vacía en la hoja | Pega el enlace de la carpeta en `Configuración > fotos_drive` |
| `montaje` falla con *no está en la carpeta* | La foto está en el Drive pero fuera de la carpeta configurada | Muévela dentro |
| `montaje` falla con *La foto pesa 20 MB* | El tope son 8 MB | Pídele al comercio una versión más liviana |
| Un producto sale con su dibujo en vez de su foto | La hoja nombra una foto que no está en el Drive | `npm run fotos:drive` lo avisa por nombre; súbela o corrige la columna Imágenes |
| El comercio subió una foto y no aparece | El nombre no coincide con la columna Imágenes | Igual: el aviso dice cuál sobra y cuál falta |
| `fotos` corrió pero no fusionó | Cambió algo fuera de `publicar/fotos/` | Está bien: revisa el pull request que dejó abierto |
| Corrí `npm run montar` y no se desplegó nada | Lo local no commitea: eso lo hace el flujo en GitHub | `git add . && git commit && git push`, o deja que corra `fotos` |
| El tablero del panel no muestra ejecuciones | Falta llenar la columna Repositorio, o el repositorio es privado | Menú Panel → Diagnóstico lo dice |
| El panel dice *403, se acabaron las 60 peticiones por hora* | Sin token, GitHub limita por IP y Apps Script comparte las suyas: ese cupo está agotado **casi siempre** | Pon un token de grano fino con `Actions: read-only`. Sube a 5.000/hora |
| `npm run maestro` falla con *unknown command* | clasp 3 renombró los comandos | Resuelto desde 1.6.2: detecta la versión |
| `npm run maestro` dice *"." no se reconoce como un comando* | Era un script de bash y PowerShell no lo corre | Resuelto desde 1.6.3: ahora es Node |
| `npm run maestro` falla al subir | `clasp` está autenticado con otra cuenta | `clasp show-authorized-user` para ver cuál, y `clasp login` con la dueña del proyecto |
| `npm run maestro` dice *Falta clasp* y clasp **sí** está instalado | En Windows el binario es `clasp.cmd` y Node no lo lanza sin shell | Resuelto desde 1.6.4 |
| La versión del panel no coincide con la que imprime `npm run maestro` | **No tienen por qué coincidir.** Son tres códigos con tres numeraciones: el maestro, el `index.html` y el panel | La que se compara es la del menú de la hoja de la hoja de la tienda, no la del panel |
| El pull request no se abre | No cambió nada | Es lo correcto: el resumen del flujo lo dice |
| El pull request se abre pero las pruebas fallan | La configuración de la hoja rompe algo | Mira qué batería falló; casi siempre es una plantilla en `fotos_cdn` o un color que no es un color |
| Las pruebas fallan con *La versión sigue en X* | Tocaste algo desplegable sin subir la versión | Sube `version` en `package.json` |
| El menú de la hoja no cambió después de actualizar | Falta pegar el stub nuevo en la hoja | Paso 6 |
| La tienda avisa que la versión no coincide | El maestro desplegado es más viejo que el index | `npm run maestro` |
| No aparecen claves nuevas en Configuración | El maestro es nuevo pero no se corrió `instalar()` | Paso 5 |
| `npm run montar` dice que falta `SCRIPT_URL` | El proyecto no está implementado | Paso 4 |
| `npm run tienda` dice que no es la URL buena | Pegaste la `/dev` | La buena termina en `/exec` |
| El panel dice **NO RESPONDE** | 404, o la URL de la fila está mal | Menú Panel → Diagnóstico, que revisa las URL de todas |
| `npm run tienda` falla con *Falta HOJA_ID* | El maestro perdió su hoja y no puede contestar por las puertas que la necesitan | Con ≥1.7.3 pregunta por `identidad`, que contesta sin ella, y pide la URL de la hoja a mano |
| El panel dice **NO RESPONDE** y en Versión sale *Falta HOJA_ID* | El maestro publicado se quedó sin `HOJA_ID`. La tienda **está caída**: se ve bien porque cae a su inventario de respaldo, pero no lee la hoja ni registra pedidos | `npm run tienda` y `npm run maestro` (≥1.7.2, que lo devuelve a su sitio). O a mano: pegar el `HOJA_ID` en el editor y publicar versión nueva |
| El panel dice **FALLÓ** en Último respaldo | La cuenta de la tienda no tiene permiso sobre `backup_tiendas` | Paso 7 |
| El respaldo dice **nunca** y ya pasó el domingo | Falta correr `instalar()` con el maestro nuevo | Paso 5 |

---

## Cuánto tardó

| Tienda | Fecha | Técnico | Minutos | Qué costó más |
|---|---|---|---|---|
| | | | | |

---

## Las capturas que faltan

No las puedo tomar yo: son pantallas de Google con tu sesión. Estas cuatro son
las que de verdad ahorran una llamada. Guárdalas con estos nombres exactos en
`docs/capturas/` y las referencias de arriba las encuentran solas.

| Archivo | Qué debe mostrar |
|---|---|
| `03-scriptid.png` | La URL del proyecto con el scriptId señalado |
| `04-implementar.png` | El diálogo de Nueva implementación con "Ejecutar como: Yo" y "Acceso: Cualquier persona" |
| `06-menu.png` | El menú de la hoja desplegado con sus cinco opciones |
| `08-colores.png` | La celda de color pintada y el hexadecimal que sale solo |
