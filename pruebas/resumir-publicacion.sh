#!/bin/bash
# Convierte la salida de la guardia en un diagnóstico visible en dos sitios:
# el Summary y la anotación roja del propio job. No escribe en Google Sheets:
# esta clase de fallo ocurre en GitHub después de que Apps Script contestó.
archivo=${1:-/tmp/pruebas.txt}
estado=${2:-1}

[ "$estado" = "0" ] && {
  {
    echo "### Guardia de publicación aprobada"
    echo ""
    grep -E "^  TOTAL" "$archivo" | tail -1
  } >> "$GITHUB_STEP_SUMMARY"
  exit 0
}

detalle=$(grep -E "^[[:space:]]*FALLA|^[[:space:]]*TOTAL|Baterías con problemas|^[[:space:]]*·" "$archivo" || true)
[ -n "$detalle" ] || detalle=$(tail -30 "$archivo")

{
  echo "### ⛔ No se publicó la tienda"
  echo ""
  echo "La generación terminó, pero la guardia encontró una incoherencia."
  echo "**No se creó commit ni se cambió el sitio que está al aire.**"
  echo ""
  echo "#### Qué falló"
  echo '```text'
  echo "$detalle"
  echo '```'
  echo ""
  echo "La parte situada después de \`->\` muestra los valores recibidos."
  echo "Corrige esa fila en **Configuración** o el archivo indicado y vuelve a"
  echo "ejecutar **fotos/Publicar ahora**. El log completo sigue en este mismo job."
} >> "$GITHUB_STEP_SUMMARY"

# Una sola línea para que GitHub la muestre arriba, sin obligar a desplegar el
# paso. Los saltos se vuelven separadores y se escapan los comandos de Actions.
anotacion=$(echo "$detalle" | tr '\n' ' ' | sed 's/[[:space:]][[:space:]]*/ /g;s/%/%25/g;s/\r/%0D/g')
echo "::error title=Publicación detenida por la guardia::$anotacion"
