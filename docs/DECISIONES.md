# Decisiones de arquitectura

Cada una con lo que casi siempre falta en un documento así: **la condición que
la dispara** y **lo que se pierde al aplicarla**. Una decisión sin condición de
disparo no se puede ejecutar —nadie sabe cuándo— y una sin contrapartida se lee
como si fuera gratis, y entonces se aplica antes de tiempo.

El porqué del diseño de hoy está en `ARQUITECTURA.md`. Esto es lo que va a
cambiar, y cuándo.

---

## 01 · El catálogo se sirve en vivo hoy, y estático cuando el tráfico lo pida

**Estado:** EJECUTADA en el Sprint 2 · **Escrita:** 6 de septiembre de 2026 ·
**Revisada:** 8 de septiembre de 2026 · **Actualizada:** 16 de septiembre de
2026

> **Actualización.** Esta decisión ya se ejecutó: el catálogo se sirve
> **estático** desde Cloudflare, horneado por `montar/catalogo-estatico.mjs` y
> `montar/sembrar-respaldo.mjs`, y se actualiza con el botón **Publicar
> ahora** de la hoja o solo cada 4 horas (flujo `fotos`) — no en cada visita.
> Lo que sigue abajo describe el razonamiento que llevó ahí y por qué no hizo
> falta esperar al umbral de tráfico; para el comportamiento de hoy, ver
> `ARQUITECTURA.md` §6 y §10, y `GUIA-COMERCIANTE.md`.

### Qué hace hoy

La página pide el catálogo al maestro en cada visita, y por eso el comerciante
cambia un precio en su hoja y está en la calle a los diez segundos. Si el
maestro no contesta, la página cae al **inventario de respaldo horneado dentro
del `index.html`**: se ve completa, con precios de la última publicación. Degrada,
no se cae.

### El límite real, que no es el que parece

Lo que aprieta en Apps Script **no es una cuota diaria de peticiones**: son
**30 ejecuciones simultáneas por cuenta de Google**, y ese número es idéntico en
la versión de pago. Es un límite de *concurrencia*, no de *volumen*, y la
diferencia cambia qué se optimiza:

| | Cuota diaria | Concurrencia (lo real) |
|---|---|---|
| Mil visitas repartidas en el día | te mata | no es nada |
| Cien visitas en el mismo minuto | no es nada | **es el problema** |

Por eso la métrica que importa es el **pico**, no el total. Una campaña de
WhatsApp a mil personas concentra las visitas en diez minutos: esa es la hora en
que se prueba esto, no un martes cualquiera.

### La decisión

El catálogo **sigue en vivo** mientras el pico esté lejos del techo. Cuando se
acerque, se congela: se publica como archivo estático junto a la página y Apps
Script se queda solo con validar y registrar el pedido, que es una petición por
compra y no una por visita.

### Por qué ya no hay que esperar al disparador

Se escribió con una condición porque congelar el catálogo le quitaba al
comerciante el precio en vivo, y eso no valía la pena hasta acercarse al techo.
**La arquitectura v3 elimina esa contrapartida**: añade **Publicar ahora** en el
menú de la hoja y publicación **al agotarse** un producto, que cubren los dos
momentos en que el desfase importa. Sin la contrapartida, no hay razón para
esperar — y hay una razón para no hacerlo, que es el objetivo de carga en móvil:
**con una llamada de 1 a 3 segundos al catálogo, menos de 1,5 s es imposible.**

El disparador se conserva como umbral de vigilancia: si el pico horario pasara
de **300 lecturas** antes de la migración, deja de ser una mejora y pasa a ser
un incidente.

### Condición de disparo (ya no aplica: se ejecuta en el Sprint 2)

> **Prerrequisito para poder medirlo.** El maestro cuenta lecturas y las
> consolida cada hora (`consolidarLecturas`), pero **solo guarda el total del
> día y el de ayer**. Para que esta condición sea observable hay que guardar
> también el mayor incremento horario del día. Es un campo más en la misma
> propiedad. Sin eso, la condición está escrita y no se puede comprobar.

### Contrapartida

**Se pierde el precio en vivo, que es parte del producto.** Con el catálogo
congelado, cambiar un precio deja de ser escribir en una celda: pasa a necesitar
una publicación. A un tendero eso le importa más que ahorrar un segundo de
carga, así que este cambio **empeora la experiencia del comerciante** para
mejorar la del visitante. No es gratis, y por eso tiene condición.

Mitigación cuando llegue el momento: el flujo de fotos ya sabe bajar, probar y
fusionar solo cada cuatro horas, y el menú de la hoja ya genera el bloque de
inventario. Republicar el catálogo por ese mismo camino deja el retraso en horas,
no en días, y es más ensamblaje que desarrollo.

---

## 02 · La telemetría diaria se empuja; el diagnóstico se sigue consultando

