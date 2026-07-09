import { z } from "zod";
import { createRouter, tenantQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tables } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const tableRouter = createRouter({
  create: tenantQuery
    .input(z.object({
      branchId: z.number().optional(), name: z.string().min(1, "Table name is required"),
      section: z.string().default("Main Hall"), capacity: z.number().min(1).default(4),
      floorNumber: z.number().default(1), positionX: z.number().default(0),
      positionY: z.number().default(0),
      shape: z.enum(["rectangle", "circle", "square"]).default("rectangle"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(tables).values({
        restaurantId: ctx.restaurantId, branchId: input.branchId || null,
        name: input.name, section: input.section, capacity: input.capacity,
        floorNumber: input.floorNumber, positionX: input.positionX,
        positionY: input.positionY, shape: input.shape, status: "available",
      }).$returningId();
      return db.select().from(tables).where(eq(tables.id, result.id)).then((rows) => rows[0]);
    }),

  list: tenantQuery
    .input(z.object({
      branchId: z.number().optional(), section: z.string().optional(),
      floorNumber: z.number().optional(), status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(tables.restaurantId, ctx.restaurantId)];
      if (input?.branchId) conditions.push(eq(tables.branchId, input.branchId));
      if (input?.section) conditions.push(eq(tables.section, input.section));
      if (input?.floorNumber !== undefined) conditions.push(eq(tables.floorNumber, input.floorNumber));
      if (input?.status) conditions.push(eq(tables.status, input.status as any));
      return db.select().from(tables).where(and(...conditions)).orderBy(tables.section, tables.name);
    }),

  getSections: tenantQuery.query(async ({ ctx }) => {
    const db = getDb();
    const allTables = await db.select({ section: tables.section }).from(tables)
      .where(eq(tables.restaurantId, ctx.restaurantId));
    return [...new Set(allTables.map((t) => t.section))];
  }),

  update: tenantQuery
    .input(z.object({
      id: z.number(), name: z.string().optional(), section: z.string().optional(),
      capacity: z.number().optional(), floorNumber: z.number().optional(),
      positionX: z.number().optional(), positionY: z.number().optional(),
      shape: z.enum(["rectangle", "circle", "square"]).optional(),
      status: z.enum(["available", "occupied", "reserved", "cleaning", "merged"]).optional(),
      mergedWith: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const db = getDb();
      // Verify ownership
      const existing = await db.select().from(tables)
        .where(and(eq(tables.id, id), eq(tables.restaurantId, ctx.restaurantId))).then((r) => r[0]);
      if (!existing) throw new Error("Table not found");

      const updateData: any = { ...data };
      if (data.mergedWith !== undefined) updateData.mergedWith = JSON.stringify(data.mergedWith);
      await db.update(tables).set(updateData).where(eq(tables.id, id));
      return db.select().from(tables).where(eq(tables.id, id)).then((rows) => rows[0]);
    }),

  updateStatus: tenantQuery
    .input(z.object({ id: z.number(), status: z.enum(["available", "occupied", "reserved", "cleaning", "merged"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Verify ownership
      const existing = await db.select().from(tables)
        .where(and(eq(tables.id, input.id), eq(tables.restaurantId, ctx.restaurantId))).then((r) => r[0]);
      if (!existing) throw new Error("Table not found");

      await db.update(tables).set({ status: input.status, updatedAt: new Date() }).where(eq(tables.id, input.id));
      return db.select().from(tables).where(eq(tables.id, input.id)).then((rows) => rows[0]);
    }),

  delete: tenantQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(tables).where(and(eq(tables.id, input.id), eq(tables.restaurantId, ctx.restaurantId)));
      return { success: true };
    }),
});
