# Desplegar una tienda, de punta a punta

**Este documento es el mapa.** Dice todo lo que pasa desde que no existe nada
hasta que el comercio está vendiendo, en orden, y con quién hace cada cosa.

> **Por qué existe.** Había cuatro documentos describiendo tramos de este mismo
> procedimiento —`RUNBOOK.md`, `DESPLIEGUE-CLIENTE.md`, `MONTAJE.md`,
> `INSTALAR.md`— y **ninguno de los cuatro menciona «Publicar ahora»**, que es
> el botón que hace que un cambio de precio llegue a la tienda y que existe
> desde la 2.6.0. Tres todavía hablan de «Confirmado», que dejó de existir en la
> 2.8.0. Es el patrón 2 de la bitácora a escala de documentación: cuatro copias
> del mismo procedimiento, y todas se quedaron atrás.
>
> Este mapa manda. Los otros cuatro quedan como detalle de su tramo, y hay una
> deuda anotada de consolidarlos.

---

## De un vistazo

```
   TÚ                          GITHUB / CLOUDFLARE           GOOGLE
   │
   ├─ 1. repositorio ──────────► desde la plantilla
   ├─ 2. Cloudflare ──────────► apunta a publicar/
   ├─ 3. cuenta + hoja ───────────────────────────────────► hoja del comercio
   ├─ 4. pegar maestro.gs ────────────────────────────────► Apps Script
   ├─ 5. IMPLEMENTAR (1 vez) ─────────────────────────────► la URL /exec
   ├─ 6. abrir esa URL una vez ───────────────────────────► el maestro se sabe
   ├─ 7. A0_instalar() ───────────────────────────────────► pestañas y avisos
   ├─ 8. llenar la hoja (16 claves)
   ├─ 9. A2_diagnosticoCompleto() ─► servicio + token
   ├─ 10. los 5 secretos ──────► del repositorio
   ├─ 11. flujo `montaje` ─────► index.html y catalogo.json
   ├─ 12. A1_generarStub() ───────────────────────────────► pegar en la hoja
   ├─ 13. fotos al Drive ─────────────────────────────────► «Publicar ahora»
   ├─ 14. WhatsApp Business: respuesta automática
   ├─ 15. las cuatro comprobaciones
   └─ 16. entrega
```

El orden **no es negociable** en tres sitios, y los tres cuestan una hora si se
invierten. Están marcados con ⚠ más abajo.

---

## Antes de la primera tienda de tu vida (no por tienda)

- Cuenta de GitHub con la organización, y la plantilla `organico`.
- `npm i -g @google/clasp` y `clasp login` — **con la cuenta dueña de la tienda
  que vas a montar**, no con la tuya.
- Habilitar la API de Apps Script una vez por cuenta:
  `script.google.com/home/usersettings`.
- El repositorio de servicio `laboratoriodigital/tiendas`, donde vive
  `ALTA_TOKEN`. **Ese secreto no se copia a ninguna otra parte.**

Detalle: `RUNBOOK.md` sección A.

---

## 1 · El repositorio de la tienda  · GitHub · ~5 min

Desde la plantilla. Nombre `organico-<comercio>`.

Y **la casilla que se olvida siempre**: Settings → Actions → General →
*Allow GitHub Actions to create and approve pull requests*. Sin ella el flujo
`montaje` corre entero, funciona, y falla en la última línea.

## 2 · Cloudflare  · ~3 min

Conectar el repositorio. Rama de producción `main`, comando de compilación
**vacío**, directorio `publicar/`. Empujar a `main` despliega.

## 3 · La cuenta de Google y la hoja  · ~10 min

**Una cuenta de Google por tienda, creada por ti.** Con tu celular como
recuperación y la contraseña en tu gestor. El comercio es **editor** de la hoja
compartida, no dueño de la cuenta.

Crear la hoja de cálculo en esa cuenta. Copiar su ID de la URL, entre `/d/` y
`/edit`.

## 4 · El maestro  · ~5 min

Apps Script → **proyecto suelto** (no unido a la hoja). Pegar `maestro.gs`
entero y poner el `HOJA_ID` arriba.

## 5 · ⚠ Implementar como aplicación web — **una sola vez en la vida**

