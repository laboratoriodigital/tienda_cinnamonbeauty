# Sprint 0 — la semilla, y las dudas que cuestan una hora

**Meta:** Orgánico vendiendo con la versión del repositorio, y ningún supuesto
sin verificar antes de empezar a migrar.

**Por qué este sprint no migra nada.** Orgánico es la semilla: de ella se copian
todas. Migrar el modelo contra una semilla que todavía se mueve mide el ruido,
no el proceso. Y los tres spikes cuestan una hora cada uno y pueden ahorrar
semanas.

---

## Tablero

| # | Historia | Estado | Quién |
|---|---|---|---|
| S0-1 | Publicar la versión y poner Orgánico al día | ✅ **Cerrada** — release, los tres secretos, maestro publicado desde Actions y **stub puesto**. El menú no cambia de aspecto: ver la bitácora | — |
| S0-9 | **Node 20 sale de los runners el 23-sep** | ✅ **Resuelto** — apareció solo, y era una bomba de tiempo | — |
| S0-2 | Pedido de punta a punta con un teléfono de verdad | 🟡 **Ciclo normal ✅ y cerrado** (pedido, mensaje, confirmación, inventario, correo). **Parte B pendiente**: el bloqueo no alcanzó al dominio del redirect | Sebastián |
| S0-3 | Respuesta automática de WhatsApp Business | ✅ **Hecho** — el mensaje y la respuesta llegaron correctos | Sebastián |
| S0-4 | Revisión legal del machote | **Pendiente** | Sebastián + abogado |
| S0-5 | **Spike A** · subida directa a Cloudflare | ✅ **Resuelto** — contenido idéntico, `_headers` **se aplica en la subida directa**, y Cloudflare lo registra como despliegue, no como compilación | — |
| S0-6 | **Spike B** · vistas previas sin integración con Git | ✅ **Resuelto, y confirmado en la práctica** — `versions upload` entregó `2b64f6c0-organico…`, con el formato que dice la documentación | — |
| S0-7 | **Spike C** · las tres cifras del documento | ✅ **Resuelto** | — |
| S0-8 | Retirar el spike S-01 del plan | ✅ **Resuelto** | — |

**Avance: 7 de 9 cerradas, y el ciclo normal de S0-2 cerrado entero.** Del
sprint quedan dos cosas: **la parte B de S0-2** —la tienda vendiendo con el
maestro caído, que hay que repetir bloqueando también
`script.googleusercontent.com`— y **S0-4**, lo legal.

> **Hallazgo suelto de la misma captura, y no es menor:** una foto del catálogo
> devuelve **404**. La página pidió `pan-1.jpg`, no existe en `publicar/fotos/`
> —ahí solo hay `Cherry-*` y `chonto-*`— y tampoco está en el `index.html`. Sale
> de la columna **Imágenes** de la pestaña `Catálogo`: quedó el nombre de una
> foto de la panadería en la hoja de Orgánico, seguramente de una prueba. Para
> el comprador es un producto con la imagen rota. **Arreglarlo es cambiar esa
> celda**, no tocar código. La consola marcaba además 2 errores; vale la pena
> mirarlos con la pestaña Console abierta.

> **Ya no hay que volver a disparar `release`.** `v2.2.3` está publicada y es
> este mismo commit. El flujo fallaba al repetirlo, y eso estaba mal hecho de
> mi parte: ver la bitácora del 9 de septiembre.

> **✅ El sitio publicado sirve la versión nueva.** Comprobado el 9 de
> septiembre en el celular: con productos en el carrito y los datos de envío sin
> llenar, el aviso sobre el botón de WhatsApp aparece y **lleva a los campos que
> faltan**. Ese aviso no existe en la versión anterior, así que la comprobación
> distingue de verdad. Con esto **el arreglo de usabilidad móvil está en el
> aire**, y S0-2 mide la versión que de verdad están usando los compradores.

> **S0-2, parte A: verde, y esta vez contra la versión buena.** 9 de
> septiembre, desde un celular: pedido armado, mensaje enviado, venta
> confirmada, inventario descontado. La corrida anterior no contaba porque medía
> la versión desplegada, que era anterior a la del repositorio; esta sí.
>
> Y tocó de paso una regla que nadie había pedido probar: **el cupón no se
> aplicó porque el pedido no llegaba al mínimo.** Eso no lo decidió la página:
> lo decidió el maestro. La vitrina propone, la hoja dispone — el mismo reparto
> que `CONTRATOS.md` acaba de dejar por escrito, funcionando en vivo.
>
> El resumen por correo también llegó. **El ciclo normal queda cerrado.**

> **Parte B: intentada, y NO probada.** Se bloqueó la URL y la tienda cargó el
> inventario en segundos… porque **el catálogo nunca dejó de llegar**. En la
> captura se ve: `exec?a=catalogo` responde **302**, y justo debajo
> `echo?user_content_key=…` trae **3,9 kB**. Apps Script redirige a
> `script.googleusercontent.com`, que es otro dominio y no estaba bloqueado.
>
> **Tercera vez que doy una comprobación que no comprueba**, y la más
> disimulada de las tres: esta sí produjo una diferencia observable —la tienda
> cargó— solo que esa diferencia no significaba lo que yo dije. Las dos
> anteriores daban lo mismo antes y después; esta daba algo, y ese algo
> engañaba. Va al patrón 5 de la bitácora con esa vuelta de tuerca: **no basta
> con que la comprobación distinga; hay que saber qué está distinguiendo.**

