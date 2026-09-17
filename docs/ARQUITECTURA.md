# Arquitectura y modelo de despliegue

> La migración a la arquitectura v3 —multi-tenant, GitHub Actions, panel de
> administración— terminó en la 3.0.0: es la que describe todo este archivo.
> `ADOPCION.md` y `PLAN.md`, que documentaban esa migración en marcha, se
> borraron al cerrarse. Los cambios puntuales con su condición de disparo
> siguen en `DECISIONES.md`.

Este archivo responde una sola pregunta: **qué vive dónde, de quién es la
cuenta, y por qué**. Es el que hay que leer antes de montar la tienda número
dos, y el que explica decisiones que en seis meses van a parecer arbitrarias.

---

## 1. El reparto

| Pieza | Dónde vive | De quién es la cuenta | Por qué ahí |
|---|---|---|---|
| Hoja de cálculo | Google Sheets | Una cuenta de Google **por tienda**, creada y administrada por nosotros | Es la base de datos, el CMS y el tablero. La cuenta es por tienda para que cada una gaste sus propios límites gratuitos |
| Maestro (`maestro.gs`) | Apps Script suelto | La misma cuenta de esa tienda | Fuera de la hoja: al compartirla, el cliente no lo ve |
| Stub | Apps Script dentro de la hoja | La misma | 46 líneas sin una sola regla de negocio. Existe solo porque un menú necesita un `onOpen` |
| Fotos originales | Drive | La misma | Capa 1. Pesadas, nunca se publican |
| Fotos publicadas | `publicar/fotos/` en Git | Nuestra | Capa 2. Generadas con `preparar-fotos.mjs` |
| Sitio | Cloudflare Workers | **Una sola cuenta nuestra** | 100 Workers gratis por cuenta, y los archivos estáticos no gastan cuota |
| Repositorio | GitHub | Nuestra | Uno por tienda, más el de la plantilla |
| Panel (`panel.gs`) | Sheets + Apps Script | Nuestra cuenta personal | Administra el negocio, no una tienda |

Google se **reparte** (una cuenta por tienda). Cloudflare y GitHub se
**centralizan** (una sola cuenta para todas). No es una inconsistencia: son
límites de naturaleza distinta, y la sección 3 explica por qué.

---

## 2. Quién ve qué

La cuenta de Google de cada tienda **es nuestra**: la creamos, la
administramos y guardamos su contraseña. Al comercio se le comparte la hoja a
su cuenta personal, con permiso de edición, más el enlace a la carpeta de
Drive donde sube sus fotos crudas.

De ahí sale, sin ningún truco, que el comercio:

- **ve y edita** su hoja: productos, precios, stock, cupones, envíos, pedidos;
- **ve** el stub, que no dice nada: ni un precio, ni un cupón, ni una fórmula;
- **no ve** el maestro, porque no es suyo el proyecto ni la cuenta que lo
  contiene, y porque no está unido a la hoja que sí se le compartió.

Esto tiene un costo operativo que hay que asumir con los ojos abiertos: son N
cuentas de Google con sus contraseñas, sus verificaciones en dos pasos y sus
teléfonos de recuperación. Es un activo que hay que administrar de verdad, no
un detalle. A partir de unas diez tiendas conviene un gestor de contraseñas y
un número de recuperación propio, no el del comercio.

---

## 3. Por qué una cuenta de Google por tienda

Los límites de Apps Script son **por cuenta y por día**:

| | Cuenta gratuita | Workspace pago |
|---|---|---|
| Correos por día | 100 | 1.500 |
| Tiempo de disparadores | 90 min/día | 6 h/día |
| Llamadas de red | 20.000/día | 100.000/día |
| **Ejecuciones simultáneas** | **30** | **30** |

Las tres primeras filas se compran. **La cuarta no.**

Y la cuarta es la que manda. La tienda está publicada "ejecutar como: yo", así
que *cada visitante que carga el catálogo* corre una ejecución bajo la cuenta
dueña del maestro. Con una cuenta por tienda, ese techo de 30 es de esa tienda
sola y no lo alcanza jamás. Con todas las tiendas colgadas de una sola cuenta
—pagada o no—, treinta visitantes simultáneos **repartidos entre todos los
clientes** empiezan a chocar entre sí, y el síntoma que ve el comprador es una
tienda que no carga, en un negocio que no tuvo nada que ver.

Hay un segundo argumento, menos técnico y más incómodo: una sola cuenta es un
solo punto de falla. Si Google la suspende —y suspende cuentas por motivos que
no siempre explica—, se caen todas las tiendas a la vez.

