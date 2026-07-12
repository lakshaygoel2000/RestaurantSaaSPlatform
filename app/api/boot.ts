import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { checkDatabaseConnection } from "./queries/connection";
import { env } from "./lib/env";

const app = new Hono<{ Bindings: HttpBindings }>();

// CORS: allow any origin in development; in production the SPA is served from
// the same origin so this is mainly a safety net for custom domains / CDNs.
app.use(
  "*",
  cors({
    origin: env.isProduction
      ? process.env.ALLOWED_ORIGIN ?? "*"
      : "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

async function healthHandler(c: any) {
  const db = await checkDatabaseConnection();
  if (!db.ok) {
    return c.json({ status: "error", database: db }, 503);
  }
  return c.json({ status: "ok", database: "connected" });
}

// Health check used by reverse proxies and uptime monitors.
app.get("/health", healthHandler);
// Some cPanel/Apache proxies only forward /api/* to Node. Provide /api/health too.
app.get("/api/health", healthHandler);

// tRPC API handler
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
    onError: (opts) => {
      const { error, path } = opts;
      // Log the real error server-side but never send internal SQL details to the browser.
      console.error(`[tRPC error] ${path}:`, error);
    },
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// Global fallback: return a clean JSON error instead of leaking stack traces.
app.onError((err, c) => {
  console.error("[Unhandled error]", err);
  return c.json(
    {
      error: "Internal server error",
      message: env.isProduction
        ? "Something went wrong. Please try again later."
        : err.message,
    },
    500
  );
});

export default app;
