import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  UtensilsCrossed,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const PERIODS = ["today", "week", "month"] as const;
type Period = typeof PERIODS[number];

const periodLabels: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

export default function Reports() {
  const [period, setPeriod] = useState<Period>("today");

  const { data: salesChart } = trpc.dashboard.getSalesChart.useQuery({ period });

  const { data: topItems } = trpc.dashboard.getTopItems.useQuery({ limit: 10 });

  const { data: paymentSummary } = trpc.payment.getSummary.useQuery();

  const totalRevenue = salesChart?.reduce((sum: number, s: any) => sum + s.value, 0) || 0;
  const totalOrders = salesChart?.reduce((sum: number, s: any) => sum + s.count, 0) || 0;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const maxRevenue = Math.max(...(salesChart?.map((s: any) => s.value) || [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Reports &amp; Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Business insights and performance metrics
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
      </div>

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
            className={period === p ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-500">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              Rs. {totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12.5%</span>
              <span className="text-slate-400 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-500">Orders</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalOrders}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>+8.2%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-500">Avg Order</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              Rs. {avgOrder.toFixed(2)}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
              <ArrowDownRight className="w-3 h-3" />
              <span>-2.1%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-500">Items Sold</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {topItems?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>+15.3%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Sales Trend - {periodLabels[period]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-end gap-2">
            {salesChart?.map((point: any, i: number) => {
              const height = maxRevenue > 0 ? (point.value / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex justify-center">
                    <div
                      className="w-full max-w-12 rounded-t-md bg-amber-200 dark:bg-amber-900/40 transition-all group-hover:bg-amber-400 dark:group-hover:bg-amber-600"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      Rs. {point.value.toFixed(0)}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 text-center leading-tight">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-amber-500" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topItems?.map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">{item.quantity} sold</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Rs. {item.revenue.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-amber-500" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentSummary?.byMethod &&
              Object.entries(paymentSummary.byMethod).map(([method, amount]: [string, any]) => {
                const total = paymentSummary?.totalAmount || 1;
                const percent = (amount / total) * 100;
                const colors: Record<string, string> = {
                  cash: "bg-emerald-500",
                  upi: "bg-blue-500",
                  credit_card: "bg-purple-500",
                  debit_card: "bg-cyan-500",
                  wallet: "bg-pink-500",
                };
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                        {method.replace("_", " ")}
                      </span>
                      <span className="text-sm text-slate-500">
                        Rs. {amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[method] || "bg-slate-400"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
