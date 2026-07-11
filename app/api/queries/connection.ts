import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
// CORRECTION 1: Must use the promise-based wrapper for Drizzle's mysql2 driver
import mysql from "mysql2/promise"; 

const fullSchema = { ...schema, ...relations };

let instance: any;

export function getDb() {
  if (!instance) {
    // 1) Native mysql2 pool (avoid cPanel SSL string parsing crash)
    const connectionPool = mysql.createPool({
      ...(() => {
        const url = new URL(env.databaseUrl);
        return {
          host: url.hostname,
          // TiDB Cloud defaults to port 4000, fallback to 3306 if omitted
          port: url.port ? Number(url.port) : 4000, 
          user: url.username,
          // Safely decodes any special symbols (@, #, $) inside the password
          password: decodeURIComponent(url.password), 
          // CORRECTION 2: Isolates ONLY the 'dbname' by stripping away the trailing ?ssl=... parameters
          database: url.pathname.replace(/^\//, "").split("?")[0], 
        };
      })(),
      ssl: { rejectUnauthorized: true },
      // keep-alive reduces churn on shared hosting setups
      connectionLimit: 10,
    } as any);

    // 2) Initialize base Drizzle instance WITHOUT passing the config object 
    // to bypass the broken internal library validation loop
    const baseDb = drizzle(connectionPool as any);

    // 3) Manually map schema + relational query capabilities
    const dialect = (baseDb as any).dialect;
    const rootQueries = dialect.createRootQueries(baseDb as any, fullSchema as any);

    // CORRECTION 3: Explicitly attach metadata context so the app's query builders don't drop out
    Object.assign(baseDb as any, {
      schema: fullSchema,
      mode: "default",
      query: (rootQueries as any).query,
      queries: (rootQueries as any).queries,
    });

    instance = baseDb;
  }

  return instance;
}