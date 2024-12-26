import type { APIRoute } from "astro";
import { turso } from "@db/connection";

export const prerender = false;

// API_KEY para ImgBB
const API_KEY = "ad59d389c013088adf430cb25c889646";

export const POST: APIRoute = async ({ request, url, cookies }) => {
    if (!cookies.has("authenticated")) {
        return new Response(
            JSON.stringify({ message: "Token is required" }),
            { status: 401 }
        );
    }

    const car_id = url.searchParams.get("id");
    const formData = await request.formData();
    const files = formData.getAll("new-photos");
    const olds = formData.getAll("photos[]");

    // Validar si hay al menos una URL o un archivo
    if ((!files || files.length === 0 || !(files[0] instanceof File)) && olds.length === 0) {
        return new Response(
            JSON.stringify({ message: "No valid photos provided" }),
            { status: 400 }
        );
    }

    let uploadedPhotoUrls: string[] = [];
    let oldPhotoUrls: string[] = olds.map((url) => url.toString()).filter(url => url.trim() !== "");

    try {
        // Procesar las fotos nuevas (si existen)
        if (files && files.length > 0) {
            for (const file of files) {
                if (!(file instanceof File)) continue;

                const base64Image = await convertToBase64(file);

                // Llamar a ImgBB API
                const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
                    method: "POST",
                    body: new URLSearchParams({
                        image: base64Image,
                    }),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    const photoUrl = result.data.url; // Obtener la URL de la imagen
                    uploadedPhotoUrls.push(photoUrl);
                } else {
                    console.error("Error al subir imagen:", result);
                }
            }
        }

        // Combinar fotos antiguas y nuevas
        const allPhotoUrls = [...oldPhotoUrls, ...uploadedPhotoUrls];

        // Eliminar las fotos actuales del auto en la base de datos
        await turso.execute({
            sql: "DELETE FROM car_photos WHERE car_id = ?",
            args: [car_id],
        });

        // Guardar todas las fotos en la base de datos
        for (const photoUrl of allPhotoUrls) {
            await turso.execute({
                sql: `
				INSERT INTO car_photos (car_id, photo_url, is_main) 
				VALUES (?, ?, ?)`,
                args: [car_id, photoUrl, 0],
            });
        }

        return new Response(
            JSON.stringify({
                message: "Fotos actualizadas correctamente",
                photos: allPhotoUrls,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error al actualizar las fotos:", error);

        // Si algo falla, guardar las fotos antiguas en la base de datos
        for (const photoUrl of oldPhotoUrls) {
            await turso.execute({
                sql: `
				INSERT INTO car_photos (car_id, photo_url, is_main) 
				VALUES (?, ?, ?)`,
                args: [car_id, photoUrl, 0],
            });
        }

        return new Response("Error interno del servidor, pero se guardaron las fotos antiguas", {
            status: 500,
        });
    }
};

// Función para convertir un archivo a Base64 usando Buffer
async function convertToBase64(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    return buffer.toString("base64");
}
