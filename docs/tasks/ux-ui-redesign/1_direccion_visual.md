# UXUI-1 — Dirección visual y sistema de diseño

> Objetivo: definir la identidad visual de "Automóviles Atuel" (paleta, tipografía, tono) y los componentes base del sitio, en un lenguaje coherente con una concesionaria regional argentina: confiable, cercana, sin pretensiones de "startup tech".
>
> **Restricción clave**: esta tarea NO implementa CSS ni define tokens técnicos. Los tokens (`@theme`) viven en la tarea TAILWIND-1. Aquí se especifican los **valores y decisiones de diseño** que esa tarea codifica.

## Alcance

- Propuesta de paleta, tipografía y tono de comunicación.
- Definición conceptual de componentes base (botones, badges, inputs, tarjetas) y sus variantes.
- Cómo se mapea al `@theme` de TAILWIND-1 (qué tokens existen y por qué).

Fuera de alcance: implementación con Tailwind (TAILWIND-1/2), arquitectura de componentes (components-architecture), SEO (seo), comportamiento de pantallas específicas (UXUI-2/3).

## 1. Tono y personalidad de marca

- **Cercano y confiable**: el eslogan ya es "Grandes oportunidades, cerca de casa". El diseño debe reforzar trato local, no corporativismo. Lenguaje directo en español rioplatense neutro ("Consultanos por WhatsApp", no "Contáctenos a nuestra brevedad").
- **Pragmático**: el usuario objetivo compara precios y fotos desde el celular. Las decisiones priorizan legibilidad del precio y de las fotos por sobre estética decorativa.
- **Sin exceso**: nada de gradientes brillantes, sombras grandes ni glassmorphism. Superficies planas, bordes suaves, mucho aire.

## 2. Paleta

Base: fondo claro, texto casi negro, un color de acento y un color de acción (WhatsApp).

| Rol | Valor propuesto | Uso |
|---|---|---|
| Fondo | `#fafafa` (blanco cálido) | Páginas |
| Superficie | `#ffffff` | Tarjetas, formularios |
| Texto principal | `#1a1a1a` | Títulos y cuerpo |
| Texto secundario | `#6b7280` (gris) | Metadatos, labels |
| Borde | `#e5e7eb` | Separadores, inputs |
| Acento (marca) | Azul profundo `#1e3a5f` | Navbar, títulos, botones primarios, links |
| Acento suave | `#eef2f7` | Fondos de secciones alternas, badges |
| Éxito / WhatsApp | Verde `#25d366` (texto `#128c4b`) | CTA de contacto, badges "Disponible" |
| Alerta / estado | Ámbar `#d97706` | Badge "Reservado" |
| Neutral estado | Gris | Badge "Vendido" (auto atenuado) |

Notas:

- El azul `#1e3a5f` transmite seriedad automotriz sin ser el azul genérico de links. Reemplaza el `--color-brand-500` de ejemplo de TAILWIND-1.
- El verde WhatsApp se usa **solo** para acciones de contacto: debe destacarse como "la salida" del sitio.
- Modo oscuro: fuera de alcance (coincide con la decisión de TAILWIND-2).

## 3. Tipografía

- Se mantienen **Kanit** (títulos, pesos 600/700) y **Poppins** (cuerpo, pesos 400/500/600), ya autoalojadas vía `@fontsource` en TAILWIND-1.
- Escala sugerida (desktop / mobile): hero 40/28, h2 28/22, h3 20/18, cuerpo 16/16, pequeño 14/14, precio destacado 24/20 en Kanit 700.
- Reglas de uso:
  - Precio **siempre** en Kanit bold, color de texto principal (no color de acento), con formato `$ 12.500.000` (punto como separador de miles, moneda ARS).
  - Nada de texto en mayúsculas salvo badges y etiquetas cortas (tracking amplio).

## 4. Radios, sombras y densidad

- Radios: `8px` para tarjetas e inputs, `999px` para badges y botones pill, `12px` para modales/lightbox.
- Sombras: una sola elevación sutil (`0 1px 3px rgba(0,0,0,.08)`) para tarjetas; nada más.
- Densidad: padding generoso en ficha pública, más compacto en el panel admin (es una herramienta de trabajo).

## 5. Componentes base (especificación, no implementación)

Estos son los patrones que components-architecture extrae y TAILWIND-2 migra:

### 5.1 Botones
- **Primario**: fondo azul marca, texto blanco, radius 8px. Acciones principales ("Ver ficha", "Guardar").
- **Contacto (WhatsApp)**: fondo verde, icono de WhatsApp, texto blanco. Solo para contactar por un auto o en general.
- **Secundario**: borde gris, fondo transparente, texto principal ("Volver", "Cancelar").
- **Peligro**: fondo rojo `#dc2626`, solo dentro del panel ("Eliminar").
- Estados: hover (oscurecer 10%), focus-visible (anillo de 2px azul), disabled (40% opacidad), loading (spinner + texto "Guardando…", bloqueado).

### 5.2 Badges
- Pill pequeño, mayúsculas, 12px: `0KM` (azul suave), `USADO` (gris), `RESERVADO` (ámbar), `VENDIDO` (gris oscuro, la tarjeta entera baja opacidad a ~60%), `DESTACADO` (borde azul).

### 5.3 Inputs y formularios
- Label arriba del input, nunca como placeholder. Placeholder solo como ejemplo.
- Estado de error: borde rojo + mensaje de 13px debajo del campo.
- Mensaje de ayuda gris debajo cuando el campo lo necesite.

### 5.4 Toast (feedback)
- Esquina inferior derecha (mobile: inferior centrado, full-width con margen).
- Variantes: éxito (borde/fondo verde suave), error (rojo), neutro. Desaparece a los 4s, con botón de cerrar.
- Se especifica en detalle en UXUI-3 (uso en el panel).

## 6. Mapeo a tokens de TAILWIND-1

El `@theme` de TAILWIND-1 debe quedar con (nombres de ejemplo, coincidiendo con esa tarea):

- `--color-brand-*`: escala del azul `#1e3a5f` (50 / 500 / 900 aproximaciones).
- `--color-success`, `--color-warning`, `--color-danger`, `--color-whatsapp`.
- `--font-display: Kanit`, `--font-sans: Poppins`.
- `--radius-card: 8px`, `--radius-pill: 999px`.

Si durante la implementación surge un token nuevo, se agrega en `main.scss` y se documenta aquí, nunca un CSS paralelo.

## 7. Mockups descritos

- **Navbar**: fondo blanco, logo a la izquierda, links centro (Inicio, Autos, Nosotros), CTA verde de WhatsApp a la derecha. Mobile: logo + hamburguesa que abre menú full-height con los links y el CTA.
- **Footer**: fondo azul marca muy oscuro (`#0f1f33`), texto claro, tres columnas (contacto, horarios, ubicación con link a Maps). Instagram y WhatsApp con iconos.

## 8. Orden de trabajo sugerido

1. Validar paleta con una captura de la home actual "repintada" (antes de migrar nada).
2. TAILWIND-1 define los tokens con estos valores.
3. Los componentes base se crean en components-architecture usando solo tokens.
4. UXUI-2 y UXUI-3 aplican estos patrones en pantalla.