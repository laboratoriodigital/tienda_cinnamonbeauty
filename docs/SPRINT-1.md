# Sprint 1 — Congelar contratos

**Meta: que a partir de aquí un cambio no pueda romper N tiendas a la vez.**

Empezado el 9 de septiembre de 2026, con Sprint 0 en 7 de 9 —falta el pedido de
punta a punta, que es tuyo, y lo legal—. Se arranca en paralelo a propósito:
**nada de este sprint se despliega**. Es documento y aserciones sobre lo que ya
corre, así que no puede tumbar la tienda mientras haces la prueba del pedido.

---

## Tablero

| # | Historia | Estado | Quién |
|---|---|---|---|
| S1-1 | El contrato de datos, como documento normativo | ✅ `docs/CONTRATOS.md` | — |
| S1-2 | Congelar el esquema con una aserción derivada del código | ✅ `pruebas/esquema.js` + `esquema.json` | — |
| S1-3 | `esquema` y `generado` en lo que publica cada puerta | ✅ `ESQUEMA = 1`, separado de `VERSION` | — |
| S1-4 | La vitrina rechaza un esquema desconocido y conserva el último bueno | ✅ `esquemaEntendido()` | — |
| S1-5 | Columnas nuevas al final: `Referencia`, `Precio antes`, `Umbral bajo`, `Fecha de pago`, `Fecha de despacho`, `Guía` | ✅ con `asegurarColumnas` | — |
| S1-6 | Claves nuevas de `Configuración`: pago, envío gratis, horario | ✅ y las `pago_*` **no salen** por la puerta pública | — |
| S1-7 | **La vitrina avisa cuando está sirviendo el catálogo del archivo** | ✅ aviso visible, no solo consola | — |
| S1-8 | **La página usa `envioNombre` del sello, no el suyo** | ✅ `nombreEnvio()` | — |
| S1-9 | ~~Las tarjetas avisan cuando su precio no es el del sello~~ | ⛔ **Retirada** — el hueco no existía: ver abajo | — |
| S1-10 | **Una celda que no se puede leer como número deja de valer 0 en silencio** | ✅ `cifra()` y `cifraDeTexto()`, con la celda exacta | — |
| S1-11 | El acta de `Validaciones` guarda también los avisos | ✅ columna `Avisos` | — |
| S1-12 | **Un envío vacío cuesta 0 y no avisa**; y el id distingue mayúsculas | ✅ avisa siempre, y el id se rescata anotándolo | — |
| S1-13 | **El acta se congela antes de que llegue el último sello** | ✅ la escribe quien registra | — |

**Avance: 12 de 13, y la trece se retiró porque el hueco no existía.** Todo lo
que toca `maestro.gs` y `publicar/index.html` va agrupado: **un solo despliegue,
no doce**, que es la regla del propio plan.

**Versión 2.3.0 · esquema 1 · `VERSION = 2026-09-08-1`.** Menor y no mayor
porque una tienda que no se actualice **sigue funcionando**: las columnas nuevas
las agrega `instalar()` al final, todas las claves nuevas pueden estar vacías, y
el `sub` que ahora manda el registro se conserva del acta anterior si no llega.
Eso es R3 del contrato cumpliéndose la primera vez que hizo falta.

---

## Cómo se publica esto — un solo despliegue

En este orden, que importa: si la página sale antes que el maestro, avisa que la
hoja responde otra versión.

1. **`git push`** con todo esto.
2. **Flujo `release`** — publica `v2.3.0`.
3. **Flujo `montaje`**, marcando **`maestro`** y escribiendo `PUBLICAR`. Publica
   el maestro y abre el pull request del `index.html`.
4. **Fusionar el pull request.** Cloudflare despliega solo.
5. **En la hoja: menú → Actualizar…** no; esta vez hay que **volver a ejecutar
   `instalar()`** en el editor del maestro, que es lo que agrega las columnas
   nuevas y las claves nuevas. No toca ningún valor escrito.
6. **El stub NO hace falta esta vez**: no cambió.

**Cómo se comprueba, y elegido para que no dé lo mismo antes y después:**

| Señal | Dónde |
|---|---|
| La pestaña `Catálogo` termina en `Referencia · Precio antes · Umbral bajo` | en la hoja |
| `Validaciones` termina en una columna `Avisos` | en la hoja |
| `Configuración` tiene `pago_llave` y `horario` | en la hoja |
| Un pedido de prueba deja el acta con el **mismo total** que `Pedidos` | tras pedir |
| `organico.…/` → consola → no dice nada de esquema | en el navegador |

---

## S1-1 · El contrato, escrito

`docs/CONTRATOS.md`. Lo que trae, y por qué cada parte:

