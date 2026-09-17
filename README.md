# Tienda en línea para negocios pequeños

Una página estática, una hoja de cálculo que hace de base de datos y de panel, y
WhatsApp para cerrar la venta. Costo de operación **$0/mes**.

Este repositorio es la **plantilla**: cada comercio se monta en un repositorio
propio creado a partir de esta, con su propia cuenta de Google, para que tenga
sus propios límites gratuitos. Ningún nombre de comercio va escrito en el
código; todos salen de la pestaña Configuración de su hoja.

Primera tienda en línea con esto:
**https://organico.laboratoriodigital-la.workers.dev**

## Qué hay aquí

| | |
|---|---|
| `publicar/` | **Lo que se despliega.** Es la raíz del sitio en Cloudflare. |
| `maestro.gs` | El backend completo. Va en un proyecto Apps Script **independiente**, uno por comercio. |
| `panel.gs` | El archivo de gestión: todas las tiendas en un tablero. Va dentro de su propia hoja, que no se comparte con ningún cliente. |
| `montar/` | Las herramientas del montaje: sembrar la configuración, escribir el `<head>`, bajar las fotos de Drive y publicar el maestro. |
| `preparar-fotos.mjs` | Convierte originales sueltos en las versiones que se publican (WebP por tamaños). |
| `.github/workflows/` | Los mismos pasos, corriendo desde GitHub Actions. |
| `servicio/` | El alta de una tienda. **No corre aquí**: va copiado en `laboratoriodigital/tiendas`, que es el único repositorio con permiso para crear repositorios. |
| `pruebas/` | Baterías sobre el código real, no sobre una copia. `./pruebas/todas.sh` |
| `docs/` | `DESPLIEGUE.md`: el mapa, de punta a punta. `ARQUITECTURA.md`: el porqué del diseño de hoy. **`CONTRATOS.md`: el contrato de datos, normativo.** `DECISIONES.md`: lo que va a cambiar y cuándo. `ROADMAP.md`: qué se construye y en qué orden. `BITACORA.md`: incidentes reales y la lección que dejaron. `ANTES-DE-SALIR.md`, `ACTUALIZAR-UNA-TIENDA.md`, `TRASPASO.MD`, `GUIA-COMERCIANTE.md` y `manuales/`. |
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

Para poner al día una tienda que **ya** está montada cuando sale una versión
nueva: `docs/ACTUALIZAR-UNA-TIENDA.md`. Ninguna se mueve sola.

El porqué de cada decisión, en `docs/ARQUITECTURA.md`. Lo que falta mirar antes
del primer comprador real, en `docs/ANTES-DE-SALIR.md`.

## Cómo trabajamos

GitHub Flow: `main` siempre desplegable, una rama por cambio, pull request
corto, `./pruebas/todas.sh` en verde antes de abrirlo. El detalle —tipos de
rama, mensaje de commit, cómo cortar una versión— en `CONTRIBUIR.md`.

## Lo que no se versiona

La llave de pago, los ID de hoja y los tokens **no van en el repositorio**.
La llave se entrega por la respuesta automática de WhatsApp Business; el token
lo inventa el maestro y lo guarda en las propiedades de su proyecto.
