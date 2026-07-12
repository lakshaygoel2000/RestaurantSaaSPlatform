import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  decimal,
  date,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// STAFF (Restaurant employees)
// ─────────────────────────────────────────────
export const staff = mysqlTable(
  "staff",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    branchId: bigint("branch_id", { mode: "number", unsigned: true }),
    userId: bigint("user_id", { mode: "number", unsigned: true }),
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
    username: varchar("username", { length: 255 }).unique(),
    passwordHash: varchar("password_hash", { length: 255 }),
    address: text("address"),
    lastActiveAt: timestamp("last_active_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("staff_restaurant_idx").on(table.restaurantId),
    branchIdx: index("staff_branch_idx").on(table.branchId),
    roleIdx: index("staff_role_idx").on(table.role),
    statusIdx: index("staff_status_idx").on(table.status),
    usernameIdx: uniqueIndex("staff_username_idx").on(table.username),
    restaurantRoleIdx: index("staff_rest_role_idx").on(table.restaurantId, table.role),
    restaurantStatusIdx: index("staff_rest_status_idx").on(table.restaurantId, table.status),
  })
);

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;
