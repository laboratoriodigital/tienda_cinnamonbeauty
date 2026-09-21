# Cómo se trabaja aquí

GitHub Flow, sin ramas de larga vida. `main` está siempre desplegable porque
cada push a `main` sale a producción.

Los cambios de variantes deben conservar productos tradicionales, columnas
append-only e identidad estable. Además de la suite completa, ejecuta
`pruebas/variantes.js` y `pruebas/variantes-ui.js`; el contrato está en
`docs/PLAN-VARIANTES.md`.

## El ciclo

```bash
git switch main && git pull                      # partir de lo último
git switch -c feature/frontend-buscador          # una rama por cambio

# ...trabajar...

./pruebas/todas.sh                               # en verde antes de seguir
git add -A
git commit -m "feature/frontend: buscador por descripción, no solo por nombre"
git push -u origin feature/frontend-buscador
```

Después: abrir el pull request en GitHub, esperar la marca verde de las
pruebas, revisar la **vista previa** que Cloudflare publica para esa rama, y
hacer *Squash and merge*. Al fusionar, `main` se despliega solo.

## El mensaje

    tipo/ámbito: qué cambió, en una línea

**Tipos**

| | |
|---|---|
| `feature` | Algo que antes no se podía hacer. |
| `bugfix` | Algo que no funcionaba como debía. |
| `hotfix` | Un bugfix urgente, directo a producción. |
| `refactor` | Cambia por dentro, no cambia lo que el usuario ve. |

**Ámbitos**

| | |
|---|---|
| `frontend` | `publicar/` — la tienda. |
| `backend` | `maestro.gs` — el Apps Script. |
| `bd` | La estructura de la hoja: pestañas, columnas, claves de Configuración. |
| `pagos` | Adaptadores, checkout, conciliación y avisos posteriores al pago. |

**Qué escribir.** El *qué* y el *por qué*, no el *cómo*. El diff ya dice cómo.

    bien   bugfix/backend: los pedidos repetidos entraban dos veces al confirmar rápido
    mal    bugfix/backend: arreglos varios
    mal    bugfix/backend: cambio en la línea 412 de aplicarInventario

Si el cambio toca la tienda y el maestro a la vez, casi siempre son dos ramas.
Si de verdad es uno solo, el ámbito es el que manda el cambio.

## Cortar una versión

`main` despliega la tienda de referencia. Los clientes no viven de `main`:
viven de versiones con nombre, y cada uno se mueve cuando alguien aprueba su
pull request. Por eso no hay rama `develop`: la separación entre "lo último" y
"lo que corre en los clientes" la da la etiqueta, no una rama paralela que
después hay que mantener sincronizada.

1. En la rama del cambio, sube `version` en `package.json`.
   Parche `1.0.1` si nada cambió para el cliente · menor `1.1.0` si hay algo
   nuevo · mayor `2.0.0` si una tienda vieja necesita tocar la hoja o el
   maestro para seguir funcionando.
2. Fusiona a `main`.
3. Espera que el flujo **pruebas** del push quede verde.
4. Actions > **release** > Run workflow.

`release` comprueba por API que **ese mismo commit** ya tenga la suite completa
verde; no la repite. Después crea la etiqueta `v1.1.0` y publica la versión con
`index.html`, `maestro.gs` y `publicar.tar.gz` colgados. Si la etiqueta ya apunta
al mismo commit termina en verde sin repetir trabajo; si apunta a otro, falla y
hay que subir `version`.

Cada repositorio de cliente pide la última así, sin credenciales:

```
https://github.com/laboratoriodigital/organico/releases/latest/download/index.html
```

## Un cambio urgente en producción

```bash
git switch main && git pull
git switch -c hotfix/frontend-total-mal
# arreglar, correr pruebas
git commit -m "hotfix/frontend: el envío no se sumaba al total con cupón de porcentaje"
git push -u origin hotfix/frontend-total-mal
```

Igual pasa por pull request. La diferencia del `hotfix` es la prioridad de la
revisión, no saltarse el proceso: `main` va directo a los clientes.

## Reglas de despliegue, siempre

- **Nada al backend un viernes después de mediodía ni en fecha comercial
  alta.** Un error se nota mejor un martes en la mañana que un sábado.
- **Todo cambio de `maestro.gs` arranca en la tienda cero y espera una hora**
  antes de tocar cualquier otra.
- **Prohibido renombrar o reordenar columnas de la hoja.** Solo agregar al
  final — el maestro lee por posición, no por nombre.
- **Un cambio de esquema nunca en un paso**: primero la versión que acepta las
  dos formas, después la migración, y solo entonces se retira el soporte
  viejo.

## Ojo con esto

- **La versión del contrato.** `VERSION` en `maestro.gs` y `SCRIPT_VERSION` en
  `index.html` tienen que coincidir. Ya no se copia a mano: `npm run index` la
  escribe desde el maestro, y `version.js` comprueba que una tienda hablando
  con un maestro viejo lo diga en vez de sellar pedidos mentirosos.
- **La versión del producto.** Si el pull request toca `maestro.gs`, `panel.gs`
  o `publicar/index.html`, tiene que subir `version` en `package.json`. Lo
  exige el flujo de pruebas y falla si no. No es burocracia: sin eso una mejora
  sale al aire y el panel sigue mostrando a todas las tiendas "al día".
- **Publicar el Apps Script es aparte.** Fusionar a `main` despliega la tienda,
  no el maestro. El maestro se publica con `npm run maestro`, que actualiza la
  implementación que ya existe y por eso no cambia la URL.
- **Nada de secretos.** Llaves de pago, ID de hojas y tokens no entran al
  repositorio, ni siquiera en un comentario.
- **Un pago no se prueba solo con una pantalla.** Todo cambio de checkout debe
  cubrir creación, monto recalculado, aprobación, rechazo, reconsulta e
  idempotencia. Antes de replicarlo se completa la matriz de
  `docs/PLAN-PAGOS-BOLD.md` en Orgánico.
- **El despliegue es gradual.** Orgánico primero, Panadería después y Cinnamon
  solo tras aprobación expresa. Nunca se copian Propiedades del script entre
  tiendas: cada cuenta Bold tiene sus propias llaves.
- **La CSP vive en tres sitios.** Si cambia un origen ejecutable o de conexión,
  deben coincidir el `<meta>` de `publicar/index.html`, la generación de
  `maestro.gs` y `publicar/_headers`; `montaje.js` lo comprueba.
