# Contexto del proyecto

> El producto es una tienda en línea por comercio. **Orgánico** es la primera
> tienda montada con él —tomate y derivados—, no el nombre del producto: no
> aparece en el código, solo como ejemplo en esta documentación.

## En línea
https://tomateorganico.netlify.app

Se publica arrastrando la carpeta `publicar/` a Netlify. Esa carpeta
tiene SOLO los tres archivos que van al aire (index.html, _headers,
compartir.jpg) y existe para no arrastrar por error CONTEXTO.md, que
tiene la llave de pago.

Para actualizar: se copian los archivos a publicar/ y se arrastra esa
carpeta sobre la pestaña Deploys del sitio.

## Negocio
Venta de tomate fresco y procesados de tomate (salsas, conservas,
tomates secos, jugo). Finca propia, Rionegro, Antioquia.
Vendemos a todo Colombia. WhatsApp: 573008610480.

## Cómo funciona la tienda
Página estática de un solo archivo (index.html). No hay servidor,
no hay base de datos, no hay pasarela de pagos. El cliente arma el
carrito y el botón genera un mensaje pre-escrito que abre WhatsApp.
El cobro se acuerda por chat (Nequi, transferencia, contraentrega).
Se publica arrastrando la carpeta a Netlify.

## Reglas que no se deben romper
- Todo en un solo archivo. Sin frameworks, sin librerías externas,
  sin npm. HTML, CSS y JavaScript puro.
- Nada de localStorage ni sessionStorage.
- Paleta: rojo #D0211C, verde #1B5E3A, blanco, negro. Nada más.
- Estilo minimalista. El rojo solo en la portada y los precios.
  El verde solo cuando comunica algo (stock, WhatsApp), nunca decorativo.
- Tipografía: Archivo, una sola familia.
- Mobile-first. Probar siempre a 375px de ancho.
- Las tres leyendas del banner van UNA POR LÍNEA en móvil, con una
  línea fina entre ellas, y en fila solo desde 768px. Con flex-wrap se
  acomodaban solas y quedaban tres líneas a 375px, dos a 414px y una en
  escritorio: ese salto se veía descuidado.
- El botón flotante de WhatsApp va abajo a la izquierda y se oculta
  cuando el carrito está abierto. No debe tapar "Enviar pedido".
- Los textos en español de Colombia, tuteando al cliente.
- El mensaje de WhatsApp usa *negrilla* y _cursiva_, y siempre pasa
  por encodeURIComponent.

## Pagos — la llave NO va en la página
Decisión de seguridad, no de estilo. Todo lo que esté en index.html lo
puede copiar y editar cualquiera: clonar la tienda y cambiar la llave
toma diez segundos, y el cliente paga a otra cuenta sin notarlo.
Por eso el mensaje que arma la tienda ya no lleva datos de pago: dice
que los datos de pago se confirman por el chat.

La llave se entrega SOLO por WhatsApp, con la respuesta automática.

Llave: la que esté en `secretos.md` (ese archivo no se versiona).

### Respuesta automática de WhatsApp Business
WhatsApp Business > Herramientas para la empresa > Mensaje de ausencia
(o Respuesta rápida con atajo /pago). Texto sugerido:

    ¡Gracias por tu pedido! 🍅
    Lo estoy revisando y en un momento te confirmo disponibilidad y el
    total definitivo.

    Cuando te confirme el total, puedes transferir a:
    *Llave <LLAVE>* — <NOMBRE>

    Envíame el *comprobante* por aquí y con eso despacho.

    ⚠️ Solo confirmo datos de pago por este chat. Si ves una llave o una
    cuenta distinta en cualquier otro lado, no transfieras y escríbeme.

La última línea no es decoración: es lo que hace inútil un sitio clonado,
porque el cliente sabe que el pago siempre espera tu confirmación aquí.

## El inventario se mueve cuando TÚ confirmas
En la hoja Pedidos, cambia el Estado de "Por confirmar" a "Confirmado" y
el stock del catálogo baja solo. Si lo cambias a "Anulado" o lo devuelves
a "Por confirmar", el stock vuelve a subir.

La columna Inventario de cada línea dice si esa línea ya se descontó.
NO la edites a mano: es lo que hace que confirmar dos veces, o deshacer,
no descuadre nada.

No es automático desde la tienda a propósito. Un pedido que se abrió en
WhatsApp no es una venta: si descontáramos ahí, cualquiera podría dejarte
el inventario en cero abriendo pedidos que nunca paga.

Lo mismo con "Más vendidos": solo cuenta pedidos Confirmados. Si está
vacía es porque no has confirmado ninguno todavía. Se actualiza al
cambiar un Estado, y además cada hora.

Si algo se ve desfasado, en la hoja tienes el menú de la hoja >
Actualizar más vendidos e inventario**.

## Antes de despachar — revisa esto siempre
El total del mensaje lo calculó el navegador del cliente, y el cliente
puede editar el texto antes de enviarlo (wa.me solo rellena la caja de
escritura). El mensaje es lo que el cliente decidió escribirte, no un
documento. Entonces:

1. Verifica el total contra los precios del catálogo. Cantidad por
   precio, más el envío, menos el cupón. No despaches por el número
   que trae el mensaje.
2. Revisa que el cupón exista y esté vigente en la campaña actual.
3. Revisa que las cantidades no pasen del stock que tienes.
4. Si el cliente menciona una llave distinta a la tuya, está en un
   sitio falso: avísale, no le despaches y cuéntamelo para revisar.
5. En la hoja de pedidos, los pedidos entran como "Por confirmar".
   Cámbialo a "Confirmado" cuando cierres la venta: el reporte de más
   vendidos solo cuenta esos.

