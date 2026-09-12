# Plan de trabajo — migración a la arquitectura v3

Qué se construye, en qué orden y con qué se da por terminado. El porqué está en
`ADOPCION.md`; el estado del terreno, en `ANTES-DE-SALIR.md`.

**Vara de decisión, en este orden:** que no se pierda una venta · costo $0 ·
simplicidad para el comerciante · una sola base de código.

---

## 0. Estado actual contra el deseado

| Dimensión | Hoy | Al terminar |
|---|---|---|
| Catálogo | en vivo desde Apps Script, 1–3 s | estático, publicado cada 4 h + bajo demanda + al agotarse |
| El navegador habla con Google | en cada visita | **solo al enviar el pedido** |
| Código de la tienda | copiado en cada repositorio | **un maestro; la tienda es configuración** |
| Un cambio llega a todas | no existe | mismo día, por corrida |
| Despliegue | integración con Git del CDN, 1 compilación a la vez | subida directa desde Actions |
| Vista previa por rama | automática | **por reconstruir** |
| Fotos | Drive → 3 tamaños → repo, cada 4 h | igual, cada 15 min, con manifiesto propio |
| Telemetría | el panel consulta y guarda todos los tokens | cada tienda empuja; el panel no guarda llaves de Google |
| Menú de la hoja | 5 entradas, 2 obsoletas | 6 entradas, ninguna obsoleta |
| Diagnóstico | 8 comprobaciones | 9, con salida en llano y bloque técnico |
| Alta de una tienda | ~65 min estimados | < 30 min de operador, **cronometrados** |
| Estados de pedido | 3 | 6, con despacho y guía |
| Deriva de versiones | no medible | métrica semanal |

---

## 1. Cómo se trabaja

**Definición de listo** — una historia entra al sprint solo si tiene: criterio
de aceptación verificable, se sabe qué contrato de datos toca, y si toca uno,
cómo conviven las dos versiones.

**Cuándo se sube la versión.** Solo cuando cambia algo que se despliega:
`maestro.gs`, `panel.gs` o `publicar/index.html`. Es lo que el flujo de pruebas
exige, y subirla en un commit de documentación obliga a cortar un release que no
entrega nada.

**Definición de terminado** — todas, sin excepción:

1. Aserciones nuevas en las baterías, en verde junto con las anteriores.
2. Probado en la tienda cero antes de tocar ninguna otra.
3. Documento actualizado en el mismo commit que el código.
4. Si cambia algo que el comerciante ve, la guía de una página se actualiza.
5. Si cambia un contrato de datos, la versión anterior **sigue funcionando**.

**Reglas de despliegue, desde ya aunque haya dos tiendas**

- Nada al backend un viernes después de mediodía ni en fecha comercial alta.
- Todo cambio del backend arranca en la tienda cero y espera una hora.
- Prohibido renombrar o reordenar columnas. Solo agregar al final.
- Un cambio de esquema **nunca** en un paso: primero la versión que acepta los
  dos, después la migración, y solo entonces se retira el soporte viejo.

---

## 2. Épicas

| # | Épica | Objetivo | Tamaño | Riesgo |
|---|---|---|---|---|
| E0 | Estabilizar la semilla y salir al aire | Orgánico vendiendo con la versión actual | S | bajo |
| E1 | Congelar contratos | Que un cambio no rompa N tiendas | S | bajo |
| E2 | Catálogo estático | O4, y que la vitrina no compita con el checkout | M | medio |
| E3 | Despliegue desde el maestro | **O5**, el argumento decisivo | L | **alto** |
| E4 | Fotos | O3, y cerrar el riesgo de EXIF | S | bajo |
| E5 | Menú, diagnóstico y ayuda | Que el comerciante se resuelva solo | M | bajo |
| E6 | Pedido y pago | Estados completos y tope Bre-B | M | bajo |
| E7 | Telemetría empujada | Vaciar el llavero | M | medio |
| E8 | Alta en menos de 30 minutos | O2, con cronómetro | M | medio |

---

## 3. Sprints

Semanas de trabajo, no de calendario. Cada sprint entrega algo que se puede
mirar funcionando.

### Sprint 0 — La semilla, y las dudas que cuestan una hora
**Meta: Orgánico vendiendo con la versión del repositorio, y ningún supuesto sin
verificar.**

