# COMP-1 — Reorganización de la arquitectura de componentes

> Objetivo: definir una estructura de carpetas única con un criterio claro, eliminar la confusión actual entre `src/components/` y `src/ui/`, y desdoblar el HTML/script inline de las páginas en componentes reutilizables.

> Fuera de alcance (otras tareas): migración de estilos a Tailwind (`docs/tasks/tailwind-integration/`), SEO, rediseño visual/UX. Esta tarea es **puramente estructural**: mismo markup, mismas clases, mismos estilos; solo cambia dónde vive cada pieza.

## 1. Problema actual

- `src/components/` y `src/ui/` no tienen un criterio de división: `Card.astro` está en `components/` pero `CardHeader.astro`, `CardInfo.astro`, `CardTech.astro` y `CardPhotos.astro` están en `ui/`, aunque pertenecen a la misma entidad.
- Las páginas concentran demasiado HTML y JS inline:
  - `src/pages/autos/edit.astro` (391 líneas): formulario de edición entero con secciones, inputs, botones y lógica inline.
  - `src/pages/panel.astro` (116 líneas): tabla/lista de autos + acciones inline.
  - `src/pages/login.astro` (177 líneas): formulario con estilo inline.
  - `src/pages/autos/index.astro`: listado + búsqueda armados a mano.
- SVGs duplicados: en `Footer.astro` hay 2 SVGs de whatsapp casi idénticos (líneas ~46 y ~63), y hay más iconos inline repartidos por el proyecto.
- El alias `@svg/*` ya está declarado en `tsconfig.json` pero **la carpeta `src/svg/` no existe todavía** y el alias no se usa.

## 2. Estructura propuesta

Reemplazar la división `components/` + `ui/` por una sola carpeta con agrupación por dominio/rol:

```text
src/
├── components/
│   ├── layout/          # Estructura de la página (no saben de autos)
│   │   ├── Head.astro
│   │   ├── Header.astro
│   │   ├── Navbar.astro
│   │   └── Footer.astro
│   ├── cars/            # Todo lo que es de la entidad auto
│   │   ├── CarCard.astro          (antes Card.astro)
│   │   ├── CarCardHeader.astro    (antes ui/CardHeader.astro)
│   │   ├── CarCardInfo.astro      (antes ui/CardInfo.astro)
│   │   ├── CarCardPhotos.astro    (antes ui/CardPhotos.astro)
│   │   ├── CarCardTech.astro      (antes ui/CardTech.astro)
│   │   ├── CarList.astro          (antes CardList.astro)
│   │   ├── CarSearch.astro        (antes Search.astro)
│   │   ├── CarTable.astro         (nuevo: extraído de panel.astro)
│   │   └── CarForm.astro          (nuevo: extraído de edit.astro)
│   ├── forms/           # Piezas de formulario genéricas
│   │   ├── Input.astro
│   │   ├── Textarea.astro
│   │   ├── Checkbox.astro
│   │   ├── Button.astro
│   │   └── FormSection.astro
│   └── common/          # Piezas transversales pequeñas
│       └── Icon.astro             (wrapper sobre src/svg/)
└── svg/                 # SVGs como archivos .svg, accedidos vía alias @svg/
    ├── whatsapp.svg
    └── ... (los demás iconos que hoy están inline)
```

Criterio de clasificación (la regla para decidir dónde va un componente):

1. **`layout/`**: aparece en todas (o casi todas) las páginas y no conoce el dominio "auto".
2. **`cars/`**: su razón de ser es mostrar o editar autos.
3. **`forms/`**: pieza de formulario reutilizable sin lógica de dominio (solo recibe props).
4. **`common/`**: cualquier otra cosa pequeña y genérica.

Regla auxiliar: si un componente sólo lo usa una página y no es reutilizable, puede vivir inline **temporalmente**, pero si supera ~40 líneas de markup debe extraerse a un componente.

## 3. Renombrado / movidas

| Actual | Nuevo |
| --- | --- |
| `src/components/Card.astro` | `src/components/cars/CarCard.astro` |
| `src/components/CardList.astro` | `src/components/cars/CarList.astro` |
| `src/components/Search.astro` | `src/components/cars/CarSearch.astro` |
| `src/components/{Head,Header,Navbar,Footer}.astro` | `src/components/layout/` |
| `src/ui/CardHeader.astro` | `src/components/cars/CarCardHeader.astro` |
| `src/ui/CardInfo.astro` | `src/components/cars/CarCardInfo.astro` |
| `src/ui/CardPhotos.astro` | `src/components/cars/CarCardPhotos.astro` |
| `src/ui/CardTech.astro` | `src/components/cars/CarCardTech.astro` |
| `src/ui/Title.astro` | `src/components/common/Title.astro` |
| `src/ui/` | **se elimina** |

- Actualizar todos los imports en `src/pages/` y `src/layouts/Layout.astro` en el mismo commit (cambios mecánicos, sin lógica).
- Mantener nombres en PascalCase para archivos `.astro` y prefijo `Car` para todo lo de la entidad auto.

## 4. Extracciones desde páginas (resumen)

El detalle de cada extracción está en `2_extracciones_de_paginas.md`. Resumen:

- `panel.astro` → `cars/CarTable.astro` (listado/tabla con acciones por fila).
- `edit.astro` → `cars/CarForm.astro` dividido en secciones (`FormSection.astro` + `forms/*`), incluyendo mover el `<script>` asociado al componente.
- `login.astro` → reuso de `forms/Input.astro` + `forms/Button.astro`.
- `autos/index.astro` → reuso de `cars/CarSearch.astro` + `cars/CarList.astro`.
- Footer → los 2 SVGs de whatsapp se reemplazan por `@svg/whatsapp.svg` (ver COMP-2).

## 5. Props tipadas y consistencia

- Todos los componentes nuevos y existentes declaran sus props con `interface Props` y tipos importados de `src/db/models.ts` (`ICar`, `ICarPhoto`, `ICarInfo`) cuando aplican — no aceptar `any` ni objetos sueltos.
- Convenciones de props:
  - Nombres en camelCase: `car: ICar`, `photos: ICarPhoto[]`, `isUsed?: boolean`.
  - Opcionales solo cuando realmente lo son; defaults declarados con `Astro.props` desestructurado.
  - Un componente de `forms/` nunca recibe un `ICar` completo: solo los campos que usa (facilita reuso en create vs edit).
- Los componentes no traen datos: **las páginas fetchean** y pasan datos por props. Un componente no debe llamar a funciones de `src/db/`.

## 6. Orden de trabajo sugerido

1. Crear `src/svg/` con los SVGs inline existentes (empezando por los 2 de whatsapp del Footer) y verificar que el alias `@svg/*` resuelve.
2. Crear carpetas `layout/`, `cars/`, `forms/`, `common/` y mover/renombrar componentes existentes; actualizar imports.
3. Eliminar la carpeta `src/ui/`.
4. Extraer `CarTable.astro` desde `panel.astro`.
5. Extraer `CarForm.astro` + piezas de `forms/` desde `edit.astro`.
6. Ajustar `login.astro` y `autos/index.astro` a los componentes extraídos.
7. Agregar `interface Props` tipado a todos los componentes que no lo tengan.
8. Prueba de humo: index, listado de autos, ficha `[id]`, login, panel, create/edit/delete — verificando que el HTML renderizado no cambie.