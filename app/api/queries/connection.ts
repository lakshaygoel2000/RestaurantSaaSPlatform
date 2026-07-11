import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
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

    // 3) Manually map schema + relational query capabilities.
    // Some Drizzle builds don't expose `dialect.createRootQueries`.
    const dialect = (baseDb as any).dialect;
    const createRootQueries = (dialect as any)?.createRootQueries;

    if (typeof createRootQueries === "function") {
      const rootQueries = createRootQueries(baseDb as any, fullSchema as any);

      // Attach query helpers so `db.query...` works across the app.
      Object.assign(baseDb as any, rootQueries);
      Object.assign(baseDb as any, {
        query: (rootQueries as any).query,
        queries: (rootQueries as any).queries,
      });
    } else {
      // Fallback: keep baseDb working for non-relational queries.
      // Relational `db.query.*` will be unavailable on Drizzle builds without root query helpers.
      Object.assign(baseDb as any, { schema: fullSchema });
    }


    instance = baseDb;
  }

  return instance;
}

