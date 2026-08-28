# SEO-1 — Configuración base de SEO: site, sitemap, robots y metadatos por página

> Objetivo: sentar la base técnica de SEO en el proyecto: dominio real en `astro.config.mjs`, sitemap, robots.txt y metadatos específicos por página (incluidas las fichas de cada auto). No incluye datos estructurados (ver SEO-2) ni cambios de diseño/UX.

## Alcance

- Corregir `site` en `astro.config.mjs` y propagarlo a canonical y Open Graph.
- Sitemap automático con `@astrojs/sitemap` y `robots.txt`.
- `Head.astro` acepta parámetros por página; metadatos específicos por auto en `/autos/[id]`.
- Fuera de alcance: JSON-LD, rediseño visual, migración de estilos, performance (ver SEO-2 y tareas de diseño).

## 1. Corregir `site` en `astro.config.mjs`

El valor actual es `http://localhost:1234`. Debe ser el dominio real de producción:

```js
// astro.config.mjs
export default defineConfig({
    site: "https://automovilesatuel.com.ar", // ← reemplazar por el dominio real
    output: "server",
    adapter: vercel(),
    // ...
});
```

Consecuencia: `Astro.site` y `Astro.url` pasan a resolver con el dominio real, lo que arregla de raíz los canonical y las OG URLs de `Head.astro` si se construyen a partir de `Astro.url` (ver sección 3).

> Nota: no hardcodear el dominio en componentes. Siempre derivar de `Astro.site` / `Astro.url` o usar `import.meta.env.SITE`.

## 2. Sitemap y robots.txt

```bash
npm install @astrojs/sitemap
```

```js
// astro.config.mjs
import sitemap from "@astrojs/sitemap";

export default defineConfig({
    site: "https://automovilesatuel.com.ar",
    output: "server",
    adapter: vercel(),
    integrations: [sitemap()],
});
```

Consideraciones para SSR (output `server`):

- Verificar que el sitemap se genere en el build de Vercel (la integración genera `sitemap-index.xml` y `sitemap-0.xml`).
- El sitemap solo incluye rutas estáticas conocidas en build. Las fichas `/autos/[id]` se renderizan on-demand: evaluar el modo prerender de las páginas públicas (`export const prerender = true`) si los datos lo permiten (los autos publicados cambian poco), o generar el sitemap dinámicamente vía endpoint (`src/pages/sitemap.xml.ts`) consultando `get_published_cars`. Elegir la opción más simple que funcione.

`robots.txt` como archivo estático en `public/`:

```text
User-agent: *
Allow: /

Sitemap: https://automovilesatuel.com.ar/sitemap-index.xml
```

> Bloquear rutas del panel admin con `Disallow: /admin` (o la ruta que corresponda) tras confirmar el path real.

## 3. `Head.astro` parametrizado

El componente actual tiene valores fijos. Debe aceptar props con defaults sensatos:

```astro
---
interface Props {
    title?: string;
    description?: string;
    image?: string; // ruta absoluta desde la raíz del sitio o URL absoluta
    type?: "website" | "article"; // article no aplica a autos; website basta
    noindex?: boolean; // para el panel admin
}
const {
    title = "Automóviles Atuel",
    description = "Descripción por defecto de la concesionaria",
    image = "/banner.png",
    noindex = false,
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImage = new URL(image, Astro.site);
const pageTitle = title === "Automóviles Atuel" ? title : `${title} | Automóviles Atuel`;
---
```

Reglas:

- `<title>`, `description`, `canonical`, `og:title`, `og:description`, `og:url`, `og:image`, `twitter:*` derivan de las props y de `Astro.url` + `Astro.site`.
- Páginas del panel admin usan `noindex` para excluirlas del índice.
- Mantener `lang="es"` en el `<html>` (ya existe).

## 4. Metadatos por auto en `/autos/[id]`

La ficha pasa título, descripción e imagen del auto al `Head`:

```astro
---
const car = await get_car_by_id(Astro.params.id);
if (!car) return Astro.rewrite("/404");
const photos = await get_photos_by_car_id(car.id);
const mainPhoto = photos.find((p) => p.isMain)?.photoUrl ?? photos[0]?.photoUrl;

const title = `${car.name} ${car.model} ${car.year}`;
const description = car.description.slice(0, 160); // recortar a ~160 caracteres
---
<Head title={title} description={description} image={mainPhoto} />
```

- La imagen OG debe ser una URL absoluta (ya se resuelve en `Head.astro` con `new URL(image, Astro.site)`).
- Si el auto no está publicado, devolver 404 en vez de renderizar (evita contenido indexable vacío).
- El listado `/autos` también define su propio título y descripción.

## 5. Orden de trabajo sugerido

1. Cambiar `site` en `astro.config.mjs` al dominio real.
2. Instalar `@astrojs/sitemap`, agregarlo a integrations y crear `public/robots.txt`.
3. Parametrizar `Head.astro` (title, description, image, noindex) y actualizar las páginas existentes a los nuevos props.
4. Añadir metadatos por auto en `/autos/[id]` y metadatos propios en `/autos`.
5. Verificar en build de Vercel: sitemap accesible, canonical correctos, OG image absoluta.
6. Validar con las herramientas para webmasters de Google (Search Console) una vez en producción.