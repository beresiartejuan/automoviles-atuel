# Automóviles Atuel — Stack tecnológico

## Framework y despliegue

| Tecnología | Versión | Uso |
|---|---|---|
| [Astro](https://astro.build) | ^7.2.9 | Framework base del sitio (modo SSR con `output: "server"`) |
| [@astrojs/vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/) | ^9.0.1 | Adaptador para desplegar en Vercel (serverless) |
| [TypeScript](https://www.typescriptlang.org) | — | Tipado estático (modo `strict`) |

## Base de datos

| Tecnología | Versión | Uso |
|---|---|---|
| [Turso](https://turso.tech) | — | Base de datos SQL (SQLite distribuida) |
| [@tursodatabase/database](https://docs.turso.tech) | latest | SDK actual de Turso, reemplazo de `@libsql/client` |
| [drizzle-orm](https://orm.drizzle.team) | latest | ORM type-safe para definir tablas y consultas |
| [drizzle-kit](https://orm.drizzle.team) | latest | Migraciones y gestión del esquema de la base de datos |

## Autenticación

| Tecnología | Versión | Uso |
|---|---|---|
| [bcrypt](https://www.npmjs.com/package/bcrypt) | ^6.0.0 | Hash y verificación de contraseñas de administradores |
| [jose](https://www.npmjs.com/package/jose) | latest | Firma y verificación de tokens JWT (compatible con Web Crypto, ideal para runtime serverless de Vercel) |

## Validación

| Tecnología | Versión | Uso |
|---|---|---|
| [valibot](https://valibot.dev) | ^1.1.0 | Validación de esquemas en formularios y endpoints de la API |

## Imágenes

| Tecnología | Versión | Uso |
|---|---|---|
| [sharp](https://sharp.pixelplumbing.com) | latest | Optimización y redimensionado de imágenes (integrado con `astro:assets`) |
| [ImgBB](https://api.imgbb.com) | — | Alojamiento externo de las fotos de los autos |

## QR

| Tecnología | Versión | Uso |
|---|---|---|
| [qr-code-styling](https://www.npmjs.com/package/qr-code-styling) | ^1.9.2 | Generación de códigos QR en la página de edición |

## Estilos y fuentes

| Tecnología | Versión | Uso |
|---|---|---|
| [sass](https://sass-lang.com) | ^1.94.2 | Preprocesador CSS (estilos con sintaxis SCSS) |
| [normalize.css](https://necolas.github.io/normalize.css/) | ^8.0.1 | Reset de estilos entre navegadores |
| [@fontsource/kanit](https://www.npmjs.com/package/@fontsource/kanit) | latest | Tipografía Kanit autoalojada (reemplaza Google Fonts) |
| [@fontsource/poppins](https://www.npmjs.com/package/@fontsource/poppins) | latest | Tipografía Poppins autoalojada (reemplaza Google Fonts) |

## Calidad de código

| Tecnología | Versión | Uso |
|---|---|---|
| [prettier](https://prettier.io) | latest | Formateo automático de código |
| [eslint](https://eslint.org) | latest | Linting de código |
| [eslint-plugin-astro](https://www.npmjs.com/package/eslint-plugin-astro) | latest | Reglas de ESLint para archivos Astro |

## Testing

| Tecnología | Versión | Uso |
|---|---|---|
| [vitest](https://vitest.dev) | latest | Tests unitarios (helpers, queries de base de datos) |
| [playwright](https://playwright.dev) | latest | Tests end-to-end de flujos críticos (login, CRUD de autos) |

## Scripts npm

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `astro dev` | Servidor de desarrollo |
| `build` | `astro build` | Build de producción |
| `preview` | `astro preview` | Vista previa del build |
| `astro` | `astro` | CLI de Astro |