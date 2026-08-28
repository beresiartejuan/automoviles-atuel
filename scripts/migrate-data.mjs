// Uso: DB_URL=... DB_TOKEN=... node scripts/migrate-data.mjs
import { createClient } from "@libsql/client";

const oldDb = createClient({
    url: "libsql://automotores-atuel-beresiartejuan.aws-us-west-2.turso.io",
    authToken: process.env.OLD_DB_TOKEN,
});

const url = process.env.DB_URL;
const token = process.env.DB_TOKEN;

if (!url || !token) {
    console.error("Faltan DB_URL o DB_TOKEN");
    process.exit(1);
}

if (!process.env.OLD_DB_TOKEN) {
    console.error("Falta OLD_DB_TOKEN");
    process.exit(1);
}

const nueva = createClient({ url, authToken: token });

function norm(v, fallback = null) {
    if (v === undefined || v === null) return fallback;
    return v;
}

function int(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

async function main() {
    // 1. Admins (no sobreescribe los ya existentes en la DB nueva)
    const admins = await oldDb.execute("SELECT * FROM admins");
    for (const a of admins.rows) {
        await nueva.execute({
            sql: "INSERT INTO admins (name, password) VALUES (?, ?) ON CONFLICT(name) DO NOTHING",
            args: [norm(a.name), norm(a.password)],
        });
    }
    console.log(`Admins copiados: ${admins.rows.length}`);

    // 2. Autos (create_at -> created_at, update_at -> updated_at)
    const cars = await oldDb.execute("SELECT * FROM cars");
    for (const c of cars.rows) {
        const created = norm(c.create_at) ?? new Date().toISOString();
        const updated = norm(c.update_at) ?? created;
        await nueva.execute({
            sql: `INSERT INTO cars (id, name, model, description, year, is_used, published, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO NOTHING`,
            args: [
                norm(c.id), norm(c.name), norm(c.model, ""), norm(c.description, ""),
                int(c.year), int(c.is_used), int(c.published), created, updated,
            ],
        });
    }
    console.log(`Autos copiados: ${cars.rows.length}`);

    // 3. Fotos (se omiten las huérfanas cuyo auto ya no existe en la DB vieja)
    const photos = await oldDb.execute(
        "SELECT p.* FROM car_photos p LEFT JOIN cars c ON c.id = p.car_id WHERE c.id IS NOT NULL"
    );
    const skipped = (await oldDb.execute("SELECT COUNT(*) AS n FROM car_photos p LEFT JOIN cars c ON c.id = p.car_id WHERE c.id IS NULL")).rows[0].n;
    for (const p of photos.rows) {
        await nueva.execute({
            sql: "INSERT INTO car_photos (car_id, photo_url, is_main) VALUES (?, ?, ?)",
            args: [norm(p.car_id), norm(p.photo_url), int(p.is_main)],
        });
    }
    console.log(`Fotos copiadas: ${photos.rows.length} (huérfanas omitidas: ${skipped})`);

    // 4. Ficha técnica (una fila por auto; si ya existe, se actualiza)
    const infos = await oldDb.execute("SELECT * FROM car_info");
    for (const i of infos.rows) {
        await nueva.execute({
            sql: `INSERT INTO car_info (car_id, mileage, traction, fuel_type, transmission_type,
                    fuel_tank_capacity_liters, engine_type, parking_assist, push_button_start,
                    remote_locking, connectivity, satellite_navigation, screens, panoramic_roof,
                    air_conditioning, fog_lights, bluetooth)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(car_id) DO UPDATE SET
                    mileage = excluded.mileage, traction = excluded.traction,
                    fuel_type = excluded.fuel_type, transmission_type = excluded.transmission_type,
                    fuel_tank_capacity_liters = excluded.fuel_tank_capacity_liters,
                    engine_type = excluded.engine_type, parking_assist = excluded.parking_assist,
                    push_button_start = excluded.push_button_start, remote_locking = excluded.remote_locking,
                    connectivity = excluded.connectivity, satellite_navigation = excluded.satellite_navigation,
                    screens = excluded.screens, panoramic_roof = excluded.panoramic_roof,
                    air_conditioning = excluded.air_conditioning, fog_lights = excluded.fog_lights,
                    bluetooth = excluded.bluetooth`,
            args: [
                norm(i.car_id), norm(i.mileage, ""), norm(i.traction, ""), norm(i.fuel_type, ""),
                norm(i.transmission_type, ""), i.fuel_tank_capacity_liters === null || i.fuel_tank_capacity_liters === undefined ? null : int(i.fuel_tank_capacity_liters),
                norm(i.engine_type, ""), int(i.parking_assist), int(i.push_button_start),
                int(i.remote_locking), int(i.connectivity), int(i.satellite_navigation),
                int(i.screens), int(i.panoramic_roof), int(i.air_conditioning),
                int(i.fog_lights), int(i.bluetooth),
            ],
        });
    }
    console.log(`Fichas copiadas: ${infos.rows.length}`);

    // 5. Verificación de conteos
    const check = await nueva.execute(
        `SELECT (SELECT COUNT(*) FROM cars) AS autos,
                (SELECT COUNT(*) FROM car_photos) AS fotos,
                (SELECT COUNT(*) FROM car_info) AS fichas,
                (SELECT COUNT(*) FROM admins) AS admins`
    );
    console.log("Verificación DB nueva:", JSON.stringify(check.rows[0]));
    console.log("Migración completada");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});