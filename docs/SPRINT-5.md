# Sprint 5 — Menú, diagnóstico y ayuda

**Meta: que el comerciante resuelva solo los tres incidentes más comunes.**

Empezado el 9 de septiembre de 2026, **antes que el Sprint 4 y a propósito**. El
plan ponía primero la épica del repositorio maestro, cuya razón de ser es que un
cambio llegue a todas las tiendas el mismo día. Con **una** tienda montada, eso
todavía no paga — y concentra las credenciales de despliegue de todas. Este
sprint, en cambio, cierra un hueco que abrí yo en el Sprint 2.

---

## Tablero

| # | Historia | Estado |
|---|---|---|
| S5-1 | Menú nuevo: Publicar ahora · Ver mi tienda · … · Ayuda | ✅ |
| S5-2 | Se derogan «Generar configuración» y «Generar inventario» | ✅ fuera del menú, vivas para `?a=bloques` |
| S5-3 | El menú del stub deja de ser una copia a mano | ✅ se genera |
| S5-4 | El diagnóstico dice qué está mostrando la tienda | ✅ y sin mandar a nadie a GitHub |
| S5-7 | Diagnóstico a 9 puntos, con fila y columna exactas | ✅ y el nombre exacto de la foto · **diez desde la 2.9.0** |
| S5-5 | Separar el token del stub del de montaje | ✅ y el diagnóstico deja de enseñarlo |
| S5-6 | Guía de una página | ✅ y una batería que impide que envejezca |

---

## S5-1 · «Publicar ahora» es el suelo que faltaba

El Sprint 2 metió el catálogo dentro del sitio y con eso **tocar un precio dejó
de ponerlo en la calle**. El Sprint 3 puso un techo —el flujo que revisa cada
cuatro horas— pero un techo no es una respuesta cuando el comerciante acaba de
corregir un precio y lo quiere ver.

Sin este botón, la tienda de hoy es **peor** que la de antes del Sprint 2 en lo
único que el comerciante nota. Eso no es una mejora pendiente: es una regresión
a medio pagar.

**Qué hace, exactamente.** No publica nada por su cuenta: dispara el flujo
`fotos` del repositorio de la tienda, que es el único que ya sabe fusionar solo
—hornea el catálogo, baja lo nuevo del Drive, corre **todas** las baterías, y
fusiona solo si lo único que cambió son las fotos y el catálogo—. Si cambió
cualquier otra cosa, deja un pull request para una persona. Todo eso ya estaba
probado; aquí solo se aprieta el botón.

### El permiso, y por qué el más pequeño que existe

Va en **Propiedades del script**, con el nombre `GITHUB_TOKEN`, y tiene que ser
fine-grained, de **ese** repositorio y con **un** permiso: *Actions: Read and
write*. Con eso alcanza para disparar un flujo y para nada más: no escribe
código, no lee otros repositorios, no toca secretos.

> **Las propiedades del script no están cifradas.** Por eso el permiso más
> pequeño posible no es una formalidad: es lo único que hay. El mensaje que ve
> quien monta la tienda dice exactamente esos cuatro pasos, para que no haya que
> adivinar cuál marcar.

Y `repositorio` entra a `Configuración` como una clave más —dueño/repositorio—
porque no es un secreto: los repositorios de las tiendas son públicos.

### Los errores de GitHub, traducidos

Un 403 no le dice nada a quien vende tomates. Cada código se traduce a lo que
hay que hacer —«el permiso existe pero le falta Actions: Read and write»— y el
detalle técnico queda en la pestaña `Errores`.

---

## S5-2 · Lo que se deroga, y lo que no

«Generar configuración» y «Generar inventario» **salen del menú**. Existían
cuando montar la tienda era copiar y pegar bloques de HTML a mano; hoy eso lo
hace un flujo, y ofrecerle al comerciante que genere HTML es ofrecerle un
trabajo que ya no es suyo.

**Las funciones siguen vivas**: `?a=bloques` las usa, que es como el montaje
escribe el `index.html`. Quitarlas del menú no es borrarlas — y la diferencia
está marcada en el código con `fuera: true`, no en la memoria de nadie.

---

## S5-3 · El menú vivía escrito dos veces

El stub llevaba **su propia lista** de opciones, escrita a mano, junto a la que
el maestro usa para validar lo que le piden. Dos copias del mismo dato, y las
dos fallan en silencio: si se separan, la hoja ofrece algo que el maestro
rechaza —«esa opción no existe»— o esconde algo que sí está.

