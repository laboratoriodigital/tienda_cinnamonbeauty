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
| `docs/` | `PLAN.md`: qué se construye y en qué orden. `SPRINT-0.md`: el sprint en curso, con su avance. `ADOPCION.md`: qué se adopta de la arquitectura v3 y qué se controvierte. **`CONTRATOS.md`: el contrato de datos, normativo.** `SPRINT-1.md` y `SPRINT-2.md`: los sprints en curso. `ARQUITECTURA.md`: el porqué del diseño de hoy. `DECISIONES.md`, `BITACORA.md`, despliegue, montaje, manuales y hoja de ruta. |
| `originales/` | Fotos pesadas. **No se versiona**: viven en el Drive del comercio. |

## Poner a andar una tienda

Hay dos guías, y se eligen por el equipo que tengas delante:

- **`docs/RUNBOOK.md`** — la ruta corta: solo navegador y GitHub Actions, sin
  instalar nada.
- **`docs/DESPLIEGUE-CLIENTE.md`** — la lista larga, con el porqué de cada paso,
  las capturas y los fallos comunes.

En cualquiera de las dos, el esqueleto es el mismo:

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

Las órdenes del día a día, en `docs/MONTAJE.md`. El porqué de cada decisión, en
`docs/ARQUITECTURA.md`. Lo que falta mirar antes del primer comprador real, en
`docs/ANTES-DE-SALIR.md`.

## Cómo trabajamos

GitHub Flow: `main` siempre desplegable, una rama por cambio, pull request corto.

```
feature/frontend: paginación de 25, 50 y 100 productos
bugfix/backend: el cupón se aplicaba sin validar cuando la hoja no respondía
hotfix/frontend: el emoji rompía la caja de escritura de WhatsApp
refactor/backend: el maestro sale de la hoja y abre por ID
```

Tipos: `feature` · `bugfix` · `hotfix` · `refactor`
Ámbitos: `frontend` (la tienda) · `backend` (el maestro) · `bd` (estructura de la hoja)

**Antes de abrir el pull request:** `./pruebas/todas.sh` en verde.
Cada rama publica una vista previa propia en Cloudflare; `main` publica producción.

## Lo que no se versiona

La llave de pago, los ID de hoja y los tokens **no van en el repositorio**.
La llave se entrega por la respuesta automática de WhatsApp Business; el token
lo inventa el maestro y lo guarda en las propiedades de su proyecto.