## Textos legales
Viven dentro de index.html, en el objeto LEGALES, y se abren como
ventana desde el pie y desde la casilla de consentimiento. No hay
páginas sueltas: la regla del archivo único se mantiene.
Los datos de la empresa están en la constante EMPRESA. Los valores
entre corchetes ([RAZÓN SOCIAL], [NIT], [CORREO DE CONTACTO],
[DIRECCIÓN]) hay que reemplazarlos antes de publicar.

## La tienda es genérica: la hoja la convierte en este negocio
index.html no sabe que vende tomates. Todo lo que identifica al negocio
—nombre, textos de portada, colores, logo, datos legales, leyendas del
banner, pasos de "Cómo compras"— vive en la pestaña **Configuración**.

Lo único que se queda en el archivo, porque TIENE que ser HTML estático,
es el <title>, la descripción y las etiquetas Open Graph: WhatsApp,
Facebook y Google leen la página sin ejecutar JavaScript. Ese bloque está
delimitado arriba del index entre las marcas CONFIGURACIÓN DE ESTA TIENDA,
y lo genera el script: menú de la hoja > Generar configuración para
index.html**, y se copia del Registro de ejecución.

Además hay cuatro líneas de respaldo en el <script>: SCRIPT_URL,
SCRIPT_VERSION, NEGOCIO y WHATSAPP. Las dos últimas solo se usan si la
hoja no contesta; si no existieran, una caída de Google dejaría la tienda
sin número de WhatsApp.

### Montar una tienda nueva
1. Copiar la hoja de cálculo (o crear una y pegar apps-script.gs)
2. Ejecutar instalar()
3. Llenar la pestaña Configuración
4. Menú de la hoja > Generar configuración para index.html
5. Pegar los dos bloques en index.html y poner la URL /exec
6. Publicar en Netlify

Sin tocar código. Si algún paso obliga a editar el motor, es un defecto.

## Cupones y precios: manda la hoja
Las hojas Catálogo, Envíos y Cupones del Apps Script son la fuente de
verdad. La tienda le pregunta cuánto vale el pedido y la hoja responde
con SUS precios, SU cupón y SU tarifa, más una referencia corta (R-4KQ9).

Esa referencia llega en el mensaje de WhatsApp. La buscas en la hoja
Validaciones y ahí ves el subtotal que calculó la hoja al lado del que
reportó la página. Si no coinciden, la columna Discrepancia lo marca:
o el cliente tocó los precios desde la consola, o la hoja Catálogo se
desincronizó de index.html. Las dos cosas te interesan.

Un mensaje SIN referencia es un pedido sin validar (la hoja no respondió).
Revísalo a mano antes de despachar.

### La hoja Catálogo ES la tienda
Columnas:

    ID | Nombre | Formato | Categoría | Precio | Stock | Descripción |
    Imágenes | Destacado | Activo

Para AGREGAR UN PRODUCTO llenas una fila. No hay que tocar index.html ni
volver a publicar en Netlify. Para quitarlo, Activo = No. Para empujarlo,
Destacado = Sí: sale primero en la rejilla y con una insignia verde.

index.html solo aporta un catálogo de respaldo, por si Google no contesta,
y la figura del marcador que se dibuja mientras un producto no tenga fotos.

### Paginación
La rejilla pagina de a 25, y el cliente puede pasar a 50 o 100. Los
controles solo aparecen cuando hay más de 25 productos: con el catálogo
de hoy no se ven. Al filtrar o buscar vuelve a la página 1, y al cambiar
el tamaño conserva el producto que estabas viendo.

### Los marcadores SVG y las fotos reales
Mientras un producto no tenga fotos, la tienda le DIBUJA una: un tomate,
un frasco, una botella o una bolsa, en rojo y verde, generado por la
función marcador() como SVG dentro del propio archivo. No es una imagen
que se descargue: pesa nada y siempre carga.

Están para que la tienda se vea completa antes de tener fotógrafo, no
para quedarse. Un catálogo entero de marcadores se ve como una maqueta.

Reemplazarlos YA NO ES UNA TAREA DE CÓDIGO. Es llenar la columna
Imágenes de la hoja. En cuanto un producto tiene al menos una URL, su
marcador desaparece y salen las fotos. Es producto por producto: puedes
tener tres con fotos y cinco con marcador sin que nada se rompa.

Cómo hacerlo:
1. Sube las fotos a Cloudinary (plan gratuito).
2. Copia la URL de cada una.
3. Pégalas todas en la celda Imágenes del producto, separadas por |
4. Guarda. La tienda las toma en el siguiente refresco.

NO hace falta comprimirlas antes en squoosh ni tinypng, como decía el
documento de consultoría: f_auto y q_auto lo hacen solos y mejor, porque
adaptan el formato a cada navegador. Sube la foto buena.
Tampoco hace falta recortarlas cuadradas: c_fill,ar_1:1 lo hace.

Lo que sí importa, y ninguna transformación arregla:
- La PRIMERA foto es la que vende. Las demás resuelven dudas.
- Mismo encuadre y misma distancia en la primera foto de TODOS los
  productos. Una rejilla con encuadres distintos se ve amateur.
- Fondo neutro y luz pareja.
- De 3 a 5 por producto. El máximo son 6.

Un producto nuevo creado desde la hoja sin fotos sale con el marcador de
tomate, porque la figura vive en index.html y la hoja no la conoce. Es
una razón más para crear el producto ya con sus fotos.

### Las fotos: todas en una celda
En la columna Imágenes van todas las fotos del producto separadas por
barra vertical, sin espacios:

    https://res.cloudinary.com/tu-cuenta/image/upload/v1/chonto-1.jpg|https://res.cloudinary.com/tu-cuenta/image/upload/v1/chonto-2.jpg

