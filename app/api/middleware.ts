import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TenantContext } from "./context";
import { isSubscriptionActive } from "./context";

const t = initTRPC.context<TenantContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
const publicQuery = t.procedure;

// ─── AUTH MIDDLEWARE ─────────────────────────
// Requires valid staff token or owner token with restaurant context
const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.actor) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated || "Authentication required",
    });
  }

  return next({ ctx: { ...ctx, actor: ctx.actor } });
});

// ─── TENANT MIDDLEWARE ───────────────────────
// Auto-injects restaurantId from the actor's restaurant and verifies subscription.
const requireTenant = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.actor) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (!ctx.restaurantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Restaurant context not found",
    });
  }

  if (!isSubscriptionActive(ctx.subscription)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Your trial has expired or subscription is inactive. Please renew to continue.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      actor: ctx.actor,
      restaurantId: ctx.restaurantId,
      role: ctx.role,
      subscription: ctx.subscription,
    },
  });
});

// ─── ROLE MIDDLEWARE ─────────────────────────
function requireRole(...allowedRoles: string[]) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.actor) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(ctx.actor.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole || "Insufficient permissions",
      });
    }

    return next({ ctx: { ...ctx, actor: ctx.actor } });
  });
}

// ─── SUBSCRIPTION PLAN MIDDLEWARE ────────────
function requirePlan(...allowedPlans: string[]) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.subscription) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Subscription information not available",
      });
    }

    if (!allowedPlans.includes(ctx.subscription.subscriptionPlan)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature requires ${allowedPlans.join(" or ")} plan. Please upgrade your subscription.`,
      });
    }

    return next({ ctx });
  });
}

// ─── PROCEDURE TYPES ─────────────────────────

// Public: No auth required (login, ping, registration)
export { publicQuery };

// Authed: Requires valid token
export const authedQuery = t.procedure.use(requireAuth);

// Tenant: Requires auth + active subscription + auto-scopes to restaurant
// This is the primary procedure for ALL feature routers
export const tenantQuery = t.procedure
  .use(requireAuth)
  .use(requireTenant);

// Plan-restricted tenant procedures
export const inventoryQuery = t.procedure
  .use(requireAuth)
  .use(requireTenant)
  .use(requirePlan("standard", "premium"));

// Role-restricted tenant procedures
export const managerQuery = tenantQuery.use(requireRole("owner", "manager", "admin"));
export const cashierQuery = tenantQuery.use(requireRole("owner", "manager", "cashier", "admin"));
export const chefQuery = tenantQuery.use(requireRole("owner", "manager", "chef", "admin"));
