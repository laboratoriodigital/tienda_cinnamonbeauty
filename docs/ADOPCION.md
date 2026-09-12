# Adopción de la arquitectura v3

Análisis de `README2` y `RUNBOOK2` contra lo que hay construido y medido.
Veredicto punto por punto, y lo que se controvierte.

**Conclusión: se adopta el modelo.** No por los argumentos que el documento
pone al frente —varios no aplican a nuestro caso— sino por uno que sí, y que es
el agujero real de la arquitectura actual: **hoy un cambio no llega a todas las
tiendas.** Cada tienda es una *copia* del código; el documento propone que sea
un *dato* del mismo código. Eso es O5, y es lo único de la lista de objetivos
que hoy no podemos hacer ni con más trabajo manual.

---

## 1. El objetivo, contra dónde estamos

| # | Objetivo | Meta | Hoy | Veredicto |
|---|---|---|---|---|
| O1 | Costo por tienda/mes | $0 | **$0** | ✔ cumplido |
| O2 | Alta de una tienda | < 30 min | ~65 min estimados | ✘ el modelo nuevo lo acerca |
| O3 | Foto subida → publicada | < 15 min | hasta 4 h | ✘ es frecuencia de cron, barato |
| O4 | Carga en móvil 4G | < 1,5 s | 1–3 s solo la llamada al catálogo | ✘ **imposible con catálogo en vivo** |
| O5 | Un cambio llega a todas | mismo día | **no existe** | ✘ el argumento decisivo |
| O6 | Comisión | 0% | 0% | ✔ cumplido |

O4 y O5 no se arreglan optimizando lo que hay. Piden el cambio de modelo.

---

## 2. Veredicto por decisión

### Ya lo hacemos, y en algunos casos mejor

**ADR-08 · una cuenta de Google por tienda.** Idéntico a lo nuestro, por la
misma razón medida: 30 ejecuciones simultáneas por cuenta, que no suben pagando.

**ADR-07 · WhatsApp Business App, no la Cloud API.** Ya es lo nuestro.

**ADR-04 · Actions ilimitado en repos públicos.** El argumento no aplica: **los
repositorios de tienda ya son públicos** precisamente por eso, y no filtran nada
que el sitio no publique. La ventaja del modelo nuevo es otra —una sola base de
código— y conviene decirlo así, o se defiende con un número que no era el
problema.

**ADR-03 · origen de fotos intercambiable.** Ya está, y **más completo**:
`fotos_origen`, `fotos_cdn` y `fotos_webp` en la hoja, nombres de archivo sin
URL en la columna Imágenes, y además la lista de hosts permitidos que ajusta la
política de seguridad de la página —que el documento no menciona y sin la cual
cambiar de proveedor deja las fotos bloqueadas por el navegador—.

**ADR-10 · telemetría empujada.** Escrita ya como `DECISIONES.md 02`, con la
misma razón —la dirección del secreto— y con tres contrapartidas que el
documento omite. Ver §4.

**P6 · sin datos personales del comprador.** *Ya cumplido, y es la sorpresa del
análisis.* La hoja `Pedidos` guarda `Ciudad` y nada más: no hay columna de
nombre, teléfono ni dirección. `registrarPedido` solo persiste la ciudad. La
identidad ya vive únicamente en WhatsApp.

**ADR-09 · el comerciante no puede ver la lógica.** Ya es lo nuestro, y además
**el spike S-01 ya está corrido**: ver §4, controversia 1.

### Mejora fácil — entra ya

