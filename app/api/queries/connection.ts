import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import mysql from "mysql2/promise";

const fullSchema = { ...schema, ...relations };

let instance: any;
let poolInstance: mysql.Pool | undefined;
let connectionTested = false;

function parseSslOption(value: string | null): any {
  if (!value) return undefined;

  // ?ssl=true / ?ssl=1  -> use SSL but allow self-signed certs (common on shared hosting)
  if (value === "true" || value === "1") {
    return { rejectUnauthorized: false };
  }

  // ?ssl=false / ?ssl=0 -> disable SSL
  if (value === "false" || value === "0") {
    return undefined;
  }

  // ?ssl={"rejectUnauthorized":true} -> TiDB Cloud style JSON
  try {
    return JSON.parse(value);
  } catch {
    // If we cannot parse it, safely fall back to permissive SSL
    return { rejectUnauthorized: false };
  }
}

function parseDatabaseUrl(urlString: string) {
  // Defensive parsing: try URL first, fallback to manual regex for edge cases
  // (e.g. passwords with unencoded special chars, or missing protocol)
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (err) {
    console.warn("[DB] Failed to parse DATABASE_URL with URL constructor, trying fallback parser:", err);
    const fallback = parseDatabaseUrlFallback(urlString);
    if (!fallback) {
      throw new Error(`Invalid DATABASE_URL: unable to parse connection string`);
    }
    return fallback;
  }

  const pathname = url.pathname || "";
  const database = pathname.replace(/^\//, "").split("?")[0];

  if (!database) {
    throw new Error(`Invalid DATABASE_URL: no database name found in path`);
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    sslQueryParam: url.searchParams.get("ssl"),
  };
}

function parseDatabaseUrlFallback(urlString: string) {
  // Fallback regex parser for mysql://user:pass@host:port/db
  const match = urlString.match(
    /^mysql:\/\/([^:@]+)(?::([^@]*))?@([^:\/]+)(?::(\d+))?\/([^?]+)(?:\?.*)?$/i
  );
  if (!match) return null;

  return {
    host: match[3],
    port: match[4] ? Number(match[4]) : 3306,
    user: decodeURIComponent(match[1]),
    password: match[2] ? decodeURIComponent(match[2]) : "",
    database: match[5],
    sslQueryParam: null,
  };
}

function buildPoolConfig() {
  const parsed = parseDatabaseUrl(env.databaseUrl);

  // Read SSL from the query string first, then allow DB_SSL_MODE to override.
  let ssl = parseSslOption(parsed.sslQueryParam);

  const sslMode = process.env.DB_SSL_MODE?.toLowerCase();
  if (sslMode === "disabled" || sslMode === "false" || sslMode === "no") {
    ssl = undefined;
  } else if (sslMode === "required") {
    ssl = { rejectUnauthorized: true };
  } else if (sslMode === "accept-invalid" || sslMode === "self-signed") {
    ssl = { rejectUnauthorized: false };
  }

  // TiDB Cloud serverless clusters require secure transport (TLS/SSL).
  // If SSL isn't explicitly configured, default to a permissive TLS mode
  // to prevent runtime failures: "Connections using insecure transport are prohibited".
  const looksLikeTidbCloud = /tidbcloud/i.test(parsed.host);
  // If DB_SSL_MODE is unset, or explicitly set to accept-invalid/self-signed,
  // keep the permissive TLS default for TiDB Cloud.
  if (!ssl && looksLikeTidbCloud && (!sslMode || sslMode === "accept-invalid" || sslMode === "self-signed")) {
    ssl = { rejectUnauthorized: false };
  }

  // cPanel / shared hosting: if host is localhost/127.0.0.1 and no explicit SSL mode,
  // default to disabled to avoid SSL handshake errors
  const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(parsed.host);
  if (!ssl && isLocalhost && !sslMode) {
    ssl = undefined;
  }

  const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT || "10");
  const connectTimeout = Number(process.env.DB_CONNECT_TIMEOUT || "10000");
  const acquireTimeout = Number(process.env.DB_ACQUIRE_TIMEOUT || "10000");
  const queueLimit = Number(process.env.DB_QUEUE_LIMIT || "20");

  return {
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    password: parsed.password,
    database: parsed.database,
    ssl,
    connectionLimit: Math.max(1, Math.min(connectionLimit, 50)),
    connectTimeout,
    acquireTimeout,
    waitForConnections: true,
    queueLimit: Math.max(0, queueLimit),
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };
}

async function testConnection(pool: mysql.Pool): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.query("SELECT 1");
  } finally {
    conn.release();
  }
}

export function getDb() {
  if (!instance) {
    const config = buildPoolConfig();

    // Don't log the password.
    const safeConfig = { ...config, password: "***" };
    console.log("[DB] Creating connection pool:", safeConfig);

    const connectionPool = mysql.createPool(config);
    poolInstance = connectionPool;

    // Use drizzle with the schema directly — mode "default" for standard mysql2 driver
    const baseDb = drizzle(connectionPool, { schema: fullSchema as any, mode: "default" });

    // Verify connectivity once on first use. This surfaces connection problems
    // early instead of showing a raw SQL error to the end user.
    if (!connectionTested) {
      connectionTested = true;
      testConnection(connectionPool)
        .then(() => console.log("[DB] Connection verified"))
        .catch((err) => {
          console.error("[DB] Connection test failed:", err);
        });
    }

    instance = baseDb;
  }

  return instance;
}

// Close the underlying pool. Useful for CLI scripts that need to exit cleanly.
export async function closeDb() {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = undefined;
    instance = undefined;
    connectionTested = false;
  }
}

// Exported so the server can verify the database is reachable before accepting traffic.
export async function checkDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    getDb();
    const pool = poolInstance;
    if (!pool) {
      return { ok: false, error: "Database pool not initialized" };
    }
    const conn = await pool.getConnection();
    try {
      await conn.query("SELECT 1");
      return { ok: true };
    } finally {
      conn.release();
    }
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

// Force-reset the pool (useful for retrying after a transient DB failure)
export async function resetDb() {
  await closeDb();
  return getDb();
}
