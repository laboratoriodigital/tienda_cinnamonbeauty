# Sprint 6 — Pedido y pago

**Meta: el ciclo completo de la venta, y no prometer pagos imposibles.**

## Tablero

| | | |
|---|---|---|
| S6-1 | Los seis estados, con convivencia y migración | ✅ |
| S6-2 | El inventario se descuenta **al pagar**, y solo ahí | ✅ |
| S6-3 | Tope por operación, avisado en el carrito | ✅ |
| S6-4 | Llave Bre-B en la configuración | ✅ ya estaba desde la 2.4.0 |
| S6-5 | Los pedidos que no llegan a la hoja: rescatarlos y contarlos | ✅ y el plan queda corregido |

---

## S6-1 · Seis estados, y por qué tres no bastaban

Eran tres —Por confirmar, Confirmado, Anulado— y describían mal lo que pasa.
Entre «me llegó» y «lo pagó» hay una espera que el comercio vive todos los días,
y entre «lo pagó» y «lo recibió» hay dos pasos más. **Un pedido pagado sin
despachar y uno ya entregado se veían iguales.**

| Estado | ¿Descuenta inventario? |
|---|---|
| Nuevo | no |
| Pendiente de pago | no |
| **Pagado** | **sí, y es el único que lo hace** |
| Despachado | sigue descontado |
| Entregado | sigue descontado |
| Cancelado | devuelve |

### Convivencia, y por qué la migración no es opcional

Cada estado nuevo sabe a qué viejo reemplaza, así que una hoja que todavía diga
«Confirmado» se lee bien. Eso permite desplegar sin apagarle el inventario a
nadie.

Pero la lista desplegable de la columna Estado **no admite otros valores**
—`permitirOtros: false`, y está así a propósito desde hace tiempo—. Con la lista
cerrada, una hoja sin migrar quedaría con todas sus filas históricas marcadas
como inválidas. Por eso `instalar()` llama a `migrarEstados()`, que reescribe
los tres viejos y **nada más**: una celda con otra cosa se queda como está.

> Una migración que «arregla» lo que no entiende es lo peor que puede hacer.

Y las baterías de arriba de `pedidos.js` siguen escritas con el vocabulario
viejo, a propósito: son la prueba de que la convivencia funciona.

### Una errata en el Estado ya no resucita inventario vendido

Antes, cualquier cosa que no dijera «confirmado» **devolvía el stock al
catálogo**. Escribir mal la celda de una venta ya pagada revivía unidades que ya
no existen, en silencio, y el catálogo pasaba a ofrecer lo que no tiene.

Ahora un estado que no se reconoce **no toca nada** y sale en el Diagnóstico con
su fila y con lo que dice la celda. Quedarse quieto es reversible; devolver
stock vendido, no. Una celda vacía no se denuncia: es una fila a medio escribir,
que en una hoja de cálculo pasa todo el rato.

### Y la regla dejó de estar escrita dos veces

«¿Esto ya se vendió?» vivía en dos sitios —las métricas y el inventario— con la
misma frase copiada, `indexOf('confirmado')`. Patrón 2 de la bitácora: basta
tocar una para que el tablero y el stock empiecen a contar cosas distintas. Ahora
hay una tabla y una función, `esVenta()`, y de esa tabla sale también el
desplegable de la hoja.

De paso, comparar por trozos daba por vendido «Confirmado el pago» y también
«pendiente de confirmado». Ahora se compara el texto entero, sin tildes ni
mayúsculas, pero **sin adivinar**.

---

## S6-3 · El tope, avisado donde sirve

El tope por transferencia son **1.000 UVB** —en 2026, $12.110.000— y **se
reindexa cada diciembre**, así que sale de la hoja (`pago_tope`) y no del código.

**Se avisa en el carrito, no al abrir WhatsApp.** Enterarse con el pedido ya
armado y el mensaje escrito es enterarse tarde.

```
Este pedido pasa de $12.110.000, que es el máximo por transferencia.
Quita algo del carrito o escríbenos por WhatsApp para dividirlo en dos pagos.
Consulta también con tu banco: el tuyo puede tener un tope más bajo.
```

Esa última frase no es un adorno. **Este es el tope del sistema; la entidad del
comprador puede tener uno más bajo.** Prometerle que por debajo de esta cifra le
va a pasar es prometer algo que no depende de nosotros.

### El filtro de las claves de pago no se tocó

El tope tiene que llegar a la página, pero las claves `pago_*` no salen de la
hoja —esa regla está aplicada **dos veces**, en el maestro y al hornear el
archivo estático, justamente para que un descuido en una no baste—.

La primera versión de esto abría una excepción al prefijo. Mala idea: **una
excepción hay que acordarse de repetirla en los dos filtros**, y un filtro con
excepciones deja de ser una regla y pasa a ser una lista que alguien mantiene.

Así que el prefijo sigue siendo absoluto y el tope **sale con otro nombre**:
`tope_pago`. La clave de la hoja no se renombra —se llama `pago_tope` desde la
2.4.0 y renombrarla rompería todas las tiendas, R2 del contrato— y lo que se
publica es un campo nuevo, que es una adición.

### El fallo que solo se veía en producción

El horneado pasa toda la configuración por `String()`. Así que el tope llega
como **número** por `?a=catalogo` y como **texto** por `catalogo.json` — que es
el camino normal.

