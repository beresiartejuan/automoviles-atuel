// @ts-check
import { defineConfig, envField } from 'astro/config';

import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  output: "server",
  site: "http://localhost:1234",
  env: {
    schema: {
      TURSO_DATABASE_URL: envField.string({ context: "server", access: "secret" }),
      TURSO_AUTH_TOKEN: envField.string({ context: "server", access: "secret" }),
      PRIVATE_KEY: envField.string({ context: "server", access: "secret" }),
      IMGBB_KEY: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
