# Sprint 3 — Fotos

**Meta: O3, y cerrar el riesgo de metadatos.**

Empezado el 9 de septiembre de 2026, con el Sprint 2 **medido en producción**.
Esta vez sí se arranca sobre algo verificado, no sobre algo escrito.

---

## Tablero

| # | Historia | Estado |
|---|---|---|
| S3-1 | Reutilizar el flujo actual de fotos, no reescribirlo | ✅ intacto: solo se le añadió un parámetro |
| S3-2 | **Aserción de que las derivadas salen sin EXIF** | ✅ `pruebas/exif.js` |
| S3-3 | El catálogo deja de envejecer solo | ✅ el flujo de fotos también lo refresca |
| S3-4 | `fotos.json` con rutas relativas | ⛔ **No se hace** — ver abajo |
| S3-5 | Frecuencia a 15 minutos | ⛔ **No se hace** — ver abajo |
| S3-6 | La página deja de adivinar qué medidas existen | ✅ manifiesto en `catalogo.json` |

---

## S3-2 · La foto que dice dónde vive el comerciante

Este es el que importa y no se veía.

El comerciante sube al Drive la foto que le sacó con el celular. Esa foto trae
EXIF, y el EXIF de un celular trae **coordenadas GPS**: la finca, la casa, el
taller. Publicarla tal cual es publicar la dirección de alguien que no sabe que
la está publicando. Y nadie se entera nunca: no rompe nada, no da error,
simplemente está ahí para quien la descargue.

**Ya funcionaba.** `sharp` descarta los metadatos por defecto. Lo que faltaba
era la prueba, y la diferencia no es cosmética:

> Una propiedad de seguridad que depende del **valor por defecto de una
> librería** es una propiedad prestada. El día que alguien agregue un
> `.withMetadata()` para conservar la orientación —que es una razón
> perfectamente razonable— se lleva el GPS de paso, y sin esta batería nadie lo
> vería.

`pruebas/exif.js` construye una foto con marca, modelo y coordenadas, la pasa
por **la función que publica de verdad** —`convertir()`, importada de
`montar/traer-fotos.mjs`, sin una sola línea copiada— y comprueba en cada una de
las cuatro salidas:

- que no haya bloque EXIF
- que los bytes crudos no contengan `GPSLatitude` ni `GPSLongitude`
- que no aparezca el modelo del celular
- que no venga un perfil de color pegado de más

Y antes de todo eso, comprueba que **la foto de entrada sí traía EXIF**: sin ese
primer paso, la batería pasaría entera midiendo nada. Es la lección de las
comprobaciones que dan lo mismo antes y después.

**Se probó al revés.** Con un `.withMetadata()` metido a mano en la conversión,
la batería cae de 20/20 a 8/20. Una aserción que nunca se vio fallar no se sabe
si sirve.

> `sharp` pasa a estar también en `pruebas/package.json`. Una prueba de
> seguridad que se salta sola porque le falta una dependencia es peor que no
> tenerla: da la tranquilidad sin dar la garantía.

---

## S3-3 · Una deuda del Sprint 2 que no podía esperar al 4

Al hornear el catálogo dentro del sitio, un cambio de precio **dejó de estar en
la calle en diez segundos** y pasó a esperar un despliegue. Ese costo se aceptó
a cambio de que la vitrina no compita con el checkout.

Pero aceptarlo no era dejar al comerciante vendiendo al precio de la semana
pasada hasta que alguien se acordara de disparar `montaje` a mano. Yo había
mandado las tres vías de publicación al Sprint 4 en bloque, y **una de las tres
no aguantaba tanto**.

El flujo que ya miraba el Drive cada cuatro horas mira ahora también la hoja:

- decide **mirando** —`--revisar` en las dos herramientas—, así que si no cambió
  nada no abre ni un commit;
- fusiona solo si lo único que cambió son las fotos y `publicar/catalogo.json`,
  con la misma guarda de antes, ampliada con cuidado: el `$` y el punto
  escapado están para que no cuele cualquier `publicar/catalogo*`;
