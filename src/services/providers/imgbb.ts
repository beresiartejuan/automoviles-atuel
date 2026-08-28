import { IMGBB_KEY } from "astro:env/server";
import type { ImageProvider, UploadedImage } from "../images";

if (!IMGBB_KEY) {
    console.warn("IMGBB_KEY no está configurada: la subida de imágenes a ImgBB fallará en runtime");
}

const upload = async (file: File): Promise<UploadedImage> => {
    const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: "POST",
        body: new URLSearchParams({ image: base64Image }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result?.error?.message ?? "Error de ImgBB");
    }

    return {
        url: result.data.url as string,
        deleteUrl: result.data.delete_url as string | undefined,
    };
};

export const imgbbProvider: ImageProvider = { upload };