Pega la URL tal como te la da Cloudinary. La tienda le inyecta sola las
transformaciones según dónde vaya a mostrar la foto:

    f_auto      WebP o AVIF al navegador que los soporte, JPG al que no
    q_auto      compresión ajustada foto por foto
    c_fill      recorta en vez de deformar
    ar_1:1      cuadrada, para que la rejilla no se descuadre
    w_600 / w_900 / w_160   rejilla, ficha y miniaturas

Entre f_auto y q_auto una foto suele bajar entre 40% y 70%. Es lo que
decide si la tienda carga o no con datos móviles.

Si pegas una URL que YA trae tus transformaciones, no se toca.
Máximo 6 fotos por producto; el documento de consultoría recomienda 3 a 5.

IMPORTANTE: si algún día cambias Cloudinary por otro alojamiento, hay que
agregar ese dominio a img-src en DOS sitios: el <meta> de index.html y el
archivo _headers. Si no, las fotos no cargan y no hay error visible.

Por qué importaba: antes había dos listas de precios y, si se separaban,
el carrito dejaba de cuadrar delante del cliente. Las líneas decían
7 x $8.900 y el subtotal decía $66.500, o un producto se caía del total
sin explicación. Eso ya no puede pasar.

Y hay una red de seguridad por si los precios cambian con la página
abierta: si el subtotal del sello no coincide con el que suman las líneas
del carrito, no se muestra "Pedido validado" ni se aplica el descuento.
El cliente ve su cuenta coherente, sin descuento, y el mensaje sale
marcado sin validar para que lo revises. Un carrito que no suma es peor
que un carrito sin descuento.

### El interruptor
- SCRIPT_URL vacía  -> modo local: manda la lista CUPONES de index.html.
- SCRIPT_URL puesta -> mandan las hojas. Vacía la lista CUPONES.

Hoy está vacía. Apenas despliegues el script, pega la URL y borra los
tres cupones del archivo.

### Las claves nuevas aparecen solas
Cuando el script gana una opción nueva (como las cuatro del correo),
volver a ejecutar `instalar()` se la agrega a la pestaña Configuración con
su valor por defecto y su explicación, SIN tocar lo que ya tenías escrito
y sin duplicar nada. Antes, quien ya tenía la hoja instalada nunca veía
una opción nueva.

### Qué puedes manejar sin republicar el sitio
- Columna Activo: apagar un cupón al instante.
- Columna Usos máximos: 0 es sin tope; N lo apaga tras N ventas
  CONFIRMADAS. El conteo lo actualiza recalcularResumen() cada hora, así
  que puede ir hasta una hora atrasado. Para un tope de 5 o 10 no importa;
  para uno de 1 no lo uso.
- Precios, stock y tarifas de envío: columnas de Catálogo y Envíos.

## Generar la configuración del index

Menú de la hoja > Generar configuración para index.html**: abre una
ventana con los dos bloques listos para copiar, cada uno con su botón.
Antes esto solo se imprimía en el Registro de ejecución del editor de
Apps Script, o sea que desde el menú de la hoja no pasaba nada visible.

Lo que sale de ahí es SOLO lo que tiene que ser HTML fijo: el `<title>`,
la descripción y las etiquetas Open Graph, más las cuatro constantes del
script (versión, nombre y WhatsApp de respaldo). Todo lo demás —precios,
productos, textos, colores, envíos, cupones— sale de la hoja en caliente
y no necesita republicar nada.

Los valores que el dueño escriba en la hoja se escapan antes de pintarlos
en la ventana, así que una etiqueta HTML escrita en una celda no puede
romperla ni ejecutar nada.

## El correo diario: lo único que se te acerca a ti

El tablero hay que ir a mirarlo. La pestaña Errores no la mira nadie
nunca. El correo es lo único que va hacia el dueño en vez de esperarlo.

**Se maneja entero desde la pestaña Configuración.** No hay que tocar el
código ni volver a publicar nada:

    correo_resumen    tu@correo.com          ← escribe esto y empieza a llegar
    correo_hora       7                      ← de 0 a 23
    correo_siempre    No                     ← No = solo cuando hay algo
    correo_ultimo     (lo escribe el script; no lo edites)

Puedes poner varios correos separados por coma. Para dejar de recibirlo,
borra correo_resumen. Para probar sin esperar a mañana: menú de la hoja >
**Enviarme el resumen ahora**.

**Por qué se revisa cada hora y no hay un disparador a las 7**
Porque la hora vive en la hoja. Con un disparador fijo, cambiar la hora
obligaría a volver al editor de Apps Script — y eso rompe la promesa de
que la hoja manda. Así, cambias el número y mañana llega a esa hora. De
paso se cura solo: si Google se saltó la revisión de las 7, la de las 8
lo manda igual. Y sale UNO al día, porque correo_ultimo guarda la fecha.

**Qué trae, en ese orden**
1. **Para hacer hoy** — los pedidos por confirmar, uno por uno: número,
   ciudad, valor y cuánto llevan esperando. Los de más de 24 horas en
   rojo. Esta sección es la razón de ser del correo; lo demás es contexto.
2. **Ayer** — cuánto entró y cuántos pedidos llegaron.
3. **Este mes** — ventas, ticket promedio y el mes anterior completo.
4. **Embudo del mes** — en una línea.
5. **Inventario** — agotados y con pocas unidades, POR NOMBRE.
6. **Errores** — solo si los hay.

El asunto se lee sin abrir el correo:
`<Comercio> · 2 pedidos esperan hace más de un día · $165.100 ayer`

