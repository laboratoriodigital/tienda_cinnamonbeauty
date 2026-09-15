# Antes de salir al aire

Lo que hay que resolver o al menos mirar de frente antes de que un comprador
real ponga su dirección en la página. Está ordenado por lo que más duele si
sale mal, no por lo que más trabajo cuesta.

---

## Bloquean el lanzamiento

> **Estado al 15 de septiembre de 2026.** De los cinco, quedan **dos y medio**:
>
> | | |
> |---|---|
> | 0 · La semilla corriendo lo que se copia | **resuelto** (2.15.1) |
> | 1 · La respuesta automática de WhatsApp | **comprobada** donde se hizo el punto 4. Por tienda |
> | 2 · Qué pasa si Apps Script no contesta al enviar | **abierto** — hay que provocarlo |
> | 3 · Los datos legales, y que un abogado mire el machote | **abierto** |
> | 4 · Un pedido de punta a punta con un teléfono real | **resuelto** (3.0.0) |
>
> Los dos que quedan no son código. El 2 es una prueba de media hora; el 3 es
> una conversación con un abogado antes de cobrarle a un tercero.

**0. Orgánico tiene que estar corriendo la versión que se va a copiar.**
   [RESUELTO · 2.15.1 · 15 de septiembre de 2026]

Orgánico no es una tienda más: es la semilla. Mientras esté desplegada con una
versión anterior a la de la plantilla, cada tienda nueva nace de un archivo que
nadie ha visto funcionar.

Cerrado, y no por acuerdo sino por medición: **las tres tiendas corren la
2.15.1 y su código de plantilla es idéntico al de la semilla, archivo por
archivo.** En la misma versión se cortó el release, se montó Cinnamon Beauty y
se publicó desde la hoja en LA MIGUERIA — los tres caminos, los tres verdes.

> **Esta es la primera versión publicable.** No significa que esté todo: los
> puntos 1 a 4 de esta lista siguen abiertos, y son los que deciden si un
> comprador real puede pagar. Significa otra cosa, que hasta hoy no era cierta:
> **la plantilla se puede clonar y la tienda que sale de ahí funciona sin que
> nadie la toque a mano.** Lo que queda por delante ya no es construir el
> producto: es comprobarlo con una persona que compra.

**1. La respuesta automática de WhatsApp, configurada.**   [POR TIENDA]
La llave de pago sale de la página a propósito: se entrega solo por el chat. Si
la respuesta automática no está puesta, el comprador termina el pedido y **no
tiene cómo pagar**. Es el único paso donde el diseño de seguridad se convierte
en un agujero funcional si se olvida. WhatsApp Business > Herramientas para la
empresa > Mensaje de ausencia. El texto está en `CONTEXTO.md`.

**2. Qué pasa si Apps Script no responde justo al enviar el pedido.**
Hay que provocarlo, no suponerlo: apagar la implementación un minuto y hacer un
pedido. Lo que **no** puede pasar es que el cliente se quede sin poder mandar
el WhatsApp. Que el pedido no quede registrado en la hoja es recuperable —el
mensaje llega igual y el comercio lo atiende—; que el botón no haga nada es una
venta perdida y un cliente que no vuelve.

**3. Los datos legales de la empresa, llenos.**
Las claves `empresa_*` de la hoja alimentan los textos de tratamiento de datos.
La tienda pide nombre, celular y dirección: eso es tratamiento de datos
personales, y en Colombia lo regula la Ley 1581 de 2012. Los textos están
escritos, pero **no somos abogados**: antes de vender el servicio a terceros
conviene que un abogado revise una vez el machote, y que quede claro por
contrato quién es el responsable del tratamiento —el comercio, no nosotros.

**4. Una prueba completa con un teléfono de verdad.**
   [RESUELTO · 3.0.0 · 15 de septiembre de 2026]

Pedido → WhatsApp → respuesta automática → transferencia → confirmar en la hoja
→ el stock baja. De punta a punta, con un celular que no sea el del comercio.

