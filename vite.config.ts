import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = Boolean(process.env["VERCEL"]);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },

    ...(isVercel
      ? {
          nitro: {
            preset: "vercel",
          },
        }
      : {}),
  },
});