| Historia | Criterio de aceptación |
|---|---|
| Publicar la versión y poner Orgánico al día | El Diagnóstico de la hoja dice la misma versión que la etiqueta |
| Pedido de punta a punta con un teléfono de verdad | Llega el WhatsApp, entra a `Pedidos`, marcar confirmado descuenta stock |
| Respuesta automática de WhatsApp Business | El comprador recibe los datos de pago sin pedirlos |
| Revisión legal del machote | Un abogado lo mira una vez; el contrato dice que el responsable es el comercio |
| **Spike A** · subida directa a Cloudflare | Se sube una **versión** con `wrangler versions upload` —no se despliega— y se compara byte a byte con producción. No toca la tienda |
| ~~**Spike B** · vistas previas~~ | ✅ **Resuelto**: `wrangler versions upload` devuelve una URL de vista previa por versión, sin integración con Git. El paso de revisión del runbook se conserva |
| ~~**Spike C** · las tres cifras~~ | ✅ **Resuelto** en fuentes oficiales. El tope Bre-B **se reindexa cada año**: va a `Configuración`, no al código. Ver `SPRINT-0.md` |
| ~~Borrar el spike S-01~~ | ✅ **Resuelto**: es `DECISIONES.md 03` |

> Sin el Spike A, E3 es una apuesta. El B ya salió **positivo** y con eso cae
> el riesgo principal de la épica del despliegue. Avance del sprint y pasos
> exactos del que falta: `SPRINT-0.md`.

### Sprint 1 — Congelar contratos
**Meta: que a partir de aquí un cambio no pueda romper N tiendas a la vez.**

- ✅ Escribir el contrato de datos como documento normativo, con la regla de
  «solo al final y opcional» y la de convivencia de esquemas —
  **`docs/CONTRATOS.md`**, y el avance en `docs/SPRINT-1.md`.
- Añadir `esquema` y `generado` a lo que se publica.
- El frontend **rechaza un esquema desconocido y conserva el último bueno**, y
  lo dice en consola. Es P8 aplicado al contrato.
- Columnas nuevas al final: `referencia`, `precio_antes`, `umbral_bajo` en
  `Catálogo`; `fecha_pago`, `fecha_despacho`, `guia` en `Pedidos`.
- Claves nuevas en `Configuración`: llave Bre-B, titular, entidad, texto de
  pago, umbral de envío gratis, horario.
- ✅ **Aserción:** ninguna columna existente cambió de nombre ni de posición —
  `pruebas/esquema.js`, que lee el esquema del código y lo compara con
  `pruebas/esquema.json`. Se regenera a propósito con `node esquema.js
  --congelar`, y el cambio queda en el diff.

### Sprint 2 — Catálogo estático
**Meta: el navegador deja de hablar con Google para mirar.**

- ✅ El montaje hornea `publicar/catalogo.json` desde la hoja —config incluida,
  sin las claves de pago—. Avance en `docs/SPRINT-2.md`.
- Tres vías de publicación: cada 4 horas, **Publicar ahora** desde el menú, y
  al agotarse un producto. **Las tres necesitan que el maestro pueda disparar un
  despliegue, que es el Sprint 4**: se mueven allí y el montaje las cubre
  mientras tanto.
- ✅ El frontend lee el JSON primero. **Se conservan los dos respaldos**: el
  maestro en vivo si el archivo no está —el caso de toda tienda recién montada—
  y el inventario del `index.html` si tampoco.
- ✅ Regla de stock bajo: `stock <= umbral_bajo` marca «últimas unidades», con
  el umbral que pone el comercio producto por producto. Llegó en el Sprint 1.
- **Medir O4 antes y después, en un móvil real con 4G**, no en el navegador.
- El pico horario de lecturas ya se mide: debe **bajar a casi cero**. Es la
  comprobación de que la vitrina dejó de competir con el checkout.

### Sprint 3 — Fotos
**Meta: O3, y cerrar el riesgo de metadatos.**

- ✅ **Se reutiliza el flujo actual**, que ya baja solo lo que cambió, propaga
  borrados y detecta desajustes. No se reescribió: solo se le añadió un
  parámetro para poder probarlo. Avance en `docs/SPRINT-3.md`.
- ✅ **Aserción de que las derivadas salen sin EXIF** — `pruebas/exif.js`, con
  una foto con GPS de verdad pasada por la función que publica. Probada al
  revés: con un `withMetadata()` metido a mano, cae de 20/20 a 8/20.
