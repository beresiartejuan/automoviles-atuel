import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect, locals }) => {
    if (!locals.user) redirect("/", 302);

    cookies.delete('authenticated', {
        path: "/",
        httpOnly: true
    });

    return redirect("/", 302);
}