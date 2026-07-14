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
  boolean,
  json,
  index,
} from "drizzle-orm/mysql-core";
import { restaurants } from "./restaurants";
import { branches } from "./restaurants";

// ─────────────────────────────────────────────
// CATEGORIES (Menu categories)
// ─────────────────────────────────────────────
export const categories = mysqlTable(
  "categories",
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
    description: text("description"),
    image: text("image"),
    sortOrder: int("sort_order").default(0).notNull(),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),
    parentId: bigint("parent_id", { mode: "number", unsigned: true }).references(
      () => categories.id,
      { onDelete: "cascade" }
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("cat_restaurant_idx").on(table.restaurantId),
    branchIdx: index("cat_branch_idx").on(table.branchId),
    statusIdx: index("cat_status_idx").on(table.status),
    parentIdx: index("cat_parent_idx").on(table.parentId),
  })
);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─────────────────────────────────────────────
// MENU ITEMS
// ─────────────────────────────────────────────
export const menuItems = mysqlTable(
  "menu_items",
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
    categoryId: bigint("category_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    shortCode: varchar("short_code", { length: 50 }),
    image: text("image"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("5.00"),
    isVeg: boolean("is_veg").default(true).notNull(),
    isBestseller: boolean("is_bestseller").default(false).notNull(),
    isSpicy: boolean("is_spicy").default(false).notNull(),
    preparationTime: int("preparation_time").default(15),
    calories: int("calories"),
    allergens: json("allergens").$type<string[]>(),
    ingredients: json("ingredients").$type<string[]>(),
    variants: json("variants").$type<
      { name: string; price: number; isDefault: boolean }[]
    >(),
    addons: json("addons").$type<
      { name: string; price: number; category: string }[]
    >(),
    availability: mysqlEnum("availability", [
      "available",
      "unavailable",
      "out_of_stock",
    ])
      .default("available")
      .notNull(),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("item_restaurant_idx").on(table.restaurantId),
    branchIdx: index("item_branch_idx").on(table.branchId),
    categoryIdx: index("item_category_idx").on(table.categoryId),
    statusIdx: index("item_status_idx").on(table.status),
    availabilityIdx: index("item_availability_idx").on(table.availability),
    shortCodeIdx: index("item_shortcode_idx").on(table.shortCode),
    deletedIdx: index("item_deleted_idx").on(table.deletedAt),
    restaurantStatusIdx: index("item_rest_status_idx").on(table.restaurantId, table.status),
    restaurantCategoryIdx: index("item_rest_cat_idx").on(table.restaurantId, table.categoryId),
  })
);

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;
