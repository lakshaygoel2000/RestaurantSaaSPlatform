import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  date,
  json,
  index,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// CUSTOMERS (CRM)
// ─────────────────────────────────────────────
export const customers = mysqlTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    dob: date("dob"),
    anniversary: date("anniversary"),
    visitCount: int("visit_count").default(0),
    totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default(
      "0.00"
    ),
    lastVisit: timestamp("last_visit"),
    preferences: json("preferences").$type<string[]>(),
    allergies: json("allergies").$type<string[]>(),
    tags: json("tags").$type<string[]>(),
    loyaltyPoints: int("loyalty_points").default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("cust_restaurant_idx").on(table.restaurantId),
    phoneIdx: index("cust_phone_idx").on(table.phone),
  })
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────
export const expenses = mysqlTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    branchId: bigint("branch_id", { mode: "number", unsigned: true }),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: mysqlEnum("payment_method", [
      "cash",
      "upi",
      "card",
      "bank_transfer",
    ])
      .default("cash")
      .notNull(),
    receiptUrl: text("receipt_url"),
    incurredBy: bigint("incurred_by", { mode: "number", unsigned: true }),
    expenseDate: date("expense_date").notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("exp_restaurant_idx").on(table.restaurantId),
    dateIdx: index("exp_date_idx").on(table.expenseDate),
  })
);

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─────────────────────────────────────────────
// ACTIVITY LOGS (Audit)
// ─────────────────────────────────────────────
export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    staffId: bigint("staff_id", { mode: "number", unsigned: true }),
    userName: varchar("user_name", { length: 255 }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number", unsigned: true }),
    details: json("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("log_restaurant_idx").on(table.restaurantId),
    createdIdx: index("log_created_idx").on(table.createdAt),
  })
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
