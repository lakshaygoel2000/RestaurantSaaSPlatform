import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { Users, Plus, Phone, Mail, IndianRupee, Calendar, Shield, Search, Pencil, MapPin, CheckCircle2, XCircle, PauseCircle, UserCircle } from "lucide-react";

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", cashier: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", chef: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", waiter: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", delivery_staff: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400", accountant: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
const roleLabels: Record<string, string> = { owner: "Owner", manager: "Manager", cashier: "Cashier", chef: "Chef", waiter: "Waiter", delivery_staff: "Delivery", accountant: "Accountant", admin: "Admin" };
const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  active: { label: "Active", icon: CheckCircle2, color: "text-emerald-500" }, inactive: { label: "Inactive", icon: XCircle, color: "text-red-500" }, on_leave: { label: "On Leave", icon: PauseCircle, color: "text-amber-500" },
};

export default function Staff() {
  const { success } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "waiter", salary: "", address: "" });
  const utils = trpc.useUtils();
  const { data: staffList, isLoading } = trpc.restaurant.getStaff.useQuery({ role: roleFilter === "all" ? undefined : roleFilter });
  const createStaff = trpc.restaurant.createStaff.useMutation({
    onSuccess: (data) => { utils.restaurant.getStaff.invalidate(); setShowAdd(false); setForm({ name: "", email: "", phone: "", role: "waiter", salary: "", address: "" }); success(`${data.name} added. Login: ${data.username}`); },
  });
  const updateStaff = trpc.restaurant.updateStaff.useMutation({ onSuccess: () => { utils.restaurant.getStaff.invalidate(); setEditMember(null); success("Staff updated"); } });
  const deleteStaff = trpc.restaurant.deleteStaff.useMutation({ onSuccess: () => { utils.restaurant.getStaff.invalidate(); success("Staff deactivated"); } });
  const toggleStatus = (member: any, newStatus: string) => { updateStaff.mutate({ id: member.id, status: newStatus as any }); };
  const filtered = staffList?.filter((s: any) => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search) || s.username?.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-6 h-6 text-amber-500" /> Staff Management</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage employees, roles, and login credentials</p></div>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => { setForm({ name: "", email: "", phone: "", role: "waiter", salary: "", address: "" }); setShowAdd(true); }}><Plus className="w-4 h-4 mr-1" /> Add Staff</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {["active", "on_leave", "inactive"].map((s) => { const count = staffList?.filter((m: any) => m.status === s).length || 0; const cfg = statusConfig[s]; const Icon = cfg.icon; return <div key={s} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${s === "active" ? "bg-emerald-50 dark:bg-emerald-900/20" : s === "on_leave" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-red-50 dark:bg-red-900/20"}`}><Icon className={`w-4 h-4 ${cfg.color}`} /><span className={`text-sm font-medium ${s === "active" ? "text-emerald-700 dark:text-emerald-400" : s === "on_leave" ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}`}>{count} {cfg.label}</span></div>; })}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"><Shield className="w-4 h-4 text-slate-500" /><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{staffList?.length || 0} Total</span></div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search by name, phone, username..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><div className="flex gap-1 overflow-x-auto">{["all", ...Object.keys(roleLabels)].map((r) => <Button key={r} variant={roleFilter === r ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(r)} className={roleFilter === r ? "bg-amber-500 hover:bg-amber-600" : ""}>{r === "all" ? "All" : roleLabels[r]}</Button>)}</div></div>
      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered?.map((member: any) => {
            const cfg = statusConfig[member.status] || statusConfig.active; const StatusIcon = cfg.icon;
            return <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow"><CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-lg">{member.name?.[0]?.toUpperCase() || "?"}</div><div><h4 className="font-semibold text-slate-900 dark:text-white">{member.name}</h4><Badge className={`text-[10px] h-5 mt-0.5 ${roleColors[member.role] || ""}`}>{roleLabels[member.role] || member.role}</Badge></div></div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditMember(member); setForm({ name: member.name || "", email: member.email || "", phone: member.phone || "", role: member.role || "waiter", salary: member.salary || "", address: member.address || "" }); }}><Pencil className="w-3.5 h-3.5 text-slate-400" /></Button>
              </div>
              {member.username && <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"><div className="flex items-center gap-2 text-slate-600"><UserCircle className="w-3.5 h-3.5" /><span className="font-mono">{member.username}</span></div></div>}
              <div className="mt-3 space-y-1 text-sm text-slate-500">
                {member.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{member.phone}</span></div>}
                {member.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span className="truncate">{member.email}</span></div>}
                {member.salary && <div className="flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5" /><span>Rs. {member.salary}/month</span></div>}
                {member.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{member.address}</span></div>}
                {member.joiningDate && <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>Joined {new Date(member.joiningDate).toLocaleDateString("en-IN")}</span></div>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5"><StatusIcon className={`w-4 h-4 ${cfg.color}`} /><span className="text-xs font-medium text-slate-600 dark:text-slate-400">{cfg.label}</span></div>
                <div className="flex gap-1">{member.status !== "active" && <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-emerald-600" onClick={() => toggleStatus(member, "active")}><CheckCircle2 className="w-3 h-3 mr-0.5" /> Activate</Button>}{member.status !== "on_leave" && <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-amber-600" onClick={() => toggleStatus(member, "on_leave")}><PauseCircle className="w-3 h-3 mr-0.5" /> Leave</Button>}{member.status !== "inactive" && <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-red-600" onClick={() => { if (confirm("Deactivate?")) deleteStaff.mutate({ id: member.id }); }}><XCircle className="w-3 h-3 mr-0.5" /> Deactivate</Button>}</div>
              </div>
            </CardContent></Card>;
          })}
        </div>
      )}
      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add New Staff</DialogTitle></DialogHeader><div className="space-y-4 pt-4"><div className="grid grid-cols-2 gap-3"><div><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>Role</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(roleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div><div><Label>Monthly Salary *</Label><Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} type="number" /></div></div><div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></div><div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div><p className="text-xs text-slate-500">Auto-generated: name@restaurantname</p><Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => form.name && form.phone && form.salary && createStaff.mutate({ name: form.name, email: form.email || undefined, phone: form.phone, role: form.role as any, salary: form.salary, address: form.address || undefined })} disabled={!form.name || !form.phone || !form.salary}>Add Staff Member</Button></div></DialogContent></Dialog>
      <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit Staff - {editMember?.name}</DialogTitle></DialogHeader><div className="space-y-4 pt-4"><div className="grid grid-cols-2 gap-3"><div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>Role</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(roleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div><div><Label>Salary</Label><Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} type="number" /></div></div><div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></div><div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div><Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => editMember && updateStaff.mutate({ id: editMember.id, name: form.name || undefined, email: form.email || undefined, phone: form.phone || undefined, role: form.role as any, salary: form.salary || undefined, address: form.address || undefined })}>Update Staff</Button></div></DialogContent></Dialog>
    </div>
  );
}
