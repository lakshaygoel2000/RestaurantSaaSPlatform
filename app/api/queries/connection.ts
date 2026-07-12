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

function buildPoolConfig() {
  const url = new URL(env.databaseUrl);

  // Read SSL from the query string first, then allow DB_SSL_MODE to override.
  let ssl = parseSslOption(url.searchParams.get("ssl"));

  const sslMode = process.env.DB_SSL_MODE?.toLowerCase();
  if (sslMode === "disabled" || sslMode === "false" || sslMode === "no") {
    ssl = undefined;
  } else if (sslMode === "required") {
    ssl = { rejectUnauthorized: true };
  } else if (sslMode === "accept-invalid" || sslMode === "self-signed") {
    ssl = { rejectUnauthorized: false };
  }

  return {
    host: url.hostname,
    // Standard MySQL default is 3306. Only specify a port in the URL when the host requires it.
    port: url.port ? Number(url.port) : 3306,
    user: url.username,
    // Safely decodes special symbols (@, #, $) inside the password.
    password: decodeURIComponent(url.password),
    // Isolates ONLY the dbname by stripping away trailing ?ssl=... parameters.
    database: url.pathname.replace(/^\//, "").split("?")[0],
    ssl,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || "10"),
    // Keep idle connections alive on shared hosting to reduce handshake churn.
    enableKeepAlive: true,
  };
}

async function testConnection(pool: mysql.Pool) {
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

    const baseDb = drizzle(connectionPool as any);

    const dialect = (baseDb as any).dialect;
    const createRootQueries = (dialect as any)?.createRootQueries;

    if (typeof createRootQueries === "function") {
      const rootQueries = createRootQueries(baseDb as any, fullSchema as any);
      Object.assign(baseDb as any, rootQueries);
      Object.assign(baseDb as any, {
        query: (rootQueries as any).query,
        queries: (rootQueries as any).queries,
      });
    } else {
      Object.assign(baseDb as any, { schema: fullSchema });
    }

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
