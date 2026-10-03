# Actualizar una tienda que ya está montada

## La 3.6.2: medición opcional desde la hoja

Actualiza `maestro.gs`, ejecuta `A0_instalar()` y publica una versión nueva de
la aplicación web. Al final de `Configuración` aparecen
`medicion_google_analytics` y `medicion_meta_pixel`; pega un ID GA4 que empiece
por `G-` y/o el ID numérico del Pixel de Meta. No son secretos, pero no copies
scripts, URLs ni claves. Déjalas vacías para no cargar medición. Por último usa
**Publicar ahora**: es el paso que hornea las etiquetas en el `<head>`.

## Cinnamon Beauty · paso de 3.0.0 a 3.6.2

Esta réplica conserva `publicar/catalogo.json`, las fotos, la imagen social,
el dominio, los colores, WhatsApp y la URL del Apps Script de Cinnamon. Durante
el trabajo entraron 85 commits automáticos; se integraron antes del push. El
catálogo remoto tenía 49 filas activas y tres zonas de envío; las fichas SEO
se regeneraron sobre esos datos, nunca sobre productos de otra tienda.

**Antes de vender:** en la pestaña `Catálogo` hay cinco filas con el mismo
`ID=MG188` (varios lip gloss y labiales). La vitrina y el pedido identifican
por ID, así que solo uno puede resolver correctamente. El titular debe decidir
cuál conserva `MG188` y asignar cuatro IDs únicos a las demás filas; después
**Publicar ahora** y comprobar las fichas y compras de cada una. Mientras
persistan IDs duplicados, el SEO publica una sola URL para `MG188` y no se
deben hacer compras reales de esos productos.

1. Subir este commit a `main` y esperar `pruebas` verde. No ejecutar `release`:
   ese flujo es solo para Orgánico y falla a propósito en una tienda cliente.
2. Ejecutar `montaje` en GitHub Actions de Cinnamon: `que=todo`, marcar
   `maestro`, escribir `PUBLICAR`, `aprobacion=automatica`. Comprobar que el
   despliegue conserva la URL existente de Apps Script y que el catálogo
   generado coincide con la hoja de Cinnamon.
3. En **el proyecto Apps Script de Cinnamon**, ejecutar `A0_instalar()` una
   vez; crea hojas/columnas nuevas, listas de pago y conciliador sin borrar el
   catálogo. Luego ejecutar `A1_generarStub()` y sustituir el stub en el Apps
   Script **vinculado a la hoja**, para que aparezca «Sincronizar variantes».
4. En **Configuración del proyecto → Propiedades del script** de Cinnamon,
   cargar las cuatro `BOLD_IDENTIDAD_*` y `BOLD_SECRETA_*` de Botón de pagos.
   Se pueden repetir valores de otra tienda **solo mientras el mismo titular
   Bold sea quien recibe el dinero**. Si luego cambia el titular, reemplazar
   aquí esas cuatro propiedades; las llaves secretas **no se escriben en la
   hoja** ni en Git.
5. En la pestaña **Configuración de la hoja de Cinnamon**, elegir de las listas
   `pago_modo=pasarela`, `pago_proveedor=bold`, `pago_ambiente=sandbox` y
   `pago_integracion=boton`. Si no se han puesto las llaves, seleccionar
   `pago_modo=whatsapp` hasta terminar la instalación. Pulsar **Publicar ahora**
   después de configurar y comprobar una compra sandbox de punta a punta.
6. Corregir los cuatro IDs duplicados `MG188` en `Catálogo` y volver a
   publicar. Revisar que las 49 fichas sean distintas y que cada producto
   agregue al carrito el artículo correcto.
7. Revisar con el titular los datos de contacto, condiciones de envío y
   textos legales propios de cosméticos antes de pasar a producción. Se
   eliminaron las referencias a tomates y finca heredadas de la semilla,
   pero esto no sustituye una revisión legal del comercio.

Los párrafos históricos más abajo describen cómo evolucionó la semilla; para
esta actualización concreta manda el orden anterior.

## La 3.6.0: SEO estático y locks versionados