**Decisión:** una cuenta de Google por tienda, gratuita. Se revisa si el costo
de administrar cuentas supera el beneficio; el número donde eso pasa hay que
medirlo, no adivinarlo.

**Lo contrario en Cloudflare.** Ahí el límite que importaría —100.000 pedidos
al día— *no aplica*, porque `wrangler.jsonc` no declara `main`: no hay Worker,
solo archivos estáticos, y esos son gratis e ilimitados. Lo que sí es finito
son 100 Workers por cuenta. Repartir Cloudflare en cuentas no compraría nada y
costaría cien tableros que mirar.

---

## 4. El panel pregunta, no entra

Como cada tienda vive en su cuenta, desde el panel **no se puede abrir la hoja
de un cliente**. Compartirlas todas con una cuenta administradora
reconstruiría justo el acoplamiento que evitamos.

En vez de eso, cada maestro publica un resumen de su tienda por la puerta
`?a=panel&t=TOKEN`, y el panel lo pregunta. Lo que cruza son **cifras
agregadas** —ventas del mes, pedidos por confirmar, productos agotados,
versión del código—, nunca un pedido ni el dato de un comprador. Si mañana una
tienda se va, se borra su fila y no queda nada suyo en nuestro lado.

Las consultas van con `fetchAll`, todas a la vez. En serie, veinte tiendas a
dos segundos son cuarenta segundos de ejecución contra un corte de seis
minutos; en paralelo son dos segundos y el presupuesto diario deja de ser el
techo del negocio.

### La columna «Sin terminar»

El diagnóstico distingue dos preguntas que antes se contestaban como una sola:
¿la tienda **funciona**? y ¿la tienda **está terminada**? Al escribir el
`index.html` solo se comprobaban las cinco constantes; las otras once claves de
Configuración no las miraba nadie, y una tienda podía salir al aire sin llave
de pago —el comprador termina el pedido y no tiene cómo pagar— sin que se
notara hasta que un cliente se quejaba.

Hoy son dos niveles (el detalle de cuáles bloquean y cuáles avisan está en
`DESPLIEGUE.md` paso 8): lo que **bloquea** hace que el montaje se niegue a
escribir el index; lo que **avisa** deja la tienda vendiendo pero a medias, y
sale en el registro y en el panel sin detener nada. La fila de cada tienda en
el panel lleva una columna **Sin terminar**, junto al nombre del comercio —no
al final, porque si una tienda no puede vender el resto de su fila da igual—:
en blanco si está completa, `NO PUEDE VENDER: <clave>` si falta algo que
bloquea, o `faltan N: <claves>` si solo avisa. Por esa columna **viajan las
claves que faltan, nunca los valores**: mandar valores mandaría la llave de
pago de cada comercio a una hoja donde no pinta nada.

---

## 5. La tienda no depende de nadie en tiempo de ejecución

`index.html` es un archivo que se basta solo. Su política de seguridad no
autoriza **ningún** origen de código externo.

Eso descarta, a propósito, servir la tienda desde una librería publicada en un
registro de paquetes y cargada con `<script src>`: la caída de ese registro
apagaría todas las tiendas a la vez, y quien controle ese paquete podría
inyectar código en el carrito de todos los clientes.

Lo que sí se comparte es **en tiempo de construcción**. La plantilla publica
versiones con nombre y cada tienda las consume al desplegar, no al cargar:

```
https://github.com/laboratoriodigital/organico/releases/latest/download/index.html
```

Un release de GitHub alcanza y se descarga sin credenciales. GitHub Packages
exigiría autenticación incluso para paquetes públicos, que es fricción sin
contrapartida.

**Cómo llega un cambio a todos:** se corta una versión en la plantilla; el
repositorio de cada tienda tiene un flujo que baja la última, le vuelve a
inyectar su bloque `<head>` y su `SCRIPT_URL`, y **abre un pull request**.
Nadie se mueve hasta que una persona lo aprueba. Ninguna tienda se actualiza
sola, y actualizar veinte es aprobar veinte pull requests, no editar veinte
archivos.

---

## 6. Las fotos, en tres capas

| Capa | Qué es | Dónde |
|---|---|---|
| 1 · Archivo maestro | El original pesado, tal como lo tomó el comercio | Drive de la tienda |
| 2 · Origen servible | Las versiones que se muestran (WebP en tres tamaños + JPG de respaldo) | `publicar/fotos/`, servidas por Cloudflare |
| 3 · Transformación | Un proveedor que recorta y convierte al vuelo, si se usa | Cloudinary · ImageKit · Cloudflare Images |

