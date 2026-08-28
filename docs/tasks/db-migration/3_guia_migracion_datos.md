# DB-3 — Guía de migración de datos (DB vieja → DB nueva)

> Objetivo: pasar los datos del esquema actual al esquema v2 sin perder autos, fotos ni fichas técnicas, y sin que el sitio deje de funcionar más de lo necesario.

## Estrategia

Migración **offline por copia**: se exporta la DB vieja completa, se transforma al nuevo esquema en un script local, y se importa a la DB nueva. El sitio sigue apuntando a la DB vieja hasta el final, cuando se cambia la URL en las variables de entorno.

Es la opción más simple y segura para el tamaño del proyecto: no requiere migración en caliente ni doble escritura.

## Paso 0: verificaciones previas

```bash
# Confirmar que la DB vieja responde
turso db shell automoviles-atuel "SELECT COUNT(*) FROM cars;"

# Anotar el tamaño de los datos (para verificar después)
turso db shell automoviles-atuel "
    SELECT
        (SELECT COUNT(*) FROM cars)       AS autos,
        (SELECT COUNT(*) FROM car_photos) AS fotos,
        (SELECT COUNT(*) FROM car_info)   AS fichas,
        (SELECT COUNT(*) FROM admins)     AS admins;"
```

Guardá esos 4 números: son el chequeo final de la migración.

## Paso 1: crear la DB nueva

Seguir `2_script_creacion_turso.md` (crea la base y el admin). No tocar todavía la configuración del sitio.

## Paso 2: exportar la DB vieja a un archivo SQLite local

```bash
# Dump completo de la DB vieja a un archivo local
turso db shell automoviles-atuel .dump > dump-vieja.sql

# Crear una copia local desde el dump
sqlite3 vieja.db < dump-vieja.sql
```

## Paso 3: script de transformación e importación

Un script Node que lee la DB vieja, transforma los datos al esquema nuevo y escribe en la DB nueva de Turso:

```ts
// scripts/migrate.ts
// Uso: VIEJA_DB=file:./vieja.db NUEVA_URL=... NUEVA_TOKEN=... npx tsx scripts/migrate.ts
import { createClient, type InValue } from "@libsql/client";

const vieja = createClient({ url: process.env.VIEJA_DB! });              // archivo local
const nueva = createClient({
    url: process.env.NUEVA_URL!,
    authToken: process.env.NUEVA_TOKEN!,
});

async function main() {
    // 1. Admins (el admin ya se creó en el paso 1; solo copiar si hace falta otro)
    const admins = await vieja.execute("SELECT * FROM admins");
    for (const a of admins.rows) {
        await nueva.execute({
            sql: "INSERT INTO admins (name, password) VALUES (?, ?) ON CONFLICT(name) DO NOTHING",
            args: [a.name as InValue, a.password as InValue],
        });
    }

    // 2. Autos (mapeo de columnas: create_at→created_at, update_at→updated_at)
    const cars = await vieja.execute("SELECT * FROM cars");
    for (const c of cars.rows) {
        await nueva.execute({
            sql: `INSERT INTO cars (id, name, model, description, year, is_used, published, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [c.id, c.name, c.model, c.description ?? "", c.year,
                   c.is_used ?? 0, c.published ?? 0, c.create_at, c.update_at],
        });
    }

    // 3. Fotos
    const photos = await vieja.execute("SELECT * FROM car_photos");
    for (const p of photos.rows) {
        await nueva.execute({
            sql: "INSERT INTO car_photos (car_id, photo_url, is_main) VALUES (?, ?, ?)",
            args: [p.car_id, p.photo_url, p.is_main ?? 0],
        });
    }

    // 4. Ficha técnica (INSERT OR REPLACE: garantiza 1 fila por auto)
    const infos = await vieja.execute("SELECT * FROM car_info");
    for (const i of infos.rows) {
        await nueva.execute({
            sql: `INSERT INTO car_info (car_id, mileage, traction, fuel_type, transmission_type,
                    fuel_tank_capacity_liters, engine_type, parking_assist, push_button_start,
                    remote_locking, connectivity, satellite_navigation, screens, panoramic_roof,
                    air_conditioning, fog_lights, bluetooth)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(car_id) DO NOTHING`,
            args: [i.car_id, i.mileage ?? "", i.traction ?? "", i.fuel_type ?? "",
                   i.transmission_type ?? "", i.fuel_tank_capacity_liters, i.engine_type ?? "",
                   i.parking_assist ?? 0, i.push_button_start ?? 0, i.remote_locking ?? 0,
                   i.connectivity ?? 0, i.satellite_navigation ?? 0, i.screens ?? 0,
                   i.panoramic_roof ?? 0, i.air_conditioning ?? 0, i.fog_lights ?? 0,
                   i.bluetooth ?? 0],
        });
    }

    console.log("✅ Migración completada");
}

