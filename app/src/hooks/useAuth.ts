import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export type StaffUser = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  avatar: string | null;
  restaurantId: number;
  branchId: number | null;
  status: string;
  permissions: unknown;
  restaurantName: string | undefined;
  restaurantSlug: string | undefined;
  username: string | null;
};

const ALL_NAV = [
  { name: "Dashboard", path: "/", icon: "LayoutDashboard", roles: ["manager", "owner", "admin", "accountant"] },
  { name: "Menu", path: "/menu", icon: "UtensilsCrossed", roles: ["manager", "owner", "admin", "waiter", "chef", "cashier"] },
  { name: "Tables", path: "/tables", icon: "Grid3X3", roles: ["manager", "owner", "admin", "waiter", "cashier"] },
  { name: "Orders", path: "/orders", icon: "ClipboardList", roles: ["manager", "owner", "admin", "waiter", "chef", "cashier", "delivery_staff"] },
  { name: "Kitchen", path: "/kitchen", icon: "ChefHat", roles: ["manager", "owner", "admin", "chef"] },
  { name: "Billing", path: "/billing", icon: "Receipt", roles: ["manager", "owner", "admin", "cashier", "waiter"] },
  { name: "Customers", path: "/customers", icon: "UserCircle", roles: ["manager", "owner", "admin", "cashier"] },
  { name: "Staff", path: "/staff", icon: "Users", roles: ["manager", "owner", "admin"] },
  { name: "Inventory", path: "/inventory", icon: "Package", roles: ["manager", "owner", "admin", "chef"] },
  { name: "Expenses", path: "/expenses", icon: "ReceiptText", roles: ["manager", "owner", "admin", "accountant"] },
  { name: "Reports", path: "/reports", icon: "BarChart3", roles: ["manager", "owner", "admin", "accountant"] },
  { name: "Activity", path: "/activity", icon: "Activity", roles: ["manager", "owner", "admin"] },
  { name: "Settings", path: "/settings", icon: "Settings", roles: ["manager", "owner", "admin"] },
];

export function useAuth() {
  const utils = trpc.useUtils();

  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("staff_token");
      utils.invalidate();
      window.location.href = "/login";
    },
    onError: () => {
      localStorage.removeItem("staff_token");
      window.location.href = "/login";
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem("staff_token");
    logoutMutation.mutate();
  }, [logoutMutation]);

  const navItems = useMemo(() => {
    if (!user) return [];
    const role = user.role as string;
    return ALL_NAV.filter((item) => item.roles.includes(role));
  }, [user]);

  const isManager = user?.role === "manager" || user?.role === "owner" || user?.role === "admin";

  return useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    navItems,
    isManager,
    restaurantId: user?.restaurantId || 1,
  }), [user, isLoading, logout, navItems, isManager]);
}
