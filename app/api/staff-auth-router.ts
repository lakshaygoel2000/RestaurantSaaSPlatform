import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { staff, restaurants } from "@db/schema";
import { eq } from "drizzle-orm";
import { signSessionToken, verifySessionToken } from "./kimi/session";
import { TRPCError } from "@trpc/server";

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
          .then((rows) => rows[0]);

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

        if (staffMember.passwordHash !== input.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        const restaurant = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.id, staffMember.restaurantId))
          .then((rows) => rows[0]);

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
              }
            : null,
        };
      } catch (err) {
        // Re-throw known tRPC errors as-is.
        if (err instanceof TRPCError) throw err;

        // Wrap unexpected DB/connection errors so the client never sees raw SQL.
        console.error("[auth.login] Unexpected error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Login service unavailable. Please try again in a moment.",
        });
      }
    }),

  // Verify staff token and return staff info
  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);
    const claim = await verifySessionToken(token);
    if (!claim?.unionId?.startsWith("staff_")) {
      return null;
    }

    const staffId = parseInt(claim.unionId.replace("staff_", ""));
    if (isNaN(staffId)) return null;

    const db = getDb();
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .then((rows) => rows[0]);

    if (!staffMember || staffMember.status === "inactive") {
      return null;
    }

    const restaurant = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, staffMember.restaurantId))
      .then((rows) => rows[0]);

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
    };
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
        newPassword: z.string().min(4),
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
        .then((rows) => rows[0]);

      if (!member || member.passwordHash !== input.currentPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      await db
        .update(staff)
        .set({ passwordHash: input.newPassword })
        .where(eq(staff.id, staffId));

      return { success: true };
    }),
});
