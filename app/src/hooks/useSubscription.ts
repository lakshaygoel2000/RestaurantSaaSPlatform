import { trpc } from "@/providers/trpc";

export type SubscriptionInfo = {
  status: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscriptionExpiresAt: Date | null;
  paymentVerifiedAt: Date | null;
};

export function useSubscription() {
  const { data: status, isLoading } = trpc.restaurant.getSubscriptionStatus.useQuery(undefined, {
    retry: false,
  });

  const hasPlan = (...plans: string[]) => {
    if (!status) return false;
    return plans.includes(status.subscriptionPlan);
  };

  const isInventoryEnabled = () => hasPlan("standard", "premium");

  const trialDaysLeft = () => {
    if (!status?.trialEndsAt) return 0;
    const diff = new Date(status.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const subscriptionDaysLeft = () => {
    if (!status?.subscriptionExpiresAt) return null;
    const diff = new Date(status.subscriptionExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isExpired = () => {
    if (!status) return true;
    if (status.status === "suspended") return true;
    if (status.status === "trial" && status.trialEndsAt) {
      return new Date(status.trialEndsAt) <= new Date();
    }
    if (status.subscriptionExpiresAt) {
      return new Date(status.subscriptionExpiresAt) <= new Date();
    }
    return status.status !== "active";
  };

  return {
    subscription: status as SubscriptionInfo | undefined,
    isLoading,
    hasPlan,
    isInventoryEnabled,
    trialDaysLeft: trialDaysLeft(),
    subscriptionDaysLeft: subscriptionDaysLeft(),
    isExpired: isExpired(),
  };
}
