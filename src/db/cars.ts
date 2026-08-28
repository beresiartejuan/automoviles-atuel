import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { db } from "./client";
import { carInfo, carPhotos, cars } from "./schema";
import type { ICar, ICarInfo, ICarPhoto } from "./models";

// Mapeos Drizzle (camelCase) <-> dominio (snake_case, models.ts)

type CarRow = typeof cars.$inferSelect;
type CarInfoRow = typeof carInfo.$inferSelect;
type CarPhotoRow = typeof carPhotos.$inferSelect;

const toCar = (row: CarRow): ICar => ({
    id: row.id,
    name: row.name,
    model: row.model,
    description: row.description,
    year: row.year,
    is_used: row.isUsed,
    published: row.published,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
});

const toCarInfo = (row: CarInfoRow): ICarInfo => ({
    car_id: row.carId,
    mileage: row.mileage,
    traction: row.traction,
    fuel_type: row.fuelType,
    transmission_type: row.transmissionType,
    fuel_tank_capacity_liters: row.fuelTankCapacityLiters ?? 0,
    engine_type: row.engineType,
    parking_assist: row.parkingAssist,
    push_button_start: row.pushButtonStart,
    remote_locking: row.remoteLocking,
    connectivity: row.connectivity,
    satellite_navigation: row.satelliteNavigation,
    screens: row.screens,
    panoramic_roof: row.panoramicRoof,
    air_conditioning: row.airConditioning,
    fog_lights: row.fogLights,
    bluetooth: row.bluetooth,
});

const toCarPhoto = (row: CarPhotoRow): ICarPhoto => ({
    id: row.id,
    car_id: row.carId,
    photo_url: row.photoUrl,
    is_main: row.isMain,
});

// * GET METHODS

export const get_cars = async (): Promise<ICar[]> =>
    (await db.select().from(cars).orderBy(asc(cars.name))).map(toCar);

export const get_published_cars = async (): Promise<ICar[]> =>
    (await db.select().from(cars).where(eq(cars.published, true)).orderBy(asc(cars.name))).map(toCar);

export const search_published_cars = async (q: string, used: boolean | null): Promise<ICar[]> => {
    const conditions = [eq(cars.published, true)];
    if (q) {
        const pattern = `%${q.toLowerCase()}%`;
        conditions.push(or(like(cars.name, pattern), like(cars.model, pattern))!);
    }
    if (used !== null) conditions.push(eq(cars.isUsed, used));
    return (await db.select().from(cars).where(and(...conditions)).orderBy(asc(cars.name))).map(toCar);
};

export const get_car_by_id = async (id: string): Promise<ICar | null> => {
    const rows = await db.select().from(cars).where(eq(cars.id, id)).limit(1);
    return rows[0] ? toCar(rows[0]) : null;
};

export const get_car_info_by_car_id = async (car_id: string): Promise<ICarInfo | null> => {
    const rows = await db.select().from(carInfo).where(eq(carInfo.carId, car_id)).limit(1);
    return rows[0] ? toCarInfo(rows[0]) : null;
};

export const get_photos_by_car_id = async (car_id: string): Promise<ICarPhoto[]> =>
    (await db.select().from(carPhotos).where(eq(carPhotos.carId, car_id))).map(toCarPhoto);

export const first_photo_by_car_id = async (car_id: string): Promise<ICarPhoto | null> => {
    const rows = await db
        .select()
        .from(carPhotos)
        .where(eq(carPhotos.carId, car_id))
        .orderBy(desc(carPhotos.isMain), asc(carPhotos.id))
        .limit(1);
    return rows[0] ? toCarPhoto(rows[0]) : null;
};

export const get_all_by_car_id = async (car_id: string) => {
    try {
        const car = await get_car_by_id(car_id);
        if (!car) return null;

        const info = await get_car_info_by_car_id(car.id);
        const photos = await get_photos_by_car_id(car.id);

        return { car, info, photos };
    } catch (error) {
        console.error(error);
        return null;
    }
};

// * INSERT METHODS