No agrega columnas ni pide reinstalar la hoja. Después de llevar el código a la
tienda, el primer `montaje` genera `productos/`, `sitemap.xml` y `robots.txt` y
actualiza el JSON-LD del `index.html`. Publica esos archivos juntos; copiar solo
el index deja URLs anunciadas sin ficha. El maestro sí cambió su manejo de
fecha, por lo que se debe actualizar la implementación existente (nunca crear
otra URL). Los workflows usan `npm ci`: ambos `package-lock.json` tienen que
viajar en el commit.

## La 3.5.0: publicaciones más rápidas y encabezados reparables

Los flujos fijan cuatro procesos dentro de un solo runner, `release` reutiliza
el verde del mismo commit y `fotos`/`montaje` usan una guardia específica para
los archivos generados. No hay secretos nuevos.

Después de publicar `maestro.gs`, ejecuta **`A0_instalar()`** una vez. Además de
conservar datos, ahora repone encabezados vacíos aunque las columnas físicas ya
existieran. En `Catálogo`, la columna 13 es **`Umbral bajo`** y la última,
columna 14, es **`Variantes`**.

## La 3.4.0: imágenes por variante y cobro configurable

Actualiza `maestro.gs`, ejecuta `A0_instalar()` y publica una versión nueva de
la aplicación web. En `Configuración`, elige de las listas `pago_modo`,
`pago_proveedor`, `pago_ambiente` y `pago_integracion`. `Variantes` gana al
final `Imágenes`; escribe hasta seis nombres o URL separados por `|`, o déjala
vacía para heredar las fotos del producto. Después corre montaje y prueba el
cierre elegido. No borres las Propiedades Bold existentes.

## La 3.3.0: variantes por combinación

Primero se despliega y prueba en Orgánico. Ejecuta `A0_instalar()` para agregar
`Catálogo.Variantes`, las columnas finales de `Pedidos` y las pestañas
`Variantes` y `Reservas`. Después ejecuta `A1_generarStub()` y reemplaza el
stub, porque el menú suma **Sincronizar variantes**. Publica la vitrina y prueba
dos combinaciones del mismo producto en sandbox. Panadería va después de esa
aprobación y Cinnamon después de Panadería. Una tienda que deje
`Catálogo.Variantes` vacío conserva el comportamiento anterior.

## La 3.2.1: activar Bold requiere backend, propiedades y prueba

No es una actualización solo de archivos. En cada tienda:

1. Cortar `release` **una sola vez en Orgánico**. En el repositorio de la
   tienda, incorporar esa versión y ejecutar `montaje` con **maestro** +
   `PUBLICAR`; una tienda cliente no ejecuta `release`.
2. Ejecutar `A0_instalar()` para asegurar `Pagos`, `Datos de entrega`,
   `Variantes`, `Reservas`, las columnas finales nuevas y el conciliador.
3. Crear en Propiedades del script las siete claves descritas en
   `PAGOS-BOLD.md`, usando las credenciales propias de esa cuenta.
4. Mantener `BOLD_AMBIENTE=sandbox` hasta completar toda la matriz de
   `PLAN-PAGOS-BOLD.md`.
5. Revisar que la cabecera HTTP de Cloudflare permita
   `https://checkout.bold.co`. Un `<meta>` correcto no compensa una cabecera
   vieja: se aplican las dos y gana la más restrictiva.

En 3.2.1 Orgánico ya estaba aprobado y Panadería iba primero. La autorización
para actualizar Cinnamon llegó después; el paso de 3.0.0 a 3.6.1 sí requiere
renovar el stub porque el menú de variantes cambió en 3.3.0.

---

Cada tienda tiene su propio repositorio y su propio ritmo. Una versión nueva de
la plantilla **no le llega sola a nadie**: se pide.

Cómo saber qué versión tiene cada una: en el panel de tiendas, columna
**Versión**. Cómo saber cuál es la última: la etiqueta más nueva en
`laboratoriodigital/organico/releases`.

## Qué hay que tocar, según qué cambió

| Cambió | Qué hay que hacer en esa tienda |
|---|---|
| `publicar/index.html` | **Nada a mano.** Lo trae el flujo **montaje** de la última versión de la semilla, y le escribe encima lo de esa tienda. Pull request, fusionar |
| `maestro.gs` | Publicar el maestro: flujo **maestro**, o `npm run maestro`. **Nunca una implementación nueva** |
| El stub de la hoja | **En el editor del MAESTRO**, ejecutar `generarStub` y copiar lo que imprima el registro. Ver abajo |
| `panel.gs` | Solo en tu hoja de panel, no en la de ningún cliente |
| La pestaña Configuración | Volver a ejecutar `instalar()`: agrega las claves nuevas y **no toca ningún valor escrito** |
| Las columnas de una pestaña | Lo mismo: `instalar()` las agrega **al final**. Nunca renombra ni reordena — es R2 del contrato |
| `publicar/catalogo.json` | No se trae a mano: lo hornea el flujo **montaje** desde la hoja de esa tienda |

