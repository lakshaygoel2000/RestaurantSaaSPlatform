import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifySessionToken } from "./kimi/session";
import { getDb } from "./queries/connection";
import { staff } from "@db/schema";
import { eq } from "drizzle-orm";

export type TenantContext = {
  req: Request;
  resHeaders: Headers;
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
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TenantContext> {
  const ctx: TenantContext = { req: opts.req, resHeaders: opts.resHeaders, restaurantId: 0 };

  // Try staff authentication via Bearer token
  try {
    const authHeader = opts.req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const claim = await verifySessionToken(token);
      if (claim?.unionId?.startsWith("staff_")) {
        const staffId = parseInt(claim.unionId.replace("staff_", ""));
        if (!isNaN(staffId)) {
          const db = getDb();
          const member = await db
            .select()
            .from(staff)
            .where(eq(staff.id, staffId))
            .then((rows) => rows[0]);

          if (member && member.status !== "inactive") {
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
          }
        }
      }
    }
  } catch {
    // Auth is optional for public endpoints
  }

  return ctx;
}