Implementar → Nueva implementación → Aplicación web.
**Ejecutar como: Yo · Quién tiene acceso: Cualquier persona.**

> **⚠ Esta es la única vez que se crea una implementación NUEVA.** Una
> implementación nueva **estrena URL** y deja la tienda muda.

### Y después, ¿hay que volver a tocar «Implementar»? Casi nunca

**No.** Cuando el maestro cambia, `montaje` con la casilla `maestro` sube el
archivo **y actualiza la implementación que ya existe** (`update-deployment`),
sobre la misma URL. Y no lo da por hecho: al terminar le pregunta a la `/exec`
qué versión responde y **falla si no es la que acaba de publicar**. Si la
corrida sale verde, el despliegue está hecho — no hay que abrir Implementar.

Solo se toca a mano en dos casos, y los dos se anuncian:

- El flujo imprime *«Subió el archivo pero no pude publicar la versión»*.
- La tienda no tiene `CLASPRC`/`SCRIPT_ID` y el maestro se pega a mano en el
  editor. Ahí sí: Implementar → **Gestionar** implementaciones → ✏ → Versión:
  **Nueva** (nunca «Nueva implementación»).

> `A0_instalar()` **no despliega nada**. Corre el código del editor, que puede
> ser más nuevo que el que sirve la `/exec`. Es idempotente y no hace daño
> ejecutarlo, pero no sustituye a lo de arriba ni hace falta después de cada
> montaje.

## 6 · ⚠ Abrir esa URL una vez en el navegador

El maestro **solo puede conocer su propia dirección atendiendo una petición**.
Desde el editor, Google le dice la `/dev`, que no le sirve a nadie más.

Si te saltas esto, el paso 9 dice «TODAVÍA NO SE SABE» y no entiendes por qué.

## 7 · `A0_instalar()` en el editor del maestro

Crea las nueve pestañas, los desplegables, los disparadores y los dos tokens.
Es idempotente: se puede repetir.

> Las funciones que se ejecutan a mano llevan prefijo `A0_`…`A4_` para que
> queden juntas al principio de la lista del editor, y numeradas **en el orden
> en que se necesitan**.

## 8 · Llenar la hoja · ~12 min

Pestaña `Configuración`. **Dieciséis claves**, y el sistema sabe cuáles faltan.

**Cuatro rompen la venta** — sin ellas el flujo `montaje` se niega a publicar:

| | Sin ella |
|---|---|
| `negocio` | la tienda se anuncia con un corchete |
| `whatsapp` | el pedido no llega a ninguna parte |
| `sitio_url` | no funcionan «Ver mi tienda» ni la comprobación de publicación |
| `pago_llave` | **el comprador termina el pedido y no tiene cómo pagar** |

**Doce dejan la tienda a medias** y avisan sin bloquear: `pago_titular`,
`pago_entidad`, `repositorio`, `correo_resumen`, `respaldo_carpeta`,
`sitio_titulo`, `sitio_descripcion` y los `empresa_*`.

> **`repositorio` vale el doble de lo que parece.** No solo le dice a «Publicar
> ahora» a quién disparar: es lo único con lo que un flujo puede comprobar que
> la hoja que está leyendo es la de **esta** tienda. Montando dos a la vez, los
> secretos de un repositorio pueden acabar apuntando a la hoja del otro
> comercio, y entonces **no falla nada**: el flujo corre en verde, las fotos
> bajan, Cloudflare despliega, y los cambios de un comercio salen en la tienda
> del otro. Con esta clave llena, el flujo se planta antes de escribir. Sin
> ella, avisa y sigue. Escríbela como `dueño/repositorio`.

Los `empresa_*` alimentan el texto de tratamiento de datos. **La tienda pide
nombre, celular y dirección: eso es tratamiento de datos personales y en
Colombia lo regula la Ley 1581 de 2012.**

## 9 · `A2_diagnosticoCompleto()` — los dos datos del panel

Imprime **Servicio** (la URL `/exec`) y **Token** (el de montaje). Son los dos
únicos datos que el panel no puede adivinar.

> Se ejecuta desde el editor **a propósito**: el Diagnóstico que abre el
> comerciante desde su menú **no** muestra el token de montaje.