- **Las tres reglas.** Solo se agrega y solo al final; prohibido renombrar y
  reordenar; todo campo nuevo es opcional. La tercera es la que más cuesta y la
  que más salva: durante meses el campo nuevo **no va a estar** en la mayoría de
  las hojas.
- **Las nueve pestañas con sus columnas numeradas.** La posición es parte del
  contrato, no un detalle: `escribirConfiguracion()` ubica la fila por posición
  justamente para no pisar lo que el comerciante escribió.
- **Las 31 claves de `Configuración`**, agrupadas por para qué sirven.
- **Lo que sale por cada puerta**, que es el contrato que de verdad importa: una
  tienda sin actualizar sigue leyendo esos nombres desde un servidor nuevo.
  Quitar uno rompe, desde el servidor, una tienda que nadie tocó.

## S1-2 · El esquema, congelado

`pruebas/esquema.js` **no describe** el esquema: lo lee corriendo `instalar()` en
el emulador —el mismo código que corre en la hoja de verdad— y lo compara contra
la foto de `pruebas/esquema.json`.

- Agregar al final: pasa, y **anuncia** qué se agregó.
- Renombrar, mover o quitar: falla, con el antes y el después.
- Y comprueba que `CONTRATOS.md` nombre las nueve pestañas, todas sus columnas y
  todas las claves. Si el código cambia y el documento no, no pasa.

Cuando el cambio es deliberado: `node esquema.js --congelar`. Reescribe la foto,
y **queda en el diff del commit**, que es donde alguien tiene que verlo.

> **Se probó al revés antes de darla por buena.** Se renombró `Precio` a mano en
> la foto y la batería lo cazó; se quitó un campo de `?a=catalogo` y también.
> Una aserción que nunca se vio fallar no se sabe si sirve.

---

## Hallazgo que entra al sprint: el respaldo no grita

Salió midiendo la parte B de S0-2, y es del tipo que más caro sale en este
proyecto. Con el maestro **completamente caído** —sin una sola respuesta— la
vitrina cae al catálogo del archivo y **no dice nada**. El comprador ve precios
que podrían ser de hace un mes con la misma cara de siempre.

Mirando `publicar/index.html`, el banner del carrito se decide así:

| Estado | Qué ve el comprador |
|---|---|
| Validando | «Validando tu pedido…» |
| Sello vigente | «Total verificado con la tienda» |
| Hubo respuesta pero el sello no sirve | «Estamos confirmando los precios de hoy…» |
| **Ninguna respuesta** | **nada** |

La última fila es el caso del maestro caído, y es justo el único donde el aviso
haría falta. La marca existe, pero solo en el mensaje de WhatsApp —*«Total
calculado por la página…»*—, es decir: **le avisa al comerciante, no al
comprador.**

> Es el patrón 1 de la bitácora en su forma más literal: *todo lo que cae a un
> respaldo tiene que gritar, o el respaldo se convierte en el estado normal.*
> Aquí el respaldo funciona y no grita.

**Entra como S1-7**, junto a S1-4 —que es el mismo problema con el esquema: caer
a lo último bueno, sí, pero diciéndolo—. Se resuelven juntas porque son la misma
regla aplicada a dos capas.

### Y dos más, de una caída parcial que nadie planeó

El segundo intento de la parte B bloqueó **solo** `?a=catalogo` y dejó pasar
`?a=validar` y `?a=registrar`. Como prueba de «maestro caído» no sirvió, pero
midió un estado que no estaba en ningún plan: **catálogo abajo, validación
arriba**. Y no es rebuscado — un `fetch` que expira mientras los otros responden
es de lo más común que hay.

**S1-8 · `envioNombre` se devuelve y no se usa.** El maestro lo manda en el
sello; la página escribe el nombre que ella tenía y el valor que trajo el sello.
Cuando la hoja no reconoce el envío contesta `valor: 0` y `nombre: 'Por
confirmar'` **a propósito** —el comentario del código lo dice: *«mejor decirlo
que cobrar cero en silencio»*—, pero el aviso se pierde en el camino y el
comprador lee **su** zona con costo cero. El maestro hace bien su parte; la
página descarta la mitad del mensaje.

> Es la primera vez que el contrato de datos sirve para algo concreto: un campo
> publicado que nadie consume no es un campo de más, es una promesa a medias.

**S1-9 · RETIRADA. Me equivoqué al leer el código, y hay que decirlo.** Dije que
con el catálogo caído «el carrito se corrige solo y las tarjetas no», dejando al
comprador con `$8.900` arriba y otra cifra abajo. **Ese hueco no existe.**
`calcular()` usa los números del sello solo si `selloVigente()`, y esa función
exige, además de la firma, que **`sello.sub === subtotal()`**:

```js
function selloVigente(){
  return !!(sello && versionCoincide() &&
            sello.firma === firmaPedido() && sello.sub === subtotal());
}
```

