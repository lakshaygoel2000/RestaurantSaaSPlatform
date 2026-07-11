import { serve } from "@hono/node-server";
import { serveStaticFiles } from "./lib/vite";
import app from "./boot";
import { env } from "./lib/env";
import { checkDatabaseConnection } from "./queries/connection";

const port = parseInt(process.env.PORT || "3000");

function assertProduction() {
  if (!env.isProduction) {
    throw new Error("Refusing to start server: NODE_ENV is not production");
  }
}

async function main() {
  assertProduction();

  // Verify the database is reachable before binding the HTTP port.
  // On cPanel/shared hosting this is the #1 cause of login failures.
  console.log("[Server] Verifying database connection...");
  const dbCheck = await checkDatabaseConnection();
  if (!dbCheck.ok) {
    console.error("[Server] Database connection failed:", dbCheck.error);
    console.error(
      "[Server] Hint: For cPanel/MySQL, set DATABASE_URL=mysql://user:pass@localhost:3306/dbname and DB_SSL_MODE=disabled"
    );
    throw new Error(`Database connection failed: ${dbCheck.error}`);
  }
  console.log("[Server] Database connection OK");

  serveStaticFiles(app);
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