---

## Resultados de los spikes

### ✅ S0-6 · Spike B — las vistas previas **no** se pierden

Era el riesgo grande de la migración: la integración con Git regala una URL de
vista previa por rama, y «revisar la vista previa antes de fusionar» es un paso
del runbook que ya ha atajado errores.

**`wrangler versions upload` devuelve una URL de vista previa por cada versión
subida, sin integración con Git.** Formato
`<prefijo>-<worker>.<subdominio>.workers.dev`, o con alias
`<alias>-<worker>.<subdominio>.workers.dev`. Está pensado exactamente para esto:
la documentación menciona generar entornos de vista previa por pull request
desde un flujo de integración continua.

Requisitos: Wrangler 3.74.0 o superior, y solo genera URL para versiones subidas
después del 25 de septiembre de 2024.

> **Consecuencia para el plan:** el riesgo nº 1 de la épica E3 queda cerrado, y
> el paso de revisión del runbook se conserva tal cual. *No hay que decidir qué
> lo reemplaza, porque no se pierde.*

### ✅ S0-7 · Spike C — las tres cifras

**1 · Tope de Bre-B por transacción — confirmado, y hay que leerlo de la hoja.**

El Banco de la República lo dice en las dos unidades: **$12.110.000 o 1.000 UVB
del año en curso.** La UVB de 2026 es **$12.110**, fijada por la Resolución 3488
de 2025 del Ministerio de Hacienda, del 31 de diciembre de 2025.

> **La cifra en pesos cambia todos los años**, porque la UVB se reindexa cada
> diciembre. Escribirla en el código la deja vencida cada 1 de enero: va en
> `Configuración` como `tope_pago`, y la revisión anual la pone al día.
> El límite del sistema es el techo; **la entidad financiera del comprador
> puede tener el suyo, más bajo**, así que el mensaje al superar el tope dice
> «consulta con tu banco», no «no se puede».

**2 · Cobro de mensajes de WhatsApp — la afirmación es correcta, y no nos toca.**

Desde el **1 de octubre de 2026** Meta empieza a cobrar los mensajes de servicio
—las respuestas libres dentro de la ventana de 24 horas— y las plantillas de
utilidad vuelven a cobrarse. Las tarifas por país se publican el 1 de septiembre
de 2026.

**Pero el cambio aplica solo a la WhatsApp Business Platform, la API. No afecta
a la app de WhatsApp Business usada sin API**, que es la que usamos.

> **Consecuencia:** ADR-07 queda reforzado con evidencia en vez de con
> intuición, y el argumento se enuncia mejor: no es que la API «deje de ser
> gratuita», es que **nuestro camino nunca dependió de ella**.
>
> Detalle que conviene anotar: la propia página de precios de Meta todavía dice
> que las conversaciones de servicio son gratis desde el 1 de noviembre de 2024
> y **no menciona el cambio de octubre**. Confirmarlo en la fuente oficial otra
> vez después del 1 de octubre.

**3 · Subida directa y cuota de compilaciones — mecanismo claro, falta la
prueba.**

Las compilaciones de Cloudflare las consume **su servicio de construcción, que
solo corre cuando Cloudflare compila desde un repositorio conectado.** Subir
desde Actions con `wrangler` no pasa por ahí. El mecanismo no deja lugar a duda,
pero **no está afirmado explícitamente en la documentación**, así que se
confirma con el contador antes y después en el Spike A. Es el único punto de
los tres que no queda cerrado en papel.

**De regalo, los límites de activos estáticos en Workers, plan gratuito:**

| | Gratuito | De pago |
|---|---|---|
| Archivos por versión | **20.000** | 100.000 |
| Tamaño por archivo | **25 MiB** | 25 MiB |
| Reglas en `_headers` | **100** | 100 |

Con 17 fotos y cuatro derivadas cada una, estamos tres órdenes de magnitud
abajo. El umbral de migración del origen de fotos —800 fotos por tienda— se
confirma como el que aprieta primero, y no es el de Cloudflare.

### ✅ S0-8 · El spike S-01 se retira: ya está medido

El documento de arquitectura propone investigar tres topologías para que el
comerciante no vea la lógica, prefiriendo **A — cero script adjunto, menú
pintado por un disparador instalable desde el proyecto independiente**.

**Se midió el 6 de septiembre de 2026 y A no funciona.** El disparador
instalable **sí dibuja** el menú en la hoja de otra persona, pero al hacer clic
la función falla con `PERMISSION_DENIED`: se invoca bajo la cuenta del
comerciante dentro de un proyecto que no es suyo. **La frontera es la propiedad
del proyecto, no la autorización.**

La topología viable es **B, el cascarón**, que es la que está en producción.
Queda escrita como `DECISIONES.md 03` para que no se vuelva a proponer.

---

## Lo que falta, y es tuyo

### S0-5 · Spike A — cómo correrlo sin tocar producción

El plan decía «desplegar la tienda cero por subida directa y comparar». **Se
mejora con lo que salió del Spike B:** en vez de desplegar, se sube una
**versión** con `wrangler versions upload`, que da una URL de vista previa y
**no cambia producción**. Así el spike A y el B se comprueban en la misma
corrida y la tienda no corre ningún riesgo.

**1. La credencial.** Cloudflare → Mi perfil → Tokens de API → Crear token →
plantilla **Edit Cloudflare Workers**, acotada a tu cuenta. Anota también el
identificador de cuenta.

