import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

// Declare instance as any to bypass duplicate package module types in your node_modules
let instance: any = null;

export function getDb() {
  if (!instance) {
    // 1. Create the native pool to fix the cPanel 'Unknown SSL profile' bug
    const connectionPool = mysql.createPool({
      uri: env.databaseUrl,
      ssl: {
        rejectUnauthorized: true, 
      },
    });

    // 2. Initialize a clean base Drizzle instance. 
    // Passing NO schema config here completely skips the broken library validation loop!
    const baseDb = drizzle(connectionPool);

    // 3. Inject the relational schema manually via Drizzle's internal property states.
    // This makes db.query.restaurants.findMany() work without triggering the validation crash.
    const customDb = Object.assign(baseDb, {
      schema: fullSchema,
      mode: "default",
      query: (baseDb as any).dialect.createRootQueries(baseDb, fullSchema),
    });

    instance = customDb;
  }
  return instance;
}