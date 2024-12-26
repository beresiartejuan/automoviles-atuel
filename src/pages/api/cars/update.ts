import type { APIRoute } from "astro";
import { turso } from "@db/connection";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, url }) => {
    if (!cookies.has("authenticated")) return new Response(JSON.stringify({
        message: "Token is required"
    }), { status: 401 });

    const car_id = url.searchParams.get("id");
    const formData = await request.formData();

    const name = formData.get("name")!.toString();
    const model = formData.get("model")!.toString();
    const description = formData.get("description")!.toString();
    const year = parseInt(formData.get("year")!.toString());
    const is_used = formData.has("is_used") ? 1 : 0;
    const published = formData.has("published") ? 1 : 0;

    try {
        await turso.execute({
            sql: `
			UPDATE cars 
			SET name = ?, model = ?, description = ?, year = ?, is_used = ?, published = ? 
			WHERE id = ?`,
            args: [name, model, description, year, is_used, published, car_id],
        });

        return new Response("Información del auto actualizada correctamente", { status: 200 });
    } catch (error) {
        console.error("Error al actualizar la información del auto:", error);
        return new Response("Error interno del servidor", { status: 500 });
    }
};
