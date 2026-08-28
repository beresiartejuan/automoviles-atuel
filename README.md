# Automóviles Atuel

Sitio web con catálogo de vehículos y panel de administración. Construido con Astro (SSR en Vercel) y Turso (libSQL).

## Stack

- **Astro 7** (SSR, adapter `@astrojs/vercel`)
- **Turso / libSQL** vía `@libsql/client`
- **sass**, **valibot**, **bcrypt**, **jsonwebtoken**

## Gestor de paquetes

El proyecto usa **pnpm** (no npm). Los scripts de compilación de `bcrypt`, `esbuild` y `@parcel/watcher` están aprobados en `pnpm.onlyBuiltDependencies` dentro del `package.json`.

## Comandos

| Command                 | Action                                           |
| :---------------------- | :----------------------------------------------- |
| `pnpm install`          | Installs dependencies                            |
| `pnpm run dev`          | Starts local dev server at `localhost:4321`      |
| `pnpm run build`        | Build your production site to `./dist/`          |
| `pnpm run preview`      | Preview your build locally, before deploying     |
| `pnpm run astro ...`    | Run CLI commands like `astro add`, `astro check` |

## Variables de entorno

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
PRIVATE_KEY=...      # clave para firmar el JWT del login
IMGBB_KEY=...        # (opcional) para subir fotos a ImgBB
```

## Scripts de base de datos

En `scripts/` hay utilidades para la base de datos:

- `schema.sql` — esquema v2 (FKs con `ON DELETE CASCADE`, `CHECK`s, índices)
- `create-schema.mjs` — crea el esquema en la DB apuntada por `DB_URL` / `DB_TOKEN`
- `migrate-data.mjs` — migra datos desde la DB vieja (solo lectura) a la DB nueva (idempotente)

## Documentación

Ver `docs/` para el estado del proyecto, esquema de la base de datos y tareas planificadas.