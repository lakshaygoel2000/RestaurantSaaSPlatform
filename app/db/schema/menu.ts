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
  boolean,
  json,
  index,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// CATEGORIES (Menu categories)
// ─────────────────────────────────────────────
export const categories = mysqlTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    branchId: bigint("branch_id", { mode: "number", unsigned: true }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    image: text("image"),
    sortOrder: int("sort_order").default(0).notNull(),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),
    parentId: bigint("parent_id", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("cat_restaurant_idx").on(table.restaurantId),
    statusIdx: index("cat_status_idx").on(table.status),
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
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    branchId: bigint("branch_id", { mode: "number", unsigned: true }),
    categoryId: bigint("category_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("item_restaurant_idx").on(table.restaurantId),
    categoryIdx: index("item_category_idx").on(table.categoryId),
    statusIdx: index("item_status_idx").on(table.status),
    availabilityIdx: index("item_availability_idx").on(table.availability),
    restaurantStatusIdx: index("item_rest_status_idx").on(table.restaurantId, table.status),
    restaurantCategoryIdx: index("item_rest_cat_idx").on(table.restaurantId, table.categoryId),
  })
);

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;
