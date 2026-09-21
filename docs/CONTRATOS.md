# El contrato de datos

**Documento normativo.** Lo que está aquí no se cambia con un commit: se cambia
con una decisión, y esa decisión tiene reglas. El resto de `/docs` explica cómo
se hacen las cosas; este archivo dice qué **no** se puede hacer.

---

## 1. Por qué un contrato, y por qué tan estricto

Este producto es **una tienda por comercio**: cada uno con su hoja, su cuenta de
Google y su copia del `index.html`. Eso, que es lo que lo hace barato, es
también lo que hace que un cambio de esquema no se parezca en nada al de un
sistema con una sola base de datos.

No hay una migración que se corra una vez. Hay N hojas que se actualizan cuando
su dueño abre el editor y pega el código nuevo —cosa que puede pasar hoy, en un
mes, o nunca—. Mientras tanto conviven versiones distintas del mismo esquema, y
las dos tienen que funcionar.

Y hay algo peor: **una hoja de cálculo no tiene errores de compilación.** Si una
columna cambia de nombre, nada se rompe con estrépito. La lectura devuelve
vacío, el producto sale sin precio, el pedido sale sin ciudad. Es el patrón 1 de
la bitácora otra vez: *el fallo que funciona es el caro*.

---

## 2. Las tres reglas

**R1 · Solo se agrega, y solo al final.** Una columna nueva va después de la
última. Nunca en medio, nunca al principio.

**R2 · Está prohibido renombrar y prohibido reordenar.** Ni una columna, ni una
clave de `Configuración`, ni un campo de los que salen por las puertas del
maestro. Un nombre publicado es un nombre para siempre; si de verdad estorba, se
agrega el nuevo al final y el viejo se queda respondiendo hasta que ninguna
tienda lo lea.

**R3 · Todo campo nuevo es opcional.** El código que lo lee tiene que funcionar
cuando no está, porque durante un tiempo **no va a estar** en la mayoría de las
hojas. Un campo nuevo obligatorio es una tienda rota que todavía no lo sabe.

> **La consecuencia práctica:** un cambio de esquema nunca es un paso. Primero
> sale la versión que acepta las dos formas; después se migran las hojas; y solo
> cuando ninguna queda atrás se retira el soporte de la vieja.

---

## 3. Quién lee qué

```
   Hoja del comercio          Maestro (standalone)        Vitrina (index.html)
   ─────────────────          ────────────────────        ────────────────────
   Catálogo        ──┐
   Variantes       ──┤
   Configuración   ──┤
   Envíos          ──┼──►  ?a=catalogo   ──────────────►  productos, envios, config
   Cupones         ──┘     ?a=validar    ◄──────────────  el carrito, a sellar
   Pedidos         ◄──     confirmación APPROVED         venta confirmada
   Reservas        ◄──     checkout / confirmación       evita sobreventa
   Pagos           ◄──     ?a=pago_crear  ◄───────────── carrito y entrega
   Pagos           ◄──     ?a=pago_estado ◄───────────── token opaco
   Datos de entrega ◄──
   Validaciones    ◄──
   Más vendidos    ◄──     ?a=identidad  ──────────────►  el montaje
   Tablero         ◄──     ?a=bloques    ──────────────►  el montaje
   Errores         ◄──     ?a=panel      ──────────────►  el panel de tiendas
```

La vitrina **nunca** escribe en la hoja, y la hoja **nunca** llama a la vitrina.
Todo pasa por las puertas del maestro, y por eso son ellas —no las pestañas— el
contrato que de verdad hay que cuidar: una tienda sin actualizar sigue leyendo
los nombres viejos desde un servidor nuevo.

---

## 4. Las trece pestañas

### `Catálogo`

Lo que el comercio vende. Es la única pestaña que el comerciante edita todos los días.


