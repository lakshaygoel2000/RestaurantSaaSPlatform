import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: unknown = null;

export function getDb() {
  if (!instance) {
    const connectionPool = mysql.createPool({
      uri: env.databaseUrl,
      ssl: {
        rejectUnauthorized: true, 
      },
    });

    // Added mode: "default" to comply with Drizzle's relational query requirements
    instance = (drizzle as any)(connectionPool, {
      schema: fullSchema,
      mode: "default", 
    });
  }
  return instance;
}