- ✅ **El catálogo deja de envejecer solo**: el mismo flujo lo refresca cada
  cuatro horas. Era una deuda del Sprint 2 que no aguantaba hasta el 4.
- ⛔ ~~`fotos.json` con rutas relativas~~ — **se deroga**: `catalogo.json` ya
  lleva los nombres de las fotos, y un segundo archivo con el mismo dato es el
  patrón 2. Lo que queda es listar ahí las medidas que de verdad se generaron.
- ⛔ ~~Frecuencia a 15 minutos~~ — **no**: 96 corridas diarias para una tienda
  que cambia el catálogo unas veces por semana. La urgencia la resuelve el botón
  del menú, no una frecuencia más alta.
- El manifiesto descarta las fotos incompletas, para no publicar una galería
  rota a medias.

### Sprint 4 — Despliegue desde el maestro `[la épica grande]`
**Meta: O5. Un cambio llega a todas el mismo día.**

- Repositorio maestro con el código y los flujos; la tienda pasa a ser
  configuración.
- Despliegue por subida directa desde Actions, con lo aprendido en el Spike A.
- **Convivencia:** el camino nuevo despliega la tienda cero y se compara con el
  viejo antes de apagar la integración con Git. Ninguna tienda ve un corte.
- Vista previa por rama con `wrangler versions upload`, una por pull request.
- Procedimiento de despliegue por anillos y de reversión, **escritos ahora**
  aunque con dos tiendas no haya anillos.
- Métrica de deriva de versiones. Si diverge, se detiene la incorporación de
  clientes hasta corregirla.
- **Riesgo a nombrar en la decisión:** el maestro concentra ahora las
  credenciales de despliegue de todas las tiendas.
- **Inyectar el stub sin pegarlo a mano**, con la API de Apps Script
  (`projects.updateContent`) desde el propio maestro. **No antes de la tercera
  tienda**, y con las siete condiciones de
  `docs/EVALUACION-stub-automatico.md` — la primera de las cuales es leer el
  proyecto antes de escribirlo: ese `PUT` borra todo archivo que no le mandes.
  El argumento no son los dos minutos del pegado: es que **si cambiar el menú
  obliga a entrar a ocho hojas, el menú deja de cambiarse**.
  Cuesta un proyecto de Cloud y una pantalla de consentimiento **por tienda**,
  así que entra en el alta o no entra en ninguna parte.

### Sprint 5 — Menú, diagnóstico y ayuda
**Meta: que el comerciante resuelva solo los tres incidentes más comunes.**

> **Se adelanta al Sprint 4, y con razón.** La épica del repositorio maestro
> existe para que un cambio llegue a todas las tiendas el mismo día; con una
> tienda montada eso todavía no paga. Este sprint cierra un hueco abierto en el
> Sprint 2. Avance en `docs/SPRINT-5.md`.

- ✅ Menú: Publicar ahora · Ver mi tienda · Actualizar tablero e inventario ·
  Enviarme el resumen ahora · Diagnóstico · Ayuda. Y el menú del stub **se
  genera** a partir del del maestro: eran dos copias a mano.
- ✅ **Se derogan** «Generar configuración» y «Generar inventario»: existían
  porque el montaje era copiar y pegar. Salen del menú; siguen vivas para
  `?a=bloques`, que es como el montaje escribe el index.
- ✅ Diagnóstico a 9 puntos, con **fila y columna exactas** en los datos
  inválidos y **nombre exacto** en las fotos que no cuadran. Dos salidas: llano
  y bloque técnico copiable —sin el token, que se lee en pantalla.
- ✅ **Separar el token del stub** del de montaje: el comerciante lo leía en el
  editor de su hoja, y ese mismo token abría `sembrar`, `bloques`, `fotos` y
  `panel`. Ahora el stub lleva uno que solo abre el menú, el Diagnóstico deja de
  enseñar el de montaje, y `rotarToken()` jubila el que estuvo a la vista.
- ✅ Guía de una página. **Si la capacitación necesita más de 30 minutos, es un
  hallazgo de diseño, no un problema del comerciante.** Y una batería que le
  pregunta al maestro cuáles son las opciones del menú, para que los papeles del
  comerciante no vuelvan a enseñar botones que ya no existen.

