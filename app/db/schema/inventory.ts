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
  index,
} from "drizzle-orm/mysql-core";
import { restaurants } from "./restaurants";
import { branches } from "./restaurants";

// ─────────────────────────────────────────────
// INVENTORY ITEMS
// ─────────────────────────────────────────────
export const inventoryItems = mysqlTable(
  "inventory_items",
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
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }),
    unit: varchar("unit", { length: 50 }).notNull(),
    currentStock: decimal("current_stock", { precision: 10, scale: 3 }).default(
      "0.000"
    ),
    minStock: decimal("min_stock", { precision: 10, scale: 3 }).default("0.000"),
    maxStock: decimal("max_stock", { precision: 10, scale: 3 }),
    reorderPoint: decimal("reorder_point", { precision: 10, scale: 3 }).default(
      "0.000"
    ),
    avgCost: decimal("avg_cost", { precision: 10, scale: 2 }).default("0.00"),
    lastPurchasedAt: timestamp("last_purchased_at"),
    supplierId: bigint("supplier_id", { mode: "number", unsigned: true }),
    location: varchar("location", { length: 100 }),
    expiryDate: date("expiry_date"),
    status: mysqlEnum("status", ["in_stock", "low_stock", "out_of_stock"])
      .default("in_stock")
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("inv_restaurant_idx").on(table.restaurantId),
    branchIdx: index("inv_branch_idx").on(table.branchId),
    categoryIdx: index("inv_category_idx").on(table.category),
    nameIdx: index("inv_name_idx").on(table.name),
    statusIdx: index("inv_status_idx").on(table.status),
    supplierIdx: index("inv_supplier_idx").on(table.supplierId),
    deletedIdx: index("inv_deleted_idx").on(table.deletedAt),
    restaurantStatusIdx: index("inv_rest_status_idx").on(table.restaurantId, table.status),
  })
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

// ─────────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────────
export const suppliers = mysqlTable(
  "suppliers",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    contactPerson: varchar("contact_person", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    address: text("address"),
    gstNumber: varchar("gst_number", { length: 50 }),
    category: varchar("category", { length: 100 }),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("supp_restaurant_idx").on(table.restaurantId),
    statusIdx: index("supp_status_idx").on(table.status),
    nameIdx: index("supp_name_idx").on(table.name),
  })
);

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
