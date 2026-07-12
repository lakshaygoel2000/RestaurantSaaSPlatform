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
  json,
  index,
} from "drizzle-orm/mysql-core";

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
