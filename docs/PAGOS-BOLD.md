# Pagos en línea con Bold

## Estrategia vigente

La tienda usa **Botón de pagos Bold** mientras Bold habilita las llaves de
**API Pagos en Línea**. El botón abre la pasarela de Bold con el total que Apps
Script recalculó y firmó. El cliente elige allí uno de los medios disponibles y
regresa al catálogo; la página nunca da por pagado un pedido usando solamente
el estado que viene en la URL.

El adaptador anterior de QR Bre-B queda disponible como `api_qr`, pero usa un
juego de propiedades distinto para impedir que una llave de Botón se envíe por
error a la API avanzada. Cambiar de un modo al otro no toca carrito, inventario,
hojas, correos ni WhatsApp.

El backend continúa siendo exclusivamente **Google Apps Script + Google
Sheets**. Cloudflare sirve la vitrina estática y GitHub Actions prueba y publica
archivos; ninguno participa en una transacción ni conserva llaves de pago.

## Validación alcanzada

El 20 de septiembre de 2026 Orgánico completó en sandbox una compra con tarjeta
de prueba. Bold abrió el checkout, propagó la aprobación, Apps Script cambió el
intento a `PAID`, creó Pedidos una sola vez, guardó la transacción, descontó
inventario y mostró el enlace manual de WhatsApp. Esta es la línea base que
Panadería sigue en despliegue y Cinnamon se actualiza ahora por instrucción
explícita; cada tienda debe completar por separado su compra sandbox antes de
activar cobros reales.

El plan, las actividades, la matriz de aceptación y el orden de réplica viven
en [`PLAN-PAGOS-BOLD.md`](PLAN-PAGOS-BOLD.md).

## Flujo del Botón de pagos

1. El cliente arma el carrito y entrega nombre, celular, correo, documento y
   dirección.
2. La vitrina envía productos y entrega a Apps Script. El servidor vuelve a
   calcular precios, stock, cupón y envío; no acepta un total del navegador.
3. Apps Script genera una referencia única, firma en SHA-256 la cadena
   `referencia + monto + COP + llave secreta`, guarda el intento en `Pagos`, la
   entrega en `Datos de entrega` y `Validaciones` con el mismo `ORD-...`
   completo; devuelve solo la llave pública y la firma.
4. La vitrina carga la librería oficial de Bold y abre su checkout personalizado.
   La llave secreta nunca llega a Cloudflare ni al navegador.
5. Bold devuelve al cliente al `sitio_url` de la tienda. La página usa el token
   opaco del intento para pedirle a Apps Script que consulte
   `GET /v2/payment-voucher/<referencia>` con la llave de identidad.
6. Al crear el checkout se reserva cada clave de inventario —Producto ID o
   Variante ID—. `APPROVED` es la única respuesta que confirma la venta. Bajo
   un candado de Apps Script se crean las líneas de `Pedidos`, se descuenta
   inventario, se consume la reserva y se marca `PAID`. `PROCESSING`, `PENDING`
   y `NO_TRANSACTION_FOUND` siguen en espera; rechazo o vencimiento liberan la
   reserva sin crear la venta.
7. Se envía correo al cliente y a los correos del comercio. El cliente ve la
   confirmación, abre el WhatsApp prellenado para avisar manualmente al comercio
   y regresa al catálogo.
8. Si el cliente no regresa, `conciliarPagosBold` revisa los intentos pendientes
   cada **15 minutos**. La consulta desde la página usa espera progresiva hasta
   un máximo de una petición por minuto.

La API de consulta puede tardar hasta diez minutos en reflejar la transacción.
Por eso un `NO_TRANSACTION_FOUND` inmediato no se interpreta como rechazo.

## Configuración por tienda

En la pestaña **Configuración**, elige de las listas:

| Clave | Valor actual |
|---|---|
| `pago_modo` | `pasarela` para cobrar; `whatsapp` para cerrar por chat |
| `pago_proveedor` | `bold` |
| `pago_ambiente` | `sandbox` durante pruebas; `produccion` para dinero real |
| `pago_integracion` | `boton`; `api_qr` solo con esas llaves habilitadas |

En el proyecto Apps Script de **cada tienda**, abre **Configuración del proyecto
→ Propiedades del script** y guarda solamente las credenciales:

| Propiedad | Valor |
|---|---|
| `BOLD_IDENTIDAD_SANDBOX` | identidad de pruebas de **Botón de pagos** |
| `BOLD_SECRETA_SANDBOX` | secreta de pruebas de **Botón de pagos** |
| `BOLD_IDENTIDAD_PRODUCCION` | identidad de producción de **Botón de pagos** |
| `BOLD_SECRETA_PRODUCCION` | secreta de producción de **Botón de pagos** |

Si dos tiendas son del mismo titular Bold, como Orgánico y Panadería, estos
cuatro valores pueden coincidir. Se cargan aun así en los dos proyectos Apps
Script: compartir cuenta de cobro no significa compartir backend, hoja ni
historial. Una tienda de otro titular debe usar otra cuenta.

Para Cinnamon se pueden dejar temporalmente las mismas credenciales **si el
titular que cobrará es el mismo**. Para cambiar a otra cuenta Bold, sustituye
las cuatro Propiedades del script de Cinnamon y comprueba el nuevo ambiente;
en la hoja solo se eligen modo, proveedor, ambiente e integración, nunca
identidades ni llaves secretas.