**2. Antes de correr, anota el contador.** Workers & Pages → Compilaciones. Es
la mitad de la prueba: si no sube, la subida directa no consume esa cuota.

**3. Subir una versión, sin desplegarla.**

```
cd D:\CoWork\organico
set CLOUDFLARE_API_TOKEN=...
set CLOUDFLARE_ACCOUNT_ID=...
npx wrangler@latest versions upload
```

Devuelve una URL de vista previa. **Anótala.**

**4. Comparar byte a byte** contra producción:

```
curl -s https://<vista-previa>/            | sha256sum
curl -s https://organico.<tu-subdominio>.workers.dev/ | sha256sum
```

Y lo mismo con `/404.html` y con una foto, `/fotos/Cherry-1-600.webp`. Los
resúmenes tienen que coincidir.

**5. Comprobar que `_headers` se aplica igual.** Es lo que más fácil se pierde
al cambiar de camino de despliegue, y es la política de seguridad de la página:

```
curl -sI https://<vista-previa>/ | findstr /i "content-security-policy cache-control"
curl -sI https://organico.<tu-subdominio>.workers.dev/ | findstr /i "content-security-policy cache-control"
```

**6. Vuelve a mirar el contador de compilaciones.**

**Criterio de aceptación — cerrado el 9 de septiembre**

- [x] Los resúmenes del contenido coinciden
- [x] Cloudflare registra el despliegue — *`408c9000 Manually deployed Wrangler`*
- [x] **`_headers` se aplica en la subida directa** — medido sobre la URL de
      vista previa: `OK  _headers se aplica`
- [x] La vista previa existe y funciona — `2b64f6c0-organico…`

> **Con esto, la épica del despliegue no tiene incógnitas técnicas.** Las dos
> preguntas que podían tumbarla —¿sobrevive la política de seguridad? ¿hay
> vista previa por rama?— están contestadas con evidencia, y las dos a favor.
> Lo que queda del contador de compilaciones es contabilidad, no riesgo: el
> despliegue quedó registrado como despliegue.

### La cabecera salió, pero medida donde no era

La respuesta trae la política de seguridad completa y el `Cache-Control`, así
que **`_headers` se aplica**. Pero entre el despliegue manual y esa medición
hubo un `git push`, y la integración con Git vuelve a desplegar sola: lo más
probable es que lo que respondió **ya no fuera el despliegue de `wrangler`**,
sino el de siempre.

> **La medición no está mal: está hecha sobre el sitio equivocado.** Y no es un
> detalle: la pregunta del spike es si `_headers` sobrevive a la **subida
> directa**, no si funciona en el camino que ya usamos. Si se da por buena y
> resulta que no, se descubre con la épica del despliegue a medio hacer.

> ### ⚠ El intento del 9 de septiembre no midió nada
>
> El comando llevaba **`https://https://`**: el esquema quedó escrito dos veces
> al pegar la URL detrás de uno ya tecleado. `curl` rechaza esa dirección… y
> **`-s` se traga el error**, así que no salió ni un mensaje. Vacío no es
> aprobado: es que la petición nunca se hizo.
>
> Es el mismo modo de falla que persigue a este proyecto —*algo que falla sin
> decirlo*— esta vez en una línea de terminal. Por eso el comando de abajo lleva
> `-sS`, que calla el progreso pero **no los errores**, e imprime un veredicto en
> vez de dejar que el silencio parezca un sí.

**Cómo se cierra, en dos minutos y sin tocar producción** — y de paso comprueba
también la vista previa del Spike B:

```powershell
cd D:\CoWork\organico
$env:CLOUDFLARE_API_TOKEN="..."
$env:CLOUDFLARE_ACCOUNT_ID="..."
npx wrangler@latest versions upload
```

Devuelve una URL de vista previa **con su `https://` ya puesto**. Se pega
entera, sin teclear nada delante:

```powershell
$u = "https://2b64f6c0-organico.laboratoriodigital-la.workers.dev/"
$h = curl.exe -sSI $u
if ($h -match "content-security-policy") {
  "OK    _headers se aplica en la subida directa"
} else {
  "FALLA  la respuesta no trae politica de seguridad"; $h
}
```

Imprime **OK** o **FALLA**, nunca nada. Si sale OK, el Spike A queda cerrado y la
épica del despliegue no tiene sorpresas. Y no despliega nada: producción sigue
como está.

> El comando con `findstr` no volvió a funcionar y ya no importa: en PowerShell
> el bueno es este.

### Lo que salió mal, y cómo se completa

**El comando de las cabeceras estaba mal escrito.** `findstr` toma las palabras
separadas por espacio como **nombres de archivo**, no como patrones, y por eso
contestó «No se puede abrir content-security-policy cache-control». En
PowerShell hay además un enredo extra: `curl` es un alias de otra cosa. Los dos
que sí funcionan:

```powershell
curl.exe -sI https://organico.<tu-subdominio>.workers.dev/ |
  Select-String "content-security|cache-control"
```

```cmd
curl -sI https://organico.<tu-subdominio>.workers.dev/ | findstr /i /c:"content-security" /c:"cache-control"
```

**Esta comprobación es la que de verdad importa del spike.** El contenido puede
ser idéntico y aun así perderse `_headers` al cambiar de camino de despliegue —
y `_headers` es la política de seguridad de la página. Si no aparece
`content-security-policy`, la subida directa **no** está aplicando `_headers` y
la épica E3 tiene un problema que hay que resolver antes.

