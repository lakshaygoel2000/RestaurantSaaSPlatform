import { getDb, closeDb } from "../api/queries/connection";
import { restaurants, users, staff } from "../db/schema";
import { like, eq } from "drizzle-orm";

async function main() {
  const db = getDb();

  const testRestaurants = await db
    .select({ id: restaurants.id, slug: restaurants.slug })
    .from(restaurants)
    .where(like(restaurants.slug, "test-reg-%"));

  console.log(`Found ${testRestaurants.length} test registration(s) to clean up.`);

  for (const r of testRestaurants) {
    await db.delete(staff).where(eq(staff.restaurantId, r.id));
    await db.delete(users).where(eq(users.restaurantId, r.id));
    await db.delete(restaurants).where(eq(restaurants.id, r.id));
    console.log(`  Deleted ${r.slug}`);
  }

  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  await closeDb().catch(() => {});
  process.exit(1);
});