Las propiedades antiguas `PAGO_PROVEEDOR`, `BOLD_AMBIENTE` y
`BOLD_INTEGRACION` quedan como respaldo de migración; si existen las claves de
la hoja, la hoja manda. También se aceptan los alias explícitos `BOLD_BOTON_IDENTIDAD_*` y
`BOLD_BOTON_SECRETA_*`; los nombres cortos se conservan para no obligar a mover
las cuatro llaves que ya están instaladas.

Cuando Bold habilite API Pagos en Línea, sus identidades irán en
`BOLD_API_IDENTIDAD_SANDBOX` y `BOLD_API_IDENTIDAD_PRODUCCION`. Solo después de
probarlas se cambia `BOLD_INTEGRACION=api_qr`. Nunca se reemplazan las llaves de
Botón ni se reutilizan como llaves de API.

Las propiedades no deben ir en `maestro.gs`, `index.html`, Google Sheets ni en
secretos de GitHub. Todo editor del proyecto Apps Script puede verlas, por lo
que se deben restringir sus editores.

Además:

- `Configuración > sitio_url` debe contener la URL pública `https` de esa tienda;
  Apps Script la usa como retorno de Bold.
- La aplicación web debe ejecutarse como la cuenta propietaria y su URL `/exec`
  debe quedar en `SCRIPT_URL` al montar la vitrina.
- `instalar()` debe haberse ejecutado para asegurar `Pagos`, `Datos de entrega`
  y el disparador de conciliación de quince minutos.
- `correo_resumen` y `empresa_correo` definen los destinatarios del comercio.

## Webhook

En sandbox Bold no envía el webhook automáticamente; se prueba manualmente
desde el comprobante de la transacción. En producción el webhook es el método
recomendado por Bold, pero no se debe registrar directamente una URL de Apps
Script: la firma llega en la cabecera `x-bold-signature` y `doPost(e)` no expone
las cabeceras HTTP entrantes.

Mientras el backend tenga que seguir siendo Apps Script + Sheets, la fuente de
verdad es la consulta autenticada y la conciliación de quince minutos. Si más
adelante se autoriza un relay, este debe conservar el cuerpo crudo, validar la
firma HMAC-SHA256 y recién entonces reenviar un evento verificado.

## Prueba de sandbox

1. Confirma las siete propiedades del modo Botón y deja
   `BOLD_AMBIENTE=sandbox`.
2. Monta y publica el nuevo `index.html` y el nuevo `maestro.gs`.
3. Compra desde la URL pública de Orgánico y comprueba que la pasarela muestre
   **Modo de pruebas**. Para una aprobación se puede usar VISA
   `4111111111111111` o seleccionar `BANCO QUE APRUEBA` en PSE.
4. Regresa a la tienda. Puede aparecer “Estamos confirmando” mientras la
   consulta se propaga; no repitas el cobro.
5. Comprueba una sola fila en `Pagos`, otra en `Datos de entrega` y, tras
   `APPROVED`, las líneas `Pagado` en `Pedidos` una sola vez.
6. Comprueba los correos propios de la tienda y el enlace manual de WhatsApp.
   Bold no envía sus correos ni webhook automáticos en sandbox.
7. Prueba una transacción rechazada y vuelve a intentar con el carrito intacto.
8. Solo después replica el commit a Panadería y Cinnamon y configura en cada
   Apps Script las llaves Bold de esa cuenta.

Si DevTools muestra `boldPaymentButton.js (blocked:csp)`, la cabecera HTTP de
Cloudflare quedó desactualizada aunque el `<meta>` del HTML sea correcto. Tanto
`publicar/_headers` como el HTML y la CSP que genera `maestro.gs` deben incluir
`https://checkout.bold.co` en `script-src`. La batería de montaje compara las
tres copias para impedir que vuelvan a divergir.

Si Bold no alcanza a abrir después de crear la referencia, **Intentar el pago
nuevamente** reutiliza ese intento pendiente mientras la página siga abierta;
no crea otra fila en `Pagos` ni duplica `Datos de entrega`.

## Otros proveedores

`PAGO_PROVEEDOR` sigue siendo el selector de pasarela. Un adaptador para PayU,
Mercado Pago o PayPal debe implementar creación y consulta/conciliación, y
devolver un contrato de checkout propio. La confirmación común —pedido,
inventario, correos y WhatsApp— no se duplica. Ningún proveedor se activa hasta
tener pruebas de creación, aprobación, rechazo, reconsulta idempotente y monto
alterado.

`Pagos.Items` conserva ID, Variante ID, SKU, opciones, cantidad y precio
resuelto por el servidor. El diseño está en `PLAN-VARIANTES.md`.

## GitHub Actions y Cloudflare

Actions en repositorios privados consume la bolsa de minutos de la cuenta u
organización, no una bolsa independiente por tienda. Los flujos se reservan
para cambios de código o catálogo y nunca sondean pagos. Cada vitrina despliega
sus recursos estáticos en Cloudflare, mientras sus llaves y su libro mayor
permanecen en el Apps Script y la hoja propios de esa tienda.

Las baterías de navegador corren en cuatro procesos dentro de **un solo
runner**; no son cuatro jobs facturados. Un cambio de código ejecuta la suite
completa y una publicación desde la hoja ejecuta la guardia de artefactos. El
diseño y las mediciones están en `PLAN-RENDIMIENTO-ACTIONS.md`.
