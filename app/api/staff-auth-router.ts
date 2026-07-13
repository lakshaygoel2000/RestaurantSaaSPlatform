import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { staff, restaurants, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { signSessionToken, verifySessionToken } from "./lib/session";
import { verifyPassword } from "./lib/password";
import { TRPCError } from "@trpc/server";
import { isSubscriptionActive } from "./context";

export const staffAuthRouter = createRouter({
  // Staff login with username/password
  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = getDb();

        const staffMember = await db
          .select()
          .from(staff)
          .where(eq(staff.username, input.username))
          .then((rows: any[]) => rows[0]);

        if (!staffMember) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        if (staffMember.status === "inactive") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Account is inactive. Contact your manager.",
          });
        }

        const restaurant = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.id, staffMember.restaurantId))
          .then((rows: any[]) => rows[0]);

        if (!restaurant || !isSubscriptionActive({
          status: restaurant.status,
          subscriptionPlan: restaurant.subscriptionPlan,
          subscriptionStatus: restaurant.subscriptionStatus,
          trialEndsAt: restaurant.trialEndsAt,
          subscriptionExpiresAt: restaurant.subscriptionExpiresAt,
          paymentVerifiedAt: restaurant.paymentVerifiedAt,
        })) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Your trial has expired or subscription is inactive. Please ask the restaurant owner to renew.",
          });
        }

        if (!staffMember.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        const validPassword = await verifyPassword(input.password, staffMember.passwordHash);
        if (!validPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        // Generate JWT with restaurantId embedded
        const token = await signSessionToken({
          unionId: `staff_${staffMember.id}`,
          clientId: restaurant?.slug || "restaurantos",
        });

        await db
          .update(staff)
          .set({ lastActiveAt: new Date() })
          .where(eq(staff.id, staffMember.id));

        return {
          token,
          staff: {
            id: staffMember.id,
            name: staffMember.name,
            role: staffMember.role,
            restaurantId: staffMember.restaurantId,
            branchId: staffMember.branchId,
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
      // } catch (err) {
      //   if (err instanceof TRPCError) throw err;
      //   console.error("[auth.login] Unexpected error:", err);
      //   throw new TRPCError({
      //     code: "INTERNAL_SERVER_ERROR",
      //     message: "Login service unavailable. Please try again in a moment.",
      //   });
      // }
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("[auth.login] Unexpected error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          // TEMPORARY DEBUG — remove once diagnosed
          message: `DEBUG ${err?.code || err?.name || "Error"}: ${err?.message || String(err)}`,
        });
      }
    }),

  // Verify staff or owner token and return unified user info
  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);
    const claim = await verifySessionToken(token);
    if (!claim?.unionId) {
      return null;
    }

    const db = getDb();

    // ── Owner actor ─────────────────────────────────────────────
    if (claim.unionId.startsWith("owner_")) {
      const ownerId = parseInt(claim.unionId.replace("owner_", ""));
      if (isNaN(ownerId)) return null;

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
        role: "owner",
        avatar: null,
        restaurantId: owner.restaurantId,
        branchId: null,
        status: "active",
        permissions: null,
        restaurantName: restaurant?.name,
        restaurantSlug: restaurant?.slug,
        username: owner.email,
        subscriptionPlan: restaurant?.subscriptionPlan,
        subscriptionStatus: restaurant?.subscriptionStatus,
        trialEndsAt: restaurant?.trialEndsAt,
        subscriptionExpiresAt: restaurant?.subscriptionExpiresAt,
      };
    }

    // ── Staff actor ─────────────────────────────────────────────
    if (claim.unionId.startsWith("staff_")) {
      const staffId = parseInt(claim.unionId.replace("staff_", ""));
      if (isNaN(staffId)) return null;

      const staffMember = await db
        .select()
        .from(staff)
        .where(eq(staff.id, staffId))
        .then((rows: any[]) => rows[0]);

      if (!staffMember || staffMember.status === "inactive") {
        return null;
      }

      const restaurant = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, staffMember.restaurantId))
        .then((rows: any[]) => rows[0]);

      return {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone,
        role: staffMember.role,
        avatar: staffMember.avatar,
        restaurantId: staffMember.restaurantId,
        branchId: staffMember.branchId,
        status: staffMember.status,
        permissions: staffMember.permissions,
        restaurantName: restaurant?.name,
        restaurantSlug: restaurant?.slug,
        username: staffMember.username,
        subscriptionPlan: restaurant?.subscriptionPlan,
        subscriptionStatus: restaurant?.subscriptionStatus,
        trialEndsAt: restaurant?.trialEndsAt,
        subscriptionExpiresAt: restaurant?.subscriptionExpiresAt,
      };
    }

    return null;
  }),

  // Logout (client-side token removal, server just acknowledges)
  logout: publicQuery.mutation(() => {
    return { success: true };
  }),

  // Change password
  changePassword: publicQuery
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authHeader = ctx.req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      const token = authHeader.slice(7);
      const claim = await verifySessionToken(token);
      if (!claim?.unionId?.startsWith("staff_")) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
      }

      const staffId = parseInt(claim.unionId.replace("staff_", ""));
      const db = getDb();
      const member = await db
        .select()
        .from(staff)
        .where(eq(staff.id, staffId))
        .then((rows: any[]) => rows[0]);

      if (!member || !member.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const validCurrent = await verifyPassword(input.currentPassword, member.passwordHash);
      if (!validCurrent) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const { hashPassword } = await import("./lib/password");
      const newHash = await hashPassword(input.newPassword);

      await db
        .update(staff)
        .set({ passwordHash: newHash })
        .where(eq(staff.id, staffId));

      return { success: true };
    }),
});
