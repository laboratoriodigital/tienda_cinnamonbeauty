# Desplegar una tienda, de punta a punta

**Este documento es el mapa.** Dice todo lo que pasa desde que no existe nada
hasta que el comercio está vendiendo, en orden, y con quién hace cada cosa.

> **Pagos desde la 3.2.1.** El cierre vigente usa Bold y ya fue validado en
> sandbox en Orgánico. Este mapa conserva algunos pasos del cierre legado por
> transferencia para tiendas que todavía no migraron; al elegir
> `pago_modo=pasarela` y `pago_proveedor=bold`, manda el despliegue gradual y la matriz de
> [`PLAN-PAGOS-BOLD.md`](PLAN-PAGOS-BOLD.md).

> **Por qué existe, y por qué es el único.** Hasta la 3.0.0 había cuatro
> documentos más describiendo tramos de este mismo procedimiento —`RUNBOOK.md`,
> `DESPLIEGUE-CLIENTE.md`, `MONTAJE.md`, `INSTALAR.md`— y los cuatro se habían
> quedado atrás en distintos puntos: uno seguía enseñando fotos por Cloudinary
> en vez de Drive, otro decía que el catálogo se lee en vivo cuando hace tiempo
> se hornea, otro llamaba «Confirmado» a un estado que se renombró a «Pagado».
> Es el patrón 2 de la bitácora a escala de documentación: varias copias del
> mismo procedimiento, y siempre una se queda atrás sin que nadie lo note,
> porque un documento no se cae cuando miente. Se consolidó todo lo que seguía
> siendo cierto en este único archivo, y los cuatro se borraron.

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
   ├─ 11. flujo `montaje` ─────► la página de la semilla + lo de esta hoja
   ├─ 12. A1_generarStub() ───────────────────────────────► pegar en la hoja
   ├─ 13. fotos al Drive ─────────────────────────────────► «Publicar ahora»
   ├─ 14. Listas de pago en la hoja + llaves Bold propias
   ├─ 15. matriz sandbox + WhatsApp posterior al pago
   └─ 16. entrega
```

El orden **no es negociable** en tres sitios, y los tres cuestan una hora si se
invierten. Están marcados con ⚠ más abajo.

### La activación de Bold, por tienda

Después de publicar el maestro y antes de aceptar dinero real:

1. En la pestaña `Configuración`, elegir de las listas `pago_modo`,
   `pago_proveedor`, `pago_ambiente` y `pago_integracion`.
2. En Apps Script → Configuración del proyecto → Propiedades del script,
   crear solo las cuatro identidades/secretas descritas en `PAGOS-BOLD.md`.
3. Ejecutar `A0_instalar()` para asegurar `Pagos`, `Datos de entrega` y el
   conciliador de quince minutos.
4. En Orgánico, cortar el `release`. En cada repositorio cliente, incorporar
   esa versión y ejecutar `montaje` con **maestro** marcado y `PUBLICAR`. El
   flujo `release` se niega a correr fuera de la semilla.
5. Verificar que Cloudflare envía una CSP que permite
   `https://checkout.bold.co`; mirar la cabecera HTTP, no solo el `<meta>`.
6. Completar la matriz de sandbox. Solo entonces elegir
   `pago_ambiente=produccion` con las llaves reales de **esa** cuenta.

No se copian propiedades entre tiendas. GitHub y Cloudflare no reciben las
llaves Bold.

---

## Antes de la primera tienda de tu vida (no por tienda)

- Cuenta de GitHub con la organización, y la plantilla `organico`.
- `npm i -g @google/clasp` y `clasp login` — **con la cuenta dueña de la tienda
  que vas a montar**, no con la tuya.
- Habilitar la API de Apps Script una vez por cuenta:
  `script.google.com/home/usersettings`.
- El repositorio de servicio `laboratoriodigital/tiendas`, donde vive
  `ALTA_TOKEN`. **Ese secreto no se copia a ninguna otra parte.**

---

## 1 · El repositorio de la tienda  · GitHub · ~5 min

Desde la plantilla. Nombre `organico-<comercio>`. **Pública**: Actions es
gratis e ilimitado en repositorios públicos; en privados son 2.000 minutos al
mes para toda la cuenta, repartidos entre todas las tiendas.

