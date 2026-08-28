# DB-2 — Script de creación de la base de datos en Turso

> Objetivo: un script que cree la base de datos nueva (esquema v2) directamente en Turso y la pueble con un admin inicial.

## Requisitos previos

- CLI de Turso instalado: `curl -sSfL https://get.tur.so/install.sh | bash`
- Sesión iniciada: `turso auth login`

## Opción A: con la CLI de Turso (recomendada)

### 1. Crear la base de datos

```bash
# Crea la DB en la región más cercana (ej: Ezeiza para Argentina)
turso db create automoviles-atuel-v2 --location eze

# Ver la URL de conexión
turso db show automoviles-atuel-v2 --url

# Crear un token de acceso (guárdalo, no se vuelve a mostrar)
turso db tokens create automoviles-atuel-v2
```

### 2. Ejecutar el esquema

Guardá el SQL del esquema v2 (ver `1_mejorar_esquema.md`) en `scripts/schema.sql` y ejecutalo:

```bash
turso db shell automoviles-atuel-v2 < scripts/schema.sql
```

### 3. Crear el admin inicial

Insertá el admin con la contraseña hasheada con bcrypt. Generá el hash primero:

```bash
node -e "console.log(require('bcrypt').hashSync(process.argv[1], 10))" 'tu-contraseña'
```

Y luego:

```bash
turso db shell automoviles-atuel-v2 "INSERT INTO admins (name, password) VALUES ('admin', '<hash-generado>');"
```

## Opción B: script Node.js

Si preferís automatizar todo en un solo paso, un script simple con el SDK de Turso:

```ts
// scripts/create-db.ts
// Uso: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/create-db.ts
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import bcrypt from "bcrypt";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
    throw new Error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN");
}

const client = createClient({ url, authToken: token });

// 1. Ejecutar el esquema
const schema = readFileSync("scripts/schema.sql", "utf-8");
await client.executeMultiple(schema);
console.log("✅ Esquema creado");

// 2. Crear admin inicial (idempotente)
const adminName = process.env.ADMIN_NAME ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme";
const hash = bcrypt.hashSync(adminPassword, 10);

await client.execute({
    sql: "INSERT INTO admins (name, password) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET password = excluded.password",
    args: [adminName, hash],
});
console.log(`✅ Admin '${adminName}' creado/actualizado`);
```

Ejecución:

```bash
TURSO_DATABASE_URL=libsql://automoviles-atuel-v2-<tu-org>.turso.io \
TURSO_AUTH_TOKEN=<token> \
ADMIN_NAME=admin \
ADMIN_PASSWORD=tu-contraseña \
npx tsx scripts/create-db.ts
```

## Verificación

```bash
# Ver las tablas creadas
turso db shell automoviles-atuel-v2 ".tables"
# Esperado: admins  car_info  car_photos  cars

# Verificar el admin
turso db shell automoviles-atuel-v2 "SELECT id, name FROM admins;"
```

## Actualizar variables de entorno

Cuando la base nueva esté lista, actualizá las variables de entorno del proyecto (`.env` local y las de Vercel):

```env
TURSO_DATABASE_URL=libsql://automoviles-atuel-v2-<tu-org>.turso.io
TURSO_AUTH_TOKEN=<token-nuevo>
```