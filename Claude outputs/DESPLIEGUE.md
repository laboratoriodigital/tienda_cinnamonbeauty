# Desplegar una tienda, de punta a punta

**Este documento es el mapa.** Dice todo lo que pasa desde que no existe nada
hasta que el comercio está vendiendo, en orden, y con quién hace cada cosa.

> **Por qué existe.** Había cuatro documentos describiendo tramos de este mismo
> procedimiento —`RUNBOOK.md`, `DESPLIEGUE-CLIENTE.md`, `MONTAJE.md`,
> `INSTALAR.md`— y **ninguno de los cuatro menciona «Publicar ahora»**, que es
> el botón que hace que un cambio de precio llegue a la tienda y que existe
> desde la 2.6.0. Tres todavía hablan de «Confirmado», que dejó de existir en la
> 2.8.0. Es el patrón 2 de la bitácora a escala de documentación: cuatro copias
> del mismo procedimiento, y todas se quedaron atrás.
>
> Este mapa manda. Los otros cuatro quedan como detalle de su tramo, y hay una
> deuda anotada de consolidarlos.

---

## De un vistazo

```
   TÚ                          GITHUB / CLOUDFLARE           GOOGLE
   │
   ├─ 1. repositorio ──────────► desde la plantilla
   ├─ 2. Cloudflare ──────────► apunta a publicar/
   ├─ 3. cuenta + hoja ───────────────────────────────────► hoja del comercio
   ├─ 4. pegar maestro.gs ────────────────────────────────► Apps Script
   ├─ 5. IMPLEMENTAR (1 vez) ─────────────────────────────► la URL /exec
   ├─ 6. abrir esa URL una vez ───────────────────────────► el maestro se sabe
   ├─ 7. A0_instalar() ───────────────────────────────────► pestañas y avisos
   ├─ 8. llenar la hoja (16 claves)
   ├─ 9. A2_diagnosticoCompleto() ─► servicio + token
   ├─ 10. los 5 secretos ──────► del repositorio
   ├─ 11. flujo `montaje` ─────► index.html y catalogo.json
   ├─ 12. A1_generarStub() ───────────────────────────────► pegar en la hoja
   ├─ 13. fotos al Drive ─────────────────────────────────► «Publicar ahora»
   ├─ 14. WhatsApp Business: respuesta automática
   ├─ 15. las cuatro comprobaciones
   └─ 16. entrega
```

El orden **no es negociable** en tres sitios, y los tres cuestan una hora si se
invierten. Están marcados con ⚠ más abajo.

---

## Antes de la primera tienda de tu vida (no por tienda)

- Cuenta de GitHub con la organización, y la plantilla `organico`.
- `npm i -g @google/clasp` y `clasp login` — **con la cuenta dueña de la tienda
  que vas a montar**, no con la tuya.
- Habilitar la API de Apps Script una vez por cuenta:
  `script.google.com/home/usersettings`.
- El repositorio de servicio `laboratoriodigital/tiendas`, donde vive
  `ALTA_TOKEN`. **Ese secreto no se copia a ninguna otra parte.**

Detalle: `RUNBOOK.md` sección A.

---

## 1 · El repositorio de la tienda  · GitHub · ~5 min

Desde la plantilla. Nombre `organico-<comercio>`.

Y **la casilla que se olvida siempre**: Settings → Actions → General →
*Allow GitHub Actions to create and approve pull requests*. Sin ella el flujo
`montaje` corre entero, funciona, y falla en la última línea.

## 2 · Cloudflare  · ~3 min

Conectar el repositorio. Rama de producción `main`, comando de compilación
**vacío**, directorio `publicar/`. Empujar a `main` despliega.

## 3 · La cuenta de Google y la hoja  · ~10 min

**Una cuenta de Google por tienda, creada por ti.** Con tu celular como
recuperación y la contraseña en tu gestor. El comercio es **editor** de la hoja
compartida, no dueño de la cuenta.

Crear la hoja de cálculo en esa cuenta. Copiar su ID de la URL, entre `/d/` y
`/edit`.

## 4 · El maestro  · ~5 min

Apps Script → **proyecto suelto** (no unido a la hoja). Pegar `maestro.gs`
entero y poner el `HOJA_ID` arriba.

## 5 · ⚠ Implementar como aplicación web — **una sola vez en la vida**

