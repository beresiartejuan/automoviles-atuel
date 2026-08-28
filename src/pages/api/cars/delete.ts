import type { APIRoute } from "astro";
import { delete_car_by_id } from "@db/cars";

export const prerender = false;

export const DELETE: APIRoute = async ({ url, cookies }) => {
    if (!cookies.has("authenticated")) {
        return new Response(JSON.stringify({ message: "Token is required" }), { status: 401 });
    }

    const car_id = url.searchParams.get("id");
    if (!car_id) return new Response(JSON.stringify({ message: "Car id is required" }), { status: 400 });

    const ok = await delete_car_by_id(car_id);
    if (!ok) {
        return new Response(JSON.stringify({ message: "Error al eliminar el auto" }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Auto eliminado" }), { status: 200 });
};
