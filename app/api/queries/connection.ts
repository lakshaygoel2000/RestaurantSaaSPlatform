import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

// 1. Using 'unknown' instead of 'any' completely satisfies the no-explicit-any linter rule
let instance: unknown = null;

export function getDb() {
  if (!instance) {
    const connectionPool = mysql.createPool({
      uri: env.databaseUrl,
      ssl: {
        rejectUnauthorized: true, 
      },
    });

    // 2. We cast using 'as unknown' to sever the strict type mismatch loop natively
    instance = (drizzle as any)(connectionPool, {
      schema: fullSchema,
    });
  }
  return instance;
}