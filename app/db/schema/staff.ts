import {
  mysqlTable,
  mysqlEnum,
  bigint,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  date,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { restaurants } from "./restaurants";
import { branches } from "./restaurants";
import { users } from "./users";


// ─────────────────────────────────────────────
// STAFF (Restaurant employees)
// ─────────────────────────────────────────────
export const staff = mysqlTable(
  "staff",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    branchId: bigint("branch_id", { mode: "number", unsigned: true }).references(
      () => branches.id,
      { onDelete: "set null" }
    ),
    userId: bigint("user_id", { mode: "number", unsigned: true }).references(
      () => users.id,
      { onDelete: "set null" }
    ),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    avatar: text("avatar"),
    role: mysqlEnum("role", [
      "owner",
      "manager",
      "cashier",
      "chef",
      "waiter",
      "delivery_staff",
      "accountant",
      "admin",
    ])
      .default("waiter")
      .notNull(),
    permissions: json("permissions").$type<string[]>(),
    salary: decimal("salary", { precision: 10, scale: 2 }),
    joiningDate: date("joining_date"),
    status: mysqlEnum("status", ["active", "inactive", "on_leave"])
      .default("active")
      .notNull(),
    username: varchar("username", { length: 255 }).notNull(),


    passwordHash: varchar("password_hash", { length: 255 }),
    address: text("address"),
    lastActiveAt: timestamp("last_active_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("staff_restaurant_idx").on(table.restaurantId),
    branchIdx: index("staff_branch_idx").on(table.branchId),
    roleIdx: index("staff_role_idx").on(table.role),
    statusIdx: index("staff_status_idx").on(table.status),
    usernameIdx: uniqueIndex("staff_username_idx").on(table.username),
    emailIdx: index("staff_email_idx").on(table.email),
    phoneIdx: index("staff_phone_idx").on(table.phone),
    deletedIdx: index("staff_deleted_idx").on(table.deletedAt),

    restaurantRoleIdx: index("staff_rest_role_idx").on(table.restaurantId, table.role),
    restaurantStatusIdx: index("staff_rest_status_idx").on(table.restaurantId, table.status),
  })
);

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;
