import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { Receipt, Plus, Clock, CheckCircle2, XCircle, Trash2, TrendingDown } from "lucide-react";

const categories = ["Rent", "Utilities", "Salaries", "Ingredients", "Equipment", "Marketing", "Maintenance", "Licenses", "Miscellaneous"];

export default function Expenses() {
  const { success } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: "Rent", description: "", amount: "", paymentMethod: "cash" as const, expenseDate: new Date().toISOString().split("T")[0] });
  const utils = trpc.useUtils();
  const { data: expenseList, isLoading } = trpc.expense.list.useQuery();
  const createExpense = trpc.expense.create.useMutation({ onSuccess: () => { utils.expense.list.invalidate(); setShowAdd(false); success("Expense recorded"); } });
  const updateStatus = trpc.expense.updateStatus.useMutation({ onSuccess: () => { utils.expense.list.invalidate(); success("Status updated"); } });
  const deleteExpense = trpc.expense.delete.useMutation({ onSuccess: () => { utils.expense.list.invalidate(); success("Deleted"); } });
  const filtered = (expenseList || []).filter((e: any) => statusFilter === "all" || e.status === statusFilter);
  const totalApproved = (expenseList || []).filter((e: any) => e.status === "approved").reduce((s: number, e: any) => s + parseFloat(e.amount || "0"), 0);
  const totalPending = (expenseList || []).filter((e: any) => e.status === "pending").reduce((s: number, e: any) => s + parseFloat(e.amount || "0"), 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Receipt className="w-6 h-6 text-amber-500" /> Expense Management</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track and manage expenses</p></div><Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Add Expense</Button></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ title: "Total Expenses", value: expenseList?.length || 0, icon: Receipt, color: "bg-blue-50 text-blue-700", sub: `${filtered.length} shown` }, { title: "Approved", value: `Rs. ${totalApproved.toLocaleString("en-IN")}`, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700", sub: (expenseList || []).filter((e: any) => e.status === "approved").length + " items" }, { title: "Pending", value: `Rs. ${totalPending.toLocaleString("en-IN")}`, icon: Clock, color: "bg-amber-50 text-amber-700", sub: (expenseList || []).filter((e: any) => e.status === "pending").length + " items" }, { title: "Avg/Expense", value: `Rs. ${expenseList?.length ? (totalApproved / expenseList.length).toFixed(0) : "0"}`, icon: TrendingDown, color: "bg-red-50 text-red-700" }].map((stat, i) => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><div className={`p-2 rounded-lg w-fit ${stat.color} mb-3`}><stat.icon className="w-4 h-4" /></div><div className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</div><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.title}{stat.sub && <span className="ml-1 text-slate-400">({stat.sub})</span>}</p></CardContent></Card>)}
      </div>
      <div className="flex gap-2">{["all", "pending", "approved", "rejected"].map((s) => <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? "bg-amber-500 hover:bg-amber-600" : ""}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</Button>)}</div>
      {isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-3">
          {filtered.map((expense: any) => {
            const statusIcons = { pending: Clock, approved: CheckCircle2, rejected: XCircle };
            const statusColors = { pending: "text-amber-500", approved: "text-emerald-500", rejected: "text-red-500" };
            const StatusIcon = statusIcons[expense.status as keyof typeof statusIcons] || Clock;
            return <Card key={expense.id} className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center"><Receipt className="w-5 h-5 text-red-500" /></div><div><h4 className="font-semibold text-slate-900 dark:text-white text-sm">{expense.category}</h4><p className="text-xs text-slate-500">{expense.description || "No description"}</p><div className="flex items-center gap-2 mt-1"><StatusIcon className={`w-3.5 h-3.5 ${statusColors[expense.status as keyof typeof statusColors]}`} /><span className="text-xs text-slate-500">{expense.status}</span></div></div></div><div className="text-right"><p className="text-lg font-bold text-slate-900 dark:text-white">Rs. {parseFloat(expense.amount || "0").toFixed(2)}</p><p className="text-xs text-slate-500">{expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString("en-IN") : ""}</p><div className="flex gap-1 mt-2 justify-end">{expense.status === "pending" && <><Button variant="ghost" size="sm" className="h-6 text-[10px] text-emerald-600" onClick={() => updateStatus.mutate({ id: expense.id, status: "approved" })}><CheckCircle2 className="w-3 h-3 mr-0.5" /> Approve</Button><Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-600" onClick={() => updateStatus.mutate({ id: expense.id, status: "rejected" })}><XCircle className="w-3 h-3 mr-0.5" /> Reject</Button></>}<Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => { if (confirm("Delete?")) deleteExpense.mutate({ id: expense.id }); }}><Trash2 className="w-3 h-3" /></Button></div></div></div></CardContent></Card>;
          })}
        </div>
      )}
      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader><div className="space-y-4 pt-4"><div><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><Label>Amount (Rs.)</Label><Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} type="number" /></div><div><Label>Date</Label><Input value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} type="date" /></div></div><div><Label>Payment Method</Label><Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["cash", "upi", "card", "bank_transfer"].map((m) => <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>)}</SelectContent></Select></div><Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => form.amount && createExpense.mutate({ category: form.category, description: form.description || undefined, amount: form.amount, paymentMethod: form.paymentMethod, expenseDate: form.expenseDate })} disabled={!form.amount}>Record Expense</Button></div></DialogContent></Dialog>
    </div>
  );
}