> Hay un flujo que hace este paso solo, `servicio/tienda-nueva.yml`, y está
> aparcado a propósito — ver `ROADMAP.md`, 4.6. Con pocas tiendas, hacerlo a
> mano cuesta menos que mantenerlo.

Y **la casilla que se olvida siempre**: Settings → Actions → General →
*Allow GitHub Actions to create and approve pull requests*. Sin ella el flujo
`montaje` corre entero, funciona, y falla en la última línea al abrir el pull
request — GitHub lo dice en una anotación al pie de la corrida, que solo ve
quien sabe que está ahí. **Esto vale también para `organico`, el repositorio
semilla**, si algún día abre su propio pull request.

> **⚠ Editar `wrangler.jsonc` antes del primer despliegue.** En el editor web
> de GitHub (el lápiz), cambiar `"name": "organico"` por
> `"name": "organico-<comercio>"` y hacer commit directo a `main`. **Dos
> tiendas con el mismo `name` son el mismo sitio en Cloudflare, y la segunda
> pisa a la primera** — y nada avisa: las dos siguen desplegando en verde.

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

Comprueba con dos ventanas, no una:

- **En incógnito**, abrir `<URL>?a=version` → debe devolver
  `{"ok":true,"version":"..."}`. Esta detecta el fallo más común y más
  silencioso: el acceso quedado en «Solo yo». Con eso mal, la tienda igual
  carga —se cae al catálogo de respaldo que lleva dentro—, se ve perfecta y no
  registra un solo pedido.
- **En tu navegador normal**, abrir la misma URL una vez. Es el paso 6 de
  abajo: sin él el maestro no sabe su propia dirección.

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

`A0_instalar()` (paso 7) crea nueve pestañas, siempre las mismas: `Configuración
· Catálogo · Envíos · Cupones · Validaciones · Pedidos · Más vendidos · Tablero
· Errores`.

> **No insertar columnas en medio de ninguna pestaña.** El maestro lee por
> posición fija (`getRange(fila, columna, …)`), no por el nombre del
> encabezado: una columna metida en medio corre todas las de la derecha un
> puesto y nada avisa. Agregar columnas **al final** es seguro.

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
| Credenciales Bold | Propiedades del maestro de **esa** tienda | identidad y secreta de sandbox/producción; no pasan por GitHub, Cloudflare ni Sheets |
| La llave de transferencia legada (`pago_llave`) | La pestaña `Configuración` | solo para tiendas que aún no migraron a Bold; el filtro `pago_*` impide publicarla |

### Y una fila en el panel de administración  · ~2 min

El panel es **tu** hoja, la que no se comparte con ningún cliente. Sin la fila,
la tienda funciona igual — y desaparece de todo lo que te avisa: no sale en el
correo de las 7, no cuenta para «Tiendas sin responder», y su respaldo semanal
no se vigila. Una tienda que no está en el panel es una tienda que nadie mira.

Pestaña **`Tiendas`**, una fila. Es el **único sitio del panel que se llena a
mano**: todo lo demás lo escribe el script y se sobrescribe en cada
actualización.

| Columna | Qué va | De dónde sale |
|---|---|---|
| `Estado` | `En montaje` hasta la entrega, después `Activa` | — |
| `Comercio` | El nombre, igual que en la hoja | `Configuración > negocio` |
| `Contacto` · `Celular` · `Correo` | Con quién se habla en ese comercio | — |
| `Plan` · `Precio mensual` · `Día de cobro` | Lo comercial. `Cortesía` y `0` mientras no se cobre | — |
| `Alta` | La fecha de hoy | — |
| `Sitio` | La URL pública de la tienda | `Configuración > sitio_url` |
| `Servicio (URL /exec)` | La puerta del maestro | **Paso 9**, línea *Servicio* del diagnóstico |
| `Token` | El token de esa tienda | **Paso 9**, línea *Token* |
| `Cuenta Google` | El correo de la cuenta dueña de esa tienda | La que creaste en el paso 3 |
| `Repositorio` | `dueño/repositorio` | El del paso 1 |
| `Notas` | Lo que haya que recordar | — |