main();
```

> El script usa `INSERT OR IGNORE`-style (`ON CONFLICT DO NOTHING/NOTHING`) para poder re-ejecutarlo sin duplicar datos.

## Paso 4: verificar conteos

```bash
turso db shell automoviles-atuel-v2 "
    SELECT
        (SELECT COUNT(*) FROM cars)       AS autos,
        (SELECT COUNT(*) FROM car_photos) AS fotos,
        (SELECT COUNT(*) FROM car_info)   AS fichas,
        (SELECT COUNT(*) FROM admins)     AS admins;"
```

Los números deben coincidir con los anotados en el paso 0. También verificar algunos autos al azar:

```bash
# Comparar un auto específico entre ambas bases
turso db shell automoviles-atuel    "SELECT * FROM cars WHERE id = '<uuid>';"
turso db shell automoviles-atuel-v2 "SELECT * FROM cars WHERE id = '<uuid>';"
```

## Paso 5: probar el sitio contra la DB nueva (staging)

1. En local, apuntar el `.env` a la DB nueva (`TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` de la v2).
2. Levantar `npm run dev` y verificar:
   - El listado público muestra los autos.
   - La ficha de un auto muestra fotos y ficha técnica.
   - El login funciona con el admin migrado.
   - Crear/editar un auto funciona (¡importante probar el borrado, usa el nuevo `ON DELETE CASCADE`!).

## Paso 6: corte final

1. Hacer un último dump de la DB vieja y correr el script de migración una vez más (es idempotente, solo agrega lo nuevo).
2. Actualizar las variables de entorno en Vercel con las de la DB v2.
3. Hacer un redeploy de Vercel.
4. Verificar el sitio en producción.

## Paso 7: conservar la DB vieja

- **No borrar** `automoviles-atuel` todavía. Renombrala o dejala como respaldo unas semanas.
- Cuando estés seguro de que todo funciona, archivala:

```bash
# Turso cobra por DBs activas; podés pausarla o destruirla más adelante
turso db destroy automoviles-atuel   # solo cuando estés 100% seguro
```

## Plan de rollback

Si algo sale mal después del corte: restaurar las variables de entorno con los valores de la DB vieja en Vercel y redepolar. Como la DB vieja no se tocó, el sitio vuelve a funcionar al instante.

## Resumen

| Paso | Acción | Riesgo |
|---|---|---|
| 0 | Verificar y anotar conteos | Ninguno |
| 1 | Crear DB v2 + admin | Ninguno |
| 2 | Dump de la vieja a SQLite local | Ninguno |
| 3 | Transformar e importar (idempotente) | Bajo |
| 4 | Verificar conteos | Ninguno |
| 5 | Probar el sitio en local contra la v2 | Ninguno |
| 6 | Cambiar env en Vercel + redeploy | Corto de despliegue |
| 7 | Archivar DB vieja | Ninguno (solo al final) |