import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InventoryGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isInventoryEnabled, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isInventoryEnabled()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Access Required</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Inventory management is available on Standard and Premium plans. Upgrade your subscription to unlock this feature.
          </p>
          <Button
            onClick={() => navigate("/subscription")}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
