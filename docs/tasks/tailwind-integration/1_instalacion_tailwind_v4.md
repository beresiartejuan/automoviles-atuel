# TAILWIND-1 — Instalación de Tailwind CSS v4 con Astro

> Objetivo: agregar Tailwind CSS v4 al proyecto Astro usando el plugin de Vite, sin romper los estilos `<style>` scoped existentes. La migración de componentes en sí se cubre en `2_migracion_gradual.md`.

## Alcance

- Instalación y configuración de Tailwind v4 con `@tailwindcss/vite`.
- Punto de entrada único de estilos (`src/styles/main.scss`).
- Definición de tokens de diseño (marca, tipografías, espaciados) con `@theme`.
- Reemplazo de normalize.css por el preflight de Tailwind.
- Reemplazo de Google Fonts CDN por `@fontsource` (autoalojado).

Fuera de alcance: arquitectura de componentes, SEO, rediseño visual y orden de migración (ver tareas paralelas y `2_migracion_gradual.md`).

## 1. Instalación

```bash
npm install tailwindcss @tailwindcss/vite
```

Tailwind v4 no requiere `tailwind.config.js` ni PostCSS: todo se configura desde CSS.

## 2. Plugin de Vite

```ts
// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    // ...config existente (vercel adapter, etc.)
    vite: {
        plugins: [tailwindcss()],
    },
});
```

## 3. Punto de entrada de estilos

`src/styles/main.scss` está vacío hoy; se convierte en el único punto de entrada global:

```scss
/* src/styles/main.scss */
@import "tailwindcss";
```

> Nota: con Tailwind v4 se recomienda `@import "tailwindcss"` en el archivo global que ya importa el layout. Si SCSS da problemas de compatibilidad con `@theme` (bloques CSS nativos), se puede usar un `src/styles/main.css` puro e importar el resto de parciales `.scss` desde ahí. Decidir en implementación y dejar un solo punto de entrada.

Import en el layout:

```astro
---
// src/layouts/Layout.astro
import "../styles/main.scss";
---
```

## 4. Tokens de diseño con `@theme`

Definir en el mismo archivo global los tokens del proyecto (colores de marca a confirmar con la tarea de diseño; nombres de ejemplo):

```css
@theme {
    /* Colores de marca (ajustar a los reales del sitio) */
    --color-brand-50: #f0f7ff;
    --color-brand-500: #1e6fd9;
    --color-brand-900: #0b2e5c;

    /* Tipografías: Kanit (títulos) y Poppins (texto) */
    --font-display: "Kanit", sans-serif;
    --font-sans: "Poppins", sans-serif;

    /* Espaciados adicionales si hace falta (Tailwind ya trae escala 4px) */
    --spacing-section: 6rem;
}
```

Esto habilita clases como `text-brand-500`, `font-display`, `p-section`, etc.

## 5. Fuentes: Google Fonts CDN → @fontsource

Eliminar los `<link>` de Google Fonts del layout y autoalojar las fuentes:

```bash
npm install @fontsource/kanit @fontsource/poppins
```

```ts
// src/layouts/Layout.astro (frontmatter)
import "@fontsource/kanit/400.css";
import "@fontsource/kanit/600.css";
import "@fontsource/kanit/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
```

> Elegir solo los pesos realmente usados (revisar los `<style>` actuales). Ventajas: sin request externo, mejor LCP, sin dependencia de terceros en runtime.

## 6. normalize.css → preflight de Tailwind

- Tailwind v4 incluye preflight (reset) dentro de `@import "tailwindcss"`.
- Quitar `normalize.css` de las dependencias y su import del layout, para no duplicar resets (preflight ya lo cubre y va más allá).
- Riesgo conocido: preflight quita estilos por defecto (márgenes de headings, bullets de listas, bordes de inputs). Como los componentes migrados traen sus propias clases, revisar visualmente tras el cambio; los componentes aún no migrados pueden necesitar ajustes puntuales.

```bash
npm uninstall normalize.css
```

## 7. Criterios de aceptación

- `npm run dev` y `npm run build` funcionan sin warnings de Tailwind.
- Un utility class de prueba (p. ej. `text-brand-500`) renderiza en una página.
- Las fuentes se cargan desde `/_astro/...` (sin requests a fonts.googleapis.com).
- normalize.css ya no aparece en `package.json` ni en el CSS compilado.
- Los componentes existentes no muestran regresiones visuales graves por el cambio de reset.