---

## Qué es una tienda nueva y qué es una tienda que se actualiza

No son el mismo problema y conviene no mezclarlos.

**Una tienda NUEVA no trae ni copia nada.** Se crea un repositorio **a partir
de esta plantilla** —el botón de GitHub, o el flujo *tienda nueva* de
`laboratoriodigital/tiendas`— y nace con todo dentro, `publicar/index.html`
incluido. Su primer `montaje` le escribe encima lo suyo: el `<head>`, las cinco
constantes, la paleta, el catálogo horneado y el catálogo de respaldo. Desde ese
momento es su tienda.

Lo que eso implica, y es la regla que manda hoy: **lo que esté bien en la
plantilla llega solo a todas las tiendas que se creen desde ella.** Y lo que
esté mal, también.

**Una tienda YA CREADA no se mueve sola**, y ponerla al día sigue siendo el
trabajo manual de la tabla de arriba. Automatizarlo es el **4.18** del roadmap,
y no está hecho: hace falta decidir antes cómo lee una tienda el repositorio de
la semilla —un secreto de organización, o hacer pública la semilla— y eso es una
decisión de negocio, no de código.

> Se intentó de un tirón en la 2.12.0 y se retiró en la 2.13.0: el flujo
> `montaje` bajaba la página de la última versión publicada. Funcionaba en el
> papel y falló en el primero real, porque las versiones de la semilla no son
> públicas. Lo caro no fue el código: fue que **resolvió un problema que esta
> etapa del proyecto no tiene** —hoy solo hay tiendas nuevas— y a cambio metió
> un camino más que se puede caer. Está anotado en la bitácora.

---

## Antes de nada: `git pull --rebase`

**El repositorio se escribe solo.** `montaje` y `fotos` hacen commits desde
GitHub —el `index.html` regenerado desde la hoja, el `catalogo.json` horneado,
las fotos convertidas— y esos commits **nunca pasaron por tu máquina**. Cuando
fusionas ese pull request, `origin/main` avanza y tu copia local se queda atrás
sin enterarse.

Entonces el `git push` siguiente falla así:

```
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not
hint: have locally.
```

No es un conflicto ni un error tuyo: es el flujo haciendo su trabajo. La
respuesta es siempre la misma:

```
git pull --rebase
```

Tus commits se vuelven a apoyar encima de lo que trajo el flujo. Casi nunca hay
conflicto, porque lo que escriben los flujos —`publicar/catalogo.json`,
`publicar/fotos/`, las constantes del `<head>`— es justo lo que no se toca a
mano.

> **La costumbre que ahorra el susto:** `git pull --rebase` **antes de empezar**
> a trabajar, no solo antes de empujar. Rebasar cuatro commits recién hechos es
> gratis; rebasar veinte, no.

---

## Lo que cambia en la 2.6.0: **hay que volver a pegar el stub**

Es la primera vez desde la 2.3.0, y la razón se ve a simple vista: **el menú
cambió**. Ahora tiene seis opciones y empieza por **Publicar ahora**; dos de las
viejas —«Generar configuración» y «Generar inventario»— ya no existen del otro
lado.

Sin pegar el stub nuevo, la hoja sigue mostrando el menú viejo y esas dos
opciones contestan «esa opción del menú no existe».

### El orden, que aquí no es un detalle

**`generarStub` genera el stub a partir del maestro QUE ESTÁ PUBLICADO**, no del
que está en el repositorio. Generarlo antes de publicar el maestro nuevo
devuelve el stub viejo — idéntico al que ya está pegado — y parece que la
versión nueva no trae nada. No trae nada **todavía**.

1. `git push`
2. Flujo **`release`**
3. Flujo **`montaje`** marcando `maestro` y escribiendo `PUBLICAR`
4. Fusionar el pull request
5. **Ahora sí**: `generarStub` en el editor del maestro → pegar en la hoja
6. Volver a ejecutar **`instalar()`**, que es lo que agrega la fila
   `repositorio` a la pestaña Configuración