En la hoja se escribe **solo el nombre**: `chonto-1.jpg|chonto-2.jpg`. La
tienda arma la URL.

Los tres proveedores de la capa 3 están **autorizados de antemano** en la
política de seguridad y en `FOTOS_HOSTS`. Cambiar de proveedor es cambiar la
celda `fotos_cdn` y nada más: no hay que regenerar el `<head>` ni republicar.
El costo es acotado y consciente: son orígenes de *imagen*, no de código.

Si la hoja pide un proveedor que no está autorizado, las fotos **no** quedan en
blanco: se sirven directo del origen y se avisa por consola con el paso exacto
para arreglarlo.

El cable entre la capa 1 y la 2 lo cierra el flujo `fotos`, que mira el Drive
del comercio cada cuatro horas y publica lo nuevo **sin pedirle aprobación a
nadie**. Es la única automatización que se fusiona sola, y la razón es una
diferencia de daño, no de comodidad: la configuración de la hoja puede
reescribir la política de seguridad y dejar la tienda caída; una foto solo
puede verse fea. Además, subir fotos es una acción del comercio, y hacerlo
esperar seis días por algo suyo no tiene defensa.

Y no se confía en esa promesa: antes de fusionar, el flujo comprueba que el
cambio no toque un solo archivo fuera de `publicar/fotos/`. Si lo toca, deja un
pull request abierto.

---

## 6b. Lo único que sigue viviendo dentro de la hoja

