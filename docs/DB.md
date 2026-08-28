# Automóviles Atuel — Base de datos

Base de datos **SQL (Turso / libSQL)**. El esquema fue reconstruido a partir del código fuente (`src/db/models.ts`, `src/db/cars.ts`, `src/db/admins.ts`), ya que no se accedió a la base de datos real.

## Diagrama de relaciones

```text
admins          (tabla independiente, sin FK)

cars 1 ──── N car_photos   (cars.id  = car_photos.car_id)
cars 1 ──── 1 car_info     (cars.id  = car_info.car_id)
```

## Tablas

### `admins`

Administradores con acceso al panel. No tiene relación con otras tablas.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER | Identificador (autoincremental) |
| `name` | TEXT | Nombre del administrador (se usa como usuario en el login) |
| `password` | TEXT | Contraseña hasheada con bcrypt |

### `cars`

Catálogo de vehículos. `id` es un UUID generado en la aplicación.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | TEXT (UUID) | Identificador único del auto (clave primaria) |
| `name` | TEXT | Nombre del auto |
| `model` | TEXT | Modelo |
| `description` | TEXT | Descripción del vehículo |
| `year` | INTEGER | Año |
| `is_used` | BOOLEAN | Indica si el auto es usado |
| `published` | BOOLEAN | Indica si el auto está visible en el catálogo público |
| `create_at` | TEXT | Fecha de creación (formato texto) |
| `update_at` | TEXT | Fecha de última actualización (formato texto) |

### `car_photos`

Fotos de cada auto. Relación **1 a N** con `cars`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER | Identificador (autoincremental) |
| `car_id` | TEXT (UUID) | FK → `cars.id` |
| `photo_url` | TEXT | URL de la imagen (alojada en ImgBB) |
| `is_main` | BOOLEAN | Indica si es la foto principal |

> Nota: la consulta `first_photo_by_car_id` usa `LIMIT 1` sin ordenar por `is_main`, por lo que "la primera foto" depende del orden de inserción y no del flag `is_main`.

### `car_info`

Ficha técnica y características de cada auto. Relación **1 a 1** con `cars` (una fila por auto).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER | Identificador (autoincremental) |
| `car_id` | TEXT (UUID) | FK → `cars.id` |
| `mileage` | TEXT | Kilometraje |
| `traction` | TEXT | Tracción |
| `fuel_type` | TEXT | Tipo de combustible |
| `transmission_type` | TEXT | Tipo de transmisión |
| `fuel_tank_capacity_liters` | INTEGER | Capacidad del tanque en litros |
| `engine_type` | TEXT | Tipo de motor |
| `parking_assist` | BOOLEAN | Asistente de estacionamiento |
| `push_button_start` | BOOLEAN | Botón de arranque |
| `remote_locking` | BOOLEAN | Cierre centralizado a distancia |
| `connectivity` | BOOLEAN | Conectividad |
| `satellite_navigation` | BOOLEAN | GPS / navegación satelital |
| `screens` | BOOLEAN | Pantallas |
| `panoramic_roof` | BOOLEAN | Techo panorámico |
| `air_conditioning` | BOOLEAN | Aire acondicionado |
| `fog_lights` | BOOLEAN | Luces antiniebla |
| `bluetooth` | BOOLEAN | Bluetooth |

> Nota: en el modelo de TypeScript (`ICarInfo.car_id`) está tipado como `number`, pero el resto del código lo usa como `string` (UUID), lo que indica una inconsistencia de tipado.

## Relaciones

| Relación | Tipo | Descripción |
|---|---|---|
| `cars` → `car_photos` | 1 a N | Un auto puede tener muchas fotos |
| `cars` → `car_info` | 1 a 1 | Un auto tiene una única ficha técnica |
| `admins` | — | Tabla independiente, sin claves foráneas |

## Integridad referencial

El código gestiona las relaciones manualmente en lugar de confiar en restricciones de la base de datos:

- **Borrado en cascada manual:** `delete_car_by_id` abre una transacción y elimina primero las filas de `car_photos` y `car_info` antes de borrar el auto de `cars`.
- **Sin FKs declaradas:** no hay evidencia en el código de claves foráneas con `ON DELETE CASCADE`; la consistencia depende de la aplicación.