Implementar → Nueva implementación → Aplicación web.
**Ejecutar como: Yo · Quién tiene acceso: Cualquier persona.**

> **⚠ Esta es la única vez que se crea una implementación NUEVA.** De aquí en
> adelante, siempre: Implementar → **Gestionar** implementaciones → ✏ → Versión:
> Nueva. Una implementación nueva **estrena URL** y deja la tienda muda.

## 6 · ⚠ Abrir esa URL una vez en el navegador

El maestro **solo puede conocer su propia dirección atendiendo una petición**.
Desde el editor, Google le dice la `/dev`, que no le sirve a nadie más.

Si te saltas esto, el paso 9 dice «TODAVÍA NO SE SABE» y no entiendes por qué.

## 7 · `A0_instalar()` en el editor del maestro

Crea las nueve pestañas, los desplegables, los disparadores y los dos tokens.
Es idempotente: se puede repetir.

> Las funciones que se ejecutan a mano llevan prefijo `A0_`…`A4_` para que
> queden juntas al principio de la lista del editor, y numeradas **en el orden
> en que se necesitan**.

## 8 · Llenar la hoja · ~12 min

Pestaña `Configuración`. **Dieciséis claves**, y el sistema sabe cuáles faltan.

**Cuatro rompen la venta** — sin ellas el flujo `montaje` se niega a publicar:

| | Sin ella |
|---|---|
| `negocio` | la tienda se anuncia con un corchete |
| `whatsapp` | el pedido no llega a ninguna parte |
| `sitio_url` | no funcionan «Ver mi tienda» ni la comprobación de publicación |
| `pago_llave` | **el comprador termina el pedido y no tiene cómo pagar** |

**Doce dejan la tienda a medias** y avisan sin bloquear: `pago_titular`,
`pago_entidad`, `repositorio`, `correo_resumen`, `respaldo_carpeta`,
`sitio_titulo`, `sitio_descripcion` y los `empresa_*`.

Los `empresa_*` alimentan el texto de tratamiento de datos. **La tienda pide
nombre, celular y dirección: eso es tratamiento de datos personales y en
Colombia lo regula la Ley 1581 de 2012.**

## 9 · `A2_diagnosticoCompleto()` — los dos datos del panel

Imprime **Servicio** (la URL `/exec`) y **Token** (el de montaje). Son los dos
únicos datos que el panel no puede adivinar.

> Se ejecuta desde el editor **a propósito**: el Diagnóstico que abre el
> comerciante desde su menú **no** muestra el token de montaje.

## 10 · Los cinco secretos del repositorio

Settings → Secrets and variables → Actions:

| Secreto | De dónde sale |
|---|---|
| `MAESTRO_URL` | paso 9, «Servicio» |
| `MAESTRO_TOKEN` | paso 9, «Token» |
| `SCRIPT_ID` | la URL del proyecto de Apps Script |
| `HOJA_ID` | la URL de la hoja |
| `CLASPRC` | tu `~/.clasprc.json` tras `clasp login` con esa cuenta |

**Son cinco y solo cinco.** Cualquier otro sobra. `ALTA_TOKEN` **no** va aquí.

Y en el panel: una fila en la pestaña `Tiendas` con el comercio, el **Servicio**
y el **Token**.

## 11 · El primer montaje  · Actions · ~5 min de reloj

Actions → `montaje` → Run workflow. Marcar `maestro` **y** escribir `PUBLICAR`.

Hace, en este orden: publica el maestro → escribe `index.html` desde la hoja →
trae las fotos → hornea `catalogo.json` → corre todas las baterías **sobre los
archivos ya modificados** → abre el pull request.

Revisar la vista previa de Cloudflare y fusionar.

## 12 · ⚠ `A1_generarStub()` — y el orden importa

**Genera el stub a partir del maestro que está PUBLICADO**, no del que está en
el repositorio. Hacerlo antes del paso 11 devuelve el stub viejo y parece que la
versión nueva no trae nada.

Copiar lo que imprime → hoja del comercio → Extensiones → Apps Script → pegar
encima de todo → guardar.

**Abrir el menú de la hoja una vez.** Ese clic es lo que deja constancia de que
la hoja ya entra con el token del menú; sin él, el panel no distingue una hoja
migrada de una que nadie ha tocado.

## 13 · Las fotos

