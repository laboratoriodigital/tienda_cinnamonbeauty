# Traspaso — dónde estamos, 16 de septiembre de 2026

_Léeme primero si abres una ventana nueva. Después: `BITACORA.md`, `ROADMAP.md`
y `docs/DESPLIEGUE.md`._

---

## 3.0.0 — LA PRIMERA VERSIÓN PUBLICABLE

**Qué significa, dicho con precisión:** la plantilla se puede clonar y la tienda
que sale de ahí funciona **sin que nadie la toque a mano**. Eso hasta hoy no era
cierto.

**Qué NO significa:** que se pueda cobrar. De los cinco puntos que bloquean el
lanzamiento quedan **dos**, y ninguno es código:

- **2 · Qué pasa si Apps Script no contesta justo al enviar el pedido.** Hay que
  provocarlo, no suponerlo. Media hora. Lo que NO puede pasar es que el botón no
  haga nada: eso es una venta perdida y un cliente que no vuelve.
- **3 · Que un abogado mire una vez el machote de tratamiento de datos**, y que
  quede por contrato quién es el responsable — el comercio, no nosotros. Antes
  de cobrarle a un tercero.

Y uno que no se cierra nunca del todo: **la respuesta automática de WhatsApp es
por tienda.** Quedó comprobada donde se hizo la prueba de punta a punta, no en
las otras. Si falta, el comprador termina el pedido y no tiene cómo pagar.

**Cómo se comprobó**, en la misma versión y el mismo día:

| | |
|---|---|
| `release` en la semilla | verde |
| `montaje` en Cinnamon Beauty | verde |
| `fotos` («Publicar ahora») en LA MIGUERIA | verde |
| Las tres tiendas | código de plantilla **idéntico archivo por archivo** |
| Baterías | **1371/1371**, 23 archivos |
| **Un pedido de punta a punta, con un teléfono real** | **bien** |

El último es el que cambia la naturaleza de la cosa. Todo lo demás prueba las
piezas; ese probó **la costura**: pedido → WhatsApp → respuesta automática →
transferencia → *Pagado* en la hoja → el stock baja. Es lo único que ninguna
batería puede probar, y hasta hoy nadie lo había visto funcionar junto.

---

## 16 de septiembre — limpieza de documentación

Al día siguiente de la 3.0.0, con el punto 2 de `ANTES-DE-SALIR.md` en prueba,
se revisó **toda** la documentación del repositorio: qué le sirve al dueño, qué
al comerciante, qué es historia de gestión de proyecto ya cerrada. Se encontró
que `docs/` acumulaba cinco guías de despliegue distintas y dos manuales largos
contando versiones distintas de la misma tienda —Cloudinary donde hoy es Drive,
catálogo «en vivo» donde hoy se hornea, «Confirmado» donde hoy es «Pagado»—.
Ninguno daba error al abrirse. Es el patrón 23 de `BITACORA.md`: **un
documento no lanza una excepción cuando miente.**

Se borraron: `RUNBOOK.md`, `DESPLIEGUE-CLIENTE.md`, `MONTAJE.md`,
`INSTALAR.md`, `FOTOS.md` (consolidados en `DESPLIEGUE.md`, que ahora es el
único mapa de despliegue); `PLAN.md`, `ADOPCION.md`, `CONTEXTO.md`,
`SPRINT-0/1/2/3/5/6/7.md` (migración ya cerrada, lo vivo rescatado a
`ROADMAP.md`, `ARQUITECTURA.md`, `CONTRIBUIR.md` y `DECISIONES.md`); y el
manual del dueño y el manual técnico, HTML+PDF (el primero tenía tres
contradicciones con la arquitectura vigente; el segundo, seis secciones de
valor real —idempotencia, seguridad, límites, cómo se prueba, decisiones
deliberadas— que ahora viven en `ARQUITECTURA.md` §8–§12). `docs/` pasó de 27
archivos a 11 más `manuales/` y `capturas/`.

