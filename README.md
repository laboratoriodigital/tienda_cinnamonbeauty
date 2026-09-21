# Tienda en línea para negocios pequeños

Una página estática, una hoja de cálculo que hace de base de datos y de panel,
y un cierre configurable: pasarela Bold verificable o pedido por WhatsApp para
el comercio que todavía no tiene cuenta de pagos. La infraestructura base conserva
un costo de operación de **$0/mes**; las tarifas del proveedor de pagos se
liquidan aparte.

El catálogo admite variantes opcionales declaradas como
`Color: Azul|Verde; Talla: S|M|L`. Apps Script mantiene precio, stock, fotos,
reservas y pedidos por combinación; el diseño está en
[`docs/PLAN-VARIANTES.md`](docs/PLAN-VARIANTES.md).

El catálogo también se hornea para buscadores: portada con Organization y
WebSite, fichas estáticas Product/ProductGroup, sitemap y robots sin consultas
adicionales a Apps Script. Diseño y operación en
[`docs/PLAN-SEO-RENDIMIENTO.md`](docs/PLAN-SEO-RENDIMIENTO.md).

Este repositorio publica **Cinnamon Beauty**. La semilla del código está en
`laboratoriodigital/organico`; esta tienda conserva su propio catálogo,
fotografías, hoja, Apps Script y dominio. Los secretos de pago se configuran
en las Propiedades del script de Cinnamon, nunca aquí.

Tienda: **https://cinnamonbeauty.laboratoriodigital-la.workers.dev**

La actualización 3.6.1 y los pasos de activación están en
[`docs/ACTUALIZAR-UNA-TIENDA.md`](docs/ACTUALIZAR-UNA-TIENDA.md). En este
repositorio se ejecutan `pruebas`, `montaje` y `fotos`; `release` es exclusivo
de la semilla.

## Qué hay aquí

| | |
|---|---|
| `publicar/` | **Lo que se despliega.** Es la raíz del sitio en Cloudflare. |
| `maestro.gs` | El backend completo. Va en un proyecto Apps Script **independiente**, uno por comercio. |
| `panel.gs` | El archivo de gestión: todas las tiendas en un tablero. Va dentro de su propia hoja, que no se comparte con ningún cliente. |
| `montar/` | Las herramientas del montaje: configuración, fotos, catálogo, respaldo, SEO estático y publicación del maestro. |
| `preparar-fotos.mjs` | Convierte originales sueltos en las versiones que se publican (WebP por tamaños). |
| `.github/workflows/` | Los mismos pasos, corriendo desde GitHub Actions. |
| `servicio/` | El alta de una tienda. **No corre aquí**: va copiado en `laboratoriodigital/tiendas`, que es el único repositorio con permiso para crear repositorios. |
| `pruebas/` | Baterías sobre el código real, no sobre una copia. `./pruebas/todas.sh` |
| `docs/` | `DESPLIEGUE.md`: el mapa completo. Planes de pagos, variantes, Actions y SEO/rendimiento. `ARQUITECTURA.md`, **`CONTRATOS.md`**, `DECISIONES.md`, `ROADMAP.md`, `BITACORA.md` y guías de entrega/actualización. |
| `originales/` | Fotos pesadas. **No se versiona**: viven en el Drive del comercio. |

## Poner a andar una tienda

**`docs/DESPLIEGUE.md`** — el mapa de punta a punta, en orden, con quién hace
cada cosa, los tres sitios donde el orden cuesta una hora y los fallos
comunes. Es el único; hasta la 3.0.0 había cuatro más describiendo tramos de
lo mismo y se quedaban atrás sin que nadie lo notara — se consolidaron ahí y
se borraron.

El esqueleto:

1. Repositorio nuevo a partir de esta plantilla —el flujo **tienda nueva** de
   `laboratoriodigital/tiendas` lo hace y lo deja configurado—, y conectarlo a
   Cloudflare.
2. Cuenta de Google y hoja nuevas para ese comercio; copiar el `HOJA_ID`.
3. `script.google.com` → Proyecto nuevo → pegar `maestro.gs` → llenar `HOJA_ID`.
4. Implementar → Aplicación web (Ejecutar como: Yo · Acceso: cualquier persona).
   **Una sola vez en la vida de la tienda:** después se actualiza esa misma.
5. Ejecutar `instalar()` y pegar en la hoja el stub que imprime.
6. Llenar la hoja y montar, con el flujo `montaje` o con `npm run montar`.
7. Pull request, vista previa, merge. Cloudflare despliega.
8. En `Configuración`, elegir en las listas el modo, proveedor, ambiente e
   integración. Si se elige Bold, instalar en ese Apps Script las llaves del
   titular —pueden repetirse entre vitrinas del mismo dueño— y completar la
   matriz sandbox por tienda antes de activar producción.

Para poner al día una tienda que **ya** está montada cuando sale una versión
nueva: `docs/ACTUALIZAR-UNA-TIENDA.md`. Ninguna se mueve sola.

El porqué de cada decisión, en `docs/ARQUITECTURA.md`. Lo que falta mirar antes
del primer comprador real, en `docs/ANTES-DE-SALIR.md`.

## Cómo trabajamos

GitHub Flow: `main` siempre desplegable, una rama por cambio, pull request
corto, `./pruebas/todas.sh` en verde antes de abrirlo. El detalle —tipos de
rama, mensaje de commit, cómo cortar una versión— en `CONTRIBUIR.md`.

## Lo que no se versiona

Las llaves de identidad y secreta de Bold, los ID de hoja y los tokens **no van
en el repositorio**. Las credenciales de pago viven en Propiedades del script
del Apps Script de cada tienda. Los tokens públicos de consulta los inventa el
maestro y no permiten confirmar un pago.
