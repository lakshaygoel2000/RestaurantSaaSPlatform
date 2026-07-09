import { z } from "zod";
import { createRouter, tenantQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { expenses } from "@db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const expenseRouter = createRouter({
  list: tenantQuery
    .input(z.object({
      category: z.string().optional(), status: z.string().optional(),
      dateFrom: z.string().optional(), dateTo: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(expenses.restaurantId, ctx.restaurantId)];
      if (input?.category) conditions.push(eq(expenses.category, input.category));
      if (input?.status) conditions.push(eq(expenses.status, input.status as any));
      if (input?.dateFrom) conditions.push(gte(expenses.expenseDate, new Date(input.dateFrom)));
      if (input?.dateTo) conditions.push(lte(expenses.expenseDate, new Date(input.dateTo)));
      return db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.createdAt));
    }),

  create: tenantQuery
    .input(z.object({
      branchId: z.number().optional(), category: z.string().min(1),
      description: z.string().optional(), amount: z.string().min(1),
      paymentMethod: z.enum(["cash", "upi", "card", "bank_transfer"]).default("cash"),
      expenseDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(expenses).values({
        restaurantId: ctx.restaurantId!, branchId: input.branchId || null,
        category: input.category, description: input.description || null,
        amount: input.amount, paymentMethod: input.paymentMethod,
        expenseDate: new Date(input.expenseDate),
        status: "pending",
      }).$returningId();
      return db.select().from(expenses).where(eq(expenses.id, result.id)).then((r) => r[0]);
    }),

  updateStatus: tenantQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db.select().from(expenses)
        .where(and(eq(expenses.id, input.id), eq(expenses.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (!existing) throw new Error("Expense not found");
      await db.update(expenses).set({ status: input.status }).where(eq(expenses.id, input.id));
      return { success: true };
    }),

  delete: tenantQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(expenses).where(and(eq(expenses.id, input.id), eq(expenses.restaurantId, ctx.restaurantId)));
      return { success: true };
    }),
});
