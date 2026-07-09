import { z } from "zod";
import { createRouter, tenantQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems, tables } from "@db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

function generateOrderNumber(): string {
  const prefix = "ORD";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const orderRouter = createRouter({
  create: tenantQuery
    .input(z.object({
      branchId: z.number().optional(), tableId: z.number().optional(),
      orderType: z.enum(["dine_in", "takeaway", "delivery", "online"]).default("dine_in"),
      customerName: z.string().optional(), customerPhone: z.string().optional(),
      customerCount: z.number().default(1), stewardId: z.number().optional(),
      items: z.array(z.object({
        menuItemId: z.number(), name: z.string(), variant: z.string().optional(),
        addons: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
        quantity: z.number().min(1), unitPrice: z.number(),
        totalPrice: z.number(), specialInstructions: z.string().optional(),
      })).min(1, "At least one item is required"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { items, ...orderData } = input;
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * 0.05;
      const totalAmount = subtotal + taxAmount;

      const [orderResult] = await db.insert(orders).values({
        restaurantId: ctx.restaurantId, branchId: orderData.branchId || null,
        tableId: orderData.tableId || null, orderNumber: generateOrderNumber(),
        orderType: orderData.orderType, customerName: orderData.customerName || null,
        customerPhone: orderData.customerPhone || null, customerCount: orderData.customerCount,
        stewardId: orderData.stewardId || null, subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2), totalAmount: totalAmount.toFixed(2),
        paidAmount: "0.00", notes: orderData.notes || null, status: "confirmed", paymentStatus: "pending",
      }).$returningId();

      const orderId = orderResult.id;
      for (const item of items) {
        await db.insert(orderItems).values({
          orderId, menuItemId: item.menuItemId, name: item.name,
          variant: item.variant || null, addons: item.addons || null,
          quantity: item.quantity, unitPrice: item.unitPrice.toFixed(2),
          totalPrice: item.totalPrice.toFixed(2), kitchenStatus: "pending",
          specialInstructions: item.specialInstructions || null,
        });
      }

      if (orderData.tableId) {
        await db.update(tables).set({ status: "occupied", updatedAt: new Date() }).where(eq(tables.id, orderData.tableId));
      }

      const order = await db.select().from(orders).where(eq(orders.id, orderId)).then((rows) => rows[0]);
      const orderItemsList = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      return { ...order, items: orderItemsList };
    }),

  list: tenantQuery
    .input(z.object({
      branchId: z.number().optional(), status: z.string().optional(),
      orderType: z.string().optional(), tableId: z.number().optional(),
      dateFrom: z.string().optional(), dateTo: z.string().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(orders.restaurantId, ctx.restaurantId)];
      if (input?.branchId) conditions.push(eq(orders.branchId, input.branchId));
      if (input?.status) conditions.push(eq(orders.status, input.status as any));
      if (input?.orderType) conditions.push(eq(orders.orderType, input.orderType as any));
      if (input?.tableId) conditions.push(eq(orders.tableId, input.tableId));
      if (input?.dateFrom) conditions.push(gte(orders.createdAt, new Date(input.dateFrom)));
      if (input?.dateTo) conditions.push(lte(orders.createdAt, new Date(input.dateTo)));

      const orderList = await db.select().from(orders).where(and(...conditions))
        .orderBy(desc(orders.createdAt)).limit(input?.limit || 50);

      const ordersWithItems = await Promise.all(orderList.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      }));
      return ordersWithItems;
    }),

  getById: tenantQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db.select().from(orders)
        .where(and(eq(orders.id, input.id), eq(orders.restaurantId, ctx.restaurantId)))
        .then((rows) => rows[0] || null);
      if (!order) return null;
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.id));
      return { ...order, items };
    }),

  updateStatus: tenantQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const updateData: any = { status: input.status, updatedAt: new Date() };
      if (input.status === "completed") updateData.completedAt = new Date();

      // Verify ownership before update
      const existing = await db.select().from(orders)
        .where(and(eq(orders.id, input.id), eq(orders.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (!existing) throw new Error("Order not found");

      await db.update(orders).set(updateData).where(eq(orders.id, input.id));

      if (input.status === "completed" || input.status === "cancelled") {
        if (existing.tableId) {
          await db.update(tables).set({ status: "available", updatedAt: new Date() }).where(eq(tables.id, existing.tableId));
        }
      }
      return db.select().from(orders).where(eq(orders.id, input.id)).then((rows) => rows[0]);
    }),

  updateItemStatus: tenantQuery
    .input(z.object({ itemId: z.number(), kitchenStatus: z.enum(["pending", "accepted", "preparing", "ready", "served", "cancelled"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(orderItems).set({ kitchenStatus: input.kitchenStatus, updatedAt: new Date() }).where(eq(orderItems.id, input.itemId));
      return db.select().from(orderItems).where(eq(orderItems.id, input.itemId)).then((rows) => rows[0]);
    }),

  addItems: tenantQuery
    .input(z.object({
      orderId: z.number(),
      items: z.array(z.object({
        menuItemId: z.number(), name: z.string(), variant: z.string().optional(),
        addons: z.array(z.any()).optional(), quantity: z.number().min(1),
        unitPrice: z.number(), totalPrice: z.number(), specialInstructions: z.string().optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Verify order belongs to tenant
      const order = await db.select().from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (!order) throw new Error("Order not found");

      for (const item of input.items) {
        await db.insert(orderItems).values({
          orderId: input.orderId, menuItemId: item.menuItemId, name: item.name,
          variant: item.variant || null, addons: item.addons || null, quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2), totalPrice: item.totalPrice.toFixed(2),
          kitchenStatus: "pending", specialInstructions: item.specialInstructions || null,
        });
      }

      const allItems = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
      const subtotal = allItems.reduce((sum, item) => sum + parseFloat(item.totalPrice?.toString() || "0"), 0);
      const taxAmount = subtotal * 0.05;
      const totalAmount = subtotal + taxAmount;

      await db.update(orders).set({
        subtotal: subtotal.toFixed(2), taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2), updatedAt: new Date(),
      }).where(eq(orders.id, input.orderId));

      return db.select().from(orders).where(eq(orders.id, input.orderId)).then((rows) => rows[0]);
    }),

  getKitchenOrders: tenantQuery
    .input(z.object({ status: z.enum(["pending", "accepted", "preparing", "ready"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const orderConditions = [
        eq(orders.restaurantId, ctx.restaurantId),
        sql`${orders.status} IN ('confirmed', 'preparing', 'ready')`,
      ];
      const orderList = await db.select().from(orders).where(and(...orderConditions)).orderBy(orders.createdAt);

      const ordersWithItems = await Promise.all(orderList.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        const filteredItems = input?.status
          ? items.filter((item) => item.kitchenStatus === input.status)
          : items.filter((item) => ["pending", "accepted", "preparing", "ready"].includes(item.kitchenStatus));
        return { ...order, items: filteredItems };
      }));
      return ordersWithItems.filter((o) => o.items.length > 0);
    }),

  getStats: tenantQuery
    .input(z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(orders.restaurantId, ctx.restaurantId)];
      if (input?.dateFrom) conditions.push(gte(orders.createdAt, new Date(input.dateFrom)));
      if (input?.dateTo) conditions.push(lte(orders.createdAt, new Date(input.dateTo)));

      const allOrders = await db.select().from(orders).where(and(...conditions));
      const totalOrders = allOrders.length;
      const completedOrders = allOrders.filter((o) => o.status === "completed").length;
      const cancelledOrders = allOrders.filter((o) => o.status === "cancelled").length;
      const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount?.toString() || "0"), 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return { totalOrders, completedOrders, cancelledOrders, totalRevenue, avgOrderValue, pendingOrders: allOrders.filter((o) => !["completed", "cancelled", "refunded"].includes(o.status)).length };
    }),
});
