# Tasks — Plan de trabajo

Carpeta con tareas planificadas (solo documentación, no implementadas). Cada subcarpeta es una sección temática y cada archivo una tarea atómica.

## Secciones

| Sección | Tareas | Tema |
|---|---|---|
| `db-migration/` | 1-3 | Mejora del esquema, creación de DB v2 en Turso, migración de datos |
| `drizzle-integration/` | 1-2 | Integración de Drizzle ORM + funciones auxiliares de dominio |
| `image-service/` | 1 | Encapsular el servicio de imágenes (ImgBB) |
| `tailwind-integration/` | 1-2 | Instalación de Tailwind v4 + migración gradual de estilos |
| `components-architecture/` | 1-2 | Reorganización de componentes y extracción desde páginas |
| `seo/` | 1-2 | SEO base (sitemap, metadatos) + JSON-LD, errores y CWV |
| `ux-ui-redesign/` | 1-3 | Dirección visual, sitio público, panel admin |

## Orden sugerido de ejecución

1. **db-migration** (base de datos v2, es la base de todo lo demás)
2. **drizzle-integration** (sobre el esquema v2)
3. **image-service** (independiente de DB, puede ir en paralelo con 4)
4. **tailwind-integration** (instalación → migración gradual)
5. **components-architecture** (puede ir en paralelo con 4; mover archivos no cambia estilos)
6. **ux-ui-redesign** (aplica los tokens de Tailwind y los componentes reorganizados)
7. **seo** (al final, sobre las páginas ya rediseñadas)

## Dependencias y puntos de coordinación

- **UXUI-2/3 → db-migration**: los estados "vendido/reservado" de la UI requieren un campo `status` (`available | reserved | sold`) que el esquema actual no tiene. Si se quiere esa funcionalidad, agregarlo al esquema v2 en `db-migration/1_mejorar_esquema.md` antes de implementar la UI.
- **UXUI-2 (precio en tarjetas) → db-migration**: el precio hoy está implícito en `description`. Para mostrarlo destacado conviene agregar un campo `price` al esquema v2 (y a `Car` JSON-LD en SEO-2, `offers.price`).
- **UXUI-1 → TAILWIND-1**: los valores de la paleta de UXUI-1 son los que TAILWIND-1 codifica en `@theme`. No definen sistemas paralelos.
- **image-service → drizzle/db**: la persistencia de URLs de fotos queda en `src/db/` (drizzle); el servicio solo valida, sube y devuelve URLs.
- **SEO-2 ↔ UXUI-2**: los breadcrumbs visuales son de UXUI-2; el `BreadcrumbList` JSON-LD es de SEO-2. Ambos se implementan por separado.
- **SEO-2 ↔ image-service**: SEO-2 solo define atributos de carga (`loading`, `fetchpriority`); la optimización/formato de imágenes es de image-service (opcional, con `sharp`).
- **TAILWIND-2 ↔ components-architecture**: la migración de estilos opera sobre la estructura de componentes resultante de la reorganización (ejecutar componentes primero simplifica la migración, aunque ambas pueden avanzar en paralelo archivo por archivo).