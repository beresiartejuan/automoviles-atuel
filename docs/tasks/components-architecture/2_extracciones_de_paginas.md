# COMP-2 — Extracciones desde páginas y deduplicación de SVGs

> Objetivo: detallar los cambios estructurales sobre las páginas (extraer HTML/script inline a componentes) y unificar los SVGs inline usando el alias `@svg/*`. No cambia estilos (Tailwind es otra tarea), ni contenido visual, ni SEO.

## 1. Extracciones por página

### 1.1 `src/pages/panel.astro` (116 líneas) → `components/cars/CarTable.astro`

- La tabla/lista de autos con sus acciones (editar, publicar/despublicar, eliminar) pasa a `CarTable.astro`.
- Props: `cars: ICar[]`.
- El `<script>` inline que maneja confirmación de borrado y acciones por fila se mueve dentro del componente (Astro soporta `<script>` en componentes; se ejecuta una vez por página aunque haya varias instancias si se usa `define:vars` con cuidado — evaluar si conviene pasar datos vía `data-*` attributes).
- La página queda como orquestadora: fetchea los autos y renderiza `<CarTable cars={cars} />`.
- Los botones de acción usan `components/forms/Button.astro` (variante de acción/variante de peligro vía prop `variant`).

### 1.2 `src/pages/autos/edit.astro` (391 líneas) → `components/cars/CarForm.astro` + `components/forms/*`

División propuesta:

- `forms/Input.astro` — props: `name`, `label`, `type`, `value?`, `placeholder?`, `required?`.
- `forms/Textarea.astro` — props: `name`, `label`, `value?`, `rows?`, `placeholder?`.
- `forms/Checkbox.astro` — props: `name`, `label`, `checked?`.
- `forms/Button.astro` — props: `type` (`submit` | `button`), `variant` (`primary` | `danger` | `ghost`), `label` o slot.
- `forms/FormSection.astro` — props: `title`, con slot para el contenido; cada sección del formulario (datos generales, especificaciones, equipamiento, fotos) es una instancia.
- `cars/CarForm.astro` — props: `car?: ICar` (undefined = modo creación), `photos?: ICarPhoto[]`, `info?: ICarInfo`; compone las secciones con las piezas de `forms/`.
- El `<script>` de manejo del formulario (armado de payload, preview de fotos, envío a la API) se mueve a `CarForm.astro`. Si la lógica crece, extraerla a un módulo `src/scripts/car-form.ts` importado por el componente.

`edit.astro` queda reducido a: obtener datos por id, decidir modo create/edit, renderizar `<CarForm ... />`.

### 1.3 `src/pages/login.astro` (177 líneas)

- Reemplazar los inputs y el botón inline por `forms/Input.astro` y `forms/Button.astro`.
- El script de submit puede quedar en la página (es específico del flujo de login y corto), o moverse al componente si se crea un `forms/AuthForm.astro`; preferir mantenerlo en la página para no sobre-abstraer un formulario de 2 campos.

### 1.4 `src/pages/autos/index.astro` (37 líneas)

- Ya delega en `Search.astro`/`CardList.astro`; tras el renombrado pasa a usar `cars/CarSearch.astro` + `cars/CarList.astro`. Sin cambios de lógica.

## 2. Deduplicación de SVGs con `@svg/*`

Estado actual:

- El alias `@svg/*` está declarado en `tsconfig.json` pero `src/svg/` no existe y no hay usos.
- `Footer.astro` tiene 2 SVGs de whatsapp casi idénticos (~líneas 46 y ~63) que solo difieren en el número de teléfono asociado.

Trabajo:

1. Crear `src/svg/` y volcar ahí cada SVG que aparezca inline más de una vez, un archivo por icono: `whatsapp.svg`, y los demás que se detecten en Header/Navbar/Search/etc. durante la ejecución.
2. Normalizar los SVG extraídos: mismos `viewBox`, `width`/`height` controlables (preferir `1em` o eliminar dimensiones fijas y dimensionar desde CSS), `aria-hidden="true"` cuando sean decorativos.
3. Reemplazar los usos inline por el componente `components/common/Icon.astro`:

   ```astro
   ---
   interface Props {
       name: string;      // nombre del archivo en src/svg/ sin extensión
       size?: string;     // default "1.5rem"
       label?: string;    // si se pasa, el icono es accesible (role="img" + aria-label)
   }
   const { name, size = "1.5rem", label } = Astro.props;
   ---
   ```

   El componente lee el SVG vía `import.meta.glob("@svg/*.svg", { as: "raw", eager: true })` (o import directo del archivo) e inyecta el markup con `set:html`, así se evita fetch en runtime y sigue siendo estático.

4. En `Footer.astro`, los 2 bloques de whatsapp pasan a `<Icon name="whatsapp" />` dentro de cada enlace; el contenido (número) queda como texto ya existente. Alternativa aceptada si se prefiere menos abstracción: usar el SVG importado directamente en Footer con `set:html`, pero el componente `Icon` es la opción recomendada para el resto del sitio.

Regla para el futuro: **prohibido pegar SVGs inline en páginas/componentes**; todo icono nuevo entra por `src/svg/` + `Icon.astro`.

## 3. Criterios de aceptación

- `src/ui/` ya no existe; todo componente vive en `src/components/{layout,cars,forms,common}`.
- `edit.astro` ≤ ~50 líneas; `panel.astro` ≤ ~40 líneas (solo fetch + composición).
- No queda ningún SVG inline duplicado; los iconos repetidos se sirven desde `src/svg/`.
- Todos los componentes exponen `interface Props` con tipos de `src/db/models.ts` donde corresponda.
- El HTML renderizado de cada página es equivalente al actual (diff de markup mínimo: solo lo introducido por normalizar los SVG).
- Ningún cambio de clases/estilos: eso pertenece a `docs/tasks/tailwind-integration/`.