| # | Columna |
|---|---|
| 1 | `ID` |
| 2 | `Nombre` |
| 3 | `Formato` |
| 4 | `Categoría` |
| 5 | `Precio` |
| 6 | `Stock` |
| 7 | `Descripción` |
| 8 | `Imágenes` |
| 9 | `Destacado` |
| 10 | `Activo` |
| 11 | `Referencia` |
| 12 | `Precio antes` |
| 13 | `Umbral bajo` |
| 14 | `Variantes` |

`Variantes` usa el formato `Color: Azul|Verde; Talla: S|M|L`. El punto y coma
separa ejes y la barra separa valores.

`A0_instalar()` agrega columnas nuevas solo al final y repone un encabezado
vacío en su posición; nunca sobrescribe un título no vacío. Esto cubre hojas
que conservan columnas físicas/formato aunque M1 o N1 estén vacías.

### `Variantes`

Una fila por combinación vendible. `Precio` vacío hereda el precio del producto.

| # | Columna |
|---|---|
| 1 | `Variante ID` |
| 2 | `Producto ID` |
| 3 | `SKU` |
| 4 | `Opciones` |
| 5 | `Precio` |
| 6 | `Stock` |
| 7 | `Activo` |
| 8 | `Imágenes` |

`Imágenes` admite hasta seis nombres o URL separados por `|`. Vacío hereda
la galería del producto; no cambia la identidad ni el inventario del SKU.

### `Reservas`

Libro privado de unidades apartadas mientras el proveedor confirma el pago.

| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Pedido` |
| 3 | `Clave de inventario` |
| 4 | `Cantidad` |
| 5 | `Estado` |
| 6 | `Vence` |
| 7 | `Actualizado` |


### `Configuración`

Clave, valor y una explicación. Todo lo que distingue una tienda de otra vive aquí, no en el código.


| # | Columna |
|---|---|
| 1 | `Clave` |
| 2 | `Valor` |
| 3 | `Qué es` |


### `Envíos`

Las zonas de despacho y su costo. La página las lee para calcular el total.


| # | Columna |
|---|---|
| 1 | `ID` |
| 2 | `Nombre` |
| 3 | `Valor` |


### `Cupones`

Los descuentos. El maestro los valida; la página nunca decide un descuento sola.


| # | Columna |
|---|---|
| 1 | `Código` |
| 2 | `Tipo` |
| 3 | `Valor` |
| 4 | `Mínimo` |
| 5 | `Vence` |
| 6 | `Usos máximos` |
| 7 | `Usos confirmados` |
| 8 | `Activo` |
| 9 | `Notas` |


### `Validaciones`

El acta de cada pedido: qué sumó la página, qué sumó la hoja, en qué se diferencian y qué se le avisó al comprador.


| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Pedido` |
| 3 | `Cupón` |
| 4 | `Subtotal según la hoja` |
| 5 | `Subtotal según la página` |
| 6 | `Discrepancia` |
| 7 | `Descuento` |
| 8 | `Envío` |
| 9 | `Total según la hoja` |
| 10 | `Detalle` |
| 11 | `Avisos` |


### `Pedidos`

Una fila por línea de pedido, no por pedido. La columna Inventario la escribe el script.


| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Pedido` |
| 3 | `Validación` |
| 4 | `Estado` |
| 5 | `Ciudad` |
| 6 | `Cupón` |
| 7 | `Producto` |
| 8 | `ID` |
| 9 | `Cantidad` |
| 10 | `Precio unitario` |
| 11 | `Subtotal línea` |
| 12 | `Total del pedido` |
| 13 | `Inventario` |
| 14 | `Fecha de pago` |
| 15 | `Fecha de despacho` |
| 16 | `Guía` |
| 17 | `Proveedor de pago` |
| 18 | `Referencia de pago` |
| 19 | `Transacción de pago` |
| 20 | `Variante ID` |
| 21 | `SKU` |
| 22 | `Opciones` |


### `Pagos`

Libro mayor de los intentos de checkout. Lo escribe el script; contiene la
referencia, el tipo de medio (`BOLD_BUTTON` o QR cuando se active) y el estado
necesario para conciliar sin publicar esos datos.

| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Pedido` |
| 3 | `Proveedor` |
| 4 | `Referencia` |
| 5 | `Transacción` |
| 6 | `Estado` |
| 7 | `Total` |
| 8 | `Moneda` |
| 9 | `Items` |
| 10 | `Cupón` |
| 11 | `Envío` |
| 12 | `Subtotal` |
| 13 | `Descuento` |
| 14 | `Valor envío` |
| 15 | `QR` |
| 16 | `Vence` |
| 17 | `Token de consulta` |
| 18 | `Última consulta` |
| 19 | `Cliente notificado` |
| 20 | `Comercio notificado` |
| 21 | `Error` |


