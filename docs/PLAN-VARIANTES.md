# Plan de variantes de producto

Estado: **fases 1 y 2 implementadas en Orgánico; pendiente despliegue y prueba real**.
Fecha: 20 de septiembre de 2026.

En Cinnamon Beauty el código de ambas fases ya se integró en el repositorio
3.6.1. El catálogo actual no declara variantes: seguirá vendiendo sus
productos tradicionales sin migración obligatoria. Antes de usar tallas o
colores, publica el maestro, ejecuta `A0_instalar()` y `A1_generarStub()` en
el Apps Script propio, carga el stock por combinación en la hoja `Variantes`
y prueba una compra sandbox. La integración local no equivale todavía a una
prueba real en esta tienda.

## Objetivo

Un producto puede ofrecer Color, Talla u otras opciones sin compartir el
inventario entre combinaciones. `Camiseta / Azul / S` y `Camiseta / Verde / M`
son dos unidades de inventario distintas, aunque ambas pertenezcan al mismo
producto del `Catálogo`.

## Contrato de captura

La columna final `Catálogo.Variantes` declara los ejes visibles:

```text
Color: Azul|Verde; Talla: S|M|L
```

- `;` separa ejes; `|` separa valores; `:` separa nombre y valores.
- Máximo: tres ejes, veinte valores por eje y cien combinaciones.
- Los separadores no pueden formar parte de nombres o valores.
- Una celda vacía conserva el producto tradicional.
- Una definición inválida falla cerrada: no usa el stock general como rescate.

El menú **Sincronizar variantes** crea en la pestaña `Variantes` una fila por
combinación. No borra historial ni reescribe stock, SKU o precios existentes.
Las combinaciones retiradas se marcan `Activo = No`.

## Fuente de verdad

`Variantes` contiene `Variante ID`, `Producto ID`, `SKU`, `Opciones`, `Precio`,
`Stock`, `Activo` e `Imágenes`.

- `Variante ID` es técnico, estable e inmutable.
- `SKU` identifica la combinación para el comercio.
- `Precio` vacío hereda `Catálogo.Precio`; un número lo sobrescribe.
- `Stock` es físico por combinación.
- En productos variables, `Catálogo.Stock` es solo el total sincronizado.

El carrito y el servidor intercambian `{id, variante, cantidad}`. Apps Script
resuelve precio, existencia, opciones y pertenencia; nunca acepta esos datos
del navegador. Pedidos agrega al final `Variante ID`, `SKU` y `Opciones`.

## Inventario y pago

La pestaña privada `Reservas` evita vender dos veces la última unidad. Al crear
el checkout se reserva la clave `v:<Variante ID>` —o `p:<Producto ID>` para un
producto tradicional—. `APPROVED` descuenta stock y consume la reserva;
`REJECTED` o `EXPIRED` la libera. La confirmación y el movimiento siguen bajo
`LockService` y conservan la marca idempotente de `Pedidos.Inventario`.

El catálogo público expone disponibilidad, no stock físico: físico menos
reservas activas. `Pagos.Items`, correo y WhatsApp conservan SKU y opciones.

## Experiencia de compra

- La tarjeta de un producto variable dice **Elegir opciones**.
- La ficha exige completar todos los ejes.
- Las combinaciones inexistentes o agotadas se deshabilitan.
- Cada variante ocupa una línea distinta en el carrito.
- Cantidad, subtotal y máximo disponible se calculan por variante.
- El mismo producto puede tener precios distintos por combinación.

## Fase 2 · imágenes por variante — implementada

- `Variantes.Imágenes` admite hasta seis nombres o URL separados por `|`.
- Una celda vacía hereda la galería general del producto.
- Al completar una combinación la ficha y el carrito usan su galería; si la
  selección vuelve a estar incompleta, regresan a la general.
- El texto alternativo combina producto, opciones y posición.
- Los enlaces compartidos agregan `v=<Variante ID>` y restauran la combinación.
- El montaje detecta, descarga, convierte y manifiesta también las fotos de SKU.
- El catálogo estático y el respaldo conservan el arreglo `imagenes` de cada
  variante, sin cambiar precio, reserva ni inventario.

No se agregará una segunda sintaxis dentro de `Catálogo.Variantes`: imágenes y
precios viven en la fila del SKU, donde también vive su inventario.

## Pruebas y despliegue

La batería cubre parser, generación estable, precio heredado/específico,
rechazo de producto variable sin variante, reserva, pago aprobado, columnas de
pedido, descuento de un solo SKU, idempotencia, imágenes propias/heredadas,
enlace directo y carrito con dos combinaciones.

Orden de salida:

1. Orgánico: pruebas automáticas, `A0_instalar`, publicación y compra sandbox.
2. Panadería: réplica únicamente después de validar Orgánico.
3. Cinnamon: réplica únicamente después de validar Panadería.

Una tienda sin contenido en `Catálogo.Variantes` conserva todos sus flujos
anteriores. No se requiere migrar productos existentes para publicar el código.
