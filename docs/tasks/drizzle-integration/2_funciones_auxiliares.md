# DRIZZLE-2 — Funciones auxiliares de acceso a datos

> Objetivo: complementar la integración de Drizzle con helpers que mantengan el código de páginas/endpoints limpio, sin que toquen Turso ni Drizzle. Sin sobrediseño.

## Idea central

Las páginas y endpoints ya no ejecutan consultas: **llaman a funciones de dominio que devuelven (o aceptan) objetos de dominio**. Drizzle y Turso quedan encapsulados en `src/db/`.

```text
páginas / endpoints  ──llaman──▶  funciones de dominio (src/db/*.ts)  ──usan──▶  Drizzle (client.ts + schema.ts)  ──▶  Turso
```

## 1. Consolidar el acceso compuesto: `get_all_by_car_id`

Ya existe en `cars.ts`, pero mezcla consultas en secuencia. Se formaliza como la función que usan las páginas de detalle/edición:

```ts
// src/db/cars.ts
import { eq } from "drizzle-orm";
import { db } from "./client";
import { cars, carInfo, carPhotos } from "./schema";

export interface FullCar {
    car: ICar;
    info: ICarInfo | null;    // null en vez de shift()! que puede explotar
    photos: ICarPhoto[];
}

export const get_full_car_by_id = async (id: string): Promise<FullCar | null> => {
    const car = await get_car_by_id(id);
    if (!car) return null;

    const [info] = await db.select().from(carInfo).where(eq(carInfo.carId, id)).limit(1);
    const photos = await db.select().from(carPhotos).where(eq(carPhotos.carId, id));

    return { car, info: info ?? null, photos };
};
```

Mejora sobre el actual: `info` puede ser `null` explícitamente en lugar de `(await ...).shift()!`.

## 2. Helper para la foto principal

Reemplaza `first_photo_by_car_id` (que hoy hace `LIMIT 1` sin ordenar y puede no devolver la principal):

```ts
export const get_main_photo_by_car_id = async (car_id: string): Promise<ICarPhoto | null> => {
    const rows = await db
        .select()
        .from(carPhotos)
        .where(eq(carPhotos.carId, car_id))
        .orderBy(desc(carPhotos.isMain), carPhotos.id)  // principal primero, luego por inserción
        .limit(1);
    return rows[0] ?? null;
};
```

## 3. Helper de listado para el panel de admin

El panel necesita todos los autos con su foto principal para armar las tarjetas:

```ts
export interface CarListItem {
    car: ICar;
    mainPhotoUrl: string | null;
}

export const list_cars_with_main_photo = async (publishedOnly: boolean): Promise<CarListItem[]> => {
    const allCars = publishedOnly
        ? await db.select().from(cars).where(eq(cars.published, true))
        : await db.select().from(cars);

    return Promise.all(allCars.map(async (car) => ({
        car,
        mainPhotoUrl: (await get_main_photo_by_car_id(car.id))?.photo_url ?? null,
    })));
};
```

Con esto, `index.astro`, `autos/index.astro` y `panel.astro` quedan como una sola línea cada uno.

## 4. Helper de escritura para las fotos

La regla de negocio "solo una foto principal" vive en el dominio, no en el endpoint:

```ts
export const set_main_photo = async (photoId: number, carId: string): Promise<void> => {
    await db.transaction(async (tx) => {
        await tx.update(carPhotos).set({ isMain: false }).where(eq(carPhotos.carId, carId));
        await tx.update(carPhotos).set({ isMain: true }).where(eq(carPhotos.id, photoId));
    });
};
```

## 5. Helper de admin con bcrypt oculto

`login.ts` hoy mezcla hash de contraseñas con lógica de sesión. El dominio expone una función simple:

```ts
// src/db/admins.ts
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { admins } from "./schema";

export const verify_admin = async (name: string, password: string): Promise<Credentials | null> => {
    const [admin] = await db.select().from(admins).where(eq(admins.name, name)).limit(1);
    if (!admin) return null;
    const ok = await bcrypt.compare(password, admin.password);
    return ok ? { id: admin.id, name: admin.name } : null;
};
```

`api/login.ts` queda reducido a: llamar `verify_admin`, firmar el JWT, setear la cookie.

## 6. Mapeo de usos actuales → funciones nuevas

| Uso actual | Reemplazo |
|---|---|
| `get_cars(filter_string)` en `index.astro` | `get_published_cars()` o `search_published_cars(q, used)` |
| `get_cars()` en `panel.astro` | `list_cars_with_main_photo(false)` |
| `get_published_cars(filter)` en `autos/index.astro` | `search_published_cars(q, used)` |
| `get_all_by_car_id` en `autos/[id].astro` y `edit.astro` | `get_full_car_by_id(id)` |
| `first_photo_by_car_id` en tarjetas | `get_main_photo_by_car_id(car_id)` |
| `delete_car_by_id` (transacción manual de 3 deletes) | `delete_car_by_id(id)` (1 delete, cascade) |
| `getAdmins()` + bcrypt en `api/login.ts` | `verify_admin(name, password)` |

## 7. Qué NO hacer (para no sobrediseñar)

- ❌ Clases abstractas de repositorio, interfaces genéricas, factories.
- ❌ Un `service layer` extra entre endpoints y `src/db/`.
- ❌ Data Transfer Objects (DTOs) separados de los modelos.
- ❌ Caché, adaptadores de múltiples proveedores, eventos de dominio.

El proyecto es pequeño: `src/db/` como módulo de dominio con Drizzle encapsulado adentro es suficiente separación.

## 8. Verificación final

- Ningún archivo fuera de `src/db/` importa `@db/client`, `@libsql/client`, `drizzle-orm` o `./schema`. Control rápido:

```bash
rg -l "drizzle-orm|@libsql/client" src/ --glob '!src/db/**'   # no debe devolver nada
rg -l "executeQuery" src/ --glob '!src/db/**'                 # no debe devolver nada
```

- Todas las páginas compilan con `astro check` y el flujo completo (listar → ver → editar → borrar) funciona.