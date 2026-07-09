import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { UtensilsCrossed, Search, Pencil, Eye, EyeOff, Flame, Leaf, Trash2, RotateCcw } from "lucide-react";

export default function Menu() {
  const { success } = useToast();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<number | undefined>();
  const [showDisabled, setShowDisabled] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: categories } = trpc.menu.getCategories.useQuery();
  const { data: allItems, isLoading } = trpc.menu.getMenuItems.useQuery({ categoryId: catFilter });

  const updateItem = trpc.menu.updateMenuItem.useMutation({
    onSuccess: () => { utils.menu.getMenuItems.invalidate(); success("Menu updated"); },
  });

  const toggleStatus = (item: any) => {
    updateItem.mutate({ id: item.id, status: item.status === "active" ? "inactive" : "active" });
  };

  const activeItems = (allItems || []).filter((i: any) => i.status === "active" && (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.shortCode?.toLowerCase().includes(search.toLowerCase())));
  const inactiveItems = (allItems || []).filter((i: any) => i.status === "inactive" && (!search || i.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><UtensilsCrossed className="w-6 h-6 text-amber-500" /> Menu Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage categories and menu items</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search items by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant={showDisabled ? "default" : "outline"} size="sm" onClick={() => setShowDisabled(!showDisabled)} className={showDisabled ? "bg-slate-600 hover:bg-slate-700" : ""}>
          {showDisabled ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}{showDisabled ? "Hide Disabled" : "Show Disabled"}
        </Button>
      </div>

      {categories && categories.length > 0 && (
        <Tabs value={catFilter?.toString() || "all"} onValueChange={(v) => setCatFilter(v === "all" ? undefined : parseInt(v))}>
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-wrap h-auto">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">All</TabsTrigger>
            {categories.map((cat: any) => <TabsTrigger key={cat.id} value={cat.id.toString()} className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">{cat.name}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Active Items ({activeItems.length})</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : activeItems.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8">No active items</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeItems.map((item: any) => (
              <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-lg shrink-0">{item.name[0]?.toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${item.isVeg ? "border-green-500" : "border-red-500"}`}><div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} /></div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{item.name}</h4>
                          {item.isSpicy && <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.description || item.shortCode || "No description"}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Rs. {item.price}</span>
                          {item.isBestseller && <Badge className="text-[9px] h-4 bg-amber-100 text-amber-700">Bestseller</Badge>}
                          <Badge variant="outline" className={`text-[9px] h-4 ${item.availability === "available" ? "border-emerald-200 text-emerald-600" : "border-red-200 text-red-600"}`}>{item.availability}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditItem(item)}><Pencil className="w-3.5 h-3.5 text-slate-400" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => toggleStatus(item)} title="Remove from menu"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showDisabled && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400" /> Disabled Items ({inactiveItems.length})</h3>
          {inactiveItems.length === 0 ? <div className="text-sm text-slate-400 text-center py-4">No disabled items</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
              {inactiveItems.map((item: any) => (
                <Card key={item.id} className="border-0 shadow-sm bg-slate-50 dark:bg-slate-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-lg shrink-0">{item.name[0]?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-500 dark:text-slate-400 text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{item.description || "No description"}</p>
                          <span className="text-sm font-bold text-slate-400">Rs. {item.price}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-600" onClick={() => toggleStatus(item)} title="Add back to menu"><RotateCcw className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
            <EditMenuItemForm item={editItem} onSave={() => { setEditItem(null); utils.menu.getMenuItems.invalidate(); }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EditMenuItemForm({ item, onSave }: { item: any; onSave: () => void }) {
  const { success } = useToast();
  const [form, setForm] = useState({ name: item.name || "", description: item.description || "", price: item.price || "", shortCode: item.shortCode || "", isVeg: item.isVeg ?? true, isSpicy: item.isSpicy ?? false, isBestseller: item.isBestseller ?? false, availability: item.availability || "available" });
  const updateItem = trpc.menu.updateMenuItem.useMutation({ onSuccess: () => { onSave(); success("Item updated"); } });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Price (Rs.)</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" /></div>
      </div>
      <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3"><div><Label>Short Code</Label><Input value={form.shortCode} onChange={(e) => setForm({ ...form, shortCode: e.target.value })} /></div><div><Label>Availability</Label><select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="out_of_stock">Out of Stock</option></select></div></div>
      <div className="flex gap-2">
        <Button variant={form.isVeg ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, isVeg: true })} className={form.isVeg ? "bg-green-500 hover:bg-green-600" : ""}><Leaf className="w-3.5 h-3.5 mr-1" />Veg</Button>
        <Button variant={!form.isVeg ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, isVeg: false })} className={!form.isVeg ? "bg-red-500 hover:bg-red-600" : ""}><Flame className="w-3.5 h-3.5 mr-1" />Non-Veg</Button>
        <Button variant={form.isSpicy ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, isSpicy: !form.isSpicy })} className={form.isSpicy ? "bg-red-500 hover:bg-red-600" : ""}><Flame className="w-3.5 h-3.5 mr-1" />Spicy</Button>
        <Button variant={form.isBestseller ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, isBestseller: !form.isBestseller })} className={form.isBestseller ? "bg-amber-500 hover:bg-amber-600" : ""}>Bestseller</Button>
      </div>
      <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => updateItem.mutate({ id: item.id, ...form })}><Pencil className="w-4 h-4 mr-1" /> Save Changes</Button>
    </div>
  );
}
