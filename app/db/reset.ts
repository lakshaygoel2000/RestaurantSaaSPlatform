import { getDb } from "../api/queries/connection";

async function reset() {
  const db = getDb();
  console.log("Dropping all existing tables...");

  const tables = [
    "activity_logs",
    "payments",
    "order_items",
    "orders",
    "inventory_items",
    "suppliers",
    "menu_items",
    "categories",
    "tables",
    "customers",
    "expenses",
    "staff",
    "branches",
    "restaurants",
    "users",
  ];

  for (const table of tables) {
    try {
      await db.execute(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`  Dropped ${table}`);
    } catch (err: any) {
      console.log(`  ${table}: ${err.message || "skipped"}`);
    }
  }

  console.log("All tables dropped.");
}

reset().catch((err) => {
  console.error("Reset error:", err);
  process.exit(1);
});
