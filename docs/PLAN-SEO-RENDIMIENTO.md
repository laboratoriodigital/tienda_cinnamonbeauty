# Plan SEO horneado y rendimiento del sitio

## Objetivo

Hacer que cada tienda pueda ser descubierta por producto sin convertir el
frontend en un servidor ni sumar consultas a Apps Script. El robot, Cloudflare
y el comprador deben recibir artefactos estáticos derivados del mismo
`publicar/catalogo.json` que ya pasó la guardia de publicación.

## Principios

1. **Una fuente pública:** SEO se hornea desde `publicar/catalogo.json`; nunca
   vuelve a preguntarle al maestro ni inventa precios, stock o contactos.
2. **Contenido HTML:** Organization, WebSite, Product/ProductGroup y Offer
   existen en el HTML servido. No dependen de que un robot ejecute JavaScript.
3. **Datos reales únicamente:** los valores vacíos o sembrados entre corchetes
   se omiten de JSON-LD y metadescripciones. Un dato falso es peor que no
   publicar el campo.
4. **Determinismo:** el sitemap no lleva `lastmod`; el mismo catálogo produce
   los mismos artefactos.
5. **Indexación deliberada:** portada y fichas se indexan. 404, `admin`,
   `tablero` y `pedido` reciben `noindex`; no se bloquean en robots porque el
   rastreador necesita acceder para leer esa orden.
6. **Presupuesto cero en ejecución:** todo ocurre en GitHub Actions; Cloudflare
   sirve los archivos y Apps Script queda para validar y cobrar.
7. **Compatibilidad de configuración:** `sitio_url` acepta la forma histórica
   `tienda.ejemplo.com` y la normaliza a `https://` antes de construir URLs.

Referencias normativas: [Product](https://developers.google.com/search/docs/appearance/structured-data/product),
[variantes](https://developers.google.com/search/docs/appearance/structured-data/product-variants),
[sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[noindex](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
y [enlaces rastreables](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

## Actividades y estado

- [x] Reparar la fecha del maestro para que use la zona del proyecto y no UTC
  del runner; reproducir `Utilities.formatDate` en el emulador.
- [x] Crear `montar/sembrar-seo.mjs` con modos escribir y `--revisar`.
- [x] Hornear Organization + WebSite en la portada y omitir placeholders.
- [x] Generar una ficha HTML canónica por producto activo.
- [x] Publicar Product + Offer; ProductGroup + variantes, SKU, opciones,
  disponibilidad, precio y COP cuando corresponda.
- [x] Convertir imagen y botón “Ver” en enlaces `href` rastreables, conservando
  la ficha interactiva del SPA al hacer clic.
- [x] Generar `sitemap.xml` exacto y `robots.txt` con la URL absoluta.
- [x] Declarar tipos MIME, caché y `X-Robots-Tag` en `_headers`.
- [x] Integrar SEO después de catálogo y respaldo en `montaje`, `fotos` y
  `npm run montar`; publicar todos sus artefactos como una unidad.
- [x] Añadir `seo.js`: forma de JSON-LD, variantes, agotados, placeholders,
  sitemap, canonical, enlaces y noindex.
- [x] Incluir `seo.js` en suite completa y guardia corta.
- [x] Versionar ambos `package-lock.json`, usar `npm ci` y derivar las claves de
  caché de los locks.
- [x] Agregar `restore-keys` y ejecutar `playwright install --with-deps` solo
  cuando la caché del navegador no acertó.
- [ ] Medir tres publicaciones reales con caché caliente en cada tienda y
  registrar mediana/p95. No fijar una mejora porcentual antes de observarla.
- [ ] Enviar cada dominio definitivo a Search Console y observar cobertura y
  resultados enriquecidos; no hace parte del despliegue automático porque
  requiere ser propietario del dominio.

## Artefactos y orden

```text
Hoja/Drive → catalogo.json → respaldo del index → sembrar-seo
                                             ├─ JSON-LD de portada
                                             ├─ productos/<id>/index.html
                                             ├─ sitemap.xml
                                             └─ robots.txt
```

Si cualquiera falla, no se publica el conjunto. Cuando desaparece un producto,
el generador rehace completa la carpeta `productos/`, por lo que tampoco queda
una ficha huérfana para Google.

## Criterios de aceptación

- sitemap = portada + productos activos, sin extras ni `lastmod`;
- cada URL del sitemap responde con canonical absoluto;
- cada producto simple tiene un Offer y cada SKU de un ProductGroup el suyo;
- agotado sigue visible como `OutOfStock`, no desaparece del índice;
- no aparece ningún valor `[PENDIENTE]` en datos estructurados;
- ninguna ruta operativa puede indexarse;
- una caché caliente no descarga Chromium ni instala paquetes del sistema;
- suite completa y guardia corta quedan verdes antes del commit.

## Operación posterior

Después de publicar, probar `/robots.txt`, `/sitemap.xml` y una ficha en el
dominio real. Search Console puede tardar días en reflejar cambios; no es una
señal de fallo del despliegue. El comerciante solo mantiene nombre,
descripción, URL, contactos, productos, precios, stock y fotos en la hoja: el
horneado hace el resto al usar **Publicar ahora**.