El stub, 46 líneas, y existe **solo para dibujar el menú**. Todo lo demás que
la hoja necesita ya lo hace el maestro desde afuera con disparadores
instalables —`alEditar`, `recalcularResumen`, `respaldoSemanal`—, que corren
con nuestra autorización y por eso sí pueden usar `UrlFetchApp` y `MailApp`.
Un disparador simple no podría: [no puede llamar a servicios que pidan
autorización](https://developers.google.com/apps-script/guides/triggers).

Queda una pregunta abierta que decidiría si el stub sobra: un disparador
instalable de apertura, creado por la cuenta de la tienda, ¿le dibuja el menú
al comerciante cuando **él** abre la hoja compartida? Lo documentado es que
[corre bajo la cuenta de quien lo creó](https://developers.google.com/apps-script/guides/triggers/installable);
lo que no dice ninguna parte es si la interfaz que pinta la ve el otro.

**Medido y cerrado el 6 de septiembre de 2026.** El resultado tiene dos
mitades y la segunda es la que manda:

1. El menú **sí aparece**. Un disparador instalable de apertura le dibuja
   interfaz a otro usuario. La documentación de Google no lo dice en ninguna
   parte, y era razonable esperar lo contrario.
2. Pero **tocar una opción falla**, con `PERMISSION_DENIED` al leer del
   almacenamiento.

El mecanismo, que es lo que vale la pena recordar: un disparador instalable
corre bajo la cuenta de quien lo creó, sí, pero eso vale para el *manejador de
apertura*. Cuando el comerciante hace clic en una opción, esa función se
invoca **bajo su cuenta, dentro de nuestro proyecto** — que no es suyo y no
puede leer.

Por eso los disparadores que nadie toca (`alEditar`, los de tiempo) funcionan
perfecto desde afuera, y un menú no. **La frontera no es la autorización: es de
quién es el proyecto donde vive la función que se ejecuta.**

Así que el stub se queda, y ahora se sabe exactamente por qué: sus opciones
llaman a funciones que viven en la hoja del comerciante —que sí es suya—, y
esas funciones piden por HTTP. El precio son 46 líneas sin una sola regla de
negocio y una autorización que el comerciante da una vez.

El experimento se retiró del maestro; solo queda `quitarMenuDePrueba()` para
desmontarlo donde se llegó a instalar. Con eso el maestro vuelve a no tocar la
interfaz nunca, que es lo que le permite correr desde un disparador.

Y hay una consecuencia que el técnico tiene que saber: como el stub llama a
`UrlFetchApp`, **el comerciante tiene que autorizarlo una vez**, con su propia
cuenta, la primera vez que usa el menú. Google le muestra la pantalla de
aplicación no verificada. Es normal, es una sola vez, y el paso 6 del
despliegue explica qué decirle.

## 6c. Lo mismo, corriendo en dos sitios

Las herramientas de `montar/` son las mismas en tu equipo y en GitHub. Lo que
cambia es de dónde salen los dos datos de la tienda y quién cierra el ciclo:

| | En tu equipo | En GitHub Actions |
|---|---|---|
| Cómo se invoca | `npm run index` | `node montar/preparar-index.mjs` |
| De dónde sale la URL y el token | `tienda.json` | Los secretos del repositorio |
| Quién hace el commit | **Tú** | El flujo |
| Quién aprueba | Tú, en el pull request | Tú, salvo en `fotos` |

Los `npm run …` son atajos de `package.json` para escribir menos. Los flujos
llaman a `node` directamente porque no ganan nada con el atajo y así se ve en
el registro qué archivo corrió.

Y la diferencia que más confunde: **lo local escribe archivos y nada más.** El
commit, el pull request y la fusión ocurren solo cuando el flujo corre en
GitHub. Correr `npm run montar` y esperar un despliegue es esperar un paso que
nadie dio.

## 6d. Credenciales: cuáles hay, dónde viven y qué pueden hacer

| Credencial | Dónde vive | Qué permite | Si se filtra |
|---|---|---|---|
| Token del stub (`tk-…`) | Propiedades del maestro de esa tienda, y a la vista en su stub | Leer la configuración, listar la carpeta de fotos, bajar archivos **de esa carpeta**, leer cifras agregadas | Una tienda, y solo de lectura. Se rota borrando la propiedad `TOKEN` y regenerando el stub |
| `CLASPRC` | Secreto del repositorio, **solo si se publica el maestro desde el flujo `montaje`** | Publicar el Apps Script y tocar el Drive de esa cuenta | Grave para esa tienda. Por eso publicar pide confirmación escrita y nunca corre por horario |
| `GITHUB_TOKEN` del panel | Propiedades del panel | Leer ejecuciones de Actions | Alguien ve cuánto tardó una compilación. Es el secreto más inofensivo del proyecto, y aun así conviene que sea de grano fino y con vencimiento |

**Las propiedades de un proyecto de Apps Script no están cifradas.** Cualquiera
que pueda editar ese script las lee en texto plano. Eso está asumido en el
diseño: por eso el token del stub no sirve para nada peligroso, y por eso el
panel —que es el único archivo con credenciales de verdad— no se comparte con
ningún cliente.

Y por eso la regla que ordena todo esto: **la mejor forma de proteger un
secreto es no tenerlo.** Los repositorios de las tiendas son públicos porque no
hay nada secreto en ellos.

Con un matiz que se aprendió probando: la API de GitHub deja leer un
repositorio público **sin autenticarse**, pero da 60 peticiones por hora **por
dirección IP**, y Apps Script sale por direcciones que comparte con todos los
scripts del mundo. Ese cupo está agotado casi siempre. La ruta sin token es
correcta según la documentación y sirve desde un equipo propio; desde el panel,
no. Ahí sí conviene un token de grano fino con `Actions: read-only`, que sube
el cupo a 5.000 por hora. Es el secreto más inofensivo del proyecto: si se
filtra, alguien ve cuánto tardó una compilación.

Si algún día una tienda vive en un repositorio privado, el token tiene que ser
**de grano fino** (`github_pat_…`), limitado a esos repositorios, con permiso
de **Actions: solo lectura** y con fecha de vencimiento. Un token clásico
(`ghp_…`) con alcance `repo` da lectura **y escritura** sobre todos los
repositorios de la cuenta; el diagnóstico del panel lo señala si aparece uno.

## 6e. Tres códigos, tres numeraciones

Es la confusión más fácil de tener, así que conviene tenerla escrita:

| Código | Constante | Qué numera | Con qué compara |
|---|---|---|---|
| `maestro.gs` | `VERSION` | El contrato con la tienda | Tiene que ser **igual** a `SCRIPT_VERSION` |
| `publicar/index.html` | `SCRIPT_VERSION` | Lo que la tienda espera del maestro | Tiene que ser **igual** a `VERSION` |
| `panel.gs` | `VERSION_PANEL` | El archivo de gestión | **Con nada.** Es otro programa |

Las dos primeras se mantienen iguales solas: `npm run index` copia `VERSION`
desde el maestro. La tercera es independiente y no tiene por qué parecerse.

`npm run maestro` imprime `VERSION`, y donde eso se comprueba es en el menú
de la hoja de la tienda —que se llama como el comercio—, no en el menú
**Panel**. Los dos menús
tenían una opción llamada Diagnóstico que decía "Versión de este código", y eso
invitaba a comparar peras con manzanas. Ahora cada uno dice de qué es su
versión, y el diagnóstico del panel lista además qué versión del maestro corre
cada tienda — que es la pregunta que uno quería hacer.

Y hay una cuarta numeración que no es de código: `version` en `package.json`,
que es la del producto y la que exige el flujo de pruebas cuando un pull
request toca algo desplegable.

## 7. Lo que cuesta operar una tienda

| | |
|---|---|
| Google (cuenta, hoja, Apps Script, Drive) | $0 |
| Cloudflare (sitio, ancho de banda) | $0 |
| GitHub (repositorio, Actions, releases) | $0 |
| Dominio propio | Opcional. Un dominio nuestro alcanza para todas como subdominios |
| **Total en efectivo** | **$0/mes** |

Lo único que cuesta es tiempo de montaje, y ese es el número que hay que medir
—con cronómetro, montando una tienda de verdad— antes de ponerle precio al
servicio.

---

## 8. Idempotencia y concurrencia

Cinco mecanismos, cada uno por un bug real de producción, no por precaución
teórica:

| Mecanismo | Problema que resuelve |
|---|---|
| Número de pedido estable | Se calcula una vez por carrito y solo se reinicia cuando el carrito queda vacío. Antes se generaba en cada envío y un doble toque creaba dos pedidos |
| Deduplicación en el servidor | `registrar` ignora un número de pedido ya grabado. Tres envíos del mismo pedido dejan una sola entrada |
| `LockService` + upsert por número | `Validaciones` se escribe leyendo-y-escribiendo bajo candado. Sin él, dos validaciones simultáneas creaban dos filas con códigos distintos |
| Columna `Inventario` | Marca cada línea como *Descontado* o *Devuelto*. Hace que confirmar, anular y volver a confirmar no descuadre el stock, y que la rutina se pueda correr mil veces sin efecto |
| Congelado tras el envío | Una fila de `Validaciones` cuyo pedido ya se registró no se puede reescribir |

El inventario **no** se descuenta al enviar el pedido, a propósito: un pedido
abierto en WhatsApp no es una venta, y si descontara ahí, cualquiera podría
dejar el inventario en cero abriendo pedidos que nunca paga.

## 9. Seguridad

El modelo de amenaza parte de un hecho: **todo lo que está en el navegador es
del atacante.** El HTML se lee, el JavaScript se edita, la consola está
abierta.

| Riesgo | Mitigación |
|---|---|
| Alterar el total desde la consola | El servidor recalcula todo con los precios de la hoja. La tienda nunca es la autoridad sobre el precio. Además `Object.freeze` sobre catálogo, cupones y envíos |
| Inventar o reutilizar un cupón | Los cupones viven solo en la hoja, con vigencia, mínimo y tope de usos |
| Clonar el sitio y cambiar la llave de pago | Los datos de pago no están en la página. Se entregan por respuesta automática de WhatsApp, que además advierte al cliente que no transfiera si ve otra llave. Eso hace inútil una copia |
| Inyección de fórmulas en Sheets | `celdaSegura()` antepone un apóstrofo a todo valor que empiece por `=`, `+`, `-`, `@` o un carácter de control, y recorta a 60 caracteres |
| XSS y carga de recursos ajenos | CSP en la etiqueta `meta` y en `_headers`: `default-src 'none'`, con lista explícita para estilos, tipografías, imágenes y `connect-src`. `frame-ancestors` solo funciona en cabecera, por eso existe `_headers` |
| Payloads absurdos al backend | Tope de 30 ítems, cantidad máxima 200, total máximo 5.000.000, IDs que no estén en el catálogo se descartan, duplicados se colapsan y el `Estado` nunca lo decide quien envía |
| Datos personales | La hoja **sí** guarda nombre, celular y dirección — es tratamiento de datos personales y en Colombia lo regula la Ley 1581 de 2012, con el aviso que arman las claves `empresa_*` de Configuración. No hay CRM ni historial cruzado entre tiendas: cada hoja es de un solo comercio, con un solo editor |

> **Lo que este diseño NO puede impedir.** `wa.me` solo rellena la caja de
> texto: **el cliente puede editar el mensaje antes de enviarlo.** Por eso el
> mensaje es lo que el cliente decidió escribir, no un documento con validez.
> El código de verificación permite cruzar contra la fila de `Validaciones`,
> pero el punto de control final es el dueño revisando el total antes de
> despachar — es el paso "Antes de despachar, siempre" de `GUIA-COMERCIANTE.md`.

## 10. Límites nativos de Google

Números que no dependen de Cloudflare, Drive ni de ningún proveedor de fotos:
son cuotas del lado de Apps Script y Sheets, y las únicas que no cambian con
cada rediseño del frontend.

| Recurso | Tope | Qué significa aquí |
|---|---|---|
| Google Sheets | 10 millones de celdas | Muy por encima del tope que impone el propio script |
| Filas de `Pedidos` | 20.000 (`MAX_FILAS`) | Una fila por línea de pedido: **6.000 a 10.000 pedidos**. Al llegar, el script se niega a escribir con un mensaje claro en vez de corromper la hoja: hay que archivar y vaciar |
| Correo | 100 al día | El resumen gasta 1 |
| Disparadores | 90 minutos al día | El recálculo horario tarda segundos. Sobra |
| Ejecución | 6 minutos cada una | La más lenta —recalcular tablero con miles de filas— va muy por debajo |
| Concurrencia | 30 ejecuciones simultáneas por cuenta de Google | Ya no la consume cada visita: el catálogo se sirve estático desde Cloudflare. La consumen enviar un pedido, aplicar un cupón, abrir el menú o el panel — sucesos, no visitas |

> Con el catálogo horneado (§6) la tienda deja de golpear Apps Script en cada
> visita, así que el techo de concurrencia de arriba deja de ser el límite
> práctico del tráfico del sitio — la sirve Cloudflare — y pasa a ser el
> límite de cuántos **pedidos y validaciones a la vez** aguanta una tienda. No
> hay una medición reciente de ese número con la arquitectura de hoy: si una
> tienda concentra pedidos en picos (una promoción por WhatsApp a muchos a la
> vez), es lo primero que habría que volver a medir.

## 11. Cómo se prueba: el emulador `gas.js`

La pieza que hace que `pruebas/todas.sh` pruebe el producto y no una imitación
de él es `pruebas/gas.js`: un emulador de Google Apps Script y Sheets que
**carga `maestro.gs` tal cual** y le inyecta el entorno de Google
(`SpreadsheetApp`, `CacheService`, `LockService`, `MailApp`, `HtmlService`…).
Existe porque una versión anterior del banco de pruebas reimplementaba el
backend a mano: validaba la imitación, no el código real. El servidor de
pruebas sirve `index.html` reescribiendo `SCRIPT_URL`, de modo que el
navegador habla con el backend real, emulado pero no reescrito.

## 12. Decisiones de diseño que ya se tomaron, sin condición de disparo

Distinto de `DECISIONES.md`: esto no va a cambiar con un umbral que se cruce,
es la forma que tiene el producto hoy y por qué.

- **La hoja es la única fuente de verdad** de precios, stock, envíos, cupones,
  marca y textos. `publicar/index.html` solo guarda un respaldo —el que
  escribe `montar/sembrar-respaldo.mjs`— que evita que la tienda se caiga si
  Google no responde.
- **Fallo cerrado en cupones**: si la hoja no responde, no se aplica
  descuento. Un cupón aplicado sin validar es plata perdida.
- **Fallo abierto en catálogo**: si la hoja no responde, la tienda sirve el
  catálogo de respaldo horneado en el archivo. Una tienda vacía es peor que
  una desactualizada — es la razón de ser de la 4.20 (`BITACORA.md`).
- **Los gráficos del tablero se dibujan con bloques** (`█`) y no con
  `SPARKLINE`: las fórmulas de Sheets cambian de separador según el idioma de
  la hoja, y una fórmula escrita desde el script se rompe con solo cambiar el
  idioma. Un bloque de texto se ve igual en todas partes.
- **El correo se revisa cada hora** en vez de programar un disparador a una
  hora fija, porque la hora vive en la hoja. Se cura solo si Google se salta
  una ejecución.

Límites conocidos, aceptados y no accidentales:

- **La vista previa de un enlace de producto** es la de la tienda, no la del
  producto: los rastreadores no ejecutan JavaScript. Arreglarlo pediría una
  página por producto y un paso de build.
- **El total del mensaje de WhatsApp es editable** por el cliente antes de
  enviarlo. Mitigado con el código de verificación y el paso de revisión del
  dueño (§9).
- **El contador de usos de un cupón** se actualiza cada hora: uno de un solo
  uso conviene apagarlo a mano apenas se use.
- **Sin pasarela de pagos.** El cobro se acuerda por chat. Es parte de la
  premisa de costo cero, no una omisión.
