import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  // Resolve the public folder relative to the bundled server file so it works
  // regardless of the process working directory (important on cPanel).
  const distPath = path.resolve(__dirname, "../dist/public");

  if (!fs.existsSync(distPath)) {
    console.warn(`[Static] dist/public not found at ${distPath}. Frontend will not be served.`);
  }

  app.use("*", async (c, next) => {
    // Only handle GET/HEAD requests for static files.
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      return next();
    }

    const urlPath = new URL(c.req.url).pathname;
    // Never serve static files for API routes.
    if (urlPath.startsWith("/api/") || urlPath === "/api") {
      return next();
    }

    const filePath = path.join(distPath, decodeURIComponent(urlPath));

    // Security: prevent directory traversal outside dist/public.
    if (!filePath.startsWith(distPath + path.sep) && filePath !== distPath) {
      return next();
    }

    // Serve the file if it exists and is not a directory.
    try {
      const stat = await fs.promises.stat(filePath);
      if (stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || "application/octet-stream";
        c.header("Content-Type", contentType);
        return c.body(fs.createReadStream(filePath) as any);
      }
    } catch {
      // File doesn't exist; fall through to SPA index.html.
    }

    return next();
  });

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return c.json(
        { error: "Frontend not built", path: distPath },
        500
      );
    }
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
  ".webp": "image/webp",
};
