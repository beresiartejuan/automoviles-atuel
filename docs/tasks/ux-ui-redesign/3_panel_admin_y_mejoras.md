# UXUI-3 — UX del panel admin y mejoras transversales

> Objetivo: especificar las mejoras de experiencia del panel (`/panel`, `/autos/edit`) y un conjunto de mejoras menores del sitio (breadcrumbs, FAB, empty states ya referenciados en UXUI-2). El panel hoy "funciona pero es básico": el usuario admin no recibe feedback de lo que hace y eso genera errores (guardar dos veces, borrar sin querer, no saber si falló).
>
> Aplica la dirección visual de UXUI-1 (mismos tokens, densidad más compacta). Fuera de alcance: implementación Tailwind, arquitectura de componentes, seguridad/auth, cambios de datos más allá de lo indicado.

## 1. Principios del panel

- **Siempre hay feedback**: toda acción (guardar, borrar, publicar) tiene una respuesta visible, exitosa o no.
- **Prevenir antes que corregir**: confirmaciones en acciones destructivas, validación antes de enviar, botón bloqueado mientras se envía.
- **Herramienta, no vitrina**: menos decoración, más densidad; igual consistencia visual que el sitio público.

## 2. Formularios: feedback de guardado y validación

### 2.1 Estados del botón de guardar

El botón principal del formulario (`/autos/edit`, alta de auto) maneja tres estados:

| Estado | Apariencia | Comportamiento |
|---|---|---|
| Idle | "Guardar" | Habilitado |
| Enviando | "Guardando…" + spinner | **Deshabilitado**, sin doble submit |
| Error | "Reintentar" | Habilitado, conserva los datos cargados |

- Al terminar con éxito: toast de éxito (§5) + redirección al listado del panel (o permanecer con toast, decidir por página).
- Al fallar: toast de error + **los datos del formulario se conservan** (hoy un fallo puede perder lo escrito). Nunca limpiar el form en error.

### 2.2 Validación visible

- Validación en cliente **antes** de enviar: campos requeridos (nombre, modelo, año, precio), año numérico razonable (1950–año+1), URL de fotos válidas.
- Errores por campo: borde rojo + mensaje de 13px debajo ("El año es obligatorio"). Aparecen al enviar o al salir del campo (blur), no al escribir.
- Al enviar con errores: scroll al primer campo con error + toast "Revisá los campos marcados".
- Validación de servidor (si falla algo al guardar): mapear a mensajes por campo cuando sea posible, si no, toast genérico con el motivo.

### 2.3 Campos del formulario

- Agrupación en secciones con título: "Datos del auto", "Ficha técnica", "Fotos", "Publicación". Reduce la carga cognitiva del form largo actual.
- Checkboxes de features (`parkingAssist`, etc.): grid de 2 columnas con label clicable completo (no solo el checkbox).
- Autosave no; pero indicar campos modificados sin guardar si el usuario navega away (confirmación "¿Salir sin guardar?" — simple `beforeunload` o confirm custom).

## 3. Gestión de fotos

- Grid de miniaturas con botón de eliminar (X) por foto y una acción "Establecer como principal" (estrella o botón) — la foto principal ya existe en el modelo (`isMain`).
- Confirmación inline al eliminar una foto ("¿Eliminar esta foto? [Eliminar] [Cancelar]" — inline o toast con acción, no modal pesado).
- Al subir: estado de carga por foto (spinner sobre la miniatura), feedback si falla una.
- Vista previa inmediata de la foto agregada antes de guardar.

## 4. Borrado con confirmación

Problema actual: borrar un auto es irreversible (cascade a fotos y ficha técnica) y no hay confirmación.

- Al presionar "Eliminar": **modal de confirmación**:
  - Título: "¿Eliminar este auto?"
  - Cuerpo: "Se eliminarán también sus N fotos y la ficha técnica. Esta acción no se puede deshacer."
  - Botones: "Cancelar" (secundario) / "Eliminar" (peligro, rojo).
- Confirmación con el nombre del auto en el cuerpo ("¿Eliminar Toyota Corolla XEi 2020?") para evitar borrar el equivocado.
- Tras borrar: toast "Auto eliminado" + el item desaparece del listado (optimista o tras respuesta).
- El mismo patrón aplica a eliminar fotos (versión inline, §3).

## 5. Toasts (patrón transversal)

Definido visualmente en UXUI-1 §5.4. Reglas de uso en el panel:

- **Éxito**: "Cambios guardados", "Auto eliminado", "Foto agregada".
- **Error**: "No se pudieron guardar los cambios" (+ detalle si lo hay). En error, el mensaje persiste hasta cerrar (no autodesaparece) para poder leerlo.
- Solo un toast visible a la vez (el nuevo reemplaza al anterior).
- Accesible: `role="status"` / `aria-live="polite"`.

## 6. Estados de carga

- **Listado del panel**: skeleton de filas mientras carga (o spinner simple; el listado es chico).
- **Botones**: cualquier acción de red deshabilita el botón y muestra spinner inline (§2.1).
- Navegación: el layout del panel muestra un indicador de página cargando (barra fina superior) si las transiciones demoran — opcional, evaluar costo.

## 7. Responsive del panel

Hoy el panel se usa mayormente desde el celular (dueño gestionando el stock). Requisitos:

- **Mobile-first en la práctica**: formularios en una columna, inputs a full-width, botones de acción grandes (mínimo 44px de alto).
- Tabla/listado de autos: en mobile convertir filas en tarjetas apiladas (nombre, año, estado, acciones) en vez de tabla horizontal con scroll.
- Acciones por auto (editar/eliminar): iconos con tooltip en desktop, menú "⋯" en mobile.
- El panel mantiene el mismo navbar simplificado con link "Ver sitio" para ir al público.

## 8. Login del panel

- Mensaje de error visible y genérico ("Usuario o contraseña incorrectos") en rojo bajo el formulario — hoy probablemente no haya feedback.
- Estado de carga en el botón "Ingresar".
- No agregar funcionalidad de seguridad (eso no es esta tarea).

## 9. Mejoras transversales (sitio público)

Resumen ejecutivo de lo especificado en detalle en UXUI-2:

- **Breadcrumbs** (§5 de UXUI-2): `Inicio / Autos / [Auto]` en ficha y listado.
- **FAB de WhatsApp** (§8 de UXUI-2): flotante en todo el sitio público salvo ficha con CTA dedicado.
- **Empty states** (§7 de UXUI-2): sin resultados de búsqueda, sin fotos, sin destacados.
- **Estados vendido/reservado** (§6 de UXUI-2): requiere campo `status` en la DB — coordinar con db-migration/drizzle.

## 10. Criterios de aceptación

- Ninguna acción del panel queda sin feedback visible (éxito o error).
- No es posible borrar un auto sin confirmación explícita.
- Un fallo de red al guardar no pierde los datos del formulario.
- El panel es usable a 375px de ancho sin scroll horizontal.
- Los formularios muestran errores por campo antes de llegar al servidor.
- El sitio público muestra estados vacíos coherentes en búsqueda sin resultados y autos sin fotos.

## 11. Orden de trabajo sugerido

1. Toast component + estados del botón guardar (base para todo lo demás).
2. Validación visible en formularios.
3. Confirmación de borrado (modal) + gestión de fotos con estados.
4. Responsive del panel + login.
5. Transversales del sitio (si no se hicieron en UXUI-2).