import { z } from "zod";
import { createRouter, tenantQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments, orders } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

function generateReceiptNumber(): string {
  const prefix = "RCP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const paymentRouter = createRouter({
  create: tenantQuery
    .input(z.object({
      orderId: z.number(), amount: z.number(),
      method: z.enum(["cash", "upi", "credit_card", "debit_card", "wallet", "net_banking", "split", "complimentary"]),
      tipAmount: z.number().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Verify order belongs to tenant
      const order = await db.select().from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (!order) throw new Error("Order not found");

      const [result] = await db.insert(payments).values({
        restaurantId: ctx.restaurantId!, orderId: input.orderId,
        amount: input.amount.toFixed(2), method: input.method,
        status: "completed", tipAmount: input.tipAmount?.toFixed(2) || "0.00",
        receiptNumber: generateReceiptNumber(),
        notes: input.notes || null,
      }).$returningId();

      // Update order payment status
      await db.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, input.orderId));

      return db.select().from(payments).where(eq(payments.id, result.id)).then((rows) => rows[0]);
    }),

  list: tenantQuery
    .input(z.object({
      orderId: z.number().optional(), method: z.string().optional(),
      status: z.string().optional(), limit: z.number().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(payments.restaurantId, ctx.restaurantId)];
      if (input?.orderId) conditions.push(eq(payments.orderId, input.orderId));
      if (input?.method) conditions.push(eq(payments.method, input.method as any));
      if (input?.status) conditions.push(eq(payments.status, input.status as any));
      return db.select().from(payments).where(and(...conditions))
        .orderBy(desc(payments.createdAt)).limit(input?.limit || 50);
    }),

  refund: tenantQuery
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const payment = await db.select().from(payments)
        .where(and(eq(payments.id, input.id), eq(payments.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (!payment) throw new Error("Payment not found");

      await db.update(payments).set({ status: "refunded", notes: input.reason || "Refunded" }).where(eq(payments.id, input.id));
      if (payment.orderId) {
        await db.update(orders).set({ paymentStatus: "refunded" }).where(eq(orders.id, payment.orderId));
      }
      return { success: true };
    }),

  getSummary: tenantQuery.query(async ({ ctx }) => {
    const db = getDb();
    const paymentList = await db.select().from(payments)
      .where(eq(payments.restaurantId, ctx.restaurantId));

    const byMethod: Record<string, number> = {};
    let totalAmount = 0;
    for (const p of paymentList) {
      const amount = parseFloat(p.amount?.toString() || "0");
      byMethod[p.method] = (byMethod[p.method] || 0) + amount;
      totalAmount += amount;
    }

    return { totalAmount, byMethod, count: paymentList.length };
  }),
});
