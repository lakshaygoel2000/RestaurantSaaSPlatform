import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  IndianRupee, ShoppingCart, Clock, ChefHat, Users,
  UtensilsCrossed, TrendingUp, Store, ClipboardList, Receipt, Grid3X3,
  Package, AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: kpis, isLoading } = trpc.dashboard.getKPIs.useQuery();
  const { data: salesChart } = trpc.dashboard.getSalesChart.useQuery({ period: "today" });
  const { data: topItems } = trpc.dashboard.getTopItems.useQuery({ limit: 6 });
  const { data: recentActivity } = trpc.dashboard.getRecentActivity.useQuery({ limit: 10 });
  const { data: restaurant } = trpc.restaurant.getCurrent.useQuery();

  const isManager = user?.role === "manager" || user?.role === "owner" || user?.role === "admin";
  const isOwner = user?.role === "owner";
  const subscriptionPlan = restaurant?.subscriptionPlan || "basic";

  const trialDaysLeft = restaurant?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(restaurant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const subscriptionDaysLeft = restaurant?.subscriptionExpiresAt
    ? Math.max(0, Math.ceil((new Date(restaurant.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isTrialExpired = restaurant?.status === "trial" && trialDaysLeft === 0;
  const isSubscriptionExpiringSoon = restaurant?.status === "active" && subscriptionDaysLeft !== null && subscriptionDaysLeft <= 7;

  const stats = [
    { title: "Today's Revenue", value: kpis ? `Rs. ${kpis.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "Rs. 0.00", icon: IndianRupee, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
    { title: "Total Orders", value: kpis?.totalOrders?.toString() || "0", icon: ShoppingCart, color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
    { title: "Avg Order Value", value: kpis ? `Rs. ${kpis.avgOrderValue.toFixed(2)}` : "Rs. 0.00", icon: TrendingUp, color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
    { title: "Active Tables", value: kpis ? `${kpis.activeTables}/${kpis.totalTables}` : "0/0", icon: UtensilsCrossed, color: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" },
    { title: "Kitchen Queue", value: kpis?.pendingKitchenItems?.toString() || "0", icon: ChefHat, color: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" },
    { title: "Staff on Duty", value: kpis?.staffOnDuty?.toString() || "0", icon: Users, color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400" },
  ];

  const quickActions = [
    { label: "New Order", href: "/orders", icon: ShoppingCart, color: "bg-blue-500", show: true },
    { label: "Add Menu Item", href: "/menu", icon: UtensilsCrossed, color: "bg-emerald-500", show: isManager },
    { label: "Manage Tables", href: "/tables", icon: Grid3X3, color: "bg-purple-500", show: true },
    { label: "View KDS", href: "/kitchen", icon: ChefHat, color: "bg-orange-500", show: true },
    { label: "Generate Bill", href: "/billing", icon: Receipt, color: "bg-cyan-500", show: true },
    { label: "Add Staff", href: "/staff", icon: Users, color: "bg-pink-500", show: isManager },
    { label: "Inventory", href: "/inventory", icon: Package, color: "bg-amber-500", show: isManager && ["standard", "premium"].includes(subscriptionPlan) },
  ];

  return (
    <div className="space-y-6">
      {(isTrialExpired || isSubscriptionExpiringSoon || restaurant?.status === "pending") && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {restaurant?.status === "pending"
                  ? "Account pending activation"
                  : isTrialExpired
                  ? "Your trial has expired"
                  : "Subscription expiring soon"}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {restaurant?.status === "pending"
                  ? "Activate your account to continue using all features."
                  : isTrialExpired
                  ? "Renew your subscription to keep your restaurant running without interruption."
                  : `Your subscription expires in ${subscriptionDaysLeft} day${subscriptionDaysLeft === 1 ? "" : "s"}. Renew now to avoid service disruption.`}
              </p>
            </div>
          </div>
          {isOwner && (
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              <Link to="/subscription">View Subscription</Link>
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time insights for {restaurant?.name || "your restaurant"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white dark:bg-slate-800">
            <Clock className="w-3 h-3 mr-1" />
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </Badge>
          {restaurant?.status === "trial" && trialDaysLeft !== null && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Trial - {trialDaysLeft} days left</Badge>
          )}
          {restaurant?.status === "active" && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {restaurant.subscriptionPlan?.charAt(0).toUpperCase()}{restaurant.subscriptionPlan?.slice(1)} Plan
              {subscriptionDaysLeft != null && ` - ${subscriptionDaysLeft} day${subscriptionDaysLeft === 1 ? "" : "s"} left`}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`p-2 rounded-lg w-fit ${stat.color} mb-3`}><stat.icon className="w-4 h-4" /></div>
              {isLoading ? <Skeleton className="h-7 w-20" /> : (
                <div className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />Hourly Sales Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-1">
              {salesChart && salesChart.length > 0 ? (
                salesChart.map((hour: any, i: number) => {
                  const max = Math.max(...salesChart.map((h: any) => Number(h.value) || 0), 1);
                  const height = max > 0 ? ((Number(hour.value) || 0) / max) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                      <div className="relative w-full flex justify-center">
                        <div className="w-full max-w-[24px] rounded-t bg-amber-300 dark:bg-amber-700/50 transition-all group-hover:bg-amber-500" style={{ height: `${Math.max(height, 4)}%` }} />
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          Rs. {Number(hour.value || 0).toFixed(0)}
                        </div>
                      </div>
                      {i % 3 === 0 && <span className="text-[9px] text-slate-400 truncate">{hour.label}</span>}
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center h-full text-slate-400 text-sm">No sales data yet. Orders will appear here.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500" />Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topItems && topItems.length > 0 ? topItems.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.quantity} sold</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rs. {Number(item.revenue || 0).toFixed(0)}</span>
              </div>
            )) : (
              <div className="text-sm text-slate-400 text-center py-8">No sales data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-500" />Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity && recentActivity.length > 0 ? recentActivity.slice(0, 8).map((activity: any) => (
              <Link key={activity.id} to="/orders" className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.status === "completed" ? "bg-emerald-500" : activity.status === "preparing" ? "bg-amber-500" : activity.status === "cancelled" ? "bg-red-500" : "bg-blue-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-slate-500">{activity.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Rs. {Number(activity.amount || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                </div>
              </Link>
            )) : (
              <div className="text-sm text-slate-400 text-center py-8">No recent orders</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.filter(a => a.show).map((action) => (
                <Link key={action.label} to={action.href} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all text-left group">
                  <div className={`w-10 h-10 rounded-lg ${action.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
