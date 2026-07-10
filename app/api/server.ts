import { serve } from "@hono/node-server";
import { serveStaticFiles } from "./lib/vite";
import app from "./boot";
import { env } from "./lib/env";

const port = parseInt(process.env.PORT || "3000");

function assertProduction() {
  if (!env.isProduction) {
    // Fail fast if someone tries to run the production server while not in production
    // (also avoids accidentally triggering SSR/dev evaluation paths).
    throw new Error("Refusing to start server: NODE_ENV is not production");
  }
}

async function main() {
  assertProduction();
  // app is already a Hono<{ Bindings: HttpBindings }> from boot.ts
  serveStaticFiles(app);
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

try {
  main();
} catch (err) {
  console.error("Failed to start server:", err);
}