**Si no hay nada, no molesta.** Con correo_siempre en No, solo llega
cuando hubo ventas ayer, hay pedidos pendientes, hay agotados o hay
errores. Un correo diario que dice "nada que reportar" se deja de leer a
la semana, y entonces el día que sí importa tampoco se lee. Si prefieres
recibirlo siempre, pon Sí.

**El adjunto del primer correo de cada mes**
Lleva el mes anterior de Pedidos en CSV, con BOM para que Excel abra bien
los acentos. Es el respaldo que reemplazó al respaldo automático: el
historial de versiones de Sheets cubre el accidente (borraste filas,
pegaste encima); esto cubre lo que el historial no cubre, que es perder
la cuenta de Google.

**Cuesta 1 de los 100 correos diarios** que regala Apps Script. Si algún
día falla —sin cuota, o Google de mal humor— queda anotado en la pestaña
Errores y ni el inventario ni el tablero se caen con él.

## Enlace por producto: tienda.com/?p=chonto

Un negocio que vive de WhatsApp e Instagram no manda "mira mi tienda":
manda UN producto. Con `?p=` en la dirección, la tienda abre esa ficha
sola. El id es el de la columna ID del Catálogo.

**Cómo se usa**
- Abrir cualquier producto ya deja el enlace en la barra del navegador.
- Dentro de la ficha hay un botón **Compartir este producto**. En celular
  abre el menú de compartir del sistema (WhatsApp, Instagram, correo). En
  computador copia el enlace al portapapeles y lo avisa.

**Lo que se tuvo en cuenta**
- El catálogo de la hoja llega DESPUÉS. El enlace queda pendiente y se
  resuelve cuando aterriza; mientras tanto abre con el catálogo del
  archivo, y si la hoja trae otro precio la ficha se corrige sola.
- Si el producto ya no existe o lo apagaste con Activo = No, avisa "Ese
  producto ya no está en la tienda" y limpia la dirección. No se queda en
  silencio ni sigue circulando un enlace roto.
- **Atrás en el celular cierra la ficha**, no saca de la tienda.
- Basura en el parámetro no rompe ni inyecta nada: si el id no está en el
  catálogo, no hay ficha.

**Lo que NO hace, y por qué**
La vista previa de WhatsApp sigue siendo la de la tienda, no la del
producto. Los rastreadores no ejecutan JavaScript: leen el HTML y ahí
solo está la portada. Arreglarlo pediría una página por producto y un
paso de construcción — se sale de la premisa de un solo archivo. El
enlace sí abre el producto correcto al tocarlo, que es lo que importa.

## El código ya no vive en la hoja

`apps-script.gs` es el **maestro** y va en un proyecto INDEPENDIENTE
(script.google.com > Proyecto nuevo), en nuestra cuenta. Un script pegado
dentro de la hoja se lee entero desde Extensiones > Apps Script: compartirle
la hoja al cliente era entregarle el sistema.

**Un maestro por cliente.** Cada tienda tiene su copia, con su `HOJA_ID` y su
`TOKEN` arriba del archivo. Son las dos únicas líneas que cambian. Así las
cuotas de Google (30 ejecuciones simultáneas, 90 min/día de disparadores, 100
correos) son de esa tienda y una tienda muy activa no afecta a las demás.
Cómo llegar a "un ajuste y se aplica a todos" está en el ROADMAP.

**Lo que se pierde al salir, y cómo se recupera.** Un disparador instalable
corre bajo NUESTRA cuenta, y un menú dibujado así no le aparece al cliente. Un
`onOpen` simple sí, pero tiene que estar dentro de la hoja. De ahí `stub.gs`:

    ┌ Hoja del cliente ──────────────┐
    │ stub.gs · 46 líneas · sin      │   onOpen dibuja el menú
    │ una sola regla de negocio      │   cada opción -> pedir(id)
    └────────────┬───────────────────┘
                 │ HTTPS  ?a=menu&f=<id>&t=<token>
    ┌────────────▼───────────────────┐
    │ Maestro (standalone, oculto)   │   lista blanca ACCIONES_MENU
    │ toda la lógica, una sola copia │   devuelve {tipo:html|aviso}
    └────────────────────────────────┘

El stub no lee ni escribe una celda: pide, y muestra lo que vuelva. El token
es visible para el cliente a propósito: solo le deja hacer en SU hoja lo que
el menú ya le deja hacer. La lista blanca es lo que impide que con esa URL se
llame a cualquier función del maestro.

`elLibro()` reemplazó a `getActiveSpreadsheet()`: abre la hoja por su ID. Es
todo el cambio estructural; el resto del maestro quedó igual.

**Ojo con Apps Script:** no tiene el constructor `URL` del navegador. Los
hosts se sacan con regex (`hostDe`). Es la clase de detalle que solo se
descubre en producción.

## Fotos en tres capas

El objetivo: cambiar de proveedor de imágenes no puede significar reescribir
cientos de URL en las hojas de todos los clientes.

    Capa 1  MAESTRO         Los originales pesados, en el Drive del cliente.
                            No se sirven. Es el archivo del que todo deriva.
    Capa 2  ORIGEN          publicar/fotos/chonto-1.jpg — se despliega con el
                            sitio. Esto es lo que se sirve.
    Capa 3  TRANSFORMACIÓN  ImageKit, Cloudinary o NINGUNO, apuntando a la
                            capa 2. Nunca se sube nada al proveedor: se le
                            dice de dónde leer.

**En la hoja se escribe solo el nombre:** `chonto-1.jpg|chonto-2.jpg`

