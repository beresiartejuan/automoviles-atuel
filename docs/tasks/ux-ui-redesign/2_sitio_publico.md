# UXUI-2 — Rediseño del sitio público

> Objetivo: especificar el rediseño visual y de UX de las páginas públicas (home, listado `/autos`, ficha `/autos/[id]`), con foco en que el visitante encuentre rápido un auto, entienda su precio y estado, y contacte por WhatsApp con el mínimo fricción.
>
> Aplica la dirección visual de UXUI-1. Fuera de alcance: implementación Tailwind (TAILWIND-2), arquitectura de componentes, SEO técnico, panel admin (UXUI-3).

## 1. Home

### 1.1 Hero

Mockup:

- Alto ~60vh en desktop, auto en mobile. Imagen de fondo de un auto del stock (foto buena, no stock photo) con overlay azul oscuro semitransparente (60–75%) para legibilidad.
- Titular en Kanit 700: "Tu próximo auto, cerca de casa". Subtítulo Poppins: "Autos usados y 0km seleccionados en San Rafael, Mendoza."
- Un solo CTA: botón secundario claro "Ver autos" (ancla a la sección de destacados). Sin doble CTA que compita.
- Debajo del hero, franja fina con 3 datos rápidos (año de la concesionaria, autos vendidos aproximados, "+info por WhatsApp") — opcional, evaluar si genera ruido.

### 1.2 Autos destacados

- Título de sección "Destacados" + link "Ver todos →" a `/autos`.
- Grid de tarjetas (misma tarjeta de §2): 3 columnas desktop, 2 tablet, 1 columna mobile con scroll horizontal o apilado (decidir en implementación; apilado es más simple).
- **Empty state** (§7): si no hay destacados publicados, no renderizar la sección, mostrar franja con CTA a `/autos`.

### 1.3 Bloque de contacto / cierre

- Sección con fondo azul suave: "¿Buscás algo en particular? Consultanos" + botón verde de WhatsApp + link a Instagram.
- Incluye horarios de atención y link a Google Maps (ya existente en footer, se repite aquí por conversión).

## 2. Tarjeta de auto (componente único para destacados y listado)

Mockup (desktop, ~380px ancho):

```text
┌─────────────────────────────┐
│  [foto principal 16:10] 0KM │   ← badge arriba a la izquierda sobre la foto
│─────────────────────────────│
│  Toyota Corolla XEi         │   ← Kanit 600, 1 línea con ellipsis
│  2020 · 45.000 km           │   ← gris, 14px
│                             │
│  $ 18.900.000               │   ← Kanit 700, 20-24px
│  [Consultar →]              │   ← botón secundario, link a ficha
└─────────────────────────────┘
```

Especificaciones:

- **Foto**: ratio fijo 16:10, `object-fit: cover`. Si no tiene fotos, placeholder gris con icono de auto y texto "Sin fotos".
- **Precio**: siempre visible, formato `$ 18.900.000`. Es el dato más importante después de la foto.
- **Badges**: `0KM` o `USADO` sobre la foto. `RESERVADO`/`VENDIDO` también sobre la foto (ver §6 estados).
- **Kilometraje**: mostrar en la línea de metadatos si existe el dato (viene de `carInfo.mileage`).
- **Auto vendido**: foto con filtro de escala de grises + opacidad 60%, badge `VENDIDO`, sin botón de consultar (el clic lleva igual a la ficha, que muestra el estado).
- Todo el card es clicable (link a ficha), el botón interno es visual.
- Hover (desktop): elevación sutil de la sombra + zoom leve de la foto (transition 200ms).

## 3. Listado `/autos`

### 3.1 Barra de filtros

- Fila superior: input de búsqueda (placeholder "Buscar por marca o modelo…") + segmented control de estado: `Todos | 0km | Usados`. En mobile, el segmented va debajo del input.
- El segmented control reemplaza al filtro actual; visualmente es un grupo de botones pill con el activo en azul.
- Comportamiento de búsqueda: al enviar, actualizar la URL (`?q=...&estado=usado`) para que el resultado sea compartible; mostrar resultados sin recargar la página entera si resulta trivial, si no, es aceptable el recargo con estado de carga (§3.3).

### 3.2 Resultados

- Contador arriba: "12 autos encontrados" (o "Resultados para 'corolla'"). Da feedback de que la búsqueda funcionó.
- Grid de tarjetas §2. Sin paginación por ahora (el inventario es pequeño); si crece, paginar simple.

### 3.3 Estados

- **Cargando**: skeleton de tarjetas (bloques grises con pulso) en la primera carga; en búsquedas, un estado "Buscando…" con opacidad reducida sobre el grid.
- **Sin resultados**: empty state de §7.1 con botón "Limpiar filtros".
- **Error de carga**: mensaje con botón "Reintentar".

## 4. Ficha de auto `/autos/[id]`

Mockup (desktop):

```text
┌──────────────────────────────────────────────┐
│ ← Volver a autos                             │   ← breadcrumb (ver §5)
│ Toyota Corolla XEi 2020        [0KM] $18.900.000 │
│                                              │
│ ┌────────────────────────┐ ┌──────────────┐  │
│ │                        │ │  fotos grid  │  │
│ │   foto principal       │ │  (miniaturas)│  │
│ │   [◀] [▶]  ● ● ● ○ ○   │ │              │  │
│ └────────────────────────┘ └──────────────┘  │
│                                              │
│ ┌─ Columna izquierda ─────┐ ┌─ Columna der ─┐│
│ │ Descripción             │ │ [WhatsApp]    ││
│ │                         │ │ [Instagram]   ││
│ │ Ficha técnica (grid)    │ │ Compartir     ││
│ │ Confort y seguridad ✓   │ │               ││
│ └─────────────────────────┘ └───────────────┘│
└──────────────────────────────────────────────┘
```

