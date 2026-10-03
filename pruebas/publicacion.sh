#!/bin/bash
# Guardia corta para archivos GENERADOS desde la hoja y el Drive.
#
# Los cambios de código ya pasan por todas.sh al entrar a main. Los flujos
# `fotos` y `montaje` no cambian ese código: solo reescriben index.html,
# catalogo.json y fotos. Volver a probar backend, correo, calendario y panel
# sobre el mismo commit duplicaba minuto y medio sin observar bytes nuevos.
#
# Esta selección sí toca cada frontera que puede cambiar en una publicación:
# carga y configuración del index, catálogo/fotos, enlace móvil, respaldo,
# checkout, variantes y los propios contratos del montaje. Sigue corriendo con
# los cuatro procesos aislados de todas.sh y con el mismo criterio de salida.
export BATERIAS="movil.js enlace.js fotos.js config.js hoja.js montaje.js respaldo.js seo.js variantes-ui.js pagos-ui.js medicion.js identidad-cinnamon.js"
exec "$(dirname "$0")/todas.sh"
