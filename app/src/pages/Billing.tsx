import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { Receipt, Search, CreditCard, Banknote, Smartphone, CheckCircle2, Clock, UtensilsCrossed, MessageCircle, FileText, Printer, Package, Car } from "lucide-react";

const paymentStatusColors: Record<string, { bg: string; border: string }> = {
  pending: { bg: "bg-amber-50 text-amber-700 dark:bg-amber-900/80 dark:text-amber-400", border: "border-amber-300" },
  partial: { bg: "bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400", border: "border-blue-300" },
  paid: { bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-400", border: "border-emerald-700" },
};

const orderTypeColors: Record<string, { bg: string; border: string; icon: typeof UtensilsCrossed }> = {
  dine_in: { bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", border: "border-purple-300", icon: UtensilsCrossed },
  takeaway: { bg: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", border: "border-orange-300", icon: Package },
  delivery: { bg: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300", border: "border-cyan-300", icon: Car },
};

export default function Billing() {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<"pending" | "paid">("pending");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.order.list.useQuery();
  const { data: payments } = trpc.payment.list.useQuery();
  const createPayment = trpc.payment.create.useMutation({
    onSuccess: () => { utils.payment.list.invalidate(); utils.order.list.invalidate(); success("Payment processed"); },
  });
  const allBills = (orders || []).map((o: any) => {
    const payment = (payments || []).find((p: any) => p.orderId === o.id);
    return { id: o.id, orderId: o.id, orderNumber: o.orderNumber, amount: Number(o.totalAmount || 0), tableNumber: o.tableId, orderType: o.orderType, customerName: o.customerName, status: o.paymentStatus || "pending", items: o.items || [], method: payment?.method || null };
  });
  const pendingBills = allBills.filter((b) => b.status === "pending" || b.status === "partial");
  const paidBills = allBills.filter((b) => b.status === "paid");
  const filteredPending = pendingBills.filter((b) => !search || b.orderNumber?.toLowerCase().includes(search.toLowerCase()) || b.tableNumber?.toString().includes(search) || b.customerName?.toLowerCase().includes(search.toLowerCase()));
  const filteredPaid = paidBills.filter((b) => !search || b.orderNumber?.toLowerCase().includes(search.toLowerCase()) || b.tableNumber?.toString().includes(search));

  const handleCollect = (bill: any) => {
    createPayment.mutate({ orderId: bill.orderId, amount: bill.amount, method: paymentMethod as any });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Receipt className="w-6 h-6 text-amber-500" /> Billing &amp; Payments</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Process payments and manage bills</p></div>
      </div>
      <div className="flex gap-2">
        <Button variant={activeTab === "pending" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("pending")} className={activeTab === "pending" ? "bg-amber-500 hover:bg-amber-600" : ""}><Clock className="w-4 h-4 mr-1" /> Pending ({filteredPending.length})</Button>
        <Button variant={activeTab === "paid" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("paid")} className={activeTab === "paid" ? "bg-emerald-500 hover:bg-emerald-600" : ""}><CheckCircle2 className="w-4 h-4 mr-1" /> Paid ({filteredPaid.length})</Button>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search by order #, table #, customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div> : activeTab === "pending" ? filteredPending.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Receipt className="w-16 h-16 mb-4 opacity-30" /><p className="text-lg font-medium">No pending bills</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPending.map((bill) => {
            const colors = paymentStatusColors[bill.status] || paymentStatusColors.pending;
            const typeConfig = orderTypeColors[bill.orderType] || orderTypeColors.dine_in;
            return <Card key={bill.id} className={`border shadow-sm ${typeConfig.bg} ${typeConfig.border}`}><CardContent className="p-4">
              {bill.tableNumber && <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-2"><typeConfig.icon className="w-4 h-4 text-amber-500" /><span className="text-lg font-bold text-slate-900 dark:text-white">Table {bill.tableNumber}</span></div>}
              <div className="flex items-center justify-between mb-2"><span className="text-xs font-mono text-slate-500">#{bill.orderNumber}</span><div className="flex gap-2"><Badge className={`text-[10px] h-5 ${typeConfig.bg} ${typeConfig.border}`}><typeConfig.icon className="w-3 h-3 mr-0.5" />{bill.orderType}</Badge><Badge className={`text-[10px] h-5 ${colors.bg} ${colors.border}`}>{bill.status}</Badge></div></div>
              {bill.customerName && <p className="text-sm text-slate-600 dark:text-slate-400">{bill.customerName}</p>}
              <div className="mt-2 space-y-1">{(bill.items || []).slice(0, 4).map((item: any, i: number) => <div key={i} className="flex justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">{item.quantity}x {item.name}</span><span className="text-slate-500">Rs. {Number(item.totalPrice || 0).toFixed(0)}</span></div>)}{(bill.items || []).length > 4 && <p className="text-xs text-slate-400">+{(bill.items || []).length - 4} more items</p>}</div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-500">Total Amount</span><span className="text-xl font-bold text-slate-900 dark:text-white">Rs. {bill.amount.toFixed(2)}</span></div>
                <div className="flex gap-1 mb-2">{[{ key: "cash", label: "Cash", icon: Banknote }, { key: "upi", label: "UPI", icon: Smartphone }, { key: "card", label: "Card", icon: CreditCard }].map((m) => <Button key={m.key} variant={paymentMethod === m.key ? "default" : "outline"} size="sm" className={`flex-1 h-8 text-xs ${paymentMethod === m.key ? "bg-emerald-500 hover:bg-emerald-600" : ""}`} onClick={() => setPaymentMethod(m.key)}><m.icon className="w-3.5 h-3.5 mr-1" />{m.label}</Button>)}</div>
                <div className="flex gap-2"><Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={() => handleCollect(bill)}><CheckCircle2 className="w-4 h-4 mr-1" /> Collect Payment</Button><Button variant="outline" size="sm" className="h-9 w-9 p-0" title="Send via WhatsApp"><MessageCircle className="w-4 h-4 text-green-600" /></Button></div>
              </div>
            </CardContent></Card>;
          })}
        </div>
      ) : filteredPaid.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-slate-400"><CheckCircle2 className="w-16 h-16 mb-4 opacity-30" /><p className="text-lg font-medium">No paid bills yet</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPaid.map((bill) => {
            const colors = paymentStatusColors[bill.status] || paymentStatusColors.pending;
            const typeConfig = orderTypeColors[bill.orderType] || orderTypeColors.dine_in; 
            return <Card key={bill.id} className={`border shadow-sm ${typeConfig.bg} ${colors.border}`}><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><span className="text-xs font-mono text-slate-500">#{bill.orderNumber}</span></div><div className="flex gap-2"><Badge className={`text-[10px] h-5 ${typeConfig.bg} ${typeConfig.border}`}><typeConfig.icon className="w-3 h-3 mr-0.5" />{bill.orderType}</Badge><Badge className={`text-[10px] h-5 text-emerald-800 ${colors.bg} ${colors.border}`}>Paid</Badge></div></div>
            {bill.tableNumber && <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-2"><typeConfig.icon className="w-4 h-4 text-emerald-500" /><span className="text-lg font-bold text-slate-900 dark:text-white">Table {bill.tableNumber}</span></div>}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700"><div><p className="text-xl font-bold text-slate-900 dark:text-white">Rs. {bill.amount.toFixed(2)}</p><p className="text-xs text-slate-500">via {bill.method || "cash"}</p></div><div className="flex gap-1"><Button variant="outline" size="sm" className="h-8 text-xs" disabled><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid</Button><Button variant="outline" size="sm" className="h-8 w-8 p-0"><Printer className="w-3.5 h-3.5" /></Button><Button variant="outline" size="sm" className="h-8 w-8 p=0"><FileText className="w-3.5 h=3.5" /></Button></div></div>
          </CardContent></Card>;})}
        </div>
      )}
    </div>
  );
}
