import { executeQuery } from "@db/connection";
import type { ICar, ICarInfo, ICarPhoto } from "@db/models";

// * GET METHODS

export const get_cars = async (filter: string = "1=1", args: any[] = []): Promise<ICar[]> =>
    executeQuery<ICar>(`SELECT * FROM cars WHERE ${filter}`, args);

export const get_published_cars = async (filter: string = "1=1", args: any[] = []) =>
    get_cars(`published = 1 AND ${filter}`, args);

export const get_car_by_id = async (id: string): Promise<ICar | null> => {
    const cars = await get_cars(`id = ?`, [id]);
    return cars.length > 0 ? cars[0] : null;
};

export const get_car_info_by_car_id = async (car_id: string): Promise<ICarInfo[]> =>
    executeQuery<ICarInfo>("SELECT * FROM car_info WHERE car_id = ?", [car_id]);

export const get_photos_by_car_id = async (car_id: string): Promise<ICarPhoto[]> =>
    executeQuery<ICarPhoto>("SELECT * FROM car_photos WHERE car_id = ?", [car_id]);

export const first_photo_by_car_id = async (car_id: string): Promise<ICarPhoto | null> => {
    const photos = await executeQuery<ICarPhoto>("SELECT * FROM car_photos WHERE car_id = ? LIMIT 1", [car_id]);
    return photos.length > 0 ? photos[0] : null;
};

export const get_all_by_car_id = async (car_id: string) => {

    try {

        const car = await get_car_by_id(car_id);

        if (!car) {
            return null;
        }

        const info = (await get_car_info_by_car_id(car.id)).shift()!;

        const photos = await get_photos_by_car_id(car.id);

        return {
            car, info, photos
        }

    } catch (error) {

        console.log(error);

        return null;

    }
};

// * INSERT METHODS

export const insert_car = async (car: ICar) =>
    executeQuery(
        `INSERT INTO cars 
        (id, name, model, description, year, is_used, update_at, create_at, published) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            car.id, car.name, car.model, car.description, car.year,
            car.is_used, car.update_at, car.create_at, car.published
        ]
    );

export const insert_car_info = async (info: ICarInfo) =>
    executeQuery(
        `INSERT INTO car_info 
        (car_id, mileage, traction, fuel_type, transmission_type, fuel_tank_capacity_liters, 
        engine_type, parking_assist, push_button_start, remote_locking, connectivity, 
        satellite_navigation, screens, panoramic_roof, air_conditioning, fog_lights, bluetooth) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            info.car_id, info.mileage, info.traction, info.fuel_type, info.transmission_type,
            info.fuel_tank_capacity_liters, info.engine_type, info.parking_assist,
            info.push_button_start, info.remote_locking, info.connectivity,
            info.satellite_navigation, info.screens, info.panoramic_roof,
            info.air_conditioning, info.fog_lights, info.bluetooth
        ]
    );

export const insert_car_photo = async (photo: Omit<ICarPhoto, 'id'>) =>
    executeQuery(
        "INSERT INTO car_photos (car_id, photo_url, is_main) VALUES (?, ?, ?)",
        [photo.car_id, photo.photo_url, photo.is_main]
    );

export const delete_photo_by_id = async (photo: Pick<ICarPhoto, 'id'>) =>
    await executeQuery("DELETE FROM car_photos WHERE id = ?", [photo.id]);

export const delete_car_by_id = async (car: Pick<ICar, 'id'>): Promise<boolean> => {
    try {

        await executeQuery("BEGIN TRANSACTION");

        await executeQuery("DELETE FROM car_photos WHERE car_id = ?", [car.id]);

        await executeQuery("DELETE FROM car_info WHERE car_id = ?", [car.id]);

        await executeQuery("DELETE FROM cars WHERE id = ?", [car.id]);

        await executeQuery("COMMIT");

        return true;

    } catch (error) {

        await executeQuery("ROLLBACK");

        console.error("Error al eliminar el auto:", error);

        return false;

    }
}