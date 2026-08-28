import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { admins } from "../src/db/schema.ts";

config();

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
    console.error("Faltan variables de entorno: TURSO_DATABASE_URL y TURSO_AUTH_TOKEN");
    process.exit(1);
}

const rawClient = createClient({ url, authToken: token });
const db = drizzle(rawClient);

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === "reset") {
        await rawClient.execute("DELETE FROM admins;");
        console.log("Todos los usuarios admin fueron eliminados.");
        return;
    }

    if (command === "create") {
        const name = args[1];
        const password = args[2];

        if (!name || !password) {
            console.error("Uso: pnpm exec tsx scripts/manage-admin.ts create <nombre> <contraseña>");
            process.exit(1);
        }

        const hashed = await bcrypt.hash(password, 10);
        const [inserted] = await db
            .insert(admins)
            .values({ name, password: hashed })
            .returning({ id: admins.id, name: admins.name });

        console.log("Admin creado:", inserted);
        return;
    }

    if (command === "list") {
        const rows = await db.select({ id: admins.id, name: admins.name }).from(admins);
        console.log("Admins:", rows);
        return;
    }

    console.log(`Uso:
  pnpm exec tsx scripts/manage-admin.ts reset
  pnpm exec tsx scripts/manage-admin.ts create <nombre> <contraseña>
  pnpm exec tsx scripts/manage-admin.ts list`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
