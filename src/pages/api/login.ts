import type { APIRoute } from 'astro';
import { verify_admin } from '@db/admins';
import jwt from "jsonwebtoken";
import { PRIVATE_KEY } from 'astro:env/server';
import { respondWithJson } from "@/helper/response";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {

    const body = await request.json();

    if (!Object.keys(body).includes("username")) {
        return respondWithJson({ message: "Por favor, ingrese un nombre de usuario." }, 404);
    }

    if (!Object.keys(body).includes("password")) {
        return respondWithJson({ message: "Por favor, ingrese una contraseña." }, 404);
    };

    const user = await verify_admin(body.username, body.password);

    if (!user) {
        return respondWithJson({ message: "Usuario o contraseña incorrectas." }, 401);
    }

    const sing = jwt.sign({
        name: user.name,
        id: user.id
    }, PRIVATE_KEY);

    cookies.set('authenticated', sing, {
        httpOnly: true,
        path: "/"
    });

    return respondWithJson({ message: "Inicio de sessión exitoso." }, 200);

}