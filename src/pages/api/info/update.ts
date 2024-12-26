import type { APIRoute } from "astro";
import { turso } from "@db/connection";

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies }) => {
    if (!cookies.has("authenticated")) return new Response(JSON.stringify({
        message: "Token is required"
    }), { status: 401 });

    const car_id = url.searchParams.get("id");
    const formData = await request.formData();

    const carInfo = {
        mileage: formData.get("mileage")!.toString(),
        traction: formData.get("traction")!.toString(),
        fuel_type: formData.get("fuel_type")!.toString(),
        transmission_type: formData.get("transmission_type")!.toString(),
        fuel_tank_capacity_liters: formData.get("fuel_tank_capacity_liters")!.toString(),
        engine_type: formData.get("engine_type")!.toString(),
        parking_assist: formData.has("parking_assist") ? 1 : 0,
        push_button_start: formData.has("push_button_start") ? 1 : 0,
        remote_locking: formData.has("remote_locking") ? 1 : 0,
        connectivity: formData.has("connectivity") ? 1 : 0,
        satellite_navigation: formData.has("satellite_navigation") ? 1 : 0,
        screens: formData.has("screens") ? 1 : 0,
        panoramic_roof: formData.has("panoramic_roof") ? 1 : 0,
        air_conditioning: formData.has("air_conditioning") ? 1 : 0,
        fog_lights: formData.has("fog_lights") ? 1 : 0,
        bluetooth: formData.has("bluetooth") ? 1 : 0,
    };

    try {
        await turso.execute({
            sql: `
			UPDATE car_info 
			SET mileage = ?, traction = ?, fuel_type = ?, transmission_type = ?, 
			    fuel_tank_capacity_liters = ?, engine_type = ?, 
			    parking_assist = ?, push_button_start = ?, remote_locking = ?, 
			    connectivity = ?, satellite_navigation = ?, screens = ?, 
			    panoramic_roof = ?, air_conditioning = ?, fog_lights = ?, bluetooth = ? 
			WHERE car_id = ?`,
            args: [...Object.values(carInfo), car_id],
        });

        return new Response("Detalles técnicos actualizados correctamente", { status: 200 });
    } catch (error) {
        console.error("Error al actualizar los detalles técnicos:", error);
        return new Response("Error interno del servidor", { status: 500 });
    }
};
