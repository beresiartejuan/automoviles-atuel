# Automóviles Atuel

Catálogo web con panel administrativo para una agencia de vehículos. Permite mostrar el stock disponible al público y gestionar el contenido desde un acceso privado.

## 🚀 Qué hace

- **Catálogo público**: listado de vehículos con buscador, filtros (0 km / usados) y ficha de detalle con fotos y especificaciones técnicas.
- **Panel de administración**: acceso privado con autenticación JWT para crear, editar, publicar/ocultar y eliminar vehículos.
- **Subida de fotos**: integración con ImgBB para alojar las imágenes de cada ficha.
- **Códigos QR**: generación de QR vinculado a la ficha de cada vehículo.

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | [Astro 7](https://astro.build) en modo SSR |
| Despliegue | [Vercel](https://vercel.com) (`@astrojs/vercel`) |
| Base de datos | [Turso](https://turso.tech) / libSQL |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Autenticación | `bcrypt` + `jsonwebtoken` en cookie `httpOnly` |
| Validación | [Valibot](https://valibot.dev) |
| Estilos | Tailwind CSS v4 + Sass |
| Tipografías | `@fontsource/kanit`, `@fontsource/poppins` |
| QR | `qr-code-styling` |

---

## 📦 Requisitos

- Node.js 18+
- [pnpm](https://pnpm.io) (gestor de paquetes usado en el proyecto)
- Cuenta en [Turso](https://turso.tech) con una base de datos creada
- (Opcional) Clave de API de [ImgBB](https://api.imgbb.com) para la subida de imágenes

---

## 🧰 Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/automoviles-atuel.git
cd automoviles-atuel

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (ver sección siguiente)

# 4. Crear el esquema de base de datos
pnpm tsx scripts/create-schema.mjs

# 5. Iniciar el servidor de desarrollo
pnpm run dev
```

El sitio se abre en `http://localhost:4321`.

---

## 🔑 Variables de entorno

Crear un archivo `.env` en la raíz con al menos estas variables:

```env
TURSO_DATABASE_URL=libsql://<nombre>.turso.io
TURSO_AUTH_TOKEN=<token-de-turso>
PRIVATE_KEY=<clave-secreta-para-firmar-jwt>
IMGBB_KEY=<api-key-de-imgbb>        # opcional, solo para subir fotos
```

> Nunca commitees el archivo `.env`. Verificá que esté incluido en `.gitignore`.

---

## 📁 Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Servidor de desarrollo en `localhost:4321` |
| `pnpm run build` | Build de producción en `./dist/` |
| `pnpm run preview` | Vista previa del build local |
| `pnpm run astro ...` | Comandos del CLI de Astro |
| `pnpm tsx scripts/create-schema.mjs` | Crea tablas en la base de datos |
| `pnpm tsx scripts/migrate-data.mjs` | Migra datos desde otra base de datos |
| `pnpm tsx scripts/manage-admin.ts` | Gestión de usuarios administradores |

---

## 🗂️ Estructura del proyecto

```
automoviles-atuel/
├── scripts/              # Utilidades de base de datos
├── src/
│   ├── components/       # Componentes Astro reutilizables
│   ├── db/               # Esquema y consultas de Drizzle
│   ├── helper/           # Funciones utilitarias
│   ├── layouts/          # Layouts base
│   ├── pages/            # Rutas del sitio y API
│   ├── services/         # Lógica de negocio
│   ├── styles/           # Estilos globales
│   └── ui/               # Componentes de UI
├── docs/                 # Documentación interna del proyecto
├── public/               # Archivos estáticos
├── astro.config.mjs
├── drizzle.config.ts
└── README.md
```

---

## 📝 Notas importantes

- El proyecto está configurado con `output: "server"` y desplegado en Vercel como SSR.
- Algunos endpoints aún usan `@libsql/client`; la documentación interna recomienda evaluar la migración al SDK oficial de Turso.
- Las fotos se alojan externamente en ImgBB. Si no se configura `IMGBB_KEY`, la funcionalidad de subida de imágenes no estará disponible.
- Antes de commitear en una rama compartida, revisá que no se incluyan valores de producción en los archivos de entorno ni en `docs/`.

---

## 📄 Licencia

Este proyecto es privado y se mantiene para uso de la agencia. Consultá al autor antes de reutilizarlo.

---

¿Encontrás algo para mejorar? Abrí un issue o enviá un pull request con tus sugerencias.