**Y falta el contador de compilaciones.** Cloudflare & Pages → tu Worker →
Builds. Que el despliegue quedara etiquetado como *«Manually deployed Wrangler»*
ya es buena señal: es un **despliegue**, no una compilación. Confirmarlo con el
número cierra el tercer punto del Spike C.

> **Nota de lo que pasó de verdad:** corriste `wrangler deploy`, no
> `versions upload`, así que **sí tocaste producción**. No hubo daño —se
> desplegó el mismo contenido que ya estaba en `main`— pero el sitio quedó
> servido por un despliegue manual. **El próximo push a `main` lo vuelve a
> desplegar por la integración con Git y todo vuelve a su cauce.**

### S0-1 · Publicar la versión y poner Orgánico al día

**Sin terminal.** El index no se edita a mano: lo escribe el flujo `montaje`
leyendo la hoja. Y el maestro lo publica ese mismo flujo si le pones tres
secretos, que es un trabajo de una vez.

**1 · Los tres secretos que faltan** (repositorio → Settings → Secrets and
variables → Actions → New repository secret). Solo esta vez.

Los tres valores ya los tienes en tu máquina. **Al portapapeles, sin que pasen
por ninguna pantalla**, desde PowerShell en `D:\CoWork\organico`:

```powershell
# SCRIPT_ID
node -p "require('./montar/.clasp.json').scriptId" | Set-Clipboard

# HOJA_ID
node -p "(require('./tienda.json').hoja.match(/\/d\/([A-Za-z0-9_-]+)/))[1]" | Set-Clipboard

# CLASPRC
Get-Content $HOME\.clasprc.json -Raw | Set-Clipboard
```

Comprobados desde aquí: el `scriptId` está bien formado, y el `HOJA_ID` **no
está guardado como tal** en tu `tienda.json` —lo escribió una versión anterior
de `npm run tienda`— pero sale de la URL de la hoja, que es lo que hace el
comando de arriba.

> **Antes de pegar `CLASPRC`, mira con qué versión lo generaste:** `clasp -v`.
> El flujo instala la 3. Si te dice 2.x, corre `npm i -g @google/clasp@3` y
> `clasp login` otra vez antes de copiarlo: el archivo de sesión lo tiene que
> haber escrito la misma versión que lo va a leer.

### Si no quieres tocar el equipo

**El maestro se publica desde el navegador, y hoy es el camino más corto.** No
hace falta ningún secreto nuevo:

1. `maestro.gs` en GitHub → botón **Copy raw file**
2. Editor del maestro → seleccionar todo → pegar
3. **Volver a poner el `HOJA_ID`**, que el archivo del repositorio trae vacío
4. Guardar
5. Implementar → **Gestionar implementaciones** → ✏ → Versión: **Nueva** →
   Implementar  ← nunca «Nueva implementación»

Y después dispara `montaje` **con la casilla `maestro` sin marcar**: eso trae la
hoja y las fotos, y no pide ningún secreto que no tengas.

**Para que «todo desde Actions» sea verdad de aquí en adelante**, hay que crear
`CLASPRC` una vez. `clasp login --no-localhost` **no abre un servidor local**:
imprime una dirección, la autorizas en cualquier navegador y pegas de vuelta el
código. Eso funciona desde cualquier terminal, **incluido uno que viva en el
navegador** —un Codespace sobre este mismo repositorio—:

```
npm i -g @google/clasp@3
clasp login --no-localhost      # autorizar con la cuenta de ESTA tienda
cat ~/.clasprc.json             # esto es el secreto CLASPRC
```

Es una vez por tienda, y después publicar el maestro es un botón para siempre.
Codespaces tiene una franja gratuita mensual por cuenta personal: **compruébala
antes**, que el compromiso de este producto es costo cero.

> **Por qué no se puede evitar del todo.** Publicar un Apps Script exige una
> credencial de Google con permiso sobre ese proyecto, y Google no la emite a
> una cuenta de servicio para este caso. Alguien tiene que autorizar una vez, a
> mano. Lo que sí se elige es **dónde** se hace ese «una vez», y no tiene por
> qué ser tu computador.

**2 · Cortar la versión.** Actions → **release** → Run workflow. Corre las
baterías y etiqueta `v2.2.0`.

**3 · Un solo botón para el resto.** Actions → **montaje** → Run workflow:

- `que`: `todo`
- `maestro`: **marcado**
- `confirmar`: `PUBLICAR`

Publica el maestro, y **a continuación** reescribe el `index.html` con la
versión nueva del contrato y trae las fotos. Ese encadenamiento es la razón de
que sea un solo flujo: al revés, la tienda queda avisando que la hoja responde
otra versión.

**4 · Fusionar el pull request** que abre. Cloudflare despliega solo, y de paso
vuelve a dejar el sitio en el camino normal.

**5 · El stub, a mano — es lo único irreducible.**

1. Abrir el proyecto del **MAESTRO** en `script.google.com` — **no la hoja**
2. Seleccionar la función `generarStub` y **Ejecutar**
3. En el **Registro de ejecución**, copiar todo el bloque que imprime, desde
   `/**` hasta la última llave
4. Hoja → Extensiones → Apps Script → **Ctrl+A y borrar** → pegar → guardar
5. Recargar la hoja

**Hace falta porque el rótulo del menú dejó de estar escrito en el código**, y
ese código vive en la hoja del cliente, donde ningún flujo llega.