| Qué | Por qué es barato | Valor |
|---|---|---|
| **Publicar ahora** en el menú de la hoja | El maestro ya genera el bloque de inventario | Es lo que hace aceptable el catálogo congelado |
| **Ver mi tienda** y **Ayuda** en el menú | Dos entradas más en el stub | Reduce la sesión de capacitación |
| `esquema` y `generado` en cada JSON publicado, y que el frontend **rechace un esquema desconocido y conserve el último bueno** | Un campo y una comprobación | Es P8 aplicado al contrato: hoy un JSON malformado rompería la vitrina en silencio |
| **Tope Bre-B**: bloquear y advertir sobre COP $12.110.000 | Una regla en el carrito | Evita prometer un pago que no se puede hacer |
| Columnas nuevas **al final**: `referencia`, `precio_antes`, `umbral_bajo` | Añadir al final no rompe nada | Pedidas por el negocio |
| Estados extendidos `despachado`/`entregado` + `guia` | Columnas al final de `Pedidos` | §6.9, que pediste explícitamente |
| **Regla dura: prohibido renombrar o reordenar columnas** | Es una regla, no código | Es lo que permite actualizar N tiendas a la vez |
| Bajar el cron de fotos de 4 h a 15 min | Un número | O3 |
| Aserción de que las derivadas salen **sin EXIF** | `sharp` ya descarta metadatos; falta probarlo | Riesgo "foto con GPS", que el documento califica de probabilidad alta |
| **Separar el token del stub** del token de montaje | Un segundo token de alcance `menu` | Cierra el hueco que ADR-09 señala bien: hoy el comerciante lee el token en el editor de la hoja |

### Bueno, pero al roadmap

| Qué | Por qué no ya |
|---|---|
| Hoja `movimientos` como fuente de verdad del stock | Hoy la columna `Inventario` de `Pedidos` impide el doble descuento, que es el 90% del valor. El libro mayor completo permite *detectar* descuadres, que es el 10% restante |
| Despliegue por anillos (canario → 20% → todas) | Con dos tiendas no hay anillos. Se escribe el procedimiento ahora, se usa a partir de la quinta |
| Simulacro de reversión trimestral | Mismo motivo. El procedimiento sí se escribe ya |
| Catálogo de personalización | Se necesita cuando un cliente pida algo que no cabe en `config`. Todavía no pasó |
| Salida de un cliente (RUNBOOK2 §7) | Excelente que esté definido antes de necesitarlo. Es un documento, no código |
| Origen de fotos migrable a R2 | Umbral 800 fotos/tienda. Estamos en 17 |

### No, o no todavía

**Quitar el formulario de datos de entrega del carrito.** El documento dice que
el sistema «no los pide ni los guarda». **No los guardamos** —eso está resuelto—,
pero sí los pedimos, para que el mensaje de WhatsApp llegue como una factura
completa y el comerciante no tenga que preguntar nombre y dirección por chat.
Quitarlos mueve trabajo al comerciante en el momento más caro, el de la venta.
Se mantiene, y se documenta como diferencia deliberada: **la regla es no
almacenar, no dejar de preguntar.**

**Pedidos como una fila por pedido con los ítems en un solo campo.** El nuestro
es **una fila por línea**, y eso alimenta `Más vendidos` y deja al comerciante
filtrar y hacer tablas dinámicas en su propia hoja. Pasar a un campo `items`
sería una regresión funcional. Se mantiene.

**Envío como un solo valor en `config`.** Tenemos una hoja `Envíos` con tarifas,
y una hoja `Cupones` con tipo, mínimo, vencimiento y tope de usos. El documento
no las menciona. **No son omisiones a corregir: son funcionalidad que el
documento no cubre.** Se mantienen y se anexan al contrato.

**Cloudflare Pages.** El documento asume Pages. Usamos **Workers con activos
estáticos**, que no cobra por servir y ya nos da `_headers`, `404.html` y URL de
vista previa por rama. Se adopta el *principio* de ADR-05 —desplegar por subida
directa desde Actions, no por la integración con Git— sin cambiar de producto.

---

## 3. El despliegue, que es la preocupación principal

### Qué cambia, y por qué

Hoy: `wrangler.jsonc` en cada repositorio y **la integración con Git de
Cloudflare** compila y despliega. Eso pasa por Workers Builds, que trae **una
sola compilación concurrente**: con diez tiendas, un cambio en varias es una
cola. Y el código del sitio está *copiado* en cada repositorio, así que una
corrección hay que propagarla N veces.

Propuesto: **un repositorio maestro con el código y los flujos**, repositorios
de tienda que solo llevan su configuración, y el despliegue por **subida directa
desde Actions**. El sitio de cada tienda se *construye* a partir del maestro más
su configuración, en vez de ser una copia del maestro.

| | Hoy | v3 |
|---|---|---|
| Un cambio llega a todas | copiando a N repos, a mano | **una corrida por tienda, mismo día** |
| Cola de despliegue | 1 concurrente (Workers Builds) | tantas como Actions permita |
| Deriva de versiones | no medible | una sola versión, medible |
| Vista previa por rama | automática | una por versión, con `versions upload` |
| Credenciales | cada repo con las suyas | **concentradas en el maestro**: es el otro costo |

