import { relations } from "drizzle-orm";
import {
  users,
  restaurants,
  branches,
  staff,
  categories,
  menuItems,
  tables,
  orders,
  orderItems,
  payments,
  inventoryItems,
  suppliers,
  customers,
  expenses,
  activityLogs,
} from "./schema";

// ─────────────────────────────────────────────
// USER RELATIONS
// ─────────────────────────────────────────────
export const usersRelations = relations(users, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [users.restaurantId],
    references: [restaurants.id],
  }),
}));

// ─────────────────────────────────────────────
// RESTAURANT RELATIONS
// ─────────────────────────────────────────────
export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  users: many(users),
  branches: many(branches),
  staff: many(staff),
  categories: many(categories),
  menuItems: many(menuItems),
  tables: many(tables),
  orders: many(orders),
  inventoryItems: many(inventoryItems),
  suppliers: many(suppliers),
  customers: many(customers),
  expenses: many(expenses),
  activityLogs: many(activityLogs),
}));

// ─────────────────────────────────────────────
// BRANCH RELATIONS
// ─────────────────────────────────────────────
export const branchesRelations = relations(branches, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [branches.restaurantId],
    references: [restaurants.id],
  }),
  staff: many(staff),
  tables: many(tables),
  orders: many(orders),
}));

// ─────────────────────────────────────────────
// STAFF RELATIONS
// ─────────────────────────────────────────────
export const staffRelations = relations(staff, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [staff.restaurantId],
    references: [restaurants.id],
  }),
  branch: one(branches, {
    fields: [staff.branchId],
    references: [branches.id],
  }),
}));

// ─────────────────────────────────────────────
// CATEGORY RELATIONS
// ─────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  menuItems: many(menuItems),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}));

// ─────────────────────────────────────────────
// MENU ITEM RELATIONS
// ─────────────────────────────────────────────
export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [menuItems.restaurantId],
    references: [restaurants.id],
  }),
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
}));

// ─────────────────────────────────────────────
// TABLE RELATIONS
// ─────────────────────────────────────────────
export const tablesRelations = relations(tables, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tables.restaurantId],
    references: [restaurants.id],
  }),
  branch: one(branches, {
    fields: [tables.branchId],
    references: [branches.id],
  }),
  orders: many(orders),
}));

// ─────────────────────────────────────────────
// ORDER RELATIONS
// ─────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

// ─────────────────────────────────────────────
// ORDER ITEM RELATIONS
// ─────────────────────────────────────────────
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

// ─────────────────────────────────────────────
// PAYMENT RELATIONS
// ─────────────────────────────────────────────
export const paymentsRelations = relations(payments, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [payments.restaurantId],
    references: [restaurants.id],
  }),
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

// ─────────────────────────────────────────────
// INVENTORY RELATIONS
// ─────────────────────────────────────────────
export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [inventoryItems.restaurantId],
    references: [restaurants.id],
  }),
  supplier: one(suppliers, {
    fields: [inventoryItems.supplierId],
    references: [suppliers.id],
  }),
}));

// ─────────────────────────────────────────────
// SUPPLIER RELATIONS
// ─────────────────────────────────────────────
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [suppliers.restaurantId],
    references: [restaurants.id],
  }),
  inventoryItems: many(inventoryItems),
}));

// ─────────────────────────────────────────────
// CUSTOMER RELATIONS
// ─────────────────────────────────────────────
export const customersRelations = relations(customers, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [customers.restaurantId],
    references: [restaurants.id],
  }),
}));

// ─────────────────────────────────────────────
// EXPENSE RELATIONS
// ─────────────────────────────────────────────
export const expensesRelations = relations(expenses, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [expenses.restaurantId],
    references: [restaurants.id],
  }),
  branch: one(branches, {
    fields: [expenses.branchId],
    references: [branches.id],
  }),
}));

// ─────────────────────────────────────────────
// ACTIVITY LOG RELATIONS
// ─────────────────────────────────────────────
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [activityLogs.restaurantId],
    references: [restaurants.id],
  }),
}));