**Estado:** ADOPTADA, con la consulta bajo demanda conservada ·
**Escrita:** 6 de septiembre de 2026 · **Revisada:** 8 de septiembre de 2026

### Qué hace hoy

El panel llama a cada tienda con `UrlFetchApp.fetchAll` y trae su resumen. Para
poder hacerlo, **guarda la URL y el token de todas las tiendas**: es el único
archivo del producto con esa propiedad, y nunca se comparte con un cliente.

### El argumento de cuota no se sostiene, y conviene decirlo

Con 100 tiendas refrescando cada hora son **2.400 llamadas al día contra un tope
de 20.000**. El consumo crece linealmente con el número de tiendas, sí, pero la
constante es tan pequeña que la cuota no se toca hasta miles de tiendas.
Defender el cambio con ese número invita a que alguien haga la cuenta y descarte
la idea entera, cuando la idea es buena por otra razón.

### La razón que sí lo sostiene

**La dirección del secreto.** Con consulta, el panel es un llavero: todas las
llaves de todas las tiendas en un archivo. Con empuje, cada tienda solo conoce
la URL del maestro y **el maestro no guarda credencial de nadie**. El daño de que
se filtre el panel deja de crecer con el número de clientes.

### La decisión

**Las dos, y por función.**

- **Empuje** para el resumen diario: cada tienda manda una vez al día un
  agregado —ventas, pedidos por confirmar, agotados, versión, fecha del último
  respaldo—. Es lo rutinario, y es lo que vacía el llavero.
- **Consulta** para el diagnóstico bajo demanda: «Actualizar todas las tiendas»
  se queda. Es cuando de verdad hace falta el dato de este segundo, y ahí N vale
  1, no 100.

### Condición de disparo

Cuando el panel tenga **más de 10 tiendas**, o antes si alguien que no sea el
dueño necesita abrirlo. Con dos o tres tiendas el llavero cabe en la cabeza; a
partir de diez, deja de caber.

### Contrapartida

Tres cosas, y la primera es la seria:

1. **Invierte quién le escribe a quién.** Hoy nada de afuera escribe en el
   panel. Con empuje, el maestro publica un endpoint que **acepta escrituras**, y
   sin un secreto por tienda cualquiera puede llenar la hoja de filas falsas.
   Es superficie de ataque nueva donde hoy no hay ninguna.
2. **Una tienda caída deja de ser evidente.** Con consulta te enteras al
   instante: así se detectó la tienda que se veía perfecta y no registraba un
   solo pedido. Con empuje, una tienda muerta simplemente deja de escribir, y la
   ausencia se parece demasiado a «el disparador todavía no corrió». Hace falta
   una regla de vejez: sin resumen en 36 horas, se marca caída.
3. **El panel muestra lo de ayer.** Aceptable para el resumen; por eso la
   consulta bajo demanda no se retira.

---

## 03 · El cascarón en la hoja se queda. Está medido, no supuesto

**Estado:** cerrada, con evidencia · **Medida:** 6 de septiembre de 2026

### Qué se quería

Que el comerciante **no pueda leer la lógica de negocio**. Un editor de la hoja
puede abrir Extensiones → Apps Script y ver todo el código adjunto, y el negocio
está en ese código.

La solución ideal sería **cero código en la hoja**: el menú lo pintaría un
disparador instalable creado desde el proyecto independiente del operador, que
corre bajo *su* autorización. El comerciante no vería absolutamente nada.

### Qué se midió

**No funciona, y el motivo importa.** El disparador instalable **sí dibuja** el
menú en la hoja de otra persona. Pero al hacer clic en una opción, la función
falla con `PERMISSION_DENIED`: la invocación ocurre bajo la cuenta del
comerciante dentro de un proyecto que no es suyo.

**La frontera es la PROPIEDAD del proyecto, no la autorización.** Ese es el
hallazgo, y es lo que hace que ninguna variante de la idea funcione.

### La decisión

Se queda el **cascarón**: unas cuarenta líneas dentro de la hoja que solo
dibujan el menú y le preguntan al maestro qué mostrar. Sin precios, sin cupones,
sin inventario, sin ninguna regla. El comerciante ve el cascarón, no el negocio.

### Contrapartida, y lo que hay que cerrar

El cascarón **lleva el token de la tienda escrito en claro**, y el comerciante
lo puede leer en el editor de su hoja. Hoy ese token puede leer la
configuración, listar la carpeta de fotos, bajar archivos de esa carpeta y
sembrar claves de `Configuración` — todo son datos que el comerciante ya posee,
así que la exposición es baja. Pero es el **mismo** token que usan el panel y
los flujos de montaje, y eso sí es un hueco.

**Se cierra separando el token del cascarón**, con alcance únicamente a la
puerta del menú, del token de montaje. Está en el Sprint 5.