Después: menú del panel → **`actualizar()`**. Si la fila está bien, la tienda
aparece con sus métricas en un par de segundos. Si no responde, ahí se ve — y
es mejor verlo ahora que en el correo del lunes.

> **El token vive en TRES sitios**: los secretos del repositorio, las
> propiedades del maestro, y esta columna. Es el que se olvida al rotarlo, y el
> panel lo dice cuando pasa: la columna de estado avisa de que el token de la
> pestaña `Tiendas` se quedó con el viejo.

## 11 · El primer montaje  · Actions · objetivo 2–3 min

Actions → `montaje` → Run workflow, con cuatro campos. En un despliegue nuevo,
todos como vienen salvo dos:

| Campo | En este paso | Para qué está |
|---|---|---|
| `que` | `todo` — como viene | `solo-la-hoja` o `solo-las-fotos` sirven para una corrida parcial más adelante |
| `maestro` | **marcarlo** | Publica `maestro.gs` desde aquí. Pide los tres secretos de la sección anterior |
| `confirmar` | escribir `PUBLICAR` | Solo hace falta si marcaste `maestro`: es la confirmación de que sí |
| `aprobacion` | `automatica` — sin marcar lo contrario | El flujo fusiona solo cuando todo sale verde. `con-pull-request` deja el PR abierto para mirarlo antes |

Hace, en este orden:

```
publica el maestro
le escribe el <head>, las cinco constantes y la paleta de ESTA hoja
trae las fotos del Drive
hornea publicar/catalogo.json desde ESTA hoja
le escribe el catálogo de respaldo y CONFIG_SEMILLA desde ese catálogo
corre la guardia de publicación SOBRE LOS ARCHIVOS YA MODIFICADOS
abre el pull request
```

La suite completa ya corrió al entrar ese código a `main`. La guardia corta no
confía a ciegas en los archivos generados: carga el index y revisa catálogo,
fotos, respaldo, pagos, variantes y contratos del montaje. Corre cuatro
procesos dentro de un solo runner. La línea base y las metas medibles están en
`PLAN-RENDIMIENTO-ACTIONS.md`.

> **De dónde salió el `publicar/index.html` sobre el que escribe, y por qué
> nadie lo copia.** Del repositorio, que nació **a partir de la plantilla**: una
> tienda nueva se crea con el botón de plantilla de GitHub y viene con la página
> dentro. Lo que llega ahí es el archivo de Orgánico — y deja de serlo en este
> mismo paso, porque los cinco renglones de arriba lo reescriben con lo que diga
> la hoja de este comercio.
>
> De ahí la regla que no se puede olvidar: **nada de la tienda se escribe a mano
> en `publicar/index.html`.** Todo lo suyo lo pone el montaje. El día que
> alguien meta ahí un valor a mano, el siguiente montaje lo borra sin decir nada.
>
> Poner al día una tienda YA creada cuando cambia la plantilla es otro problema
> —el 4.18 del roadmap— y hoy es manual. Ver `ACTUALIZAR-UNA-TIENDA.md`.

Revisar la vista previa de Cloudflare y fusionar.

> **Alternativa: desde tu equipo, sin Actions.** `npm run tienda` escribe
> `tienda.json` y `montar/.clasp.json` preguntándole al maestro sus propios
> datos. `npm run montar` hace, en tu equipo, las mismas cuatro cosas que hace
> el flujo — `npm run index` (el `<head>` y las cinco constantes), `npm run
> catalogo` (hornea `publicar/catalogo.json`), `npm run fotos:drive` (baja y
> convierte las fotos) y `npm run respaldo` (el catálogo de respaldo, al
> final, porque lee del catálogo que acaba de hornear el paso anterior).
> `npm run maestro` publica el Apps Script. Ninguno de los cuatro hace commit:
> eso lo cierras tú con rama, `git commit`, `git push` y pull request.

> **La primera corrida después de publicar el maestro es LENTA, y es normal.**
> Apps Script queda «frío» al actualizar una implementación: la primera
> petición a la `/exec` puede tardar cuarenta segundos o más. Las herramientas
> ya lo aguantan —esperan 90 s y reintentan— y el log dice cuánto tardó cada
> llamada. Si ves `· «bloques» contestó en 38 s`, no está roto: está
> arrancando.

