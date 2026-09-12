# Runbook — desplegar una tienda desde el navegador

> **⚠ Este documento cubre un tramo, y está atrasado.** El mapa de punta a punta
> es **`docs/DESPLIEGUE.md`** y es el que manda. Lo de aquí sigue sirviendo para
> el detalle de su tramo, pero se escribió antes de la 2.6.0 y **no menciona
> «Publicar ahora»**, que es el botón que hace que un cambio de precio llegue a
> la tienda. Donde hable de «Confirmado», hoy se llama **Pagado**.


Para un técnico con un portátil básico: **navegador y nada más**. Sin Node, sin
git, sin clasp, sin clonar el repositorio. Lo que en `DESPLIEGUE-CLIENTE.md` son
órdenes de terminal, aquí lo corre **GitHub Actions**.

`DESPLIEGUE-CLIENTE.md` sigue siendo la referencia larga: explica por qué de
cada paso, tiene las capturas y la lista de fallos comunes. Esto es la ruta
corta, en el orden que menos tiempo pierde. Cuando algo no cuadre, ahí está el
detalle.

**Cronométralo y anota el total al final.** Es el dato con el que se le pone
precio al servicio.

---

## Lo que hace que esto sea rápido

Dos cosas mandan sobre el orden, y las dos se pagan caro si se hacen tarde:

1. **Las fotos tienen que estar en el Drive del comercio antes del bloque F.**
   Se hornean en el despliegue. Si llegan después, hay que repetir F y G.
2. **La pestaña Configuración tiene que estar llena antes del bloque F.**
   Nombre, WhatsApp, colores, textos y datos legales se hornean en el
   `index.html`. Todo se escribe en la hoja: ningún flujo lo pide por
   formulario.

El **catálogo no bloquea**: basta una fila con ID, Nombre y Activo = Sí. Precios
y stock se leen en vivo en cada visita, así que el comercio los puede llenar con
la tienda ya publicada.

---

## A. Una sola vez en la vida, no por tienda

- [ ] `laboratoriodigital/organico` → Settings → **Template repository** ✔
- [ ] Tener a mano tu **subdominio de Cloudflare** (el de la tienda que ya
      tienes: `https://organico.<subdominio>.workers.dev`)
- [ ] Que exista `administracion_tiendas / backup_tiendas` en el Drive de
      `laboratoriodigital.la@gmail.com`

---

## B. El repositorio  **[navegador · ~5 min]**

**Primero el repositorio, y solo después Cloudflare.** Cloudflare se conecta a
un repositorio que ya existe; al revés hay que volver sobre el mismo diálogo.

- [ ] `laboratoriodigital/organico` → **Use this template** → **Create a new
      repository** → `organico-<comercio>` · **pública**

> Actions es gratis e ilimitado en repositorios públicos. En privados son
> 2.000 minutos al mes para toda la cuenta, repartidos entre todas las tiendas.

- [ ] Editar `wrangler.jsonc` **en el editor web de GitHub** (el lápiz) y
      cambiar `"name": "organico"` por `"name": "organico-<comercio>"`
- [ ] Commit directo a `main`

> Este es el paso que en el equipo hacía `npm run tienda`, que compara el nombre
> con el del negocio y ofrece cambiarlo. Aquí no hay quien avise: **dos tiendas
> con el mismo `name` son el mismo sitio en Cloudflare, y la segunda pisa a la
> primera.** No te lo saltes.

- [ ] Settings → Actions → General → Workflow permissions →
      **Allow GitHub Actions to create and approve pull requests** ✔

> Sin esa casilla, `montaje` corre entero, funciona, y falla en la última línea
> al abrir el pull request. GitHub lo dice en una **anotación al pie** de la
> corrida —*«GitHub Actions is not permitted to create or approve pull
> requests»*—, que solo ve quien sabe que está ahí.
>
> **Y esto vale también para `organico`, el repositorio semilla.** Existía antes
> que este runbook, así que nunca pasó por él: la casilla estuvo sin marcar
> hasta el 9 de septiembre y costó tres corridas averiguarlo. Un runbook que
> solo describe tiendas nuevas deja fuera a la primera, que es donde se prueba
> todo.

