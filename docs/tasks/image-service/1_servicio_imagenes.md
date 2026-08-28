# IMAGES-1 — Servicio de imágenes con ImgBB encapsulado

> Objetivo: sacar la lógica de subida/borrado de imágenes del endpoint `src/pages/api/photos/update.ts` a un módulo de dominio (`src/services/images.ts`), de forma que ImgBB sea un detalle de infraestructura conocido por un solo lugar. Proyecto pequeño: interfaz mínima, sin inyección de dependencias ni abstracciones genéricas.

## Alcance

- Crear `src/services/images.ts` como **único** módulo que conoce ImgBB.
- El endpoint `photos/update.ts` queda como capa fina: auth, leer formData, llamar al servicio, responder.
- Validación de tipo/tamaño de archivos y manejo de errores coherente.
- Opcional: redimensionado con `sharp` antes de subir.

## 1. Problema actual

- `photos/update.ts` mezcla cuatro responsabilidades: auth, validación, subida a ImgBB (`fetch` a `https://api.imgbb.com/1/upload?key=...` con base64) y persistencia en Turso.
- No valida tipo MIME ni tamaño: cualquier archivo puede ir directo a ImgBB.
- Si ImgBB falla para una foto, solo se loguea y se sigue: la foto "desaparece" silenciosamente.
- El endpoint conoce la API externa; si se cambia de proveedor hay que tocar páginas/endpoints.

## 2. Interfaz mínima del proveedor

Sin sobrediseño: una interfaz TypeScript y una implementación concreta en el mismo módulo (o en `src/services/providers/imgbb.ts` si se prefiere separar archivo).

```ts
// src/services/images.ts
export interface ImageProvider {
    upload(file: File): Promise<{ url: string; deleteUrl?: string }>;
    delete?(url: string): Promise<void>;
}

export interface ImageServiceResult {
    urls: string[];
    errors: string[]; // mensajes legibles por foto fallida
}
```

- `upload` devuelve la URL pública (hoy `result.data.url` de ImgBB). Si el proveedor devuelve URL de borrado (ImgBB lo hace en `data.delete_url`), guardamos la posibilidad en el tipo pero **no** se persiste en DB en esta tarea (eso queda para db-migration si decide agregar columna).
- `delete` es opcional: ImgBB no permite borrar por URL pública, solo por `delete_url`; se deja definido para no cerrar la puerta.

## 3. Módulo de dominio (`src/services/images.ts`)

```ts
import { IMGBB_KEY } from "./providers/imgbb"; // o inline
import type { ImageProvider, ImageServiceResult } from "./images";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const upload_images = async (
    files: File[],
    provider: ImageProvider = imgbbProvider
): Promise<ImageServiceResult> => {
    const urls: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
        const validationError = validate_image(file);
        if (validationError) {
            errors.push(`${file.name}: ${validationError}`);
            continue;
        }
        try {
            const { url } = await provider.upload(file);
            urls.push(url);
        } catch {
            errors.push(`${file.name}: error al subir a ImgBB`);
        }
    }

    return { urls, errors };
};

export function validate_image(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) return "tipo no permitido (solo JPEG, PNG, WebP)";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `supera ${MAX_SIZE_MB}MB`;
    return null;
}
```

Reglas:

1. **Solo `src/services/` importa detalles de ImgBB** (API key, endpoint, formato base64). Endpoints y páginas nunca lo hacen.
2. `IMGBB_KEY` se lee con `import.meta.env.IMGBB_KEY` dentro del proveedor; si falta, fallar temprano con error claro.
3. El provider default evita pasar dependencias por todos lados; el parámetro existe solo para testear.

## 4. Proveedor ImgBB (`src/services/providers/imgbb.ts`)

```ts
import type { ImageProvider } from "../images";

const upload = async (file: File) => {
    const base64Image = await file.arrayBuffer().then(Buffer.from).then((b) => b.toString("base64"));

    const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.IMGBB_KEY}`,
        { method: "POST", body: new URLSearchParams({ image: base64Image }) }
    );
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result?.error?.message ?? "Error de ImgBB");
    }
    return { url: result.data.url as string, deleteUrl: result.data.delete_url as string | undefined };
};

export const imgbbProvider: ImageProvider = { upload };
```

## 5. Endpoint refactorizado (`src/pages/api/photos/update.ts`)

- Se elimina todo lo de ImgBB y `convertToBase64`.
- Queda: verificación de cookie → leer `formData` → validar que haya archivos nuevos o URLs viejas → `upload_images(files)` → si `errors.length > 0`, responder 422 con la lista (o 207 parcial, ver decisión abajo) → persistir `[...olds, ...result.urls]` en Turso (o delegar a `src/db/` si DRIZZLE-1 ya está hecho).

Decisión de errores: si **alguna** foto falla validación/subida, responder `422` con `{ errors, urls }` y **no** escribir nada en DB. Es más simple y predecible que un partial-success para un panel admin donde el usuario ve el error y reintenta.

## 6. Opcional: redimensionado con `sharp`

- Agregar `sharp` y, dentro del proveedor (no en el dominio), redimensionar a un máximo de ~1600px de ancho y convertir a WebP/JPEG antes de base64 → menos peso en ImgBB y carga más rápida en `CardPhotos.astro`, `CardHeader.astro`, `Card.astro`, `CardList.astro`.
- Nota: verificar compatibilidad de `sharp` con el runtime de Vercel (Node). Si complica el build, se descarta y queda como tarea futura.

## 7. Orden de trabajo sugerido

1. Crear `src/services/images.ts` + `src/services/providers/imgbb.ts` con la interfaz y validación.
2. Refactorizar `photos/update.ts` para usar el servicio (mismo comportamiento, ahora con 422 ante errores).
3. Probar subida múltiple, archivo inválido (tipo y tamaño), y fallo simulado de ImgBB.
4. (Opcional) `sharp` para redimensionar.

## Relación con otras tareas

- **DRIZZLE-1**: la persistencia de URLs de fotos (`DELETE` + `INSERT` en `car_photos`) podría delegarse a `src/db/cars.ts`; independiente de este servicio.
- **DB-MIGRATION**: si el esquema v2 agrega columna para `delete_url` de ImgBB, este servicio ya devuelve el dato.