- las baterías siguen corriendo **antes** de fusionar, porque lo que empuja el
  `GITHUB_TOKEN` no dispara `pruebas`.

**Cuatro horas es el techo. El «Publicar ahora» del menú será el suelo**, y ese
sí es del Sprint 4.

> El nombre del flujo se queda en `fotos` aunque ya no diga la verdad entera.
> Renombrarlo arrastra doce menciones en la documentación, y el Sprint 4
> probablemente lo reemplaza entero cuando el maestro pueda disparar su propio
> despliegue. Queda anotado para no fingir que no se vio.

---

## Lo que el plan pedía y no se hace

**`fotos.json` con rutas relativas — se deroga.** Tenía sentido cuando la página
no traía ningún archivo del sitio: un manifiesto de fotos habría sido el primero.
Después del Sprint 2 ya hay uno, `catalogo.json`, y **los nombres de las fotos
van dentro**. Un segundo archivo con la misma información es exactamente el
patrón 2 de la bitácora: dos copias del mismo dato, y una se queda atrás.

Lo que sí queda de esa historia es **S3-6**: hoy la página adivina qué medidas
existen —`-160`, `-600`, `-900`— y cuando no existe, se ven los 404 que
aparecieron en las capturas del despliegue. Eso se cierra listando en
`catalogo.json` las medidas que de verdad se generaron, lo que exige hornear el
catálogo **después** de las fotos. Es un cambio de orden en el montaje, no un
archivo nuevo.

**Frecuencia a 15 minutos — no.** Se escribió cuando lo único que este flujo
publicaba eran fotos, y una foto nueva es urgente para el comercio. Con el
catálogo dentro, cada corrida compara precios además de fotos: 96 corridas
diarias para una tienda que cambia el catálogo unas veces por semana. Las cuatro
horas se quedan, y la urgencia de verdad la resuelve el botón del menú, no una
frecuencia más alta.

> Bajar el intervalo es la respuesta fácil a «esto tarda en salir». La correcta
> es dejar que quien hizo el cambio pueda publicarlo cuando lo hizo.

---

## S3-6 · Los 404 que no eran un fallo

En las capturas del despliegue aparecían así, varias veces por carga:

```
pan-1-600.webp   404   text/html
pan-1.jpg        404   text/html
```

**No era un fallo: era el respaldo funcionando.** La página pedía la derivada
WebP; si no existía, el manejador de errores volvía al original. Está bien
hecho y por eso nadie lo tocó.

Pero un respaldo que se activa en el **caso normal** deja de ser un respaldo y
pasa a ser el camino: dos peticiones fallidas por tarjeta, y la consola del
comerciante llena de rojos que no significan nada. El día que aparezca un rojo
que sí significa algo, va a estar enterrado entre esos.

**Ahora el montaje mira la carpeta y lo escribe.** `catalogo.json` gana:

```json
"fotos": { "chonto-1.jpg": [160, 600, 900] }
```

y `conTamano()` consulta ese mapa en vez de suponer. Si una foto no está, se
pide el original directamente. Si la medida pedida no existe pero hay otras, se
toma la más cercana por encima. **Y si no hay manifiesto —una tienda que aún no
ha corrido un montaje— se adivina como siempre**, que es lo que hacía.

**Tres cosas que el manifiesto no hace, y son parte del diseño:**

- No lista derivadas de una **URL completa** en la hoja: esa foto la sirve otro,
  y prometer archivos ajenos es peor que no decir nada.
- No lo publica el maestro. Vive en otra máquina y no sabe qué hay en la carpeta
  del sitio; contestarlo sería inventar. Hay una aserción sobre `?a=catalogo`
  para que no se le ocurra a nadie.
- No se hornea antes de bajar las fotos. **El orden del montaje cambió**: ahora
  el catálogo va después. Un manifiesto que se adelanta a lo que describe es
  peor que no tenerlo — la página deja de adivinar para creerle a algo
  equivocado.

> Y las dos listas de anchos —la que **genera** los archivos y la que los
> **busca**— tienen una aserción que las compara. Son el mismo dato en dos
> archivos: patrón 2 esperando su turno.
