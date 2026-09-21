#!/bin/bash
# Corre todas las baterías contra los archivos REALES del repositorio.
#
# as.js, pn.js e index.html son copias que se regeneran aquí en cada corrida:
# así es imposible probar una versión distinta de la que se despliega.
#
# CUANDO ALGO FALLA, ESTO TIENE QUE DECIR QUÉ. Durante un tiempo solo imprimía
# el marcador —"822/823"— y para saber qué aserción se había caído había que
# tener el repositorio en la máquina y correr la batería a mano. Desde un flujo
# de Actions eso no se puede: el log es lo único que hay. Ahora una batería que
# no salga perfecta imprime debajo sus líneas FALLA, y una que ni siquiera
# arranque imprime su error.
#
# ── POR QUÉ CORREN A LA VEZ ─────────────────────────────────────────────────
# Publicar una foto tardaba entre seis y ocho minutos y la queja era legítima.
# Medido: la suite entera es 292 s, de los cuales 290 —el 99 %— son las 12 que
# abren navegador. Las otras diez, las que uno quitaría primero por «no tan
# fundamentales», cuestan TRES SEGUNDOS Y MEDIO entre todas. Quitar baterías no
# recupera nada y deja sin guardia justo lo que permite que el flujo `fotos`
# fusione sin una persona en medio.
#
# Lo que sí se recupera es el reloj de pared: doce navegadores esperando uno
# detrás de otro no se esperan por ninguna razón de fondo. Se esperaban por una
# razón de implementación: TODAS hablaban con el mismo servidor en el 8099 y se
# pisaban el `/__reset` la una a la otra.
#
# Ahora cada batería levanta SU servidor en SU puerto, con su propio emulador de
# la hoja. El aislamiento es real —no es un candado, es que no comparten nada—,
# no se tocó una sola aserción, y el marcador tiene que salir idéntico.
#
# TRABAJADORES=1 lo vuelve serial. Es el interruptor para depurar: si una
# batería solo falla en paralelo, el fallo es de la batería —guarda estado
# fuera de su proceso— y hay que arreglarlo ahí, no bajar los trabajadores.
cd "$(dirname "$0")"

cp ../maestro.gs            as.js
cp ../panel.gs              pn.js
cp ../publicar/index.html   index.html

# ── EL ARNÉS ES UNA SOLA TIENDA ─────────────────────────────────────────────
# Desde el 4.20 `publicar/index.html` lleva dentro el catálogo y la
# configuración de SU comercio: es lo que la página pinta antes de que conteste
# nadie. Y las baterías conducen la hoja EMULADA de gas.js, que es otra tienda.
# Dejar las dos puestas es probar un comercio que no existe, y los síntomas no
# se parecen a la causa: `val.js` reventaba con «Cannot read properties of
# undefined» al agregar un producto que no está en el archivo de esa tienda,
# `config.js` leía el nombre del comercio equivocado sin red, y `fotos.js`
# exigía que las fotos salgan del propio sitio mientras la semilla decía que
# salen de la dirección de producción de otro.
#
# No se BORRA el respaldo —eso dejaría sin probar justo el camino que el 4.20
# existe para arreglar—: se reemplaza por el de la hoja emulada, con la misma
# herramienta que usa el flujo. El arnés queda siendo una tienda coherente y da
# igual de qué comercio sea el repositorio.
#
# Quien prueba que ese camino funciona para un comercio CUALQUIERA es
# respaldo.js, que se escribe su propio archivo con una tienda inventada.
node arnes.mjs || { echo "ERROR: no se pudo armar el arnés"; exit 1; }

# local.html es el MISMO index, con el servicio vacío: así sec2.js comprueba
# que una tienda sin Apps Script configurado no manda nada a ninguna parte.
# Se regenera aquí porque durante días fue una copia congelada del index y dos
# baterías estuvieron dando verde sobre una tienda que ya no existía.
sed 's|const SCRIPT_URL = "[^"]*";|const SCRIPT_URL = "";|' index.html > local.html

pkill -f servidor.js 2>/dev/null; sleep 0.5

# De más lenta a más rápida. No es cosmético: con trabajadores fijos, empezar
# por la más larga es lo que evita terminar esperando a una sola. e2e.js dura
# 81 s y marca el suelo de toda la corrida.
BATERIAS=${BATERIAS:-"e2e.js movil.js enlace.js val.js fotos.js pag.js test.js config.js \
          cat.js version.js hoja.js sec2.js exif.js montaje.js panel.js \
          pedidos.js correo.js presentacion.js menu.js tablero.js esquema.js \
          calendario.js respaldo.js pagos.js variantes.js seo.js variantes-ui.js pagos-ui.js identidad-cinnamon.js"}

# Por defecto, uno por núcleo hasta cuatro. Más no ayuda: cada trabajador es un
# Chromium, y a partir de ahí compiten por CPU y el reloj deja de bajar.
nucleos=$(nproc 2>/dev/null || echo 2)
TRABAJADORES=${TRABAJADORES:-$(( nucleos > 4 ? 4 : nucleos ))}

SALIDA=$(mktemp -d)
trap 'pkill -f servidor.js 2>/dev/null; rm -rf "$SALIDA"' EXIT

