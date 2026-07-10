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

    // Use a direct fallback initialization assignment
    const config: any = {
      schema: fullSchema,
      mode: "default"
    };

    instance = drizzle(connectionPool, config);
  }
  return instance;
}