**Dos claves en Configuración:**

    fotos_origen   https://tomateorganico.netlify.app/fotos
                   Vacío = la carpeta /fotos del propio sitio.
    fotos_cdn      Vacío = se sirven directo, sin proveedor.
                   ImageKit:   https://ik.imagekit.io/cuenta/{ruta}?tr=w-{ancho},q-auto,f-auto
                   Cloudinary: https://res.cloudinary.com/cuenta/image/fetch/f_auto,q_auto,c_fill,ar_1:1,w_{ancho}/{origen}/{ruta}

Marcadores: `{origen}`, `{ruta}`, `{ancho}`. Cambiar de proveedor, o dejar de
usar uno, es cambiar UNA celda.

**El modo de fallo, que es lo que importa.** La CSP de la página es HTML fijo
y lista los hosts de imagen permitidos. Si la hoja apunta a un proveedor que
no está en esa lista, el navegador bloquearía las fotos EN SILENCIO. Por eso
la tienda comprueba el host contra `FOTOS_HOSTS` y, si no coincide, **sirve
directo del origen** —que siempre está permitido— y avisa por consola con el
paso exacto para arreglarlo. Nunca hay fotos en blanco.

La CSP y `FOTOS_HOSTS` ahora salen del bloque generado: cambias el proveedor
en la hoja, generas la configuración, pegas y republicas.

**Compatibilidad:** una URL completa en la columna Imágenes se respeta tal
cual. Las tiendas viejas siguen andando mientras se migran, una por una.

## La hoja se maneja sin escribir

**Listas desplegables** donde una errata rompe algo: el Estado de un pedido,
Destacado y Activo del catálogo, el Tipo de cupón, correo_siempre. Un
"confirmado" en minúscula dejaba de mover el inventario; ahora no se puede
escribir mal. La Categoría sugiere las que ya existen pero deja escribir una
nueva, porque el negocio crece.

**Los colores se pintan.** Tres claves: color_principal, color_secundario y
color_alterno. Se puede pintar la celda del valor con el balde de Google y
`sincronizarColores()` escribe el hexadecimal solo. Al revés también: si se
escribe el código, `alEditar` pinta la celda. Cuál gana se decide por cuál
cambió, así que las dos direcciones no se pelean. El tercer color mueve la
etiqueta de "Destacado" (`--acento` en el CSS).

**presentarHojas()** corre al instalar y desde el menú: encabezados con el
color de la marca, filas y columnas fijas, anchos, moneda y fechas con
formato. Es idempotente.

## Los dos bloques que genera el Apps Script

De index.html ya no se edita nada a mano salvo `SCRIPT_URL`.

- **Generar configuración para index.html** — el bloque del `<head>` (título,
  Open Graph, canonical, favicon, theme-color) y las cuatro constantes del
  `<script>`.
- **Generar inventario para index.html** — `const ENVIOS` y `const PRODUCTOS`:
  el catálogo de respaldo con precios y stock del momento, en JavaScript
  válido, entre las marcas CATÁLOGO DE RESPALDO. Es el paracaídas para cuando
  Google no responda; no es obligatorio, pero conviene refrescarlo.

La lista `CUPONES` desapareció del archivo: los cupones solo existen en la
hoja y solo la hoja los valida. Un paso manual menos al desplegar.

## Hasta dónde llega — medido, no estimado

`limites.js` siembra catálogos de distinto tamaño y cronometra.

    50 productos ->  11 KB de catálogo, tienda lista en 0,36 s
   300 productos ->  59 KB
 1.000 productos -> 195 KB (con descripciones cortas; con las reales, el doble)

El tiempo de pintado no crece porque la paginación mantiene 25 tarjetas en
pantalla. Lo que crece es el JSON, y ese viaja por datos móviles.

- Productos: 300 cómodo, 500 el tope práctico.
- Concurrencia: ~25 personas validando a la vez (30 ejecuciones simultáneas
  de Apps Script; ver la tienda casi no consume, por la caché de 60 s).
- Visitas: ~25.000 nuevas al mes. El techo lo pone CLOUDINARY (25 créditos ≈
  25 GB), no Netlify ni Google.
- Pedidos: 20.000 filas = 6.000 a 10.000 pedidos.
- Punto de quiebre razonable: ~30 pedidos al día, o necesitar cobro en línea.

Los topes de Netlify y Cloudinary cambian: verificar al montar cada tienda.

## Los manuales

Carpeta `manuales/`. NO se publican: son para entregarle al cliente.

- **Guía de una página** — `GUIA-COMERCIANTE.md`, y `Guia-de-una-pagina.html`
  para imprimir. Es la que se entrega y se explica; el manual es para después.
  Cabe en una hoja **a propósito**: si explicar la tienda toma más de 30
  minutos, el hallazgo es de diseño, no del comerciante.
- **Manual del dueño** — 12 páginas, sin una palabra técnica. El día a día:
  qué hacer cuando llega un pedido, cómo cambiar precios y fotos, cómo leer
  el tablero, qué NO tocar, y seis síntomas con su solución.
- **Manual técnico** — 14 páginas. Arquitectura, contrato tienda–hoja,
  modelo de datos, idempotencia, seguridad, cuotas, despliegue, replicación
  para otro cliente en ~1 hora, pruebas, decisiones y límites.

Cada uno va en HTML (un solo archivo, sin dependencias) y en PDF. Se
regeneran con Chromium desde el HTML. Si cambia algo del sistema, hay que
tocarlos: son la transferencia de conocimiento cuando se vende el servicio.

## La hoja Tablero: las respuestas, no los datos

Pedidos y Validaciones son datos crudos. Nadie que venda lee filas: lee
respuestas. La pestaña **Tablero** las calcula sola y no se toca a mano —
se reescribe entera en cada recálculo, así que lo que escribas ahí se
pierde.

