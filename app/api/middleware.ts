import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TenantContext } from "./context";

const t = initTRPC.context<TenantContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
const publicQuery = t.procedure;

// ─── AUTH MIDDLEWARE ─────────────────────────
// Requires valid staff token with restaurant context
const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.staff) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated || "Authentication required",
    });
  }

  return next({ ctx: { ...ctx, staff: ctx.staff } });
});

// ─── TENANT MIDDLEWARE ───────────────────────
// Auto-injects restaurantId from staff context
// Every tenant query automatically scopes to the staff's restaurant
const requireTenant = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.staff) {
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

  return next({
    ctx: {
      ...ctx,
      staff: ctx.staff,
      restaurantId: ctx.restaurantId,
      role: ctx.role,
    },
  });
});

// ─── ROLE MIDDLEWARE ─────────────────────────
function requireRole(...allowedRoles: string[]) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.staff) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(ctx.staff.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole || "Insufficient permissions",
      });
    }

    return next({ ctx: { ...ctx, staff: ctx.staff } });
  });
}

// ─── PROCEDURE TYPES ─────────────────────────

// Public: No auth required (login, ping, etc.)
export { publicQuery };

// Authed: Requires valid staff token
export const authedQuery = t.procedure.use(requireAuth);

// Tenant: Requires auth + auto-scopes to restaurant
// This is the primary procedure for ALL feature routers
// ctx.restaurantId is guaranteed to exist
export const tenantQuery = t.procedure
  .use(requireAuth)
  .use(requireTenant);

// Role-restricted tenant procedures
export const managerQuery = tenantQuery.use(requireRole("owner", "manager", "admin"));
export const cashierQuery = tenantQuery.use(requireRole("owner", "manager", "cashier", "admin"));
export const chefQuery = tenantQuery.use(requireRole("owner", "manager", "chef", "admin"));
