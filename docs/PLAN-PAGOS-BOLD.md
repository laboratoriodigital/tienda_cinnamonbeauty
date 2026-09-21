# Plan de integración de pagos · Bold

Estado: **implementado y validado en sandbox en Orgánico el 20 de septiembre
de 2026**. El despliegue a Panadería se hace primero; Cinnamon queda detenido
hasta que la prueba de Panadería sea aprobada expresamente.

## 1. Objetivo

Reemplazar el cierre de la venta por chat con un checkout verificable: el
cliente paga exactamente el valor recalculado por el servidor, Bold devuelve
el resultado y solo una confirmación autenticada convierte el intento en
pedido pagado. Después se envían los correos y se ofrece al cliente un mensaje
manual de WhatsApp para avisar al comercio.

El backend sigue siendo exclusivamente **Apps Script + Google Sheets**. GitHub
Actions monta y publica código; Cloudflare sirve la vitrina. Ninguno de los dos
conserva credenciales de Bold ni participa en la conciliación.

## 2. Alcance vigente

- `pago_modo`, `pago_proveedor`, `pago_ambiente` y `pago_integracion` se eligen
  con listas en la pestaña `Configuración`.
- Proveedor activo: Bold; integración activa: Botón de pagos personalizado.
- Primer ambiente: sandbox; producción solo después de repetir la matriz.
- `pago_modo=whatsapp` mantiene operativo al comercio sin cuenta de pasarela.
- Fuente de verdad: consulta autenticada a Bold desde Apps Script.
- Respaldo: conciliador de Apps Script cada quince minutos.
- Avisos: correo al cliente y a los correos del comercio; WhatsApp manual desde
  el dispositivo del cliente después de la confirmación.
- Webhook directo: aplazado. Apps Script no expone de forma fiable la cabecera
  `x-bold-signature`; no se aceptará un evento que no pueda verificarse.

Queda preparado un adaptador separado para API Pagos en Línea/QR Bre-B cuando
Bold habilite esas llaves. PayU, Mercado Pago o PayPal deberán implementar el
mismo contrato de creación y consulta sin cambiar carrito, Pedidos ni avisos.

## 3. Flujo de extremo a extremo

1. La vitrina envía productos, cupón, envío y datos de entrega a
   `POST ?a=pago_crear`.
2. Apps Script vuelve a leer Catálogo, Cupones y Envíos; nunca confía en precios
   ni totales enviados por el navegador.
3. Genera `ORD-*`, firma `pedido + monto + COP + secreta`, registra un intento
   `PENDING` en `Pagos` y una fila privada en `Datos de entrega`.
4. La vitrina carga `boldPaymentButton.js`, crea `BoldCheckout` y abre Bold con
   el monto firmado.
5. Bold retorna al `sitio_url` con un token opaco de la tienda. El navegador no
   decide si el pago fue aprobado.
6. `?a=pago_estado` consulta a Bold. Mientras Bold propaga el resultado se
   mantiene `PROCESSING`; no se inventa un rechazo.
7. La creación reserva por Producto ID o Variante ID. Solo `APPROVED` ejecuta
   la confirmación idempotente: crea las líneas de `Pedidos`, descuenta ese
   inventario, consume la reserva, conserva la transacción Bold y marca `PAID`.
8. Se envía un correo al cliente y otro a cada destinatario del comercio. Las
   marcas de notificación impiden duplicarlos.
9. La pantalla muestra “Pago confirmado” y un enlace de WhatsApp prellenado. El
   cliente pulsa Enviar y luego vuelve al catálogo.
10. Si el cliente no regresa, `conciliarPagosBold` repite la consulta cada
    quince minutos y completa los mismos pasos.

## 4. Datos y secretos por tienda

Las selecciones no secretas viven en las cuatro listas `pago_*` de la hoja. Las
siguientes credenciales viven en **Apps Script → Configuración del proyecto →
Propiedades del script**, nunca en GitHub, Cloudflare, el HTML o Sheets:

| Propiedad | Uso |
|---|---|
| `BOLD_IDENTIDAD_SANDBOX` | identidad pública de pruebas |
| `BOLD_SECRETA_SANDBOX` | firma del checkout de pruebas |
| `BOLD_IDENTIDAD_PRODUCCION` | identidad pública real |
| `BOLD_SECRETA_PRODUCCION` | firma real |

Cada proyecto Apps Script usa sus propias propiedades. Los valores pueden ser
los mismos únicamente cuando las tiendas pertenecen al mismo titular Bold;
siguen instalándose por separado para no acoplar hojas ni backends. Las llaves
de Botón no se reutilizan como llaves de API Pagos en Línea.

## 5. Actividades ejecutadas

