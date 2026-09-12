# Subir las fotos de los productos

Esto se hace cada vez que agregas un producto o cambias sus fotos.
No hay que tocar código ni volver a publicar nada.

Este archivo es para ti. NO se sube a Netlify.


## Antes de subir: los nombres

El nombre del archivo se convierte en parte de la URL y se queda ahí
para siempre. Si después lo renombras en Cloudinary, la URL cambia y la
foto desaparece de la tienda. Así que nómbralas bien de una vez.

La regla:

    <id-del-producto>-<numero>.jpg

Y el id tiene que ser el MISMO de la columna ID de la hoja Catálogo:

    chonto-1.jpg   chonto-2.jpg   chonto-3.jpg   chonto-4.jpg
    salsa-1.jpg    salsa-2.jpg
    mermelada-1.jpg

Sin espacios, sin tildes, sin ñ, sin mayúsculas. Solo letras sin acento,
números y guiones. "Tomate Chonto 1.JPG" te va a dar problemas;
"chonto-1.jpg" no.

No las recortes ni las comprimas antes. Sube la foto buena, tal como
salió de la cámara o del celular. La tienda pide a Cloudinary una versión
cuadrada, comprimida y del tamaño exacto de cada lugar donde la muestra.
Recortarla tú de antemano solo pierde calidad.


## Paso a paso

### 1. Crear la cuenta
Entra a https://cloudinary.com y regístrate con el plan gratuito.
Anota tu "cloud name": es el nombre que va a aparecer en todas tus URL.

### 2. Subir
En el menú de la izquierda, **Media Library** (o "Assets").
Botón **Upload**, y arrastra todas las fotos de una vez.

Si quieres orden, crea antes una carpeta llamada `productos` y sube ahí.
Eso cambia la URL pero no rompe nada; solo copia la URL que te dé.

### 3. Copiar la URL de cada foto
Pasa el mouse sobre la foto y busca el ícono de enlace, o entra a la
foto y usa **Copy URL**. Te va a dar algo así:

    https://res.cloudinary.com/tu-cuenta/image/upload/v1712345678/chonto-1.jpg

Comprueba que tenga `/image/upload/` en la mitad. Si no lo tiene, es otro
tipo de enlace y la tienda no lo va a reconocer.

### 4. Armar la celda
En la hoja Catálogo, columna **Imágenes**, pega todas las URL del
producto separadas por una barra vertical `|`:

    https://res.cloudinary.com/tu-cuenta/image/upload/v1/chonto-1.jpg|https://res.cloudinary.com/tu-cuenta/image/upload/v1/chonto-2.jpg|https://res.cloudinary.com/tu-cuenta/image/upload/v1/chonto-3.jpg

Todo en UNA sola celda. Máximo 6 fotos; de la séptima en adelante se
ignoran.

**El orden importa.** La primera es la que sale en la rejilla del
catálogo y es la que decide la venta. Las demás solo resuelven dudas.

### 5. Comprobar
Espera un minuto (el catálogo se guarda en caché 60 segundos) y recarga
la tienda. El dibujo rojo y verde del producto debe haber desaparecido y
en su lugar deben estar tus fotos.


## Lo que hace la tienda con tus fotos

Tú pegas la URL cruda. La tienda le agrega esto según dónde la muestre:

    f_auto      WebP o AVIF al navegador que lo soporte, JPG al que no
    q_auto      compresión ajustada foto por foto
    c_fill      recorta en vez de deformar
    ar_1:1      cuadrada, para que la rejilla no se descuadre
    w_600       en la rejilla
    w_900       en la ficha del producto
    w_160       en las miniaturas y en el carrito

Entre f_auto y q_auto una foto suele bajar entre 40% y 70% de peso. Eso
es lo que decide si tu tienda carga o no con datos móviles.


## Si un recorte queda mal

`c_fill,ar_1:1` recorta desde el centro. Si tu producto queda descabezado
en alguna foto, puedes poner tus propias transformaciones: la tienda
respeta las URL que ya las traen y no las toca.

Pega la URL así, agregando `g_auto` justo después de `/upload/`:

    https://res.cloudinary.com/tu-cuenta/image/upload/c_fill,g_auto,ar_1:1,w_800,f_auto,q_auto/v1/chonto-1.jpg

`g_auto` deja que Cloudinary decida qué parte de la foto es la
importante, en vez de recortar desde el centro.

El costo de hacerlo a mano: esa foto va a usar el mismo ancho (w_800) en
la rejilla, en la ficha y en la miniatura, en vez de pedir el tamaño
justo de cada una. Para una o dos fotos puntuales no importa; no lo hagas
con todo el catálogo.


## Lo que NO debes hacer

**No renombres ni borres una foto en Cloudinary** después de pegar su URL
en la hoja. La URL deja de funcionar y en la tienda queda un espacio en
blanco. Si necesitas cambiar una foto, sube la nueva con otro nombre y
reemplaza la URL en la celda.

**No uses otro alojamiento.** La tienda solo tiene permiso para cargar
imágenes desde `res.cloudinary.com`. Una foto de Google Drive, Dropbox o
cualquier otro sitio se bloquea sin dar error: simplemente no aparece.
Si algún día quieres cambiar de alojamiento hay que agregar ese dominio
a `img-src` en DOS archivos: el `<meta>` de `index.html` y `_headers`.


## Lo que ninguna transformación arregla

- La PRIMERA foto es la que vende. Las demás resuelven dudas: textura,
  empaque, escala, reverso.
- Mismo encuadre y misma distancia en la primera foto de TODOS los
  productos. Una rejilla con encuadres distintos se ve amateur, y eso
  baja la conversión más que una foto un poco peor pero consistente.
- Fondo neutro y luz pareja. Cerca de una ventana, sin flash.
- De 3 a 5 fotos por producto. Más que eso nadie las mira.


## Sobre el consumo

Cloudinary cobra por créditos. Un crédito es 1 GB de tráfico, o 1 GB de
almacenamiento, o 1.000 transformaciones. El plan gratuito ronda los 25
créditos al mes (confírmalo al registrarte, que las condiciones cambian).

Para dimensionarlo: una foto de producto ya optimizada pesa unos 50 KB,
así que 25 GB de tráfico son cientos de miles de vistas. Una tienda que
está arrancando no se acerca ni de lejos.
