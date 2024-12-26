// @ts-check
import { defineConfig } from 'astro/config';
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
    site: "http://automoviles-atuel.vercel.app",
    vite: {
        css: {
            preprocessorOptions: {
                sass: {
                    api: "modern-compiler",
                },
                scss: {
                    api: "modern-compiler",
                },
            },
        },
    },
    output: "server",
    adapter: vercel()
});