Hecha, y salió bien. Todo lo que estaba probado en automático eran las piezas;
esto probó la costura, que es lo único que ninguna batería puede probar.

> **Y arrastra el punto 1, pero solo para esa tienda.** La respuesta automática
> de WhatsApp estaba en medio de esa cadena: si hubiera faltado, el comprador se
> habría quedado sin llave de pago y la prueba habría parado ahí. Así que en la
> tienda donde se hizo, el punto 1 está comprobado — **no en las otras**. Es
> configuración de la cuenta de WhatsApp Business de cada comercio, no del
> producto: hay que mirarlo una vez por tienda, y mirarlo de verdad, no darlo
> por puesto.

---

## El techo real, y cómo se ve cuando se toca

**5. Cada visitante que carga el catálogo gasta una ejecución de Apps Script.**
El panel muestra, por tienda, cuántas lecturas del catálogo lleva el día. El
tope de 30 simultáneas Google no lo expone —no hay forma de preguntar cuántas
van—, así que se mira la carga, que sí se mide, y avisa antes de llegar.
El límite que no se compra con dinero son **30 ejecuciones simultáneas por
cuenta de Google** (ver `ARQUITECTURA.md`). Con una cuenta por tienda eso es
holgadísimo para un comercio pequeño, pero conviene saber cómo se ve cuando se
acerca: la tienda tarda en cargar el catálogo y cae al inventario de respaldo
que ya viene dentro del `index.html`. Es decir, **degrada, no se cae** — pero
muestra precios y stock viejos.

Vale la pena medirlo antes de la primera campaña con tráfico: si el comercio va
a mandar el enlace a mil personas a la misma hora, esa es la hora en que se
prueba. Si algún día molesta, la salida no es pagar Workspace —ese límite no
sube— sino publicar el catálogo como archivo estático y dejar Apps Script solo
para registrar el pedido.

**6. La hoja crece y nadie la poda.**
`Pedidos` y `Validaciones` solo crecen. Google Sheets corta a los diez millones
de celdas; mucho antes de eso la hoja se vuelve lenta de abrir. Falta una
función de archivado. No bloquea el lanzamiento de la primera tienda, pero sí
la número diez.

**7. La hoja es la base de datos.**  [RESUELTO]
Copia semanal a la carpeta del administrador, los domingos a las 2 de la
mañana, con `makeCopy` —que Drive resuelve de su lado, sin pasar un byte por el
script— y ocho copias de retención. Requiere un paso manual por tienda: que el
administrador comparta `backup_tiendas` con la cuenta de esa tienda, con
permiso de editor. El panel muestra la fecha del último respaldo por tienda y
el correo de la mañana avisa si alguna se quedó atrás.

---

## Automatización: lo que falta para que montar una tienda sea rápido

La premisa del negocio es que desplegar sea rápido y barato. Hoy el montaje
tiene estos pasos manuales, en orden de cuánto tiempo cuestan:

| Paso | Hoy | Se puede automatizar |
|---|---|---|
| Crear la cuenta de Google y la hoja | A mano | No del todo: Google no deja crear cuentas por programa |
| Pegar `maestro.gs` y publicarlo | `npm run maestro` | **Hecho** |
| Pegar el stub en la hoja | A mano | No: hay que estar dentro de la hoja |
| Pegar el bloque `<head>` en el index | `npm run index` | **Hecho** |
| Crear el repositorio y configurarlo | Flujo **tienda nueva** | **Hecho** — sin probar todavía contra una tienda real |
| Conectar el Worker en Cloudflare | A mano | No: ese diálogo es del navegador |
| Llenar la configuración de la hoja | Flujo **montaje**, seis campos | **Hecho** |
| Pasar las fotos de Drive a `publicar/fotos` | `npm run fotos:drive` | **Hecho** |

**El cronómetro ya se corrió, con la tienda tres: 30 minutos.**   [MEDIDO]