## 12 · ⚠ `A1_generarStub()` — y el orden importa

**En el editor del MAESTRO** (no en el de la hoja), seleccionar la función
`A1_generarStub` → Ejecutar. Genera el stub a partir del maestro que está
**PUBLICADO**, no del que está en el repositorio: hacerlo antes del paso 11
devuelve el stub viejo y parece que la versión nueva no trae nada.

En el **Registro de ejecución**, copiar el bloque completo bajo
`═══ PEGA ESTO EN LA HOJA ═══` → hoja del comercio → Extensiones → Apps
Script → pegar encima de todo → guardar.

> **Mirar el menú no comprueba nada.** Sigue teniendo las mismas opciones antes
> y después de pegar — eso se decidió en el **Sprint 5** y no cambia con cada
> stub. Lo que sí comprueba: si el botón **Guardar no se activa** al pegar, es
> que lo pegado era idéntico a lo que ya había — no es un fallo, ya estaba al
> día. Y `var NEGOCIO = '...';` debajo de `var MAESTRO` y `var TOKEN`, en el
> editor de la hoja, es la marca de que quedó el stub nuevo.

**Renombrar ese proyecto con el nombre del comercio.** Es el nombre que Google
le muestra al comerciante en la pantalla de permisos la primera vez que toca el
menú. Sale de `negocio` en Configuración en el momento de generar el stub: si
todavía no lo has puesto, el menú aparece como «Tienda» — vuelve a generar el
stub cuando lo pongas y pégalo otra vez.

**Abrir el menú de la hoja una vez.** Ese clic es lo que deja constancia de que
la hoja ya entra con el token del menú; sin él, el panel no distingue una hoja
migrada de una que nadie ha tocado.

## 13 · Las fotos

Carpeta en el Drive de la cuenta de la tienda, **compartida con el correo
personal del comerciante como editor** — así puede subir sus propias fotos
después sin pedirte nada. Su enlace va en `Configuración > fotos_drive`.

Aparte, comparte también `backup_tiendas` con **esta cuenta de la tienda**
como editor. Sin eso el respaldo semanal de la hoja falla en silencio: se ve
el domingo siguiente en Diagnóstico → *Último respaldo*.

Las fotos van con **el nombre exacto** que lleve la columna `Imágenes` del
catálogo, mayúsculas incluidas. Formatos: JPG, PNG, WebP.

Después, menú de la hoja → **Publicar ahora**.

> Si el flujo dice «nada nuevo» y tú acabas de subir fotos, el resumen del paso
> trae ahora **cuántas ve el maestro en la carpeta** y **cuáles nombra la hoja
> sin tenerlas**. Casi siempre es la carpeta equivocada o el nombre que no
> coincide.

## 14 · Pago — Bold vigente; transferencia como legado

Con `PAGO_PROVEEDOR=bold`, completa las propiedades y la matriz de
`PLAN-PAGOS-BOLD.md`. WhatsApp no entrega credenciales ni confirma dinero: el
cliente recibe un enlace prellenado **después** de `PAID` y decide enviarlo.

Lo que sigue aplica únicamente a una tienda que todavía usa el cierre legado:

**Es el único paso donde el diseño de seguridad se convierte en un agujero
funcional si se olvida.** La llave de pago no está en la página a propósito: el
comprador la recibe por el chat. Si el mensaje no está puesto, **termina el
pedido y no tiene cómo pagar**.

WhatsApp Business → Herramientas para la empresa → Mensaje de ausencia. El texto
sale de `pago_texto`, o se arma con `pago_llave`, `pago_titular` y
`pago_entidad`. Plantilla, si se escribe a mano:

    ¡Gracias por tu pedido! 🛍
    Lo estoy revisando y en un momento te confirmo disponibilidad y el
    total definitivo.

    Cuando te confirme el total, puedes transferir a:
    *Llave <LLAVE>* — <NOMBRE>

    Envíame el *comprobante* por aquí y con eso despacho.

    ⚠️ Solo confirmo datos de pago por este chat. Si ves una llave o una
    cuenta distinta en cualquier otro lado, no transfieras y escríbeme.

