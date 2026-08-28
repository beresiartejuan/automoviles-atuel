# DB-1 — Mejora del esquema de la base de datos

> Objetivo: rediseñar el esquema actual para que la base de datos garantice integridad, tipado correcto y consistencia, en lugar de delegar eso a la aplicación.

## Problemas del esquema actual

1. **Sin claves foráneas declaradas**: `car_photos.car_id` y `car_info.car_id` no tienen `FOREIGN KEY`, y el borrado en cascada se hace manualmente con transacciones en `delete_car_by_id`.
2. **Tipos incorrectos**:
   - Fechas guardadas como `TEXT` libre (`create_at`, `update_at`).
   - Booleanos como enteros sueltos sin restricción.
   - `ICarInfo.car_id` tipado como `number` en el modelo pero usado como UUID.
3. **Inconsistencias**:
   - No hay `CHECK` ni `NOT NULL` donde corresponde (ej: un auto sin nombre).
   - `car_info` puede tener múltiples filas por auto (no hay `UNIQUE` en `car_id`).
   - Sin índices en las columnas de relación ni en `published` (las consultas del listado filtran por ahí).
4. **Campo `is_main` ambiguo**: puede haber varias fotos marcadas como principales a la vez.

## Esquema propuesto

```sql
-- =========================================================
-- Esquema v2 de Automóviles Atuel
-- =========================================================

PRAGMA foreign_keys = ON;

-- Tabla de administradores
CREATE TABLE admins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL                     -- hash bcrypt
);

-- Catálogo de autos
CREATE TABLE cars (
    id          TEXT    PRIMARY KEY,                 -- UUID v4 generado en la app
    name        TEXT    NOT NULL,
    model       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    year        INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
    is_used     INTEGER NOT NULL DEFAULT 0 CHECK (is_used IN (0, 1)),
    published   INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Índice para el listado público (filtra por published)
CREATE INDEX idx_cars_published ON cars (published);

-- Fotos de cada auto (1 a N)
CREATE TABLE car_photos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id      TEXT    NOT NULL REFERENCES cars (id) ON DELETE CASCADE,
    photo_url   TEXT    NOT NULL,
    is_main     INTEGER NOT NULL DEFAULT 0 CHECK (is_main IN (0, 1))
);

-- Índice para traer todas las fotos de un auto
CREATE INDEX idx_car_photos_car_id ON car_photos (car_id);

-- Ficha técnica (1 a 1 con cars)
CREATE TABLE car_info (
    car_id      TEXT    PRIMARY KEY REFERENCES cars (id) ON DELETE CASCADE,
    mileage     TEXT    NOT NULL DEFAULT '',
    traction    TEXT    NOT NULL DEFAULT '',
    fuel_type   TEXT    NOT NULL DEFAULT '',
    transmission_type TEXT NOT NULL DEFAULT '',
    fuel_tank_capacity_liters INTEGER,
    engine_type TEXT    NOT NULL DEFAULT '',
    parking_assist        INTEGER NOT NULL DEFAULT 0 CHECK (parking_assist IN (0, 1)),
    push_button_start     INTEGER NOT NULL DEFAULT 0 CHECK (push_button_start IN (0, 1)),
    remote_locking        INTEGER NOT NULL DEFAULT 0 CHECK (remote_locking IN (0, 1)),
    connectivity          INTEGER NOT NULL DEFAULT 0 CHECK (connectivity IN (0, 1)),
    satellite_navigation  INTEGER NOT NULL DEFAULT 0 CHECK (satellite_navigation IN (0, 1)),
    screens               INTEGER NOT NULL DEFAULT 0 CHECK (screens IN (0, 1)),
    panoramic_roof        INTEGER NOT NULL DEFAULT 0 CHECK (panoramic_roof IN (0, 1)),
    air_conditioning      INTEGER NOT NULL DEFAULT 0 CHECK (air_conditioning IN (0, 1)),
    fog_lights            INTEGER NOT NULL DEFAULT 0 CHECK (fog_lights IN (0, 1)),
    bluetooth             INTEGER NOT NULL DEFAULT 0 CHECK (bluetooth IN (0, 1))
);
```

## Cambios respecto al esquema actual

| Cambio | Antes | Ahora | Motivo |
|---|---|---|---|
| Claves foráneas | Ninguna | `REFERENCES cars(id) ON DELETE CASCADE` en fotos e info | Integridad garantizada por la DB; se puede borrar el auto en una sola sentencia |
| Ficha técnica 1:1 | `car_info.car_id` sin restricción (puede duplicar) | `car_id` es `PRIMARY KEY` | Garantiza una sola fila de ficha por auto y elimina el `id` autoincremental innecesario |
| Fechas | `TEXT` escrito desde la app | `DEFAULT (datetime('now'))` | La DB genera la fecha, la app no puede olvidarla |
| Columnas renombradas | `create_at`, `update_at` | `created_at`, `updated_at` | Convención estándar (opcional pero recomendable) |
| Booleanos | Enteros sin restricción | `CHECK (x IN (0, 1))` | Evita valores inválidos |
| Validación básica | Nada | `NOT NULL` en campos obligatorios, `CHECK` en año | Datos basura imposibles |
| Índices | Ninguno | `idx_cars_published`, `idx_car_photos_car_id` | Acelera las consultas más frecuentes del sitio |
| Foto principal | `is_main` sin unicidad | Ver más abajo | Ver nota |

### Nota sobre `is_main`

SQLite no permite índices únicos parciales de forma simple en todas las versiones de Turso. La alternativa más simple sin complejidad extra: dejar `is_main` como está y agregar en la aplicación la regla de que al marcar una foto como principal se desmarca la anterior (dos `UPDATE` en una transacción). Es lo suficientemente bueno para el tamaño del proyecto.

## Archivos afectados en el código

- `src/db/models.ts`: actualizar tipos (`car_id: string`, fechas, nombres de columnas).
- `src/db/cars.ts`: usar los nuevos nombres de columnas; simplificar `delete_car_by_id` (un solo `DELETE FROM cars` gracias al `ON DELETE CASCADE`).
- Endpoints que escriben fechas manualmente: ya no hace falta.