export const insert_car = async (car: Omit<ICar, "created_at" | "updated_at">): Promise<void> => {
    const now = new Date().toISOString();
    await db.insert(cars).values({
        id: car.id,
        name: car.name,
        model: car.model,
        description: car.description,
        year: car.year,
        isUsed: car.is_used,
        published: car.published,
        createdAt: now,
        updatedAt: now,
    });
};

export const insert_car_info = async (info: Omit<ICarInfo, "car_id"> & { car_id: string }): Promise<void> => {
    await db
        .insert(carInfo)
        .values({
            carId: info.car_id,
            mileage: info.mileage,
            traction: info.traction,
            fuelType: info.fuel_type,
            transmissionType: info.transmission_type,
            fuelTankCapacityLiters: info.fuel_tank_capacity_liters,
            engineType: info.engine_type,
            parkingAssist: info.parking_assist,
            pushButtonStart: info.push_button_start,
            remoteLocking: info.remote_locking,
            connectivity: info.connectivity,
            satelliteNavigation: info.satellite_navigation,
            screens: info.screens,
            panoramicRoof: info.panoramic_roof,
            airConditioning: info.air_conditioning,
            fogLights: info.fog_lights,
            bluetooth: info.bluetooth,
        })
        .onConflictDoNothing({ target: carInfo.carId });
};

export const insert_car_photo = async (photo: Omit<ICarPhoto, "id">): Promise<void> => {
    await db.insert(carPhotos).values({
        carId: photo.car_id,
        photoUrl: photo.photo_url,
        isMain: photo.is_main,
    });
};

// * UPDATE / DELETE METHODS

export const update_car_by_id = async (
    id: string,
    data: Partial<Pick<ICar, "name" | "model" | "description" | "year" | "is_used" | "published">>
): Promise<void> => {
    await db
        .update(cars)
        .set({
            ...(data.name !== undefined && { name: data.name }),
            ...(data.model !== undefined && { model: data.model }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.year !== undefined && { year: data.year }),
            ...(data.is_used !== undefined && { isUsed: data.is_used }),
            ...(data.published !== undefined && { published: data.published }),
            updatedAt: new Date().toISOString(),
        })
        .where(eq(cars.id, id));
};

export const update_car_info = async (car_id: string, data: Omit<ICarInfo, "car_id">): Promise<void> => {
    await db
        .update(carInfo)
        .set({
            mileage: data.mileage,
            traction: data.traction,
            fuelType: data.fuel_type,
            transmissionType: data.transmission_type,
            fuelTankCapacityLiters: data.fuel_tank_capacity_liters,
            engineType: data.engine_type,
            parkingAssist: data.parking_assist,
            pushButtonStart: data.push_button_start,
            remoteLocking: data.remote_locking,
            connectivity: data.connectivity,
            satelliteNavigation: data.satellite_navigation,
            screens: data.screens,
            panoramicRoof: data.panoramic_roof,
            airConditioning: data.air_conditioning,
            fogLights: data.fog_lights,
            bluetooth: data.bluetooth,
        })
        .where(eq(carInfo.carId, car_id));
};

export const replace_car_photos = async (car_id: string, photoUrls: string[]): Promise<void> => {
    await db.transaction(async (tx) => {
        await tx.delete(carPhotos).where(eq(carPhotos.carId, car_id));
        if (photoUrls.length > 0) {
            await tx.insert(carPhotos).values(
                photoUrls.map((url) => ({ carId: car_id, photoUrl: url, isMain: false }))
            );
        }
    });
};

export const delete_photo_by_id = async (photoId: number): Promise<void> => {
    await db.delete(carPhotos).where(eq(carPhotos.id, photoId));
};

export const delete_car_by_id = async (id: string): Promise<boolean> => {
    try {
        // El ON DELETE CASCADE de la DB elimina fotos y ficha técnica automáticamente
        await db.delete(cars).where(eq(cars.id, id));
        return true;
    } catch (error) {
        console.error("Error al eliminar el auto:", error);
        return false;
    }
};