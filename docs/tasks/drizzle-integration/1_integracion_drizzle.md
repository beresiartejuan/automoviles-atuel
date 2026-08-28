# DRIZZLE-1 — Integración de Drizzle ORM al proyecto

> Objetivo: reemplazar las consultas SQL a mano por Drizzle ORM sobre Turso, manteniendo la arquitectura simple (el proyecto es pequeño: nada de repositorios genéricos ni inyección de dependencias).

## Alcance

- Drizzle como único punto de acceso a la base de datos.
- Las funciones de `src/db/` se conservan **con la misma firma**, pero internamente usan Drizzle.
- Las páginas y endpoints nunca importan Turso ni Drizzle directamente: solo las funciones de dominio.

## 1. Instalación

```bash
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit
```

> Nota: mantener `@libsql/client` como driver (es lo que Drizzle usa para Turso). Migrar al SDK nuevo de Turso es una tarea aparte.

## 2. Estructura de carpetas

```text
src/
├── db/
│   ├── client.ts        # Instancia de Drizzle (única conexión, infraestructura)
│   ├── schema.ts        # Definición de tablas con Drizzle (infraestructura)
│   ├── cars.ts          # Funciones de dominio de autos (USA drizzle, pero expone objetos de dominio)
│   ├── admins.ts        # Funciones de dominio de admins
│   └── models.ts        # Tipos de dominio (sin cambios)
```

La separación propuesta es mínima:

- **Infraestructura** = `client.ts` + `schema.ts` (sabemos qué es Turso y Drizzle).
- **Dominio** = `cars.ts`, `admins.ts`, `models.ts` (saben qué es un auto; si mañana cambiara de ORM, solo se reescriben estos dos archivos).

## 3. Cliente (`src/db/client.ts`)

```ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const client = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);
```

## 4. Esquema (`src/db/schema.ts`)

Definición de las tablas del esquema v2 (ver `docs/tasks/db-migration/1_mejorar_esquema.md`):

```ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const admins = sqliteTable("admins", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    password: text("password").notNull(),
});

export const cars = sqliteTable("cars", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    model: text("model").notNull(),
    description: text("description").notNull().default(""),
    year: integer("year").notNull(),
    isUsed: integer("is_used", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
});

export const carPhotos = sqliteTable("car_photos", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    carId: text("car_id").notNull().references(() => cars.id, { onDelete: "cascade" }),
    photoUrl: text("photo_url").notNull(),
    isMain: integer("is_main", { mode: "boolean" }).notNull().default(false),
});

export const carInfo = sqliteTable("car_info", {
    carId: text("car_id").primaryKey().references(() => cars.id, { onDelete: "cascade" }),
    mileage: text("mileage").notNull().default(""),
    traction: text("traction").notNull().default(""),
    fuelType: text("fuel_type").notNull().default(""),
    transmissionType: text("transmission_type").notNull().default(""),
    fuelTankCapacityLiters: integer("fuel_tank_capacity_liters"),
    engineType: text("engine_type").notNull().default(""),
    parkingAssist: integer("parking_assist", { mode: "boolean" }).notNull().default(false),
    pushButtonStart: integer("push_button_start", { mode: "boolean" }).notNull().default(false),
    remoteLocking: integer("remote_locking", { mode: "boolean" }).notNull().default(false),
    connectivity: integer("connectivity", { mode: "boolean" }).notNull().default(false),
    satelliteNavigation: integer("satellite_navigation", { mode: "boolean" }).notNull().default(false),
    screens: integer("screens", { mode: "boolean" }).notNull().default(false),
    panoramicRoof: integer("panoramic_roof", { mode: "boolean" }).notNull().default(false),
    airConditioning: integer("air_conditioning", { mode: "boolean" }).notNull().default(false),
    fogLights: integer("fog_lights", { mode: "boolean" }).notNull().default(false),
    bluetooth: integer("bluetooth", { mode: "boolean" }).notNull().default(false),
});
```

## 5. drizzle-kit (migraciones)

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "turso",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    },
});
```

Comandos:

```bash
npx drizzle-kit generate   # genera migraciones SQL en ./drizzle
npx drizzle-kit push       # aplica los cambios a la DB (ideal para el tamaño del proyecto)
```

Para este proyecto alcanza con `push`; no hace falta un sistema de migraciones versionadas en producción.

## 6. Reescritura de las funciones de dominio

Ejemplo con `src/db/cars.ts` — la firma pública **no cambia**, solo el interior:

```ts
import { db } from "./client";
import { cars, carInfo, carPhotos } from "./schema";
import { eq, and, desc } from "drizzle-orm";
import type { ICar } from "./models";

// Antes: executeQuery(`SELECT * FROM cars WHERE ${filter}`)  ← interpolación insegura
export const get_cars = async (): Promise<ICar[]> =>
    db.select().from(cars).all();

export const get_published_cars = async (): Promise<ICar[]> =>
    db.select().from(cars).where(eq(cars.published, true)).all();

// Filtros tipados en vez de strings armados en la página
export const search_published_cars = async (q: string, used: boolean | null): Promise<ICar[]> => {
    const conditions = [eq(cars.published, true)];
    if (q) conditions.push(eq(cars.name, q));
    if (used !== null) conditions.push(eq(cars.isUsed, used));
    return db.select().from(cars).where(and(...conditions)).all();
};

export const get_car_by_id = async (id: string): Promise<ICar | null> => {
    const rows = await db.select().from(cars).where(eq(cars.id, id)).limit(1);
    return rows[0] ?? null;
};

// Borrado: una sola sentencia gracias al ON DELETE CASCADE del esquema v2
export const delete_car_by_id = async (id: string): Promise<boolean> => {
    try {
        await db.delete(cars).where(eq(cars.id, id));
        return true;
    } catch (error) {
        console.error("Error al eliminar el auto:", error);
        return false;
    }
};
```

El resto de funciones (`insert_car`, `insert_car_info`, `get_photos_by_car_id`, etc.) se traducen igual: `db.insert(...)`, `db.select()...`.

## 7. Reglas para mantener la separación de capas

1. **`import { db } from "@db/client"`** solo se permite dentro de `src/db/`. Ni páginas ni endpoints importan el cliente.
2. **`schema.ts` no se importa fuera de `src/db/`**: las páginas reciben objetos `ICar`, `ICarPhoto`, `ICarInfo` (tipos de dominio de `models.ts`).
3. **Los filtros pasan a ser parámetros tipados** (`search_published_cars(q, used)`) en lugar de strings SQL armados en las páginas. Esto elimina la interpolación insegura actual.
4. Si algún día se cambia de ORM o de proveedor de DB, solo se reescriben `client.ts`, `schema.ts` y el interior de `cars.ts`/`admins.ts`. Páginas y endpoints no se tocan.

## 8. Orden de trabajo sugerido

1. Instalar dependencias y crear `client.ts` + `schema.ts` + `drizzle.config.ts`.
2. Reescribir `cars.ts` y `admins.ts` con Drizzle (misma firma pública).
3. Ajustar las páginas que armaban strings de filtro para usar las nuevas funciones con parámetros.
4. Correr `npx drizzle-kit push` contra la DB (v2 de la tarea de migración).
5. Probar: listado, ficha, login, creación/edición/borrado desde el panel.