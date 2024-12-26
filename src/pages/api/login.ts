import type { APIRoute } from 'astro';
import { getAdmins } from '@db/admins';
import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { customResponse, respondWithJson } from "@/helper/response";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {

    const body = await request.json();

    if (!Object.keys(body).includes("username")) {
        return respondWithJson({ message: "Por favor, ingrese un nombre de usuario." }, 404);
    }

    if (!Object.keys(body).includes("password")) {
        return respondWithJson({ message: "Por favor, ingrese una contraseña." }, 404);
    };

    const admins = await getAdmins();

    const user = admins.find(admin => admin.name === body.username);

    const isCorrectPassword = await compare(body.password, user ? user.password : "");

    if (!user || !isCorrectPassword) {
        return respondWithJson({ message: "Usuario o contraseña incorrectas." }, 401);
    }

    const sing = jwt.sign({
        name: user.name,
        id: user.id
    }, import.meta.env.PRIVATE_KEY as string);

    cookies.set('authenticated', sing, {
        httpOnly: true,
        path: "/"
    });

    return respondWithJson({ message: "Inicio de sessión exitoso." }, 200);

}