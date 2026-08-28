export interface UploadedImage {
    url: string;
    deleteUrl?: string;
}

export interface ImageProvider {
    upload(file: File): Promise<UploadedImage>;
    delete?(url: string): Promise<void>;
}

export interface ImageServiceResult {
    urls: string[];
    errors: string[]; // mensajes legibles por foto fallida
}

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validate_image(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) return "tipo no permitido (solo JPEG, PNG, WebP)";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `supera ${MAX_SIZE_MB}MB`;
    return null;
}

export const upload_images = async (
    files: File[],
    provider: ImageProvider
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
            errors.push(`${file.name}: error al subir la imagen`);
        }
    }

    return { urls, errors };
};