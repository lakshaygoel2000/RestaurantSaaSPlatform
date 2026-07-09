import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { ChefHat, Clock, Flame, CheckCircle2, UtensilsCrossed, Car, Package } from "lucide-react";

const statusBg: Record<string, string> = {
  pending: "bg-amber-50 dark:bg-amber-900/10 border-l-4 border-l-amber-500",
  confirmed: "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500",
  preparing: "bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-500",
  ready: "bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500",
};

const orderTypeColors: Record<string, { bg: string; icon: typeof UtensilsCrossed }> = {
  dine_in: { bg: "bg-purple-100 text-purple-700", icon: UtensilsCrossed },
  takeaway: { bg: "bg-orange-100 text-orange-700", icon: Package },
  delivery: { bg: "bg-cyan-100 text-cyan-700", icon: Car },
};

export default function Kitchen() {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.order.list.useQuery();
  const updateOrderStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => { utils.order.list.invalidate(); success("Order updated"); },
  });

  const displayOrders = (orders || []).filter((o: any) => ["confirmed", "preparing", "ready", "pending"].includes(o.status));
  const pendingCount = displayOrders.filter((o: any) => o.status === "pending" || o.status === "confirmed").length;
  const preparingCount = displayOrders.filter((o: any) => o.status === "preparing").length;
  const readyCount = displayOrders.filter((o: any) => o.status === "ready").length;
  const tabs = [{ key: "all", label: "All", count: displayOrders.length }, { key: "confirmed", label: "New", count: pendingCount }, { key: "preparing", label: "Cooking", count: preparingCount }, { key: "ready", label: "Ready", count: readyCount }];

  const filteredOrders = activeTab === "all" ? displayOrders : activeTab === "confirmed" ? displayOrders.filter((o: any) => o.status === "pending" || o.status === "confirmed") : displayOrders.filter((o: any) => o.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><ChefHat className="w-6 h-6 text-amber-500" /> Kitchen Display</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage order preparation flow</p></div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => <Button key={tab.key} variant={activeTab === tab.key ? "default" : "outline"} size="sm" onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? "bg-amber-500 hover:bg-amber-600" : ""}>{tab.label}{tab.count > 0 && <span className="ml-1.5 text-xs bg-white/20 px-1.5 rounded-full">{tab.count}</span>}</Button>)}
      </div>
      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div> : filteredOrders.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-slate-400"><ChefHat className="w-16 h-16 mb-4 opacity-30" /><p className="text-lg font-medium">No orders in queue</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order: any) => {
            const typeConfig = orderTypeColors[order.orderType] || orderTypeColors.dine_in;
            const TypeIcon = typeConfig.icon;
            const items = order.items || [];
            const canStart = order.status === "pending" || order.status === "confirmed";
            const canReady = order.status === "preparing";
            const canServed = order.status === "ready";
            return (
              <Card key={order.id} className={`border-0 shadow-sm ${statusBg[order.status] || statusBg.confirmed}`}><CardContent className="p-4">
                <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Badge className={`text-[10px] h-5 ${typeConfig.bg}`}><TypeIcon className="w-3 h-3 mr-0.5" />{order.orderType?.replace("_", "-")}</Badge><span className="text-xs font-mono text-slate-500">#{order.orderNumber}</span></div><div className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" />{order.createdAt ? new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</div></div>
                {order.tableId && <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"><UtensilsCrossed className="w-3.5 h-3.5" /> Table {order.tableId}</div>}
                <div className="flex items-center gap-2 mb-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-200">{order.customerName || "Guest"}</span>
                </div>
                <div className="space-y-1.5 mb-4">{items.map((item: any, i: number) => <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-200/50 dark:border-slate-700/30 last:border-0"><div className="flex items-center gap-2"><span className="font-medium text-slate-800 dark:text-slate-200">{item.quantity}x</span><span className="text-slate-700 dark:text-slate-300">{item.name}</span></div>{item.specialInstructions && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 rounded">{item.specialInstructions}</span>}</div>)}</div>
                <Badge variant="outline" className={order.status === "confirmed" ? "border-blue-300 text-blue-700 bg-blue-50" : order.status === "preparing" ? "border-indigo-300 text-indigo-700 bg-indigo-50" : order.status === "ready" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-amber-300 text-amber-700 bg-amber-50"}>{order.status}</Badge>
                <div className="flex gap-2 mt-3">{canStart && <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "preparing" })}><Flame className="w-4 h-4 mr-1" /> Start Cooking</Button>}{canReady && <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "ready" })}><CheckCircle2 className="w-4 h-4 mr-1" /> Mark Ready</Button>}{canServed && <Button size="sm" className="flex-1 bg-slate-500 hover:bg-slate-600 text-white" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "served" })}><UtensilsCrossed className="w-4 h-4 mr-1" /> Mark Served</Button>}</div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
