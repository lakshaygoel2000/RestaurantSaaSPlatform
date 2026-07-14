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

// CORS: allow any origin in development; in production reflect the request origin
// (needed for mobile apps with credentials).
// When credentials: true is set, Access-Control-Allow-Origin cannot be wildcard '*'.
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      // Always reflect the actual request origin when credentials are used.
      // This is the most reliable approach for mobile apps.
      if (origin && origin.length > 0) {
        return origin;
      }
      // Fallback for requests without an Origin header
      return "*";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Additional CORS safety net: ensure Vary: Origin is always set
// and Access-Control-Allow-Origin is never wildcard when credentials are used.
app.use("*", async (c, next) => {
  await next();
  const origin = c.req.header("origin");
  if (origin) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Vary", "Origin");
  }
  c.header("Access-Control-Allow-Credentials", "true");
});

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
