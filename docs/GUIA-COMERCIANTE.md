# Tu tienda en una página

_Imprímela y déjala al lado del computador. Todo lo demás está en el manual._
---

## Lo único que hay que entender

**Tu tienda no lee la hoja en vivo.** Lleva dentro una copia de tu catálogo y abre rápido. Esa copia se rehace **cuando tú publicas**.

> Cambias algo en la hoja → **menú → Publicar ahora** → unos minutos → la tienda
> lo muestra.

**El cierre lo eliges en Configuración.** `pago_modo = pasarela` cobra con Bold
y solo crea la venta cuando Bold aprueba. `pago_modo = whatsapp` conserva el
pedido por chat para un comercio sin pasarela. Elige siempre de las listas.

Si te saltas el segundo paso, la hoja dice una cosa y tu tienda otra. Sola se
pone al día cada cuatro horas.

**Medir visitas opcional:** en **Configuración** pega `medicion_google_analytics` (GA4: `G-…`) y/o `medicion_meta_pixel` (número de Meta), nunca código ni URL. Vacío no carga rastreadores; después usa **Publicar ahora** y mantén al día tu aviso de privacidad y consentimiento de cookies.
---

## Las tres cosas del día a día

**Cambiar un precio o el stock**
Pestaña **Catálogo**, escribe el número, **Publicar ahora**.
Escribe `8900`, no `$8.900` ni `8,900`: con símbolos la hoja no lo lee como
número y el producto **desaparece** de la tienda en vez de salir barato.

**Agregar un producto**
Una fila nueva en **Catálogo** con ID, Nombre, Precio y `Activo = Sí`. La foto va a Drive con **el nombre exacto** de Imágenes —mayúsculas incluidas—. Después, **Publicar ahora**.

**Agregar color, talla u otras variantes**
En `Catálogo.Variantes`: `Color: Azul|Verde; Talla: S|M|L`. Ejecuta **Sincronizar variantes**, diligencia stock, precio e imágenes opcionales en `Variantes`, y luego **Publicar ahora**. Separa fotos con `|`; vacío hereda las generales. No edites Variante ID.

**Llegó un pedido pagado**
Primero queda el intento en **Pagos**. Cuando Bold lo aprueba, aparece en
**Pedidos** con la referencia y la transacción, se descuenta el inventario y
llegan los correos. El WhatsApp posterior es un aviso del cliente, no la prueba
del pago. Desde ahí solo cambia el estado operativo a **Despachado** o
**Entregado** cuando corresponda.

**Un pago quedó pendiente**
No crees un pedido a mano. El conciliador lo revisa cada quince minutos. Si el
cliente afirma que pagó y después de ese tiempo sigue `PENDING`, busca la misma
referencia en el portal de Bold y envía el diagnóstico a soporte.

---

## El menú de tu hoja

| | |
|---|---|
| **Publicar ahora** | Manda a la tienda lo que cambiaste. La más importante |
| **Ver mi tienda** | La abre como la ve un comprador |
| **Actualizar tablero e inventario** | Recalcula ya, sin esperar la hora |
| **Sincronizar variantes** | Crea o actualiza las combinaciones de color, talla u otras opciones |
| **Enviarme el resumen ahora** | Manda el correo del día en el momento |
| **Diagnóstico** | Revisa todo y dice qué está mal y **dónde** |
| **Ayuda** | Las preguntas de siempre, contestadas |

Si el menú no se ve, recarga la página de la hoja.

---

## Cuando algo no aparece en la tienda

**Abre Diagnóstico.** Revisa nueve cosas y arriba te dice cuáles están bien.

- Si un punto dice **PROBLEMA** o **REVISAR**, abajo está el detalle con la
  **celda exacta** —«Catálogo E7 dice "$9.000"»— o el **nombre del archivo** de
  la foto que falta. Arréglalo y publica.
- Si el punto 8 dice que tu tienda muestra algo viejo, es que falta publicar.
- Si no entiendes lo que dice: **copia el cuadro de abajo del todo y mándalo por
  WhatsApp** a quien te montó la tienda. Ahí va todo lo que hace falta.

---

## Lo que no hay que hacer nunca

- **No cambiarle el nombre a una pestaña ni a una columna.** Se rompe todo, y no
  avisa.
- **No borrar filas de Pedidos.** Son tu historial de ventas.
- **No editar Pagos, Reservas ni Datos de entrega.** Son el libro mayor y la información
  privada del checkout. Los intentos de sandbox solo se limpian durante una
  prueba controlada.
- **No escribir en la pestaña Tablero** ni en Más vendidos: se reescriben solas
  cada hora y se pierde lo que pongas.
- **No tocar el código** (Extensiones → Apps Script). Si algo hay que cambiar
  ahí, lo hace quien te montó la tienda.

Lo que **sí** puedes tocar sin miedo: Catálogo, Configuración, Envíos, Cupones y
la columna Estado operativo de Pedidos.

---

<sub>**Para quien entrega la tienda:** si explicar esto toma más de 30 minutos,
el hallazgo es de diseño, no del comerciante. Anótalo.</sub>
