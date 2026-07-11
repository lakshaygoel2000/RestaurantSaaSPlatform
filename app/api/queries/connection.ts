import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import mysql from "mysql2";

const fullSchema = { ...schema, ...relations };

let instance: any;

export function getDb() {
  if (!instance) {
    // 1) Native mysql2 pool (avoid cPanel SSL string parsing crash)
    const connectionPool = mysql.createPool(
      {
        ...(() => {
          // env.databaseUrl is a TiDB/MySQL connection string.
          // mysql2 can parse it, but we need to ensure we pass ssl as an object.
          // We create a pool config by parsing the URL, and explicitly attach SSL options.
          const url = new URL(env.databaseUrl);
          return {
            host: url.hostname,
            port: url.port ? Number(url.port) : 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.replace(/^\//, ""),
          };
        })(),
        ssl: { rejectUnauthorized: true },
        // keep-alive reduces churn on shared hosting.
        connectionLimit: 10,
      } as any
    );

    // 2) Initialize base Drizzle instance WITHOUT passing mode/schema config.
    const baseDb = drizzle(connectionPool as any);

    // 3) Manually map schema + relational query capabilities.
    const dialect = baseDb.dialect;
    const rootQueries = dialect.createRootQueries(baseDb as any, fullSchema as any);

    // Attach query helpers so `db.query...` works across the app.
    Object.assign(baseDb as any, rootQueries);
    Object.assign(baseDb as any, {
      query: (rootQueries as any).query,
      queries: (rootQueries as any).queries,
    });

    instance = baseDb;
  }

  return instance;
}