La copia trae el `index.html` y las fotos de la tienda anterior. Es normal: el
bloque F los reemplaza enteros. **Hasta entonces, `main` tiene datos de otro
comercio** — por eso nadie recibe la URL antes del bloque G.

> Hay un flujo que hace todo esto solo, `servicio/tienda-nueva.yml`, y está
> aparcado a propósito: ver `ROADMAP.md`, 4.6. Con dos tiendas, hacerlo a mano
> cuesta menos que depurarlo.

---

## C. Cloudflare  **[navegador · ~3 min]**

- [ ] Workers & Pages → **Create** → **Connect to Git** → el repositorio nuevo
- [ ] Production branch `main` · Build command **vacío** · Deploy command
      `npx wrangler deploy` · Path `/`
- [ ] Esperar el primer despliegue y **copiar la URL**
      `https://organico-<comercio>.<subdominio>.workers.dev`

> Ese primer despliegue publica el contenido de la tienda anterior. No importa:
> nadie tiene la URL todavía y no hay dominio apuntando. Se hace ahora porque el
> bloque E necesita la URL escrita, y adivinarla es la clase de error que
> aparece tres días después en las fotos rotas.

---

## D. Google  **[navegador · ~20 min]**

Todo este bloque es irreducible: son las pantallas de Google. Ninguna consola
lo hace más rápido.

**D1. La cuenta**

- [ ] Cuenta de Google **nueva**, solo para esta tienda
- [ ] Contraseña al gestor · **tu** celular como recuperación · verificación en
      dos pasos

**D2. La hoja**

- [ ] Crear la hoja `<Comercio> — pedidos`
- [ ] Copiar el **HOJA_ID**: lo que va entre `/d/` y `/edit` en su URL

**D3. El maestro**

- [ ] `script.google.com` → Proyecto nuevo → nombrarlo `<Comercio> — maestro`
- [ ] Borrar `myFunction`. Abrir `maestro.gs` en GitHub → botón **Copy raw
      file** → pegarlo entero
- [ ] Poner el HOJA_ID en la única línea que se escribe a mano:
      `var HOJA_ID = '1AbC...XyZ';`
- [ ] Guardar

**D4. Publicar el maestro — una sola vez en la vida de la tienda**

- [ ] Implementar → **Nueva implementación** → ⚙ **Aplicación web**
- [ ] Ejecutar como **Yo** · Quién tiene acceso **Cualquier persona**
- [ ] Implementar → autorizar (Configuración avanzada → Ir a…)
- [ ] Copiar la URL. Termina en `/exec`
- [ ] **En incógnito**, abrir `<URL>?a=version` → devuelve
      `{"ok":true,"version":"..."}`
- [ ] **En tu navegador normal**, abrir la misma URL una vez

> Las dos comprobaciones hacen cosas distintas. La de incógnito descubre el
> error más común y más silencioso: el acceso quedado en "Solo yo". La tienda
> igual carga —se cae al inventario de respaldo que trae dentro—, se ve
> perfecta y no registra un solo pedido.
>
> La normal es la que le enseña al maestro su propia dirección: desde el editor
> Google le dice la `/dev`, que lleva otro identificador. Hasta que alguien abre
> la `/exec`, el `<head>` sale marcado como incompleto a propósito.

> **Y nunca vuelvas a crear una implementación nueva.** Cada una estrena URL y
> deja la tienda muda.

**D5. `instalar()` y el stub**

- [ ] Seleccionar la función `instalar` → **Ejecutar** → autorizar
- [ ] Registro de ejecución: dice `LISTO` y lista las pestañas
- [ ] Copiar lo que sale bajo `═══ PEGA ESTO EN LA HOJA ═══`
- [ ] Hoja → Extensiones → Apps Script → **borrar todo** → pegar → guardar
- [ ] **Renombrar ese proyecto con el nombre del comercio** ← es el nombre que
      Google le muestra al comerciante en la pantalla de permisos
- [ ] Recargar la hoja: aparece el menú **con el nombre del comercio** y cinco
      opciones

> El menú se llama como el comercio, no como el producto: sale de `negocio` en
> la pestaña Configuración en el momento de generar el stub. Si todavía no lo
> has puesto dice **Tienda**; cuando lo pongas, vuelve a generar el stub y
> pégalo otra vez.