- [x] Separar la pasarela del carrito mediante `PAGO_PROVEEDOR`.
- [x] Implementar Botón de pagos y conservar aparte el adaptador API/QR.
- [x] Recalcular monto, cupón, envío e inventario en Apps Script.
- [x] Firmar del lado servidor sin publicar la secreta.
- [x] Crear `Pagos` y `Datos de entrega` como pestañas privadas.
- [x] Usar el `ORD-...` completo de Bold en `Validaciones`, Pagos y Pedidos.
- [x] Seleccionar modo, proveedor, ambiente e integración desde listas de la hoja.
- [x] Conservar el cierre por WhatsApp sin exigir una cuenta de pasarela.
- [x] Implementar retorno, consulta, conciliación e idempotencia.
- [x] Confirmar Pedidos y descontar inventario solo después de `APPROVED`.
- [x] Enviar correos y construir el WhatsApp manual posterior al pago.
- [x] Permitir `checkout.bold.co` en las tres copias de la CSP.
- [x] Reutilizar el checkout pendiente si falla su apertura en el navegador.
- [x] Reservar producto o variante al crear; consumir al aprobar y liberar al rechazar o vencer.
- [x] Cubrir creación, firma, espera, aprobación, rechazo, retorno y reintento.
- [x] Validar una compra completa con tarjeta sandbox de Bold en Orgánico.

## 6. Matriz de aceptación por tienda

La tienda no se da por aprobada hasta completar todos los puntos:

1. `?a=version` y `SCRIPT_VERSION` coinciden.
2. DevTools carga `boldPaymentButton.js` con estado 200, no `blocked:csp`.
3. Un clic crea una sola fila en `Pagos` y una en `Datos de entrega`.
4. Bold muestra ambiente de pruebas, referencia y monto exactos.
5. Una tarjeta de aprobación termina en `PAID`.
6. `Pedidos` contiene el proveedor, la referencia y la transacción de Bold.
7. El inventario se descuenta una sola vez.
8. Llegan el correo del cliente y los correos del comercio una sola vez.
9. El enlace manual abre WhatsApp con pedido, total y transacción.
10. Recargar o consultar otra vez no duplica pedido, inventario ni avisos.
11. Una transacción rechazada conserva el carrito y no crea una venta.
12. El conciliador de quince minutos existe y puede completar un retorno
    abandonado.

## 7. Despliegue gradual

### Orgánico — completado

Sandbox aprobado de punta a punta el 20 de septiembre de 2026. Fue posible
crear el checkout, pagar con la tarjeta de prueba, esperar la propagación,
confirmar el pedido, guardar la transacción Bold y abrir WhatsApp.

### Panadería — siguiente puerta

1. Portar código y documentación sin copiar configuración pública de Orgánico.
2. Publicar la versión de plantilla y ejecutar `montaje` con maestro.
3. Como Panadería pertenece al mismo dueño, copiar en su proyecto Apps Script
   los cuatro valores Bold de Orgánico, con los mismos nombres de propiedad.
   No ponerlos en Git, Sheets ni variables públicas.
4. Ejecutar `instalar()` si aún no existen las pestañas o el disparador.
5. Completar toda la matriz de aceptación en sandbox.
6. Detener el despliegue y pedir confirmación del responsable.

### Cinnamon — bloqueado por aprobación

No se porta ni configura hasta recibir confirmación explícita de que Panadería
terminó correctamente la matriz. Después se repite el mismo proceso con la
cuenta Bold y los secretos propios de Cinnamon.

## 8. Retroceso seguro

Si el checkout falla antes de salir a producción:

1. mantener `BOLD_AMBIENTE=sandbox`;
2. no borrar pedidos ya pagados;
3. volver temporalmente a la versión anterior de la vitrina y del maestro como
   una pareja, para no dejar versiones incompatibles;
4. conservar `Pagos`, `Datos de entrega` y `Errores` para diagnóstico;
5. no activar otro proveedor hasta que tenga las mismas pruebas de monto,
   idempotencia, aprobación y rechazo.

## 9. Documentación operativa relacionada

- Configuración y prueba detallada: [PAGOS-BOLD.md](PAGOS-BOLD.md)
- Contrato de Sheets y endpoints: [CONTRATOS.md](CONTRATOS.md)
- Topología y límites: [ARQUITECTURA.md](ARQUITECTURA.md)
- Decisiones: [DECISIONES.md](DECISIONES.md)
- Fallos y aprendizajes: [BITACORA.md](BITACORA.md)
- Lista previa a producción: [ANTES-DE-SALIR.md](ANTES-DE-SALIR.md)
- Actualización de una tienda: [ACTUALIZAR-UNA-TIENDA.md](ACTUALIZAR-UNA-TIENDA.md)