# Levanta un servidor y ESPERA A QUE CONTESTE, que no es lo mismo que esperar
# dos segundos. El `sleep 2` de antes era una apuesta: en una máquina cargada
# se quedaba corto y la batería fallaba con un ECONNREFUSED que no significaba
# nada. Aquí se pregunta hasta que responde, con un tope.
arrancar() {   # arrancar <puerto> <viejo|nuevo>  → deja el PID en $PID_SERVIDOR
  local puerto=$1 modo=$2 i=0
  if [ "$modo" = viejo ]; then
    VERSION_VIEJA=1 PUERTO=$puerto node servidor.js > /dev/null 2>&1 < /dev/null &
  else
    PUERTO=$puerto node servidor.js > /dev/null 2>&1 < /dev/null &
  fi
  PID_SERVIDOR=$!
  while [ $i -lt 300 ]; do
    curl -sf "http://localhost:$puerto/__reset" > /dev/null 2>&1 && return 0
    kill -0 "$PID_SERVIDOR" 2>/dev/null || return 1   # se murió al arrancar
    sleep 0.1; i=$((i + 1))
  done
  return 1
}

# QUÉ SERVIDORES NECESITA CADA BATERÍA, PREGUNTÁNDOSELO A ELLA. Una lista aquí
# sería la segunda copia del mismo dato, y ya sabemos cómo acaba eso (patrón 2):
# se agrega una batería, nadie toca la lista, y arranca sin servidor.
ejecutar() {   # ejecutar <archivo> <indice>
  local f=$1 i=$2
  local puerto=$((8100 + i * 2)) viejo=$((8101 + i * 2))
  local estado pids=""

  if grep -q 'process.env.PUERTO ||' "$f"; then
    arrancar "$puerto" nuevo || { echo "ERROR: no arrancó el servidor del puerto $puerto" > "$SALIDA/$f"; return; }
    pids="$pids $PID_SERVIDOR"
    [ "$f" = "pag.js" ] && curl -s "http://localhost:$puerto/__muchos" > /dev/null
  fi
  if grep -q 'process.env.PUERTO_VIEJO ||' "$f"; then
    arrancar "$viejo" viejo || { echo "ERROR: no arrancó el servidor del puerto $viejo" > "$SALIDA/$f"; return; }
    pids="$pids $PID_SERVIDOR"
  fi

  PUERTO=$puerto PUERTO_VIEJO=$viejo timeout 240 node "$f" > "$SALIDA/$f" 2>&1
  estado=$?
  [ $estado -ne 0 ] && echo "(salió con código $estado)" >> "$SALIDA/$f"

  # Se apagan aquí y no al final: doce emuladores vivos a la vez son memoria
  # que no hace falta, y en un runner de Actions la memoria sí se acaba.
  for pid in $pids; do kill "$pid" 2>/dev/null; done
}

indice=0
for f in $BATERIAS; do
  indice=$((indice + 1))
  while [ "$(jobs -rp | wc -l)" -ge "$TRABAJADORES" ]; do wait -n; done
  ejecutar "$f" "$indice" &
done
wait

# ── El marcador, en el orden de siempre para que el log sea comparable ──
total=0; buenas=0; rotas=""
for f in $BATERIAS; do
  salida=$(cat "$SALIDA/$f" 2>/dev/null)
  linea=$(echo "$salida" | grep -E "^Resultado" | tail -1)
  printf "  %-16s %s\n" "$f" "${linea:-ERROR}"
  n=$(echo "$linea" | sed -n 's/.*: \([0-9]*\)\/\([0-9]*\).*/\1/p')
  d=$(echo "$linea" | sed -n 's/.*: \([0-9]*\)\/\([0-9]*\).*/\2/p')
  buenas=$((buenas + ${n:-0})); total=$((total + ${d:-0}))

  # UN SALTO QUE NO SE VE ES UN SALTO ESCONDIDO. Una batería puede saltarse un
  # escenario que hoy no puede existir —un index.html anterior al 4.20, por
  # ejemplo— y eso está bien SI SE DICE. Como el marcador sale verde, la línea
  # se imprime aquí a mano: si no, el salto solo existiría dentro del archivo de
  # salida que nadie abre.
  echo "$salida" | grep -E "^  SALTA" | sed 's/^/    /'

  # Lo que faltaba: decir QUÉ se cayó, aquí y ahora.
  if [ -z "$linea" ]; then
    rotas="$rotas$f"$'\n'
    echo "$salida" | tail -25 | sed 's/^/      /'
  elif [ "${n:-0}" != "${d:-0}" ]; then
    rotas="$rotas$f"$'\n'
    echo "$salida" | grep -E "^ FALLA" | sed 's/^/    /'
  fi
done

pkill -f servidor.js 2>/dev/null
echo
echo "  TOTAL: $buenas/$total"
if [ -n "$rotas" ]; then
  echo
  echo "  Baterías con problemas:"
  echo "$rotas" | sed '/^$/d;s/^/    · /'
fi
[ "$buenas" = "$total" ] && [ -z "$rotas" ] || exit 1