> **Ojo: en Orgánico el menú se ve igual.** Las cinco opciones son las mismas y
> el rótulo pasó de `'Orgánico'` escrito a mano a `NEGOCIO`, que aquí vale lo
> mismo. **Mirar el menú no comprueba nada** — es el mismo error que con la
> versión del Diagnóstico. Y si el botón **Guardar** no se activa al pegar, no
> es un fallo: es que la hoja ya tiene el stub nuevo.
>
> El menú con opciones nuevas —*Publicar ahora*, *Ver mi tienda*, *Ayuda*— es
> del **Sprint 5**. Todavía no existe.

> **El stub NO sale del menú de la hoja.** «Generar configuración» da los dos
> bloques del `index.html`, que es otra cosa. Volver a ejecutar `instalar()` es
> seguro: agrega lo que falte y no pisa ningún valor escrito.
>
> **Cómo saber que pegaste el bueno:** el stub nuevo trae `var NEGOCIO = '…';`
> cerca del principio, justo debajo de `var MAESTRO` y `var TOKEN`. Esa línea,
> en el editor de la **hoja**, es la única comprobación que sirve. Si Apps
> Script dice que **no hay cambios que guardar**, la hoja ya lo tiene. Si
> `var NEGOCIO` no aparece ni siquiera en el registro de `generarStub`, el que
> está viejo es el maestro: vuelve a publicarlo.

**6 · Comprobar que el maestro nuevo está vivo.** Menú de la hoja →
**Diagnóstico**, y buscar la línea:

```
Lecturas del catálogo hoy: N   ·   pico en una hora: M
```

**`pico en una hora` solo existe en el maestro nuevo.** No sirve mirar la
versión: es la misma de antes a propósito —el contrato con la tienda no
cambió—, así que daría el mismo resultado con el maestro viejo y no
comprobaría nada.

Y después de pegar el stub: **el menú de la hoja pasa a llamarse como el
comercio**, no «Orgánico» por estar quemado en el código.

> **Si prefieres el terminal**, es lo de siempre: `npm run maestro` y
> `npm run montar`. El camino de arriba existe para no depender de tu equipo.
> Lo intenté correr desde aquí y **no se puede: el puente a tu máquina no tiene
> salida a `script.google.com`**, así que el montaje o corre en tu Windows o
> corre en Actions.

### S0-2 · El pedido de verdad

Con un teléfono que no sea el del comercio:

- [x] Pedido completo → llega el WhatsApp **con código de pedido**
- [x] El pedido aparece en la pestaña `Pedidos`
- [x] Marcar **Confirmado** descuenta el stock en `Catálogo`
- [x] El resumen llega por correo

> **Corrido el 9 de septiembre desde un celular, y salió limpio.** Además de lo
> anterior, la prueba tocó una regla que nadie pidió probar: **el cupón no se
> aplicó porque el pedido no llegaba al mínimo**. Eso es el maestro validando,
> no la página: la vitrina propone y la hoja decide. Es exactamente el reparto
> que el contrato de datos acaba de dejar por escrito, funcionando en vivo.

**Y la prueba que casi nadie hace: la tienda tiene que vender con el maestro
caído.** Es lo que promete `DECISIONES.md 01`, y si no se comprueba es solo una
intención.

> **NO se archiva la implementación para probarlo.** Archivar es la operación
> que estrena URL y mata la tienda —la regla de oro de este proyecto—, y
> «volver a activarla» no es volver atrás. Se corta la petición en el
> navegador, que es reversible y no toca nada de Google:
>
> **No basta con bloquear `script.google.com`.** Una aplicación web de Apps
> Script contesta **302** y redirige a `script.googleusercontent.com/macros/echo…`,
> que es de donde salen los datos de verdad. Bloquear solo la primera dirección
> deja pasar el catálogo por la segunda, y la prueba sale «bien» sin haber
> probado nada. Este proyecto ya lo sabía en otro sitio: la CSP del `<head>`
> nombra **los dos** dominios en `connect-src`.
>
> Chrome de escritorio → **F12** → menú ⋮ → **More tools → Network request
> blocking** → activar y agregar **dos** patrones:
>
> ```
> *script.google.com*
> *script.googleusercontent.com*
> ```
>
> Recargar. En la pestaña **Network**, las dos peticiones tienen que salir en
> rojo con `(blocked)`. **Si `exec?a=catalogo` responde 302 y debajo aparece un
> `echo?user_content_key=…` con unos kilobytes, no está bloqueado.** Al
> desactivar el bloqueo, todo vuelve a la normalidad.

Con la petición bloqueada, lo correcto es:

- [x] La vitrina **sigue mostrando productos** — los del propio archivo
- [ ] El botón de WhatsApp **funciona** y el mensaje sale
- [ ] El pedido sale marcado **sin validar**, porque el sello de precios no se
      pudo pedir. Es el comportamiento correcto: vender con una advertencia es
      mejor que no vender

> **Medido el 9 de septiembre, con los dos dominios bloqueados.** En la red:
> tres `exec?a=catalogo` en rojo, `(blocked)`, `0.0 kB` — la primera y los dos
> reintentos que el código hace antes de rendirse. En pantalla: Tomate chonto
> `$8.900 · Disponible` y Tomate cherry `$6.500 · Últimas 4 unidades`, con los
> tomates dibujados en lugar de fotos.
>
> **Eso es el catálogo del archivo, y cuadra hasta el último dato**: en
> `index.html` el cherry va con `precio:6500`, `stock:4` e
> `imagenes:["","",""]` — tres vacías, que es de donde sale la etiqueta «3
> fotos» y el marcador dibujado. La vitrina no se cayó: cambió de fuente.
>
> **Falta la mitad que vende.** Que la lista aparezca no prueba que se pueda
> comprar. Con el bloqueo puesto: agregar al carrito, llenar los datos de envío,
> pulsar WhatsApp, y comprobar que el mensaje trae esta línea:
>
> ```
> _Total calculado por la página. Orgánico lo confirma antes del despacho._
> ```
>
> Esa línea **es** la marca de «sin validar»: la escribe `index.html` cuando no
> hay sello del maestro. Si el mensaje sale sin ella, el pedido se está
> presentando como verificado sin estarlo, y eso sí es un problema.