**Cuándo se actualiza**
- Cada hora, con el disparador de recalcularResumen().
- En el acto, cada vez que cambias un Estado en Pedidos.
- Cuando quieras: menú de la hoja > Actualizar tablero e inventario.

Desde el rediseño son cuatro columnas, sin cuadrícula, con bandas por
sección y **gráficos de barras dibujados con bloques** (█). No se usan
fórmulas SPARKLINE a propósito: las fórmulas de Sheets cambian de separador
según el idioma de la hoja y se rompen al copiarla a otro idioma.

**Qué trae, y por qué ese y no otro**

*VENTAS* — ventas confirmadas, pedidos confirmados y ticket promedio,
este mes contra **el mes pasado hasta el mismo día**. Comparar cuatro días
contra un mes completo siempre pinta mal y no dice nada; la columna de
comparación y el porcentaje hablan del mismo número, que es la forma más
fácil de que un tablero mienta sin querer. El mes anterior completo queda
como fila de contexto. Solo cuenta lo Confirmado: un pedido abierto en
WhatsApp no es una venta.

*VENTAS MES A MES* — seis meses en barras. De un vistazo se ve la
tendencia; el mes en curso va en el color principal y los cerrados en el
secundario.

*EMBUDO* — es lo más valioso y casi nadie que vende por WhatsApp lo
tiene:

    Carritos armados        (filas de Validaciones)
      ↓  % que llegan a enviar
    Pedidos enviados        (filas de Pedidos)
      ↓  % que cierran
    Ventas confirmadas      (Estado = Confirmado)

Si baja el primer porcentaje, el problema está en la página: el precio,
el envío o el formulario. Si baja el segundo, está en la conversación de
WhatsApp: demoras en responder, o el pago. Son dos problemas distintos y
se arreglan distinto. Sale gratis de datos que ya se guardaban.

*PARA ATENDER HOY* — pedidos por confirmar, cuántos llevan más de 24
horas, y errores registrados. La hoja Errores no la mira nadie nunca; acá
sí se ve.

*INVENTARIO* — agotados, con 5 unidades o menos, y sin vender en 30 días
(con los nombres, no solo el número).

*LO QUE MÁS SE VENDE* y *DÓNDE COMPRAN*, últimos 30 días, top 5. Solo
ventas confirmadas. "Dónde compran" cuenta pedidos, no líneas.

**Detalles que importan**
- El total del pedido se repite en cada línea; el tablero agrupa por
  número de pedido para no sumarlo dos veces.
- Un pedido Anulado no cuenta como venta ni como pendiente.
- Con la hoja recién instalada muestra ceros y "Todavía no hay ventas
  confirmadas", no errores ni casillas en blanco.
- No cambia el contrato entre la tienda y la hoja, así que **no obliga a
  republicar Netlify**. VERSION se queda igual: esa versión describe lo
  que la tienda consume, y la tienda no consume el tablero.

### El código de verificación: uno solo, no dos
Antes había dos números: el del pedido (lo ponía la tienda) y una
referencia de validación aleatoria (la ponía la hoja). Se unificaron en
uno: el número del pedido ES la referencia.

Se hizo porque la referencia aleatoria era la causa de las filas
repetidas en Validaciones: cada petición inventaba una nueva y no había
cómo agrupar. Con un número estable, la hoja actualiza SU fila.

La verificación no se perdió, cambió de dónde viene la prueba. Ya no es
"la hoja inventó este número"; es "existe una fila en MI hoja, escrita
por MI script, con estos totales". Un mensaje con un número que no está
en Validaciones es un mensaje falso. Y uno cuyos totales no coincidan
con los de la fila, también.

Como el número ahora lo elige la tienda, una fila de Validaciones queda
CONGELADA en cuanto el pedido se registra en Pedidos: después de enviado
nadie puede reescribirla, ni adivinando el número.

### El error de fondo: código nuevo, versión vieja publicada
Apps Script separa "el código que ves en el editor" de "el código que
sirve la URL". Pegar el archivo no basta; hay que crear una VERSIÓN NUEVA
de la implementación. Si no, el editor muestra lo nuevo y la URL entrega
lo viejo: todo parece bien y nada funciona.

Ahora el script tiene una constante VERSION y la tienda tiene
SCRIPT_VERSION. Si no coinciden, la tienda deja de verificar los pedidos
—salen todos marcados, cosa que se nota— y avisa en la consola qué hacer.
Para comprobarlo a mano: abre tu URL con ?a=version al final.

Cada vez que cambies apps-script.gs hay que subir la constante VERSION en
los dos archivos.

### Por qué la hoja Pedidos se quedaba vacía
El registro iba por POST con navigator.sendBeacon. Apps Script responde a
los POST con una redirección, y el navegador convierte esa redirección en
GET sin parámetros: la petición llegaba, no escribía nada, y no daba
error. Vacío y en silencio, que es lo peor.

Ahora va por GET (?a=registrar), el mismo camino que ya usaban el catálogo
y la validación, que sí funcionaban. Los precios no viajan: los pone la
hoja.

### Por qué se repetía la fila en Validaciones
Dos causas sumadas. La hoja escribía una fila por cada estado del carrito,
así que agregar tres unidades de a una dejaba tres filas. Y cuando dos
peticiones idénticas llegaban a la vez —normal con los reintentos de
móvil— ambas se creían la primera y escribían filas distintas.

Ahora hay UNA fila por pedido, que se actualiza. La referencia es el
número del pedido, que lo fija la tienda y no cambia, y un candado
serializa el buscar-y-escribir. Un solo identificador para todo: el que
llega en el mensaje de WhatsApp sirve para buscar tanto en Validaciones
como en Pedidos.

