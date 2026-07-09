import { z } from "zod";
import { createRouter, tenantQuery, managerQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { restaurants, branches, staff } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const restaurantRouter = createRouter({
  // Public: Create restaurant (registration)
  create: publicQuery
    .input(z.object({
      name: z.string().min(1), slug: z.string().min(1),
      email: z.string().optional(), phone: z.string().optional(),
      address: z.string().optional(), city: z.string().optional(),
      state: z.string().optional(), pincode: z.string().optional(),
      gstNumber: z.string().optional(), cuisineType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(restaurants).values({
        name: input.name, slug: input.slug, email: input.email || null,
        phone: input.phone || null, address: input.address || null,
        city: input.city || null, state: input.state || null,
        pincode: input.pincode || null, gstNumber: input.gstNumber || null,
        cuisineType: input.cuisineType || null, status: "trial",
        subscriptionPlan: "starter",
      }).$returningId();
      return db.select().from(restaurants).where(eq(restaurants.id, result.id)).then((r) => r[0]);
    }),

  // Get current restaurant from context
  getCurrent: tenantQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(restaurants).where(eq(restaurants.id, ctx.restaurantId)).then((r) => r[0] || null);
  }),

  getById: tenantQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Only allow accessing own restaurant
      if (input.id !== ctx.restaurantId) throw new Error("Access denied");
      const db = getDb();
      return db.select().from(restaurants).where(eq(restaurants.id, input.id)).then((r) => r[0] || null);
    }),

  update: managerQuery
    .input(z.object({
      name: z.string().optional(), email: z.string().optional(),
      phone: z.string().optional(), address: z.string().optional(),
      city: z.string().optional(), state: z.string().optional(),
      pincode: z.string().optional(), gstNumber: z.string().optional(),
      fssaiNumber: z.string().optional(), cuisineType: z.string().optional(),
      status: z.enum(["active", "inactive", "suspended", "trial"]).optional(),
      taxSettings: z.any().optional(), settings: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rid = ctx.restaurantId!;
      await db.update(restaurants).set(input).where(eq(restaurants.id, rid));
      return db.select().from(restaurants).where(eq(restaurants.id, rid)).then((r) => r[0]);
    }),

  // Branches
  getBranches: tenantQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(branches).where(eq(branches.restaurantId, ctx.restaurantId));
  }),

  createBranch: managerQuery
    .input(z.object({
      name: z.string().min(1), address: z.string().optional(),
      city: z.string().optional(), phone: z.string().optional(),
      managerName: z.string().optional(), managerPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(branches).values({
        restaurantId: ctx.restaurantId, name: input.name,
        address: input.address || null, city: input.city || null,
        phone: input.phone || null, managerName: input.managerName || null,
        managerPhone: input.managerPhone || null, isPrimary: false, status: "active",
      }).$returningId();
      return db.select().from(branches).where(eq(branches.id, result.id)).then((r) => r[0]);
    }),

  // Staff management
  getStaff: tenantQuery
    .input(z.object({ role: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(staff.restaurantId, ctx.restaurantId)];
      if (input?.role) conditions.push(eq(staff.role, input.role as any));
      if (input?.status) conditions.push(eq(staff.status, input.status as any));
      return db.select().from(staff).where(and(...conditions)).orderBy(staff.name);
    }),

  createStaff: managerQuery
    .input(z.object({
      branchId: z.number().optional(), name: z.string().min(1, "Name is required"),
      email: z.string().optional(), phone: z.string().min(1, "Phone is required"),
      role: z.enum(["owner", "manager", "cashier", "chef", "waiter", "delivery_staff", "accountant", "admin"]),
      salary: z.string().min(1, "Salary is required"), address: z.string().optional(),
      joiningDate: z.string().optional(), permissions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, ctx.restaurantId)).then((r) => r[0]);
      const slug = restaurant?.slug || "restaurant";
      const nameSlug = input.name.toLowerCase().replace(/\s+/g, "");
      const username = `${nameSlug}@${slug}`;
      const password = `${nameSlug}@${slug}`;

      const existing = await db.select().from(staff).where(eq(staff.username, username));
      if (existing.length > 0) throw new Error("Staff member with this name already exists");

      const [result] = await db.insert(staff).values({
        restaurantId: ctx.restaurantId, branchId: input.branchId || null,
        name: input.name, email: input.email || null, phone: input.phone,
        role: input.role, salary: input.salary, address: input.address || null,
        username, passwordHash: password,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
        permissions: input.permissions || null, status: "active",
      }).$returningId();
      return db.select().from(staff).where(eq(staff.id, result.id)).then((r) => r[0]);
    }),

  updateStaff: managerQuery
    .input(z.object({
      id: z.number(), name: z.string().optional(), email: z.string().optional(),
      phone: z.string().optional(), role: z.enum(["owner", "manager", "cashier", "chef", "waiter", "delivery_staff", "accountant", "admin"]).optional(),
      status: z.enum(["active", "inactive", "on_leave"]).optional(),
      salary: z.string().optional(), address: z.string().optional(),
      permissions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const db = getDb();
      const existing = await db.select().from(staff)
        .where(and(eq(staff.id, id), eq(staff.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (!existing) throw new Error("Staff not found");
      await db.update(staff).set({ ...data, updatedAt: new Date() }).where(eq(staff.id, id));
      return db.select().from(staff).where(eq(staff.id, id)).then((r) => r[0]);
    }),

  deleteStaff: managerQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const member = await db.select().from(staff)
        .where(and(eq(staff.id, input.id), eq(staff.restaurantId, ctx.restaurantId)))
        .then((r) => r[0]);
      if (member) {
        const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, ctx.restaurantId)).then((r) => r[0]);
        await db.update(staff).set({
          status: "inactive", passwordHash: `${restaurant?.slug || "restaurant"}@staff`, updatedAt: new Date(),
        }).where(eq(staff.id, input.id));
      }
      return { success: true };
    }),
});