### Sprint 6 — Pedido y pago
**Meta: el ciclo completo de la venta, y no prometer pagos imposibles.**

Avance en `docs/SPRINT-6.md`.

- ✅ Estados `nuevo → pendiente_pago → pagado → despachado → entregado` más
  `cancelado`, con convivencia: el backend acepta los viejos y los nuevos,
  `migrarEstados()` los pone al día en `instalar()`, y la lista desplegable pasa
  a ofrecer solo los nuevos. **El inventario se descuenta al pasar a `pagado`, y
  solo ahí.** Y un estado que no se reconoce ya no devuelve stock vendido: se
  queda quieto y sale en el Diagnóstico con su fila.
- ✅ Llave Bre-B en `config` — estaba desde la 2.4.0, y las cuatro claves de
  cobro siguen sin salir ni a la página ni al repositorio. Falta **configurar la
  respuesta automática de WhatsApp Business**, que es un paso del montaje, no
  código.
- ✅ **Tope por operación:** el carrito bloquea por encima de `pago_tope` de
  `Configuración` —hoy $12.110.000, que es 1.000 UVB y **se reindexa cada
  diciembre**— y el aviso, que sale **en el carrito y no al abrir WhatsApp**,
  dice «consulta con tu banco», porque la entidad del comprador puede tener un
  tope más bajo que el del sistema.
- ✅ Los pedidos que salieron por WhatsApp y no llegaron a la hoja.
  **Esta línea decía que el pedido `TMP-` «ya está», y no existía:** la palabra
  no aparecía en el código. El modo de fallo sí, y resultó más interesante que
  la métrica: el único sitio que sabe que el comprador pulsó enviar y que el
  registro falló es su navegador — así que el pedido se guarda ahí y se reenvía
  cuando la tienda vuelve a abrirse. **Deja de perderse**, y la métrica sale
  gratis, con el peor tiempo al lado. `DECISIONES.md 04`.

### Sprint 7 — Telemetría empujada
**Meta: que el panel deje de ser un llavero.**

> **Se atendió primero otra cosa, y con razón.** Avance en `docs/SPRINT-7.md`.
> Antes de que el panel deje de ser un llavero hace falta poder decir, sin
> acordarse de nada, **si una tienda está terminada** — esa es la condición para
> montar la siguiente, y sin ella el resto del sprint mide tiendas a medias.
>
> - ✅ «¿Está terminada esta tienda?»: dieciséis claves con su porqué, dos
>   niveles —lo que rompe la venta y lo que solo queda a medias—, el montaje se
>   niega a publicar lo primero, y el panel lo muestra para todas a la vez en la
>   columna **Sin terminar**.
> - ✅ El pull request del bot dice **qué trae**. Decía siempre lo mismo, y un
>   título que no cambia nunca se deja de leer: se fusiona por costumbre.

- Cada tienda empuja un agregado diario al maestro.
- **Regla de vejez:** sin resumen en 36 horas, se marca caída. Es lo que
  reemplaza al «NO RESPONDE» inmediato que hoy da la consulta.
  **No se puede escribir todavía:** con una tienda ese umbral no se observa, y
  poner un número que nadie ha medido es justo lo que `DECISIONES.md` pide no
  hacer. Entra con la tercera tienda.
- Un secreto por tienda para que el endpoint del maestro no acepte cualquier
  cosa: el empuje **invierte quién le escribe a quién**.
- La consulta bajo demanda **se queda** para el diagnóstico.
- El panel deja de guardar llaves de Google de las tiendas.

### Sprint 7½ — Afinar los flujos `[cuando el sistema esté estable, no antes]`
**Meta: dejar de pagar por lo que ya se sabe.**

> **El orden importa y es deliberado.** Optimizar un flujo que todavía cambia
> es optimizar algo que va a dejar de existir, y cada atajo que se le mete a un
> flujo es una forma nueva de que un fallo pase por verde. Esto entra cuando el
> producto lleve varias tiendas sin tocar los `.yml`.

- **Las baterías corren hasta cuatro veces por despliegue** —el `push`, el paso
  del `montaje`, el pull request que abre el propio `montaje`, y el `release`—
  y solo tres tienen razón de ser. La del PR del bot repite el árbol que el
  paso del `montaje` acaba de probar. Filtrar `pull_request` por rama
  (`montaje/desde-la-hoja`) es lo primero de la lista.
  **Y el rojo por la razón equivocada enseña a ignorar los rojos**: cuatro
  corridas verdes por despliegue enseñan a no mirarlas, que es peor que el
  minuto que cuestan.
