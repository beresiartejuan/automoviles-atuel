# TAILWIND-2 — Migración gradual de componentes a Tailwind

> Objetivo: definir la estrategia de coexistencia y el orden de migración de los `<style>` scoped actuales a clases de Tailwind, sin reescribir todo de golpe. La instalación base está en `1_instalacion_tailwind_v4.md`.

## Alcance

- Reglas de coexistencia entre Tailwind y los `<style scoped>` existentes.
- Orden sugerido de migración de componentes.
- Manejo de casos límite (estilos condicionales, estados, responsive).

Fuera de alcance: arquitectura de componentes, SEO y decisiones de diseño/UX (otras tareas).

## 1. Principios de coexistencia

1. **Coexistencia permitida**: durante la migración un componente puede tener clases de Tailwind y su bloque `<style>` a la vez. No hay que "limpiar todo" para empezar.
2. **Regla de oro**: cuando un componente migre, su bloque `<style scoped>` se elimina completo en el mismo commit. No dejar la mitad en Tailwind y la mitad en CSS propio sin motivo.
3. **CSS global mínimo**: `main.scss` solo contiene `@import "tailwindcss"`, `@theme` y, como máximo, un puñado de estilos de componentes recursivos (ver §4). Nada de clases custom tipo `.btn-primary` en CSS salvo que se repita 3+ veces (evaluar entonces `@apply` o componente).
4. **`@apply` con moderación**: solo para casos donde una utilidad se repite tanto que rompe legibilidad; preferir extraer un componente Astro antes que un `@apply` grande.

## 2. Casos límite

- **Estilos condicionales**: reemplazar clases dinámicas construidas por string (`class={`card ${active ? "card--active" : ""}`}`) por condicionales con utilidades completas (`class:list={["p-4", active && "border-brand-500"]}`). Tailwind v4 escanea el código, así que los nombres de clase deben aparecer literales.
- **Responsive**: usar variantes de Tailwind (`md:`, `lg:`) en lugar de media queries dentro del `<style>`.
- **Estados hover/focus**: usar variantes (`hover:`, `focus-visible:`) en lugar de `&:hover` en el bloque scoped.
- **`prefers-reduced-motion` / dark mode**: si el sitio no los usa hoy, no introducirlos en esta migración.

## 3. Orden de migración sugerido

De "menos riesgo y más impacto" a "más riesgo":

1. **`Layout.astro`** — ya toca el global; verificar base (background, color, fuente por defecto).
2. **Navbar / Header** — autónomo, muy visible, ideal para fijar patrones (container, spacing, breakpoints).
3. **Footer** — mismo motivo, sin lógica compleja.
4. **UI genérica** (`src/ui/`): botones, inputs, badges, selects del panel admin.
5. **Cards de autos** (listado y destacados) — aquí conviene que ya estén los tokens de `@theme` estabilizados.
6. **Ficha de auto (detalle)** — más contenido, más estados.
7. **Formularios del panel admin** — al final: más lógica condicional, menor riesgo visual.

> Nota: las páginas `.astro` con estilos inline en el frontmatter se tratan igual que los componentes (un archivo por commit).

## 4. Estilos recursivos y selectores hijos

Astro usa `:global()` y `is:global` para estilos que atraviesan el scope. Al migrar:

- Si un componente estiliza HTML generado dinámicamente (p. ej. descripción de auto en HTML), migrar con utilidades en el template si es posible, o mantener un mínimo bloque `<style is:global>` documentado.
- No usar selectores profundos tipo `.card h3 span` en Tailwind: reformular con clases directas en los elementos.

## 5. Proceso por componente

Para cada componente a migrar:

1. Reemplazar estilos por utilidades (y variantes si hay responsive/estados).
2. Borrar el bloque `<style>` completo.
3. Comparar visualmente contra el estado previo (mismo viewport desktop y mobile).
4. Commit separado por componente (o grupo pequeño), mensaje tipo `refactor(styles): migrar navbar a tailwind`.

## 6. Criterios de aceptación

- Ningún `<style>` scoped en los componentes migrados (salvo excepciones documentadas con `is:global`).
- `main.scss` sin reglas sueltas de componentes.
- Bundle de CSS final igual o menor al actual (Tailwind solo incluye las clases usadas).
- Sin regresiones visuales verificadas en desktop y mobile.