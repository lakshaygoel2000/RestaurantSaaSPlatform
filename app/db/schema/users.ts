import {
  mysqlTable,
  mysqlEnum,
  bigint,
  varchar,
  timestamp,
  int,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { restaurants } from "./restaurants";


// ─────────────────────────────────────────────
// USERS (Restaurant owner/admin accounts)
// ─────────────────────────────────────────────
// Replaces the previous OAuth/Kimi-managed users table.
// Each restaurant must have at least one owner user created during registration.
// ─────────────────────────────────────────────
export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["owner", "admin"]).default("owner").notNull(),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),

    emailVerified: boolean("email_verified").default(false).notNull(),
    lastSignInAt: timestamp("last_sign_in_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email),
    restaurantIdx: index("user_restaurant_idx").on(table.restaurantId),
  })
);


export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