Lo que queda vivo hoy, y solo eso: `DESPLIEGUE.md` (el mapa), `ARQUITECTURA.md`
(el porqué), `CONTRATOS.md` (normativo), `DECISIONES.md` (lo que va a
cambiar), `ROADMAP.md` (qué se construye y en qué orden), `BITACORA.md`
(incidentes), `ANTES-DE-SALIR.md`, `ACTUALIZAR-UNA-TIENDA.md`,
`EVALUACION-stub-automatico.md`, este archivo, y para el comerciante:
`GUIA-COMERCIANTE.md` + su gemela imprimible en `manuales/`.

---

## Qué es Orgánico, en un párrafo

Una tienda en línea para comercios pequeños colombianos, al costo más bajo
posible. **Un `publicar/index.html` estático** en Cloudflare Workers, **una hoja
de Google que es la base de datos, el CMS y el tablero**, un **maestro** de Apps
Script en un proyecto SUELTO, un **stub** pegado en la hoja que solo dibuja el
menú, y **WhatsApp** para cerrar la venta. Costo de operación: **$0/mes**.

**Una cuenta de Google por tienda**, creada por el operador. El comerciante es
*editor de la hoja compartida*, no dueño de la cuenta.

- Semilla: `github.com/laboratoriodigital/organico` · `D:\CoWork\organico`
- Tienda 2: Cinnamon Beauty · `D:\CoWork\tienda_cinnamonbeauty`
- Tienda 3: LA MIGUERIA · `D:\CoWork\panaderia`

---

## Las dos cosas que hay que entender antes de tocar nada

**1. Una tienda NUEVA se clona, no se actualiza.** Se crea un repositorio *a
partir de la plantilla* y nace con todo dentro, `publicar/index.html` incluido.
Su primer `montaje` le escribe encima lo suyo. De ahí la regla que manda hoy:
**lo que esté bien en la plantilla llega solo a toda tienda que se cree desde
ella. Y lo que esté mal, también.**

**2. Nada de la tienda se escribe a mano en `publicar/index.html`.** El `<head>`,
las cinco constantes, la paleta y el catálogo de respaldo los escribe el montaje
desde la hoja. Es lo que permite reemplazar el archivo entero, y lo que se rompe
en silencio el día que alguien meta ahí un valor a mano.

Poner al día una tienda **ya creada** cuando cambia la plantilla es otro
problema —el **4.18**— y está **aplazado a propósito hasta la quinta tienda**.
Hoy se hace a mano.

---

## Los flujos, y quién los puede correr

| Flujo | Quién | Qué hace |
|---|---|---|
| `fotos` | **El comerciante**, con «Publicar ahora» en su hoja. Y cada 4 h | Escribe el `<head>`, baja las fotos del Drive, hornea el catálogo, repone el respaldo. **Empuja directo a `main`** |
| `montaje` | El operador, desde Actions. Semanal | Lo mismo, y además puede publicar `maestro.gs`. Abre un PR y **lo fusiona solo** |
| `release` | **Solo en la semilla.** Se niega en una tienda (4.19) | Corta la versión de la plantilla |
| `pruebas` | En cada push y PR | Todas las baterías |

**«Publicar ahora» tiene que llevar todo lo que el comerciante puede cambiar.**
Es su única palanca. Si algo que él edita en la hoja no llega por ahí, el botón
le miente.

---

## Cómo se trabaja en este proyecto

1. Los cambios, en el banco de la nube (`/home/claude/org2`).
2. **Todas las baterías**: `cd pruebas && ./todas.sh`.
3. Se aplican en `D:\CoWork\organico` por el puente de dispositivo.
4. Se sincroniza el código a las tiendas —`publicar/` NUNCA.
5. **El push lo hace el operador.** Ni el banco ni el puente tienen red a GitHub.

**Tres trampas del puente, las tres se repiten en cada sesión:**

- Después de un commit en la máquina del operador quedan `.git/*.lock` que el
  puente no puede borrar. Hay que pedir `device_request_delete_permission`.
- **`.github/` está protegido** para escritura remota: los flujos se editan con
  un script por `device_bash`, no con `device_commit_files`.
- El banco de la nube no trae el navegador que pide Playwright. Hay uno en
  `/opt/pw-browsers` y se enlaza con `PLAYWRIGHT_BROWSERS_PATH`.

