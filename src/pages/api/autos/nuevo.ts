import type { APIRoute } from "astro";
import { insert_car, insert_car_info } from "@db/cars";
import { v4 as uuidv4 } from "uuid";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
    if (!cookies.has("authenticated")) {
        return new Response(JSON.stringify({ message: "Token is required" }), { status: 401 });
    }

    const id = uuidv4();

    try {
        await insert_car({
            id,
            name: "Nuevo vehículo",
            model: "",
            description: "",
            year: new Date().getFullYear(),
            is_used: true,
            published: false,
        });

        await insert_car_info({
            car_id: id,
            mileage: "",
            traction: "",
            fuel_type: "",
            transmission_type: "",
            fuel_tank_capacity_liters: null,
            engine_type: "",
            parking_assist: false,
            push_button_start: false,
            remote_locking: false,
            connectivity: false,
            satellite_navigation: false,
            screens: false,
            panoramic_roof: false,
            air_conditioning: false,
            fog_lights: false,
            bluetooth: false,
        });

        return new Response(JSON.stringify({ link: `/autos/edit?id=${id}` }), { status: 201 });
    } catch (error) {
        console.error("Error al crear vehículo:", error);
        return new Response(JSON.stringify({ message: "Error al crear vehículo" }), { status: 500 });
    }
};