Si el archivo y la hoja no coinciden en el subtotal, el sello **se descarta
entero** y la página vuelve a sus propios números. Nunca hay una mitad de cada
uno. Alguien puso esa guarda a propósito y funciona.

Lo que sí queda de aquella observación es la parte que S1-7 arregla: **el
comprador no se enteraba** de que estaba viendo el catálogo del archivo, y por
eso el sello no validaba nunca y el pedido salía «sin validar» sin explicación.
La causa se nombra ahora; el desajuste de cifras nunca ocurrió.

> Se agrega una aserción para que esa guarda no se pierda por descuido: hoy es
> lo único que impide mezclar precios de dos fuentes en un mismo total.

> **Refuerza el Sprint 2.** El catálogo estático elimina esta clase entera de
> problema: si la lista se genera al publicar, no puede estar más vieja que la
> hoja sin que el despliegue lo sepa.

### S1-10 · `Number(celda) || 0`, o cómo un formato de celda regala plata

Tirando del hilo de «no trajo el valor de envío» apareció algo más grande que el
envío. El maestro lee así **todas** las cifras que el comerciante escribe:

```js
precio: Number(f[4]) || 0
valor:  Number(f[2]) || 0        // envío
minimo: Number(fila[3]) || 0     // cupón
maximos: Number(fila[5]) || 0    // usos del cupón
```

`getValues()` devuelve un **número** si la celda es numérica y un **texto** si
no. Y `Number('$9.000')` es `NaN`, que `|| 0` convierte en cero. `Number('9,000')`
también. `Number('9.000')` no es cero: **es 9**.

Escribir `$9.000` o `9,000` en una celda es lo más natural del mundo para quien
lleva su negocio en una hoja de cálculo. Lo que pasa después, sin un solo aviso:

| Celda ilegible | Consecuencia |
|---|---|
| `Catálogo · Precio` | **el producto sale gratis** |
| `Envíos · Valor` | **el envío sale gratis** |
| `Cupones · Mínimo` | el cupón se aplica a cualquier compra |
| `Cupones · Usos máximos` | `0` significa **sin tope**: un cupón limitado pasa a ser ilimitado |

Las cuatro empujan en la misma dirección —contra el comerciante— y ninguna falla.
Es el patrón 1 en su forma más cara: **`|| 0` convierte «no se pudo leer» en
«es gratis»**, y las dos cosas no se parecen en nada.

**Lo que hay que hacer:** distinguir *vacío* —que sí puede ser 0— de *ilegible*.
Lo ilegible tiene que gritar por los tres canales que ya existen: un aviso al
comprador, una fila en `Errores`, y un punto del Diagnóstico con **fila y
columna exactas**, que es justo lo que el Sprint 5 ya pedía.

### S1-11 · El acta no guarda los avisos

Y esto se descubrió porque **no se pudo responder una pregunta sencilla**. La
fila de `M4467` en `Validaciones` dice:

```
8/9/2026 17:00:11 · M4467 · (sin cupón) · 8900 · 8900 · · 0 · 0 · 8900 · chonto x1
```

Envío en **0**, total igual al subtotal. Pero el acta **no registra los `avisos`
que el maestro generó**: la columna `Detalle` guarda solo las líneas del pedido.
Así que la fila no distingue entre «el cliente eligió recoger en finca» —correcto—
y «la hoja no reconoció el envío y avisó» —un problema—.

> El instrumento que tenía que contestar la pregunta no la contestó. Un acta que
> no guarda las advertencias no es un acta: es un recibo.

### Lo que sí quedó medido, corriendo el maestro en el emulador

En vez de seguir adivinando, se le preguntó al código. `?a=validar` con
`items=chonto:1&sub=8900` y distintos envíos:

| `envio=` | valor | nombre | aviso |
|---|---|---|---|
| `medellin` | 9000 | Medellín y Valle de Aburrá | — |
| `finca` | 0 | Recoger en finca (Rionegro) | — |
| `MEDELLIN` | **0** | Por confirmar | sí |
| `" medellin"` | 9000 | Medellín y Valle de Aburrá | — |
| `inexistente` | **0** | Por confirmar | sí |
| `""` **(vacío)** | **0** | Por confirmar | **NO** |

Dos cosas de aquí:

**El id distingue mayúsculas.** `MEDELLIN` no es `medellin`. Los espacios sí se
recortan, las mayúsculas no. Si alguien escribe el ID en mayúscula en la hoja
`Envíos`, el envío deja de reconocerse.

**Y el último renglón es un defecto.** Con el envío **vacío** el costo es 0 y
**no se genera ningún aviso**, porque el código dice `if (idEnvio)
avisos.push(...)`: solo avisa cuando el id existe pero no se reconoce. El caso
peor —no llega ningún envío— es justo el único que pasa callado. **Envío gratis
en silencio**, otra vez la misma familia que S1-10.

