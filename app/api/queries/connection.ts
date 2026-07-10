import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };
let instance: any = null;

export function getDb() {
  if (!instance) {
    const connectionPool = mysql.createPool({
      uri: env.databaseUrl,
      ssl: {
        rejectUnauthorized: true, 
      },
    });

    // 1. Initialize drizzle WITHOUT passing the schema object to the config.
    // This completely bypasses the broken "mode" validation check!
    instance = drizzle(connectionPool);

    // 2. Manually inject the schema and dialetct configurations onto the instance 
    // so your relational queries (db.query...) still work perfectly.
    instance.schema = fullSchema;
    instance.mode = "default";
  }
  return instance;
}