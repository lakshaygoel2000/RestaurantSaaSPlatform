import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users, Phone, Mail, IndianRupee, Crown, Heart,
  Plus, Search, Pencil, Trash2, Calendar, TrendingUp, Gift,
} from "lucide-react";

const tagColors: Record<string, string> = {
  VIP: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Regular: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  New: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function getCustomerTags(customer: any): string[] {
  if (!customer.tags) return [];
  if (Array.isArray(customer.tags)) return customer.tags;
  try {
    const parsed = JSON.parse(customer.tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", dob: "", tags: "" });

  const utils = trpc.useUtils();
  const { data: customerList, isLoading } = trpc.customer.list.useQuery({ search: search || undefined });
  const createCustomer = trpc.customer.create.useMutation({ onSuccess: () => { utils.customer.list.invalidate(); setShowAdd(false); setForm({ name: "", phone: "", email: "", dob: "", tags: "" }); } });
  const updateCustomer = trpc.customer.update.useMutation({ onSuccess: () => { utils.customer.list.invalidate(); setEditCustomer(null); } });
  const deleteCustomer = trpc.customer.delete.useMutation({ onSuccess: () => utils.customer.list.invalidate() });

  const filtered = customerList || [];

  const stats = [
    { title: "Total Customers", value: filtered.length || 0, icon: Users, color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20" },
    { title: "Avg Spend", value: filtered.length ? `Rs. ${(filtered.reduce((s: number, c: any) => s + parseFloat(c.totalSpent || "0"), 0) / filtered.length).toFixed(0)}` : "Rs. 0", icon: IndianRupee, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20" },
    { title: "Total Revenue", value: `Rs. ${(filtered).reduce((s: number, c: any) => s + parseFloat(c.totalSpent || "0"), 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "bg-purple-50 text-purple-700 dark:bg-purple-900/20" },
    { title: "Loyalty Points", value: (filtered).reduce((s: number, c: any) => s + (c.loyaltyPoints || 0), 0).toLocaleString("en-IN"), icon: Gift, color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" /> Customer CRM
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage customers and loyalty</p>
        </div>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`p-2 rounded-lg w-fit ${stat.color} mb-3`}><stat.icon className="w-4 h-4" /></div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((customer: any) => {
            const tags = getCustomerTags(customer);
            return (
              <Card key={customer.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{customer.name}</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tags.map((tag: string, i: number) => (
                            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tagColors[tag] || "bg-slate-100 text-slate-600"}`}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditCustomer(customer); setForm({ name: customer.name || "", phone: customer.phone || "", email: customer.email || "", dob: customer.dob ? new Date(customer.dob).toISOString().split("T")[0] : "", tags: Array.isArray(customer.tags) ? customer.tags.join(", ") : (customer.tags || "") }); }}>
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => { if (confirm("Remove customer?")) deleteCustomer.mutate({ id: customer.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-500">
                    {customer.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{customer.phone}</span></div>}
                    {customer.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span className="truncate">{customer.email}</span></div>}
                    {customer.dob && <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>{new Date(customer.dob).toLocaleDateString("en-IN")}</span></div>}
                    <div className="flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5" /><span>Rs. {parseFloat(customer.totalSpent || "0").toFixed(2)}</span></div>
                    <div className="flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-amber-500" /><span>{customer.loyaltyPoints || 0} points ({customer.visitCount || 0} visits)</span></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></div>
            <div><Label>Date of Birth</Label><Input value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} type="date" /></div>
            <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="VIP, Regular" /></div>
            <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => form.name && createCustomer.mutate({ name: form.name, phone: form.phone || undefined, email: form.email || undefined, dob: form.dob || undefined, tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [] })} disabled={!form.name}>Add Customer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCustomer} onOpenChange={() => setEditCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></div>
            <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => editCustomer && updateCustomer.mutate({ id: editCustomer.id, name: form.name || undefined, phone: form.phone || undefined, email: form.email || undefined })}>Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