### Lo que se pierde, dicho de frente

1. ~~Las vistas previas automáticas por rama.~~ **Descartado el 8 de
   septiembre:** `wrangler versions upload` devuelve una URL de vista previa por
   versión, sin integración con Git y pensado para usarse por pull request desde
   un flujo de integración continua. El paso «revisar la vista previa antes de
   fusionar» se conserva tal cual.
2. **La concentración de credenciales.** Ver controversia 3.

### Cómo se migra sin apagar nada

El maestro y las tiendas pueden convivir: el flujo nuevo despliega a la tienda
cero, se compara byte a byte con lo que produce el camino viejo, y solo entonces
se apaga la integración con Git. Ninguna tienda ve un corte.

---

## 4. Controversias

**1 · S-01 ya está corrido, y su orden de preferencia está al revés.**
*(Cerrada el 8 de septiembre: es `DECISIONES.md 03`.)*
El documento propone investigar tres topologías, prefiriendo «A — cero script
adjunto, menú pintado por un disparador instalable». **Lo medimos el 6 de
septiembre: A no funciona.** Un disparador instalable desde el proyecto
independiente *sí dibuja* el menú en la hoja de otra persona, pero al hacer clic
falla con `PERMISSION_DENIED`, porque la frontera es la **propiedad del
proyecto**, no la autorización. La topología viable es **B, el cascarón**, que
es la que está en producción. Ese spike no hay que hacerlo: hay que borrarlo del
plan y quedarse el hallazgo.

**2 · «El maestro nunca entra a la tienda» y «el operador solicita el
diagnóstico y la tienda responde» no pueden ser las dos verdad.**
Si el operador pide y la tienda responde, alguien está entrando. Nuestra versión
resuelve la ambigüedad y es la que se mantiene: **empuje** para el resumen
diario —que es lo que vacía el llavero— y **consulta bajo demanda** para el
diagnóstico, aceptando que para eso el operador necesita la URL y el token de
esa tienda en ese momento. Y con tres contrapartidas que el documento omite y
que ya están escritas en `DECISIONES.md 02`: el empuje **invierte quién le
escribe a quién** —el maestro pasa a exponer un endpoint que acepta
escrituras—, una tienda caída **deja de ser evidente**, y el panel muestra lo
de ayer.

**3 · ADR-10 dice que el maestro no guarda credenciales; ADR-04, ADR-05 y la
tabla de credenciales del runbook dicen que guarda el token de GitHub, el del
CDN y las de despliegue del backend.** No es contradicción si se enuncia bien:
*el maestro no guarda credenciales **de Google de las tiendas***. Sí concentra
las de infraestructura, y eso **empeora** con v3, porque ahora despliega a
todas. Hay que decirlo en la decisión, no descubrirlo después.

**4 · La meta de 30 minutos choca con el procedimiento del propio runbook.**
Los pasos 1.1 a 1.7 incluyen crear una cuenta de Google con verificación en dos
pasos, configurar WhatsApp Business en el teléfono del comerciante y una sesión
de capacitación de 30 minutos. **Solo la capacitación ya es la meta completa.**
Nuestra medición dice que ~28 de los 65 minutos son irreducibles con el ratón:
Google no deja crear cuentas por programa, el menú debe pegarse desde dentro de
la hoja, y conectar el CDN es un diálogo del navegador. La meta honesta es
**30 minutos de trabajo del operador, sin contar capacitación ni WhatsApp**, y
hay que cronometrarla para saberlo.

**5 · Tres datos del documento hay que verificar en fuente oficial antes de
construir sobre ellos.** *(Verificados el 8 de septiembre; ver `SPRINT-0.md`.)*
El tope de 1.000 UVB queda confirmado y **se reindexa cada año**, así que va a
`Configuración` y no al código. El cobro de mensajes de servicio desde el 1 de
octubre de 2026 es cierto **y aplica solo a la API**, no a la app gratuita que
usamos: ADR-07 sale reforzado. Lo de la cuota de compilaciones tiene un
mecanismo claro pero ninguna afirmación explícita en la documentación, y se
comprueba con el contador en el Spike A.

---

