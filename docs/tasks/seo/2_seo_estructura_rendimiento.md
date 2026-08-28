# SEO-2 — Datos estructurados, páginas de error, contenido semántico y Core Web Vitals

> Objetivo: completar el SEO técnico con JSON-LD, páginas 404/500 personalizadas, HTML semántico con headings y alt correctos, y mejoras básicas de performance que impactan Core Web Vitals. No incluye rediseño visual ni migración de estilos (tareas de diseño en paralelo).

## Alcance

- JSON-LD: `AutoDealer` (home), `Vehicle` (ficha de auto), `BreadcrumbList`.
- Páginas 404 y 500 personalizadas.
- Headings jerárquicos, atributos `alt` descriptivos, accesibilidad básica con impacto en SEO.
- Performance básica: lazy loading de imágenes, `preconnect`, dimensiones explícitas.
- Fuera de alcance: sitemap/robots/metadatos (ver SEO-1), rediseño visual/UX, migración de estilos.

## 1. Datos estructurados (JSON-LD)

Un solo componente que imprime `<script type="application/ld+json">`:

```astro
---
// src/components/JsonLd.astro
interface Props {
    data: Record<string, unknown>;
}
const { data } = Astro.props;
---
<script type="application/ld+json" set:html={JSON.stringify(data)} />
```

### 1.1. AutoDealer (home)

```js
{
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": "Automóviles Atuel",
    "url": Astro.site,
    "image": new URL("/banner.png", Astro.site),
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "…", // completar con datos reales
        "addressRegion": "…",
        "addressCountry": "AR"
    },
    // "telephone": "…", "openingHours": "…" si se dispone de los datos
}
```

### 1.2. Vehicle (ficha `/autos/[id]`)

Construido desde los datos reales del auto (`car`, `carInfo`, fotos):

```js
{
    "@context": "https://schema.org",
    "@type": "Car",
    "name": `${car.name} ${car.model}`,
    "brand": { "@type": "Brand", "name": car.name }, // ajustar según cómo se modela la marca
    "model": car.model,
    "vehicleModelDate": String(car.year),
    "mileageFromOdometer": { "@value": carInfo.mileage, "@type": "QuantitativeValue" }, // parsear km
    "image": fotos.map((f) => new URL(f.photoUrl, Astro.site)),
    "description": car.description,
    // "offers": solo si se expone el precio de forma estructurada; hoy está implícito en description
}
```

> Nota: el precio está implícito en `description`. Si el esquema v2 (tarea db-migration) agrega un campo de precio numérico, mapearlo a `offers.price` + `priceCurrency: "ARS"`. Hasta entonces, omitir `offers`.

### 1.3. BreadcrumbList (ficha y listado)

```js
{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": Astro.site },
        { "@type": "ListItem", "position": 2, "name": "Autos", "item": new URL("/autos", Astro.site) },
        { "@type": "ListItem", "position": 3, "name": `${car.name} ${car.model}` }
    ]
}
```

Validar el resultado con el Rich Results Test / validador de Schema.org.

## 2. Páginas 404 y 500

- `src/pages/404.astro`: mensaje claro en español, link al home y al listado `/autos`. Con SSR, `Astro.rewrite("/404")` desde `/autos/[id]` cuando el auto no existe (ya usado en SEO-1).
- `src/pages/500.astro`: manejo de error genérico (en Vercel, configurar la ruta de error si el adaptador lo soporta).
- Ambas heredan el layout del sitio (mismo header/nav) y usan `noindex`.

## 3. Contenido semántico y accesibilidad (impacto SEO)

- **Headings jerárquicos**: un único `<h1>` por página (nombre del auto en la ficha, título del listado en `/autos`); `<h2>` para secciones (ficha técnica, fotos, descripción). Evitar saltos de nivel.
- **`alt` descriptivos**: en las fotos de autos usar alt tipo `${car.name} ${car.model} ${car.year} — foto N`. El logo con alt del nombre de la concesionaria; decorativos con `alt=""`.
- **HTML semántico**: `<nav>`, `<main>`, `<article>` para la ficha, `<footer>`; links con texto descriptivo (no "click aquí").
- **Accesibilidad básica**: `aria-label` en botones solo con icono, contraste suficiente en textos, foco visible, `<label>` en inputs del buscador. Solo lo que impacta SEO/usabilidad — el resto queda para las tareas de diseño.
- Idioma: mantener `lang="es"` (ya existe).

## 4. Performance básica (Core Web Vitals)

- **Lazy loading**: `loading="lazy"` + `decoding="async"` en todas las fotos de autos salvo la primera de la ficha (que va `loading="eager"` + `fetchpriority="high"` para el LCP). Nota: la tarea image-service ya cubre optimización/formato; aquí solo tocaremos los atributos de carga.
- **Dimensiones explícitas**: `width`/`height` (o aspect-ratio en el CSS existente) para evitar CLS.
- **`preconnect`**: en `Head.astro`, `<link rel="preconnect">` al dominio de las imágenes (el que use el image-service) y a fuentes externas si las hay.
- **Fuentes**: `font-display: swap` si hay webfonts propias.
- Medir después con PageSpeed Insights / Lighthouse; no optimizar de más en esta etapa.

## 5. Orden de trabajo sugerido

1. Crear `JsonLd.astro` y agregar `AutoDealer` en la home.
2. Agregar `Car` + `BreadcrumbList` en `/autos/[id]` (y breadcrumb en `/autos` si aplica).
3. Crear `404.astro` y `500.astro`, y conectar `Astro.rewrite("/404")` en las fichas inexistentes.
4. Revisar headings y alts en todas las páginas públicas.
5. Aplicar lazy/eager loading, dimensiones y preconnects.
6. Correr Lighthouse y validar JSON-LD; anotar resultados como línea base.