Al Drive de la cuenta de la tienda, en la carpeta que diga
`Configuración > fotos_drive`, **con el nombre exacto** que lleve la columna
`Imágenes` del catálogo, mayúsculas incluidas. Formatos: JPG, PNG, WebP.

Después, menú de la hoja → **Publicar ahora**.

> Si el flujo dice «nada nuevo» y tú acabas de subir fotos, el resumen del paso
> trae ahora **cuántas ve el maestro en la carpeta** y **cuáles nombra la hoja
> sin tenerlas**. Casi siempre es la carpeta equivocada o el nombre que no
> coincide.

## 14 · WhatsApp Business — la respuesta automática

**Es el único paso donde el diseño de seguridad se convierte en un agujero
funcional si se olvida.** La llave de pago no está en la página a propósito: el
comprador la recibe por el chat. Si el mensaje no está puesto, **termina el
pedido y no tiene cómo pagar**.

WhatsApp Business → Herramientas para la empresa → Mensaje de ausencia. El texto
sale de `pago_texto`, o se arma con `pago_llave`, `pago_titular` y
`pago_entidad`.

## 15 · Las cuatro comprobaciones, antes de entregar

1. **Diagnóstico** (menú de la hoja). Punto 2: *«las 16 claves del alta están
   llenas»*. Punto 1: la versión del maestro coincide con la etiqueta.
2. **Panel**: la fila de este comercio, con **Sin terminar** en blanco y **Stub
   en la hoja** diciendo *al día*.
3. **Un pedido de punta a punta, con un teléfono que no sea el del comercio**:
   pedido → WhatsApp → respuesta automática → transferencia → **Pagado** en la
   hoja → el stock baja. Todo lo demás está probado en automático; esto prueba
   la costura.
4. **Apagar el maestro un minuto y hacer un pedido.** Lo que no puede pasar es
   que el botón no haga nada. Que el pedido no quede en la hoja es recuperable
   —la tienda lo reenvía cuando el comprador vuelve—; que el botón no responda
   es una venta perdida.

## 16 · La entrega

- La **guía de una página** impresa (`docs/manuales/Guia-de-una-pagina.html`).
  Es lo que se explica; el manual del dueño es para después.
- El **manual del dueño**, en PDF.
- Compartir la hoja con el correo del comercio **como editor**.
- Enseñarle las tres cosas del día a día: cambiar un precio → **Publicar
  ahora**; pedido nuevo → **Pagado**; algo raro → **Diagnóstico**.

El menú de su hoja tiene seis opciones, y conviene nombrárselas todas una vez:

| | |
|---|---|
| **Publicar ahora** | manda a la tienda lo que cambió. La que más se usa |
| **Ver mi tienda** | la abre como la ve un comprador |
| **Actualizar tablero e inventario** | recalcula ya, sin esperar la hora |
| **Enviarme el resumen ahora** | manda el correo del día en el momento |
| **Diagnóstico** | revisa todo y dice qué está mal y dónde |
| **Ayuda** | las preguntas de siempre, contestadas |

> **Si explicar esto toma más de 30 minutos, el hallazgo es de diseño, no del
> comerciante. Anótalo.**

---

## Después: qué corre solo y qué se opera

| Cuándo | Qué |
|---|---|
| cada 4 h | flujo `fotos`: hornea el catálogo y trae fotos nuevas |
| lunes 6:00 | flujo `montaje` completo |
| cada hora | tablero e inventario |
| domingos 2:00 | respaldo de la hoja |
| a diario, el comercio | precios y stock → **Publicar ahora**; pedidos → **Pagado** |
| cuando cambie el maestro | `ACTUALIZAR-UNA-TIENDA.md` |

---

## Los tres sitios donde el orden cuesta una hora

1. **Implementar una vez, actualizar siempre.** Una implementación nueva estrena
   URL y deja la tienda muda.
2. **Abrir la `/exec` una vez** antes de pedir los datos del panel.
3. **Generar el stub DESPUÉS de publicar el maestro.** Antes devuelve el viejo, y
   parece que la versión nueva no trae nada.

## Y uno que solo aparece al rotar el token

`A3_rotarToken()` cambia el token de montaje. Hay que llevarlo a **TRES** sitios:
el secreto `MAESTRO_TOKEN`, **la pestaña `Tiendas` del panel** y el `tienda.json`
local. Si se olvida el del panel, el panel marca esa tienda como caída y le vacía
las métricas — y la tienda está perfecta.