### Y una consecuencia operativa que cuesta caro olvidar

El cascarón **hay que regenerarlo y volver a pegarlo** cuando cambia el nombre
del comercio o el menú. No se actualiza solo, porque vive en la hoja del
cliente. Está en `ACTUALIZAR-UNA-TIENDA.md`.

---

## 04 · El pedido que no se registra se guarda en el navegador del comprador

### Qué hace hoy

El número del pedido lo genera la página. El mensaje de WhatsApp sale siempre.
El registro en la hoja es una petición aparte, con dos reintentos.

Si el maestro no contesta y se agotan los reintentos, el comprador se va con su
código y su mensaje, y **en la hoja no hay fila**. El comercio ve el chat y no
ve el pedido: o lo escribe a mano, o se le pierde.

### El límite real, y por qué no se puede resolver en el momento

**Cuando el registro falla, lo que falla es justamente el sitio donde habría que
anotarlo.** No hay servidor propio; el único que podría llevar la cuenta es el
maestro, y el maestro es el que está caído.

Y desde la hoja tampoco se distingue después: un pedido con acta en
`Validaciones` y sin fila en `Pedidos` es tanto un registro que no llegó como un
carrito que se abandonó — y los abandonados son la mayoría.

El único sitio que sabe que el comprador **pulsó enviar** y que el registro
**falló** es su propio navegador.

### La decisión

El pedido que no se pudo registrar se guarda en `localStorage` del comprador y
se reenvía la próxima vez que la tienda se abra y el maestro conteste. El
reenvío lleva los minutos que pasaron; el maestro los cuenta.

**Qué se guarda, y por qué no rompe la regla de no almacenar datos del
comprador.** Exactamente lo que ya viajaba en el registro: código, productos,
envío, cupón, subtotal y ciudad. **No** el nombre, el celular ni la dirección —
esos nunca fueron en el registro, van por WhatsApp—. Y vive en el dispositivo
del propio comprador, para que no se pierda **su** pedido. Caduca a los siete
días y guarda cinco como mucho.

### La condición de disparo, y con qué se observa

El instrumento es el contador de rescates: sale en el Diagnóstico con el peor
tiempo, y en el panel en la columna **Rescatados**.

- **Minutos sueltos** son tropiezos de red. Normales, no se hace nada.
- **Más de una hora**, o varias tiendas a la vez, quiere decir que el maestro
  estuvo caído un buen rato. Ahí la pregunta ya no es el rescate: es por qué se
  cayó.
- **Si los rescates suben de forma sostenida**, el techo de concurrencia de Apps
  Script empieza a estorbar y aplica la decisión 01.

### La contrapartida

**Esto no rescata todos los pedidos perdidos, y no puede.** Si el comprador no
vuelve a abrir la tienda, su pedido no se recupera nunca y no aparece en ningún
contador. Lo que se mide es **el subconjunto recuperable**, y el número real de
pedidos perdidos es mayor que el que sale. Conviene no leerlo como si fuera el
total.

Además: en una ventana de incógnito o con el almacenamiento bloqueado no hay
bandeja, y `localStorage` en esos casos **no devuelve vacío, lanza**. Por eso
cada lectura y cada escritura va entre `try/catch`: una tienda que revienta al
abrirse por querer recordar un pedido de la semana pasada es peor que una
tienda que se olvida.

---

## 05 · La confirmación de pago la decide el proveedor, no el navegador ni el chat

### Qué hace hoy

El carrito usa el Botón de pagos Bold. Apps Script recalcula y firma el monto,
guarda el intento y consulta el resultado. `APPROVED` es la única transición
que crea Pedidos, descuenta inventario y envía avisos.

### La fuerza real

El backend autorizado debe seguir siendo Apps Script + Sheets. Las credenciales
Bold pertenecen al titular: tiendas del mismo dueño pueden repetirlas en sus
Propiedades del script, pero nunca compartir el proyecto Apps Script, la hoja o
las referencias. Un webhook directo no sirve si Apps Script no
permite validar de forma fiable `x-bold-signature`; aceptar el cuerpo sin firma
sería permitir que cualquiera confirme una venta.

### La decisión

La fuente de verdad es la consulta autenticada desde Apps Script. El retorno
del navegador acelera la consulta y un disparador cada quince minutos concilia
los clientes que no regresan. WhatsApp se abre manualmente **después** de
confirmar y nunca cambia estados.

La integración se encapsula detrás de `Configuración.pago_proveedor`. Bold es el primer
adaptador; PayU, Mercado Pago o PayPal deberán devolver el mismo contrato y
probar monto, aprobación, rechazo e idempotencia antes de activarse.

`pago_modo=whatsapp` es una salida operativa explícita para comercios sin
pasarela. No simula aprobación ni usa el conciliador: registra el pedido y abre
el chat con el mismo flujo histórico.