### `Datos de entrega`

Datos personales necesarios para preparar y entregar un pedido ya iniciado en
el checkout. Solo lo escribe el script y no sale por la puerta pública del
catálogo.

| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Pedido` |
| 3 | `Nombre` |
| 4 | `Celular` |
| 5 | `Correo` |
| 6 | `Ciudad` |
| 7 | `Dirección` |
| 8 | `Notas` |


### `Más vendidos`

Resumen que recalcula el disparador. Nadie escribe aquí a mano.


| # | Columna |
|---|---|
| 1 | `Producto` |
| 2 | `ID` |
| 3 | `Unidades vendidas` |
| 4 | `Ingresos` |
| 5 | `Pedidos en que aparece` |


### `Tablero`

Los indicadores que ve el comerciante al abrir la hoja. Se recalcula solo.


| # | Columna |
|---|---|
| 1 | `Indicador` |
| 2 | `Valor` |
| 3 | `Comparación` |


### `Errores`

Lo que llegó y no se pudo entender, y lo que se leyó mal. Existe para que un fallo deje rastro en vez de desaparecer.


| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Error` |
| 3 | `Primeros 200 caracteres recibidos` |

> **`Pedidos` merece una nota.** Es una fila **por línea de pedido**, no por
> pedido: cinco productos son cinco filas con el mismo número en `Pedido`. Y la
> última columna, `Inventario`, la escribe el script para saber si esa línea ya
> descontó stock. Confirmar dos veces, o deshacer, no puede descuadrar el
> inventario.

---

## 5. Las claves de `Configuración`

Son 43. Ninguna es opcional para el maestro —`instalar()` las crea todas—, pero
**todas pueden estar vacías**: una tienda a medio configurar tiene que seguir
sirviendo lo que sí sabe.

`instalar()` se puede volver a correr cuando se quiera. Agrega las claves que
falten al final y **no toca ningún valor escrito**. Por eso el orden importa
tanto como los nombres: la escritura ubica la fila por posición justamente para
no pisar lo que el comerciante puso.


| Grupo | Claves, en el orden en que están en la hoja |
|---|---|
| **La identidad del comercio** | `negocio` · `whatsapp` · `logo` · `favicon` |
| **La portada** | `portada_titulo` · `portada_texto` · `portada_puntos` |
| **Los colores** | `color_principal` · `color_secundario` · `color_alterno` |
| **Los textos** | `pie_descripcion` · `como_compras` · `legal_actualizado` · `horario` |
| **Los datos legales** | `empresa_razon` · `empresa_nit` · `empresa_correo` · `empresa_direccion` · `empresa_ciudad` · `empresa_tel` |
| **El sitio publicado** | `sitio_url` · `sitio_titulo` · `sitio_descripcion` |
| **El correo del resumen** | `correo_resumen` · `correo_hora` · `correo_siempre` · `correo_ultimo` |
| **Las fotos y el respaldo** | `fotos_origen` · `fotos_cdn` · `respaldo_carpeta` · `fotos_drive` · `fotos_webp` |
| **El pago — **no sale por ninguna puerta pública**** | `pago_llave` · `pago_titular` · `pago_entidad` · `pago_texto` · `pago_tope` |
| **La venta** | `envio_gratis_desde` |
| **Dónde vive el sitio** | `repositorio` — dueño/repositorio en GitHub. Lo usa «Publicar ahora». No es un secreto; el permiso sí, y ese vive en las propiedades del script |
| **Selección de cobro** | `pago_modo` · `pago_proveedor` · `pago_ambiente` · `pago_integracion` — listas al final del contrato; nunca contienen credenciales |
---

