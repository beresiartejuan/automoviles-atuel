// Uso: OLD_DB_URL=... OLD_DB_TOKEN=... NEW_DB_URL=... NEW_DB_TOKEN=... node scripts/create-schema.mjs
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

const url = process.env.DB_URL;
const token = process.env.DB_TOKEN;

if (!url || !token) {
    console.error("Faltan DB_URL o DB_TOKEN");
    process.exit(1);
}

const client = createClient({ url, authToken: token });

const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf-8");
await client.executeMultiple(schema);
console.log("Esquema v2 creado en la DB nueva");

const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log("Tablas:", tables.rows.map((r) => r.name).join(", "));