### La condición de cambio

Se podrá preferir webhook cuando exista un relay autorizado que conserve el
cuerpo crudo y valide la firma antes de llamar Apps Script, o cuando Apps Script
exponga las cabeceras necesarias. La frecuencia de quince minutos solo baja
después de medir volumen, tiempo de ejecución y cuota en tiendas reales.

### La contrapartida

Una confirmación puede tardar hasta el siguiente ciclo si el cliente cierra la
página, y cada consulta consume cuota de Apps Script y Bold. A cambio no se
mantiene infraestructura adicional ni se confía en señales falsificables.

El plan y la puerta de despliegue están en `PLAN-PAGOS-BOLD.md`.

---

## 06 · Las opciones se declaran en Catálogo; el inventario vive por SKU

### Qué hace hoy

`Catálogo.Variantes` declara ejes con `Color: Azul|Verde; Talla: S|M|L` y la
hoja `Variantes` conserva una fila por combinación.

### La fuerza real

Una sola celda puede describir opciones, pero no puede representar de forma
segura el producto cartesiano de color, talla, precio, stock e historial. Usar
el texto visible como identidad rompería pedidos cuando se renombre “Azul”.

### La decisión

Cada combinación tiene `Variante ID` estable y SKU. El precio vacío hereda; el
precio escrito sobrescribe. El stock se reserva y descuenta por clave de
inventario. Un producto variable sin Variante ID válida falla cerrado y nunca
usa el stock general.

### La condición de cambio

La fase 2 ya agregó `Variantes.Imágenes` al final. La celda vacía hereda las
fotos generales y la gramática de `Catálogo.Variantes` no se amplía.

### La contrapartida

El comercio debe ejecutar **Sincronizar variantes** después de cambiar los
ejes y diligenciar stock por combinación. A cambio conserva inventario auditable
y combinaciones imposibles pueden permanecer inactivas.

El plan completo está en `PLAN-VARIANTES.md`.

---

## 07 · El código se prueba completo una vez; los datos generados tienen su guardia

### Qué hace hoy

Cada push ejecuta la suite completa con cuatro procesos aislados dentro de un
runner. `fotos` y `montaje` ejecutan una guardia corta sobre los archivos que
acaban de generar. `release` exige la corrida verde del mismo SHA.

### La fuerza real

En la línea base, la suite consumía 91–98 segundos por ejecución y se repetía
sin que cambiaran sus entradas. Cuatro jobs cobrarían cuatro runners en los
repositorios privados; cuatro procesos dentro de uno no.

### La decisión

Hay un solo corredor (`todas.sh`) con dos selecciones explícitas: completa para
código y `publicacion.sh` para index, catálogo, fotos, respaldo, pagos y
variantes. Las lecturas remotas independientes se hacen en paralelo.

### La condición de cambio

Después de tres corridas por tienda se comparan las metas de
`PLAN-RENDIMIENTO-ACTIONS.md`. Una cobertura perdida obliga a ampliar la
guardia; memoria insuficiente obliga a bajar `TRABAJADORES`, no a borrar
aserciones.

### La contrapartida

La publicación ya no vuelve a ejecutar módulos que no cambiaron. A cambio, la
clasificación “código” frente a “artefacto generado” queda como contrato y una
nueva ruta generada debe agregarse a la guardia.

---

## 08 · SEO se hornea con el catálogo; no se consulta en cada visita

**Estado:** EJECUTADA · **Escrita:** 20 de septiembre de 2026

La fuente es `publicar/catalogo.json`. El build produce datos estructurados,
fichas, sitemap y robots, y los flujos los publican como una sola unidad. Se
descarta renderizar SEO en el navegador: depende de JavaScript y no entrega una
URL canónica por producto. Se descarta pedir otra vez el catálogo al maestro:
duplicaría lectura y permitiría que la vitrina y el índice describieran estados
distintos.

**Contrapartida:** un cambio de producto aparece en buscadores solo después de
Publicar ahora/despliegue, y el rastreador decide cuándo volver a visitar.

**Condición para cambiar:** migrar a otro backend/build que garantice la misma
atomicidad, o necesitar páginas editoriales que no pertenecen al catálogo.

## Cómo se escribe una decisión aquí

Cinco partes, y las dos últimas son las que la hacen ejecutable:

1. **Qué hace hoy** — el punto de partida, sin adornos.
2. **El límite o la fuerza real** — con el número, y nombrando el límite
   correcto. Nombrar el equivocado hace que se optimice lo que no era.
3. **La decisión** — qué se hace.
4. **La condición de disparo** — el número o el evento que la activa, y con qué
   instrumento se observa. Si no se puede medir hoy, decirlo.
5. **La contrapartida** — qué se pierde. Si no hay ninguna, probablemente la
   decisión no se entendió.
