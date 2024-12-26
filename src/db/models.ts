// Tipos de TypeScript generados a partir de las tablas SQL

export interface Credentials {
    id: number;
    name: string;
}

// Tabla `cars`
export interface ICar {
    id: string; // UUID
    name: string;
    model: string;
    description: string;
    year: number;
    is_used: boolean;
    update_at: string; // Fecha en formato texto
    create_at: string; // Fecha en formato texto
    published: boolean;
}

// Tabla `car_photos`
export interface ICarPhoto {
    id: number; // Autoincremental
    car_id: string; // Relación con la tabla cars
    photo_url: string;
    is_main: boolean;
}

// Tabla `car_info`
export interface ICarInfo {
    id: number; // Autoincremental
    car_id: number; // Relación con la tabla cars
    mileage: string;
    traction: string;
    fuel_type: string;
    transmission_type: string;
    fuel_tank_capacity_liters: number;
    engine_type: string;
    parking_assist: boolean;
    push_button_start: boolean;
    remote_locking: boolean;
    connectivity: boolean;
    satellite_navigation: boolean;
    screens: boolean;
    panoramic_roof: boolean;
    air_conditioning: boolean;
    fog_lights: boolean;
    bluetooth: boolean;
}
