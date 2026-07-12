import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../api/router";

function createClient(token?: string) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3000/api/trpc",
        transformer: superjson,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    ],
  });
}

async function main() {
  const anon = createClient();

  console.log("Testing health...");
  const health = await fetch("http://localhost:3000/api/health").then((r) => r.json());
  console.log("Health:", health);

  console.log("\nTesting owner login (Standard plan)...");
  const owner = await anon.auth.ownerLogin.mutate({
    email: "owner@spice-garden.com",
    password: "owner@spice-garden",
  });
  console.log("Owner login OK:", owner.owner.email, "plan:", owner.restaurant?.subscriptionPlan);

  const ownerClient = createClient(owner.token);
  console.log("\nTesting owner me...");
  const me = await ownerClient.staffAuth.me.query();
  console.log("Me:", me?.email, "role:", me?.role, "plan:", me?.subscriptionPlan);

  console.log("\nTesting staff login...");
  const staff = await anon.staffAuth.login.mutate({
    username: "manager@spice-garden",
    password: "manager@spice-garden",
  });
  console.log("Staff login OK:", staff.staff.role, "plan:", staff.restaurant?.subscriptionPlan);

  console.log("\nTesting inventory access for Standard plan owner...");
  const items = await ownerClient.inventory.getItems.query();
  console.log("Inventory access OK, items:", items.length);

  console.log("\nTesting inventory gating for Basic plan owner...");
  const basicOwner = await anon.auth.ownerLogin.mutate({
    email: "owner@dosa-point.com",
    password: "owner@dosa-point",
  });
  const basicClient = createClient(basicOwner.token);
  try {
    await basicClient.inventory.getItems.query();
    console.log("ERROR: Inventory should be blocked for Basic plan");
  } catch (err: any) {
    console.log("Inventory correctly gated:", err.message);
  }

  console.log("\nAll tests passed!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