- **Caché de `node_modules`** en los flujos que instalan: hoy cada corrida baja
  `sharp` y Playwright otra vez.
- **Las baterías de navegador** son la mayor parte del tiempo de corrida.
  Medir cuánto y decidir si van en paralelo o solo en `release`.
- **Repasar el código con los siete patrones de la bitácora en la mano**, que es
  la revisión que nunca se ha hecho entera.

**Contrapartida escrita, o no se ejecuta:** cada atajo que se tome aquí tiene
que decir *qué deja de comprobarse* y *qué lo comprueba en su lugar*.

### Sprint 8 — Alta en menos de 30 minutos
**Meta: O2, con cronómetro.**

- Retomar el flujo de alta aparcado, ahora que el modelo lo hace más simple: el
  repositorio de tienda ya solo lleva configuración.
- Formulario de prerrequisitos al comerciante antes de empezar.
- Lista de verificación de aceptación: no se entrega la tienda hasta que pase
  entera.
- **Cronometrar cada alta y anotarla.** Es el dato que le pone precio al
  servicio, y hoy no existe.

---

## 4. Se deroga

| Qué | Por qué |
|---|---|
| «Generar configuración para index.html» | El montaje ya no es copiar y pegar |
| «Generar inventario para index.html» | Lo reemplaza Publicar ahora |
| Consulta del catálogo en vivo desde la vitrina | ADR-01 |
| La integración con Git del CDN | Una compilación concurrente es una cola |
| El spike S-01 | Ya está medido |
| El argumento de «Actions ilimitado» como razón para el maestro público | Nuestros repos de tienda ya son públicos. La razón es una sola base de código |

## 5. Se mantiene contra el documento

| Qué | Por qué |
|---|---|
| Formulario de datos de entrega en el carrito | No se **almacenan**, que es la regla. Preguntarlos evita una ronda de chat en el momento de la venta |
| `Pedidos` con una fila por línea | Alimenta `Más vendidos` y deja al comerciante hacer tablas dinámicas |
| Hojas `Envíos` y `Cupones` | Funcionalidad que el documento no cubre |
| `Validaciones` | Prueba que el total no fue manipulado. Es otra cosa que `movimientos` |
| Workers en vez de Pages | No cobra por servir, y ya nos da `_headers`, `404.html` y vistas previas |
| `404.html` y `compartir.jpg` | WhatsApp es el canal principal: un enlace sin imagen se comparte peor |
| Inventario de respaldo en el `index.html` | Salva el primer arranque si el JSON no está |

## 6. Al roadmap

Hoja `movimientos` como libro mayor · despliegue por anillos en uso real ·
simulacro de reversión trimestral · catálogo de personalización · procedimiento
de salida de cliente · migración del origen de fotos a R2 (umbral: 800 fotos por
tienda) · QR estático imprimible · correr las baterías también en Windows.

---

## 7. Qué puede salir mal

| Riesgo | Mitigación |
|---|---|
| ~~El Spike B dice que no hay vista previa por rama~~ | ✅ **Descartado**: `wrangler versions upload` las da sin integración con Git |
| Migrar contratos y modelo de despliegue a la vez | Sprint 1 antes que Sprint 4, y convivencia obligatoria |
| El maestro concentra las credenciales de despliegue | Vencimiento a un año, calendario a 30 días, rotación al salir alguien |
| Sobreventa al congelar el catálogo | Validación al registrar el pedido + regla de stock bajo. Es riesgo aceptado, no defecto |
| Google cambia las cuotas gratuitas | Revisión trimestral. **No hay plan B real: es el riesgo estructural del modelo** |
| **Una plataforma retira una versión de tiempo de ejecución** | Pasó el 8-sep: Node 20 sale de los runners de GitHub el 23-sep-2026 y se llevaba los cuatro flujos por delante. Los avisos amarillos de CI **se leen**, y su fecha se verifica en la fuente |
| Se migra el modelo antes de tener la segunda tienda montada | Sprint 0 primero. Medir un despliegue contra una semilla que se mueve mide el ruido |