## 6. Lo que sale por cada puerta

Los nombres de primer nivel de cada respuesta. **Quitar uno rompe, desde el
servidor, una tienda que nadie tocó.**


**`?a=version`** — `ok`, `version`

**`?a=catalogo`** — `ok`, `productos`, `envios`, `config`, `ilegibles`, `version`, `esquema`, `generado`

**`?a=identidad`** — `ok`, `version`, `scriptId`, `hojaId`, `url`, `hojaOk`, `hoja`, `negocio`, `repositorio`

**`?a=bloques`** — `ok`, `version`, `head`, `valores`, `scriptId`, `negocio`, `hoja`, `hojaId`, `alta`

**`?a=panel`** — `ok`, `version`, `negocio`, `sitio`, `whatsapp`, `correo`, `hoja`, `productos`, `publicados`, `agotados`, `pocos`, `ventasMes`, `ventasMesAnterior`, `pedidosMes`, `ticket`, `tasaCierre`, `lecturasHoy`, `picoHora`, `cuotaCorreo`, `respaldo`, `ventasAyer`, `pedidosAyer`, `porConfirmar`, `atrasados`, `errores`, `meses`, `consultado`, `stub`, `tokenViejo`, `rescates`, `alta`

**`POST ?a=pago_crear`** recibe `items`, `cupon`, `envio`, `entrega` y `huella`.
La respuesta de Botón contiene `ok`, `pedido`, `token`, `total`, `moneda`,
`estado` y `checkout`. `checkout` lleva identidad pública y firma, nunca la
secreta.

**`?a=pago_estado&token=…`** devuelve `ok`, `pedido`, `estado`, `total`,
`moneda`, `vence`, `transaccion` y `error`. El token localiza el intento; no
permite escribir estado ni confirmar un pago.

Y dentro de `?a=catalogo`:

**cada producto** — `id`, `nombre`, `formato`, `categoria`, `precio`, `stock`, `descripcion`, `imagenes`, `destacado`, `activo`, `referencia`, `precioAntes`, `umbralBajo`

**cada envio** — `id`, `nombre`, `valor`

`config` trae las claves de la pestaña `Configuración`, con esos mismos
nombres, **menos las que empiezan por `pago_`**, que no salen nunca — ni por
esta puerta ni al hornear `catalogo.json`. Ese filtro está aplicado dos veces a
propósito y **no tiene excepciones**.

Más una clave que no viene de la hoja con ese nombre:

**`tope_pago`** — el tope por transferencia, ya leído como número, que en la
hoja se llama `pago_tope`. Sale con otro nombre justamente para no abrirle un
hueco al filtro: el tope no es una credencial —son 1.000 UVB, una cifra
pública— y el carrito lo necesita para bloquear a tiempo. Por `?a=catalogo`
llega como número y en `catalogo.json` como texto, porque el horneado pasa toda
la configuración por `String()`: **quien lo lea tiene que convertirlo.**

> **Un campo publicado que nadie consume es una promesa a medias.** `?a=validar`
> devuelve `envioNombre` —el nombre del envío **según la hoja**— y
> `publicar/index.html` no lo lee: escribe el nombre que ella tenía y el valor
> que trajo el sello. Cuando la hoja no reconoce el envío contesta `valor: 0` y
> `nombre: 'Por confirmar'` a propósito, y ese aviso se pierde. Sale como **S1-8**.
> Vale como regla: al agregar un campo, decir **quién lo lee**; si nadie, no se
> agrega.

---

## 7. Cómo se hace cumplir

No a mano. `pruebas/esquema.js` **lee el esquema vivo** —corriendo `instalar()`
en el emulador, que es el mismo código que corre en la hoja de verdad— y lo
compara contra la foto congelada en `pruebas/esquema.json`.

