import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ToastContainer from "./ToastContainer";
import {
  LayoutDashboard, UtensilsCrossed, Grid3X3, ClipboardList, ChefHat,
  Receipt, Users, Package, BarChart3, Settings, Menu, LogOut, Store,
  Bell, UserCircle, ReceiptText, Activity, Sun, Moon, Monitor, Crown,
  ChevronDown, Loader2,
} from "lucide-react";

const allNavItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["manager", "owner", "admin", "accountant"] },
  { name: "Menu", path: "/menu", icon: UtensilsCrossed, roles: ["manager", "owner", "admin", "waiter", "chef", "cashier"] },
  { name: "Tables", path: "/tables", icon: Grid3X3, roles: ["manager", "owner", "admin", "waiter", "cashier"] },
  { name: "Orders", path: "/orders", icon: ClipboardList, roles: ["manager", "owner", "admin", "waiter", "chef", "cashier", "delivery_staff"] },
  { name: "Kitchen", path: "/kitchen", icon: ChefHat, roles: ["manager", "owner", "admin", "chef"] },
  { name: "Billing", path: "/billing", icon: Receipt, roles: ["manager", "owner", "admin", "cashier", "waiter"] },
  { name: "Customers", path: "/customers", icon: UserCircle, roles: ["manager", "owner", "admin", "cashier"] },
  { name: "Staff", path: "/staff", icon: Users, roles: ["manager", "owner", "admin"] },
  { name: "Inventory", path: "/inventory", icon: Package, roles: ["manager", "owner", "admin", "chef"] },
  { name: "Expenses", path: "/expenses", icon: ReceiptText, roles: ["manager", "owner", "admin", "accountant"] },
  { name: "Reports", path: "/reports", icon: BarChart3, roles: ["manager", "owner", "admin", "accountant"] },
  { name: "Activity", path: "/activity", icon: Activity, roles: ["manager", "owner", "admin"] },
  { name: "Settings", path: "/settings", icon: Settings, roles: ["manager", "owner", "admin"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isManager, isLoading, isAuthenticated } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Filter nav items by user role
  const userRole = user?.role || "";
  const visibleNav = allNavItems.filter((item) => item.roles.includes(userRole));

  const currentPage = allNavItems.find((item) => item.path === location.pathname);

  // Loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <ToastContainer />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">RestaurantOS</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.restaurantName || "Your Restaurant"}</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNav.length === 0 ? (
            <div className="px-3 py-4 space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className={cn("w-[18px] h-[18px]", isActive && "stroke-[2.5]")} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })
          )}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-800">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <button className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white">RestaurantOS</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.restaurantName || ""}</span>
            </div>
          </div>
          <nav className="px-2 py-3 space-y-0.5">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}>
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white ml-10 lg:ml-0">
            {currentPage?.name || "Dashboard"}
          </h1>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <div className="relative">
              <button onClick={() => { setShowThemeMenu(!showThemeMenu); setShowUserMenu(false); }} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                {resolvedTheme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                  {[{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Monitor }].map((t) => (
                    <button key={t.value} onClick={() => { setTheme(t.value as any); setShowThemeMenu(false); }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${theme === t.value ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                      <t.icon className="w-4 h-4" />{t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Dropdown */}
            <div className="relative pl-3 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowThemeMenu(false); }}
                className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-semibold text-sm">
                  {(user?.name || "U")[0]?.toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{user?.name || "User"}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role || "staff"}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                  {/* User info header */}
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || user?.username || ""}</p>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 hover:bg-amber-100">
                        {isManager ? <><Crown className="w-3 h-3 mr-0.5" />Manager</> : <>{(user?.role || "staff")}</>}
                      </Badge>
                    </div>
                  </div>

                  {/* Menu items */}
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />Settings
                  </Link>
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
