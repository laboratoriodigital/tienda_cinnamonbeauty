# Montar una tienda

> **⚠ Este documento cubre un tramo, y está atrasado.** El mapa de punta a punta
> es **`docs/DESPLIEGUE.md`** y es el que manda. Lo de aquí sigue sirviendo para
> el detalle de su tramo, pero se escribió antes de la 2.6.0 y **no menciona
> «Publicar ahora»**, que es el botón que hace que un cambio de precio llegue a
> la tienda. Donde hable de «Confirmado», hoy se llama **Pagado**.


Del cero a la tienda publicada. Lo que se hace a mano está marcado **[a mano]**;
lo demás lo hace una orden.

---

## Una sola vez, en tu equipo

```bash
npm install                  # sharp, para las fotos
npm i -g @google/clasp       # para publicar el maestro sin abrir el editor
clasp login                  # ver abajo: importa CUÁL cuenta
```

**`clasp login` tiene que ser con la cuenta DUEÑA DEL PROYECTO de Apps Script
de esa tienda.** No la del comercio, no la tuya personal: la que creó el
maestro. Si te autenticas con otra, `clasp push` falla con un error de permisos
que no dice eso. Para comprobar con cuál estás:

```bash
clasp show-authorized-user
```

Y como cada tienda vive en su propia cuenta, cambiar de tienda es volver a
hacer `clasp login`.

Y habilita la API de Apps Script una vez por cuenta:
<https://script.google.com/home/usersettings>

---

## Por cada tienda

### 1. La cuenta y la hoja **[a mano]**
Cuenta de Google nueva para esa tienda (los límites gratuitos son por cuenta —
ver `ARQUITECTURA.md`). Hoja de cálculo nueva. Copia lo que va entre `/d/` y
`/edit` en su URL: ese es el `HOJA_ID`.

### 2. El maestro **[a mano la primera vez]**
`script.google.com` → Proyecto nuevo → pegar `maestro.gs` → llenar `HOJA_ID`.
Guardar el `scriptId` (está en la URL, entre `/projects/` y `/edit`) en
`montar/.clasp.json`:

```json
{ "scriptId": "1AbC...", "rootDir": "../" }
```

Implementar → Nueva implementación → Aplicación web
· Ejecutar como: **Yo** · Quién tiene acceso: **Cualquier persona**

> Es la única vez que se crea una implementación. De aquí en adelante se
> actualiza la misma, y por eso la URL no cambia nunca.

### 3. `instalar()`
Crea las pestañas, la configuración, los formatos, las listas desplegables y
los disparadores. Se puede volver a correr cuando quieras: agrega lo que falte
sin tocar ningún valor tuyo.

### 4. El stub **[a mano]**
`instalar()` lo imprime completo en el registro de ejecución. En la hoja:
Extensiones → Apps Script → borrar todo → pegar → guardar → recargar la hoja.
Aparece el menú de la hoja.

> Este paso no se puede automatizar: hay que estar dentro de la hoja.

### 5. Apuntar el repositorio a esta tienda

```bash
npm run tienda
```

Pide dos datos —la URL `/exec` y el token, los que da el menú de la hoja →
**Diagnóstico**— y escribe `tienda.json` y `montar/.clasp.json`. El scriptId,
el nombre del negocio y el enlace de la hoja se los pregunta al maestro. Antes
de escribir comprueba que ese maestro contesta.

### 6. La carpeta de fotos **[a mano]**
Carpeta en el Drive de esa cuenta, compartida con el comercio. Su enlace va en
la hoja, en `Configuración > fotos_drive`. El comercio sube ahí sus fotos con
el nombre que va en la columna Imágenes: `chonto-1.jpg`.

### 7. Montar

```bash
npm run montar
```

Eso hace dos cosas:

- **`npm run index`** — le pregunta al maestro cómo debe quedar el `<head>` y
  las cinco constantes, y las escribe. Reemplaza el copiar y pegar del menú
  "Generar configuración". O aplica todo, o no toca el archivo.
- **`npm run fotos:drive`** — baja del Drive del comercio lo que falte o haya
  cambiado, lo convierte a WebP en tres tamaños más el JPG de respaldo, y
  actualiza `publicar/fotos/origen.json`, que es el registro de qué salió de
  qué archivo de Drive.

**`npm run montar` escribe archivos, no commitea.** El commit y el pull request
los hace el flujo `fotos` o `montaje` cuando corren en GitHub. En local el
ciclo lo cierras tú: rama, `git commit`, `git push`, pull request, y al fusionar
Cloudflare despliega.

---

## Cuando cambie el maestro

```bash
npm run maestro
```

Sube `maestro.gs` y actualiza **la implementación que ya existe**, así que la
URL no cambia y el `SCRIPT_URL` del index sigue sirviendo. Crear una
implementación nueva —que es lo que pasa al hacerlo a mano sin fijarse— estrena
URL y deja la tienda muda.

Corre en tu equipo y no en un flujo automático a propósito: cada tienda vive en
su propia cuenta de Google, y automatizarlo pediría guardar las credenciales de
todas en un mismo sitio. Se cambia de tienda con `clasp login`.

---

## Cuando el comercio cambia algo de su hoja

| Cambió | Qué hay que hacer |
|---|---|
| Precios, stock, productos, cupones, envíos | **Nada.** La tienda lo lee en vivo |
| Nombre, colores, textos, datos legales | `npm run index`, rama y pull request |
| Fotos en su carpeta de Drive | `npm run fotos:drive`, rama y pull request |
| Proveedor de transformación de fotos | **Nada.** Los tres conocidos ya están autorizados |

---

## Qué falla y cómo se ve

| Síntoma | Casi siempre es |
|---|---|
| `404` al llamar al maestro | La implementación quedó con acceso "Solo yo" |
| El menú de la hoja no cambió | Falta pegar el stub nuevo en la hoja |
| La tienda avisa que la versión no coincide | Falta `npm run maestro` |
| No veo las claves nuevas en Configuración | Falta correr `instalar()` |
| `npm run index` dice que falta `SCRIPT_URL` | El proyecto no está implementado todavía |