**La comprobación no es ambigua**: el menú tiene seis opciones y la primera es
«Publicar ahora». Si sigue teniendo cinco, falta el paso 3 o el 5.

---

## Lo que cambia en la 2.6.2: **NO hay que volver a pegar el stub**

El menú no cambió: las mismas seis opciones, en el mismo orden. Lo que cambió es
lo que contesta **Diagnóstico**, y eso vive entero en el maestro.

1. `git push`
2. Flujo **`release`**
3. Flujo **`montaje`** marcando `maestro` y escribiendo `PUBLICAR`
4. Fusionar el pull request

Y ya. **La comprobación**: abre Diagnóstico. Si lo primero que ves es un
`── RESUMEN ──` con nueve puntos y un cuadro para copiar, llegó. Si sigue siendo
una lista de líneas dentro de una alerta, falta el paso 3.

> Si el menú sí llegara a cambiar en una versión futura, el stub hay que volver
> a pegarlo — y en ese orden, que es el de arriba. El propio `menuCuadra()` lo
> detecta: compara el menú del stub con el del maestro.

Además, para que ese botón funcione hacen falta dos cosas, una vez por tienda:

1. `Configuración > repositorio` = `dueño/repositorio` (ej. `laboratoriodigital/organico`)
2. Propiedades del script del maestro > `GITHUB_TOKEN` = un token **fine-grained**
   de ese repositorio, con **un solo** permiso: *Actions: Read and write*

> **UN TOKEN POR TIENDA, Y DE UN SOLO REPOSITORIO.** Es tentador reutilizar el
> token que ya existe para el panel o para el alta, que alcanza a varios
> repositorios. No se hace, y la razón es la misma que sostiene todo el
> producto: este token vive en el proyecto de Apps Script **del comerciante**,
> donde él entra cuando quiere y donde las propiedades del script **no están
> cifradas**. Un token de ocho repositorios ahí dentro es el llavero común que
> esta arquitectura existe para no tener: desde la hoja de una tienda se podrían
> disparar los flujos de las otras siete.
>
> Los permisos de más tampoco son gratis. *Pull requests* y *Commit statuses* en
> solo lectura no hacen daño hoy, pero el día que alguien mire ese token para
> saber qué puede hacer, la respuesta tiene que ser corta. *Metadata: Read-only*
> es obligatorio y no se puede quitar.

> Si falta cualquiera de las dos, el botón **explica qué falta** en vez de
> fallar. Se puede desplegar sin ellas y configurarlas después.

---

## Lo que cambia en la 2.4.0, y por qué importa el orden

Esta versión lleva los sprints 1 y 2 juntos. Dos cosas que no estaban antes:

**1. `instalar()` hay que volver a ejecutarlo.** Agrega seis columnas y siete
claves, todas al final y todas opcionales. Sin eso la tienda funciona igual —esa
es la gracia de R3— pero el comerciante no ve los campos nuevos.

**2. El montaje escribe un archivo nuevo: `publicar/catalogo.json`.** Desde esta
versión la vitrina lo lee a él en vez de preguntarle a Google en cada visita. Si
una tienda no corre el montaje, **no pasa nada malo**: la página no encuentra el
archivo y le pregunta al maestro, como siempre. Pero tampoco gana nada.

> **El orden importa y no es simétrico.** Si la página sale antes que el
> maestro, la tienda sigue vendiendo pero avisa que la hoja responde otra
> versión, no aplica cupones y marca los pedidos sin validar. Si el maestro sale
> antes que la página, no pasa nada. **Ante la duda, publica el maestro
> primero.**

Trae el archivo nuevo desde la última versión publicada:

```
https://github.com/laboratoriodigital/organico/releases/latest/download/index.html
https://github.com/laboratoriodigital/organico/releases/latest/download/maestro.gs
```

---

## v2.0.0 — la primera estable

Es un salto mayor porque **una tienda ya montada tiene que hacer algo**. Si no
lo hace, no se rompe: se queda como está.

**1. El menú de la hoja pasa a llamarse como el comercio.**
Antes decía "Orgánico" en todas las tiendas, que es el nombre de un comercio de
tomates y no el del producto. Ahora sale de `negocio` en la pestaña
Configuración.