Con seis opciones en vez de cinco, ese día llegaba hoy. Ahora `generarStub()`
**genera** la lista y las funciones `accionN` a partir de `ORDEN_MENU`. Se
comprobó que el stub generado sale **idéntico** al que estaba escrito a mano
antes de cambiar el menú: el refactor no cambió nada, solo quitó la copia.

Y `menuCuadra()` comprueba lo otro que podía separarse: que toda opción del
orden tenga acción, y que toda acción viva esté en el orden.

---

## Lo que este sprint le pide al que despliega

**Hay que volver a pegar el stub.** Es la primera vez desde el Sprint 1, y
tiene una razón visible: el menú cambió. Sin pegarlo, la hoja sigue mostrando
las cinco opciones viejas y dos de ellas ya no existen del otro lado.

| Señal | Dónde |
|---|---|
| El menú tiene **seis** opciones y la primera es «Publicar ahora» | en la hoja |
| `Configuración` termina en `repositorio` | en la hoja |
| «Publicar ahora» sin llenar nada explica qué falta, no falla | menú → Publicar ahora |
| Con `repositorio` y `GITHUB_TOKEN` puestos, dispara el flujo | Actions |

> Que **explique** en vez de fallar es parte de lo que se está probando: un botón
> que el comerciante toca antes de que alguien lo configure no puede contestar
> con un error técnico.

---

## S5-4 · El comerciante no tiene GitHub, y no debería necesitarlo

El primer mensaje de «Publicar ahora» terminaba así:

> *Si algo no cuadra, no se publica nada y te queda avisado en GitHub.*

**Eso no es una respuesta: es contarle dónde está la respuesta, en un sitio
donde no puede entrar.** El repositorio de su tienda lo ve el administrador, no
él. Fue una observación suya y es correcta.

Lo que **sí** puede saber, y es mejor métrica que cualquier registro de
ejecuciones: **de cuándo es el catálogo que su tienda está sirviendo**. Se le
pregunta a la tienda, no a la tubería.

```
Tu tienda está mostrando el catálogo del 9 sep, 8:07 p.m. (hace 5 minutos).
```

Y cuando algo se atascó, la única línea que hace falta:

```
Tu tienda está mostrando el catálogo del 9 sep, 3:00 p.m. (hace 5 horas).
   ATENCIÓN: pediste publicar hace 47 minutos y todavía no ha llegado.
   Vuelve a intentarlo; si sigue igual, avisa a quien te montó la tienda.
```

**Por qué esta métrica y no «la última corrida salió bien».** Una corrida en
verde no garantiza que el comprador esté viendo lo nuevo: pudo fusionarse y no
desplegarse, o desplegarse una versión anterior. Esto mide **el resultado
observable** —lo que un comprador ve ahora mismo— y por eso no puede mentir en
la dirección que importa.

`Publicar ahora` anota **cuándo se pidió**, que es lo único que se sabe en ese
momento; el Diagnóstico compara esa hora con la del catálogo servido. Los 20
minutos de margen están para no asustar mientras va en camino.

> Detalle: la fecha se arma a mano y no con `Utilities.formatDate`, que pide una
> zona horaria. El proyecto no declara ninguna, y los métodos de `Date` corren
> en la zona del script — la hora del reloj del comerciante, que es la única que
> le sirve.

---

## S5-7 · Nueve puntos, y la celda exacta

El diagnóstico decía la verdad y no servía. Era una lista de líneas sueltas:
para saber si había un problema había que leerlas todas y saber ya qué buscar
—y quien lo abre es justamente el que no lo sabe.

Ahora son **nueve puntos numerados, cada uno con un veredicto**, y el resumen va
**arriba**:

```
── RESUMEN ──
  OK        1. Versión de este maestro
  OK        2. Para el panel de tiendas
  OK        3. Pestañas de la hoja
  OK        4. Tareas automáticas
  PROBLEMA  5. Datos que la hoja no pudo leer
  REVISAR   6. Qué sale en el catálogo
  REVISAR   7. Fotos
  OK        8. Qué está mostrando tu tienda
  OK        9. Carga, respaldo y últimos errores
  → 3 punto(s) para revisar. El detalle está abajo.
```

### Lo accionable es la coordenada, no el diagnóstico

«Hay datos que no se pudieron leer» no se puede accionar: la hoja tiene cien
filas. Lo que se acciona es esto:

```
   Catálogo E7 (Precio de chonto) dice "$9.000"
   Cupones D12 (Mínimo de BIENVENIDO) dice "20,000"
```

