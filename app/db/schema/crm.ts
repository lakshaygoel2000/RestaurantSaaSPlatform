import {
  mysqlTable,
  mysqlEnum,
  bigint,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  decimal,
  date,
  json,
  index,
} from "drizzle-orm/mysql-core";
import { restaurants } from "./restaurants";
import { branches } from "./restaurants";
import { staff } from "./staff";

// ─────────────────────────────────────────────
// CUSTOMERS (CRM)
// ─────────────────────────────────────────────
export const customers = mysqlTable(
  "customers",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
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
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("cust_restaurant_idx").on(table.restaurantId),
    phoneIdx: index("cust_phone_idx").on(table.phone),
    emailIdx: index("cust_email_idx").on(table.email),
    nameIdx: index("cust_name_idx").on(table.name),
    deletedIdx: index("cust_deleted_idx").on(table.deletedAt),
    loyaltyIdx: index("cust_loyalty_idx").on(table.loyaltyPoints),
    lastVisitIdx: index("cust_last_visit_idx").on(table.lastVisit),
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
    incurredBy: bigint("incurred_by", { mode: "number", unsigned: true }).references(
      () => staff.id,
      { onDelete: "set null" }
    ),
    expenseDate: date("expense_date").notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("exp_restaurant_idx").on(table.restaurantId),
    branchIdx: index("exp_branch_idx").on(table.branchId),
    statusIdx: index("exp_status_idx").on(table.status),
    categoryIdx: index("exp_category_idx").on(table.category),
    incurredByIdx: index("exp_incurred_by_idx").on(table.incurredBy),
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
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    staffId: bigint("staff_id", { mode: "number", unsigned: true }).references(
      () => staff.id,
      { onDelete: "set null" }
    ),
    userName: varchar("user_name", { length: 255 }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number", unsigned: true }),
    details: json("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("log_restaurant_idx").on(table.restaurantId),
    staffIdx: index("log_staff_idx").on(table.staffId),
    actionIdx: index("log_action_idx").on(table.action),
    entityIdx: index("log_entity_idx").on(table.entityType, table.entityId),
    createdIdx: index("log_created_idx").on(table.createdAt),
  })
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
