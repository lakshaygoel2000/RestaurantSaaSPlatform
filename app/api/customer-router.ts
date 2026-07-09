import { z } from "zod";
import { createRouter, tenantQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { customers } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const customerRouter = createRouter({
  list: tenantQuery
    .input(z.object({ search: z.string().optional(), tag: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(customers.restaurantId, ctx.restaurantId)];
      const items = await db.select().from(customers).where(and(...conditions)).orderBy(desc(customers.totalSpent));
      if (input?.search) {
        const s = input.search.toLowerCase();
        return items.filter((c) => c.name.toLowerCase().includes(s) || c.phone?.includes(s));
      }
      return items;
    }),

  create: tenantQuery
    .input(z.object({
      name: z.string().min(1), phone: z.string().optional(),
      email: z.string().optional(), dob: z.string().optional(),
      anniversary: z.string().optional(), tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(customers).values({
        restaurantId: ctx.restaurantId, name: input.name,
        phone: input.phone || null, email: input.email || null,
        dob: input.dob ? new Date(input.dob) : null,
        anniversary: input.anniversary ? new Date(input.anniversary) : null,
        tags: input.tags || null, notes: input.notes || null,
      }).$returningId();
      return db.select().from(customers).where(eq(customers.id, result.id)).then((r) => r[0]);
    }),

  update: tenantQuery
    .input(z.object({
      id: z.number(), name: z.string().optional(), phone: z.string().optional(),
      email: z.string().optional(), tags: z.array(z.string()).optional(),
      loyaltyPoints: z.number().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const db = getDb();
      const existing = await db.select().from(customers)
        .where(and(eq(customers.id, id), eq(customers.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (!existing) throw new Error("Customer not found");
      await db.update(customers).set(data).where(eq(customers.id, id));
      return db.select().from(customers).where(eq(customers.id, id)).then((r) => r[0]);
    }),

  delete: tenantQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(customers).where(and(eq(customers.id, input.id), eq(customers.restaurantId, ctx.restaurantId)));
      return { success: true };
    }),
});
