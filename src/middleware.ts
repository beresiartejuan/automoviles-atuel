import { defineMiddleware } from "astro/middleware";
import jwt from "jsonwebtoken";
import type { Credentials } from "@db/models";

export const onRequest = defineMiddleware((context, next) => {

    const { locals, cookies } = context;

    if (!cookies.has("authenticated")) {
        locals.user = undefined;
    } else {
        const user_cookie = cookies.get("authenticated")!;

        try {
            const user = jwt.verify(user_cookie.value, import.meta.env.PRIVATE_KEY!);
            locals.user = user as Credentials;
        } catch (error) {
            locals.user = undefined;
        }
    }

    return next();
});