import { z } from "zod";
import { createRouter, inventoryQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { inventoryItems, suppliers } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const inventoryRouter = createRouter({
  getItems: inventoryQuery
    .input(
      z
        .object({
          branchId: z.number().optional(),
          category: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(inventoryItems.restaurantId, ctx.restaurantId)];
      if (input?.branchId) conditions.push(eq(inventoryItems.branchId, input.branchId));
      if (input?.category) conditions.push(eq(inventoryItems.category, input.category));
      if (input?.status) conditions.push(eq(inventoryItems.status, input.status as any));

      const items = await db
        .select()
        .from(inventoryItems)
        .where(and(...conditions))
        .orderBy(desc(inventoryItems.updatedAt));

      if (input?.search) {
        const s = input.search.toLowerCase();
        return items.filter(
          (i) =>
            i.name.toLowerCase().includes(s) ||
            i.category?.toLowerCase().includes(s)
        );
      }
      return items;
    }),

  createItem: inventoryQuery
    .input(
      z.object({
        branchId: z.number().optional(),
        name: z.string().min(1),
        category: z.string().optional(),
        unit: z.string().min(1),
        currentStock: z.string().optional(),
        minStock: z.string().optional(),
        maxStock: z.string().optional(),
        reorderPoint: z.string().optional(),
        avgCost: z.string().optional(),
        supplierId: z.number().optional(),
        location: z.string().optional(),
        expiryDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db
        .insert(inventoryItems)
        .values({
          restaurantId: ctx.restaurantId,
          branchId: input.branchId || null,
          name: input.name,
          category: input.category || null,
          unit: input.unit,
          currentStock: input.currentStock || "0",
          minStock: input.minStock || "0",
          maxStock: input.maxStock || null,
          reorderPoint: input.reorderPoint || "0",
          avgCost: input.avgCost || "0",
          supplierId: input.supplierId || null,
          location: input.location || null,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          status: "in_stock",
        })
        .$returningId();
      return db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, result.id))
        .then((r) => r[0]);
    }),

  updateItem: inventoryQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().optional(),
        currentStock: z.string().optional(),
        minStock: z.string().optional(),
        avgCost: z.string().optional(),
        supplierId: z.number().optional(),
        location: z.string().optional(),
        status: z.enum(["in_stock", "low_stock", "out_of_stock"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const db = getDb();
      const existing = await db
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (!existing) throw new Error("Item not found");
      await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id));
      return db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, id))
        .then((r) => r[0]);
    }),

  deleteItem: inventoryQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(inventoryItems)
        .where(and(eq(inventoryItems.id, input.id), eq(inventoryItems.restaurantId, ctx.restaurantId)));
      return { success: true };
    }),

  getSuppliers: inventoryQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(suppliers).where(eq(suppliers.restaurantId, ctx.restaurantId));
  }),

  createSupplier: inventoryQuery
    .input(
      z.object({
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        gstNumber: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db
        .insert(suppliers)
        .values({
          restaurantId: ctx.restaurantId,
          name: input.name,
          contactPerson: input.contactPerson || null,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          gstNumber: input.gstNumber || null,
          category: input.category || null,
          status: "active",
        })
        .$returningId();
      return db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, result.id))
        .then((r) => r[0]);
    }),
});