### 4.1 Galería con lightbox y navegación

Problema actual: grid simple de `<img>` sin jerarquía ni zoom. Especificación:

- **Foto principal** grande (ratio 16:10) + miniaturas debajo o al costado (la clickeada pasa a principal). La foto marcada `isMain` es la inicial.
- Flechas `◀ ▶` sobre la foto principal para navegar (desktop; en mobile, swipe horizontal con indicador de puntos).
- **Lightbox**: clic en la foto principal abre overlay a pantalla completa (fondo negro 90%) con:
  - foto centrada, flechas laterales, contador "2 / 8", botón cerrar (X) y tecla `Esc`.
  - navegación con flechas del teclado.
  - swipe en mobile.
- Accesibilidad: `alt` descriptivo por foto, foco atrapado en el lightbox mientras está abierto.

### 4.2 Ficha técnica

- Grid de 2 columnas (1 en mobile) de pares clave/valor: Año, Kilometraje, Combustible, Transmisión, Tracción, Motor, Tanque.
- Solo mostrar los campos con datos (no filas vacías de `""`).
- Features (confort/seguridad): lista con check ✓, agrupada; solo las que están en `true` en `carInfo`.

### 4.3 CTA de WhatsApp por auto

- Botón verde fijo en la columna derecha (desktop) y pegado abajo en un sticky bar (mobile), con texto "Consultar por este auto".
- **Mensaje prellenado**: `https://wa.me/549XXXXXXXXX?text=Hola! Me interesa el Toyota Corolla XEi 2020 que vi en la web. ¿Sigue disponible?` — plantilla: saludo + marca/modelo/año + pregunta de disponibilidad. URL-encoded.
- Si el auto está `VENDIDO`, el botón cambia a neutro "Ya vendido — consultá por otros" (link a `/autos`).
- Debajo, link secundario a Instagram.

### 4.4 Estados de la ficha

- `RESERVADO`: banner ámbar bajo el título "Este auto está reservado" + botón WhatsApp normal (sirve para consultar por similares).
- `VENDIDO`: banner gris "Este auto ya está vendido", sin CTA de WhatsApp directo, link "Ver autos disponibles".
- **No publicado**: la ficha solo es accesible desde el panel (comportamiento existente, se mantiene).

## 5. Breadcrumbs

- Ruta simple de un nivel: `Inicio / Autos / Toyota Corolla XEi` en la ficha.
- En el listado: `Inicio / Autos`.
- Estilo: 13px, gris, separador `/`, último ítem en color de texto principal sin link. No es necesario `nav[aria-label]` con schema (eso es SEO, fuera de alcance), solo el patrón visual.

## 6. Indicador de estado (vendido / reservado)

- Fuente única de verdad: estado del auto. Hoy el esquema no tiene campo de estado (`published` solo controla visibilidad). **Requisito de datos**: agregar un campo `status` (`available | reserved | sold`) al esquema — coordinar con la tarea db-migration/drizzle antes de implementar UI. Mientras no exista, la UI se diseña igual y el estado default es `available`.
- Reglas de visualización:
  - `available`: sin badge adicional.
  - `reserved`: badge ámbar `RESERVADO` en tarjeta y ficha + banner.
  - `sold`: badge gris `VENDIDO`, tarjeta atenuada, ficha con banner; sigue visible en el listado (genera confianza mostrar historial) pero se ordena al final.

## 7. Empty states

### 7.1 Sin resultados de búsqueda
```text
        🔍  (icono grande gris)
   No encontramos autos con esos filtros.
   Probá con otra búsqueda o mirá todo el stock.
   [Ver todos los autos]
```

### 7.2 Sin fotos en un auto
Placeholder gris dentro del ratio 16:10 con icono de cámara y "Sin fotos disponibles".

### 7.3 Sin destacados
La sección home no se renderiza; ver §1.2.

## 8. Botón flotante de WhatsApp

- FAB circular verde (56px), icono de WhatsApp, fijo abajo a la derecha, con sombra sutil.
- Aparece en todas las páginas públicas **excepto** en la ficha de un auto disponible (ahí ya existe el CTA dedicado, y el FAB lo taparía en mobile).
- Link directo al número principal con mensaje genérico prellenado: "Hola! Vi la web de Automóviles Atuel, quería hacer una consulta."
- En mobile no tapa contenido: dejar padding-bottom de ~72px en el footer.

## 9. Mobile

- Navbar colapsable (hamburguesa) con menú simple; CTA de WhatsApp dentro del menú y además FAB.
- Fichas y tarjetas: todo apilado en una columna, foto principal a full-width.
- Touch: targets mínimos 44px, lightbox con swipe, sticky bar de contacto en ficha.
- Probar en 375px de ancho como mínimo.

## 10. Orden de trabajo sugerido

1. Tarjeta de auto + estados (necesita `status`, ver §6).
2. Home (hero + destacados + contacto).
3. Listado con filtros y estados de carga/empty.
4. Ficha: layout + ficha técnica + CTA WhatsApp.
5. Galería con lightbox (lo más autocontenido).
6. Breadcrumbs, FAB, mobile fine-tuning.