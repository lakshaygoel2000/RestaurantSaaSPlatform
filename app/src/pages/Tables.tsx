import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { Grid3X3, Plus, Search, Users, UtensilsCrossed, Sparkles, CheckCircle2, Clock, Trash2, Pencil } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  available: { label: "Available", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800", icon: CheckCircle2 },
  occupied: { label: "Occupied", color: "text-red-600", bg: "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800", icon: UtensilsCrossed },
  reserved: { label: "Reserved", color: "text-purple-600", bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800", icon: Clock },
  cleaning: { label: "Cleaning", color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800", icon: Sparkles },
  merged: { label: "Merged", color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800", icon: Grid3X3 },
};

export default function Tables() {
  const { success } = useToast();
  const [search, setSearch] = useState("");
  const [seatFilter, setSeatFilter] = useState<number | undefined>();
  const [selectedSection, setSelectedSection] = useState<string | undefined>();
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ name: "", section: "Main Hall", capacity: 4, floorNumber: 1 });

  const utils = trpc.useUtils();
  const { data: tablesList, isLoading } = trpc.table.list.useQuery({ section: selectedSection });
  const { data: sections } = trpc.table.getSections.useQuery();

  const createTable = trpc.table.create.useMutation({
    onSuccess: () => { utils.table.list.invalidate(); utils.table.getSections.invalidate(); setShowAdd(false); success("Table added"); },
  });
  const updateTable = trpc.table.update.useMutation({
    onSuccess: () => { utils.table.list.invalidate(); setShowEdit(false); setSelectedTable(null); success("Table updated"); },
  });
  const updateStatus = trpc.table.updateStatus.useMutation({
    onSuccess: () => { utils.table.list.invalidate(); setSelectedTable(null); success("Status updated"); },
  });
  const deleteTable = trpc.table.delete.useMutation({
    onSuccess: () => { utils.table.list.invalidate(); setShowEdit(false); success("Table deleted"); },
  });

  const filteredTables = useMemo(() => {
    let list = (tablesList || []).filter((t: any) => {
      if (search && !t.name?.toLowerCase().includes(search.toLowerCase()) && !t.section?.toLowerCase().includes(search.toLowerCase())) return false;
      if (seatFilter && (t.capacity || 0) < seatFilter) return false;
      return true;
    });
    if (seatFilter) list = list.sort((a: any, b: any) => (a.capacity || 0) - (b.capacity || 0));
    return list;
  }, [tablesList, search, seatFilter]);

  const floors = useMemo(() => {
    const map = new Map<number, Map<string, any[]>>();
    filteredTables.forEach((t: any) => {
      const floor = t.floorNumber || 1;
      const section = t.section || "Main Hall";
      if (!map.has(floor)) map.set(floor, new Map());
      if (!map.get(floor)!.has(section)) map.get(floor)!.set(section, []);
      map.get(floor)!.get(section)!.push(t);
    });
    return map;
  }, [filteredTables]);

  const totalTables = tablesList?.length || 0;
  const occupiedCount = tablesList?.filter((t: any) => t.status === "occupied").length || 0;
  const availableCount = tablesList?.filter((t: any) => t.status === "available").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Grid3X3 className="w-6 h-6 text-amber-500" /> Table Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage floors, sections, and table status</p>
        </div>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => { setForm({ name: "", section: "Main Hall", capacity: 4, floorNumber: 1 }); setShowAdd(true); }}><Plus className="w-4 h-4 mr-1" /> Add Table</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{availableCount} Available</span></div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20"><UtensilsCrossed className="w-4 h-4 text-red-600" /><span className="text-sm font-medium text-red-700 dark:text-red-400">{occupiedCount} Occupied</span></div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"><Grid3X3 className="w-4 h-4 text-slate-500" /><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{totalTables} Total</span></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search tables..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <div className="flex gap-2 items-center"><span className="text-xs text-slate-500">Seats:</span>{[2, 4, 6, 8].map((n) => <Button key={n} variant={seatFilter === n ? "default" : "outline"} size="sm" className={`h-8 w-8 p-0 text-xs ${seatFilter === n ? "bg-amber-500 hover:bg-amber-600" : ""}`} onClick={() => setSeatFilter(seatFilter === n ? undefined : n)}>{n}+</Button>)}{seatFilter && <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400" onClick={() => setSeatFilter(undefined)}>Clear</Button>}</div>
      </div>

      {sections && sections.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <Button variant={selectedSection === undefined ? "default" : "outline"} size="sm" onClick={() => setSelectedSection(undefined)} className={selectedSection === undefined ? "bg-amber-500 hover:bg-amber-600" : ""}>All Sections</Button>
          {sections.filter((s): s is string => !!s).map((s) => <Button key={s} variant={selectedSection === s ? "default" : "outline"} size="sm" onClick={() => setSelectedSection(s)} className={selectedSection === s ? "bg-amber-500 hover:bg-amber-600" : ""}>{s}</Button>)}
        </div>
      )}

      {isLoading ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div> : filteredTables.length === 0 ? <div className="text-sm text-slate-400 text-center py-16">No tables found</div> : (
        <div className="space-y-8">
          {Array.from(floors.entries()).sort(([a], [b]) => a - b).map(([floorNum, sectionsMap]) => (
            <div key={floorNum}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-sm">{floorNum}</div>Floor {floorNum}</h3>
              {Array.from(sectionsMap.entries()).map(([sectionName, sectionTables]) => (
                <div key={sectionName} className="mb-6">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">{sectionName}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {sectionTables.map((table: any) => {
                      const cfg = statusConfig[table.status] || statusConfig.available;
                      const StatusIcon = cfg.icon;
                      return (
                        <button key={table.id} onClick={() => setSelectedTable(table)} className={`p-4 rounded-xl border-2 ${cfg.bg} hover:shadow-md transition-all text-left relative`}>
                          <div className="flex items-center justify-between mb-2"><span className="text-lg font-bold text-slate-900 dark:text-white">{table.name}</span><StatusIcon className={`w-4 h-4 ${cfg.color}`} /></div>
                          <div className="flex items-center gap-1 text-xs text-slate-500"><Users className="w-3 h-3" /> {table.capacity} seats</div>
                          <Badge className={`mt-2 text-[10px] h-5 ${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {selectedTable && <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle className="flex items-center gap-2"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(statusConfig[selectedTable.status] || statusConfig.available).bg}`}><Grid3X3 className={`w-5 h-5 ${(statusConfig[selectedTable.status] || statusConfig.available).color}`} /></div>Table {selectedTable.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3 text-sm"><div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Section</span><p className="font-medium text-slate-900 dark:text-white">{selectedTable.section}</p></div><div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Capacity</span><p className="font-medium text-slate-900 dark:text-white">{selectedTable.capacity} seats</p></div></div>
          <div className="grid grid-cols-2 gap-2">{[{ key: "available", label: "Available", color: "bg-emerald-500 hover:bg-emerald-600", icon: CheckCircle2 }, { key: "occupied", label: "Occupied", color: "bg-red-500 hover:bg-red-600", icon: UtensilsCrossed }, { key: "reserved", label: "Reserve", color: "bg-purple-500 hover:bg-purple-600", icon: Clock }, { key: "cleaning", label: "Cleaning", color: "bg-amber-500 hover:bg-amber-600", icon: Sparkles }].map((a) => <Button key={a.key} size="sm" className={`${a.color} text-white ${selectedTable.status === a.key ? "ring-2 ring-offset-2 ring-slate-400" : ""}`} onClick={() => updateStatus.mutate({ id: selectedTable.id, status: a.key as any })} disabled={selectedTable.status === a.key}><a.icon className="w-3.5 h-3.5 mr-1" />{a.label}</Button>)}</div>
          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700"><Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowEdit(true); setSelectedTable(null); }}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button><Button variant="outline" size="sm" className="text-red-500" onClick={() => { if (confirm("Delete this table?")) deleteTable.mutate({ id: selectedTable.id }); }}><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</Button></div>
        </div></DialogContent></Dialog>}

      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add New Table</DialogTitle></DialogHeader><div className="space-y-4 pt-4"><div className="grid grid-cols-2 gap-3"><div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="T-25" /></div><div><Label>Capacity</Label><Input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 4 })} type="number" min={1} /></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Section</Label><Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></div><div><Label>Floor</Label><Input value={form.floorNumber} onChange={(e) => setForm({ ...form, floorNumber: parseInt(e.target.value) || 1 })} type="number" /></div></div><Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => form.name && createTable.mutate({ name: form.name, section: form.section, capacity: form.capacity, floorNumber: form.floorNumber })} disabled={!form.name}>Add Table</Button></div></DialogContent></Dialog>
      <Dialog open={showEdit} onOpenChange={setShowEdit}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit Table</DialogTitle></DialogHeader><div className="space-y-4 pt-4"><div className="grid grid-cols-2 gap-3"><div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>Capacity</Label><Input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 4 })} type="number" /></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Section</Label><Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></div><div><Label>Floor</Label><Input value={form.floorNumber} onChange={(e) => setForm({ ...form, floorNumber: parseInt(e.target.value) || 1 })} type="number" /></div></div><Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => selectedTable && updateTable.mutate({ id: selectedTable.id, name: form.name, section: form.section, capacity: form.capacity, floorNumber: form.floorNumber })}>Save Changes</Button></div></DialogContent></Dialog>
    </div>
  );
}
