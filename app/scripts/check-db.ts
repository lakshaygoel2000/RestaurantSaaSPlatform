import { getDb, closeDb } from "../api/queries/connection";
import { restaurants, staff, users, menuItems } from "../db/schema";
import { count } from "drizzle-orm";

async function main() {
  const db = getDb();
  const [r, s, u, m] = await Promise.all([
    db.select({ count: count() }).from(restaurants),
    db.select({ count: count() }).from(staff),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(menuItems),
  ]);
  console.log({ restaurants: r[0].count, staff: s[0].count, users: u[0].count, menuItems: m[0].count });
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  await closeDb().catch(() => {});
  process.exit(1);
});
