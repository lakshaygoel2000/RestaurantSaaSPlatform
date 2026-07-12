import "dotenv/config";
import { getDb, closeDb } from "../api/queries/connection";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const conn = await mysql.createConnection(url);
  try {
    const [rows] = await conn.query("SHOW TABLES");
    const tableNames = (rows as any[]).map((r) => Object.values(r)[0] as string);

    if (tableNames.length === 0) {
      console.log("No tables to drop.");
      return;
    }

    console.log(`Dropping ${tableNames.length} tables: ${tableNames.join(", ")}`);

    // Disable foreign key checks to allow dropping tables with dependencies.
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of tableNames) {
      await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`  Dropped ${table}`);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Database reset complete.");
  } finally {
    await conn.end();
    await closeDb().catch(() => {});
  }
}

main().catch(async (err) => {
  console.error("Reset failed:", err);
  await closeDb().catch(() => {});
  process.exit(1);
});