> **Segundo intento: tampoco fue la prueba, y la red lo dice.** El pedido salió
> con código `M4467`, se asentó, y el mensaje **no** traía la marca de «sin
> validar». Eso no es un fallo: es que **el maestro nunca estuvo caído**. En la
> captura, `exec?a=validar&sellar=1` y `exec?a=registrar` responden **302** y
> traen sus 2,5 kB y 1,9 kB. Solo `?a=catalogo` salió bloqueado — y la propia
> regla lo confirma: **«3 affected»**, que son exactamente las tres llamadas al
> catálogo.
>
> La causa es cómo se creó el patrón. «Block request URL» copia **la URL
> completa**, con su `?a=catalogo`, y DevTools compara por subcadena: `?a=validar`
> no contiene `?a=catalogo`, así que pasa. El patrón tiene que cortar antes de la
> consulta:
>
> ```
> *script.google.com/macros/s/*
> *script.googleusercontent.com/macros/*
> ```
>
> Con eso, «affected» tiene que subir de 3 a **todas** las llamadas al maestro.

> **Pero el intento fallido midió algo que nadie había medido: la caída
> parcial.** Catálogo abajo, validación arriba. Y ahí aparecieron dos cosas
> reales, las dos anotadas en el Sprint 1:
>
> 1. La vitrina lista los productos **del archivo** mientras el sello trae los
>    precios **de la hoja**. Los totales del carrito se corrigen solos —el sello
>    manda— pero **las tarjetas siguen mostrando el precio viejo**, sin decir
>    nada. Un comprador puede ver `$8.900` en la tarjeta y otro número abajo.
> 2. El maestro devuelve **`envioNombre`** —el nombre del envío según la hoja— y
>    la página **nunca lo usa**: escribe el nombre que ella tenía y el valor que
>    trajo el sello. Si la hoja no reconoce el envío, contesta `0` y
>    `«Por confirmar»`, y el comprador termina leyendo *su* zona con costo cero.
>
> Lo segundo explicaría **«no trajo el valor de envío»** sin que nada haya
> fallado a la vista. Para saber cuál de los dos casos fue, mirar la fila de
> `M4467` en la pestaña `Validaciones`: si la columna `Envío` dice 0 y el
> `Detalle` trae el aviso de envío no disponible, fue esto.

**Si algo de esto falla, el catálogo estático del Sprint 2 deja de ser una
mejora y pasa a ser una corrección.**

### S0-3 · WhatsApp Business

Mensaje de ausencia con los datos de pago. **Sin esto el comprador termina el
pedido y no tiene cómo pagar**, y es el único punto donde el diseño de seguridad
se vuelve un agujero funcional si se olvida.

### S0-4 · Revisión legal

Un abogado mira el machote una vez, y el contrato deja por escrito que el
responsable del tratamiento de datos es **el comercio**, no nosotros.

---

## Bitácora del sprint

**9 de septiembre de 2026 · cierre**

**El menú no se actualizó, y la culpa era del documento.** Este archivo y
`ACTUALIZAR-UNA-TIENDA.md` mandaban a sacar el stub del menú de la hoja
—«Generar configuración»—. Esa opción produce los **dos bloques del
`index.html`**, que es otra cosa. Al pegar lo que no era, Apps Script contestó
**«no hay cambios que guardar»**, que suena a «ya estaba hecho» y significa lo
contrario.

El stub solo lo imprime el **maestro**: `generarStub` en su editor —e
`instalar()` al final de su registro—. No puede salir del menú por una razón de
fondo: **es el código que dibuja ese menú**.

- Los dos documentos corregidos, con la señal para reconocer el bueno:
  `var NEGOCIO = '…';` debajo de `var MAESTRO` y `var TOKEN`.
- Batería 12 en `montaje.js`: recorre `/docs` y falla si algún documento vuelve
  a juntar «stub» con «Generar configuración», y comprueba que los dos que
  mandan a pegarlo expliquen qué significa que no haya cambios que guardar.
- Suite: **232/232** en `montaje.js`.

**Y la comprobación que propuse volvió a no comprobar nada.** «Recarga la hoja:
el menú se llama como el comercio» — en la tienda que **se llama Orgánico** eso
da lo mismo antes y después. El stub solo se desmarcó: el rótulo pasó de
`'Orgánico'` escrito a mano a `NEGOCIO`, y las cinco opciones siguen iguales.
Buscaste opciones nuevas que son del **Sprint 5**. La única señal válida es
`var NEGOCIO` en el editor de la hoja, y que **Guardar no se active** significa
que ya estaba puesto. Segundo caso del mismo patrón, después de la versión del
Diagnóstico.

**9 de septiembre de 2026 · noche**

**El maestro se publicó desde Actions, y salió bien la parte que dos veces salió
mal.** El registro de la corrida dice exactamente lo que tenía que decir:

```
Hoja de esta tienda: 1xFdb5ae49VAt0…          ← el HOJA_ID se repuso
Redeployed AKfycbxwSDQEloo… @12               ← la MISMA implementación, la URL no cambió
Comprobando que el maestro publicado abre su hoja… sí.
```

Esas tres líneas son el fallo que tumbó la tienda en septiembre, ahora
convertido en comprobación. Y clasp 3.4.1 leyó sin problema el `CLASPRC` que se
generó en el equipo: la duda de la versión no era tal.

**No abrió pull request, y es correcto.** «Nada cambió en la hoja ni en el
Drive»: `VERSION` no cambió —el contrato con la tienda es el mismo— y la
configuración tampoco, así que **el `index.html` no tenía nada que actualizar**.
Un flujo que no abre un pull request cuando no hay nada que cambiar está
haciendo lo correcto; abrirlo vacío sería ruido.

> **Ojo con cómo se comprueba.** El registro dice que el Diagnóstico debe
> mostrar `2026-09-04-6`… que es la misma versión de antes, así que **eso no
> distingue el maestro nuevo del viejo**. Lo que sí lo distingue es la línea
> **`pico en una hora`**, que solo existe en el maestro nuevo. Es el tipo de
> comprobación que hay que elegir con cuidado: una que dé el mismo resultado
> antes y después no comprueba nada.

**9 de septiembre de 2026 · tarde**

- **Spike A cerrado.** `OK  _headers se aplica`, medido sobre la URL de vista
  previa, que es la que sí prueba la subida directa. Las dos incógnitas que
  podían tumbar la épica del despliegue están contestadas y las dos a favor.
- **Y el `release` me lo hiciste ver a golpes.** Falló tres veces seguidas
  diciendo que `v2.2.3` ya estaba publicada — que es cierto y no es un error:
  no hay nada que cortar. **Una cruz roja que significa «todo bien» es peor que
  no avisar, porque enseña a ignorar las cruces rojas**, y este proyecto ya
  tuvo una corrida en verde con una batería entera sin correr.

  Ahora distingue los dos casos: si la etiqueta existe y apunta **a este mismo
  commit**, termina en verde diciendo que ya está hecho y no publica nada. Si
  existe y apunta a **otro** commit, falla — porque ahí el código cambió y la
  versión no, y quien pida esa etiqueta se llevaría algo distinto.

**9 de septiembre de 2026**

- **Spike B confirmado en la práctica.** `wrangler versions upload` entregó
  `2b64f6c0-organico.laboratoriodigital-la.workers.dev`, exactamente el formato
  `<prefijo>-<worker>.<subdominio>` que dice la documentación. Lo que estaba
  leído ahora está visto.
- **La comprobación de cabeceras no llegó a correr.** El comando llevaba
  `https://https://` y `curl -s` se tragó el error: no salió nada, y *nada* se
  parece peligrosamente a *bien*. Corregido a `-sS` y con veredicto impreso.
- **`release` se negó a cortar `v2.2.3` porque ya estaba publicada, y eso es
  correcto.** La versión salió en la corrida anterior; volver a dispararla sin
  subir el número no tiene nada que hacer.
- **Y lo que sí hay que corregir es mío:** venía subiendo la versión en cada
  commit, también en los de solo documentación. La regla del repositorio es
  otra —solo cuando cambia algo que se despliega— y ese exceso es lo que obligó
  a disparar `release` de más. Queda escrito en el PLAN.

**8 de septiembre de 2026 · cierre, después**

- **`release` en verde** y **`montaje` sin marcar en verde**, con «Nada cambió
  en la hoja ni en el Drive». Eso es una respuesta, no un vacío: **el
  `index.html` no necesita actualizarse.** `VERSION` no cambió —el contrato con
  la tienda es el mismo— y la configuración de la hoja tampoco, así que no hay
  nada que reescribir. Un problema menos de los que creíamos tener.
- **`CLASPRC` aceptado.** El flujo marcado ya solo reclama `SCRIPT_ID` y
  `HOJA_ID`: el mensaje pasó de tres secretos a dos, que es la forma de saber
  que el primero entró bien.
- **`_headers` se aplica**, pero la medición se hizo sobre producción, y entre
  el despliegue manual y la medición hubo un push. Lo que contestó casi seguro
  ya era la integración con Git. Se repite sobre una URL de vista previa.
- **Los menús de la hoja siguen viejos, y es lo esperado.** El menú vive en el
  cascarón, dentro de la hoja del cliente, y **ningún flujo llega ahí**: hay que
  regenerarlo y pegarlo. Además necesita el maestro nuevo, que es el que trae
  el nombre del comercio. Los dos pasos que faltan son justo esos.

**8 de septiembre de 2026 · cierre**

**Decisión: nada corre en el equipo local.** El montaje volvió a plantarse por
los mismos tres secretos, y en vez de insistir se separa el problema en dos:

- **Publicar el maestro no necesita Actions ni equipo: se pega en el editor de
  Apps Script desde el navegador.** Es el bloque D3 del runbook, y hoy es el
  camino más corto para cerrar S0-1.
- **`CLASPRC` sí hace falta para que sea un botón**, y se puede crear **sin
  tocar el equipo**: `clasp login --no-localhost` no abre un servidor local
  —imprime una dirección y pide el código de vuelta—, así que sirve desde un
  terminal en el navegador.

Se corrige de paso una frase del runbook que decía que `CLASPRC` «no se puede
sacar desde un navegador». Lo correcto es que **no sale de una pantalla de
Google**: hay que correr `clasp` una vez en algún sitio, y ese sitio se elige.