- [ ] Publicar el maestro nuevo
- [ ] **Abrir el proyecto del MAESTRO** en `script.google.com` — no la hoja
- [ ] Seleccionar la función `generarStub` y **Ejecutar**
- [ ] En el **Registro de ejecución**, copiar todo el bloque que imprime, desde
      `/**` hasta la última llave. (`instalar()` también lo imprime al final,
      bajo `═══ PEGA ESTO EN LA HOJA ═══`; `generarStub` solo es más corto)
- [ ] Hoja → Extensiones → Apps Script → **Ctrl+A y borrar** → pegar → guardar
- [ ] Recargar la hoja

> **El stub NO sale del menú de la hoja.** «Generar configuración» produce los
> dos bloques del `index.html`, que es otra cosa. El stub solo lo imprime
> `generarStub` en el editor del maestro —e `instalar()` al final del suyo—, y
> por una razón: es el código que **dibuja** ese menú, así que no puede
> depender de que el menú funcione.

### No mires el menú para comprobarlo

**El menú no cambia.** Sigue teniendo las mismas cinco opciones, y el rótulo
pasó de la palabra `'Orgánico'` escrita a mano a la variable `NEGOCIO` — que en
la tienda que se llama Orgánico vale exactamente lo mismo. Es el mismo error de
comprobación que ya cometimos con la versión del Diagnóstico: **una prueba que
da igual antes y después no prueba nada.**

Lo que sí distingue el stub nuevo:

| Señal | Dónde | Qué significa |
|---|---|---|
| `var NEGOCIO = '…';` debajo de `var MAESTRO` y `var TOKEN` | En el editor de la **hoja** | Es el stub nuevo. Listo |
| El botón **Guardar** no se activa | Al pegar | Lo que pegaste es idéntico a lo que ya había: **ya estaba actualizado**. No es un fallo |
| `var NEGOCIO` no aparece en el registro de `generarStub` | En el editor del **maestro** | El maestro todavía tiene el código viejo. Vuelve a publicarlo |

El menú con opciones nuevas —*Publicar ahora*, *Ver mi tienda*, *Ayuda*— es del
**Sprint 5**. Todavía no existe.

**2. El nombre del comercio, donde el comprador lo lee.**
El consentimiento de datos decía *"Autorizo a Orgánico a usar mis datos"* en
todas las tiendas, y un encabezado de los textos legales igual. Ahora los dos
llevan el nombre de la tienda.

- [ ] Traer el `index.html` nuevo y desplegar

**3. La configuración de fábrica ya no lleva datos de nadie.**
`instalar()` sembraba el nombre, el sitio, la ciudad, el teléfono y el celular
de la primera tienda. El celular era el caso grave: un número de fábrica no
falla, **funciona**, y le manda los pedidos a quien no es. Ahora el celular
viene vacío y el resto entre corchetes, y el montaje se niega a escribir el
index con un valor sin llenar.

Una tienda ya configurada **no nota nada**: `instalar()` nunca pisa un valor
escrito. Compruébalo de todos modos:

- [ ] Pestaña Configuración: `whatsapp` es el celular del comercio
- [ ] `negocio` y `sitio_url` no están entre corchetes

**4. Lo que no hay que hacer.**

- [ ] **Nunca** crear una implementación nueva del maestro. Estrena URL y deja
      la tienda muda. Siempre: Implementar → Gestionar implementaciones → ✏ →
      Versión: Nueva

---

## Lo que cambia en la 2.7.0: **hay que volver a pegar el stub, y después rotar**

El menú no cambió. Lo que cambió es **qué token lleva el stub**: hasta ahora
llevaba el de montaje, que abre todas las puertas, y el comerciante lo lee en el
editor de su propia hoja.

Nada se apaga el día del despliegue: `?a=menu` sigue aceptando el token viejo a
propósito. Pero la migración **no está hecha hasta el paso 6**.

1. `git push`
2. Flujo **`release`**
3. Flujo **`montaje`** marcando `maestro` y escribiendo `PUBLICAR`
4. Fusionar el pull request
5. **`generarStub()`** en el editor del maestro → pegar en la hoja → **abrir el
   menú una vez** y usar cualquier opción. Ese clic es lo que deja constancia de
   que la hoja ya entra con el token nuevo.
