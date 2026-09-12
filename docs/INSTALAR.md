# Instalar la hoja y el Apps Script

> **⚠ Este documento cubre un tramo, y está atrasado.** El mapa de punta a punta
> es **`docs/DESPLIEGUE.md`** y es el que manda. Lo de aquí sigue sirviendo para
> el detalle de su tramo, pero se escribió antes de la 2.6.0 y **no menciona
> «Publicar ahora»**, que es el botón que hace que un cambio de precio llegue a
> la tienda. Donde hable de «Confirmado», hoy se llama **Pagado**.


Guía para dejar el catálogo, los cupones y el registro de pedidos
funcionando. Toma unos 20 minutos. Hazlo desde un computador, no desde
el celular.

Este archivo es para ti. NO se sube a Netlify.


## Cómo se llama cada cosa

**El archivo de Google Sheets:** el nombre es tuyo, no afecta nada.
Sugerencia: `<Comercio> — pedidos`. Solo sirve para encontrarlo en Drive.

**El proyecto de Apps Script:** toma solo el nombre de la hoja. Déjalo.

**El archivo de código dentro de Apps Script:** viene como `Código.gs`.
Déjalo así. El nombre no importa, solo el contenido.

**Las pestañas de la hoja:** ESTAS SÍ IMPORTAN Y NO SE PUEDEN RENOMBRAR.
Las crea el script solo, con estos nombres exactos:

    Configuración · Catálogo · Envíos · Cupones · Validaciones ·
    Pedidos · Más vendidos · Tablero · Errores

De esas, **Tablero y Más vendidos las escribe el script solo**: se
reescriben enteras en cada recálculo, así que no anotes nada ahí.

Si le cambias el nombre a una, el script deja de encontrarla y la tienda
se queda sin catálogo, sin avisar. Tampoco muevas ni insertes columnas
en medio: agregar columnas a la DERECHA es seguro, insertarlas en medio
descuadra todo.


## Antes de empezar: el error que más se comete

El script tiene que vivir DENTRO de la hoja, no aparte. Si entras a
script.google.com y creas un proyecto suelto, el script no sabe a qué
hoja pertenece y nada funciona.

Se hace al revés: primero la hoja, y el script desde el menú de la hoja.


## Paso a paso

### 1. Crear la hoja
Entra a https://sheets.new y ponle nombre arriba a la izquierda.

### 2. Abrir el editor
Menú **Extensiones > Apps Script**. Se abre una pestaña nueva.

### 3. Pegar el código
Borra lo que trae (`function myFunction() {}`), abre `apps-script.gs` de
esta carpeta, copia TODO y pégalo. Guarda con Ctrl+S.

### 4. Ejecutar instalar() una sola vez
Arriba, al lado de "Depurar", hay un desplegable de funciones.

**MIRA QUÉ DICE ANTES DE DARLE EJECUTAR.** Ese desplegable elige sola la
primera función del archivo. Tiene que decir **instalar**. Si dice otra
cosa, ábrelo y elige `instalar`.

Es el error que más cuesta: cualquier otra función se ejecuta sin dar
error y sin hacer nada visible. El registro dice "Se completó la
ejecución", tú crees que funcionó, y la hoja sigue vacía.

Ya con **instalar** seleccionado, dale **Ejecutar**.

Google va a pedirte permisos. El camino es:

  Revisar permisos → elige tu cuenta → aparece "Google no ha verificado
  esta aplicación" → **Configuración avanzada** → **Ir a (nombre) (no
  seguro)** → Permitir

Esa advertencia es normal: el script es tuyo y Google no verifica
proyectos personales. Le estás dando permiso a tu propio código.

Cuando termine, el Registro de ejecución de abajo debe mostrar algo así:

    Instalando en la hoja: <Comercio> — pedidos
    LISTO. Pestañas de la hoja: Catálogo, Envíos, Cupones, ...
    Productos cargados: 8
    Siguiente paso: Implementar > Nueva implementación > Aplicación web.

Si solo dice "Se inició la ejecución / Se completó la ejecución" sin esas
líneas, ejecutaste otra función. Vuelve a elegir `instalar`.