La columna ya venía; **la fila del cupón no**. Se reportaba «Cupones F», y en la
hoja hay una columna F por cada cupón. Ahora `validarCupon()` guarda el número
de fila junto con la fila.

Y la pregunta que el comerciante hace de verdad —«¿por qué no aparece este
producto?»— tiene su propio punto, con la razón al lado:

```
   Catálogo A9: sin ID
   Catálogo E7: el precio de chonto no es un número
```

### El chequeo que leía por el caché

Un hallazgo del mismo tipo que el patrón 5 de la bitácora. El diagnóstico
llamaba a `catalogoPublico()`, que **cachea un minuto**. Con el caché caliente,
la lista de celdas ilegibles llegaba vacía y el informe **daba todo por bueno
mientras un precio llevaba una hora sin poderse leer**.

`revisarDatos()` lee las tres hojas a mano, sin caché. Y hay una aserción que
calienta el caché a propósito antes de pedir el diagnóstico: sin ella, este
error vuelve el día que alguien reordene dos líneas.

### Las fotos, por nombre exacto

«Subí la foto y no aparece» es de las tres preguntas más frecuentes, y la única
respuesta que había era «revisa el Drive». La tienda publicada dice en
`catalogo.json` **qué fotos tiene de verdad** (`fotos`: nombre → anchos). Se
compara con lo que la hoja pide:

```
La hoja pide 14 foto(s). Estas la tienda NO las tiene:
   chonto-2.jpg  (chonto)
Si acabas de subirlas al Drive, usa «Publicar ahora» y vuelve a mirar.
```

Una URL completa en la celda no se cuenta: esa foto la sirve otro sitio y no hay
nada que verificar. Las publicadas que ya nadie usa se mencionan **sin alarmar**
—no estorban, y asustar por eso sería peor que callarlo.

### Dos salidas, y el token en solo una

`diagnostico()` pasó de `aviso` a `html`: noventa líneas en un `ui.alert` no se
leen ni se copian. Sigue devolviendo `texto` —eso es lo que consume
`?a=diagnostico`, el panel y las baterías— y ahora además un diálogo con los
nueve veredictos arriba y un cuadro que se copia de un clic.

**El token no va dentro del cuadro.** El cuadro está hecho para reenviarse por
WhatsApp a quien montó la tienda, y un token que da de alta pedidos no debería
viajar de rebote. Se lee en pantalla, en el recuadro del panel, que es donde
hace falta una sola vez.

### Y la caché que recordaba los fallos

`catalogoPublicado()` guarda la respuesta de la tienda para no pedirla dos veces
en la misma ejecución. La primera versión guardaba también los fallos, y eso
convertía **un tropiezo de un segundo en el veredicto de toda la ejecución**: la
función seguía diciendo «no se pudo comprobar» aunque la tienda ya contestara.
Lo cazó una aserción de la batería anterior, no una lectura del código.

---

## S5-5 · Dos tokens, porque uno estaba a la vista

El maestro tenía un solo token, y este párrafo escrito encima:

> *No es un secreto fuerte —el cliente puede leerlo en su stub— y no pretende
> serlo: solo le permite hacer en SU hoja lo que el menú ya le deja hacer.*

La primera mitad era cierta. La segunda no se sostenía: ese mismo token abría

| Puerta | Qué hace |
|---|---|
| `?a=sembrar` | reescribe la pestaña Configuración desde fuera |
| `?a=bloques` | entrega el `<head>` y las constantes de la tienda |
| `?a=fotos` · `?a=foto` | lista y descarga el Drive del comercio |
| `?a=panel` | las métricas que ve el operador |
| `?a=identidad` | `scriptId`, `HOJA_ID`, la URL del servicio |

Nada de eso es «lo que el menú ya le deja hacer». Y **un token que se lee en
pantalla se pega en un chat, en una captura, en un correo de soporte.** No hace
falta mala fe: hace falta que esté a la vista.

Y estaba a la vista dos veces: en el stub, y en el propio Diagnóstico, que el
comerciante abre desde su menú.

### Cómo queda

| | Prefijo | Dónde vive | Qué abre |
|---|---|---|---|
| **Montaje** | `tk-` | secreto `MAESTRO_TOKEN`, `tienda.json` | todas las puertas |
| **Menú** | `tkm-` | el stub, dentro de la hoja | `?a=menu`, y nada más |

Los prefijos son distintos para que se distingan de un vistazo **cuando
aparezcan sueltos** —en una captura, en un log— y nadie tenga que adivinar cuál
es cuál.

