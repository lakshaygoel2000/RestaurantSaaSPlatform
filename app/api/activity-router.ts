import { z } from "zod";
import { createRouter, tenantQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { activityLogs } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const activityRouter = createRouter({
  list: tenantQuery
    .input(z.object({
      entityType: z.string().optional(), action: z.string().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(activityLogs.restaurantId, ctx.restaurantId)];
      if (input?.entityType) conditions.push(eq(activityLogs.entityType, input.entityType));
      if (input?.action) conditions.push(eq(activityLogs.action, input.action));
      return db.select().from(activityLogs).where(and(...conditions))
        .orderBy(desc(activityLogs.createdAt)).limit(input?.limit || 50);
    }),

  create: tenantQuery
    .input(z.object({
      userName: z.string().optional(), action: z.string().min(1),
      entityType: z.string().min(1), entityId: z.number().optional(),
      details: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(activityLogs).values({
        restaurantId: ctx.restaurantId!, userName: input.userName || ctx.staff?.name || "System",
        action: input.action, entityType: input.entityType,
        entityId: input.entityId || null, details: input.details || null,
      }).$returningId();
      return db.select().from(activityLogs).where(eq(activityLogs.id, result.id)).then((r) => r[0]);
    }),
});