## 10 · Los cinco secretos del repositorio

*Settings → Secrets and variables → Actions → New repository secret.*

**Son cinco y solo cinco.** Cualquier otro sobra, y sobrar aquí no es inocuo:
un secreto de más es una llave que nadie va a acordarse de rotar.

| Secreto | De dónde se saca, exactamente | Pinta que tiene | Si falta |
|---|---|---|---|
| `MAESTRO_URL` | Paso 9. `A2_diagnosticoCompleto()` en el editor del maestro → línea **Servicio**. También: *Implementar → Gestionar implementaciones → URL de la aplicación web* | `https://script.google.com/macros/s/AKfycb…/exec` | `fotos` y `montaje` se saltan solos y lo dicen en el resumen |
| `MAESTRO_TOKEN` | Paso 9, línea **Token** del mismo diagnóstico | `tk-…` | igual que el anterior |
| `SCRIPT_ID` | La URL del editor del maestro: lo que va entre `/projects/` y `/edit` | 57 caracteres | solo falla `montaje` con la casilla `maestro` |
| `HOJA_ID` | La URL de la hoja del comercio: lo que va entre `/d/` y `/edit` | `1AbC…XyZ` | el maestro sube **sin hoja** y sirve un inventario de respaldo, que es el fallo que no falla |
| `CLASPRC` | El **contenido entero** de `~/.clasprc.json` — el que `clasp login` escribe en tu **carpeta personal**, no en la del proyecto | `{"tokens":{"default":{…,"refresh_token":…}}}` | solo falla `montaje` con la casilla `maestro` |