**8 de septiembre de 2026 · noche, después**

**Release publicado.** `v2.2.1` cortada, con las baterías en verde. El salto de
versión de las acciones a Node 24 quedó probado en una corrida de verdad, que es
lo único que podía probarlo.

**El montaje se plantó, y también estuvo bien.** Marcaste la casilla del maestro
y escribiste `PUBLICAR`, pero los tres secretos no estaban. Se detuvo **antes de
escribir el `index.html`**, que es exactamente lo que tenía que hacer: si el
maestro no se publica, el index quedaría escrito contra la versión anterior.

Lo que sí estuvo mal fue el mensaje. Decía qué faltaba y no dónde ponerlo, y
solo en el registro de la corrida, no en el resumen —que es lo que uno lee—.
**Es la misma lección del botón del carrito:** decir qué hacer cuesta lo mismo
que decir qué falta. Ahora el resumen trae la tabla de los tres secretos con su
origen, y la salida para seguir sin ellos: disparar el montaje con la casilla
sin marcar y publicar el maestro aparte.

**8 de septiembre de 2026 · noche**

**El release falló, y falló bien.** 922 de 923. La que se cayó fue una aserción
mía, y cazó exactamente lo que existe para cazar:

```
FALLA | LA DECISIÓN 01 TIENE una condición de disparo con número e instrumento
```

Al reescribir la decisión 01 para adoptar la arquitectura v3, el umbral quedó
escrito como **«300 lecturas»** donde el diagnóstico del maestro dice **«300 en
una hora»**. El número es el mismo; la frase, no. Y la aserción comparaba la
frase.

> Es el patrón nº 2 de la bitácora otra vez —dos implementaciones del mismo
> dato, y una se queda atrás—, aplicado esta vez a **un número escrito en dos
> sitios**. Arreglado como corresponde: la aserción **saca el número del
> instrumento** —el texto del diagnóstico— y comprueba que el documento le hace
> eco. El documento le hace eco al código, no al revés.

**Y de paso apareció una bomba de tiempo en el aviso que nadie mira.** El aviso
amarillo de la corrida decía que `actions/checkout@v4`, `setup-node@v4` y
`cache@v4` piden Node 20. Lo verifiqué: **GitHub quita Node 20 de los runners el
23 de septiembre de 2026**, en quince días. Hoy corren con un aviso; ese día
dejan de correr **los cuatro flujos a la vez**, y la tienda se queda sin poder
desplegarse.

Actualizadas a `checkout@v7`, `setup-node@v7` y `cache@v5`, y una aserción nueva
impide volver a una versión que pida Node 20. **925/925.**

**8 de septiembre de 2026 · tarde**
- Push hecho: `origin/main` y local coinciden en `16a8fa5`. **El árbol de trabajo
  está limpio: no hay nada del repositorio pendiente de actualizar.** Lo que
  falta —index, maestro, stub— no se edita a mano: lo escribe el flujo
  `montaje` leyendo la hoja.
- Pedido de prueba correcto, y **S0-3 cerrada**: la respuesta automática de
  WhatsApp entregó los datos de pago.
- Spike A a medias: el contenido coincide y Cloudflare registró un despliegue
  manual. Faltan las cabeceras —el comando estaba mal escrito— y el contador.
- Se aclara el juego de flujos: quedan **cuatro** y los cuatro se usan. El que
  se ve de más en la barra lateral de GitHub es `maestro`, borrado del
  repositorio pero con historial de corridas.

**8 de septiembre de 2026 · mañana**
- Spikes B y C resueltos en fuentes oficiales. B sale **positivo**: las vistas
  previas no se pierden, y con eso cae el riesgo principal de la épica del
  despliegue.
- El spike A se rediseña con lo aprendido en el B: sube una **versión** en vez
  de desplegar, así comprueba los dos y no toca producción.
- S-01 retirado y convertido en `DECISIONES.md 03`.
- Una cifra del documento se corrige: el tope de Bre-B **no es una constante**,
  se reindexa cada año. Va a `Configuración`, no al código.

---

## Los flujos que quedan, y el fantasma de la barra lateral

Son **cuatro**, y los cuatro se usan. No hay nada que borrar.

| Flujo | Cuándo corre | Para qué |
|---|---|---|
| `pruebas` | cada pull request y cada push a `main` | Todas las baterías. Nadie lo dispara |
| `montaje` | lunes 6:00 y a demanda | Maestro (opcional) → index → fotos → baterías → pull request |
| `fotos` | cada 4 horas y a demanda | La vía rápida del comercio. **Es el único que se fusiona solo** |
| `release` | a demanda | Corre las baterías y etiqueta `vX.Y.Z` |

**`maestro` ya no existe**: lo absorbió `montaje` el 8 de septiembre, por el
encadenamiento del orden. Si todavía lo ves en la barra lateral de Actions, es
que **GitHub sigue mostrando un flujo borrado mientras tenga corridas en su
historial**. Desaparece al borrar esas corridas —los tres puntos de cada
corrida → *Delete workflow run*— o se queda ahí sin hacer nada, porque el
archivo no está y no se puede disparar.

`fotos` y `montaje` parecen solaparse y no lo hacen: `fotos` es automático cada
cuatro horas y **fusiona solo**, porque una foto fea se arregla con otra foto;
`montaje` puede reescribir el `<head>`, la política de seguridad y `SCRIPT_URL`,
y por eso siempre deja un pull request con una persona en el medio.