6. **`rotarToken()`** en el editor del maestro. Imprime el token de montaje
   nuevo. Se niega a correr si la hoja entró con el viejo hace menos de una hora
   — eso significa que el paso 5 no se hizo o no se comprobó.
7. Con el token que imprimió el paso 6:
   - cambiar el secreto **`MAESTRO_TOKEN`** del repositorio de esa tienda;
   - cambiar el `tienda.json` local, si se usa.

**Entre el 6 y el 7 los flujos `montaje` y `fotos` fallan con 401.** Es
esperado: el maestro ya cambió el token y el repositorio todavía no. No lo dejes
a medias.

**La comprobación:** abre Diagnóstico. El punto 2 tiene que decir *«el stub usa
el token del menú, que solo abre el menú»* y el token de montaje **no** debe
aparecer por ninguna parte del informe. Para leerlo, `diagnosticoCompleto()` en
el editor.

> **Y el paso que no está en la lista:** si ese token estuvo en una captura, en
> un chat o en un correo, rotarlo es lo único que sirve. Volver a pegar el stub
> no lo invalida.

---

## La 2.7.2 no añade pasos: hace visible si te saltaste alguno

Mismos pasos que la 2.7.0 —esta versión sale junto con ella—. Lo que cambia es
que **el stub ahora dice de qué versión es** en cada petición, y el panel lo
muestra en una columna nueva, **Stub en la hoja**:

| Dice | Quiere decir |
|---|---|
| *sin abrir todavía* | Nadie ha tocado el menú desde que se instaló el maestro. No es que esté mal: no se sabe |
| **ANTIGUO — repegar** | El stub pegado ni declara su versión: es anterior a esto |
| *2026-09-09-4 — atrasado* | Declara una versión, pero no la del maestro |
| **al día** | Coincide |
| *… + token viejo* | Además sigue entrando con el token de montaje: **no terminó la migración**, y `rotarToken()` se va a negar |

Con una tienda esto se recuerda. Con ocho, no — y **una hoja con el stub viejo
no se queja**: sigue dibujando un menú que ya no existe hasta que el comerciante
toca una opción y le contestan que no existe.

> Después del paso 5, **abre el menú de la hoja una vez**. Ese clic es lo que
> hace que la columna deje de decir «sin abrir todavía». Sin él, el panel no
> puede distinguir una hoja migrada de una que nadie ha tocado.


---

## La 2.8.0 cambia los estados del pedido: hay que ejecutar `instalar()`

El vocabulario de la columna **Estado** pasa de tres a seis.

| Antes | Ahora |
|---|---|
| Por confirmar | **Nuevo** |
| — | **Pendiente de pago** |
| Confirmado | **Pagado** ← *el único que descuenta inventario* |
| — | **Despachado** |
| — | **Entregado** |
| Anulado | **Cancelado** |

1. `git push` → `release` → `montaje` con `maestro`+`PUBLICAR` → fusionar
2. **`instalar()`** en el editor del maestro. Migra las celdas viejas y deja
   la lista desplegable con los seis. Dice cuántas celdas cambió.
3. El stub **no** hay que repegarlo: el menú no cambió.

**Por qué el paso 2 no es opcional.** El backend sigue entendiendo los estados
viejos —una hoja sin migrar no se rompe— pero la lista desplegable de la columna
Estado **no admite otros valores**, así que sin migrar las filas históricas
quedarían marcadas como inválidas. `migrarEstados()` reescribe los tres viejos y
nada más: una celda con cualquier otra cosa se queda como está y sale en el
Diagnóstico.

**La comprobación:** abre la lista desplegable de la columna Estado. Tiene que
ofrecer seis opciones empezando por *Nuevo*. Y en el catálogo, cambiar un pedido
a **Pagado** es lo que baja el stock; *Despachado* y *Entregado* lo mantienen
abajo, no lo devuelven.

> **Y una cosa que sí conviene mirar:** el tope por transferencia sale ahora de
> `Configuración > pago_tope`. Son 1.000 UVB —$12.110.000 en 2026— y **se
> reindexa cada diciembre**. Si esa celda está vacía o en cero, el carrito no
> bloquea nada.

---

## La 2.8.1: nada que hacer a mano

Push → `release` → `montaje` con `maestro`+`PUBLICAR` → fusionar. Y ya: ni
`instalar()`, ni repegar el stub.