La primera versión comprobaba `typeof c.tope_pago === "number"`: funcionaba
contra el maestro, y contra el archivo publicado **fallaba en silencio dejando
el tope en cero**, o sea sin tope. La batería de extremo a extremo no lo veía
porque habla con el maestro.

Ahora la página convierte en vez de exigir un tipo, y hay una aserción que mide
las dos formas.

---

## S6-4 · La llave Bre-B ya estaba

`pago_llave`, `pago_titular`, `pago_entidad` y `pago_texto` están en la semilla
de `Configuración` desde la 2.4.0, y las cuatro quedan fuera de todo lo que se
publica.

**No van en la página ni en el repositorio.** Una llave Bre-B en un archivo
estático es una invitación a copiarla en una tienda falsa con el mismo aspecto.
El comprador la recibe por la respuesta automática de WhatsApp, después de que
el comercio confirma, que es donde hay una persona detrás.

Lo que falta es **configurar esa respuesta automática en WhatsApp Business**, y
eso no es código: es un paso del montaje.

---

## S6-5 · El pedido perdido no se pierde, y queda contado

El plan decía:

> Pedido `TMP-` cuando el registro falla: **ya está, y se queda**. Se le añade la
> métrica, porque cada `TMP-` es un fallo de backend que alguien absorbió a mano.

**«Ya está» no era cierto: no hay ningún `TMP-` en el código** — la palabra
aparecía únicamente en esa línea del plan. Pero el modo de fallo sí existía, y
resultó ser más interesante que la métrica que pedía.

### La pregunta correcta no era «cuántos», era «por qué se pierden»

El número del pedido lo pone la página, el mensaje de WhatsApp sale siempre, y
el registro en la hoja va aparte. Si el maestro no contesta y se agotan los
reintentos, **el comercio ve el chat y no ve el pedido**.

Contar eso no se puede desde ningún sitio obvio: cuando el registro falla, lo
que falla es justamente donde habría que anotarlo, y desde la hoja un acta sin
fila en `Pedidos` es tanto un registro fallido como un carrito abandonado — y
los abandonados son la mayoría.

El único sitio que sabe que el comprador **pulsó enviar** y que el registro
**falló** es su propio navegador. Y si el navegador lo sabe, puede guardarlo — y
entonces el pedido deja de perderse, que vale bastante más que contarlo.

### Cómo funciona

```
maestro caído → se agotan los reintentos → el pedido va a la bandeja
                                            (localStorage del comprador)
el comprador vuelve a abrir la tienda → el catálogo llega, o sea que el
maestro contesta → se reenvía con `tarde=<minutos>` → entra en la hoja
```

El maestro ya descarta los códigos repetidos, así que reenviar es seguro. La
bandeja caduca a los siete días y guarda cinco pedidos como mucho: una bandeja
que crece para siempre deja de ser una bandeja.

**Qué se guarda:** exactamente lo que ya viajaba en el registro —código,
productos, envío, cupón, subtotal y ciudad—. **No** el nombre, el celular ni la
dirección: esos nunca fueron por ahí, van por WhatsApp. Y vive en el dispositivo
del propio comprador, para que no se pierda **su** pedido. La decisión completa
está en `DECISIONES.md 04`.

**Todo entre `try/catch`.** En incógnito o con el almacenamiento bloqueado,
`localStorage` no devuelve vacío: **lanza**. Una tienda que revienta al abrirse
por querer recordar un pedido de la semana pasada es peor que una tienda que se
olvida.

### Y la métrica sale gratis

Que el pedido llegue no borra que estuvo perdido: hubo un rato en que el
comercio veía el chat y no veía la fila. Así que cada rescate se cuenta, **con
el peor tiempo al lado** — porque el número solo no distingue un tropiezo de red
de una caída larga:

```
Pedidos que llegaron TARDE: 2   ·   el que más tardó: 2 días
   Son pedidos que salieron por WhatsApp y no llegaron a la hoja en su
   momento: la tienda los recuperó cuando el comprador volvió a abrirla.
   Más de una hora quiere decir que esta tienda estuvo caída un buen rato.
```

En el panel va como columna **Rescatados**, y ahí importa más: un comercio ve el
suyo y no sabe si es normal; **el operador ve si es una tienda o son todas — y
si son todas, el problema no es de ninguna.**

### Lo que esto NO mide, dicho aquí para que no se lea de más

**Si el comprador no vuelve a abrir la tienda, su pedido no se recupera nunca y
no aparece en ningún contador.** Lo que se cuenta es el subconjunto recuperable.
El número real de pedidos perdidos es mayor que el que sale.

### Un hallazgo de paso: el `reiniciar()` del emulador no reiniciaba

Al probar el contador, salía en 2 donde debía salir en 1. No era el contador:
`gas.reiniciar()` limpiaba las hojas, la caché y los disparadores, y **dejaba
vivas las propiedades del script**. Una tienda con las hojas borradas y las
propiedades intactas no es una tienda nueva: es una tienda a medio borrar.

Eso hacía que un contador se arrastrara de una batería a la siguiente, y **una
prueba que depende de la que corrió antes falla según el orden**, que es el peor
rojo que hay: aparece y desaparece sin que nadie toque nada. Corregido, y las
baterías siguen en verde — que era la duda razonable al tocar algo que usan
todas.