**Y ya que estás en la hoja, los colores.** No hace falta esperar al bloque E:
apenas `instalar()` crea la pestaña Configuración se pueden **pintar las tres
celdas** de `color_principal`, `color_secundario` y `color_alterno`, y el código
de color sale solo.

- [ ] Los tres colores, pintando la celda

**D6. Drive**

- [ ] En el Drive de la cuenta de la tienda: carpeta `Fotos <Comercio>`,
      compartida con el correo personal del comerciante como **editor**
- [ ] `backup_tiendas` compartida con **esta** cuenta como **editor**
      ← sin esto el respaldo semanal falla
- [ ] **Que el comercio suba ya sus fotos**, con el nombre exacto que va a ir en
      la columna Imágenes

---

## E. Llenar la hoja  **[navegador · ~12 min]**

**Todo se escribe aquí, en la pestaña Configuración.** Es donde se ve entera, se
corrige sin disparar nada y el comercio la entiende. Ningún flujo la pide por
formulario.

Los tres que **bloquean** —y por qué vienen así de fábrica:

- [ ] `negocio` — viene `[NOMBRE DEL COMERCIO]`
- [ ] `whatsapp` — **viene vacío**: 57 + celular, sin `+` ni espacios
- [ ] `sitio_url` — la URL del bloque C

> Un celular de fábrica no falla: **funciona**, y le manda los pedidos al
> teléfono de otro. Por eso viene vacío. Si falta cualquiera de los tres, el
> montaje se niega a escribir el `index.html` y lo dice. Una tienda sin
> configurar tiene que verse sin configurar.

El resto de la pestaña:

- [ ] `fotos_origen` — `<sitio_url>/fotos`
- [ ] `fotos_webp` — **Sí**
- [ ] `fotos_drive` — el enlace de la carpeta de fotos (bloque D6)
- [ ] `respaldo_carpeta` — el enlace de `backup_tiendas` (bloque D6)
- [ ] `correo_resumen` — a quién llega el resumen diario
- [ ] `portada_titulo` · `portada_texto` · `portada_puntos`
- [ ] `pie_descripcion` · `como_compras`
- [ ] `sitio_titulo` · `sitio_descripcion` — lo que se ve en Google y en el
      enlace que se comparte por WhatsApp
- [ ] `empresa_razon` · `empresa_nit` · `empresa_correo` · `empresa_direccion` ·
      `empresa_ciudad` · `empresa_tel` ← **bloquean lo legal**. Entre corchetes
      significa "todavía no lo tengo", y no se muestra
- [ ] `legal_actualizado`
- [ ] Los tres colores, si no los pintaste ya en el bloque D5

Pestañas **Catálogo**, **Envíos**, **Cupones**:

- [ ] Al menos una fila de catálogo válida (ID, Nombre, Activo = Sí)
- [ ] En **Imágenes**, solo el nombre del archivo: `pan-1.jpg|pan-2.jpg`

> El resto del catálogo puede llegar después, incluso con la tienda publicada:
> precios y stock se leen en vivo en cada visita.

---

## F. Los dos secretos y el montaje  **[Actions · ~5 min de reloj]**

- [ ] Hoja → menú de la tienda → **Diagnóstico**. Bajo
      `── PARA EL PANEL DE TIENDAS ──` están **Servicio** y **Token**
- [ ] Repositorio → Settings → Secrets and variables → **Actions** →
      New repository secret:

| Secreto | Valor |
|---|---|
| `MAESTRO_URL` | la URL `/exec` (línea *Servicio*) |
| `MAESTRO_TOKEN` | el `tk-…` (línea *Token*) |

> Son los de **esta** tienda y de ninguna otra: cada tienda tiene su
> repositorio, así que no hay llavero común. Y lo que ese token permite está
> acotado: leer la configuración, listar la carpeta de fotos y bajar archivos de
> esa carpeta. No borra, no escribe en la hoja, no alcanza el resto del Drive.

- [ ] Actions → **montaje** → Run workflow, con los tres campos **como vienen**:

| Campo | Déjalo así | Para qué está |
|---|---|---|
| `que` | `todo` | `solo-la-hoja` o `solo-las-fotos` para una corrida parcial |
| `maestro` | **sin marcar** | Publicar `maestro.gs` desde aquí. Pide tres secretos más, que no se pueden sacar de un navegador |
| `confirmar` | vacío | Solo si marcaste `maestro`: hay que escribir `PUBLICAR` |

En un despliegue nuevo el maestro ya se pegó a mano en el bloque D3, así que
aquí no hay nada que publicar.

Un solo botón hace, en este orden:

```
1. maestro.gs      →  solo si lo pediste, y va PRIMERO
2. lee la hoja     →  escribe el <head> y las 5 constantes del index
3. lee el Drive    →  baja las fotos y las convierte (WebP 160/600/900 + JPG)
4. ¿cambió algo?   →  si no, termina sin abrir nada
5. corre TODAS las baterías SOBRE LOS ARCHIVOS YA MODIFICADOS
6. abre el pull request
```

> **El orden importa y por eso está fijo.** El paso 2 le pregunta al maestro
> cómo debe quedar el `<head>`, y una de las cinco constantes es la versión del
> contrato. Publicar el maestro *después* deja la tienda avisando que la hoja
> responde otra versión.

- [ ] Termina en verde y abre el pull request `montaje/desde-la-hoja`

**Si el resumen dice que faltan los secretos**, el flujo no falló: se saltó
entero. Ponlos y vuelve a dispararlo.

**Si fallan las pruebas**, el log dice cuál aserción y de qué batería —
`todas.sh` imprime las líneas `FALLA` debajo del marcador. Casi siempre es algo
que quedó mal en la pestaña Configuración.

---

## G. Publicar  **[navegador · ~5 min]**

- [ ] Abrir el pull request y mirar la **vista previa de Cloudflare** de esa
      rama: nombre, colores, fotos, textos legales
- [ ] **Squash and merge**
- [ ] Cloudflare despliega `main` solo. Abrir la URL de producción

> Ese pull request lo abrió Actions con el `GITHUB_TOKEN`, y lo que empuja ese
> token no dispara otros flujos: **no vas a ver la marca verde de `pruebas` en
> él**. No está fallando. Las baterías ya corrieron dentro de `montaje`, sobre
> estos mismos archivos, y vuelven a correr en el push a `main` al fusionar.

- [ ] La tienda carga con los datos del comercio y no con los de la anterior
- [ ] Las fotos se ven

---

## H. Cerrar  **[navegador · ~15 min]**

**WhatsApp Business** — bloquea la venta:

- [ ] Instalarlo en el celular del comercio
- [ ] Herramientas para la empresa → **Mensaje de ausencia** → activar
- [ ] Pegar el texto de la sección "Pagos" de `CONTEXTO.md`, con la llave real

> La llave de pago sale de la página a propósito y solo se entrega por el chat.
> Sin esto el comprador termina el pedido y no tiene cómo pagar.

**El panel de tiendas** — una fila en la pestaña `Tiendas`:

- [ ] Estado `En montaje` · Comercio · Contacto · Celular · Correo · Plan ·
      Precio · Día de cobro · Alta · Sitio · Cuenta de Google · Repositorio
- [ ] **Servicio** y **Token**: los mismos dos del bloque F
- [ ] Menú **Panel → Actualizar todas las tiendas** → la fila sale **En línea**

> Si sale `NO RESPONDE` con la tienda arriba, o `Falta HOJA_ID` en la columna
> Versión, el maestro publicado perdió su hoja. Repite D3 comprobando la línea
> `var HOJA_ID`.

**La prueba de punta a punta, con un teléfono de verdad:**

- [ ] Pedido completo → llega el WhatsApp con el número de pedido
- [ ] Llega la respuesta automática con la llave
- [ ] El pedido aparece en **Pedidos** como *Por confirmar*
- [ ] Cambiarlo a **Confirmado** → el stock baja solo
- [ ] Menú de la hoja → **Enviarme el resumen ahora** → llega el correo
- [ ] Un enlace por producto: `<sitio>/?p=<id>`
- [ ] **La prueba que casi nadie hace:** desactivar un minuto la implementación
      del maestro y hacer un pedido. El botón de WhatsApp **tiene que seguir
      funcionando**

**Entregar:**

