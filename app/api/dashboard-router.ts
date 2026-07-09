import { z } from "zod";
import { createRouter, tenantQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems, tables, staff } from "@db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export const dashboardRouter = createRouter({
  getKPIs: tenantQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rid = ctx.restaurantId;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const todayOrders = await db.select().from(orders)
      .where(and(eq(orders.restaurantId, rid), gte(orders.createdAt, todayStart)));

    const revenue = todayOrders.reduce((s, o) => s + parseFloat(o.totalAmount?.toString() || "0"), 0);
    const activeTables = await db.select().from(tables)
      .where(and(eq(tables.restaurantId, rid), eq(tables.status, "occupied")));
    const allTables = await db.select().from(tables).where(eq(tables.restaurantId, rid));
    const staffList = await db.select().from(staff).where(and(eq(staff.restaurantId, rid), eq(staff.status, "active")));
    const pendingItems = await db.select().from(orderItems)
      .where(and(eq(orderItems.kitchenStatus, "pending")));
    // Filter pending items to only those for this restaurant's orders
    const todayOrderIds = todayOrders.map((o) => o.id);
    const kitchenPending = pendingItems.filter((pi) => todayOrderIds.includes(pi.orderId));

    return {
      revenue, totalOrders: todayOrders.length,
      avgOrderValue: todayOrders.length > 0 ? revenue / todayOrders.length : 0,
      activeTables: activeTables.length, totalTables: allTables.length,
      staffOnDuty: staffList.length, pendingKitchenItems: kitchenPending.length,
    };
  }),

  getSalesChart: tenantQuery
    .input(z.object({ period: z.enum(["today", "week", "month"]).default("today") }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rid = ctx.restaurantId;
      const period = input?.period || "today";

      let dateStart = new Date();
      if (period === "today") dateStart.setHours(0, 0, 0, 0);
      else if (period === "week") dateStart.setDate(dateStart.getDate() - 7);
      else dateStart.setMonth(dateStart.getMonth() - 1);

      const orderList = await db.select().from(orders)
        .where(and(eq(orders.restaurantId, rid), gte(orders.createdAt, dateStart)));

      if (period === "today") {
        const hourly: Record<number, number> = {};
        for (let i = 0; i < 24; i++) hourly[i] = 0;
        orderList.forEach((o) => {
          const h = new Date(o.createdAt).getHours();
          hourly[h] += parseFloat(o.totalAmount?.toString() || "0");
        });
        return Object.entries(hourly).map(([h, v]) => ({
          label: `${h}:00`, value: v,
        }));
      }

      const daily: Record<string, number> = {};
      orderList.forEach((o) => {
        const d = new Date(o.createdAt).toLocaleDateString("en-IN");
        daily[d] = (daily[d] || 0) + parseFloat(o.totalAmount?.toString() || "0");
      });
      return Object.entries(daily).map(([d, v]) => ({ label: d, value: v }));
    }),

  getTopItems: tenantQuery
    .input(z.object({ limit: z.number().default(6) }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rid = ctx.restaurantId;
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const orderList = await db.select().from(orders)
        .where(and(eq(orders.restaurantId, rid), gte(orders.createdAt, todayStart)));
      const orderIds = orderList.map((o) => o.id);

      const allItems = await db.select().from(orderItems);
      const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

      allItems.filter((i) => orderIds.includes(i.orderId)).forEach((item) => {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        itemMap[item.name].quantity += item.quantity;
        itemMap[item.name].revenue += parseFloat(item.totalPrice?.toString() || "0");
      });

      return Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, input?.limit || 6);
    }),

  getRecentActivity: tenantQuery
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rid = ctx.restaurantId;
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const recentOrders = await db.select().from(orders)
        .where(and(eq(orders.restaurantId, rid), gte(orders.createdAt, todayStart)))
        .orderBy(desc(orders.createdAt)).limit(input?.limit || 10);

      return recentOrders.map((o) => ({
        id: o.id, title: `Order ${o.orderNumber}`,
        description: `${o.orderType?.replace("_", "-")} - ${o.customerName || "Walk-in"}`,
        amount: o.totalAmount, status: o.status,
        createdAt: o.createdAt,
      }));
    }),
});