- Agregar al final: pasa, y la batería **anuncia** qué se agregó.
- Renombrar, mover o quitar: **falla**, con el antes y el después.
- Una pestaña que desaparece: falla.
- Y comprueba que **este documento** nombre las once pestañas, todas sus
  columnas y todas las claves. Si el código cambia y el documento no, no pasa.

Cuando un cambio de esquema es deliberado y cumple las reglas:

```bash
cd pruebas
node esquema.js --congelar
```

Reescribe la foto. **Es un acto deliberado**, y aparece en el diff del commit,
que es exactamente donde alguien tiene que verlo. Un esquema que se actualiza
solo no es un contrato.

---

## 8. La versión del esquema

Cada puerta publica ahora tres cosas más:

| Campo | Qué es |
|---|---|
| `version` | la versión del **código** del maestro |
| `esquema` | la versión de la **forma de los datos** |
| `generado` | cuándo se armó esa respuesta, en ISO |

**`version` y `esquema` se separan porque cambian por razones distintas y a
ritmos distintos.** Se puede publicar un maestro nuevo diez veces sin mover una
columna, y ese es el caso normal. `esquema` sube **solo** cuando cambia lo que
las puertas publican, y siempre agregando al final.

**La vitrina compara.** Si el `esquema` que llega es mayor que el que conoce, no
entiende lo que le están dando: **conserva lo último bueno y lo dice por
consola**, en vez de pintar una tienda a medias. Es el mismo principio de
siempre —preferir lo viejo que funciona a lo nuevo que no se entiende— pero
gritando, que es la parte que suele faltar.

`generado` contesta una pregunta que hasta hoy no se podía contestar: si lo que
estoy viendo es de hace un minuto o de hace una semana.

**Esquema actual: 1.**

---

## 9. Lo que la puerta pública NO publica

`?a=catalogo` **no pide token**, y no puede pedirlo: la abre cualquier comprador
al entrar a la tienda. Todo lo que salga por ahí es público, así que hay que
decidir a propósito qué sale.

**Las claves `pago_*` no salen.** Incluyen datos de transferencia y las cuatro
selecciones operativas de la hoja. La vitrina recibe solo dos derivados seguros:
`checkout_modo` y `checkout_proveedor`. Ambiente, integración y credenciales no
se publican ni se versionan.

El filtro es **por prefijo, no por lista**: una clave `pago_algo` que alguien
agregue mañana queda protegida sin que nadie tenga que acordarse de volver aquí.

Las credenciales Bold ni siquiera pertenecen a esta pestaña: viven en
Propiedades del script. La identidad puede viajar dentro del contrato
`checkout`; la secreta solo participa en la firma del lado servidor.

---

## 10. Lo que todavía no está

- Que la vitrina marque las tarjetas cuyo precio no es el del sello (**S1-9**).
- El diagnóstico a nueve puntos, con fila y columna exactas para cada dato
  ilegible. La mitad ya está hecha: los avisos **ya** nombran la celda
  (`Catálogo E2`, `Envíos C3`); falta juntarlos en una sola pantalla (Sprint 5).
- El webhook directo firmado. Mientras Apps Script no exponga la cabecera
  necesaria, la consulta autenticada y la conciliación son la fuente de verdad.

---

## 11. Contrato de los artefactos SEO

`montar/sembrar-seo.mjs` solo puede leer `publicar/catalogo.json` e
`index.html`. Produce, como una unidad, el bloque JSON-LD de portada,
`productos/<id>/index.html`, `sitemap.xml` y `robots.txt`.

- el sitemap contiene la portada y exactamente los productos activos;
- no lleva `lastmod`, fechas de ejecución ni secretos;
- precio, COP y disponibilidad salen de producto/SKU, nunca del navegador;
- un valor vacío o entre corchetes no puede entrar en Organization;
- una ficha retirada desaparece físicamente en la siguiente horneada;
- los utilitarios usan `noindex` por cabecera, no `Disallow`.

La batería `seo.js` congela esta forma. Cambiarla exige cambiar generador,
prueba y este contrato en el mismo commit.