Lo que trae es que **un pedido que no llega a la hoja deja de perderse**: la
página lo guarda en el navegador del comprador y lo reenvía cuando la tienda
vuelve a abrirse. Ver `DECISIONES.md 04`.

**Dónde mirarlo, cuando pase:** Diagnóstico, punto 9 —*«Pedidos que llegaron
TARDE»*— y en el panel, columna **Rescatados**. Si esa columna está vacía en
todas las tiendas, no hay nada que hacer. Si aparece en una, fue la red; si
aparece en todas a la vez, el maestro estuvo caído.

> **Y una advertencia para leer el número.** Solo cuenta los pedidos que se
> pudieron recuperar. Si el comprador no vuelve a abrir la tienda, el suyo no
> aparece en ningún lado. **El número real de pedidos perdidos es mayor que el
> que sale.**

---

## La 2.9.0: **el montaje puede negarse a publicar**, y eso es nuevo

Push → `release` → `montaje` con `maestro`+`PUBLICAR` → fusionar. Ni
`instalar()`, ni repegar el stub.

**Pero léelo antes de correrlo.** Desde esta versión el montaje se niega a
escribir el `index.html` si a la tienda le falta algo que **rompe la venta**:

| Clave | Sin ella |
|---|---|
| `negocio` | la tienda se anuncia con un corchete |
| `whatsapp` | el pedido no llega a ninguna parte |
| `sitio_url` | no funcionan «Ver mi tienda» ni la comprobación de publicación |
| `pago_llave` | el comprador termina el pedido y **no tiene cómo pagar** |

Si falta alguna, el flujo falla **diciendo cuál y por qué**, y se arregla
llenando la celda en `Configuración`. No es un fallo del flujo: es el flujo
haciendo lo que no se hacía.

Las otras doce claves **avisan y no bloquean** — salen en el registro del
montaje y en el panel.

**La comprobación:** abre **Diagnóstico**. El punto 2 es nuevo y se llama
*«¿Está terminada esta tienda?»*. Si dice `OK las 16 claves del alta están
llenas`, la tienda está cerrada. Y en el panel, la columna **Sin terminar** tiene
que estar en blanco.

> Y una cosa más que cambió y se nota: **el pull request del bot ya dice qué
> trae** —«montaje: 4 archivo(s) de foto · el catálogo»— en vez de la misma
> frase siempre. Si el título vuelve a repetirse corrida tras corrida, algo se
> rompió en el flujo.

---

## La 2.9.1: cuatro arreglos de cosas que se vieron en producción

Push → `release` → `montaje` con `maestro`+`PUBLICAR` → fusionar. Ni
`instalar()`, ni repegar el stub.

**1. El flujo `fotos` decidía en silencio.** Se subieron dos fotos al Drive, se
publicó, y el resumen dijo «nada nuevo» sin más. La respuesta estaba en el log
—cuántas ve el maestro en la carpeta, y cuáles nombra la hoja sin tenerlas— pero
el resumen, que es lo único que se mira, no la traía. Ahora sale **siempre**, se
haya decidido bajar algo o no.

**2. `rotarToken()` decía DOS sitios y son TRES.** Faltaba **la pestaña
`Tiendas` del panel, columna Token**. Si se olvida, el panel marca esa tienda
como **NO RESPONDE** y le vacía la fila de métricas — y la tienda está perfecta.
Ahora el panel distingue las dos cosas y dice **TOKEN VIEJO** con el arreglo.

> **Si tu panel dice que una tienda no responde y la tienda funciona, es esto.**
> Pega el token nuevo en la pestaña `Tiendas`. Lo imprime
> `A2_diagnosticoCompleto()` en el maestro de esa tienda.

**3. Las funciones de ejecución manual, juntas.** Llevan prefijo y salen al
principio de la lista del editor, numeradas en el orden en que se necesitan:

```
A0_instalar              crear pestañas y disparadores
A1_generarStub           el código para pegar en la hoja
A2_diagnosticoCompleto   el informe CON el token de montaje
A3_rotarToken            jubilar el token de montaje
A4_respaldoAhora         copia de la hoja sin esperar al domingo
```

Los nombres de siempre siguen funcionando: son envoltorios de una línea.

**4. El mapa de despliegue**, de punta a punta: `docs/DESPLIEGUE.md`.
