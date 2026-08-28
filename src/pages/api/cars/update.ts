import type { APIRoute } from "astro";
import { update_car_by_id } from "@db/cars";

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies }) => {
    if (!cookies.has("authenticated")) return new Response(JSON.stringify({
        message: "Token is required"
    }), { status: 401 });

    const car_id = url.searchParams.get("id");
    if (!car_id) return new Response(JSON.stringify({ message: "Car id is required" }), { status: 400 });

    const formData = await request.formData();

    try {
        await update_car_by_id(car_id, {
            name: formData.get("name")!.toString(),
            model: formData.get("model")!.toString(),
            description: formData.get("description")!.toString(),
            year: parseInt(formData.get("year")!.toString()),
            is_used: formData.has("is_used"),
            published: formData.has("published"),
        });

        return new Response("Información del auto actualizada correctamente", { status: 200 });
    } catch (error) {
        console.error("Error al actualizar la información del auto:", error);
        return new Response("Error interno del servidor", { status: 500 });
    }
};