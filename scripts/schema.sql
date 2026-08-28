PRAGMA foreign_keys = ON;

CREATE TABLE admins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL
);

CREATE TABLE cars (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    model       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    year        INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
    is_used     INTEGER NOT NULL DEFAULT 0 CHECK (is_used IN (0, 1)),
    published   INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cars_published ON cars (published);

CREATE TABLE car_photos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id      TEXT    NOT NULL REFERENCES cars (id) ON DELETE CASCADE,
    photo_url   TEXT    NOT NULL,
    is_main     INTEGER NOT NULL DEFAULT 0 CHECK (is_main IN (0, 1))
);

CREATE INDEX idx_car_photos_car_id ON car_photos (car_id);

CREATE TABLE car_info (
    car_id      TEXT    PRIMARY KEY REFERENCES cars (id) ON DELETE CASCADE,
    mileage     TEXT    NOT NULL DEFAULT '',
    traction    TEXT    NOT NULL DEFAULT '',
    fuel_type   TEXT    NOT NULL DEFAULT '',
    transmission_type TEXT NOT NULL DEFAULT '',
    fuel_tank_capacity_liters INTEGER,
    engine_type TEXT    NOT NULL DEFAULT '',
    parking_assist        INTEGER NOT NULL DEFAULT 0 CHECK (parking_assist IN (0, 1)),
    push_button_start     INTEGER NOT NULL DEFAULT 0 CHECK (push_button_start IN (0, 1)),
    remote_locking        INTEGER NOT NULL DEFAULT 0 CHECK (remote_locking IN (0, 1)),
    connectivity          INTEGER NOT NULL DEFAULT 0 CHECK (connectivity IN (0, 1)),
    satellite_navigation  INTEGER NOT NULL DEFAULT 0 CHECK (satellite_navigation IN (0, 1)),
    screens               INTEGER NOT NULL DEFAULT 0 CHECK (screens IN (0, 1)),
    panoramic_roof        INTEGER NOT NULL DEFAULT 0 CHECK (panoramic_roof IN (0, 1)),
    air_conditioning      INTEGER NOT NULL DEFAULT 0 CHECK (air_conditioning IN (0, 1)),
    fog_lights            INTEGER NOT NULL DEFAULT 0 CHECK (fog_lights IN (0, 1)),
    bluetooth             INTEGER NOT NULL DEFAULT 0 CHECK (bluetooth IN (0, 1))
);