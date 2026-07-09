import { z } from "zod";
import { createRouter, tenantQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { categories, menuItems } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const menuRouter = createRouter({
  createCategory: tenantQuery
    .input(
      z.object({
        branchId: z.number().optional(),
        name: z.string().min(1, "Category name is required"),
        description: z.string().optional(),
        image: z.string().optional(),
        sortOrder: z.number().default(0),
        parentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db
        .insert(categories)
        .values({
          restaurantId: ctx.restaurantId,
          branchId: input.branchId || null,
          name: input.name,
          description: input.description || null,
          image: input.image || null,
          sortOrder: input.sortOrder,
          parentId: input.parentId || null,
          status: "active",
        })
        .$returningId();
      return db.select().from(categories).where(eq(categories.id, result.id)).then((rows) => rows[0]);
    }),

  getCategories: tenantQuery
    .input(z.object({ branchId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(categories.restaurantId, ctx.restaurantId), eq(categories.status, "active")];
      if (input?.branchId) conditions.push(eq(categories.branchId, input.branchId));
      return db.select().from(categories).where(and(...conditions)).orderBy(categories.sortOrder);
    }),

  updateCategory: tenantQuery
    .input(z.object({
      id: z.number(), name: z.string().optional(), description: z.string().optional(),
      image: z.string().optional(), sortOrder: z.number().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const db = getDb();
      // Verify ownership
      const existing = await db.select().from(categories).where(and(eq(categories.id, id), eq(categories.restaurantId, ctx.restaurantId))).then((r) => r[0]);
      if (!existing) throw new Error("Category not found");
      await db.update(categories).set(data).where(eq(categories.id, id));
      return db.select().from(categories).where(eq(categories.id, id)).then((rows) => rows[0]);
    }),

  deleteCategory: tenantQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(categories).set({ status: "inactive" }).where(
        and(eq(categories.id, input.id), eq(categories.restaurantId, ctx.restaurantId))
      );
      return { success: true };
    }),

  createMenuItem: tenantQuery
    .input(z.object({
      branchId: z.number().optional(), categoryId: z.number(),
      name: z.string().min(1, "Item name is required"), description: z.string().optional(),
      shortCode: z.string().optional(), image: z.string().optional(),
      price: z.string().min(1, "Price is required"), costPrice: z.string().optional(),
      taxRate: z.string().optional(), isVeg: z.boolean().default(true),
      isBestseller: z.boolean().default(false), isSpicy: z.boolean().default(false),
      preparationTime: z.number().default(15), calories: z.number().optional(),
      allergens: z.array(z.string()).optional(), ingredients: z.array(z.string()).optional(),
      variants: z.array(z.any()).optional(), addons: z.array(z.any()).optional(),
      availability: z.enum(["available", "unavailable", "out_of_stock"]).default("available"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(menuItems).values({
        restaurantId: ctx.restaurantId, branchId: input.branchId || null,
        categoryId: input.categoryId, name: input.name,
        description: input.description || null, shortCode: input.shortCode || null,
        image: input.image || null, price: input.price,
        costPrice: input.costPrice || null, taxRate: input.taxRate || "5.00",
        isVeg: input.isVeg, isBestseller: input.isBestseller,
        isSpicy: input.isSpicy, preparationTime: input.preparationTime,
        calories: input.calories || null, allergens: input.allergens || null,
        ingredients: input.ingredients || null, variants: input.variants || null,
        addons: input.addons || null, availability: input.availability, status: "active",
      }).$returningId();
      return db.select().from(menuItems).where(eq(menuItems.id, result.id)).then((rows) => rows[0]);
    }),

  getMenuItems: tenantQuery
    .input(z.object({
      branchId: z.number().optional(), categoryId: z.number().optional(),
      search: z.string().optional(), availability: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(menuItems.restaurantId, ctx.restaurantId)];
      if (input?.branchId) conditions.push(eq(menuItems.branchId, input.branchId));
      if (input?.categoryId) conditions.push(eq(menuItems.categoryId, input.categoryId));
      if (input?.availability) conditions.push(eq(menuItems.availability, input.availability as any));
      const items = await db.select().from(menuItems).where(and(...conditions));
      if (input?.search) {
        const s = input.search.toLowerCase();
        return items.filter((item) => item.name.toLowerCase().includes(s) || item.shortCode?.toLowerCase().includes(s));
      }
      return items;
    }),

  updateMenuItem: tenantQuery
    .input(z.object({
      id: z.number(), name: z.string().optional(), description: z.string().optional(),
      shortCode: z.string().optional(), image: z.string().optional(),
      price: z.string().optional(), costPrice: z.string().optional(),
      taxRate: z.string().optional(), isVeg: z.boolean().optional(),
      isBestseller: z.boolean().optional(), isSpicy: z.boolean().optional(),
      preparationTime: z.number().optional(),
      availability: z.enum(["available", "unavailable", "out_of_stock"]).optional(),
      status: z.enum(["active", "inactive"]).optional(),
      categoryId: z.number().optional(), variants: z.array(z.any()).optional(),
      addons: z.array(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, variants, addons, ...data } = input;
      const db = getDb();
      const existing = await db.select().from(menuItems)
        .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, ctx.restaurantId))).then((r) => r[0]);
      if (!existing) throw new Error("Menu item not found");
      const updateData: any = { ...data };
      if (variants !== undefined) updateData.variants = variants;
      if (addons !== undefined) updateData.addons = addons;
      await db.update(menuItems).set(updateData).where(eq(menuItems.id, id));
      return db.select().from(menuItems).where(eq(menuItems.id, id)).then((rows) => rows[0]);
    }),

  deleteMenuItem: tenantQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(menuItems).set({ status: "inactive" }).where(
        and(eq(menuItems.id, input.id), eq(menuItems.restaurantId, ctx.restaurantId))
      );
      return { success: true };
    }),
});
