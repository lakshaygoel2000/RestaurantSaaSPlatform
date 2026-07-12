import { serve } from "@hono/node-server";
import { serveStaticFiles } from "./lib/vite";
import app from "./boot";
import { env } from "./lib/env";
import { checkDatabaseConnection } from "./queries/connection";

const port = parseInt(process.env.PORT || "8080");

function assertProduction() {
  if (!env.isProduction) {
    throw new Error("Refusing to start server: NODE_ENV is not production");
  }
}

function logStartupBanner() {
  console.log("==============================================");
  console.log(`[Server] RestaurantOS starting...`);
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Server] CWD: ${process.cwd()}`);
  console.log(`[Server] PORT: ${port}`);
  console.log(`[Server] DATABASE_URL set: ${env.databaseUrl ? "yes" : "NO"}`);
  console.log(`[Server] APP_ID set: ${env.appId ? "yes" : "NO"}`);
  console.log(`[Server] APP_SECRET set: ${env.appSecret ? "yes" : "NO"}`);
  console.log(`[Server] DB_SSL_MODE: ${process.env.DB_SSL_MODE || "(not set)"}`);
  console.log("==============================================");
}

async function main() {
  assertProduction();
  logStartupBanner();

  // Verify the database is reachable before binding the HTTP port.
  // On cPanel/shared hosting this is the #1 cause of login failures.
  console.log("[Server] Verifying database connection...");
  const dbCheck = await checkDatabaseConnection();
  if (!dbCheck.ok) {
    console.error("[Server] Database connection failed:", dbCheck.error);
    console.error(
      "[Server] Hint: For cPanel/MySQL, set DATABASE_URL=mysql://user:pass@localhost:3306/dbname and DB_SSL_MODE=disabled"
    );
    // Don't exit: keep the server running so /api/health can report the error
    // and the frontend files can still be served for diagnostics.
  } else {
    console.log("[Server] Database connection OK");
  }

  serveStaticFiles(app);
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