---

## Lo que sigue

1. **Los puntos 2 y 3 de `ANTES-DE-SALIR.md`.** Son lo que separa «se puede
   montar» de «se le puede cobrar a alguien»: provocar la caída de Apps Script
   al enviar un pedido, y que un abogado mire el machote. Ninguno es código.
   Y comprobar la respuesta automática de WhatsApp **en cada tienda**.
2. **El 404 de las fotos en LA MIGUERIA.** Sin causa confirmada: solo se mejoró
   el diagnóstico. La próxima vez dirá a qué acción y a qué id le contestó 404.
3. **4.16** — marcar en la hoja los campos obligatorios.
4. **4.21** — `wrangler.jsonc` dice `organico` en todas las tiendas.
5. **4.22** — `fotos` y `montaje` ya hacen lo mismo; conviene fundirlos.
6. Pendientes de la familia del 4.20: el emoji 🍅 del mensaje de WhatsApp, y
   `fotos_origen` apuntando a producción (una vista previa de rama carga las
   fotos del sitio de verdad).
7. **Con la quinta tienda: 4.18 y 4.24.** Son el mismo trabajo visto desde dos
   lados — que montar y mantener una tienda deje de pedir manos.
8. ~~Deuda consciente: consolidar los cuatro documentos de despliegue
   atrasados.~~ **Hecha el 16 de septiembre** — ver arriba.

---

## Reglas que no se vuelven a discutir

- **Orgánico es un comercio, no el producto.**
- **La configuración vive en la hoja**, no en formularios de Actions.
- **Nunca una implementación nueva de Apps Script.** Siempre: Gestionar
  implementaciones → ✏ → Versión: Nueva.
- **La llave de pago no va en la página ni en el repositorio.** Tres filtros
  para la misma regla, a propósito.
- **`ALTA_TOKEN` solo en el repositorio de servicio.** No hay llavero común.
- **Campo nuevo, al final y opcional** (R1).
- **`git pull --rebase` antes de empezar.** El repositorio se escribe solo.
- **`publicar/` de una tienda no se sincroniza desde la semilla.**
- **Nada de la tienda se escribe a mano en `publicar/index.html`.**
- **Una tienda nueva se clona; una tienda vieja se actualiza a mano, por ahora.**
- El menú de la hoja **ya no tiene** «Generar configuración» ni «Generar
  inventario»: se derogaron en el Sprint 5.
- **Cada procedimiento, un solo documento.** Si aparece una segunda guía
  contando lo mismo, no se le pone un aviso de "atrasada": se rescata lo vivo
  y se borra.

---

## Los patrones de la bitácora — lo que de verdad se aprendió

Son veintitrés. Estos son los que más veces han vuelto:

1. **El fallo que funciona es el caro.**
2. **Dos implementaciones del mismo criterio: una se queda atrás.** La misma
   forma de fallo, en código y en documentación: RUNBOOK.md, DESPLIEGUE-
   CLIENTE.md, MONTAJE.md, INSTALAR.md y el manual del dueño se quedaron atrás
   por turnos, y ninguno lo mostró con un error.
5. **Una comprobación mal elegida es peor que ninguna.**
9. **Si actualizar algo son dos cosas, la segunda se olvida.**
11. **Dos números que coinciden esconden dos pruebas que no prueban nada.**
16. **Antes de automatizar algo, preguntar cuántas veces va a pasar este mes.**
    Si la respuesta es cero, no es una mejora: es superficie de fallo.
17. **Lo que el producto le ofrece cambiar a alguien tiene que llegar por el
    camino que esa persona puede recorrer.**
19. **Una guarda que nunca ha visto el caso que dice cubrir no está comprobada,
    está redactada.**
20. **No todo lo que falla en un paso vale lo mismo.**
21. **Si el programa tiene delante la prueba de que su consejo es falso, no
    tiene excusa para darlo.**
23. **Un documento no lanza una excepción cuando miente.** Un documento
    redundante no se marca como atrasado: se borra. Un aviso encima es una
    curita sobre una fuente que sigue mintiendo debajo.
