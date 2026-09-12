# Sprint 7 — Que una tienda se pueda dar por terminada

**Meta del plan:** que el panel deje de ser un llavero.
**Meta que se atendió primero:** que se pueda decir, sin acordarse de nada, si
una tienda está lista — porque **esa es la condición para montar la siguiente.**

## Tablero

| | | |
|---|---|---|
| S7-0 | El pull request del bot dice qué trae | ✅ |
| S7-1 | «¿Está terminada esta tienda?», comprobado y no recordado | ✅ |
| S7-2 | El montaje se niega a publicar una tienda que no puede vender | ✅ |
| S7-3 | El panel lo muestra para todas a la vez | ✅ |
| S7-4 | Cada tienda empuja un agregado diario; regla de vejez de 36 h | ⬜ con una tienda no paga |
| S7-5 | El panel deja de guardar llaves de Google | ⬜ va con S7-4 |

---

## S7-0 · Un título que no cambia nunca se deja de leer

El pull request del bot decía siempre lo mismo, corrida tras corrida:

> `refactor/frontend: la tienda se pone al día con su hoja y su Drive`

Y entonces da igual lo que haya dentro: **se fusiona por costumbre.** Es el
mismo daño que hacía el fin de línea suelto —400 líneas de diferencia falsa— por
el otro extremo.

El flujo ya sabía qué cambió: lo calcula para el resumen del paso. Lo que
faltaba era que lo dijera donde se decide fusionar.

```
montaje: 4 archivo(s) de foto · el catálogo
```

Y el cuerpo lleva el `--stat` entero, para no tener que abrir la pestaña de
archivos. Se calcula **en el paso que ya miró el diff**, no en uno aparte:
calcularlo dos veces es como empiezan a decir cosas distintas.

---

## S7-1 · «¿Está funcionando?» y «¿está terminada?» son dos preguntas

El diagnóstico contestaba la primera. La segunda **no la contestaba nadie**.

Al escribir el `index.html` se comprobaban cinco claves —las cinco constantes— y
**las otras once no las miraba nadie**. Una tienda podía salir al aire:

- sin **llave de pago**, y entonces el comprador termina el pedido y **no tiene
  cómo pagar** — que es exactamente el agujero que abre a propósito sacar la
  llave de la página;
- sin **datos legales**, con el texto de tratamiento de datos sin responsable;
- sin **correo de resumen**, sin **repositorio** —y entonces «Publicar ahora» no
  dispara nada—, sin **carpeta de respaldo**.

El que montaba se acordaba, o no. **Con una tienda eso se lleva en la cabeza;
con ocho, no** — y poder mirarlo en vez de recordarlo es justamente la condición
para añadir la siguiente.

### Dos niveles, y la diferencia tiene consecuencias

| | Qué es | Qué pasa |
|---|---|---|
| **Bloquea** | `negocio`, `whatsapp`, `sitio_url`, `pago_llave` | El montaje **se niega** a escribir el index |
| **Avisa** | las otras doce | Sale en el registro y en el panel; **no** bloquea |

Lo que bloquea es lo que **rompe la venta**: sin celular el pedido no llega a
ninguna parte. Lo que avisa deja la tienda vendiendo pero a medias. **Publicar
sin descripción es feo, no roto**, y confundir las dos cosas es como un flujo
empieza a fallar por lo que no importa.

Un valor entre corchetes cuenta como vacío: es lo que deja `instalar()` para que
se vea que falta.

### Y cada falta dice por qué

`pago_llave` no dice nada. Esto sí:

```
Sin esto la tienda NO PUEDE VENDER:
   pago_llave — el comprador termina el pedido y no tiene cómo pagar
```

Al escribirlas, dos decían «lo mismo» —referidas a la anterior—. Sirve leyendo
la lista entera y no sirve cuando aparece una sola línea, que es como aparecen.
Reescritas para valerse solas.

### El diagnóstico lo pregunta arriba del todo

Es el **punto 2**, justo después de la versión: si la tienda no está terminada,
todo lo demás es ruido — da igual que las nueve pestañas estén bien si el
comprador no tiene cómo pagar.

Eran nueve puntos y ahora son diez. La batería que los contaba **tenía el número
escrito a mano**, así que añadir un punto —que es hacer bien las cosas— la ponía
en rojo. Ahora cuenta los que el informe imprime y exige que el resumen los
liste todos: el rojo por la razón equivocada es el que enseña a ignorar los
rojos.

---

## S7-3 · La columna «Sin terminar»

Va junto al comercio, no al final: si una tienda no puede vender, el resto de su
fila da igual.

| Dice | Quiere decir |
|---|---|
| *(en blanco)* | Terminada. Lo que está bien no tiene por qué verse |
| **NO PUEDE VENDER: pago_llave** | Falta algo que rompe la venta |
| *faltan 3: sitio_titulo, empresa_nit…* | Vende, pero queda a medias |

Las dos situaciones se pintan **distinto** a propósito: una columna que las
mostrara igual obligaría a abrir las dos para saber cuál urge.

**Viajan las claves, no los valores.** Mandar los valores sería mandar la llave
de pago de cada comercio a una hoja donde no pinta nada — y hay una aserción que
comprueba que lo que cruza son claves conocidas y nada más.

> Eso hizo saltar el guardián de privacidad del panel, que busca las palabras
> «nombre», «celular» y «dirección» en todo el JSON: `empresa_direccion` es un
> nombre de campo del **comercio**, no la dirección de ningún comprador.
> Ensanchar el guardián para que cupiera lo mío era la salida fácil y la mala;
> se excluyó ese campo del barrido y se comprueba aparte con una regla más
> estrecha.

---

## S7-4 y S7-5 · Por qué no se hicieron

El empuje diario existe para que el panel **deje de guardar las llaves de todas
las tiendas**: hoy consulta, así que necesita el token de cada una. Invertir
quién le escribe a quién quita ese llavero.

Con **una** tienda no paga, y peor: **la regla de vejez de 36 horas no se puede
observar.** Se necesita ver varias tiendas empujando, y unas cuantas dejando de
hacerlo, para saber si 36 horas es el número. Ponerlo ahora sería escribir un
umbral que nadie ha medido — justo lo que `DECISIONES.md` pide no hacer.

**Entra con la tercera tienda**, junto al Sprint 4.