### Por qué llegaban pedidos repetidos
El número de pedido se generaba DENTRO del envío, así que cada toque del
botón era un pedido distinto para la hoja. Y en móvil tocar dos veces es
lo normal: WhatsApp tarda un instante en abrir y parece que no pasó nada.

Dos cambios lo cierran:
- El número se genera una vez por carrito y no cambia hasta que el
  carrito se vacía. El segundo toque reusa el mismo número y el registro
  lo ignora.
- El botón dejó de ser un window.open y pasó a ser un enlace de verdad
  (<a href>). Un enlace no lo bloquea el navegador y abre al instante;
  window.open en móvil a veces se bloquea o tarda, que era lo que
  provocaba el segundo toque.
- Y el Apps Script descarta un código de pedido que ya haya registrado,
  por si el navegador reenvía el aviso.

### En móvil la red se cae, y eso se contempla
La primera versión esperaba 8 segundos y se rendía al primer tropiezo.
En computador nunca falló; en celular fallaba seguido y había que volver
a darle Aplicar. Tres causas se juntaban: Apps Script arranca lento la
primera vez que lo llamas en un rato, la antena cambia, y el navegador
suspende peticiones al volver de segundo plano.

Ahora espera 15 segundos y reintenta dos veces en silencio antes de
avisar (TOPE_ESPERA y REINTENTOS, arriba en el archivo). El cliente no
se entera de una caída aislada. Lo mismo aplica al catálogo: si la
primera carga falla, reintenta antes de caer al respaldo del archivo.

Y el botón de Enviar YA NO se bloquea mientras valida. Bloquearlo sonaba
prudente, pero con reintentos puede tardar medio minuto en una conexión
mala, y dejar a un cliente mirando un botón gris es peor que recibir un
pedido sin sello: ese llega marcado y tú lo revisas.

### Si Google no responde
No se aplica ningún descuento y el cliente ve "envía el pedido y te lo
aplicamos por WhatsApp". Es a propósito: si aplicáramos el cupón sin
validar, cualquiera lo conseguiría cortando la conexión. El pedido sí se
puede enviar, marcado como no validado.

## Conciliación con la consultoría inicial
Se revisó el documento de consultoría contra el código. Está todo lo que
prometía, salvo lo que sigue en "Qué falta por hacer". Diferencias que
conviene recordar:

- Los cupones SÍ se pudieron proteger. El documento decía que era
  imposible sin servidor; el Apps Script hace de servidor y los códigos
  viven en la hoja, no en el código fuente.
- El stock en vivo NO se hace publicando la hoja como CSV, como proponía
  el documento, porque eso deja la hoja pública. Se hace por Apps Script.
- Google Analytics 4 se descartó por ahora. La hoja de pedidos ya da el
  ranking, el ticket promedio y la tasa de cierre; GA4 agregaría el
  embudo pero mete un tercero que rastrea a los visitantes y obligaría a
  declararlo en la política de datos.
- El mensaje de WhatsApp se recorta solo si la URL pasara de 2.000
  caracteres. Orden de sacrificio: primero las notas, después el detalle
  de productos, y por último la fecha y la frase de cierre. Los totales,
  la referencia de validación y los datos de entrega no se recortan nunca.
  Un pedido normal va en ~1.500 caracteres.

## Seguridad ya aplicada
- Catálogo, cupones y tarifas congelados (Object.freeze). Cambiarlos
  desde la consola del navegador ya no funciona.
- sanear() devuelve carrito, cupón y envío a un estado válido antes de
  pintar y antes de armar el mensaje. Las cantidades se topan al stock.
- La llave salió del archivo (ver arriba).
- Precios, cupones y envíos validados contra las hojas, con referencia
  de validación en el mensaje y detección de discrepancia.
- Una sola lista de precios: la tienda carga el catálogo de la hoja, y
  si el sello no cuadra con lo que se ve, no se aplica descuento.
- Apps Script: neutraliza fórmulas de Sheets (=, +, -, @), valida el
  esquema, lista blanca de IDs y topes de tamaño. El resumen corre por
  disparador horario, no en cada pedido.
- Content-Security-Policy en index.html y cabeceras en _headers.
- noopener en window.open, maxlength en los campos.

Sigue abierto y aceptado: escapar() no escapa la comilla simple (hoy no
es explotable, todos los datos del cliente caen en atributos con comilla
doble); los cupones son visibles en el código fuente.

## De una tienda a muchas — las decisiones que lo permiten

Detalle completo en `ARQUITECTURA.md`. Aquí queda el resumen y el porqué, que
es lo que se olvida.

**Una cuenta de Google por tienda, creada y administrada por nosotros.** Los
límites de Apps Script son por cuenta y por día, y el que de verdad importa
—30 ejecuciones simultáneas— **no sube pagando Workspace**. Cada visitante que
carga el catálogo gasta una de esas ejecuciones, así que juntar todas las
tiendas en una sola cuenta las pone a competir entre ellas. Además, una sola
cuenta es un solo punto de falla frente a una suspensión de Google.

**Al comercio se le comparte la hoja, no la cuenta.** Por eso no ve el maestro:
no es suyo el proyecto ni la cuenta que lo contiene. El precio de esto es
operativo y hay que asumirlo: son N cuentas con sus contraseñas y sus
recuperaciones.

**Cloudflare y GitHub, al revés: una sola cuenta para todas.** Ahí el límite de
pedidos no aplica —no hay Worker, solo archivos estáticos, y esos son gratis e
ilimitados— y caben 100 sitios por cuenta. Repartirlas no compraría nada.

**El panel pregunta, no entra.** Como cada tienda vive en su cuenta, el archivo
de gestión no puede abrir la hoja de un cliente. Cada maestro publica un
resumen por la puerta `?a=panel&t=TOKEN` y el panel lo consulta. Lo que cruza
son cifras agregadas; nunca un pedido ni el dato de un comprador.