> La última línea no es decoración: es lo que hace inútil un sitio clonado,
> porque el cliente sabe que el pago siempre espera la confirmación por este
> chat.

## 15 · Las cuatro comprobaciones, antes de entregar

1. **Diagnóstico** (menú de la hoja). Punto 2: *«las 16 claves del alta están
   llenas»*. Punto 1: la versión del maestro coincide con la etiqueta.
2. **Panel**: la fila de este comercio, con **Sin terminar** en blanco y **Stub
   en la hoja** diciendo *al día*.
3. **Un pago de punta a punta, con un dispositivo que no sea el del comercio**:
   carrito → Bold sandbox → `PAID` → Pedidos → correos → WhatsApp manual → el
   stock baja. Comprobar referencia y transacción.
4. **Apagar el maestro un minuto y hacer un pedido.** Lo que no puede pasar es
   que el botón no haga nada. Que el pedido no quede en la hoja es recuperable
   —la tienda lo reenvía cuando el comprador vuelve—; que el botón no responda
   es una venta perdida.

## 16 · La entrega

- La **guía de una página** impresa (`docs/manuales/Guia-de-una-pagina.html`).
  Es corta a propósito: lo que no cabe ahí, se explica de viva voz.
- Compartir la hoja con el correo del comercio **como editor**.
- Enseñarle las tres cosas del día a día: cambiar un precio → **Publicar
  ahora**; pedido nuevo → **Pagado**; algo raro → **Diagnóstico**.

El menú de su hoja tiene siete opciones, y conviene nombrárselas todas una vez:

| | |
|---|---|
| **Publicar ahora** | manda a la tienda lo que cambió. La que más se usa |
| **Ver mi tienda** | la abre como la ve un comprador |
| **Actualizar tablero e inventario** | recalcula ya, sin esperar la hora |
| **Sincronizar variantes** | crea o actualiza las combinaciones definidas en `Catálogo.Variantes` |
| **Enviarme el resumen ahora** | manda el correo del día en el momento |
| **Diagnóstico** | revisa todo y dice qué está mal y dónde |
| **Ayuda** | las preguntas de siempre, contestadas |

> **Si explicar esto toma más de 30 minutos, el hallazgo es de diseño, no del
> comerciante. Anótalo.**

- [ ] **El domingo siguiente a la entrega:** Diagnóstico → *Último respaldo*.
      Si dice «nunca» o «falló», la cuenta de la tienda no tiene permiso sobre
      `backup_tiendas` (paso 13) o falta correr `A0_instalar()` con el maestro
      nuevo.

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

`release` se ejecuta solo después de que el push esté verde. Consulta el mismo
SHA y no repite la suite completa; si no encuentra ese verde, falla antes de
crear la etiqueta.

**Por qué `fotos` fusiona sola y `montaje` no.** `montaje` puede reescribir el
`<head>`, la política de seguridad y `SCRIPT_URL`: si la configuración de la
hoja quedó mal, la tienda se cae, y por eso hay una persona en el medio. Una
foto no puede hacer eso — lo peor que pasa es que se vea una foto fea, y se
corrige subiendo otra. El flujo `fotos` además **comprueba** que el cambio no
salga de `publicar/fotos/` antes de fusionar; si algo más cambió, no fusiona y
deja el pull request esperando.

**Por qué `maestro` no está programado y pide escribir `PUBLICAR` a mano.**
Los demás flujos dejan un pull request: nada llega al cliente sin que alguien
diga que sí. `maestro` no — cuando termina, el backend nuevo ya está
atendiendo pedidos, sin vista previa ni vuelta atrás de un clic. Y
`MAESTRO_TOKEN` solo lee configuración y fotos; `CLASPRC` es una credencial de
Google con permiso sobre el Apps Script y el Drive de esa cuenta — cuanto
menos viva guardada en un servidor, mejor.

---

## Fallos comunes

El montaje 3.6 añade un paso después del respaldo: **SEO, fichas y archivos de
descubrimiento**. No consulta Google otra vez; lee el `catalogo.json` recién
horneado. En una instalación correcta deben existir `/robots.txt`,
`/sitemap.xml` y una carpeta `/productos/<id>/` por producto activo. Esos
archivos son generados: no se editan a mano.

