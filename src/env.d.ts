/// <reference types="astro/client" />

interface Credentials {
    id: number;
    name: string;
}

declare namespace App {
    interface Locals {
        user: Credentials | undefined,
    }
}