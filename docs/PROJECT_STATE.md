# Automóviles Atuel — Estado actual del proyecto

Fecha de revisión: 28/08/2026

## Visión general

Catálogo web con panel administrativo para la agencia de autos **Automóviles Atuel**. Sitio construido con Astro en modo SSR, desplegado en Vercel, con base de datos Turso y fotos alojadas en ImgBB.

El proyecto está **funcional en su núcleo** (catálogo público + login + edición de autos), pero tiene **deuda técnica y funcionalidades incompletas**.

## Funcionalidades implementadas

### Sitio público

- ✅ Página principal (`index.astro`) con listado de autos publicados.
- ✅ Listado de autos con buscador por nombre y filtro 0km/usados (`autos/index.astro`).
- ✅ Ficha de detalle por auto (`autos/[id].astro`): fotos, info general, ficha técnica.
- ✅ Footer con contacto: Instagram, WhatsApp (2 números), mapa de Google Maps.
- ✅ SEO básico: Open Graph, Twitter Cards, canonical URL (`components/Head.astro`).

### Administración

- ✅ Login con bcrypt + JWT en cookie `httpOnly` (`api/login.ts`).
- ✅ Middleware que valida el token y expone `Astro.locals.user`.
- ✅ Logout (`api/logout.ts`).
- ✅ Panel de administración (`panel.astro`) con listado completo de autos.
- ✅ Edición de auto (`autos/edit.astro`): info general, ficha técnica y fotos.
- ✅ Endpoints de actualización: `api/cars/update`, `api/info/update`, `api/photos/update` (subida a ImgBB).
- ✅ Borrado de autos con transacción manual (fotos → info → auto).
- ✅ Generación de código QR de la ficha del auto (qr-code-styling).

## Funcionalidades faltantes / incompletas

- ❌ **Endpoint `/api/autos/nuevo` no existe**: `panel.astro` lo llama para crear autos, pero no hay archivo de ruta que lo implemente.
- ❌ **Validación de entrada sin usar**: `valibot` está en dependencias pero ningún endpoint valida esquemas.
- ❌ **Sin autenticación real en algunos endpoints**: los endpoints de update solo chequean `cookies.has("authenticated")` sin verificar la firma del JWT.
- ❌ **Páginas de error no personalizadas** (404/500).
- ❌ **`src/styles/main.scss` vacío**: los estilos globales no están definidos.
- ❌ **Sin tests** ni configuración de linting/formateo.
- ❌ **Sin `node_modules` instalado** en el entorno actual (falta `npm install`).

## Deuda técnica y problemas detectados

- ⚠️ **Inyección SQL potencial**: `get_cars(filter)` interpola el string `filter` directo en la consulta (`WHERE ${filter}`), aunque los valores van parametrizados.
- ⚠️ **Bug en `insert_car`**: el `INSERT INTO cars` declara 9 columnas pero tiene 10 placeholders `?`.
- ⚠️ **Inconsistencia de tipado**: `ICarInfo.car_id` es `number` en el modelo, pero el código lo usa como `string` (UUID).
- ⚠️ **`first_photo_by_car_id`** usa `LIMIT 1` sin ordenar por `is_main`, por lo que puede no devolver la foto principal.
- ⚠️ **`jsonwebtoken` + `bcrypt`**: librerías Node puro que pueden dar problemas en el runtime serverless de Vercel; se recomienda migrar a `jose` y `bcryptjs`.
- ⚠️ **SDK de DB desactualizado**: usa `@libsql/client` (legacy) en lugar del SDK actual de Turso.
- ⚠️ **Fuentes de Google cargadas por CDN** en lugar de autoalojarse con `@fontsource`.
- ⚠️ **Sin claves foráneas declaradas**: la integridad referencial se maneja manualmente desde la aplicación.

## Estado del repositorio

- Rama: `main`, sincronizada con `origin/main`.
- Últimos commits: `14c03a5 a`, `b510d6c chore: update package dependencies...`, `8e67542 Add logout`.
- Sin `CHANGELOG`, sin CI/CD configurado, sin issues/labels documentados.
- Documentación recién creada en `docs/` (aún sin commitear).

## Próximos pasos sugeridos

1. Implementar el endpoint `/api/autos/nuevo` (crear autos desde el panel).
2. Instalar dependencias (`npm install`) y verificar que el build pase.
3. Corregir el bug de placeholders en `insert_car`.
4. Verificar el JWT en los endpoints de actualización (no solo la existencia de la cookie).
5. Agregar validación con valibot en todos los endpoints.
6. Migrar a `jose` + SDK actual de Turso.
7. Personalizar páginas de error y completar `main.scss`.