| Qué ves | Qué es | Cómo se arregla |
|---|---|---|
| La tienda carga pero sin productos, o el menú dice *contestó una página web* | La implementación quedó en «Solo yo» | Implementar → Gestionar → lápiz → Acceso: **Cualquier persona**. Comprobar con `<URL>?a=version` en incógnito |
| El menú dice *Unexpected token '<'* | Un maestro viejo, de antes de que el stub supiera explicarlo | Publica el maestro nuevo y vuelve a pegar el stub |
| El menú falla pero **la tienda funciona bien** | El stub quedó con una URL fabricada a partir de la `/dev` | Abre la `/exec` una vez en el navegador, ejecuta `A1_generarStub()` y pega el stub nuevo |
| `A1_generarStub()` imprime `TODAVÍA_NO_SE_SABE_LA_URL` | El maestro aún no ha atendido ninguna petición | Abre la `/exec` una vez en el navegador (paso 6) y vuelve a generarlo |
| `montaje` falla en «Las fotos nuevas» con *Falta fotos_drive* | La clave está vacía en la hoja | Pega el enlace de la carpeta en `Configuración > fotos_drive` |
| `montaje` falla con *no está en la carpeta* | La foto está en el Drive pero fuera de la carpeta configurada | Muévela dentro |
| `montaje` falla con *La foto pesa 20 MB* | El tope son 8 MB | Pídele al comercio una versión más liviana |
| Las dos últimas columnas de `Catálogo` no tienen nombre | La hoja conservó columnas físicas vacías y una instalación anterior solo contó su longitud | Publica el maestro 3.5.0 y ejecuta `A0_instalar()`: M1 queda `Umbral bajo` y N1 `Variantes` |
| Un producto sale con su dibujo en vez de su foto | La hoja nombra una foto que no está en el Drive | `npm run fotos:drive` (o el resumen del flujo) avisa por nombre; súbela o corrige la columna Imágenes |
| `fotos` corrió pero no fusionó | Cambió algo fuera de `publicar/fotos/` | Está bien: revisa el pull request que dejó abierto |
| El panel dice *403, se acabaron las 60 peticiones por hora* | Sin token, GitHub limita por IP y Apps Script comparte las suyas | Pon un token de grano fino con `Actions: read-only`. Sube a 5.000/hora |
| Las pruebas fallan con *La versión sigue en X* | Tocaste algo desplegable sin subir `version` en `package.json` | Súbela y vuelve a empujar |
| El panel dice **NO RESPONDE** y en Versión sale *Falta HOJA_ID* | El maestro publicado se quedó sin `HOJA_ID` — la tienda se ve bien porque cae a su catálogo de respaldo, pero no lee la hoja ni registra pedidos | Pegar el `HOJA_ID` en el editor del maestro y publicar versión nueva (o `npm run maestro` con esa cuenta) |
| El panel dice **FALLÓ** en Último respaldo | La cuenta de la tienda no tiene permiso sobre `backup_tiendas` | Paso 13 |

## Cuándo hay que reimplementar y cuándo no

Todo sale de una regla: **los disparadores corren el código guardado; la
aplicación web sirve el código implementado.**

| Lo que cambiaste | Pegar y guardar | `A0_instalar()` | Nueva **versión** de la implementación |
|---|---|---|---|
| Cualquier cosa del maestro | ✅ siempre | | |
| Pestañas, claves de Configuración, formatos, disparadores | ✅ | ✅ | |
| Algo que la tienda pide por `/exec` (catálogo, validar, registrar) | ✅ | | ✅ |
| Algo que use el **menú** de la hoja o el **panel** (`?a=panel`) | ✅ | | ✅ |

En la práctica, casi siempre toca reimplementar: hasta el menú de la hoja pasa
por `/exec`. La regla corta: *si algo fuera del editor lo va a usar,
reimplementa*. `npm run maestro` hace las dos cosas de una — sube el archivo y
publica la versión nueva sobre la misma implementación, nunca una nueva.

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
