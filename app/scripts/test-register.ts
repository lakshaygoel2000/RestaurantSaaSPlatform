import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../api/router";

const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: "http://localhost:3000/api/trpc", transformer: superjson })],
});

async function main() {
  const slug = "test-reg-" + Date.now();
  const res = await client.auth.registerRestaurant.mutate({
    restaurantName: "Test Registration Restaurant",
    slug,
    email: "test@example.com",
    phone: "+91 9999999999",
    ownerName: "Test Owner",
    ownerEmail: `owner-${slug}@example.com`,
    ownerPhone: "+91 9999999999",
    password: "Password123!",
  });
  console.log("Registration OK:", res.slug, "trialEndsAt:", res.trialEndsAt);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
