import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, retry: 1 },
    mutations: { retry: 0 },
  },
});

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  // Owner token takes precedence when both are present.
  return (
    localStorage.getItem("owner_token") || localStorage.getItem("staff_token") || null
  );
}

/**
 * Detect if running inside a Capacitor native app.
 * Capacitor injects a global `Capacitor` object into the webview.
 */
function isCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    // @ts-expect-error Capacitor is injected at runtime
    typeof window.Capacitor !== "undefined" && window.Capacitor.isNativePlatform?.() === true
  );
}

/**
 * Get the API base URL.
 * - In Capacitor (mobile app): use the production API URL from env
 * - In browser: use relative URL (same origin)
 */
function getApiUrl(): string {
  // Capacitor apps load from file:// or capacitor:// so they need an absolute URL
  if (isCapacitorApp()) {
    // Use the production API URL. Falls back to the known production domain.
    return import.meta.env.VITE_API_URL || "https://restaurantos.doxcod.com/api/trpc";
  }
  // Browser: relative URL works fine (same origin)
  return "/api/trpc";
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getApiUrl(),
      transformer: superjson,
      headers() {
        const token = getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