> **⚠ `.clasp.json` y `~/.clasprc.json` son DOS archivos distintos, y es el
> error que costó una tarde en la segunda tienda.**
>
> | | Qué es | Dónde | ¿Secreto? |
> |---|---|---|---|
> | `~/.clasprc.json` | **las credenciales** | tu carpeta personal: `C:\Users\<usuario>\` | **sí: es `CLASPRC`** |
> | `.clasp.json` | a qué proyecto subir: `{ scriptId, rootDir }` | la carpeta del proyecto | **no.** En Actions ni se usa: el scriptId va en `SCRIPT_ID` |
>
> `clasp login` **no deja nada visible en la carpeta del proyecto**, así que
> parece que falló y se acaba buscando «el archivo de clasp» que sí se ve —que
> es el otro—. Pegado en el secreto, clasp contesta `No credentials found`, que
> es cierto y no ayuda. El flujo ahora lo mira antes y lo dice; en tu equipo,
> `node montar/revisar-clasprc.mjs`.

### Las tres advertencias que cuestan una hora cada una

**`MAESTRO_URL` y `MAESTRO_TOKEN` son los únicos que no se pueden deducir.** Los
otros tres están a la vista en una URL o en un archivo; estos dos solo los sabe
el maestro, y el Diagnóstico del **menú del comerciante ya no muestra el
token**. Hay que correr `A2_diagnosticoCompleto()` **desde el editor**.

**`CLASPRC` es el único dato del producto que no sale de una pantalla de
Google.** Hay que correr `clasp login` una vez, en algún sitio con Node — y ese
sitio no tiene por qué ser tu equipo: `clasp login --no-localhost` imprime una
dirección, la autorizas en cualquier navegador y pegas de vuelta el código. Se
hace **una vez por tienda**. Sin él la tienda se abre igual: el maestro se pega
a mano en el editor. Lo que compra es que publicarlo sea un botón.

**`CLASPRC` caduca.** Es una sesión de Google, no una llave eterna. El día que
`montaje` con `maestro` falle en «clasp push» con un error de autenticación, no
está roto el flujo: hay que repetir `clasp login` con esa cuenta y volver a
pegar el archivo. Es el único de los cinco que se muere solo.

### Los tres que NO son secretos del repositorio

| | Dónde vive | Por qué ahí |
|---|---|---|
| `ALTA_TOKEN` | **Solo** en `laboratoriodigital/tiendas` | es el único token capaz de crear repositorios. En una tienda no pinta nada, y ponerlo ahí convierte cada tienda en una llave maestra |
| `GITHUB_TOKEN` de «Publicar ahora» | Script Properties del maestro de **esa** tienda | lo lee `publicarAhora()`. **Las Script Properties no están cifradas**: de grano fino, **uno por tienda**, limitado a ese repositorio, con `Actions: Read and write` y nada más, y **con vencimiento**. Se crea en *GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens* |
| La llave de pago (`pago_llave`) | La pestaña `Configuración` de la hoja, y de ahí **a ninguna parte** | el filtro `pago_*` la borra antes de que salga por cualquier puerta. No va en la página ni en el repositorio: llega al comprador por la respuesta automática de WhatsApp (paso 14) |

### Y una fila en el panel

En la pestaña `Tiendas` del panel: el comercio, el **Servicio** y el **Token**
— los mismos dos valores del paso 9. Es el tercer sitio donde vive el token, y
el que se olvida al rotarlo.

## 11 · El primer montaje  · Actions · ~5 min de reloj

Actions → `montaje` → Run workflow. Marcar `maestro` **y** escribir `PUBLICAR`.

Hace, en este orden: publica el maestro → escribe `index.html` desde la hoja →
trae las fotos → hornea `catalogo.json` → corre todas las baterías **sobre los
archivos ya modificados** → abre el pull request.

Revisar la vista previa de Cloudflare y fusionar.

> **La primera corrida después de publicar el maestro es LENTA, y es normal.**
> Apps Script queda «frío» al actualizar una implementación: la primera
> petición a la `/exec` puede tardar cuarenta segundos o más. Las herramientas
> ya lo aguantan —esperan 90 s y reintentan— y el log dice cuánto tardó cada
> llamada. Si ves `· «bloques» contestó en 38 s`, no está roto: está
> arrancando.

## 12 · ⚠ `A1_generarStub()` — y el orden importa

**Genera el stub a partir del maestro que está PUBLICADO**, no del que está en
el repositorio. Hacerlo antes del paso 11 devuelve el stub viejo y parece que la
versión nueva no trae nada.

Copiar lo que imprime → hoja del comercio → Extensiones → Apps Script → pegar
encima de todo → guardar.

**Abrir el menú de la hoja una vez.** Ese clic es lo que deja constancia de que
la hoja ya entra con el token del menú; sin él, el panel no distingue una hoja
migrada de una que nadie ha tocado.

## 13 · Las fotos

Al Drive de la cuenta de la tienda, en la carpeta que diga
`Configuración > fotos_drive`, **con el nombre exacto** que lleve la columna
`Imágenes` del catálogo, mayúsculas incluidas. Formatos: JPG, PNG, WebP.

Después, menú de la hoja → **Publicar ahora**.

> Si el flujo dice «nada nuevo» y tú acabas de subir fotos, el resumen del paso
> trae ahora **cuántas ve el maestro en la carpeta** y **cuáles nombra la hoja
> sin tenerlas**. Casi siempre es la carpeta equivocada o el nombre que no
> coincide.

## 14 · WhatsApp Business — la respuesta automática

**Es el único paso donde el diseño de seguridad se convierte en un agujero
funcional si se olvida.** La llave de pago no está en la página a propósito: el
comprador la recibe por el chat. Si el mensaje no está puesto, **termina el
pedido y no tiene cómo pagar**.

WhatsApp Business → Herramientas para la empresa → Mensaje de ausencia. El texto
sale de `pago_texto`, o se arma con `pago_llave`, `pago_titular` y
`pago_entidad`.

## 15 · Las cuatro comprobaciones, antes de entregar

1. **Diagnóstico** (menú de la hoja). Punto 2: *«las 16 claves del alta están
   llenas»*. Punto 1: la versión del maestro coincide con la etiqueta.
2. **Panel**: la fila de este comercio, con **Sin terminar** en blanco y **Stub
   en la hoja** diciendo *al día*.
3. **Un pedido de punta a punta, con un teléfono que no sea el del comercio**:
   pedido → WhatsApp → respuesta automática → transferencia → **Pagado** en la
   hoja → el stock baja. Todo lo demás está probado en automático; esto prueba
   la costura.
4. **Apagar el maestro un minuto y hacer un pedido.** Lo que no puede pasar es
   que el botón no haga nada. Que el pedido no quede en la hoja es recuperable
   —la tienda lo reenvía cuando el comprador vuelve—; que el botón no responda
   es una venta perdida.

## 16 · La entrega

- La **guía de una página** impresa (`docs/manuales/Guia-de-una-pagina.html`).
  Es lo que se explica; el manual del dueño es para después.
- El **manual del dueño**, en PDF.
- Compartir la hoja con el correo del comercio **como editor**.
- Enseñarle las tres cosas del día a día: cambiar un precio → **Publicar
  ahora**; pedido nuevo → **Pagado**; algo raro → **Diagnóstico**.

El menú de su hoja tiene seis opciones, y conviene nombrárselas todas una vez:

| | |
|---|---|
| **Publicar ahora** | manda a la tienda lo que cambió. La que más se usa |
| **Ver mi tienda** | la abre como la ve un comprador |
| **Actualizar tablero e inventario** | recalcula ya, sin esperar la hora |
| **Enviarme el resumen ahora** | manda el correo del día en el momento |
| **Diagnóstico** | revisa todo y dice qué está mal y dónde |
| **Ayuda** | las preguntas de siempre, contestadas |

> **Si explicar esto toma más de 30 minutos, el hallazgo es de diseño, no del
> comerciante. Anótalo.**

---

## Después: qué corre solo y qué se opera

| Cuándo | Qué |
|---|---|
| cada 4 h | flujo `fotos`: hornea el catálogo y trae fotos nuevas |
| lunes 6:00 | flujo `montaje` completo |
| cada hora | tablero e inventario |
| domingos 2:00 | respaldo de la hoja |
| a diario, el comercio | precios y stock → **Publicar ahora**; pedidos → **Pagado** |
| cuando cambie el maestro | `ACTUALIZAR-UNA-TIENDA.md` |

---

## Los tres sitios donde el orden cuesta una hora

1. **Implementar una vez, actualizar siempre.** Una implementación nueva estrena
   URL y deja la tienda muda.
2. **Abrir la `/exec` una vez** antes de pedir los datos del panel.
3. **Generar el stub DESPUÉS de publicar el maestro.** Antes devuelve el viejo, y
   parece que la versión nueva no trae nada.

## Los tres sitios donde se pueden cruzar dos tiendas

Con una tienda montada esto no existe. Con dos, es el fallo más caro de seguir,
porque **corre entero en verde**:

1. Los secretos `MAESTRO_URL` y `MAESTRO_TOKEN` de este repositorio →
   *Settings > Secrets and variables > Actions*.
2. La clave `repositorio` de la pestaña `Configuración` de la hoja.
3. **A qué repositorio está conectado el proyecto de Cloudflare** que sirve el
   sitio → *Workers & Pages > el proyecto > Settings > Build*.
4. **`SCRIPT_ID` y `CLASPRC` juntos.** Al montar la segunda tienda se copian
   los secretos de la primera y este se queda con el proyecto de aquella,
   mientras las credenciales ya son de la nueva cuenta. Google contesta
   **`The caller does not have permission`**, que dice que alguien no tiene
   permiso sin decir quién ni sobre qué — y lleva a revisar la API de Apps
   Script, que casi siempre estaba bien.

Los flujos comparan 1 contra 2 y se plantan si no coinciden. El 3 no lo puede
ver nadie desde aquí: se mira a mano. El 4 lo nombra el propio flujo: imprime
la cuenta y el proyecto antes de subir, y si falla lista los proyectos que esa
cuenta **sí** ve.

> **Para comprobar el 4 en un minuto:** abre
> `https://script.google.com/d/<SCRIPT_ID>/edit` con la cuenta de **esta**
> tienda y ninguna otra —una ventana de incógnito ayuda—. Si dice que no
> tienes acceso, el secreto apunta al maestro de otra.

## Y uno que solo aparece al rotar el token

`A3_rotarToken()` cambia el token de montaje. Hay que llevarlo a **TRES** sitios:
el secreto `MAESTRO_TOKEN`, **la pestaña `Tiendas` del panel** y el `tienda.json`
local. Si se olvida el del panel, el panel marca esa tienda como caída y le vacía
las métricas — y la tienda está perfecta.
