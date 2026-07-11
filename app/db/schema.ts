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
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// USERS (OAuth - managed by Kimi auth)
// ─────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

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
    status: mysqlEnum("status", ["active", "inactive", "suspended", "trial"])
      .default("trial")
      .notNull(),
    subscriptionPlan: mysqlEnum("subscription_plan", [
      "starter",
      "growth",
      "enterprise",
    ])
      .default("starter")
      .notNull(),
    subscriptionExpiry: timestamp("subscription_expiry"),
    trialEndsAt: timestamp("trial_ends_at"),
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
    statusIdx: index("status_idx").on(table.status),
    planIdx: index("plan_idx").on(table.subscriptionPlan),
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
    restaurantRoleIdx: index("staff_rest_role_idx").on(table.restaurantId, table.role),
    restaurantStatusIdx: index("staff_rest_status_idx").on(table.restaurantId, table.status),
  })
);

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

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

// ─────────────────────────────────────────────
// TABLES (Dining tables)
// ─────────────────────────────────────────────
export const tables = mysqlTable(
  "tables",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    branchId: bigint("branch_id", { mode: "number", unsigned: true }),
    name: varchar("name", { length: 50 }).notNull(),
    section: varchar("section", { length: 100 }).default("Main Hall"),
    capacity: int("capacity").default(4).notNull(),
    floorNumber: int("floor_number").default(1),
    positionX: int("position_x").default(0),
    positionY: int("position_y").default(0),
    shape: mysqlEnum("shape", ["rectangle", "circle", "square"]).default(
      "rectangle"
    ),
    qrCode: text("qr_code"),
    status: mysqlEnum("status", [
      "available",
      "occupied",
      "reserved",
      "cleaning",
      "merged",
    ])
      .default("available")
      .notNull(),
    mergedWith: json("merged_with").$type<number[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("table_restaurant_idx").on(table.restaurantId),
    branchIdx: index("table_branch_idx").on(table.branchId),
    statusIdx: index("table_status_idx").on(table.status),
    restaurantStatusIdx: index("table_rest_status_idx").on(table.restaurantId, table.status),
  })
);

export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────
export const orders = mysqlTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    branchId: bigint("branch_id", { mode: "number", unsigned: true }),
    tableId: bigint("table_id", { mode: "number", unsigned: true }),
    orderNumber: varchar("order_number", { length: 50 }).notNull(),
    orderType: mysqlEnum("order_type", [
      "dine_in",
      "takeaway",
      "delivery",
      "online",
    ])
      .default("dine_in")
      .notNull(),
    status: mysqlEnum("status", [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "served",
      "completed",
      "cancelled",
      "refunded",
    ])
      .default("pending")
      .notNull(),
    paymentStatus: mysqlEnum("payment_status", [
      "pending",
      "partial",
      "paid",
      "failed",
      "refunded",
    ])
      .default("pending")
      .notNull(),
    customerName: varchar("customer_name", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    customerCount: int("customer_count").default(1),
    stewardId: bigint("steward_id", { mode: "number", unsigned: true }),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00"),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default(
      "0.00"
    ),
    discountAmount: decimal("discount_amount", {
      precision: 12,
      scale: 2,
    }).default("0.00"),
    serviceCharge: decimal("service_charge", {
      precision: 12,
      scale: 2,
    }).default("0.00"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default(
      "0.00"
    ),
    paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default(
      "0.00"
    ),
    roundOff: decimal("round_off", { precision: 5, scale: 2 }).default("0.00"),
    notes: text("notes"),
    cancellationReason: text("cancellation_reason"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("order_restaurant_idx").on(table.restaurantId),
    branchIdx: index("order_branch_idx").on(table.branchId),
    tableIdx: index("order_table_idx").on(table.tableId),
    statusIdx: index("order_status_idx").on(table.status),
    paymentIdx: index("order_payment_idx").on(table.paymentStatus),
    orderNumIdx: index("order_num_idx").on(table.orderNumber),
    createdIdx: index("order_created_idx").on(table.createdAt),
    restaurantStatusIdx: index("order_rest_status_idx").on(table.restaurantId, table.status),
    restaurantCreatedIdx: index("order_rest_created_idx").on(table.restaurantId, table.createdAt),
  })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─────────────────────────────────────────────
// ORDER ITEMS
// ─────────────────────────────────────────────
export const orderItems = mysqlTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    menuItemId: bigint("menu_item_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    variant: varchar("variant", { length: 255 }),
    addons: json("addons").$type<{ name: string; price: number }[]>(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    kitchenStatus: mysqlEnum("kitchen_status", [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "served",
      "cancelled",
    ])
      .default("pending")
      .notNull(),
    specialInstructions: text("special_instructions"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index("oi_order_idx").on(table.orderId),
    kitchenIdx: index("oi_kitchen_idx").on(table.kitchenStatus),
  })
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────
export const payments = mysqlTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    method: mysqlEnum("method", [
      "cash",
      "upi",
      "credit_card",
      "debit_card",
      "wallet",
      "net_banking",
      "split",
      "complimentary",
    ])
      .default("cash")
      .notNull(),
    status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"])
      .default("completed")
      .notNull(),
    tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    transactionId: varchar("transaction_id", { length: 255 }),
    receiptNumber: varchar("receipt_number", { length: 50 }),
    processedBy: bigint("processed_by", { mode: "number", unsigned: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("pay_restaurant_idx").on(table.restaurantId),
    orderIdx: index("pay_order_idx").on(table.orderId),
    methodIdx: index("pay_method_idx").on(table.method),
    createdIdx: index("pay_created_idx").on(table.createdAt),
    restaurantCreatedIdx: index("pay_rest_created_idx").on(table.restaurantId, table.createdAt),
  })
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─────────────────────────────────────────────
// INVENTORY ITEMS
// ─────────────────────────────────────────────
export const inventoryItems = mysqlTable(
  "inventory_items",
  {
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    branchId: bigint("branch_id", { mode: "number", unsigned: true }),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    restaurantIdx: index("inv_restaurant_idx").on(table.restaurantId),
    statusIdx: index("inv_status_idx").on(table.status),
    supplierIdx: index("inv_supplier_idx").on(table.supplierId),
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
    id: serial("id").primaryKey(),
    restaurantId: bigint("restaurant_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
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
  })
);

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

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
