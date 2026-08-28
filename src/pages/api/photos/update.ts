import type { APIRoute } from "astro";
import { upload_images } from "@/services/images";
import { imgbbProvider } from "@/services/providers/imgbb";
import { replace_car_photos } from "@db/cars";

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies }) => {
    if (!cookies.has("authenticated")) {
        return new Response(
            JSON.stringify({ message: "Token is required" }),
            { status: 401 }
        );
    }

    const car_id = url.searchParams.get("id");
    if (!car_id) return new Response(JSON.stringify({ message: "Car id is required" }), { status: 400 });

    const formData = await request.formData();
    const files = formData.getAll("new-photos").filter((f): f is File => f instanceof File);
    const olds = formData.getAll("photos[]");
    const oldPhotoUrls = olds.map((u) => u.toString()).filter((u) => u.trim() !== "");

    if (files.length === 0 && oldPhotoUrls.length === 0) {
        return new Response(
            JSON.stringify({ message: "No valid photos provided" }),
            { status: 400 }
        );
    }

    // Subir fotos nuevas vía el servicio (valida tipo y tamaño)
    const result = await upload_images(files, imgbbProvider);

    // Si alguna foto falla, no se escribe nada en DB: el usuario ve el error y reintenta
    if (result.errors.length > 0) {
        return new Response(
            JSON.stringify({ message: "Algunas fotos no se pudieron subir", errors: result.errors }),
            { status: 422 }
        );
    }

    const allPhotoUrls = [...oldPhotoUrls, ...result.urls];

    try {
        await replace_car_photos(car_id, allPhotoUrls);

        return new Response(
            JSON.stringify({
                message: "Fotos actualizadas correctamente",
                photos: allPhotoUrls,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error al actualizar las fotos:", error);
        return new Response("Error interno del servidor", { status: 500 });
    }
};