Ve a la pestaña de la hoja y recárgala: deben aparecer las nueve
pestañas, con el catálogo, los envíos y los cupones ya cargados. También
queda programado el resumen de más vendidos y el tablero cada hora.

Si quieres, borra la pestaña vacía "Hoja 1" que quedó.

### 4a. Dónde sale la configuración para index.html

Menú de la hoja > Generar configuración para index.html**. Se abre una
ventana sobre la hoja con **dos cajas de texto y un botón de copiar en
cada una**:

1. El bloque del `<head>` — reemplaza todo lo que hay en index.html entre
   las marcas `CONFIGURACIÓN DE ESTA TIENDA` y `FIN DE LA CONFIGURACIÓN`,
   marcas incluidas.
2. Las cuatro líneas del `<script>` — ahí va la versión, el nombre y el
   WhatsApp de respaldo. **La URL que termina en /exec la pegas tú**: es
   lo único que el script no puede saber de sí mismo.

Después de pegar los dos, vuelve a publicar el sitio.

Esto NO hay que hacerlo cada vez que cambies un precio ni un producto:
eso ya sale de la hoja en caliente. Solo se usa cuando cambia el título,
la descripción o el dominio, porque esas tienen que ser HTML fijo —
WhatsApp y Google leen la página sin ejecutar JavaScript.

### 4b. Que te llegue el resumen diario (opcional, 30 segundos)

En la pestaña **Configuración**, busca la fila `correo_resumen` y escribe
tu correo en la columna Valor. Eso es todo: mañana a las 7 te llega.

- `correo_hora` — a qué hora sale, de 0 a 23.
- `correo_siempre` — No (por defecto) hace que solo llegue cuando hay
  algo: ventas ayer, pedidos por confirmar, agotados o errores.
- `correo_ultimo` — lo escribe el script. No lo edites.

Para probarlo sin esperar: menú de la hoja > Enviarme el resumen ahora**.
La primera vez Google te va a pedir permiso para enviar correos en tu
nombre; es el mismo permiso que ya diste al instalar.

Si más adelante actualizas el código y aparecen opciones nuevas, vuelve a
ejecutar `instalar()`: agrega las filas que falten a Configuración sin
tocar lo que ya escribiste.

### 5. Publicar el script como aplicación web
Botón azul **Implementar > Nueva implementación**.

  - Al lado de "Seleccionar tipo", el ícono de engranaje → **Aplicación web**
  - Descripción: `v1`
  - Ejecutar como: **Yo**
  - Quién tiene acceso: **Cualquier persona**

Esa última opción es la que más se equivoca. Tiene que ser "Cualquier
persona" (en algunas versiones dice "Cualquier usuario"). Si eliges
"Cualquier persona CON CUENTA DE GOOGLE", tus clientes no van a poder
cargar el catálogo.

Dale **Implementar** y copia la URL larga que termina en **/exec**.

### 6. Probar el script ANTES de tocar la tienda
Pega esa URL en una pestaña del navegador. Debe responder:

    Servicio activo.

Ahora agrégale `?a=catalogo` al final. Debe salir un texto que empieza
por `{"ok":true,"productos":[...` con tus ocho productos.

Si en vez de eso ves una pantalla de inicio de sesión de Google, el
acceso quedó mal en el paso 5. Vuelve y corrígelo.

### 7. Conectar la tienda
Abre `index.html` con el Bloc de notas o cualquier editor. Busca:

    const SCRIPT_URL = "";

y pega la URL entre las comillas:

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfy.../exec";

### 8. Vaciar los cupones del archivo
Un poco más abajo está `const CUPONES = { ... }` con tres cupones.
Bórralos y déjalo así:

    const CUPONES = {};

Desde ahora los cupones viven en la hoja. Los del archivo solo eran el
modo local, para mientras no existiera el script.

### 9. Comprobar que quedó conectado
Abre `index.html` en el navegador. Cambia el precio de un producto en la
pestaña Catálogo de la hoja, espera un minuto y recarga la tienda: debe
salir el precio nuevo.

El minuto es a propósito. El script guarda el catálogo en caché 60
segundos para no leer la hoja en cada visita. Si recargas de inmediato
todavía verás el precio viejo; no está roto.


## LO MÁS IMPORTANTE: publicar una VERSIÓN NUEVA