El Diagnóstico del menú ya no muestra el de montaje. El que monta la tienda
ejecuta **`diagnosticoCompleto()`** desde el editor del maestro, que es un sitio
donde el comerciante no entra. El valor por defecto es el discreto **y no al
revés**: si mañana alguien añade otra forma de llamar al diagnóstico y no se
acuerda de esto, el fallo es que el operador ejecute una función más, no que el
token de montaje aparezca en la pantalla de un cliente.

### La convivencia, y cómo se termina

El stub que ya está pegado en cada hoja lleva el token viejo. Si `?a=menu`
dejara de aceptarlo de golpe, **el menú de todas las tiendas montadas se apagaría
el día del despliegue**. Así que acepta los dos.

Pero «acepta los dos» sin fecha es como una convivencia temporal se vuelve la
arquitectura. Por eso cada vez que llega el viejo **queda constancia**
(`STUB_CON_TOKEN_VIEJO`), y esa constancia hace dos cosas:

- El Diagnóstico dice, en el punto 2, que a esa hoja le falta pegar el stub
  nuevo — y **lo mide**, no lo supone: no puede ver el stub, pero sí con qué
  token entró la última vez. Misma idea que el punto 8.
- **`rotarToken()` se niega a correr** mientras alguna hoja siga entrando con el
  viejo. Rotar antes de pegar el stub deja al comerciante sin menú y sin saber
  por qué, que es justo el incidente que este sprint quería evitar.

### Pegar el stub no cierra el agujero

Hace que la hoja deje de **usar** el token viejo. No lo invalida: quien lo haya
copiado antes lo sigue teniendo. Cerrarlo es cambiarlo, y eso obliga a tocar dos
sitios fuera del maestro —el secreto del repositorio y el `tienda.json`—, así que
no puede pasar solo ni por sorpresa. `rotarToken()` lo cambia y dice exactamente
qué falta cambiar fuera; el token del menú **no** se toca, así que el stub recién
pegado sigue sirviendo.

---

## S5-6 · Una página, y el papel que envejecía solo

La guía existe por una razón que está escrita en el plan y que conviene no
suavizar: **si la capacitación necesita más de 30 minutos, es un hallazgo de
diseño, no un problema del comerciante.** Una guía de una página es una forma de
medir eso. Si deja de caber, el producto se complicó.

`docs/GUIA-COMERCIANTE.md` es el texto; `docs/manuales/Guia-de-una-pagina.html`
es la versión imprimible, A4, con los mismos colores que los manuales.

Abre con lo único que hay que entender, porque todo lo demás se deduce de ahí:

> **Tu tienda no lee la hoja en vivo.** Lleva dentro una copia de tu catálogo, y
> por eso abre rápido. Esa copia se rehace cuando tú publicas.
>
> Cambias algo en la hoja → menú → **Publicar ahora** → unos minutos → la tienda
> lo muestra.

Y avisa de lo que más rompe sin avisar: escribir `$8.900` en vez de `8900` **no
pone el producto barato, lo saca de la tienda**.

### El hallazgo, que es peor que la tarea

Al escribirla se revisó el manual del dueño, que es lo que se le entrega al
comerciante al montar. Llevaba semanas:

- enseñando **«Generar configuración para index.html»** y **«Generar inventario
  para index.html»**, derogadas en este mismo sprint;
- **sin nombrar «Publicar ahora»** ni una sola vez;
- y explicando que *«la página le pregunta a la hoja cada vez que alguien la
  abre»*, que dejó de ser cierto cuando el catálogo se empezó a hornear en el
  sitio.

Es decir: el papel que se le entrega al cliente le enseñaba dos botones que ya no
existen, le escondía el único que importa, y le daba un modelo mental con el que
**nunca publicaría** —y su tienda mostraría precios viejos sin que él supiera por
qué—.

Nadie lo notó porque **un documento no se cae**. Es el patrón 2 de la bitácora
—dos copias del mismo procedimiento, una se queda atrás— con el agravante de que
aquí la copia atrasada es la que ve el cliente.

### Lo que impide que vuelva a pasar

La batería nueva **no lleva escrita la lista de opciones: se la pregunta al
maestro.** Exige que los dos papeles nombren todas las vivas, que si mencionan
una derogada sea para decir que ya no existe, y que expliquen que hay que
publicar. Cambiar el menú y no cambiar los papeles vuelve a ser imposible.

Y está comprobada contra el error real: con el manual anterior puesto, se pone
roja en las cuatro cosas que estaban mal. Una comprobación que no distingue el
antes del después no es una comprobación (patrón 5).