**Los clientes consumen la plantilla al construir, nunca al ejecutar.** La
tienda no carga código de terceros: su política de seguridad no autoriza ni un
origen de script externo. Lo compartido viaja por releases de GitHub y se
hornea dentro del `index.html` de cada tienda. Un cambio llega a todos cortando
una versión y aprobando el pull request de cada tienda — nadie se actualiza
solo.

**Los proveedores de transformación de fotos van autorizados de antemano**
(Cloudinary, ImageKit, Cloudflare Images). Cambiar de proveedor es una celda de
la hoja, sin regenerar el `<head>` ni republicar. Son orígenes de imagen, no de
código: el riesgo que se acepta está acotado a que uno no responda.

## Qué falta por hacer

### 1. Datos de la empresa (bloquea lo legal)
- [ ] Reemplazar EMPRESA.razon, .nit, .correo y .direccion en index.html
      Hoy dicen [RAZÓN SOCIAL], [NIT O CÉDULA], etc. Salen así en las tres
      ventanas legales. La ley colombiana exige que el vendedor esté
      identificado, así que esto se arregla ANTES de publicar.

### 2. Volver a publicar con los últimos arreglos
- [ ] Arrastrar la carpeta publicar/ sobre la pestaña Deploys del sitio.
      Trae las URL corregidas (og:image apuntaba a un dominio ajeno) y
      los reintentos de red para móvil.

### 2b. Actualizar las tarifas de envío en la hoja
La hoja Envíos todavía tiene las zonas viejas (Bogotá, Sabana). Bórralas
y pon estas cinco filas, ajustando los precios a lo que te cobre la
transportadora:

    finca      Recoger en finca (Rionegro)       0
    medellin   Medellín y Valle de Aburrá     9000
    oriente    Rionegro y Oriente antioqueño  6000
    principal  Bogotá, Cali, Barranquilla    15000
    resto      Resto del país                19000

El id de la SEGUNDA fila es el que sale escogido por defecto.
Si un cliente tiene la página abierta con una zona que ya borraste, la
hoja lo avisa en el carrito en vez de cobrar cero en silencio.

### 3. Operación de WhatsApp
- [ ] Configurar la respuesta automática con la llave real
      (ver la sección "Pagos" de este archivo)
- [ ] Dejar 5 o 6 respuestas rápidas en WhatsApp Business

### 4. Pruebas
- [ ] Probar desde un celular real, no solo a 375px en el navegador.
      Que el botón flotante no tape "Enviar pedido", que el mensaje
      llegue completo, que cargue rápido con datos móviles.

### 5. Cuando haya tiempo
- [ ] Comprar dominio y conectarlo en Netlify
- [ ] Mantener el catálogo de respaldo de index.html más o menos al día
      (solo se usa si Google no responde; no es crítico)

## Hecho
- [x] Publicado en tomateorganico.netlify.app
- [x] Hoja Pedidos arreglada: el registro pasó de POST a GET
- [x] Validaciones: una fila por pedido, con candado contra carreras
- [x] Pedidos repetidos corregidos (número estable + enlace real + dedupe)
- [x] Inventario que se mueve al confirmar el pedido, y se devuelve al anular
- [x] Más vendidos se actualiza al cambiar un Estado, no solo cada hora
- [x] Reintentos de red y espera de 15 s: el cupón deja de fallar en móvil
- [x] Apps Script desplegado, SCRIPT_URL conectada y CUPONES vaciada:
      la hoja gobierna catálogo, precios, stock, envíos y cupones
- [x] Fotos reales en Cloudinary, cargando desde la columna Imágenes.
      Los marcadores SVG quedan solo como respaldo, para un producto
      nuevo que todavía no tenga fotos
- [x] Apps Script fuera de la hoja: maestro standalone + stub de 46 líneas
- [x] Fotos en tres capas, con el proveedor cambiable desde una celda
- [x] La CSP y los hosts de imagen se generan desde la hoja
- [x] Especificaciones máximas medidas y documentadas en los dos manuales
- [x] Listas desplegables y presentación en todas las hojas
- [x] Tres colores de marca, pintables con el relleno nativo de Sheets
- [x] Generar inventario para index.html desde el menú
- [x] index.html sin la lista de cupones y sin los ensayos explicativos
- [x] El mensaje de WhatsApp ya no repite el código de verificación, y el
      emoji dejó de ir primero (no cargaba en la caja de quien envía)
- [x] Manual del dueño y manual técnico, en HTML y PDF
- [x] Tablero rediseñado: bandas, gráficos de barras, comparación justa
      contra el mismo tramo del mes pasado
- [x] Iconito de tomate en la pestaña del navegador, con los colores de la marca
- [x] Generar configuración ahora abre una ventana con botón de copiar
- [x] Correo diario de resumen, configurable desde la hoja, con export
      mensual adjunto el primer correo de cada mes
- [x] Enlace por producto (?p=chonto) y botón de compartir en la ficha
- [x] Hoja Tablero: ventas del mes, embudo de conversión, pendientes,
      inventario y top de productos y ciudades (52 pruebas automáticas)
- [x] Paginación de 25, 50 y 100
- [x] Open Graph con imagen de compartir (falta cambiar la URL)
- [x] Análisis de seguridad y mitigación de lo crítico y lo alto
- [x] El cupón ya aplica y el aviso sobrevive al repintado del panel
- [x] Selector de cantidad en las tarjetas y en la ficha
- [x] Páginas legales escritas (datos personales, retracto, términos)
- [x] Código del Apps Script escrito en apps-script.gs (falta desplegarlo)