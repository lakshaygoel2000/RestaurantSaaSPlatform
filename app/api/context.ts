import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifySessionToken } from "./lib/session";
import { getDb } from "./queries/connection";
import { staff, restaurants, users } from "@db/schema";
import { eq } from "drizzle-orm";

export type Actor =
  | { type: "staff"; id: number; role: string }
  | { type: "owner"; id: number; email: string; role: "owner" | "admin" }
  | null;

export type SubscriptionInfo = {
  status: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscriptionExpiresAt: Date | null;
  paymentVerifiedAt: Date | null;
};

export type TenantContext = {
  req: Request;
  resHeaders: Headers;
  actor: Actor;
  staff?: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    restaurantId: number;
    branchId: number | null;
    status: string;
    username: string | null;
  };
  restaurantId: number;
  role?: string;
  subscription?: SubscriptionInfo;
};

function isSubscriptionActive(sub?: SubscriptionInfo): boolean {
  if (!sub) return false;
  if (sub.status === "suspended") return false;

  const now = new Date();

  // During trial window, access is allowed.
  if (sub.status === "trial" && sub.trialEndsAt && sub.trialEndsAt > now) {
    return true;
  }

  // Active paid subscription.
  if (sub.status === "active") {
    if (!sub.subscriptionExpiresAt) return true;
    return sub.subscriptionExpiresAt > now;
  }

  return false;
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TenantContext> {
  const ctx: TenantContext = {
    req: opts.req,
    resHeaders: opts.resHeaders,
    actor: null,
    restaurantId: 0,
  };

  try {
    const authHeader = opts.req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const claim = await verifySessionToken(token);
      if (!claim) return ctx;

      const db = getDb();

      // ── Staff actor ─────────────────────────────────────────────
      if (claim.unionId.startsWith("staff_")) {
        const staffId = parseInt(claim.unionId.replace("staff_", ""));
        if (!isNaN(staffId)) {
          const member = await db
            .select()
            .from(staff)
            .where(eq(staff.id, staffId))
            .then((rows: any[]) => rows[0]);

          if (member && member.status !== "inactive") {
            const restaurant = await db
              .select()
              .from(restaurants)
              .where(eq(restaurants.id, member.restaurantId))
              .then((rows: any[]) => rows[0]);

            ctx.actor = {
              type: "staff",
              id: member.id,
              role: member.role,
            };
            ctx.staff = {
              id: member.id,
              name: member.name,
              email: member.email,
              phone: member.phone,
              role: member.role,
              restaurantId: member.restaurantId,
              branchId: member.branchId,
              status: member.status,
              username: member.username,
            };
            ctx.restaurantId = member.restaurantId;
            ctx.role = member.role;
            if (restaurant) {
              ctx.subscription = {
                status: restaurant.status,
                subscriptionPlan: restaurant.subscriptionPlan,
                subscriptionStatus: restaurant.subscriptionStatus,
                trialEndsAt: restaurant.trialEndsAt,
                subscriptionExpiresAt: restaurant.subscriptionExpiresAt,
                paymentVerifiedAt: restaurant.paymentVerifiedAt,
              };
            }
          }
        }
      }

      // ── Owner / admin actor ─────────────────────────────────────
      if (claim.unionId.startsWith("owner_")) {
        const ownerId = parseInt(claim.unionId.replace("owner_", ""));
        if (!isNaN(ownerId)) {
          const owner = await db
            .select()
            .from(users)
            .where(eq(users.id, ownerId))
            .then((rows: any[]) => rows[0]);

          if (owner && owner.status !== "inactive") {
            const restaurant = await db
              .select()
              .from(restaurants)
              .where(eq(restaurants.id, owner.restaurantId))
              .then((rows: any[]) => rows[0]);

            ctx.actor = {
              type: "owner",
              id: owner.id,
              email: owner.email ?? "",
              role: owner.role,
            };
            ctx.restaurantId = owner.restaurantId;
            ctx.role = owner.role;
            if (restaurant) {
              ctx.subscription = {
                status: restaurant.status,
                subscriptionPlan: restaurant.subscriptionPlan,
                subscriptionStatus: restaurant.subscriptionStatus,
                trialEndsAt: restaurant.trialEndsAt,
                subscriptionExpiresAt: restaurant.subscriptionExpiresAt,
                paymentVerifiedAt: restaurant.paymentVerifiedAt,
              };
            }
          }
        }
      }
    }
  } catch {
    // Auth is optional for public endpoints
  }

  return ctx;
}

export { isSubscriptionActive };