## 5. Fotos: se queda el nuestro

Misma idea, pero el nuestro tiene tres cosas que el documento no describe:

- **Sincronización incremental.** `origen.json` guarda id y fecha de
  modificación por foto; solo se baja lo que cambió. Comparar por fecha y no por
  tamaño es deliberado: el comerciante reemplaza una foto por otra que pesa
  casi igual.
- **Propagación de borrados.** Lo que desaparece del Drive desaparece del sitio.
- **Detección de desajustes.** Fotos referenciadas que no existen y fotos que
  nadie referencia, por nombre exacto. Es el punto 3 y 4 del diagnóstico que el
  documento pide, y ya está construido.

Le falta una cosa: **emitir `fotos.json` para el frontend**. `origen.json` es un
registro de construcción, no un manifiesto de publicación. Con catálogo estático
hace falta, porque un sitio estático no puede listar un directorio.

**Se reutiliza el flujo, no se reescribe.** Se le añade la emisión del
manifiesto, la aserción de EXIF y la frecuencia nueva.

---

## 6. Contratos de datos: qué se queda, qué cambia, qué se anexa

| Hoja | Hoy | v3 |
|---|---|---|
| `Catálogo` | ID, Nombre, Formato, Categoría, Precio, Stock, Descripción, Imágenes, Destacado, Activo | **+ `referencia`, `precio_antes`, `umbral_bajo`** al final |
| `Configuración` | 31 claves | **+ llave Bre-B, titular, entidad, texto de pago, umbral de envío gratis, horario** |
| `Envíos` | ID, Nombre, Valor | **se queda.** El documento no la tiene |
| `Cupones` | Código, Tipo, Valor, Mínimo, Vence, Usos máx., Usos confirmados, Activo, Notas | **se queda.** El documento no la tiene |
| `Pedidos` | una fila **por línea**: Fecha, Pedido, Validación, Estado, Ciudad, Cupón, Producto, ID, Cantidad, Precio unit., Subtotal línea, Total, Inventario | **se queda el formato.** + `fecha_pago`, `fecha_despacho`, `guia` al final |
| Estados | Por confirmar · Confirmado · Anulado | **→ nuevo · pendiente_pago · pagado · despachado · entregado · cancelado.** Migración con convivencia |
| `Validaciones` | auditoría de discrepancia entre lo que dijo la página y lo que dice la hoja | **se queda.** El documento no la tiene y resuelve algo distinto de `movimientos` |
| `Más vendidos`, `Tablero`, `Errores` | ya están | equivalen a `resumen` + `_sistema`, y son más ricas |
| `movimientos` | no existe | **al roadmap.** Hoy la columna `Inventario` evita el doble descuento |

**Regla que se adopta hoy y no se negocia:** todo campo nuevo va **al final y
opcional**. Renombrar o reordenar rompe todas las tiendas a la vez, y es
exactamente el tipo de fallo que esta arquitectura vuelve masivo.

---

## 7. El menú, combinando los dos

| Entrada | Origen | Nota |
|---|---|---|
| **Publicar ahora** | v3 | Lo que hace aceptable el catálogo congelado |
| **Ver mi tienda** | v3 | Trivial y muy usado |
| Actualizar tablero e inventario | nuestro | Se queda |
| Enviarme el resumen ahora | nuestro | Se queda |
| **Diagnóstico** | los dos | Se amplía a los 9 puntos, con salida en llano y bloque técnico copiable |
| **Ayuda** | v3 | Reduce la capacitación |
| ~~Generar configuración para index~~ | nuestro | **Se deroga**: existía porque el montaje era copiar y pegar |
| ~~Generar inventario para index~~ | nuestro | **Se deroga**: lo reemplaza Publicar ahora |

---

## 8. Artefactos publicados

El documento lista tres JSON. Nosotros publicamos además:

- `404.html` — una dirección mal copiada no deja al comprador en blanco.
- `_headers` — política de seguridad y cache.
- `compartir.jpg` — la imagen del enlace al compartir por WhatsApp, que es
  **el canal principal de este producto**. Sin ella, el enlace se comparte sin
  imagen.

Los tres se quedan. El contrato de publicación es: `config.json`,
`catalogo.json`, `fotos.json` —los tres con `esquema` y `generado`— **más** los
artefactos del sitio.
