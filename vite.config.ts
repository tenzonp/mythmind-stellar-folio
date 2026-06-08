// @lovable.dev/vite-tanstack-config already includes:
//   tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only,
//   cloudflare default), componentTagger (dev-only), VITE_* env injection,
//   @ path alias, React/TanStack dedupe, error logger plugins, and sandbox
//   detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Vercel sets VERCEL=1 inside its build container. When detected we force
// Nitro on with the `vercel` preset so the build emits Vercel's Build Output
// API v3 layout under `.vercel/output/`. Locally / in the Lovable sandbox the
// default behaviour is preserved.
const isVercel = !!process.env.VERCEL;

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  ...(isVercel && {
    nitro: {
      preset: "vercel",
      vercel: {
        functions: {
          runtime: "nodejs20.x",
        },
      },
    },
  }),
});
