import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const admins = sqliteTable("admins", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    password: text("password").notNull(),
});

export const cars = sqliteTable("cars", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    model: text("model").notNull(),
    description: text("description").notNull().default(""),
    year: integer("year").notNull(),
    isUsed: integer("is_used", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
});

export const carPhotos = sqliteTable("car_photos", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    carId: text("car_id").notNull().references(() => cars.id, { onDelete: "cascade" }),
    photoUrl: text("photo_url").notNull(),
    isMain: integer("is_main", { mode: "boolean" }).notNull().default(false),
});

export const carInfo = sqliteTable("car_info", {
    carId: text("car_id").primaryKey().references(() => cars.id, { onDelete: "cascade" }),
    mileage: text("mileage").notNull().default(""),
    traction: text("traction").notNull().default(""),
    fuelType: text("fuel_type").notNull().default(""),
    transmissionType: text("transmission_type").notNull().default(""),
    fuelTankCapacityLiters: integer("fuel_tank_capacity_liters"),
    engineType: text("engine_type").notNull().default(""),
    parkingAssist: integer("parking_assist", { mode: "boolean" }).notNull().default(false),
    pushButtonStart: integer("push_button_start", { mode: "boolean" }).notNull().default(false),
    remoteLocking: integer("remote_locking", { mode: "boolean" }).notNull().default(false),
    connectivity: integer("connectivity", { mode: "boolean" }).notNull().default(false),
    satelliteNavigation: integer("satellite_navigation", { mode: "boolean" }).notNull().default(false),
    screens: integer("screens", { mode: "boolean" }).notNull().default(false),
    panoramicRoof: integer("panoramic_roof", { mode: "boolean" }).notNull().default(false),
    airConditioning: integer("air_conditioning", { mode: "boolean" }).notNull().default(false),
    fogLights: integer("fog_lights", { mode: "boolean" }).notNull().default(false),
    bluetooth: integer("bluetooth", { mode: "boolean" }).notNull().default(false),
});