import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShoppingCart, Users, UtensilsCrossed, Receipt, Settings, Package } from "lucide-react";

const entityIcons: Record<string, typeof ShoppingCart> = { order: ShoppingCart, menu: UtensilsCrossed, table: UtensilsCrossed, payment: Receipt, customer: Users, staff: Users, inventory: Package, setting: Settings };
const actionColors: Record<string, string> = { created: "bg-emerald-100 text-emerald-700", updated: "bg-blue-100 text-blue-700", deleted: "bg-red-100 text-red-700", approved: "bg-purple-100 text-purple-700", rejected: "bg-orange-100 text-orange-700", viewed: "bg-slate-100 text-slate-700", printed: "bg-cyan-100 text-cyan-700" };

export default function ActivityLogs() {
  const [entityFilter, setEntityFilter] = useState("all");
  const { data: logs, isLoading } = trpc.activity.list.useQuery();
  const filtered = (logs || []).filter((l: any) => entityFilter === "all" || l.entityType === entityFilter);
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Activity className="w-6 h-6 text-amber-500" /> Activity Logs</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Audit trail of all actions</p></div>
      <div className="flex gap-2 flex-wrap">{["all", "order", "menu", "table", "payment", "customer", "staff", "inventory"].map((e) => <button key={e} onClick={() => setEntityFilter(e)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${entityFilter === e ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"}`}>{e === "all" ? "All" : e.charAt(0).toUpperCase() + e.slice(1)}</button>)}</div>
      {isLoading ? <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div> : (
        <Card className="border-0 shadow-sm"><CardContent className="p-0">
          <div className="relative pl-8 py-4">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
            {filtered.map((log: any, index: number) => {
              const Icon = entityIcons[log.entityType] || Activity;
              const actionColor = actionColors[log.action] || "bg-slate-100 text-slate-700";
              return <div key={log.id || index} className="relative flex items-start gap-4 py-3 pr-4"><div className="absolute left-[-22px] w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-500" /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><Badge className={`text-[10px] h-5 ${actionColor}`}>{log.action}</Badge><span className="text-xs text-slate-500">{log.entityType} #{log.entityId}</span></div><p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{log.userName || "System"} {log.action} {log.entityType}</p>{log.details && <p className="text-xs text-slate-400 mt-0.5 font-mono">{typeof log.details === "string" ? log.details : JSON.stringify(log.details)}</p>}<p className="text-[10px] text-slate-400 mt-1">{log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : ""}</p></div></div>;
            })}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