> La fila de `M4467` —envío 0, total igual al subtotal, sin discrepancia— encaja
> **igual de bien** con «el cliente eligió recoger en finca» que con «llegó el
> envío vacío». Y como el acta no guarda avisos (S1-11), no hay forma de saber
> cuál fue. Se sabrá con el texto del mensaje de WhatsApp, que sí nombra la zona.

**Detalle menor, anotado para no perderlo:** `cambiarEnvio()` llama a
`refrescar(true)`, y `refrescar()` no recibe parámetros. El argumento se ignora
en silencio. Hoy no hace daño —`refrescar()` siempre pide el sello— pero es una
intención escrita que el código no cumple.

---

## S1-13 · **El acta se congela antes de que llegue el último sello** 🔴

Confirmado, no supuesto: **reproducido en el emulador, fila por fila.** El
mensaje de WhatsApp llegó con el envío correcto y la hoja lo guardó en 0. Las
dos cosas son ciertas a la vez, y esta es la razón.

**La secuencia.** El sello va con 400 ms de espera —para no pedir uno por cada
clic—, y `registrar` sale **de inmediato** al pulsar WhatsApp. Si el cliente
cambia la zona de envío y pulsa enseguida, el orden real es:

1. Había un sello viejo (zona anterior). Escribió la fila de `Validaciones`.
2. El cliente cambia de zona → se programa un sello nuevo, dentro de 400 ms.
3. El cliente pulsa **Enviar por WhatsApp** → `registrar` sale ya, revalida por
   su cuenta con la zona **nueva** y marca el pedido como registrado.
4. Llega el sello nuevo, correcto… y el escritor del acta lo **descarta**,
   porque `yaRegistrado(codigo)` ya es verdad.

**La reproducción, con los mismos números de `M4467`:**

```
1) sello con envio=finca
   Validaciones: M4467 · 8900 · 8900 · · 0 · 0 · 8900 · chonto x1
2) el cliente cambia a medellin y pulsa WhatsApp: registrar sale primero
   {ok:true, lineas:1}
3) llega el sello nuevo, ya con medellin  ->  envio = 9000
   Validaciones: M4467 · 8900 · 8900 · · 0 · 0 · 8900 · chonto x1   <- SIN CAMBIAR
   Pedidos:      M4467 · ... · 8900 · 8900 · 17900                  <- correcto
```

Es **exactamente** la fila que salió en producción.

**Por qué importa, aunque el dinero esté bien.** `Pedidos` cobra los $17.900
correctos y el comprador recibió el mensaje correcto. Lo que queda mal es el
**acta**, que es precisamente la prueba de cuánto valía el pedido cuando se
envió y el instrumento que detecta discrepancias. Un acta equivocada no es un
detalle contable: es el testigo declarando otra cosa.

**Y la ironía está en el origen.** El congelamiento existe por una buena razón,
escrita en el propio código: *«su validación queda congelada: es la prueba de
cuánto valía cuando se envió y nadie debe poder reescribirla después»*. La
protección es correcta; lo que está mal es **cuándo** se activa: congela antes
de que haya llegado lo que tenía que congelar.

**El arreglo, y es de una sola pieza.** `registrarPedido()` **ya revalida** —esa
es la validación autorizada, la que produjo el total que se guardó—. Que escriba
él mismo el acta con su propio resultado, y solo entonces marque el pedido como
registrado. Así el acta y la fila de `Pedidos` salen de **la misma** validación,
que es la regla del patrón 2: una sola fuente, lo demás se deriva.

> Toca `maestro.gs`, así que sube versión y pide publicar. Se agrupa con S1-3 a
> S1-6, que también lo tocan: **un solo despliegue, no cinco.**

---

## Bitácora del sprint

**9 de septiembre de 2026**

**Al escribir la batería 20 apareció el mismo error por tercera vez.** El número
de baterías estaba escrito a mano en seis archivos. Primero fue «758
aserciones», que se cambió a «las 19 baterías» creyendo que eso ya no caducaba
—y caducó al escribir la 20—. Ahora se dice **«todas las baterías»**, y una
aserción impide volver a escribir la cifra.

**Y apareció una batería que nunca se corría.** `pruebas/limites.js` no está en
`todas.sh`. Resultó ser correcto —no es una batería, es un cronómetro: siembra
catálogos de 50 a 1.000 productos y mide—, pero el hecho de que hiciera falta
mirarlo a mano es el problema. Ahora la aserción define qué es una batería por
lo que hace, no por una lista: **un `.js` de `pruebas/` que imprime su
marcador**. Si alguien escribe una y se olvida de listarla, falla.

> Es el mismo hueco por el que se coló `sec2.js` leyendo un archivo congelado
> durante semanas. Una batería escrita y no corrida es peor que ninguna: ocupa
> el lugar de la que sí habría que escribir.