- [ ] Estado en el panel → **Activa**
- [ ] Al comerciante: enlace de su tienda, de su hoja, de su carpeta de fotos, y
      el manual (`docs/manuales/`)
- [ ] Avisarle que la primera vez que toque el menú de su hoja, Google le va a
      decir *"Google no ha verificado esta aplicación"* → Configuración
      avanzada → Ir a `<Comercio>` → Permitir. Es normal y es una sola vez
- [ ] El domingo siguiente: Diagnóstico → `Último respaldo`

---

## Y desde aquí la tienda se mantiene sola

Ya no hay que correr nada:

| Flujo | Cuándo | Qué hace |
|---|---|---|
| `fotos` | cada 4 h y a demanda | si el comercio subió fotos, las publica y **fusiona solo** |
| `montaje` | lunes 6:00 y a demanda | maestro (opcional) → hoja → Drive → pruebas → pull request |
| `pruebas` | cada PR y cada push a `main` | todas las baterías |

`fotos` se fusiona solo y `montaje` no, y la diferencia no es de confianza: una
foto fea se arregla con otra foto, mientras que una configuración mala reescribe
el `<head>`, la política de seguridad y `SCRIPT_URL`, y tumba la tienda. Además
`fotos` **comprueba** que el cambio no tocó un solo archivo fuera de
`publicar/fotos/`; si lo tocó, no fusiona y deja el pull request esperando.

---

## Actualizar el maestro más adelante, sin equipo

Cuando salga una versión nueva de `maestro.gs`, hay dos caminos.

**Navegador** — el mismo del bloque D3, y el único que no pide nada instalado:

- [ ] `maestro.gs` en GitHub → **Copy raw file**
- [ ] Editor del maestro → seleccionar todo → pegar
- [ ] **Volver a poner el `HOJA_ID`**, que el archivo del repositorio trae vacío
- [ ] Guardar
- [ ] Implementar → **Gestionar implementaciones** → ✏ lápiz → Versión: **Nueva**
      → Implementar   ← nunca "Nueva implementación"
- [ ] Diagnóstico → *Versión del MAESTRO de esta tienda* dice la versión nueva

**Actions** — el mismo flujo `montaje`, marcando su casilla, si esta tienda
tiene puestos tres secretos más:

| Secreto | De dónde sale |
|---|---|
| `CLASPRC` | el contenido de `~/.clasprc.json` tras `clasp login` con la cuenta de esta tienda |
| `SCRIPT_ID` | la URL del proyecto del maestro, entre `/projects/` y `/edit` |
| `HOJA_ID` | la URL de la hoja, entre `/d/` y `/edit` |

`CLASPRC` es el único dato de todo el producto que **no sale de una pantalla de
Google**: hay que correr `clasp login` una vez, en algún sitio con Node. Ese
sitio **no tiene por qué ser tu equipo**: `clasp login --no-localhost` no abre
un servidor local, imprime una dirección, la autorizas en cualquier navegador y
pegas de vuelta el código. Sirve igual desde un terminal en el navegador —un
Codespace sobre este mismo repositorio, por ejemplo—.

Se hace **una vez por tienda** y después publicar el maestro es un botón. Por
eso no está en la ruta de despliegue: **una tienda se abre sin él**, pegando el
maestro en el editor como dice el bloque D3.

- [ ] Actions → **montaje** → Run workflow → marcar `maestro` **y** escribir
      `PUBLICAR` en `confirmar`

Publica el maestro y, a continuación y en el mismo botón, vuelve a escribir el
`index.html` con la versión nueva del contrato. Ese encadenamiento es la razón
de que sea un solo flujo: al revés, la tienda queda avisando que la hoja
responde una versión distinta a la que espera.

El flujo llama a la misma herramienta que corre en el equipo: repone el
`HOJA_ID` antes de subir, se niega a subir si no lo sabe, actualiza la
implementación existente sin estrenar URL, y al terminar pregunta `?a=bloques`
para comprobar que el maestro publicado **abre su hoja**. `?a=version` no sirve
para eso: contesta igual con la hoja perdida.

---

## Cuánto tardó

| Tienda | Fecha | Bloques B–G | Total con H | Qué costó más |
|---|---|---|---|---|
| Orgánico | 2026-09-06 | — | — | primera, sin runbook |
|  |  |  |  |  |
