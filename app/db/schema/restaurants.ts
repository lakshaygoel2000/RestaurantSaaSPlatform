import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  boolean,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// RESTAURANTS (Tenants)
// ─────────────────────────────────────────────
export const restaurants = mysqlTable(
  "restaurants",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    logo: text("logo"),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    pincode: varchar("pincode", { length: 10 }),
    gstNumber: varchar("gst_number", { length: 50 }),
    fssaiNumber: varchar("fssai_number", { length: 50 }),
    cuisineType: varchar("cuisine_type", { length: 100 }),
    description: text("description"),

    // Lifecycle & subscription
    status: mysqlEnum("status", ["pending", "trial", "active", "suspended"])
      .default("pending")
      .notNull(),
    subscriptionPlan: mysqlEnum("subscription_plan", [
      "basic",
      "standard",
      "premium",
    ])
      .default("basic")
      .notNull(),
    subscriptionStatus: mysqlEnum("subscription_status", [
      "trialing",
      "active",
      "past_due",
      "cancelled",
      "expired",
    ])
      .default("trialing")
      .notNull(),
    trialEndsAt: timestamp("trial_ends_at"),
    subscriptionExpiresAt: timestamp("subscription_expires_at"),
    paymentVerifiedAt: timestamp("payment_verified_at"),
    adminNotes: text("admin_notes"),

    workingHours: json("working_hours").$type<{
      mon: { open: string; close: string; closed: boolean };
      tue: { open: string; close: string; closed: boolean };
      wed: { open: string; close: string; closed: boolean };
      thu: { open: string; close: string; closed: boolean };
      fri: { open: string; close: string; closed: boolean };
      sat: { open: string; close: string; closed: boolean };
      sun: { open: string; close: string; closed: boolean };
    }>(),
    taxSettings: json("tax_settings").$type<{
      gstEnabled: boolean;
      gstRate: number;
      cgstRate: number;
      sgstRate: number;
      serviceChargeEnabled: boolean;
      serviceChargeRate: number;
    }>(),
    settings: json("settings").$type<{
      currency: string;
      language: string;
      timeZone: string;
      dateFormat: string;
      receiptFooter: string;
      autoPrintKOT: boolean;
      autoPrintBill: boolean;
    }>(),
    theme: json("theme").$type<{
      primaryColor: string;
      accentColor: string;
      darkMode: boolean;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("rest_slug_idx").on(table.slug),
    statusIdx: index("rest_status_idx").on(table.status),
    planIdx: index("rest_plan_idx").on(table.subscriptionPlan),
    subscriptionStatusIdx: index("rest_sub_status_idx").on(table.subscriptionStatus),
  })
);

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = typeof restaurants.$inferInsert;

// ─────────────────────────────────────────────
// BRANCHES (Multi-branch per restaurant)
// ─────────────────────────────────────────────
export const branches = mysqlTable(
  "branches",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    managerName: varchar("manager_name", { length: 255 }),
    managerPhone: varchar("manager_phone", { length: 20 }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("branch_restaurant_idx").on(table.restaurantId),
  })
);

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;