| Paso | Reloj |
|---|---|
| GitHub: repositorio, secretos, token, correr los flujos | **15 min** |
| Hoja, proyecto de Apps Script, pegar el maestro, implementar | 8 min |
| Llenar la información en la hoja | 5 min |
| `clasp login` | 2 min |

**La mitad se va en GitHub**, copiando cinco secretos de un sitio a otro — y
cuatro de los cinco los sabe el maestro y ya salen juntos del Diagnóstico. Esa
es la automatización que se paga sola primero, y no ninguna de las de la tabla
de arriba. Está en el roadmap como **4.24**, aplazada a propósito hasta la
quinta tienda: con tres, el ahorro no paga la superficie de fallo.

**Lo que ese número NO incluye, y hay que decirlo para que no se use mal**:
crear la cuenta de Google, las fotos del comercio, la respuesta automática de
WhatsApp, y la prueba de punta a punta con un teléfono real. Antes de ponerle
precio al servicio hay que medir un despliegue **con** esas cuatro cosas —
serán las que separen «montado» de «vendiendo».

---

## Operación

**8. Qué nos avisa si una tienda se cae.**
Hoy, el correo del panel: una vez al día, a las 7. Para un comercio pequeño
está bien. Si eso se queda corto, la respuesta barata no es un servicio de
monitoreo sino subir la frecuencia del panel.

**9. Cómo se vuelve atrás.**
Un release malo no llega solo a nadie: cada tienda se actualiza por un pull
request que alguien aprueba. La tienda de referencia sí despliega desde `main`,
y ahí la vuelta atrás es el historial de despliegues de Cloudflare. Conviene
haberlo hecho una vez **antes** de necesitarlo.

**10. El dominio.**
`algo.workers.dev` funciona, pero el comprador del comercio lo lee y desconfía,
y sin dominio propio no sirven las transformaciones de imagen de Cloudflare. Un
dominio nuestro alcanza para todas las tiendas como subdominios, y "dominio
propio del comercio" es una buena línea para separar planes.

---

## Lo que ya está resuelto y no hay que volver a mirar

- La llave de pago no está en la página ni en el repositorio.
- La hoja guarda **qué** se pidió, no **quién** lo pidió.
- El total lo confirma el comercio; el que calcula la página es referencia.
- Las fotos nunca quedan en blanco, pase lo que pase con el proveedor.
- Ningún cambio llega a producción sin **todas** las baterías en verde.

---

## Y ahora se comprueba solo

Desde la 2.9.0 la pregunta «¿está esta tienda terminada?» **no se lleva en la
cabeza**: la contesta el Diagnóstico en su punto 2, y el panel la muestra para
todas las tiendas a la vez en la columna **Sin terminar**.

Dieciséis claves, en dos niveles:

- **Rompen la venta** —`negocio`, `whatsapp`, `sitio_url`, `pago_llave`—: el
  flujo `montaje` **se niega** a escribir el `index.html`. Sin llave de pago, el
  comprador termina el pedido y no tiene cómo pagar.
- **Dejan la tienda a medias** —los `empresa_*`, `pago_titular`, `pago_entidad`,
  `repositorio`, `correo_resumen`, `respaldo_carpeta`, `sitio_titulo`,
  `sitio_descripcion`—: salen en el registro del montaje y en el panel, y **no**
  bloquean. Publicar sin descripción es feo, no roto.

**Lo que esto NO puede comprobar, y sigue siendo tuyo:**

1. Que la **respuesta automática de WhatsApp** esté puesta con el texto de pago.
   El sistema sabe que `pago_llave` está llena; no sabe si el mensaje sale.
2. Que un **abogado** haya mirado el machote de tratamiento de datos.
3. La **prueba de punta a punta con un teléfono de verdad**: pedido → WhatsApp →
   respuesta automática → transferencia → **Pagado** en la hoja → el stock baja.

Los tres siguen en la lista de arriba, y siguen bloqueando el lanzamiento.
