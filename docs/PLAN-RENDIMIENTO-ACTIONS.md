# Plan de rendimiento de GitHub Actions

## Objetivo

Reducir el tiempo desde **Publicar ahora** o `montaje` hasta que Cloudflare
reciba el commit, sin quitar la suite completa a los cambios de código y sin
multiplicar los minutos facturados de los repositorios privados.

La unidad de medida es reloj de pared de GitHub Actions. Cloudflare empieza
después del push y se mide aparte.

## Línea base · 20 de septiembre de 2026

Medida en ejecuciones reales del mismo commit `0b07baa`:

| Flujo | Total | Dónde se fue el tiempo |
|---|---:|---|
| `pruebas` por push | 2:13 | 1:38 suite · 0:18 navegador/dependencias |
| `release` | 2:19 | 2:03 repitiendo pruebas ya verdes · 0:09 publicando |
| `montaje` con maestro | 3:32 | 1:38 suite · 0:30 preparar pruebas · 0:33 publicar maestro |
| `fotos` con cambios | 2:43 | 1:33 suite · 0:23 preparar pruebas |
| `fotos` sin cambios | 0:25 | 0:12 en tres lecturas remotas consecutivas |

La suite ya admitía hasta cuatro procesos, pero dependía del número de núcleos
detectado. Dividirla en cuatro *jobs* habría bajado el reloj a costa de cobrar
cuatro runners. La decisión es ejecutar **cuatro procesos aislados dentro de un
solo runner**.

## Diseño

### 1. Dos niveles de comprobación

- `pruebas/todas.sh`: suite completa; obligatoria en cada push y pull request
  de código.
- `pruebas/publicacion.sh`: guardia de los bytes generados por la hoja y el
  Drive. Revisa carga/configuración del index, catálogo, fotos, enlace móvil,
  respaldo, checkout, variantes y contratos del montaje.

`publicacion.sh` no duplica el corredor: define `BATERIAS` y delega puertos,
paralelismo, salida y código de error a `todas.sh`.

### 2. Release reutiliza evidencia, no confianza

`release` ya no vuelve a correr la suite. Consulta Actions y exige una corrida
`push` exitosa de `pruebas.yml` cuyo `head_sha` sea exactamente `GITHUB_SHA`.
Si sigue activa, espera hasta cinco minutos; si no existe o falló, no etiqueta
ni publica.

### 3. Publicaciones prueban lo que cambió

`fotos` y `montaje` generan `publicar/index.html`, catálogo, fotos, fichas SEO,
sitemap y robots. Corren la guardia corta sobre esos archivos antes del commit.
Los cambios de código ya pasaron la suite completa al entrar a `main`.

### 4. Lecturas independientes en paralelo

Las revisiones de fotos, catálogo y configuración son de solo lectura y no se
dependen entre sí. `fotos` las inicia juntas y espera los tres resultados; el
paso tarda lo que tarde la más lenta, no la suma de las tres.

## Implementación y estado

- [x] Medir ejecuciones reales por flujo y por paso.
- [x] Fijar `TRABAJADORES=4` en `pruebas`, `fotos` y `montaje`.
- [x] Permitir que `todas.sh` reciba una selección sin duplicar el corredor.
- [x] Crear y ejecutar la guardia de publicación: **669/669 en 25,3 s local**.
- [x] Reejecutar la suite completa después de los cambios: **1427/1427**.
- [x] Reemplazar la suite duplicada en `fotos` y `montaje` por la guardia.
- [x] Reutilizar en `release` el verde verificable del mismo SHA.
- [x] Paralelizar las tres revisiones remotas de `fotos`.
- [x] No disparar la suite sobre los PR automáticos de `fotos` ni `montaje`:
  ambos ya ejecutaron su guardia y el PR de datos no cambia la versión.
- [x] Mantener caché de npm y Chromium en los tres flujos.
- [x] Versionar ambos `package-lock.json`, instalar con `npm ci` y hacer que las
  claves de npm/Chromium salgan del lock, no de rangos abiertos.
- [x] Añadir `restore-keys` en los tres flujos y ejecutar `--with-deps` solo
  cuando la caché de Chromium no acertó.
- [x] Añadir SEO a la guardia corta sin una segunda consulta al maestro.
- [ ] Después del push, registrar aquí los tiempos reales de `pruebas`,
  `release`, `montaje` y `fotos` con la versión 3.6.0.

## Metas para la primera corrida remota

| Flujo | Meta |
|---|---:|
| `release`, si el push ya está verde | menos de 30 s |
| `fotos` sin cambios | menos de 20 s |
| guardia dentro de `fotos`/`montaje` | menos de 40 s |
| `fotos` con cambios | menos de 1:45 |
| `montaje` sin publicar maestro | menos de 2:00 |

`montaje` con maestro puede superar dos minutos por Google/clasp; esa parte no
se paraleliza porque actualizar una implementación y comprobarla tiene orden.

## Guardas y reversión

- Un cambio de código nunca usa solo la guardia corta.
- `release` falla cerrado si no encuentra el verde del mismo SHA.
- Una batería sin resultado cuenta como fallo; 0/0 no pasa.
- `TRABAJADORES=1` conserva el modo serial para diagnosticar.
- Si una publicación real descubre una cobertura ausente, se agrega la batería
  correspondiente a `publicacion.sh`; no se copia lógica al workflow.
- Si cuatro procesos empeoran el tiempo o agotan memoria en otro runner, se
  cambia solo `TRABAJADORES`, sin tocar las pruebas.

## Pendiente de observación

Comparar tres corridas con cambios y tres sin cambios por tienda. Solo después
se decide si vale la pena cachear `node_modules`; hoy npm cuesta 2–5 s y no es
el cuello de botella. `concurrency: tienda-…` se conserva serial porque `fotos`
y `montaje` escriben las mismas rutas: paralelizarlos entre sí sí crearía una
carrera de publicación.
