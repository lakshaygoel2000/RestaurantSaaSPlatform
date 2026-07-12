import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, restaurants, staff } from "@db/schema";
import { eq } from "drizzle-orm";
import { signSessionToken, verifySessionToken } from "./lib/session";
import { hashPassword, verifyPassword } from "./lib/password";
import { TRPCError } from "@trpc/server";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateUniqueSlug(name: string): string {
  const base = slugify(name) || "restaurant";
  const suffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${base}-${suffix}`;
}

export const authRouter = createRouter({
  // Public registration for new restaurants
  registerRestaurant: publicQuery
    .input(
      z.object({
        restaurantName: z.string().min(2, "Restaurant name is required"),
        slug: z
          .string()
          .min(2)
          .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
          .optional(),
        email: z.string().email("Valid email is required"),
        phone: z.string().min(5, "Phone number is required"),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        gstNumber: z.string().optional(),
        fssaiNumber: z.string().optional(),
        cuisineType: z.string().optional(),
        description: z.string().optional(),
        ownerName: z.string().min(2, "Owner name is required"),
        ownerEmail: z.string().email("Valid owner email is required"),
        ownerPhone: z.string().optional(),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check for duplicate restaurant slug
      const slug = input.slug || generateUniqueSlug(input.restaurantName);
      const existingSlug = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.slug, slug))
        .then((rows: any[]) => rows[0]);

      if (existingSlug) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Restaurant slug is already taken. Please choose another.",
        });
      }

      // Check for duplicate owner email
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, input.ownerEmail))
        .then((rows: any[]) => rows[0]);

      if (existingEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      // Create restaurant in pending/trial state
      const [restaurant] = await db.insert(restaurants).values({
        name: input.restaurantName,
        slug,
        email: input.email,
        phone: input.phone,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        pincode: input.pincode ?? null,
        gstNumber: input.gstNumber ?? null,
        fssaiNumber: input.fssaiNumber ?? null,
        cuisineType: input.cuisineType ?? null,
        description: input.description ?? null,
        status: "trial",
        subscriptionPlan: "basic",
        subscriptionStatus: "trialing",
        trialEndsAt,
      });

      const restaurantId = Number(restaurant.insertId);

      // Create owner user
      const passwordHash = await hashPassword(input.password);
      const [owner] = await db.insert(users).values({
        restaurantId,
        name: input.ownerName,
        email: input.ownerEmail,
        phone: input.ownerPhone ?? null,
        passwordHash,
        role: "owner",
        status: "active",
      });

      // Create an owner staff record so the owner can also log in via staff login
      const ownerStaffUsername = `owner@${slug}`;
      await db.insert(staff).values({
        restaurantId,
        name: input.ownerName,
        email: input.ownerEmail,
        phone: input.ownerPhone ?? null,
        role: "owner",
        status: "active",
        username: ownerStaffUsername,
        passwordHash,
      });

      console.log(`[Registration] New restaurant registered: ${input.restaurantName} (${slug})`);

      return {
        success: true,
        restaurantId,
        ownerId: Number(owner.insertId),
        slug,
        trialEndsAt,
        message:
          "Registration successful. Your 7-day trial has started. Please complete payment verification before the trial ends.",
      };
    }),

  // Owner / admin login
  ownerLogin: publicQuery
    .input(
      z.object({
        email: z.string().email("Valid email is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const owner = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .then((rows: any[]) => rows[0]);

      if (!owner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      if (owner.status === "inactive") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account is inactive. Contact support.",
        });
      }

      const validPassword = await verifyPassword(input.password, owner.passwordHash);
      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const restaurant = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, owner.restaurantId))
        .then((rows: any[]) => rows[0]);

      // Update last sign in
      await db
        .update(users)
        .set({ lastSignInAt: new Date() })
        .where(eq(users.id, owner.id));

      const token = await signSessionToken({
        unionId: `owner_${owner.id}`,
        clientId: restaurant?.slug || "restaurantos",
      });

      return {
        token,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
          restaurantId: owner.restaurantId,
        },
        restaurant: restaurant
          ? {
              id: restaurant.id,
              name: restaurant.name,
              slug: restaurant.slug,
              status: restaurant.status,
              subscriptionPlan: restaurant.subscriptionPlan,
              subscriptionStatus: restaurant.subscriptionStatus,
              trialEndsAt: restaurant.trialEndsAt,
              subscriptionExpiresAt: restaurant.subscriptionExpiresAt,
            }
          : null,
      };
    }),

  // Verify owner token and return owner info
  ownerMe: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);
    const claim = await verifySessionToken(token);
    if (!claim?.unionId?.startsWith("owner_")) {
      return null;
    }

    const ownerId = parseInt(claim.unionId.replace("owner_", ""));
    if (isNaN(ownerId)) return null;

    const db = getDb();
    const owner = await db
      .select()
      .from(users)
      .where(eq(users.id, ownerId))
      .then((rows: any[]) => rows[0]);

    if (!owner || owner.status === "inactive") {
      return null;
    }

    const restaurant = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, owner.restaurantId))
      .then((rows: any[]) => rows[0]);

    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: owner.role,
      restaurantId: owner.restaurantId,
      restaurantName: restaurant?.name,
      restaurantSlug: restaurant?.slug,
      status: restaurant?.status,
      subscriptionPlan: restaurant?.subscriptionPlan,
      subscriptionStatus: restaurant?.subscriptionStatus,
      trialEndsAt: restaurant?.trialEndsAt,
      subscriptionExpiresAt: restaurant?.subscriptionExpiresAt,
      paymentVerifiedAt: restaurant?.paymentVerifiedAt,
    };
  }),

  // Request activation / renewal after trial or before expiry
  requestActivation: publicQuery
    .input(
      z.object({
        requestedPlan: z.enum(["basic", "standard", "premium"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authHeader = ctx.req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      const token = authHeader.slice(7);
      const claim = await verifySessionToken(token);
      if (!claim?.unionId?.startsWith("owner_")) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
      }

      const ownerId = parseInt(claim.unionId.replace("owner_", ""));
      const db = getDb();
      const owner = await db
        .select()
        .from(users)
        .where(eq(users.id, ownerId))
        .then((rows: any[]) => rows[0]);

      if (!owner) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Owner not found" });
      }

      await db
        .update(restaurants)
        .set({
          adminNotes: `Activation requested for ${input.requestedPlan} plan. ${input.notes ?? ""}`.trim(),
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, owner.restaurantId));

      console.log(
        `[Activation request] Owner ${owner.email} requested ${input.requestedPlan} for restaurant ${owner.restaurantId}`
      );

      return {
        success: true,
        message:
          "Your request has been submitted. Our team will verify payment and activate your subscription shortly.",
      };
    }),
});
