import type { APIRoute } from "astro";
import { update_car_info } from "@db/cars";

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies }) => {
    if (!cookies.has("authenticated")) return new Response(JSON.stringify({
        message: "Token is required"
    }), { status: 401 });

    const car_id = url.searchParams.get("id");
    if (!car_id) return new Response(JSON.stringify({ message: "Car id is required" }), { status: 400 });

    const formData = await request.formData();

    try {
        await update_car_info(car_id, {
            mileage: formData.get("mileage")!.toString(),
            traction: formData.get("traction")!.toString(),
            fuel_type: formData.get("fuel_type")!.toString(),
            transmission_type: formData.get("transmission_type")!.toString(),
            fuel_tank_capacity_liters: parseInt(formData.get("fuel_tank_capacity_liters")!.toString()) || null,
            engine_type: formData.get("engine_type")!.toString(),
            parking_assist: formData.has("parking_assist"),
            push_button_start: formData.has("push_button_start"),
            remote_locking: formData.has("remote_locking"),
            connectivity: formData.has("connectivity"),
            satellite_navigation: formData.has("satellite_navigation"),
            screens: formData.has("screens"),
            panoramic_roof: formData.has("panoramic_roof"),
            air_conditioning: formData.has("air_conditioning"),
            fog_lights: formData.has("fog_lights"),
            bluetooth: formData.has("bluetooth"),
        });

        return new Response("Detalles técnicos actualizados correctamente", { status: 200 });
    } catch (error) {
        console.error("Error al actualizar los detalles técnicos:", error);
        return new Response("Error interno del servidor", { status: 500 });
    }
};