Cada vez que cambies `apps-script.gs`, guardar NO es suficiente. La URL
`/exec` sigue sirviendo la versión anterior hasta que hagas:

    Implementar > Gestionar implementaciones > lápiz (editar) >
    Versión: Nueva versión > Implementar

La URL no cambia. Este es EL error de esta plataforma: el editor te
muestra el código nuevo y la URL entrega el viejo, así que todo parece
bien y nada funciona.

### Cómo saber cuál versión está publicada
Abre en el navegador tu URL con `?a=version` al final:

    https://script.google.com/macros/s/AKfy.../exec?a=version

Responde algo como `{"ok":true,"version":"2026-09-04-4"}`. Ese número
tiene que ser el mismo de la constante `VERSION` que ves arriba en el
editor, y el mismo de `SCRIPT_VERSION` en index.html.

Si no coinciden, falta publicar la versión nueva.

### La tienda también lo detecta
Si las versiones no cuadran, la tienda deja de verificar los pedidos:
todos salen marcados "Total calculado por la página" y en la consola del
navegador (F12) aparece un aviso diciendo exactamente qué hacer. Es a
propósito: prefiero que se note de una vez a que unos pedidos se
verifiquen y otros no.


## Cómo se opera todos los días

**Agregar un producto:** una fila en Catálogo. Nada más.
**Quitar un producto:** Activo = No.
**Empujar un producto:** Destacado = Sí.
**Cambiar un precio:** la celda. Efecto en un minuto.
**Apagar un cupón:** Activo = No en la pestaña Cupones.
**Limitar un cupón:** Usos máximos. 0 significa sin tope.

**Cerrar una venta:** en la pestaña Pedidos, cambia el Estado de
"Por confirmar" a "Confirmado". El reporte de más vendidos y el conteo
de usos de cupones solo cuentan los confirmados, y se actualizan cada
hora.

**Revisar un pedido sospechoso:** el mensaje de WhatsApp trae
"Validación: R-XXXX". Busca esa referencia en la pestaña Validaciones.
La columna Discrepancia te dice si el total que mostró la página no
coincidía con el que calculó la hoja.


## Seguridad de la hoja

NO uses "Archivo > Compartir > Publicar en la web", y no la compartas
con nadie. La tienda nunca lee la hoja directamente: le pregunta al
script. Por eso la hoja puede quedarse privada.

Los pedidos NO guardan nombre, celular ni dirección. Solo ciudad,
productos, cupón y total. Esos datos personales viven únicamente en tu
conversación de WhatsApp.


## La herramienta de diagnóstico

Si algo no cuadra, en el editor elige la función **diagnostico** y dale
Ejecutar. El Registro de ejecución te dice en español qué está mal:

    Hoja: <Comercio> — pedidos
    OK   Catálogo   (8 filas)
    OK   Envíos   (5 filas)
    FALTA la pestaña: Cupones
    FALTA el disparador del resumen. Ejecuta instalar().
    Lo que ve la tienda: 8 productos y 5 tarifas de envío.

Si el script no está unido a ninguna hoja, te lo dice y te explica cómo
arreglarlo.


## Si algo falla

**`?a=catalogo` devuelve `{"ok":true,"productos":[],"envios":[]}`** → las
pestañas no existen. No ejecutaste `instalar()`, o ejecutaste otra
función. Vuelve al paso 4 y revisa el desplegable.

Después de ejecutar `instalar()`, espera hasta un minuto antes de volver
a probar la URL: el script guarda la respuesta en caché 60 segundos.

**"No pudimos validar tu código"** en el carrito → el script no está
respondiendo. Revisa el paso 6.

**La tienda muestra los precios viejos y no los de la hoja** → o pasó
menos de un minuto, o SCRIPT_URL quedó mal pegada, o la implementación
tiene una versión vieja.

**Un producto no aparece** → revisa que tenga ID, Nombre y Activo = Sí.
Sin esos tres se descarta.

**Aparecen filas raras en la pestaña Errores** → alguien mandó algo que
el script rechazó. Es la defensa funcionando. Si se llena de golpe,
avísame.

**El resumen de más vendidos está vacío** → solo cuenta pedidos con
Estado "Confirmado", y se recalcula cada hora.
